/**
 * Unit tests for RunTranscriptionHandler.
 *
 * Uses in-memory repositories and fake adapters throughout — no child process,
 * no disk. `node:fs/promises` is mocked because the handler's own file work
 * (mkdir the derived folder, read whisper's `.srt`, delete the temporary `.wav`)
 * is exactly what two of the acceptance criteria are about.
 *
 * Covers, per the story's Tests section:
 *   - Mixed walk: one lesson with a sidecar, one with a current generated
 *     transcript, one new → skipped 2, transcribed 1, status succeeded.
 *   - A whisper failure costs its lesson, not the run → failed 1, one error
 *     entry with code `whisper-failed`, run still succeeded.
 *   - Cancellation between lessons stops the walk and no further transcribe
 *     calls are made; the run ends `cancelled` keeping the counters it had.
 *   - `configured: false` rejects and persists nothing.
 *   - A second run while one is running rejects with TranscriptionAlreadyRunning.
 *   - The temporary `.wav` is removed on both the success and the failure path.
 *   - A missing library is a LibraryNotFoundError before anything is written.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn(async () => undefined),
  readFile: vi.fn(async () => 'WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nHello\n'),
  rm: vi.fn(async () => undefined),
}));

import { readFile, rm } from 'node:fs/promises';

import { Course } from '../../domain/course/course';
import { Lesson } from '../../domain/lesson/lesson';
import { Subtitle } from '../../domain/lesson/subtitle';
import { Library } from '../../domain/library/library';
import { LibraryNotFoundError } from '../../domain/library/library.errors';
import { Transcription } from '../../domain/transcription/transcription';
import {
  AudioExtractionFailedError,
  TranscriptionAlreadyRunningError,
  TranscriptionNotConfiguredError,
  WhisperFailedError,
} from '../../domain/transcription/transcription.errors';
import { RunTranscriptionCommand } from './run-transcription.command';
import { RunTranscriptionHandler } from './run-transcription.handler';

import type { CourseRepository } from '../../domain/course/course.repository';
import type { LessonRepository } from '../../domain/lesson/lesson.repository';
import type { LibraryRepository } from '../../domain/library/library.repository';
import type { FfmpegAdapter } from '../../domain/scan/ffmpeg-adapter';
import type {
  GeneratedTranscriptSignature,
  ReplaceGeneratedInput,
  TranscriptRepository,
} from '../../domain/transcription/transcript.repository';
import type { TranscriptionRepository } from '../../domain/transcription/transcription.repository';
import type { WhisperAdapter } from '../../domain/transcription/whisper.port';
import type { CentrifugoService } from '../../../../common/centrifugo/centrifugo.service';
import type { AppConfig } from '../../../../common/config/app-config';

const ACTOR_USER_ID = 'user-actor-1';
const ROOT = '/lib';
const BASE_TIME = new Date('2026-01-01T00:00:00.000Z');

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

function makeLibraryRepo(library?: Library): LibraryRepository {
  const store = new Map<string, Library>();
  if (library) store.set(library.id, library);
  return {
    save: vi.fn(async () => undefined),
    findById: vi.fn(async (id: string) => store.get(id) ?? null),
    findByRootPath: vi.fn(async () => null),
    findAll: vi.fn(async () => [...store.values()]),
    findByIds: vi.fn(async () => [...store.values()]),
    update: vi.fn(async () => null),
    removeWithCascade: vi.fn(async () => true),
  } as unknown as LibraryRepository;
}

function makeCourseRepo(courses: Course[]): CourseRepository {
  return {
    save: vi.fn(async () => undefined),
    findById: vi.fn(async (id: string) => courses.find((c) => c.id === id) ?? null),
    findManyByLibrary: vi.fn(async (libraryId: string) =>
      courses.filter((c) => c.libraryId === libraryId),
    ),
    findAll: vi.fn(async () => courses),
    findByIds: vi.fn(async () => courses),
    findRecentlyAdded: vi.fn(async () => courses),
  } as unknown as CourseRepository;
}

function makeLessonRepo(lessons: Lesson[]): LessonRepository {
  return {
    save: vi.fn(async () => undefined),
    findById: vi.fn(async (id: string) => lessons.find((l) => l.id === id) ?? null),
    findByCourse: vi.fn(async (courseId: string) => lessons.filter((l) => l.courseId === courseId)),
    findBySection: vi.fn(async () => []),
    getLessonStatsByCourseIds: vi.fn(async () => new Map()),
  } as unknown as LessonRepository;
}

interface FakeTranscriptionRepo extends TranscriptionRepository {
  store: Map<string, Transcription>;
  /** Invoked before every findById — the hook the cancellation test uses. */
  onFindById?: (id: string) => void;
}

function makeTranscriptionRepo(seed: Transcription[] = []): FakeTranscriptionRepo {
  const store = new Map<string, Transcription>(seed.map((t) => [t.id, t]));
  const repo: FakeTranscriptionRepo = {
    store,
    save: vi.fn(async (t: Transcription) => {
      store.set(t.id, t);
    }),
    findById: vi.fn(async (id: string) => {
      repo.onFindById?.(id);
      return store.get(id) ?? null;
    }),
    findLatestForLibrary: vi.fn(
      async (libraryId: string) =>
        [...store.values()]
          .filter((t) => t.libraryId === libraryId)
          .toSorted((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
          .at(0) ?? null,
    ),
    findRunningForLibrary: vi.fn(
      async (libraryId: string) =>
        [...store.values()].find((t) => t.libraryId === libraryId && t.status === 'running') ??
        null,
    ),
    listForLibrary: vi.fn(async (libraryId: string, limit: number) =>
      [...store.values()].filter((t) => t.libraryId === libraryId).slice(0, limit),
    ),
  };
  return repo;
}

interface FakeTranscriptRepo extends TranscriptRepository {
  written: ReplaceGeneratedInput[];
}

function makeTranscriptRepo(
  existing = new Map<string, GeneratedTranscriptSignature>(),
): FakeTranscriptRepo {
  const written: ReplaceGeneratedInput[] = [];
  return {
    written,
    findGeneratedForLessons: vi.fn(async () => existing),
    replaceGenerated: vi.fn(async (input: ReplaceGeneratedInput) => {
      written.push(input);
    }),
    // Not exercised by the transcription run — sidecar ingest (E27-F01-S01)
    // and orphan cleanup (E25-F04-S01) both live in the scan walk.
    findExisting: vi.fn(async () => null),
    replaceSidecar: vi.fn(async () => undefined),
    deleteForLesson: vi.fn(async () => undefined),
  };
}

function makeFfmpeg(failFor = new Set<string>()): FfmpegAdapter {
  return {
    probe: vi.fn(),
    writeThumbnail: vi.fn(),
    extractAudio: vi.fn(async (req: { videoAbsolutePath: string }) => {
      if (failFor.has(req.videoAbsolutePath)) {
        throw new AudioExtractionFailedError(req.videoAbsolutePath, 'exit 1');
      }
    }),
  } as unknown as FfmpegAdapter;
}

function makeWhisper(failForAudioOfLesson = new Set<string>()): WhisperAdapter {
  return {
    transcribe: vi.fn(async (req: { outBaseAbsolutePath: string }) => {
      if ([...failForAudioOfLesson].some((frag) => req.outBaseAbsolutePath.includes(frag))) {
        throw new WhisperFailedError('audio.wav', 'exit 1');
      }
      return { srtAbsolutePath: `${req.outBaseAbsolutePath}.srt` };
    }),
  };
}

function makeAppConfig(overrides: { configured?: boolean; language?: string } = {}): AppConfig {
  return {
    derivedPath: '/derived',
    transcription: {
      whisperPath: 'whisper-cli',
      modelPath: '/models/base.bin',
      timeoutMs: 1000,
      threads: 4,
      language: overrides.language ?? 'auto',
      configured: overrides.configured ?? true,
    },
  } as unknown as AppConfig;
}

function makeCentrifugo(): CentrifugoService {
  return { publish: vi.fn().mockResolvedValue(undefined) } as unknown as CentrifugoService;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeLibrary(): Library {
  return Library.register({ id: 'lib-1', name: 'Test Library', rootPath: ROOT });
}

function makeCourse(): Course {
  const course = Course.create({
    id: 'course-1',
    libraryId: 'lib-1',
    slug: 'course-1',
    title: 'Course One',
  });
  course.addSection({ id: 'section-1', title: 'Lessons', position: 1 });
  return course;
}

function makeLesson(id: string, file: string, subtitlePaths: string[] = []): Lesson {
  const lesson = Lesson.create({
    id,
    courseId: 'course-1',
    sectionId: 'section-1',
    position: 1,
    title: file,
    videoPath: `${ROOT}/course-1/${file}`,
    mtime: BASE_TIME,
    sizeBytes: 100,
  });
  for (const [i, p] of subtitlePaths.entries()) {
    lesson.addSubtitle(Subtitle.fromFile({ id: `sub-${id}-${String(i)}`, path: p }));
  }
  return lesson;
}

/** Pump the event loop so the fire-and-forget walk finishes. */
async function drainWalk(): Promise<void> {
  for (let i = 0; i < 40; i++) {
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
}

interface Harness {
  handler: RunTranscriptionHandler;
  transcriptions: FakeTranscriptionRepo;
  transcripts: FakeTranscriptRepo;
  whisper: WhisperAdapter;
  ffmpeg: FfmpegAdapter;
  centrifugo: CentrifugoService;
}

function makeHandler(options: {
  lessons?: Lesson[];
  existing?: Map<string, GeneratedTranscriptSignature>;
  seedRuns?: Transcription[];
  configured?: boolean;
  language?: string;
  whisperFailsFor?: Set<string>;
  ffmpegFailsFor?: Set<string>;
}): Harness {
  const lessons = options.lessons ?? [];
  const transcriptions = makeTranscriptionRepo(options.seedRuns ?? []);
  const transcripts = makeTranscriptRepo(options.existing);
  const whisper = makeWhisper(options.whisperFailsFor);
  const ffmpeg = makeFfmpeg(options.ffmpegFailsFor);
  const centrifugo = makeCentrifugo();

  const handler = new RunTranscriptionHandler(
    makeLibraryRepo(makeLibrary()),
    makeCourseRepo([makeCourse()]),
    makeLessonRepo(lessons),
    transcriptions,
    transcripts,
    ffmpeg,
    whisper,
    makeAppConfig({
      ...(options.configured === undefined ? {} : { configured: options.configured }),
      ...(options.language === undefined ? {} : { language: options.language }),
    }),
    centrifugo,
  );

  return { handler, transcriptions, transcripts, whisper, ffmpeg, centrifugo };
}

// ---------------------------------------------------------------------------

describe('RunTranscriptionHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(readFile).mockResolvedValue(
      'WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nHello\n' as never,
    );
  });

  it('returns a running run immediately and finishes the walk afterwards', async () => {
    const { handler, transcriptions } = makeHandler({ lessons: [makeLesson('l1', 'a.mp4')] });

    const returned = await handler.execute(
      new RunTranscriptionCommand('lib-1', false, ACTOR_USER_ID),
    );

    // The 202 body: still running, nothing walked yet.
    expect(returned.status).toBe('running');
    expect(returned.lessonsTotal).toBe(1);
    expect(returned.lessonsTranscribed).toBe(0);

    await drainWalk();
    expect(transcriptions.store.get(returned.id)?.status).toBe('succeeded');
  });

  it('skips a sidecar and a current transcript, transcribes the rest', async () => {
    const lessons = [
      makeLesson('l1', 'has-sidecar.mp4', [`${ROOT}/course-1/has-sidecar.en.srt`]),
      makeLesson('l2', 'already-done.mp4'),
      makeLesson('l3', 'new.mp4'),
    ];
    const existing = new Map<string, GeneratedTranscriptSignature>([
      ['l2', { sourceMtime: BASE_TIME, sourceSize: 100 }],
    ]);

    const { handler, transcripts, whisper } = makeHandler({ lessons, existing });
    const run = await handler.execute(new RunTranscriptionCommand('lib-1', false, ACTOR_USER_ID));
    await drainWalk();

    expect(run.lessonsSkipped).toBe(2);
    expect(run.lessonsTranscribed).toBe(1);
    expect(run.lessonsFailed).toBe(0);
    expect(run.status).toBe('succeeded');

    expect(whisper.transcribe).toHaveBeenCalledTimes(1);
    expect(transcripts.written).toHaveLength(1);
    const written = transcripts.written[0];
    expect(written?.lessonId).toBe('l3');
    // `-l auto` gives nothing to read the detection back from → `und`.
    expect(written?.language).toBe('und');
    expect(written?.sourcePath).toBe('course-1/new.mp4');
    expect(written?.derivedPath).toBe('/derived/lib-1/course-1/new.mp4.und.srt');
    expect(written?.cues).toEqual([{ startMs: 1000, endMs: 2000, text: 'Hello' }]);
  });

  it('re-transcribes a current transcript under force, but never a sidecar', async () => {
    const lessons = [
      makeLesson('l1', 'has-sidecar.mp4', [`${ROOT}/course-1/has-sidecar.en.srt`]),
      makeLesson('l2', 'already-done.mp4'),
    ];
    const existing = new Map<string, GeneratedTranscriptSignature>([
      ['l2', { sourceMtime: BASE_TIME, sourceSize: 100 }],
    ]);

    const { handler, transcripts } = makeHandler({ lessons, existing });
    const run = await handler.execute(new RunTranscriptionCommand('lib-1', true, ACTOR_USER_ID));
    await drainWalk();

    expect(run.lessonsSkipped).toBe(1);
    expect(run.lessonsTranscribed).toBe(1);
    expect(transcripts.written.map((w) => w.lessonId)).toEqual(['l2']);
  });

  it('records a whisper failure against its lesson and carries on', async () => {
    const lessons = [makeLesson('l1', 'bad.mp4'), makeLesson('l2', 'good.mp4')];
    const { handler, transcripts } = makeHandler({
      lessons,
      whisperFailsFor: new Set(['bad.mp4']),
    });

    const run = await handler.execute(new RunTranscriptionCommand('lib-1', false, ACTOR_USER_ID));
    await drainWalk();

    expect(run.status).toBe('succeeded');
    expect(run.lessonsFailed).toBe(1);
    expect(run.lessonsTranscribed).toBe(1);
    expect(run.errors).toHaveLength(1);
    expect(run.errors[0]?.lessonId).toBe('l1');
    expect(run.errors[0]?.code).toBe('whisper-failed');
    expect(transcripts.written.map((w) => w.lessonId)).toEqual(['l2']);
  });

  it('records an audio-extraction failure with its own code', async () => {
    const { handler } = makeHandler({
      lessons: [makeLesson('l1', 'undecodable.mp4')],
      ffmpegFailsFor: new Set([`${ROOT}/course-1/undecodable.mp4`]),
    });

    const run = await handler.execute(new RunTranscriptionCommand('lib-1', false, ACTOR_USER_ID));
    await drainWalk();

    expect(run.lessonsFailed).toBe(1);
    expect(run.errors[0]?.code).toBe('audio-extract-failed');
    expect(run.status).toBe('succeeded');
  });

  it('removes the temporary wav on the success path', async () => {
    const { handler } = makeHandler({ lessons: [makeLesson('l1', 'a.mp4')] });
    await handler.execute(new RunTranscriptionCommand('lib-1', false, ACTOR_USER_ID));
    await drainWalk();

    expect(rm).toHaveBeenCalledTimes(1);
    expect(vi.mocked(rm).mock.calls[0]?.[0]).toMatch(/cs-transcribe-.*\.wav$/);
    expect(vi.mocked(rm).mock.calls[0]?.[1]).toEqual({ force: true });
  });

  it('removes the temporary wav on the failure path too', async () => {
    const { handler } = makeHandler({
      lessons: [makeLesson('l1', 'bad.mp4')],
      whisperFailsFor: new Set(['bad.mp4']),
    });
    await handler.execute(new RunTranscriptionCommand('lib-1', false, ACTOR_USER_ID));
    await drainWalk();

    expect(rm).toHaveBeenCalledTimes(1);
    expect(vi.mocked(rm).mock.calls[0]?.[0]).toMatch(/cs-transcribe-.*\.wav$/);
  });

  it('stops the walk when the run is cancelled between lessons', async () => {
    const lessons = [
      makeLesson('l1', 'a.mp4'),
      makeLesson('l2', 'b.mp4'),
      makeLesson('l3', 'c.mp4'),
    ];
    const { handler, transcriptions, whisper } = makeHandler({ lessons });

    // Cancel as soon as the walk has finished its first lesson: the walk asks
    // the repository for its own run before and after every lesson, and the
    // second question is the one that lands after lesson one's work.
    let seen = 0;
    transcriptions.onFindById = (id) => {
      seen++;
      if (seen === 2) transcriptions.store.get(id)?.cancel();
    };

    const run = await handler.execute(new RunTranscriptionCommand('lib-1', false, ACTOR_USER_ID));
    await drainWalk();

    expect(whisper.transcribe).toHaveBeenCalledTimes(1);
    expect(run.lessonsTranscribed).toBe(1);
    expect(run.status).toBe('cancelled');
    expect(transcriptions.store.get(run.id)?.status).toBe('cancelled');
  });

  it('refuses to start when no whisper model is configured, persisting nothing', async () => {
    const { handler, transcriptions, whisper } = makeHandler({
      lessons: [makeLesson('l1', 'a.mp4')],
      configured: false,
    });

    await expect(
      handler.execute(new RunTranscriptionCommand('lib-1', false, ACTOR_USER_ID)),
    ).rejects.toThrow(TranscriptionNotConfiguredError);

    expect(transcriptions.store.size).toBe(0);
    expect(transcriptions.save).not.toHaveBeenCalled();
    expect(whisper.transcribe).not.toHaveBeenCalled();
  });

  it('refuses a second run while one is already going', async () => {
    const already = Transcription.start({
      id: 'run-existing',
      libraryId: 'lib-1',
      force: false,
      lessonsTotal: 3,
    });
    const { handler, transcriptions } = makeHandler({
      lessons: [makeLesson('l1', 'a.mp4')],
      seedRuns: [already],
    });

    await expect(
      handler.execute(new RunTranscriptionCommand('lib-1', false, ACTOR_USER_ID)),
    ).rejects.toThrow(TranscriptionAlreadyRunningError);

    expect(transcriptions.store.size).toBe(1);
  });

  it('rejects an unknown library before writing anything', async () => {
    // Built by hand rather than through makeHandler: the point of this case is
    // an empty library repository.
    const transcriptions = makeTranscriptionRepo();
    const handler = new RunTranscriptionHandler(
      makeLibraryRepo(),
      makeCourseRepo([]),
      makeLessonRepo([]),
      transcriptions,
      makeTranscriptRepo(),
      makeFfmpeg(),
      makeWhisper(),
      makeAppConfig(),
      makeCentrifugo(),
    );

    await expect(
      handler.execute(new RunTranscriptionCommand('nope', false, ACTOR_USER_ID)),
    ).rejects.toThrow(LibraryNotFoundError);
    expect(transcriptions.store.size).toBe(0);
  });

  it('publishes started, per-lesson progress and finished on the actor channel', async () => {
    const { handler, centrifugo } = makeHandler({
      lessons: [makeLesson('l1', 'a.mp4'), makeLesson('l2', 'b.mp4')],
    });

    await handler.execute(new RunTranscriptionCommand('lib-1', false, ACTOR_USER_ID));
    await drainWalk();

    const calls = vi.mocked(centrifugo.publish).mock.calls;
    expect(calls.every(([channel]) => channel === `scans:user:${ACTOR_USER_ID}`)).toBe(true);

    const kinds = calls.map(([, payload]) => (payload as { kind: string }).kind);
    expect(kinds[0]).toBe('transcription-started');
    expect(kinds.filter((k) => k === 'transcription-progress')).toHaveLength(2);
    expect(kinds.at(-1)).toBe('transcription-finished');
  });

  it('honours a configured language instead of und', async () => {
    const { handler, transcripts } = makeHandler({
      lessons: [makeLesson('l1', 'a.mp4')],
      language: 'ru',
    });

    await handler.execute(new RunTranscriptionCommand('lib-1', false, ACTOR_USER_ID));
    await drainWalk();

    expect(transcripts.written[0]?.language).toBe('ru');
    expect(transcripts.written[0]?.derivedPath).toBe('/derived/lib-1/course-1/a.mp4.ru.srt');
  });
});
