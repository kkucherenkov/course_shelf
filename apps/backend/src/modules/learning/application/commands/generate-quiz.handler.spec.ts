import { EventBus } from '@nestjs/cqrs';
import { describe, expect, it, vi } from 'vitest';

import { Quiz } from '../../domain/quiz/quiz';
import {
  QuizGenerationAlreadyRunningError,
  QuizGenerationNotConfiguredError,
  QuizModelNotFoundError,
} from '../../domain/quiz/quiz.errors';
import { QuizGenerationLockService } from '../quiz-generation-lock.service';
import { GenerateQuizCommand } from './generate-quiz.command';
import { GenerateQuizHandler } from './generate-quiz.handler';

import type {
  CourseRepository,
  LessonRepository,
  TranscriptRepository,
} from '../../../../common/catalog-tokens';
import type { AppConfig, QuizGenerationConfig } from '../../../../common/config/app-config';
import type { LlamaAdapter } from '../../domain/quiz/llama.port';
import type { QuizRepository } from '../../domain/quiz/quiz.repository';

const LESSON = { id: 'lesson-1', courseId: 'course-1' };

function makeLessonRepo(overrides: Partial<LessonRepository> = {}): LessonRepository {
  return {
    findById: vi.fn().mockResolvedValue(LESSON),
    findByCourse: vi.fn().mockResolvedValue([LESSON]),
    save: vi.fn(),
    findManyByLibrary: vi.fn(),
    ...overrides,
  } as unknown as LessonRepository;
}

function makeCourseRepo(overrides: Partial<CourseRepository> = {}): CourseRepository {
  return {
    findById: vi.fn().mockResolvedValue({ id: 'course-1', title: 'Course One' }),
    ...overrides,
  } as unknown as CourseRepository;
}

function makeTranscriptRepo(overrides: Partial<TranscriptRepository> = {}): TranscriptRepository {
  return {
    findCuesForLesson: vi.fn().mockResolvedValue({
      language: 'en',
      cues: [{ startMs: 0, endMs: 1000, text: 'hello world' }],
    }),
    ...overrides,
  } as unknown as TranscriptRepository;
}

function makeQuizRepo(): QuizRepository & { saved: Quiz[] } {
  const saved: Quiz[] = [];
  return {
    saved,
    save: vi.fn(async (quiz: Quiz) => {
      saved.push(quiz);
    }),
    findById: vi.fn(),
    findMany: vi.fn(),
  };
}

function makeLlama(overrides: Partial<LlamaAdapter> = {}): LlamaAdapter {
  return {
    cleanCues: vi.fn().mockResolvedValue(['hello world']),
    generateQuestions: vi
      .fn()
      .mockResolvedValue([
        { prompt: 'What?', options: ['A', 'B', 'C', 'D'], correctOptionIndex: 0 },
      ]),
    ...overrides,
  };
}

function makeAppConfig(overrides: Partial<QuizGenerationConfig> = {}): AppConfig {
  const quizGeneration: QuizGenerationConfig = {
    llamaPath: 'llama-completion',
    defaultModelFilename: 'Qwen3.5-4B-Q4_K_M.gguf',
    timeoutMs: 600_000,
    threads: 4,
    contextSize: 4096,
    mode: 'mock',
    ...overrides,
  };
  return { quizGeneration, modelWeightsDir: '/models' } as unknown as AppConfig;
}

function makeEventBus(): EventBus {
  return { publish: vi.fn() } as unknown as EventBus;
}

/** Pump the event loop so the fire-and-forget walk finishes. */
async function drainWalk(): Promise<void> {
  for (let i = 0; i < 20; i++) {
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
}

interface Harness {
  handler: GenerateQuizHandler;
  quizzes: QuizRepository & { saved: Quiz[] };
  lessonRepo: LessonRepository;
  courseRepo: CourseRepository;
  transcripts: TranscriptRepository;
  llama: LlamaAdapter;
  eventBus: EventBus;
}

function makeHandler(
  options: {
    lessonRepo?: LessonRepository;
    courseRepo?: CourseRepository;
    transcripts?: TranscriptRepository;
    llama?: LlamaAdapter;
    appConfig?: AppConfig;
    lock?: QuizGenerationLockService;
  } = {},
): Harness {
  const lessonRepo = options.lessonRepo ?? makeLessonRepo();
  const courseRepo = options.courseRepo ?? makeCourseRepo();
  const transcripts = options.transcripts ?? makeTranscriptRepo();
  const quizzes = makeQuizRepo();
  const llama = options.llama ?? makeLlama();
  const eventBus = makeEventBus();
  const handler = new GenerateQuizHandler(
    lessonRepo,
    courseRepo,
    transcripts,
    quizzes,
    llama,
    options.appConfig ?? makeAppConfig(),
    options.lock ?? new QuizGenerationLockService(),
    eventBus,
  );
  return { handler, quizzes, lessonRepo, courseRepo, transcripts, llama, eventBus };
}

describe('GenerateQuizHandler', () => {
  it('accepts a lesson-scoped request and generates one Quiz in the background', async () => {
    const { handler, quizzes, eventBus } = makeHandler();

    const accepted = await handler.execute(
      new GenerateQuizCommand('lesson-1', undefined, undefined, true),
    );
    expect(accepted).toEqual({ courseId: 'course-1', lessonsQueued: 1 });

    await drainWalk();

    expect(quizzes.saved).toHaveLength(1);
    const quiz = quizzes.saved[0]!;
    expect(quiz.lessonId).toBe('lesson-1');
    expect(quiz.courseId).toBe('course-1');
    expect(quiz.modelFilename).toBe('Qwen3.5-4B-Q4_K_M.gguf');
    expect(quiz.questions).toEqual([
      { prompt: 'What?', options: ['A', 'B', 'C', 'D'], correctOptionIndex: 0, cueStartMs: 0 },
    ]);
    expect(eventBus.publish).toHaveBeenCalledOnce();
  });

  it('accepts a course-scoped request and walks every lesson in the course', async () => {
    const lessonRepo = makeLessonRepo({
      findByCourse: vi.fn().mockResolvedValue([LESSON, { id: 'lesson-2', courseId: 'course-1' }]),
    });
    const { handler, quizzes } = makeHandler({ lessonRepo });

    const accepted = await handler.execute(
      new GenerateQuizCommand(undefined, 'course-1', undefined, true),
    );
    expect(accepted).toEqual({ courseId: 'course-1', lessonsQueued: 2 });

    await drainWalk();

    expect(quizzes.saved.map((q) => q.lessonId).toSorted()).toEqual(['lesson-1', 'lesson-2']);
  });

  it('produces no Quiz for a lesson with no transcript', async () => {
    const transcripts = makeTranscriptRepo({ findCuesForLesson: vi.fn().mockResolvedValue(null) });
    const { handler, quizzes } = makeHandler({ transcripts });

    await handler.execute(new GenerateQuizCommand('lesson-1', undefined, undefined, true));
    await drainWalk();

    expect(quizzes.saved).toHaveLength(0);
  });

  it('runs the cleanup pass before generation when cleanupEnabled is true', async () => {
    const llama = makeLlama();
    const { handler } = makeHandler({ llama });

    await handler.execute(new GenerateQuizCommand('lesson-1', undefined, undefined, true));
    await drainWalk();

    expect(llama.cleanCues).toHaveBeenCalledOnce();
  });

  it('skips the cleanup pass when cleanupEnabled is false', async () => {
    const llama = makeLlama();
    const { handler } = makeHandler({ llama });

    await handler.execute(new GenerateQuizCommand('lesson-1', undefined, undefined, false));
    await drainWalk();

    expect(llama.cleanCues).not.toHaveBeenCalled();
    expect(llama.generateQuestions).toHaveBeenCalledOnce();
  });

  it('throws QuizGenerationNotConfiguredError when no model is named and no default is configured', async () => {
    const { handler } = makeHandler({
      appConfig: makeAppConfig({ defaultModelFilename: '' }),
    });

    await expect(
      handler.execute(new GenerateQuizCommand('lesson-1', undefined, undefined, true)),
    ).rejects.toBeInstanceOf(QuizGenerationNotConfiguredError);
  });

  it('throws QuizModelNotFoundError for a named model that does not exist on disk (mode=real)', async () => {
    const { handler } = makeHandler({ appConfig: makeAppConfig({ mode: 'real' }) });

    await expect(
      handler.execute(new GenerateQuizCommand('lesson-1', undefined, 'does-not-exist.gguf', true)),
    ).rejects.toBeInstanceOf(QuizModelNotFoundError);
  });

  it('refuses a second course-scoped run while the first is still in flight, then allows one after it finishes', async () => {
    const lock = new QuizGenerationLockService();
    const { handler } = makeHandler({ lock });

    await handler.execute(new GenerateQuizCommand(undefined, 'course-1', undefined, true));

    await expect(
      handler.execute(new GenerateQuizCommand(undefined, 'course-1', undefined, true)),
    ).rejects.toBeInstanceOf(QuizGenerationAlreadyRunningError);

    await drainWalk();

    await expect(
      handler.execute(new GenerateQuizCommand(undefined, 'course-1', undefined, true)),
    ).resolves.toEqual({ courseId: 'course-1', lessonsQueued: 1 });
  });
});
