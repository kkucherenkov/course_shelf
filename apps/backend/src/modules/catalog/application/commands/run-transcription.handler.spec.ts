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
 *
 * And, for the scoped run (E32-F02-S01):
 *   - A scoped run walks its own course's lessons and never a sibling's.
 *   - The skip rule still applies inside the scope.
 *   - The scope is named on the record and on all three lifecycle events.
 *   - The already-running guard applies to a scoped run too, and its 409 says
 *     which run is in flight and how to cancel it.
 *   - A per-request language reaches whisper and files the transcript under it.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn(async () => undefined),
  readFile: vi.fn(async () => 'WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nHello\n'),
  rename: vi.fn(async () => undefined),
  rm: vi.fn(async () => undefined),
}));

import { readFile, rename, rm } from 'node:fs/promises';

import { Course } from '../../domain/course/course';
import { CourseNotFoundError } from '../../domain/course/course.errors';
import { Lesson } from '../../domain/lesson/lesson';
import { Subtitle } from '../../domain/lesson/subtitle';
import { LibraryRelativePath } from '../../domain/shared-vo/library-relative-path';
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
    // Not exercised by the walk — the boot-recovery pass is its own service.
    findStaleRunning: vi.fn(async () => []),
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
    // Auto-mode's any-language lookup — same signatures, tagged with a
    // placeholder language the tests below never inspect (they read
    // `written[].language`, what the run PRODUCES, not this lookup's input).
    findAnyGeneratedForLessons: vi.fn(
      async () =>
        new Map([...existing].map(([lessonId, sig]) => [lessonId, { ...sig, language: 'und' }])),
    ),
    replaceGenerated: vi.fn(async (input: ReplaceGeneratedInput) => {
      written.push(input);
    }),
    // Not exercised by the transcription run — sidecar ingest (E27-F01-S01)
    // and orphan cleanup (E25-F04-S01) both live in the scan walk.
    findExisting: vi.fn(async () => null),
    replaceSidecar: vi.fn(async () => undefined),
    deleteForLesson: vi.fn(async () => undefined),
    // Not exercised by the transcription run — the language-backfill script
    // (#555) is the only caller.
    findGeneratedByLanguage: vi.fn(async () => []),
    reclassifyGenerated: vi.fn(async () => undefined),
    findCuesForLesson: vi.fn(async () => null),
    findCuesForLessons: vi.fn(async () => new Map()),
    cueBelongsToLesson: vi.fn(async () => true),
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

function makeWhisper(
  failForAudioOfLesson = new Set<string>(),
  detectedLanguage?: string,
): WhisperAdapter {
  return {
    transcribe: vi.fn(async (req: { outBaseAbsolutePath: string }) => {
      if ([...failForAudioOfLesson].some((frag) => req.outBaseAbsolutePath.includes(frag))) {
        throw new WhisperFailedError('audio.wav', 'exit 1');
      }
      return {
        srtAbsolutePath: `${req.outBaseAbsolutePath}.srt`,
        ...(detectedLanguage === undefined ? {} : { detectedLanguage }),
      };
    }),
  };
}

function makeAppConfig(overrides: { configured?: boolean; language?: string } = {}): AppConfig {
  return {
    derivedPath: '/derived',
    bootId: 'boot-test',
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

function makeCourse(id = 'course-1', title = 'Course One'): Course {
  const course = Course.create({ id, libraryId: 'lib-1', slug: id, title });
  course.addSection({ id: `section-${id}`, title: 'Lessons', position: 1 });
  return course;
}

function makeLesson(
  id: string,
  file: string,
  subtitlePaths: string[] = [],
  courseId = 'course-1',
): Lesson {
  const lesson = Lesson.create({
    id,
    courseId,
    sectionId: `section-${courseId}`,
    position: 1,
    title: file,
    videoPath: LibraryRelativePath.from(`${ROOT}/${courseId}/${file}`, ROOT),
    mtime: BASE_TIME,
    sizeBytes: 100,
  });
  for (const [i, p] of subtitlePaths.entries()) {
    lesson.addSubtitle(
      Subtitle.fromFile({ id: `sub-${id}-${String(i)}`, path: p, libraryRoot: ROOT }),
    );
  }
  return lesson;
}

const TWO_COURSES = [makeCourse('course-1', 'Course One'), makeCourse('course-2', 'Course Two')];

/** Two courses, two lessons each — what every scoped case below is about. */
function twoCourseLessons(): Lesson[] {
  return [
    makeLesson('l1', 'a.mp4', [], 'course-1'),
    makeLesson('l2', 'b.mp4', [], 'course-1'),
    makeLesson('l3', 'c.mp4', [], 'course-2'),
    makeLesson('l4', 'd.mp4', [], 'course-2'),
  ];
}

/** The command POST /courses/{id}/transcription builds. */
function scoped(courseId: string, language?: string): RunTranscriptionCommand {
  return new RunTranscriptionCommand(undefined, false, ACTOR_USER_ID, { courseId }, language);
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
  courses?: Course[];
  existing?: Map<string, GeneratedTranscriptSignature>;
  seedRuns?: Transcription[];
  configured?: boolean;
  language?: string;
  whisperFailsFor?: Set<string>;
  ffmpegFailsFor?: Set<string>;
  detectedLanguage?: string;
}): Harness {
  const lessons = options.lessons ?? [];
  const transcriptions = makeTranscriptionRepo(options.seedRuns ?? []);
  const transcripts = makeTranscriptRepo(options.existing);
  const whisper = makeWhisper(options.whisperFailsFor, options.detectedLanguage);
  const ffmpeg = makeFfmpeg(options.ffmpegFailsFor);
  const centrifugo = makeCentrifugo();

  const handler = new RunTranscriptionHandler(
    makeLibraryRepo(makeLibrary()),
    makeCourseRepo(options.courses ?? [makeCourse()]),
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
    // The fake whisper adapter never returns a `detectedLanguage`, so the
    // deployment's own configured language (`auto` here) resolves to `und` —
    // see the `auto-detects a language and renames to match` case below for
    // what happens once whisper DOES report something.
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
      bootId: 'boot-other',
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

  // -------------------------------------------------------------------------
  // #501 — auto-detected language
  // -------------------------------------------------------------------------

  describe('auto-detected language', () => {
    it('files the transcript under whisper’s detected language and renames the file to match', async () => {
      const { handler, transcripts } = makeHandler({
        lessons: [makeLesson('l1', 'a.mp4')],
        detectedLanguage: 'ru',
      });

      await handler.execute(new RunTranscriptionCommand('lib-1', false, ACTOR_USER_ID));
      await drainWalk();

      expect(transcripts.written[0]?.language).toBe('ru');
      expect(transcripts.written[0]?.derivedPath).toBe('/derived/lib-1/course-1/a.mp4.ru.srt');
      // Whisper wrote to the `und` working bucket; the final row lives at the
      // `ru` path LessonFileLocator will recompute from the DB language.
      expect(rename).toHaveBeenCalledWith(
        '/derived/lib-1/course-1/a.mp4.und.srt',
        '/derived/lib-1/course-1/a.mp4.ru.srt',
      );
    });

    it('falls back to the deployment default on an unsupported detected language, without renaming', async () => {
      const { handler, transcripts } = makeHandler({
        lessons: [makeLesson('l1', 'a.mp4')],
        detectedLanguage: 'uk', // Ukrainian — not one of the two this library supports.
      });

      await handler.execute(new RunTranscriptionCommand('lib-1', false, ACTOR_USER_ID));
      await drainWalk();

      expect(transcripts.written[0]?.language).toBe('und');
      expect(rename).not.toHaveBeenCalled();
    });

    it('recognises a lesson already transcribed in a previously-detected language and skips it', async () => {
      // A prior auto run tagged this lesson `ru`; the pre-run lookup for an
      // auto run must find it without being told which language to look for.
      const existing = new Map([['l1', { sourceMtime: BASE_TIME, sourceSize: 100 }]]);
      const { handler, transcripts, whisper } = makeHandler({
        lessons: [makeLesson('l1', 'a.mp4')],
        existing,
      });

      const run = await handler.execute(new RunTranscriptionCommand('lib-1', false, ACTOR_USER_ID));
      await drainWalk();

      expect(transcripts.findAnyGeneratedForLessons).toHaveBeenCalledWith(['l1']);
      expect(transcripts.findGeneratedForLessons).not.toHaveBeenCalled();
      expect(whisper.transcribe).not.toHaveBeenCalled();
      expect(run.lessonsSkipped).toBe(1);
      expect(run.lessonsTranscribed).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Scoped run — POST /courses/{id}/transcription (E32-F02-S01)
  // -------------------------------------------------------------------------

  describe('scoped to one course', () => {
    it('transcribes only that course and never touches a sibling', async () => {
      const { handler, transcripts, whisper } = makeHandler({
        lessons: twoCourseLessons(),
        courses: TWO_COURSES,
      });

      const run = await handler.execute(scoped('course-2'));
      await drainWalk();

      expect(run.lessonsTotal).toBe(2);
      expect(run.lessonsTranscribed).toBe(2);
      expect(run.status).toBe('succeeded');
      expect(whisper.transcribe).toHaveBeenCalledTimes(2);
      expect(transcripts.written.map((w) => w.lessonId)).toEqual(['l3', 'l4']);
      expect(transcripts.written.map((w) => w.sourcePath)).toEqual([
        'course-2/c.mp4',
        'course-2/d.mp4',
      ]);
    });

    it('resolves the library from the course, not from the request', async () => {
      const { handler } = makeHandler({ lessons: twoCourseLessons(), courses: TWO_COURSES });

      const run = await handler.execute(scoped('course-2'));

      expect(run.libraryId).toBe('lib-1');
    });

    it('still honours the skip rule inside the scope', async () => {
      const lessons = [
        makeLesson('l3', 'has-sidecar.mp4', [`${ROOT}/course-2/has-sidecar.en.srt`], 'course-2'),
        makeLesson('l4', 'already-done.mp4', [], 'course-2'),
        makeLesson('l5', 'new.mp4', [], 'course-2'),
      ];
      const existing = new Map<string, GeneratedTranscriptSignature>([
        ['l4', { sourceMtime: BASE_TIME, sourceSize: 100 }],
      ]);

      const { handler, transcripts, whisper } = makeHandler({
        lessons,
        courses: TWO_COURSES,
        existing,
      });

      const run = await handler.execute(scoped('course-2'));
      await drainWalk();

      expect(run.lessonsSkipped).toBe(2);
      expect(run.lessonsTranscribed).toBe(1);
      expect(whisper.transcribe).toHaveBeenCalledTimes(1);
      expect(transcripts.written.map((w) => w.lessonId)).toEqual(['l5']);
    });

    it('names the scoped course on the record and on every lifecycle event', async () => {
      const { handler, centrifugo } = makeHandler({
        lessons: twoCourseLessons(),
        courses: TWO_COURSES,
      });

      const run = await handler.execute(scoped('course-2'));
      await drainWalk();

      expect(run.scopeCourseId).toBe('course-2');
      expect(run.scopeCourseName).toBe('Course Two');

      const payloads = vi
        .mocked(centrifugo.publish)
        .mock.calls.map(
          ([, payload]) =>
            payload as { kind: string; scopeCourseId?: string; scopeCourseName?: string },
        );

      expect(payloads.map((p) => p.kind)).toEqual([
        'transcription-started',
        'transcription-progress',
        'transcription-progress',
        'transcription-finished',
      ]);
      for (const payload of payloads) {
        expect(payload.scopeCourseId).toBe('course-2');
        expect(payload.scopeCourseName).toBe('Course Two');
      }
    });

    it('leaves the scope off a library-wide run entirely', async () => {
      const { handler, centrifugo } = makeHandler({ lessons: [makeLesson('l1', 'a.mp4')] });

      const run = await handler.execute(new RunTranscriptionCommand('lib-1', false, ACTOR_USER_ID));
      await drainWalk();

      expect(run.scopeCourseId).toBeUndefined();
      for (const [, payload] of vi.mocked(centrifugo.publish).mock.calls) {
        expect(payload as Record<string, unknown>).not.toHaveProperty('scopeCourseId');
      }
    });

    // The deliberate decision this story had to make: whisper saturates every
    // core, so one run per library stands — scoped or not. The 409 has to say
    // which run and how to stop it, because the operator hitting this is
    // usually trying to escape a library-wide run they regret.
    it('is refused while any run for the same library is going, and says how to stop it', async () => {
      const already = Transcription.start({
        id: 'run-existing',
        libraryId: 'lib-1',
        force: false,
        lessonsTotal: 5464,
        bootId: 'boot-other',
      });
      const { handler, transcriptions } = makeHandler({
        lessons: twoCourseLessons(),
        courses: TWO_COURSES,
        seedRuns: [already],
      });

      const error = await handler.execute(scoped('course-2')).catch((error_: unknown) => error_);

      expect(error).toBeInstanceOf(TranscriptionAlreadyRunningError);
      expect((error as TranscriptionAlreadyRunningError).detail).toContain('run-existing');
      expect((error as TranscriptionAlreadyRunningError).detail).toContain(
        'POST /api/v1/transcriptions/run-existing/cancel',
      );
      expect(transcriptions.store.size).toBe(1);
    });

    it('rejects an unknown course before writing anything', async () => {
      const { handler, transcriptions } = makeHandler({
        lessons: twoCourseLessons(),
        courses: TWO_COURSES,
      });

      await expect(handler.execute(scoped('course-nope'))).rejects.toThrow(CourseNotFoundError);
      expect(transcriptions.store.size).toBe(0);
    });

    it('sends a requested language to whisper instead of the deployment default', async () => {
      const { handler, transcripts, whisper } = makeHandler({
        lessons: [makeLesson('l3', 'c.mp4', [], 'course-2')],
        courses: TWO_COURSES,
        language: 'auto',
      });

      await handler.execute(scoped('course-2', 'ru'));
      await drainWalk();

      expect(vi.mocked(whisper.transcribe).mock.calls[0]?.[0].language).toBe('ru');
      expect(transcripts.written[0]?.language).toBe('ru');
      expect(transcripts.written[0]?.derivedPath).toBe('/derived/lib-1/course-2/c.mp4.ru.srt');
    });
  });
});
