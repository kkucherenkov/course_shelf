/**
 * WHY this file exists:
 * Orchestrates one quiz-generation walk, modelled on run-transcription.handler
 * down to the fire-and-forget shape:
 *   1. Resolve the model: named on the request, or AppConfig's configured
 *      default. Refuse before doing any work — unset entirely is 503
 *      (QuizGenerationNotConfiguredError); named but missing from disk is 404
 *      (QuizModelNotFoundError), checked live because the admin delete
 *      endpoint can remove a file between two requests.
 *   2. Resolve the lesson list: one lesson, or every lesson in a course.
 *      Locking key is always the course — a lesson-scoped run still guards
 *      against a concurrent course-scoped one for the same course.
 *   3. Refuse when a walk is already running for this course.
 *   4. Fire-and-forget the walk so the response flushes before llama-completion
 *      starts; release the lock when it finishes either way.
 *
 * Per lesson: read cues (never write — the transcript also backs player
 * subtitles, trigram search and `?t=` deep links) → skip if none → window →
 * per window, optional cleanup then generation → one Quiz per lesson that
 * produced at least one question. A lesson with no cues, or whose every
 * window failed to generate, produces no Quiz row at all — nothing to
 * propose. A window that fails (cleanup OR generation) costs its own
 * questions, never the lesson's.
 *
 * ponytail: no persisted run record — the maintainer confirmed the Quiz
 * proposal itself IS the run record (it already carries `modelFilename`).
 * A crash mid-walk silently leaves the remaining lessons ungenerated, with
 * nothing to say so; upgrade path is a Transcription-shaped run row if that
 * ever proves painful in a real course-scoped run.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';

import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { nanoid } from 'nanoid';

import {
  COURSE_REPOSITORY,
  CourseNotFoundError,
  LESSON_REPOSITORY,
  LessonNotFoundError,
  TRANSCRIPT_REPOSITORY,
} from '../../../../common/catalog-tokens';
import { AppConfig } from '../../../../common/config/app-config';
import { applyCleanup } from '../../domain/quiz/quiz-cleanup';
import { LLAMA_ADAPTER } from '../../domain/quiz/llama.port';
import { Quiz } from '../../domain/quiz/quiz';
import {
  QuizGenerationAlreadyRunningError,
  QuizGenerationNotConfiguredError,
  QuizModelNotFoundError,
} from '../../domain/quiz/quiz.errors';
import { QuizProposed } from '../../domain/quiz/quiz.events';
import { QUIZ_REPOSITORY } from '../../domain/quiz/quiz.repository';
import { windowCues } from '../../domain/quiz/quiz-window';
import { QuizGenerationLockService } from '../quiz-generation-lock.service';

import { GenerateQuizCommand } from './generate-quiz.command';

import type {
  CourseRepository,
  LessonRepository,
  TranscriptRepository,
} from '../../../../common/catalog-tokens';
import type { GeneratedQuizQuestion, LlamaAdapter } from '../../domain/quiz/llama.port';
import type { QuizQuestion } from '../../domain/quiz/quiz';
import type { QuizRepository } from '../../domain/quiz/quiz.repository';

/** One question per window keeps a single window's worth of text honest about what it can ask. */
const QUESTIONS_PER_WINDOW = 1;

export interface QuizGenerationAccepted {
  readonly courseId: string;
  readonly lessonsQueued: number;
}

@CommandHandler(GenerateQuizCommand)
export class GenerateQuizHandler implements ICommandHandler<
  GenerateQuizCommand,
  QuizGenerationAccepted
> {
  constructor(
    @Inject(LESSON_REPOSITORY) private readonly lessonRepo: LessonRepository,
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(TRANSCRIPT_REPOSITORY) private readonly transcripts: TranscriptRepository,
    @Inject(QUIZ_REPOSITORY) private readonly quizzes: QuizRepository,
    @Inject(LLAMA_ADAPTER) private readonly llama: LlamaAdapter,
    private readonly appConfig: AppConfig,
    private readonly lock: QuizGenerationLockService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: GenerateQuizCommand): Promise<QuizGenerationAccepted> {
    const modelAbsolutePath = this.resolveModel(command.modelFilename);

    const { lessons, courseId } = command.lessonId
      ? await this.resolveLessonScope(command.lessonId)
      : await this.resolveCourseScope(this.requireCourseId(command.courseId));

    if (!this.lock.tryAcquire(courseId)) {
      throw new QuizGenerationAlreadyRunningError(courseId);
    }

    const modelFilename = path.basename(modelAbsolutePath);
    Promise.resolve()
      .then(() =>
        this.walk(lessons, courseId, modelAbsolutePath, modelFilename, command.cleanupEnabled),
      )
      .catch(() => {
        // walk() handles its own per-lesson errors. This catch is a
        // belt-and-suspenders guard for a truly unexpected throw.
      })
      .finally(() => {
        this.lock.release(courseId);
      });

    return { courseId, lessonsQueued: lessons.length };
  }

  private resolveModel(requested: string | undefined): string {
    const cfg = this.appConfig.quizGeneration;
    const filename = requested ?? cfg.defaultModelFilename;
    if (filename === '') throw new QuizGenerationNotConfiguredError();

    const absolutePath = path.join(this.appConfig.modelWeightsDir, filename);
    if (cfg.mode === 'mock') return absolutePath;

    if (!filename.endsWith('.gguf') || !existsSync(absolutePath)) {
      throw new QuizModelNotFoundError(filename);
    }
    return absolutePath;
  }

  /** Unreachable via the two real call sites (each route always passes its own param) — defensive only. */
  private requireCourseId(courseId: string | undefined): string {
    if (!courseId) throw new CourseNotFoundError('');
    return courseId;
  }

  private async resolveLessonScope(
    lessonId: string,
  ): Promise<{ lessons: readonly { id: string; courseId: string }[]; courseId: string }> {
    const lesson = await this.lessonRepo.findById(lessonId);
    if (!lesson) throw new LessonNotFoundError(lessonId);
    return { lessons: [{ id: lesson.id, courseId: lesson.courseId }], courseId: lesson.courseId };
  }

  private async resolveCourseScope(
    courseId: string,
  ): Promise<{ lessons: readonly { id: string; courseId: string }[]; courseId: string }> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new CourseNotFoundError(courseId);
    const lessons = await this.lessonRepo.findByCourse(course.id);
    return {
      lessons: lessons.map((l) => ({ id: l.id, courseId: l.courseId })),
      courseId: course.id,
    };
  }

  // ---------------------------------------------------------------------------
  // The walk — runs after the response has been sent.
  // ---------------------------------------------------------------------------

  private async walk(
    lessons: readonly { id: string; courseId: string }[],
    courseId: string,
    modelAbsolutePath: string,
    modelFilename: string,
    cleanupEnabled: boolean,
  ): Promise<void> {
    for (const lesson of lessons) {
      const quiz = await this.generateForLesson(
        lesson.id,
        courseId,
        modelAbsolutePath,
        modelFilename,
        cleanupEnabled,
      );
      if (quiz) {
        await this.quizzes.save(quiz);
        this.eventBus.publish(
          new QuizProposed(
            quiz.id,
            quiz.lessonId,
            quiz.courseId,
            quiz.modelFilename,
            quiz.createdAt,
          ),
        );
      }
    }
  }

  /** One lesson: cues → windows → (cleanup?) → generate. Returns null when nothing was generated. */
  private async generateForLesson(
    lessonId: string,
    courseId: string,
    modelAbsolutePath: string,
    modelFilename: string,
    cleanupEnabled: boolean,
  ): Promise<Quiz | null> {
    const transcript = await this.transcripts.findCuesForLesson(lessonId);
    if (!transcript || transcript.cues.length === 0) return null;

    const windows = windowCues(transcript.cues);
    const questions: QuizQuestion[] = [];

    for (const window of windows) {
      const windowCueList = cleanupEnabled
        ? applyCleanup(window.cues, await this.tryCleanup(modelAbsolutePath, window.cues))
        : window.cues;

      const windowText = windowCueList.map((c) => c.text).join(' ');
      const generated = await this.tryGenerate(modelAbsolutePath, windowText);
      for (const q of generated) {
        questions.push({ ...q, cueStartMs: window.startMs });
      }
    }

    if (questions.length === 0) return null;

    return Quiz.create({
      id: nanoid(),
      lessonId,
      courseId,
      modelFilename,
      questions,
    });
  }

  /** Cleanup is best-effort — any failure (throw or malformed reply) means "use the original text". */
  private async tryCleanup(
    modelAbsolutePath: string,
    cues: readonly { text: string }[],
  ): Promise<readonly string[] | undefined> {
    try {
      const cleaned = await this.llama.cleanCues({
        modelAbsolutePath,
        cueTexts: cues.map((c) => c.text),
      });
      return cleaned.length === 0 ? undefined : cleaned;
    } catch {
      return undefined;
    }
  }

  /** A window's generation failure costs its own questions, never the lesson. */
  private async tryGenerate(
    modelAbsolutePath: string,
    windowText: string,
  ): Promise<readonly GeneratedQuizQuestion[]> {
    try {
      return await this.llama.generateQuestions({
        modelAbsolutePath,
        windowText,
        questionCount: QUESTIONS_PER_WINDOW,
      });
    } catch {
      return [];
    }
  }
}
