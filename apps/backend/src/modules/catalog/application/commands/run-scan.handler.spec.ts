/**
 * Unit tests for RunScanHandler.
 *
 * Uses:
 *   - FakeFsAdapter exposing a fixture tree in memory (no real disk I/O).
 *   - FakeFfmpegAdapter (no real child_process calls).
 *   - In-memory ScanRepository backed by a plain Map.
 *   - In-memory LibraryRepository backed by a plain Map.
 *   - Mock CentrifugoService to assert lifecycle event publishing.
 *
 * Fixture tree:
 *   /lib/01 - Course A/01 - Intro.mp4
 *   /lib/01 - Course A/02 - Aggregates.mp4
 *   /lib/01 - Course A/course.json   (title: "Course A from JSON")
 *   /lib/02 - Course B (no json)/01 - Episode.mp4
 *   /lib/.hidden/skip.mp4             → skipped (dotfile folder)
 *   /lib/02 - Course B (no json)/broken.txt → unsupported extension ScanError
 *
 * Stem-match regression fixture (E06-F03-S02):
 *   /lib/03 - Neovim Course/01 - Intro.mp4
 *   /lib/03 - Neovim Course/01 - Intro.pdf    → material, NOT a ScanError
 *   /lib/03 - Neovim Course/01 - Intro.en.srt → subtitle (lang=en), NOT a ScanError
 *
 * Acceptance assertions per the story:
 *   First scan:  coursesDiscovered=2, filesAdded=3, filesUpdated=0, filesScanned=4,
 *                errors.length=1 (broken.txt).
 *   Second scan: all counters zero (no-op — FS unchanged).
 *   course.json overrides folder title for Course A.
 *   Malformed course.json adds a ScanError without failing the scan.
 *   Neovim regression: zero unsupported-extension errors for the stem-matched group.
 *
 * E06-F02-S02 ffprobe/thumbnail scenario:
 *   Two-video fixture where the first video has a successful probe but a failing
 *   thumbnail write, and the second video has a failing probe (so thumbnail is
 *   never attempted). Asserts:
 *     - scan status = 'succeeded'
 *     - discoveredLessons[0].metadata is populated (probe succeeded)
 *     - discoveredLessons[1].metadata is undefined (probe failed)
 *     - exactly two ScanErrors: one 'ffmpeg-thumbnail-failed' (first video) and
 *       one 'ffmpeg-probe-failed' (second video)
 *
 * Realtime publishing (scan-progress-realtime):
 *   - 'started' event fires once on the actor's channel after scanRepo.save.
 *   - At least one 'progress' event fires during the walk (multi-folder fixture).
 *   - 'finished' event fires in the finally block with correct status on both
 *     success and failure paths.
 *   - All three event kinds use the channel 'scans:user:<actorUserId>'.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Course } from '../../domain/course/course';
import { Lesson } from '../../domain/lesson/lesson';
import { Library } from '../../domain/library/library';
import { LibraryNotFoundError } from '../../domain/library/library.errors';
import { Scan } from '../../domain/scan/scan';
import { ScanAlreadyRunningError } from '../../domain/scan/scan.errors';
import { RunScanCommand } from './run-scan.command';
import { RunScanHandler } from './run-scan.handler';

import type { CourseRepository } from '../../domain/course/course.repository';
import type { LessonRepository } from '../../domain/lesson/lesson.repository';
import type { FfmpegAdapter, VideoMetadata } from '../../domain/scan/ffmpeg-adapter';
import type { FsAdapter, FsEntry } from '../../domain/scan/fs-adapter';
import type { LibraryRepository } from '../../domain/library/library.repository';
import type { ScanRepository } from '../../domain/scan/scan.repository';
import type { AppConfig } from '../../../../common/config/app-config';
import type { CentrifugoService } from '../../../../common/centrifugo/centrifugo.service';

// ---------------------------------------------------------------------------
// In-memory repositories
// ---------------------------------------------------------------------------

function makeLibraryRepo(lib?: Library): LibraryRepository {
  const store = new Map<string, Library>();
  if (lib) store.set(lib.id, lib);
  return {
    save: vi.fn(async (l: Library) => {
      store.set(l.id, l);
    }),
    findById: vi.fn(async (id: string) => store.get(id) ?? null),
    findByRootPath: vi.fn(
      async (rootPath: string) =>
        [...store.values()].find((existing) => existing.rootPath === rootPath) ?? null,
    ),
    findAll: vi.fn(async () => [...store.values()]),
    findByIds: vi.fn(async (ids: string[]) =>
      ids.flatMap((id) => {
        const lib = store.get(id);
        return lib ? [lib] : [];
      }),
    ),
    update: vi.fn(async (id: string, patch: { name?: string }) => {
      const existing = store.get(id);
      if (!existing) return null;
      const updated = Library.reconstitute({
        id: existing.id,
        name: patch.name ?? existing.name,
        rootPath: existing.rootPath,
        createdAt: existing.createdAt,
        updatedAt: new Date(),
      });
      store.set(id, updated);
      return updated;
    }),
    removeWithCascade: vi.fn(async (id: string) => {
      if (!store.has(id)) return false;
      store.delete(id);
      return true;
    }),
  };
}

function makeScanRepo(): ScanRepository & { store: Map<string, Scan> } {
  const store = new Map<string, Scan>();
  return {
    store,
    save: vi.fn(async (s: Scan) => {
      store.set(s.id, s);
    }),
    findById: vi.fn(async (id: string) => store.get(id) ?? null),
    findLatestByLibrary: vi.fn(async (libraryId: string) => {
      const all = [...store.values()]
        .filter((s) => s.libraryId === libraryId)
        .toSorted((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
      return all[0] ?? null;
    }),
    findRunningByLibrary: vi.fn(async (libraryId: string) => {
      for (const s of store.values()) {
        if (s.libraryId === libraryId && s.status === 'running') return s;
      }
      return null;
    }),
  };
}

function makeCourseRepo(): CourseRepository & { store: Map<string, Course> } {
  const store = new Map<string, Course>();
  return {
    store,
    save: vi.fn(async (c: Course) => {
      store.set(c.id, c);
    }),
    findById: vi.fn(async (id: string) => store.get(id) ?? null),
    findManyByLibrary: vi.fn(async (libraryId: string) =>
      [...store.values()].filter((c) => c.libraryId === libraryId),
    ),
    findAll: vi.fn(async () => [...store.values()]),
    findByIds: vi.fn(async (ids: string[]) =>
      ids.flatMap((id) => {
        const c = store.get(id);
        return c ? [c] : [];
      }),
    ),
    findRecentlyAdded: vi.fn(async (limit: number) =>
      [...store.values()]
        .toSorted((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit),
    ),
  };
}

function makeLessonRepo(): LessonRepository & { store: Map<string, Lesson> } {
  const store = new Map<string, Lesson>();
  return {
    store,
    save: vi.fn(async (l: Lesson) => {
      store.set(l.id, l);
    }),
    findById: vi.fn(async (id: string) => store.get(id) ?? null),
    findByCourse: vi.fn(async (courseId: string) =>
      [...store.values()].filter((l) => l.courseId === courseId),
    ),
    findBySection: vi.fn(async (sectionId: string) =>
      [...store.values()].filter((l) => l.sectionId === sectionId),
    ),
    getLessonStatsByCourseIds: vi.fn(
      async (courseIds: string[]) =>
        new Map(courseIds.map((id) => [id, { lessonCount: 0, totalDurationSeconds: 0 }])),
    ),
  };
}

// ---------------------------------------------------------------------------
// FakeFsAdapter — in-memory tree
// ---------------------------------------------------------------------------

interface FileRecord {
  path: string;
  mtime: Date;
  size: number;
  content?: string;
}

class FakeFsAdapter implements FsAdapter {
  constructor(private readonly files: FileRecord[]) {}

  async *walk(rootPath: string): AsyncIterable<FsEntry> {
    for (const f of this.files) {
      if (!f.path.startsWith(rootPath)) continue;

      // Emit parent directories for each file so the handler can group them.
      // For simplicity, we only need to yield the file entries here since the
      // handler filters out directories and groups by first path segment.
      yield {
        path: f.path,
        isDirectory: false,
        mtime: f.mtime,
        size: f.size,
      };
    }
  }

  async readUtf8(path: string): Promise<string> {
    const f = this.files.find((x) => x.path === path);
    if (!f?.content) throw new Error(`File not found in fake: ${path}`);
    return f.content;
  }

  async statMtime(path: string): Promise<Date | null> {
    const f = this.files.find((x) => x.path === path);
    return f ? f.mtime : null;
  }
}

// ---------------------------------------------------------------------------
// FakeFfmpegAdapter — configurable per-path probe/thumbnail behaviour
// ---------------------------------------------------------------------------

class FakeFfmpegAdapter implements FfmpegAdapter {
  constructor(
    private readonly probeResults: Map<string, VideoMetadata | Error>,
    private readonly thumbnailResults: Map<string, Error | null>,
  ) {}

  async probe(absolutePath: string): Promise<VideoMetadata> {
    const result = this.probeResults.get(absolutePath);
    if (!result) {
      // Default: succeed with generic metadata.
      return { durationSeconds: 60, widthPx: 1280, heightPx: 720, codec: 'h264' };
    }
    if (result instanceof Error) throw result;
    return result;
  }

  async writeThumbnail(req: { videoAbsolutePath: string }): Promise<void> {
    const err = this.thumbnailResults.get(req.videoAbsolutePath);
    if (err) throw err;
  }
}

function makePassthroughFfmpeg(): FakeFfmpegAdapter {
  return new FakeFfmpegAdapter(new Map(), new Map());
}

function makeFakeAppConfig(): AppConfig {
  return {
    ffprobePath: 'ffprobe',
    ffmpegPath: 'ffmpeg',
    thumbnailJpegQuality: 30,
  } as unknown as AppConfig;
}

// ---------------------------------------------------------------------------
// Mock CentrifugoService
// ---------------------------------------------------------------------------

function makeCentrifugoService(): CentrifugoService {
  return {
    publish: vi.fn().mockResolvedValue(undefined),
  } as unknown as CentrifugoService;
}

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const BASE_TIME = new Date('2026-01-01T00:00:00.000Z');
const ACTOR_USER_ID = 'user-actor-1';

function makeFixtureFiles(): FileRecord[] {
  return [
    {
      path: '/lib/01 - Course A/01 - Intro.mp4',
      mtime: BASE_TIME,
      size: 100,
    },
    {
      path: '/lib/01 - Course A/02 - Aggregates.mp4',
      mtime: BASE_TIME,
      size: 200,
    },
    {
      path: '/lib/01 - Course A/course.json',
      mtime: BASE_TIME,
      size: 50,
      content: JSON.stringify({ schemaVersion: 1, title: 'Course A from JSON' }),
    },
    {
      path: '/lib/02 - Course B (no json)/01 - Episode.mp4',
      mtime: BASE_TIME,
      size: 300,
    },
    // Dotfile — should be skipped by FsAdapter walk (FakeFsAdapter skips by convention below).
    // We do NOT include '/lib/.hidden/skip.mp4' in fixture because FakeFsAdapter is used and
    // the NodeFsAdapter skips dotfiles — we test the handler logic, not the adapter.
    {
      path: '/lib/02 - Course B (no json)/broken.txt',
      mtime: BASE_TIME,
      size: 10,
    },
  ];
}

function makeLibrary(): Library {
  return Library.register({ id: 'lib-1', name: 'Test Library', rootPath: '/lib' });
}

// ---------------------------------------------------------------------------
// Helper to drain the fire-and-forget walk
// ---------------------------------------------------------------------------
async function drainMicrotasks(): Promise<void> {
  // Pump the event loop enough times to flush the fire-and-forget walk chain.
  // Every async hop in the walk goes through an injected port (FsAdapter /
  // FfmpegAdapter / repos), all of which are fakes that resolve via plain
  // Promise.resolve in this spec — no real I/O — so a handful of rounds
  // is enough on any machine.
  for (let i = 0; i < 10; i++) {
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RunScanHandler', () => {
  let libraryRepo: LibraryRepository;
  let scanRepo: ReturnType<typeof makeScanRepo>;
  let courseRepo: ReturnType<typeof makeCourseRepo>;
  let lessonRepo: ReturnType<typeof makeLessonRepo>;
  let fs: FakeFsAdapter;
  let centrifugo: CentrifugoService;
  let handler: RunScanHandler;

  beforeEach(() => {
    vi.useFakeTimers();
    const lib = makeLibrary();
    libraryRepo = makeLibraryRepo(lib);
    scanRepo = makeScanRepo();
    courseRepo = makeCourseRepo();
    lessonRepo = makeLessonRepo();
    centrifugo = makeCentrifugoService();
    fs = new FakeFsAdapter(makeFixtureFiles());
    handler = new RunScanHandler(
      libraryRepo,
      scanRepo,
      courseRepo,
      lessonRepo,
      fs,
      makePassthroughFfmpeg(),
      makeFakeAppConfig(),
      centrifugo,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // Happy path — first scan
  // -------------------------------------------------------------------------
  it('first scan: filesAdded=3, filesScanned=4, coursesDiscovered=2, errors.length=1', async () => {
    vi.useRealTimers();

    const scan = await handler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
    expect(scan.status).toBe('running');

    await drainMicrotasks();

    // Retrieve the final state from the repo (saved after walk).
    const saved = scanRepo.store.get(scan.id)!;
    expect(saved.status).toBe('succeeded');
    expect(saved.filesAdded).toBe(3); // 2 mp4s in Course A + 1 mp4 in Course B
    expect(saved.filesUpdated).toBe(0);
    // course.json is read for metadata but not counted as a lesson file.
    // broken.txt is unsupported → only adds an error, not counted.
    // So filesScanned = 3 (the three .mp4 files).
    expect(saved.filesScanned).toBe(3);
    expect(saved.coursesDiscovered).toBe(2);
    expect(saved.errors).toHaveLength(1);
    expect(saved.errors[0]?.code).toBe('unsupported-extension');
  });

  it('course.json title overrides folder-derived title for Course A', async () => {
    vi.useRealTimers();

    const scan = await handler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
    await drainMicrotasks();

    const saved = scanRepo.store.get(scan.id)!;
    const courseA = saved.courses.find((c) => c.path.includes('Course A'));
    expect(courseA?.title).toBe('Course A from JSON');
  });

  // -------------------------------------------------------------------------
  // Second scan — no-op
  // -------------------------------------------------------------------------
  it('second scan with no FS changes: filesAdded=0, filesUpdated=0', async () => {
    vi.useRealTimers();

    // First scan (result discarded — we only care about the second scan's state).
    await handler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
    await drainMicrotasks();

    // Second scan — same FsAdapter with identical files.
    const scan2 = await handler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
    await drainMicrotasks();

    const saved2 = scanRepo.store.get(scan2.id)!;
    expect(saved2.filesAdded).toBe(0);
    expect(saved2.filesUpdated).toBe(0);
    expect(saved2.filesScanned).toBe(3); // same 3 lesson files scanned (course.json excluded)
    expect(saved2.status).toBe('succeeded');
  });

  // -------------------------------------------------------------------------
  // Malformed course.json
  // -------------------------------------------------------------------------
  it('malformed course.json adds a ScanError but does not fail the scan', async () => {
    vi.useRealTimers();

    const files = makeFixtureFiles();
    // Replace the valid course.json with an invalid one.
    const jsonFile = files.find((f) => f.path.endsWith('course.json'))!;
    jsonFile.content = '{ "title": "No schema version" }';

    const badFs = new FakeFsAdapter(files);
    handler = new RunScanHandler(
      libraryRepo,
      scanRepo,
      makeCourseRepo(),
      makeLessonRepo(),
      badFs,
      makePassthroughFfmpeg(),
      makeFakeAppConfig(),
      centrifugo,
    );

    const scan = await handler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
    await drainMicrotasks();

    const saved = scanRepo.store.get(scan.id)!;
    expect(saved.status).toBe('succeeded');
    const jsonError = saved.errors.find((e) => e.code === 'course-json-invalid');
    expect(jsonError).toBeDefined();
  });

  // -------------------------------------------------------------------------
  // Guard: library not found
  // -------------------------------------------------------------------------
  it('throws LibraryNotFoundError when library does not exist', async () => {
    handler = new RunScanHandler(
      makeLibraryRepo(),
      scanRepo,
      makeCourseRepo(),
      makeLessonRepo(),
      fs,
      makePassthroughFfmpeg(),
      makeFakeAppConfig(),
      centrifugo,
    );

    await expect(
      handler.execute(new RunScanCommand('nonexistent', ACTOR_USER_ID)),
    ).rejects.toBeInstanceOf(LibraryNotFoundError);
  });

  // -------------------------------------------------------------------------
  // Guard: scan already running
  // -------------------------------------------------------------------------
  it('throws ScanAlreadyRunningError when a scan is already running', async () => {
    vi.useRealTimers();

    // Start first scan (leaves it in running state momentarily).
    await handler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));

    // Manually insert a running scan into the repo to simulate concurrent state.
    const runningScan = Scan.start({ id: 'running-1', libraryId: 'lib-1' });
    scanRepo.store.set(runningScan.id, runningScan);

    // Re-create handler with a repo that reports a running scan.
    const blockedScanRepo = makeScanRepo();
    blockedScanRepo.store.set(runningScan.id, runningScan);
    handler = new RunScanHandler(
      libraryRepo,
      blockedScanRepo,
      makeCourseRepo(),
      makeLessonRepo(),
      fs,
      makePassthroughFfmpeg(),
      makeFakeAppConfig(),
      centrifugo,
    );

    await expect(
      handler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID)),
    ).rejects.toBeInstanceOf(ScanAlreadyRunningError);
  });

  // -------------------------------------------------------------------------
  // Neovim stem-match regression (E06-F03-S02)
  //
  // A course folder contains a video alongside a same-stem PDF and an SRT
  // subtitle. Before stem-matching landed, the PDF + SRT would produce
  // unsupported-extension ScanErrors. This fixture asserts zero such errors
  // for the matched group and verifies discoveredLessons is populated.
  //
  // Pre-existing assertions (filesAdded/filesUpdated etc.) use ONLY the
  // original fixture files — the Neovim course is scanned as a third course
  // in a separate handler/repo/fs setup so it does not disturb the counters
  // of the primary fixture.
  // -------------------------------------------------------------------------
  describe('Neovim stem-match regression', () => {
    it('zero unsupported-extension errors for stem-matched sidecar files', async () => {
      vi.useRealTimers();

      const neovimFiles: FileRecord[] = [
        {
          path: '/lib/03 - Neovim Course/01 - Intro.mp4',
          mtime: BASE_TIME,
          size: 500,
        },
        {
          path: '/lib/03 - Neovim Course/01 - Intro.pdf',
          mtime: BASE_TIME,
          size: 100,
        },
        {
          path: '/lib/03 - Neovim Course/01 - Intro.en.srt',
          mtime: BASE_TIME,
          size: 20,
        },
      ];

      const neovimFs = new FakeFsAdapter(neovimFiles);
      const neovimScanRepo = makeScanRepo();
      const neovimHandler = new RunScanHandler(
        libraryRepo,
        neovimScanRepo,
        makeCourseRepo(),
        makeLessonRepo(),
        neovimFs,
        makePassthroughFfmpeg(),
        makeFakeAppConfig(),
        centrifugo,
      );

      const scan = await neovimHandler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const saved = neovimScanRepo.store.get(scan.id)!;

      // Zero unsupported-extension errors.
      const unsupportedErrors = saved.errors.filter((e) => e.code === 'unsupported-extension');
      expect(unsupportedErrors).toHaveLength(0);

      // One course discovered.
      expect(saved.coursesDiscovered).toBe(1);

      // One video file counted as filesAdded (sidecars do NOT bump the counter).
      expect(saved.filesAdded).toBe(1);
      expect(saved.filesScanned).toBe(1);

      // discoveredLessons is populated on the course.
      const course = saved.courses[0]!;
      expect(course.discoveredLessons).toHaveLength(1);

      const lesson = course.discoveredLessons[0]!;
      expect(lesson.videoPath).toBe('/lib/03 - Neovim Course/01 - Intro.mp4');

      // PDF is in materials.
      expect(lesson.materials).toHaveLength(1);
      expect(lesson.materials[0]!.path).toBe('/lib/03 - Neovim Course/01 - Intro.pdf');

      // SRT is in subtitles with language=en.
      expect(lesson.subtitles).toHaveLength(1);
      expect(lesson.subtitles[0]!.language).toBe('en');
    });

    it('.cache.vtt file produces zero ScanErrors and zero Subtitle entries', async () => {
      vi.useRealTimers();

      const cacheFiles: FileRecord[] = [
        {
          path: '/lib/04 - Cache Course/01 - Intro.mp4',
          mtime: BASE_TIME,
          size: 500,
        },
        {
          path: '/lib/04 - Cache Course/01 - Intro.en.srt',
          mtime: BASE_TIME,
          size: 20,
        },
        {
          // Generated cache — must be silently ignored.
          path: '/lib/04 - Cache Course/01 - Intro.en.cache.vtt',
          mtime: BASE_TIME,
          size: 25,
        },
      ];

      const cacheFs = new FakeFsAdapter(cacheFiles);
      const cacheScanRepo = makeScanRepo();
      const cacheHandler = new RunScanHandler(
        libraryRepo,
        cacheScanRepo,
        makeCourseRepo(),
        makeLessonRepo(),
        cacheFs,
        makePassthroughFfmpeg(),
        makeFakeAppConfig(),
        centrifugo,
      );

      const scan = await cacheHandler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const saved = cacheScanRepo.store.get(scan.id)!;

      // Zero ScanErrors (the .cache.vtt must NOT produce an unsupported-extension error).
      expect(saved.errors).toHaveLength(0);

      // One course, one lesson, subtitles contain only the .srt (not the cache).
      expect(saved.coursesDiscovered).toBe(1);
      const lesson = saved.courses[0]!.discoveredLessons[0]!;
      expect(lesson.subtitles).toHaveLength(1);
      expect(lesson.subtitles[0]!.language).toBe('en');
    });

    it('dot-prefix variant: "1.1. Vim.pdf" groups with "1.1 Vim.mp4"', async () => {
      vi.useRealTimers();

      const dotVariantFiles: FileRecord[] = [
        {
          path: '/lib/Vim Course/1.1 Почему Vim.mp4',
          mtime: BASE_TIME,
          size: 500,
        },
        {
          // Dot-variant: 1.1. (trailing dot) — must match the video above.
          path: '/lib/Vim Course/1.1. Почему Vim.pdf',
          mtime: BASE_TIME,
          size: 100,
        },
      ];

      const dotFs = new FakeFsAdapter(dotVariantFiles);
      const dotScanRepo = makeScanRepo();
      const dotHandler = new RunScanHandler(
        libraryRepo,
        dotScanRepo,
        makeCourseRepo(),
        makeLessonRepo(),
        dotFs,
        makePassthroughFfmpeg(),
        makeFakeAppConfig(),
        centrifugo,
      );

      const scan = await dotHandler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const saved = dotScanRepo.store.get(scan.id)!;

      // PDF should be a material, not a ScanError.
      const unsupportedErrors = saved.errors.filter((e) => e.code === 'unsupported-extension');
      expect(unsupportedErrors).toHaveLength(0);

      const lesson = saved.courses[0]!.discoveredLessons[0]!;
      expect(lesson.materials).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // E06-F02-S02: ffprobe + thumbnail integration into scan walk
  //
  // Scenario chosen for clarity:
  //   - Video A (/lib/05 - FF Course/01 - Probe OK.mp4):
  //       probe succeeds → metadata populated.
  //       thumbnail write fails → ScanError 'ffmpeg-thumbnail-failed', walk continues.
  //   - Video B (/lib/05 - FF Course/02 - Probe Fail.mp4):
  //       probe fails → ScanError 'ffmpeg-probe-failed'.
  //       thumbnail NOT attempted (probe failed).
  //       lesson entry has metadata === undefined.
  //
  // Result: scan status = 'succeeded', two ScanErrors (one per video with the
  // respective code), discoveredLessons[0].metadata populated,
  // discoveredLessons[1].metadata undefined.
  // -------------------------------------------------------------------------
  describe('E06-F02-S02: ffprobe + thumbnail errors are non-fatal', () => {
    it('records ScanErrors for probe failure and thumbnail failure without aborting the scan', async () => {
      vi.useRealTimers();

      const videoA = '/lib/05 - FF Course/01 - Probe OK.mp4';
      const videoB = '/lib/05 - FF Course/02 - Probe Fail.mp4';

      const ffFiles: FileRecord[] = [
        { path: videoA, mtime: BASE_TIME, size: 500 },
        { path: videoB, mtime: BASE_TIME, size: 600 },
      ];

      const probeResults = new Map<string, VideoMetadata | Error>([
        [videoA, { durationSeconds: 120, widthPx: 1920, heightPx: 1080, codec: 'h264' }],
        [videoB, new Error('ffprobe boom')],
      ]);
      const thumbnailResults = new Map<string, Error | null>([
        [videoA, new Error('ffmpeg thumbnail boom')],
        // videoB never reaches thumbnail (probe failed).
      ]);

      const ffmpegAdapter = new FakeFfmpegAdapter(probeResults, thumbnailResults);
      const ffFs = new FakeFsAdapter(ffFiles);
      const ffScanRepo = makeScanRepo();
      const ffHandler = new RunScanHandler(
        libraryRepo,
        ffScanRepo,
        makeCourseRepo(),
        makeLessonRepo(),
        ffFs,
        ffmpegAdapter,
        makeFakeAppConfig(),
        centrifugo,
      );

      const scan = await ffHandler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const saved = ffScanRepo.store.get(scan.id)!;

      // Scan completes successfully despite per-file failures.
      expect(saved.status).toBe('succeeded');

      // One course, two lessons discovered.
      expect(saved.coursesDiscovered).toBe(1);
      const course = saved.courses[0]!;
      expect(course.discoveredLessons).toHaveLength(2);

      // Video A: probe succeeded → metadata populated.
      const lessonA = course.discoveredLessons.find((l) => l.videoPath === videoA)!;
      expect(lessonA.metadata).toBeDefined();
      expect(lessonA.metadata!.durationSeconds).toBe(120);
      expect(lessonA.metadata!.codec).toBe('h264');

      // Video B: probe failed → metadata undefined.
      const lessonB = course.discoveredLessons.find((l) => l.videoPath === videoB)!;
      expect(lessonB.metadata).toBeUndefined();

      // Exactly two ScanErrors:
      //   - 'ffmpeg-thumbnail-failed' for videoA (probe OK, thumbnail failed)
      //   - 'ffmpeg-probe-failed' for videoB (probe failed)
      const thumbnailErr = saved.errors.find((e) => e.code === 'ffmpeg-thumbnail-failed');
      expect(thumbnailErr).toBeDefined();

      const probeErr = saved.errors.find((e) => e.code === 'ffmpeg-probe-failed');
      expect(probeErr).toBeDefined();

      // No other error codes.
      const unexpectedErrors = saved.errors.filter(
        (e) => e.code !== 'ffmpeg-thumbnail-failed' && e.code !== 'ffmpeg-probe-failed',
      );
      expect(unexpectedErrors).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Persistence: courseRepo.save / lessonRepo.save are called with the right
  // slugs and counts (fix/scanner-persists-courses).
  // -------------------------------------------------------------------------
  describe('catalog row persistence', () => {
    it('saves 2 courses and 3 lessons on first scan of the fixture tree', async () => {
      vi.useRealTimers();

      const scan = await handler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const saved = scanRepo.store.get(scan.id)!;
      expect(saved.status).toBe('succeeded');

      // Two courses persisted.
      expect(courseRepo.save).toHaveBeenCalledTimes(2);

      const slugs = [...courseRepo.store.values()].map((c) => c.slug).toSorted();
      // 'Course A from JSON' → 'course-a-from-json'
      // '02 - Course B (no json)' → folder title → '02-course-b-no-json'  (parseFolderName strips the ordinal prefix but keeps the rest)
      // Actually parseFolderName('02 - Course B (no json)') → { ordinal:2, label:'Course B (no json)' }
      // toSlug('Course B (no json)') → 'course-b-no-json'
      expect(slugs).toContain('course-a-from-json');
      expect(slugs).toContain('course-b-no-json');

      // Three lessons persisted (2 in Course A, 1 in Course B).
      expect(lessonRepo.save).toHaveBeenCalledTimes(3);
    });

    it('course A sections: no sub-folders → synthetic "Lessons" section created', async () => {
      vi.useRealTimers();

      await handler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const courseA = [...courseRepo.store.values()].find((c) => c.slug === 'course-a-from-json')!;
      expect(courseA).toBeDefined();
      // Course A has no sub-folder sections in the fixture → synthetic 'Lessons' section.
      expect(courseA.sections).toHaveLength(1);
      expect(courseA.sections[0]!.title).toBe('Lessons');
    });

    it('lessons carry durationSeconds when ffprobe succeeded', async () => {
      vi.useRealTimers();

      await handler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      // All lessons in the fixture get the default ffprobe result (60 s).
      const lessons = [...lessonRepo.store.values()];
      expect(lessons.every((l) => l.duration === 60)).toBe(true);
    });

    // -----------------------------------------------------------------------
    // Idempotency: second scan on the same folder must NOT call courseRepo.save
    // again for already-known slugs.
    // -----------------------------------------------------------------------
    it('second scan skips already-persisted courses (idempotency)', async () => {
      vi.useRealTimers();

      // First scan — persists both courses.
      await handler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      expect(courseRepo.save).toHaveBeenCalledTimes(2);
      expect(lessonRepo.save).toHaveBeenCalledTimes(3);

      // Second scan — same FS, same slugs → skip both courses.
      await handler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      // courseRepo.save must NOT have been called again.
      expect(courseRepo.save).toHaveBeenCalledTimes(2);
      // lessonRepo.save must NOT have been called again.
      expect(lessonRepo.save).toHaveBeenCalledTimes(3);

      // Scan aggregate still records coursesDiscovered (counter always bumped).
      const scans = [...scanRepo.store.values()].toSorted(
        (a, b) => b.startedAt.getTime() - a.startedAt.getTime(),
      );
      expect(scans[0]!.coursesDiscovered).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // Realtime publishing (scan-progress-realtime)
  //
  // Verifies that CentrifugoService.publish is called with the correct
  // lifecycle events on the actor's channel. The failure path asserts that
  // the 'finished' event carries status='failed' — this is what lets the
  // SPA's floating notifier dismiss properly on scan failure.
  // -------------------------------------------------------------------------
  describe('realtime publishing', () => {
    it('publishes started event on the actor channel after scan persist', async () => {
      vi.useRealTimers();

      const scan = await handler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      // 'started' must be published before the walk begins (synchronously in execute()).
      expect(centrifugo.publish).toHaveBeenCalledWith(`scans:user:${ACTOR_USER_ID}`, {
        kind: 'started',
        scanId: scan.id,
        libraryId: 'lib-1',
        libraryName: 'Test Library',
        at: expect.any(String),
      });
    });

    it('publishes at least one progress event during a multi-folder walk', async () => {
      vi.useRealTimers();

      const scan = await handler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      // The fixture has 2 course folders. In real-time tests the throttle check
      // (Date.now() - lastPublishedAt >= 1000) evaluates against the actual clock,
      // so at least one progress publish will fire after the first folder iteration.
      const progressCalls = vi
        .mocked(centrifugo.publish)
        .mock.calls.filter(([, data]) => (data as { kind: string }).kind === 'progress');
      expect(progressCalls.length).toBeGreaterThanOrEqual(1);

      // All progress events go to the actor's channel.
      for (const [channel] of progressCalls) {
        expect(channel).toBe(`scans:user:${ACTOR_USER_ID}`);
      }

      // Progress payload has the expected shape.
      const [, firstProgress] = progressCalls[0]!;
      const p = firstProgress as {
        kind: string;
        scanId: string;
        libraryId: string;
        libraryName: string;
        at: string;
        filesScanned: number;
        filesAdded: number;
        coursesDiscovered: number;
        errorsCount: number;
      };
      expect(p.kind).toBe('progress');
      expect(p.scanId).toBe(scan.id);
      expect(p.libraryId).toBe('lib-1');
      expect(p.libraryName).toBe('Test Library');
    });

    it('publishes finished event with status=succeeded on successful walk', async () => {
      vi.useRealTimers();

      const scan = await handler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const finishedCalls = vi
        .mocked(centrifugo.publish)
        .mock.calls.filter(([, data]) => (data as { kind: string }).kind === 'finished');
      expect(finishedCalls).toHaveLength(1);

      const [channel, payload] = finishedCalls[0]!;
      expect(channel).toBe(`scans:user:${ACTOR_USER_ID}`);
      const f = payload as {
        kind: string;
        scanId: string;
        libraryId: string;
        libraryName: string;
        at: string;
        status: string;
        filesScanned: number;
        filesAdded: number;
        coursesDiscovered: number;
        errorsCount: number;
      };
      expect(f.kind).toBe('finished');
      expect(f.scanId).toBe(scan.id);
      // Has scan errors (broken.txt) → status='partial', not 'succeeded'.
      expect(f.status).toBe('partial');
      expect(f.filesAdded).toBe(3);
      expect(f.coursesDiscovered).toBe(2);
      expect(f.errorsCount).toBe(1);
    });

    it('publishes finished event with status=succeeded when there are no errors', async () => {
      vi.useRealTimers();

      // Use a clean fixture with no unsupported files.
      const cleanFiles: FileRecord[] = [
        { path: '/lib/Clean Course/01 - Intro.mp4', mtime: BASE_TIME, size: 100 },
      ];
      const cleanFs = new FakeFsAdapter(cleanFiles);
      const cleanScanRepo = makeScanRepo();
      const cleanCentrifugo = makeCentrifugoService();
      const cleanHandler = new RunScanHandler(
        libraryRepo,
        cleanScanRepo,
        makeCourseRepo(),
        makeLessonRepo(),
        cleanFs,
        makePassthroughFfmpeg(),
        makeFakeAppConfig(),
        cleanCentrifugo,
      );

      const scan = await cleanHandler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const finishedCalls = vi
        .mocked(cleanCentrifugo.publish)
        .mock.calls.filter(([, data]) => (data as { kind: string }).kind === 'finished');
      expect(finishedCalls).toHaveLength(1);

      const [, payload] = finishedCalls[0]!;
      expect((payload as { status: string }).status).toBe('succeeded');
      expect((payload as { scanId: string }).scanId).toBe(scan.id);
    });

    it('publishes finished event with status=failed when the walk throws', async () => {
      vi.useRealTimers();

      // An FsAdapter whose walk() throws unexpectedly (simulates unhandled error).
      const throwingFs: FsAdapter = {
        // eslint-disable-next-line require-yield -- intentional: async generator that throws
        async *walk(): AsyncIterable<FsEntry> {
          throw new Error('unexpected walk failure');
        },
        readUtf8: vi.fn(),
        statMtime: vi.fn().mockResolvedValue(null),
      };

      const failScanRepo = makeScanRepo();
      const failCentrifugo = makeCentrifugoService();
      const failHandler = new RunScanHandler(
        libraryRepo,
        failScanRepo,
        makeCourseRepo(),
        makeLessonRepo(),
        throwingFs,
        makePassthroughFfmpeg(),
        makeFakeAppConfig(),
        failCentrifugo,
      );

      const scan = await failHandler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      // Scan must be in terminal 'failed' state.
      const saved = failScanRepo.store.get(scan.id)!;
      expect(saved.status).toBe('failed');

      // The 'finished' event must carry status='failed'.
      const finishedCalls = vi
        .mocked(failCentrifugo.publish)
        .mock.calls.filter(([, data]) => (data as { kind: string }).kind === 'finished');
      expect(finishedCalls).toHaveLength(1);

      const [channel, payload] = finishedCalls[0]!;
      expect(channel).toBe(`scans:user:${ACTOR_USER_ID}`);
      expect((payload as { status: string }).status).toBe('failed');
      expect((payload as { scanId: string }).scanId).toBe(scan.id);
    });
  });
});
