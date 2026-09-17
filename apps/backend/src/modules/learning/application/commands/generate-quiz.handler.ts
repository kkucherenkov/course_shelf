/**
 * WHY this file exists:
 * Orchestrates one quiz-generation walk, modelled on run-transcription.handler
 * down to the fire-and-forget shape:
 *   1. Resolve the model: named on the request, or AppConfig's configured
 *      default. Refuse before doing any work: an entirely unconfigured
 *      default is 503 (QuizGenerationNotConfiguredError), checked here
 *      because it needs no adapter. Whether a *named* model is usable is the
 *      adapter's business — a `.gguf` file existing locally, an API key
 *      being set for a hosted provider — so the handler asks via
 *      `ensureModelUsable` and awaits it before the walk starts, outside the
 *      per-window try/catch below: a bad model name has to reach the caller
 *      as this request's 404 (LocalLlamaAdapter's QuizModelNotFoundError,
 *      checked live because the admin delete endpoint can remove a file
 *      between two requests), not get swallowed as an empty per-window
 *      result deep inside fire-and-forget work.
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
import { Quiz } from '../../domain/quiz/quiz';
import {
  QuizGenerationAlreadyRunningError,
  QuizGenerationNotConfiguredError,
} from '../../domain/quiz/quiz.errors';
import { TEXT_MODEL_ADAPTER } from '../../domain/quiz/text-model.port';
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
import type { QuizQuestion } from '../../domain/quiz/quiz';
import type { QuizRepository } from '../../domain/quiz/quiz.repository';
import type { GeneratedQuizQuestion, TextModelAdapter } from '../../domain/quiz/text-model.port';

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
    @Inject(TEXT_MODEL_ADAPTER) private readonly llama: TextModelAdapter,
    private readonly appConfig: AppConfig,
    private readonly lock: QuizGenerationLockService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: GenerateQuizCommand): Promise<QuizGenerationAccepted> {
    // "Nothing configured at all" needs no adapter, so it is checked here.
    const model = command.modelFilename ?? this.appConfig.quizGeneration.defaultModelFilename;
    if (model === '') throw new QuizGenerationNotConfiguredError();

    // Whether this *named* model is usable is the adapter's business (a
    // `.gguf` file on disk, an API key for a hosted provider) — but the
    // answer still has to reach the caller as this request's error, not get
    // discovered per window inside the fire-and-forget walk below and
    // swallowed by tryCleanup/tryGenerate's catch blocks.
    await this.llama.ensureModelUsable(model);

    const { lessons, courseId } = command.lessonId
      ? await this.resolveLessonScope(command.lessonId)
      : await this.resolveCourseScope(this.requireCourseId(command.courseId));

    if (!this.lock.tryAcquire(courseId)) {
      throw new QuizGenerationAlreadyRunningError(courseId);
    }

    Promise.resolve()
      .then(() => this.walk(lessons, courseId, model, command.cleanupEnabled))
      .catch(() => {
        // walk() handles its own per-lesson errors. This catch is a
        // belt-and-suspenders guard for a truly unexpected throw.
      })
      .finally(() => {
        this.lock.release(courseId);
      });

    return { courseId, lessonsQueued: lessons.length };
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
    model: string,
    cleanupEnabled: boolean,
  ): Promise<void> {
    for (const lesson of lessons) {
      const quiz = await this.generateForLesson(lesson.id, courseId, model, cleanupEnabled);
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
    model: string,
    cleanupEnabled: boolean,
  ): Promise<Quiz | null> {
    const transcript = await this.transcripts.findCuesForLesson(lessonId);
    if (!transcript || transcript.cues.length === 0) return null;

    const windows = windowCues(transcript.cues);
    const questions: QuizQuestion[] = [];

    for (const window of windows) {
      const windowCueList = cleanupEnabled
        ? applyCleanup(window.cues, await this.tryCleanup(model, window.cues))
        : window.cues;

      const windowText = windowCueList.map((c) => c.text).join(' ');
      const generated = await this.tryGenerate(model, windowText);
      for (const q of generated) {
        questions.push({ ...q, cueStartMs: window.startMs });
      }
    }

    if (questions.length === 0) return null;

    return Quiz.create({
      id: nanoid(),
      lessonId,
      courseId,
      modelFilename: model,
      questions,
    });
  }

  /** Cleanup is best-effort — any failure (throw or malformed reply) means "use the original text". */
  private async tryCleanup(
    model: string,
    cues: readonly { text: string }[],
  ): Promise<readonly string[] | undefined> {
    try {
      const cleaned = await this.llama.cleanCues({
        model,
        cueTexts: cues.map((c) => c.text),
      });
      return cleaned.length === 0 ? undefined : cleaned;
    } catch {
      return undefined;
    }
  }

  /** A window's generation failure costs its own questions, never the lesson. */
  private async tryGenerate(
    model: string,
    windowText: string,
  ): Promise<readonly GeneratedQuizQuestion[]> {
    try {
      return await this.llama.generateQuestions({
        model,
        windowText,
        questionCount: QUESTIONS_PER_WINDOW,
      });
    } catch {
      return [];
    }
  }
}
