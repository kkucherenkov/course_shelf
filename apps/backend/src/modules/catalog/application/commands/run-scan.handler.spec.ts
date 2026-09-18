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
 *   /lib/02 - Course B (no json)/broken.txt → no sibling video, silently skipped (#523)
 *
 * Stem-match regression fixture (E06-F03-S02):
 *   /lib/03 - Neovim Course/01 - Intro.mp4
 *   /lib/03 - Neovim Course/01 - Intro.pdf    → material, NOT a ScanError
 *   /lib/03 - Neovim Course/01 - Intro.en.srt → subtitle (lang=en), NOT a ScanError
 *
 * Acceptance assertions per the story:
 *   First scan:  coursesDiscovered=2, filesAdded=3, filesUpdated=0, filesScanned=3,
 *                errors.length=0.
 *   Second scan: all counters zero (no-op — FS unchanged).
 *   course.json overrides folder title for Course A.
 *   Malformed course.json adds a ScanError without failing the scan.
 *   Neovim regression: zero unsupported-extension errors for the stem-matched group.
 *
 * E06-F02-S02 ffprobe/thumbnail scenario:
 *   Two-video fixture where the first video has a successful probe but a failing
 *   thumbnail write, and the second video has a failing probe (so thumbnail is
 *   never attempted). Asserts:
 *     - scan status = 'partial' (two ScanErrors recorded)
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

// The thumbnail write now mkdir's its parent under the derived volume
// (E25-F04-S01) — mocked for the same reason run-transcription.handler.spec.ts
// mocks it: no real disk I/O in a unit test, and FsAdapter isn't the port that
// call goes through (mirrors `run-transcription.handler.ts`'s own mkdir).
vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn(async () => undefined),
}));

import path from 'node:path';

import { Course } from '../../domain/course/course';
import { CourseNotFoundError } from '../../domain/course/course.errors';
import { Instructor } from '../../domain/instructor/instructor';
import { InstructorSlugAlreadyTakenError } from '../../domain/instructor/instructor.errors';
import { Lesson } from '../../domain/lesson/lesson';
import { LessonPositionConflictError } from '../../domain/lesson/lesson.errors';
import { Library } from '../../domain/library/library';
import { LibraryNotFoundError } from '../../domain/library/library.errors';
import { Studio } from '../../domain/studio/studio';
import { Tag } from '../../domain/tag/tag';
import { Scan } from '../../domain/scan/scan';
import { ScanAlreadyRunningError } from '../../domain/scan/scan.errors';
import { slugify } from '../../domain/shared-vo/entity-slug';
import { LibraryRelativePath } from '../../domain/shared-vo/library-relative-path';
import { MetadataLinker } from '../scan/metadata-linker';
import { PosterSyncService } from '../scan/poster-sync.service';
import { RunScanCommand } from './run-scan.command';
import { RunScanHandler } from './run-scan.handler';

import type { CourseRepository } from '../../domain/course/course.repository';
import type { InstructorRepository } from '../../domain/instructor/instructor.repository';
import type { StudioRepository } from '../../domain/studio/studio.repository';
import type { TagRepository } from '../../domain/tag/tag.repository';
import type { LessonRepository } from '../../domain/lesson/lesson.repository';
import type { FfmpegAdapter, VideoMetadata } from '../../domain/scan/ffmpeg-adapter';
import type { FsAdapter, FsEntry } from '../../domain/scan/fs-adapter';
import type { LibraryRepository } from '../../domain/library/library.repository';
import type { ScanRepository } from '../../domain/scan/scan.repository';
import type { TranscriptRepository } from '../../domain/transcription/transcript.repository';
import type { PosterDownloader } from '../../domain/course/poster-downloader.port';
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

/** Same lesson at a different position — `Lesson.position` is readonly. */
function withPosition(lesson: Lesson, position: number): Lesson {
  return Lesson.reconstitute({
    id: lesson.id,
    courseId: lesson.courseId,
    sectionId: lesson.sectionId,
    position,
    title: lesson.title,
    videoPath: LibraryRelativePath.reconstitute(lesson.videoPath),
    mtime: lesson.mtime,
    sizeBytes: lesson.sizeBytes,
    duration: lesson.duration,
    createdAt: lesson.createdAt,
    updatedAt: lesson.updatedAt,
    materials: [...lesson.materials],
    subtitles: [...lesson.subtitles],
  });
}

/** Mirrors PrismaLessonRepository's park offset — see that adapter. */
const PARK_OFFSET = 1_000_000;

function makeLessonRepo(): LessonRepository & { store: Map<string, Lesson> } {
  const store = new Map<string, Lesson>();
  return {
    store,
    save: vi.fn(async (l: Lesson) => {
      // The DB holds @@unique([sectionId, position]) and the adapter turns the
      // P2002 into LessonPositionConflictError. The fake enforces it too: a
      // resync renumbers a whole section, and a fake that accepts two lessons
      // on one position would let exactly the production failure through green.
      const clash = [...store.values()].find(
        (existing) =>
          existing.id !== l.id &&
          existing.sectionId === l.sectionId &&
          existing.position === l.position,
      );
      if (clash) {
        throw new LessonPositionConflictError(
          `Lesson at position ${String(l.position)} already exists in section "${l.sectionId}".`,
        );
      }
      store.set(l.id, l);
    }),
    findById: vi.fn(async (id: string) => store.get(id) ?? null),
    findByCourse: vi.fn(async (courseId: string) =>
      [...store.values()].filter((l) => l.courseId === courseId),
    ),
    findBySection: vi.fn(async (sectionId: string) =>
      [...store.values()].filter((l) => l.sectionId === sectionId),
    ),
    parkPositionsForResync: vi.fn(async (courseId: string) => {
      for (const [id, l] of store) {
        if (l.courseId !== courseId) continue;
        store.set(id, withPosition(l, l.position - PARK_OFFSET));
      }
    }),
    removeMany: vi.fn(async (lessonIds: readonly string[]) => {
      for (const id of lessonIds) store.delete(id);
    }),
    getLessonStatsByCourseIds: vi.fn(
      async (courseIds: string[]) =>
        new Map(courseIds.map((id) => [id, { lessonCount: 0, totalDurationSeconds: 0 }])),
    ),
    // Mechanical stub for LessonRepository's #497 addition — this fake's
    // callers (run-scan.handler.ts) never call it.
    existsByIds: vi.fn().mockResolvedValue(new Set()),
  };
}

function makeInstructorRepo(): InstructorRepository & { store: Map<string, Instructor> } {
  const store = new Map<string, Instructor>();
  const bySlug = new Map<string, Instructor>();
  return {
    store,
    save: vi.fn(async (inst: Instructor) => {
      if (bySlug.has(inst.slug)) {
        throw new InstructorSlugAlreadyTakenError(inst.slug);
      }
      store.set(inst.id, inst);
      bySlug.set(inst.slug, inst);
    }),
    findById: vi.fn(async (id: string) => store.get(id) ?? null),
    findBySlug: vi.fn(async (slug: string) => bySlug.get(slug) ?? null),
    findByExternalId: vi.fn(async () => null),
    findManyByIds: vi.fn(async () => []),
    findManyPaginated: vi.fn(async () => []),
    count: vi.fn(async () => 0),
    findCoursesForInstructor: vi.fn(async () => ({ courseIds: [], total: 0 })),
  };
}

function makeStudioRepo(): StudioRepository & { store: Map<string, Studio> } {
  const store = new Map<string, Studio>();
  const bySlug = new Map<string, Studio>();
  return {
    store,
    save: vi.fn(async (s: Studio) => {
      if (bySlug.has(s.slug)) {
        throw new Error(`Studio slug already taken: ${s.slug}`);
      }
      store.set(s.id, s);
      bySlug.set(s.slug, s);
    }),
    findById: vi.fn(async (id: string) => store.get(id) ?? null),
    findBySlug: vi.fn(async (slug: string) => bySlug.get(slug) ?? null),
    findByExternalId: vi.fn(async () => null),
    findManyByIds: vi.fn(async () => []),
    findManyPaginated: vi.fn(async () => []),
    count: vi.fn(async () => 0),
    findCoursesForStudio: vi.fn(async () => ({ courseIds: [], total: 0 })),
  };
}

function makeTagRepo(): TagRepository & { store: Map<string, Tag> } {
  const store = new Map<string, Tag>();
  const bySlug = new Map<string, Tag>();
  return {
    store,
    save: vi.fn(async (t: Tag) => {
      if (bySlug.has(t.slug)) {
        throw new Error(`Tag slug already taken: ${t.slug}`);
      }
      store.set(t.id, t);
      bySlug.set(t.slug, t);
    }),
    findById: vi.fn(async (id: string) => store.get(id) ?? null),
    findBySlug: vi.fn(async (slug: string) => bySlug.get(slug) ?? null),
    findByExternalId: vi.fn(async () => null),
    findManyByIds: vi.fn(async () => []),
    findManyPaginated: vi.fn(async () => []),
    count: vi.fn(async () => 0),
    findCoursesForTag: vi.fn(async () => ({ courseIds: [], total: 0 })),
  };
}

/** Fake PosterDownloader that never actually reaches the network — resolves undefined (no poster). */
function makePosterDownloader(): PosterDownloader {
  return { download: vi.fn(async () => undefined) };
}

function makePosterSync(downloader?: PosterDownloader): PosterSyncService {
  return new PosterSyncService(downloader ?? makePosterDownloader());
}

function makeMetadataLinker(
  instructorRepo?: InstructorRepository,
  studioRepo?: StudioRepository,
  tagRepo?: TagRepository,
): MetadataLinker {
  return new MetadataLinker(
    instructorRepo ?? makeInstructorRepo(),
    studioRepo ?? makeStudioRepo(),
    tagRepo ?? makeTagRepo(),
  );
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
  /** Every writeThumbnail call, in order — asserted by the derived-path test. */
  readonly thumbnailCalls: { videoAbsolutePath: string; outAbsolutePath: string }[] = [];

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

  async writeThumbnail(req: { videoAbsolutePath: string; outAbsolutePath: string }): Promise<void> {
    this.thumbnailCalls.push({
      videoAbsolutePath: req.videoAbsolutePath,
      outAbsolutePath: req.outAbsolutePath,
    });
    const err = this.thumbnailResults.get(req.videoAbsolutePath);
    if (err) throw err;
  }

  /** Never exercised by the scan walk — the transcription run is the only caller. */
  async extractAudio(): Promise<void> {
    throw new Error('extractAudio is not part of the scan walk');
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
    derivedPath: '/derived',
  } as unknown as AppConfig;
}

// ---------------------------------------------------------------------------
// In-memory TranscriptRepository fake
// ---------------------------------------------------------------------------

interface FakeTranscriptRow {
  origin: 'sidecar' | 'generated';
  sourceMtime: Date;
  sourceSize: number;
}

// Keyed by `${lessonId}:${language}` — mirrors the table's unique constraint.
function transcriptRowKey(lessonId: string, language: string): string {
  return `${lessonId}:${language}`;
}

function makeTranscriptRepo(): TranscriptRepository & { store: Map<string, FakeTranscriptRow> } {
  const store = new Map<string, FakeTranscriptRow>();
  const key = transcriptRowKey;

  return {
    store,
    findGeneratedForLessons: vi.fn(async (lessonIds: readonly string[], language: string) => {
      const result = new Map<string, { sourceMtime: Date; sourceSize: number }>();
      for (const lessonId of lessonIds) {
        const row = store.get(key(lessonId, language));
        if (row && row.origin === 'generated') {
          result.set(lessonId, { sourceMtime: row.sourceMtime, sourceSize: row.sourceSize });
        }
      }
      return result;
    }),
    // Not exercised by the scan walk — the transcription run is the only
    // caller of the any-language lookup (#501).
    findAnyGeneratedForLessons: vi.fn(async () => new Map()),
    replaceGenerated: vi.fn(
      async (input: {
        lessonId: string;
        language: string;
        sourceMtime: Date;
        sourceSize: number;
      }) => {
        store.set(key(input.lessonId, input.language), {
          origin: 'generated',
          sourceMtime: input.sourceMtime,
          sourceSize: input.sourceSize,
        });
      },
    ),
    findExisting: vi.fn(async (lessonId: string, language: string) => {
      const row = store.get(key(lessonId, language));
      return row ? { ...row } : null;
    }),
    replaceSidecar: vi.fn(
      async (input: {
        lessonId: string;
        language: string;
        sourceMtime: Date;
        sourceSize: number;
      }) => {
        store.set(key(input.lessonId, input.language), {
          origin: 'sidecar',
          sourceMtime: input.sourceMtime,
          sourceSize: input.sourceSize,
        });
      },
    ),
    deleteForLesson: vi.fn(async (lessonId: string) => {
      for (const k of store.keys()) {
        if (k.startsWith(`${lessonId}:`)) store.delete(k);
      }
    }),
    // Not exercised by the scan walk — the language-backfill script (#555)
    // is the only caller.
    findGeneratedByLanguage: vi.fn(async () => []),
    reclassifyGenerated: vi.fn(async () => undefined),
    findCuesForLesson: vi.fn(async () => null),
    cueBelongsToLesson: vi.fn(async () => true),
  };
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

// Minimal valid SRT — parses to one cue via extractCues(convertSrtToVtt(...)).
// Fixture .srt/.vtt files that predate sidecar ingestion (E27-F01-S01) carry
// this so ingesting them succeeds silently instead of adding a stray
// 'subtitle-sidecar-invalid' ScanError that those tests never asked about.
const MINIMAL_SRT = '1\n00:00:00,000 --> 00:00:01,000\nHello\n';

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

/**
 * `Lesson.videoPath` is stored library-relative (`LibraryRelativePath`) —
 * every fixture below still builds an absolute `/lib/...` path (that is what
 * `FakeFsAdapter`'s walk yields, matching a real `FsAdapter`), so a
 * post-persist assertion against a `Lesson`'s `.videoPath` needs the same
 * conversion the handler itself applies at the `Lesson.create()` boundary.
 */
function rel(absolutePath: string): string {
  return path.relative('/lib', absolutePath);
}

// toSlug() (run-scan.handler.ts) is module-private, but it is only `slugify`
// plus an 'untitled' fallback — call the real thing rather than keeping a
// second copy of the derivation here, which is how this helper came to still
// strip `[^a-z0-9]` long after that was the defect under test.
function toSlugForTest(folder: string): string {
  return slugify(folder);
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
      makeTranscriptRepo(),
      makeFakeAppConfig(),
      centrifugo,
      makeMetadataLinker(),
      makePosterSync(),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // Happy path — first scan
  // -------------------------------------------------------------------------
  it('first scan: filesAdded=3, filesScanned=3, coursesDiscovered=2, errors.length=0', async () => {
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
    // broken.txt has no sibling video, so it is silently skipped (#523).
    // So filesScanned = 3 (the three .mp4 files).
    expect(saved.filesScanned).toBe(3);
    expect(saved.coursesDiscovered).toBe(2);
    expect(saved.errors).toHaveLength(0);
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
      makeTranscriptRepo(),
      makeFakeAppConfig(),
      centrifugo,
      makeMetadataLinker(),
      makePosterSync(),
    );

    const scan = await handler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
    await drainMicrotasks();

    const saved = scanRepo.store.get(scan.id)!;
    // Reaches a terminal state without crashing — partial, not succeeded,
    // because it did record a ScanError (#699).
    expect(saved.status).toBe('partial');
    const jsonError = saved.errors.find((e) => e.code === 'course-json-invalid');
    expect(jsonError).toBeDefined();
  });

  // -------------------------------------------------------------------------
  // #523: a video-less stem group is course material, not a scan error.
  //
  // Real course folders hold far more than their videos — slides, archived
  // exercises, sample code — and none of it shares a stem with a video.
  // Before this fix every one of those files became an 'unsupported-extension'
  // ScanError: 9201 of them on a clean import of the maintainer's library.
  // -------------------------------------------------------------------------
  it('slides, an archive and source code with no sibling video produce zero ScanErrors', async () => {
    vi.useRealTimers();

    const junkFiles: FileRecord[] = [
      { path: '/lib/Junk Course/01 - Intro.mp4', mtime: BASE_TIME, size: 100 },
      // No video shares these stems — each used to be its own ScanError.
      { path: '/lib/Junk Course/Extra Slides.pdf', mtime: BASE_TIME, size: 40 },
      { path: '/lib/Junk Course/Exercises.zip', mtime: BASE_TIME, size: 400 },
      { path: '/lib/Junk Course/starter.cs', mtime: BASE_TIME, size: 20 },
    ];
    const junkScanRepo = makeScanRepo();
    const junkHandler = new RunScanHandler(
      libraryRepo,
      junkScanRepo,
      makeCourseRepo(),
      makeLessonRepo(),
      new FakeFsAdapter(junkFiles),
      makePassthroughFfmpeg(),
      makeTranscriptRepo(),
      makeFakeAppConfig(),
      centrifugo,
      makeMetadataLinker(),
      makePosterSync(),
    );

    const scan = await junkHandler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
    await drainMicrotasks();

    const saved = junkScanRepo.store.get(scan.id)!;
    expect(saved.status).toBe('succeeded');
    // The count that mattered: zero, not one per junk file.
    expect(saved.errors).toHaveLength(0);
    expect(saved.coursesDiscovered).toBe(1);
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
      makeTranscriptRepo(),
      makeFakeAppConfig(),
      centrifugo,
      makeMetadataLinker(),
      makePosterSync(),
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
      makeTranscriptRepo(),
      makeFakeAppConfig(),
      centrifugo,
      makeMetadataLinker(),
      makePosterSync(),
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
          content: MINIMAL_SRT,
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
        makeTranscriptRepo(),
        makeFakeAppConfig(),
        centrifugo,
        makeMetadataLinker(),
        makePosterSync(),
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
          content: MINIMAL_SRT,
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
        makeTranscriptRepo(),
        makeFakeAppConfig(),
        centrifugo,
        makeMetadataLinker(),
        makePosterSync(),
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

    it('same language in two containers materialises one Subtitle row, labelled by language', async () => {
      vi.useRealTimers();

      const dupFiles: FileRecord[] = [
        { path: '/lib/05 - Dup Course/01 - Intro.mp4', mtime: BASE_TIME, size: 500 },
        {
          path: '/lib/05 - Dup Course/01 - Intro.en.srt',
          mtime: BASE_TIME,
          size: 20,
          content: MINIMAL_SRT,
        },
        {
          path: '/lib/05 - Dup Course/01 - Intro.en.vtt',
          mtime: BASE_TIME,
          size: 22,
          content: MINIMAL_SRT,
        },
        {
          path: '/lib/05 - Dup Course/01 - Intro.ru.srt',
          mtime: BASE_TIME,
          size: 24,
          content: MINIMAL_SRT,
        },
      ];

      const dupLessonRepo = makeLessonRepo();
      const dupHandler = new RunScanHandler(
        libraryRepo,
        makeScanRepo(),
        makeCourseRepo(),
        dupLessonRepo,
        new FakeFsAdapter(dupFiles),
        makePassthroughFfmpeg(),
        makeTranscriptRepo(),
        makeFakeAppConfig(),
        centrifugo,
        makeMetadataLinker(),
        makePosterSync(),
      );

      await dupHandler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const lesson = [...dupLessonRepo.store.values()][0]!;

      // One track per language — `.vtt` wins for `en` so no conversion is needed.
      expect(lesson.subtitles.map((s) => s.language).toSorted()).toEqual(['en', 'ru']);
      expect(lesson.subtitles.find((s) => s.language === 'en')!.absolutePath('/lib')).toBe(
        '/lib/05 - Dup Course/01 - Intro.en.vtt',
      );
      // Label names the language, not the video stem.
      expect(lesson.subtitles.map((s) => s.label).toSorted()).toEqual(['English', 'Russian']);
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
        makeTranscriptRepo(),
        makeFakeAppConfig(),
        centrifugo,
        makeMetadataLinker(),
        makePosterSync(),
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
  // Result: scan status = 'partial', two ScanErrors (one per video with the
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
        makeTranscriptRepo(),
        makeFakeAppConfig(),
        centrifugo,
        makeMetadataLinker(),
        makePosterSync(),
      );

      const scan = await ffHandler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const saved = ffScanRepo.store.get(scan.id)!;

      // Scan reaches a terminal state despite per-file failures — partial,
      // since it did record ScanErrors for them (#699).
      expect(saved.status).toBe('partial');

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
  // E25-F04-S01: thumbnails move to the derived volume
  // -------------------------------------------------------------------------
  describe('E25-F04-S01: thumbnails on the derived volume', () => {
    it('writes the thumbnail under <derivedPath>/<libraryId>/…, never next to the video', async () => {
      vi.useRealTimers();

      const video = '/lib/06 - Thumb Course/01 - Intro.mp4';
      const thumbFiles: FileRecord[] = [{ path: video, mtime: BASE_TIME, size: 500 }];

      const ffmpegAdapter = new FakeFfmpegAdapter(new Map(), new Map());
      const thumbScanRepo = makeScanRepo();
      const thumbHandler = new RunScanHandler(
        libraryRepo,
        thumbScanRepo,
        makeCourseRepo(),
        makeLessonRepo(),
        new FakeFsAdapter(thumbFiles),
        ffmpegAdapter,
        makeTranscriptRepo(),
        makeFakeAppConfig(),
        centrifugo,
        makeMetadataLinker(),
        makePosterSync(),
      );

      const scan = await thumbHandler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const saved = thumbScanRepo.store.get(scan.id)!;
      expect(saved.status).toBe('succeeded');
      expect(saved.errors).toHaveLength(0);

      expect(ffmpegAdapter.thumbnailCalls).toHaveLength(1);
      const call = ffmpegAdapter.thumbnailCalls[0]!;
      expect(call.videoAbsolutePath).toBe(video);
      // Never next to the video (the pre-fix location).
      expect(call.outAbsolutePath).not.toBe('/lib/06 - Thumb Course/01 - Intro.thumb.jpg');
      // Under <derivedPath>/<libraryId>/<library-relative video path>.thumb.jpg.
      expect(call.outAbsolutePath).toBe(
        '/derived/lib-1/06 - Thumb Course/01 - Intro.mp4.thumb.jpg',
      );
    });

    it('records ScanError and continues the scan when the thumbnail write fails', async () => {
      vi.useRealTimers();

      const video = '/lib/07 - Thumb Fail Course/01 - Intro.mp4';
      const thumbFiles: FileRecord[] = [{ path: video, mtime: BASE_TIME, size: 500 }];

      const ffmpegAdapter = new FakeFfmpegAdapter(
        new Map(),
        new Map([[video, new Error('disk full')]]),
      );
      const failScanRepo = makeScanRepo();
      const failHandler = new RunScanHandler(
        libraryRepo,
        failScanRepo,
        makeCourseRepo(),
        makeLessonRepo(),
        new FakeFsAdapter(thumbFiles),
        ffmpegAdapter,
        makeTranscriptRepo(),
        makeFakeAppConfig(),
        centrifugo,
        makeMetadataLinker(),
        makePosterSync(),
      );

      const scan = await failHandler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const saved = failScanRepo.store.get(scan.id)!;
      // Failure is per-file, not fatal — the scan reaches partial, not failed.
      expect(saved.status).toBe('partial');
      expect(saved.errors).toHaveLength(1);
      expect(saved.errors[0]?.code).toBe('ffmpeg-thumbnail-failed');
      expect(saved.coursesDiscovered).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // E27-F01-S01: sidecar subtitles parsed into Transcript(origin: sidecar)
  //
  // Every scenario reuses the same fixture shape: a course + lesson already
  // persisted from a PRIOR scan (course already known → the walk would
  // otherwise skip it entirely), so these exercise the "existing lesson"
  // ingestion path — the one that only this feature makes reachable on a
  // repeat scan.
  // -------------------------------------------------------------------------
  describe('E27-F01-S01: sidecar subtitle ingest', () => {
    const courseFolder = 'Sidecar Course';
    const videoPath = `/lib/${courseFolder}/01 - Intro.mp4`;
    const srtPath = `/lib/${courseFolder}/01 - Intro.en.srt`;

    function seedExistingLesson(
      courseRepo: ReturnType<typeof makeCourseRepo>,
      lessonRepo: ReturnType<typeof makeLessonRepo>,
    ): { courseId: string; lessonId: string } {
      const course = Course.create({
        id: 'course-sidecar',
        libraryId: 'lib-1',
        slug: toSlugForTest(courseFolder),
        title: courseFolder,
      });
      // A real persisted course always has a section — Lesson.section is a
      // real FK. Without one, a library-wide scan's reconcile (#544) cannot
      // resolve `entry`'s section and records 'lesson-section-unresolvable'
      // instead of silently succeeding the way the old skip made this look.
      course.addSection({ id: 'section-sidecar', title: 'Lessons', position: 1 });
      courseRepo.store.set(course.id, course);

      const lesson = Lesson.create({
        id: 'lesson-sidecar',
        courseId: course.id,
        sectionId: 'section-sidecar',
        position: 1,
        title: 'Intro',
        videoPath: LibraryRelativePath.from(videoPath, '/lib'),
        mtime: BASE_TIME,
        sizeBytes: 500,
      });
      lessonRepo.store.set(lesson.id, lesson);

      return { courseId: course.id, lessonId: lesson.id };
    }

    it('ingests a new sidecar into Transcript(origin: sidecar) + cues', async () => {
      vi.useRealTimers();

      const files: FileRecord[] = [
        { path: videoPath, mtime: BASE_TIME, size: 500 },
        {
          path: srtPath,
          mtime: BASE_TIME,
          size: 30,
          content: '1\n00:00:00,000 --> 00:00:02,000\nHola\n',
        },
      ];

      const courseRepo2 = makeCourseRepo();
      const lessonRepo2 = makeLessonRepo();
      const { lessonId } = seedExistingLesson(courseRepo2, lessonRepo2);
      const transcriptRepo = makeTranscriptRepo();
      const scanRepo2 = makeScanRepo();

      const h = new RunScanHandler(
        libraryRepo,
        scanRepo2,
        courseRepo2,
        lessonRepo2,
        new FakeFsAdapter(files),
        makePassthroughFfmpeg(),
        transcriptRepo,
        makeFakeAppConfig(),
        centrifugo,
        makeMetadataLinker(),
        makePosterSync(),
      );

      const scan = await h.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const saved = scanRepo2.store.get(scan.id)!;
      expect(saved.errors.filter((e) => e.code === 'subtitle-sidecar-invalid')).toHaveLength(0);

      const row = transcriptRepo.store.get(`${lessonId}:en`);
      expect(row).toEqual({ origin: 'sidecar', sourceMtime: BASE_TIME, sourceSize: 30 });
      expect(transcriptRepo.replaceSidecar).toHaveBeenCalledWith(
        expect.objectContaining({
          lessonId,
          language: 'en',
          sourcePath: `${courseFolder}/01 - Intro.en.srt`,
          cues: [{ startMs: 0, endMs: 2000, text: 'Hola' }],
        }),
      );
    });

    it('unchanged signature performs no reads and leaves the row untouched', async () => {
      vi.useRealTimers();

      // No `content` — FakeFsAdapter.readUtf8 throws if this is ever read.
      const files: FileRecord[] = [
        { path: videoPath, mtime: BASE_TIME, size: 500 },
        { path: srtPath, mtime: BASE_TIME, size: 30 },
      ];

      const courseRepo2 = makeCourseRepo();
      const lessonRepo2 = makeLessonRepo();
      const { lessonId } = seedExistingLesson(courseRepo2, lessonRepo2);
      const transcriptRepo = makeTranscriptRepo();
      transcriptRepo.store.set(`${lessonId}:en`, {
        origin: 'sidecar',
        sourceMtime: BASE_TIME,
        sourceSize: 30,
      });
      const scanRepo2 = makeScanRepo();

      const h = new RunScanHandler(
        libraryRepo,
        scanRepo2,
        courseRepo2,
        lessonRepo2,
        new FakeFsAdapter(files),
        makePassthroughFfmpeg(),
        transcriptRepo,
        makeFakeAppConfig(),
        centrifugo,
        makeMetadataLinker(),
        makePosterSync(),
      );

      const scan = await h.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const saved = scanRepo2.store.get(scan.id)!;
      expect(saved.errors).toHaveLength(0);
      expect(transcriptRepo.replaceSidecar).not.toHaveBeenCalled();
      expect(transcriptRepo.store.get(`${lessonId}:en`)).toEqual({
        origin: 'sidecar',
        sourceMtime: BASE_TIME,
        sourceSize: 30,
      });
    });

    it('a changed signature replaces the row', async () => {
      vi.useRealTimers();

      const files: FileRecord[] = [
        { path: videoPath, mtime: BASE_TIME, size: 500 },
        {
          path: srtPath,
          mtime: new Date(BASE_TIME.getTime() + 60_000),
          size: 40,
          content: '1\n00:00:00,000 --> 00:00:03,000\nUpdated\n',
        },
      ];

      const courseRepo2 = makeCourseRepo();
      const lessonRepo2 = makeLessonRepo();
      const { lessonId } = seedExistingLesson(courseRepo2, lessonRepo2);
      const transcriptRepo = makeTranscriptRepo();
      // Stale signature — the old (mtime, size) recorded by an earlier scan.
      transcriptRepo.store.set(`${lessonId}:en`, {
        origin: 'sidecar',
        sourceMtime: BASE_TIME,
        sourceSize: 30,
      });
      const scanRepo2 = makeScanRepo();

      const h = new RunScanHandler(
        libraryRepo,
        scanRepo2,
        courseRepo2,
        lessonRepo2,
        new FakeFsAdapter(files),
        makePassthroughFfmpeg(),
        transcriptRepo,
        makeFakeAppConfig(),
        centrifugo,
        makeMetadataLinker(),
        makePosterSync(),
      );

      await h.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      expect(transcriptRepo.replaceSidecar).toHaveBeenCalledTimes(1);
      const row = transcriptRepo.store.get(`${lessonId}:en`)!;
      expect(row.sourceSize).toBe(40);
      expect(row.sourceMtime).toEqual(new Date(BASE_TIME.getTime() + 60_000));
    });

    it('a malformed sidecar costs its own transcript, recorded as a ScanError, never the scan', async () => {
      vi.useRealTimers();

      // No `content` set — FakeFsAdapter.readUtf8 throws "File not found in fake".
      const files: FileRecord[] = [
        { path: videoPath, mtime: BASE_TIME, size: 500 },
        { path: srtPath, mtime: BASE_TIME, size: 30 },
      ];

      const courseRepo2 = makeCourseRepo();
      const lessonRepo2 = makeLessonRepo();
      const { lessonId } = seedExistingLesson(courseRepo2, lessonRepo2);
      const transcriptRepo = makeTranscriptRepo();
      const scanRepo2 = makeScanRepo();

      const h = new RunScanHandler(
        libraryRepo,
        scanRepo2,
        courseRepo2,
        lessonRepo2,
        new FakeFsAdapter(files),
        makePassthroughFfmpeg(),
        transcriptRepo,
        makeFakeAppConfig(),
        centrifugo,
        makeMetadataLinker(),
        makePosterSync(),
      );

      const scan = await h.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const saved = scanRepo2.store.get(scan.id)!;
      // The scan itself still reaches partial — the bad sidecar costs only
      // itself, but it is still a recorded error (#699).
      expect(saved.status).toBe('partial');
      const err = saved.errors.find((e) => e.code === 'subtitle-sidecar-invalid');
      expect(err).toBeDefined();
      expect(transcriptRepo.store.has(`${lessonId}:en`)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // tuxedo 145/129/137: the parser's silence made itself invisible — a course
  // whose lesson order fell back to file-path order (no ordinal parsed for
  // at least one lesson) must now raise a 'course-order-unreliable'
  // ScanError, once per course, not once per file.
  // -------------------------------------------------------------------------
  describe('course-order-unreliable signal', () => {
    it('fires once per course when at least one lesson has no parseable ordinal', async () => {
      vi.useRealTimers();

      const files: FileRecord[] = [
        { path: '/lib/06 - Order Course/01 - Intro.mp4', mtime: BASE_TIME, size: 100 },
        // Bare title — no tier parses an ordinal out of this.
        { path: '/lib/06 - Order Course/Bonus Episode.mp4', mtime: BASE_TIME, size: 100 },
      ];

      const orderScanRepo = makeScanRepo();
      const orderHandler = new RunScanHandler(
        libraryRepo,
        orderScanRepo,
        makeCourseRepo(),
        makeLessonRepo(),
        new FakeFsAdapter(files),
        makePassthroughFfmpeg(),
        makeTranscriptRepo(),
        makeFakeAppConfig(),
        centrifugo,
        makeMetadataLinker(),
        makePosterSync(),
      );

      const scan = await orderHandler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const saved = orderScanRepo.store.get(scan.id)!;
      // The advisory 'course-order-unreliable' code is still a ScanError → partial.
      expect(saved.status).toBe('partial');

      const orderErrors = saved.errors.filter((e) => e.code === 'course-order-unreliable');
      expect(orderErrors).toHaveLength(1); // one per course, not one per file
      expect(orderErrors[0]?.path).toBe('06 - Order Course');
      expect(orderErrors[0]?.message).toContain('1 of 2 lesson(s)');
    });

    it('does not fire when every lesson in the course parses an ordinal', async () => {
      vi.useRealTimers();

      const scan = await handler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const saved = scanRepo.store.get(scan.id)!;
      const orderErrors = saved.errors.filter((e) => e.code === 'course-order-unreliable');
      expect(orderErrors).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // E25-F04-S01: orphan Transcript cleanup
  // -------------------------------------------------------------------------
  describe('E25-F04-S01: orphan transcript cleanup', () => {
    it('deletes Transcript rows for a lesson whose video the scan no longer finds', async () => {
      vi.useRealTimers();

      const vanishedVideoPath = '/lib/09 - Gone Course/01 - Intro.mp4';
      const course = Course.create({
        id: 'course-gone',
        libraryId: 'lib-1',
        slug: 'gone-course',
        title: '09 - Gone Course',
      });
      const lesson = Lesson.create({
        id: 'lesson-gone',
        courseId: course.id,
        sectionId: 'section-gone',
        position: 1,
        title: 'Intro',
        videoPath: LibraryRelativePath.from(vanishedVideoPath, '/lib'),
        mtime: BASE_TIME,
        sizeBytes: 500,
      });

      const courseRepo2 = makeCourseRepo();
      courseRepo2.store.set(course.id, course);
      const lessonRepo2 = makeLessonRepo();
      lessonRepo2.store.set(lesson.id, lesson);
      const transcriptRepo = makeTranscriptRepo();
      transcriptRepo.store.set(`${lesson.id}:en`, {
        origin: 'generated',
        sourceMtime: BASE_TIME,
        sourceSize: 500,
      });
      const scanRepo2 = makeScanRepo();

      // The library now has a DIFFERENT, unrelated course — the "Gone Course"
      // folder is absent entirely, simulating the video having been deleted.
      const files: FileRecord[] = [
        { path: '/lib/10 - Still Here/01 - Intro.mp4', mtime: BASE_TIME, size: 100 },
      ];

      const h = new RunScanHandler(
        libraryRepo,
        scanRepo2,
        courseRepo2,
        lessonRepo2,
        new FakeFsAdapter(files),
        makePassthroughFfmpeg(),
        transcriptRepo,
        makeFakeAppConfig(),
        centrifugo,
        makeMetadataLinker(),
        makePosterSync(),
      );

      const scan = await h.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const saved = scanRepo2.store.get(scan.id)!;
      expect(saved.status).toBe('succeeded');
      expect(transcriptRepo.deleteForLesson).toHaveBeenCalledWith(lesson.id);
      expect(transcriptRepo.store.has(`${lesson.id}:en`)).toBe(false);

      // The Lesson row itself is untouched — only Transcript rows are cleaned up.
      expect(lessonRepo2.store.has(lesson.id)).toBe(true);
    });

    it('a failed cleanup records a ScanError and the scan continues', async () => {
      vi.useRealTimers();

      const vanishedVideoPath = '/lib/11 - Gone Course/01 - Intro.mp4';
      const course = Course.create({
        id: 'course-gone-2',
        libraryId: 'lib-1',
        slug: 'gone-course-2',
        title: '11 - Gone Course',
      });
      const lesson = Lesson.create({
        id: 'lesson-gone-2',
        courseId: course.id,
        sectionId: 'section-gone-2',
        position: 1,
        title: 'Intro',
        videoPath: LibraryRelativePath.from(vanishedVideoPath, '/lib'),
        mtime: BASE_TIME,
        sizeBytes: 500,
      });

      const courseRepo2 = makeCourseRepo();
      courseRepo2.store.set(course.id, course);
      const lessonRepo2 = makeLessonRepo();
      lessonRepo2.store.set(lesson.id, lesson);
      const transcriptRepo = makeTranscriptRepo();
      transcriptRepo.deleteForLesson = vi.fn(async () => {
        throw new Error('db unavailable');
      });
      const scanRepo2 = makeScanRepo();

      const h = new RunScanHandler(
        libraryRepo,
        scanRepo2,
        courseRepo2,
        lessonRepo2,
        new FakeFsAdapter([]),
        makePassthroughFfmpeg(),
        transcriptRepo,
        makeFakeAppConfig(),
        centrifugo,
        makeMetadataLinker(),
        makePosterSync(),
      );

      const scan = await h.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const saved = scanRepo2.store.get(scan.id)!;
      // Cleanup failure is non-fatal — the scan still reaches a terminal
      // state, but partial rather than succeeded since it recorded an error.
      expect(saved.status).toBe('partial');
      const err = saved.errors.find((e) => e.code === 'transcript-cleanup-failed');
      expect(err).toBeDefined();
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

      // Two courses persisted. Course A gets a second save for metadata linking
      // (its course.json is valid → normalisedCourseJson is defined → metadata
      // block runs → second courseRepo.save). Course B has no course.json →
      // one save. Total: 3 saves.
      expect(courseRepo.save).toHaveBeenCalledTimes(3);

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
    // Idempotency (#544): a second scan RECONCILES both already-known
    // courses — courseRepo.save / lessonRepo.save fire again (reconcile
    // re-persists every discovered lesson, the same as a scoped rescan does)
    // — but every course, section, lesson id and position comes out
    // byte-identical, because nothing on disk changed. That is the actual
    // idempotency guarantee; "no repo call happened" was never the contract,
    // "nothing observable changed" is.
    // -----------------------------------------------------------------------
    it('second scan reconciles already-persisted courses to an identical state', async () => {
      vi.useRealTimers();

      // First scan — persists both courses.
      await handler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const coursesAfterFirst = [...courseRepo.store.values()]
        .map((c) => ({ id: c.id, slug: c.slug, sections: c.sections.map((s) => s.id) }))
        .toSorted((a, b) => a.slug.localeCompare(b.slug));
      const lessonsAfterFirst = [...lessonRepo.store.values()]
        .map((l) => ({ id: l.id, sectionId: l.sectionId, position: l.position }))
        .toSorted((a, b) => a.id.localeCompare(b.id));

      // Second scan — same FS, same slugs → reconcile, not re-create.
      await handler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      // Same two course rows (same id/slug/section ids), same three lesson
      // rows (same id/sectionId/position) — a reconcile, not a duplicate.
      const coursesAfterSecond = [...courseRepo.store.values()]
        .map((c) => ({ id: c.id, slug: c.slug, sections: c.sections.map((s) => s.id) }))
        .toSorted((a, b) => a.slug.localeCompare(b.slug));
      const lessonsAfterSecond = [...lessonRepo.store.values()]
        .map((l) => ({ id: l.id, sectionId: l.sectionId, position: l.position }))
        .toSorted((a, b) => a.id.localeCompare(b.id));
      expect(coursesAfterSecond).toEqual(coursesAfterFirst);
      expect(lessonsAfterSecond).toEqual(lessonsAfterFirst);
      expect(courseRepo.store.size).toBe(2);
      expect(lessonRepo.store.size).toBe(3);

      // Reconcile parks and re-persists every lesson every scan (E32-F01-S01
      // batch renumbering) — a second, unchanged scan still calls save.
      expect(lessonRepo.parkPositionsForResync).toHaveBeenCalledTimes(2);
      expect(lessonRepo.save).toHaveBeenCalledTimes(6);

      // Scan aggregate still records coursesDiscovered (counter always bumped).
      const scans = [...scanRepo.store.values()].toSorted(
        (a, b) => b.startedAt.getTime() - a.startedAt.getTime(),
      );
      expect(scans[0]!.coursesDiscovered).toBe(2);
      expect(scans[0]!.status).toBe('succeeded');
      expect(scans[0]!.errors).toHaveLength(0);
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

    it('publishes finished event with status=succeeded (no errors: broken.txt is silently skipped)', async () => {
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
      // broken.txt has no sibling video, so it is silently skipped (#523) —
      // no errors, status stays 'succeeded'.
      expect(f.status).toBe('succeeded');
      expect(f.filesAdded).toBe(3);
      expect(f.coursesDiscovered).toBe(2);
      expect(f.errorsCount).toBe(0);
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
        makeTranscriptRepo(),
        makeFakeAppConfig(),
        cleanCentrifugo,
        makeMetadataLinker(),
        makePosterSync(),
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

    // #699 — a scan that recorded errors is not the same outcome as a clean
    // one; the finished event (and the persisted Scan) must say so.
    it('publishes finished event with status=partial when there are recorded errors', async () => {
      vi.useRealTimers();

      const partialFiles: FileRecord[] = [
        { path: '/lib/Partial Course/01 - Intro.mp4', mtime: BASE_TIME, size: 100 },
        // Shares the video's stem, but an extension nothing recognises —
        // recorded as an 'unsupported-extension' ScanError (belt-and-
        // suspenders path: still reported even inside a group with a video).
        { path: '/lib/Partial Course/01 - Intro.xyz', mtime: BASE_TIME, size: 10 },
      ];
      const partialFs = new FakeFsAdapter(partialFiles);
      const partialScanRepo = makeScanRepo();
      const partialCentrifugo = makeCentrifugoService();
      const partialHandler = new RunScanHandler(
        libraryRepo,
        partialScanRepo,
        makeCourseRepo(),
        makeLessonRepo(),
        partialFs,
        makePassthroughFfmpeg(),
        makeTranscriptRepo(),
        makeFakeAppConfig(),
        partialCentrifugo,
        makeMetadataLinker(),
        makePosterSync(),
      );

      const scan = await partialHandler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const saved = partialScanRepo.store.get(scan.id)!;
      expect(saved.status).toBe('partial');
      expect(saved.errors.some((e) => e.code === 'unsupported-extension')).toBe(true);

      const finishedCalls = vi
        .mocked(partialCentrifugo.publish)
        .mock.calls.filter(([, data]) => (data as { kind: string }).kind === 'finished');
      expect(finishedCalls).toHaveLength(1);

      const [, payload] = finishedCalls[0]!;
      expect((payload as { status: string }).status).toBe('partial');
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
        makeTranscriptRepo(),
        makeFakeAppConfig(),
        failCentrifugo,
        makeMetadataLinker(),
        makePosterSync(),
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

  // -------------------------------------------------------------------------
  // Section ordering — sections must be persisted in numeric ordinal order
  // rather than file-walk insertion order. This pins the natural `1, 2, 3,
  // …, 10` order so the materialised Course aggregate matches the on-disk
  // numbering even when the FS adapter yields files in a different order
  // (e.g. lexicographic, which would otherwise produce `1, 10, 2, …`).
  // -------------------------------------------------------------------------
  describe('section ordering by ordinal', () => {
    it('sorts sections by parsed ordinal, not file-walk insertion order', async () => {
      vi.useRealTimers();

      // Fixture deliberately yields `10`, then `2`, then `1` (lexicographic
      // walk order on the FsAdapter). The handler must reorder them to
      // `1, 2, 10` because each folder carries an ordinal in its name.
      const orderingFiles: FileRecord[] = [
        { path: '/lib/Course Z/10 - Final/lesson.mp4', mtime: BASE_TIME, size: 100 },
        { path: '/lib/Course Z/02 - Middle/lesson.mp4', mtime: BASE_TIME, size: 100 },
        { path: '/lib/Course Z/01 - Intro/lesson.mp4', mtime: BASE_TIME, size: 100 },
      ];

      const orderingHandler = new RunScanHandler(
        makeLibraryRepo(Library.register({ id: 'lib-x', name: 'Lib X', rootPath: '/lib' })),
        makeScanRepo(),
        courseRepo,
        lessonRepo,
        new FakeFsAdapter(orderingFiles),
        makePassthroughFfmpeg(),
        makeTranscriptRepo(),
        makeFakeAppConfig(),
        makeCentrifugoService(),
        makeMetadataLinker(),
        makePosterSync(),
      );

      await orderingHandler.execute(new RunScanCommand('lib-x', ACTOR_USER_ID));
      await drainMicrotasks();

      const course = [...courseRepo.store.values()].find((c) => c.slug === 'course-z')!;
      expect(course).toBeDefined();
      expect(course.sections.map((s) => s.title)).toEqual(['Intro', 'Middle', 'Final']);
      expect(course.sections.map((s) => s.position)).toEqual([1, 2, 3]);
    });

    it('places sections without an ordinal after numbered sections, alphabetically', async () => {
      vi.useRealTimers();

      const orderingFiles: FileRecord[] = [
        { path: '/lib/Course Z/Bonus Material/extra.mp4', mtime: BASE_TIME, size: 100 },
        { path: '/lib/Course Z/02 - Middle/lesson.mp4', mtime: BASE_TIME, size: 100 },
        { path: '/lib/Course Z/01 - Intro/lesson.mp4', mtime: BASE_TIME, size: 100 },
        { path: '/lib/Course Z/Appendix/extra.mp4', mtime: BASE_TIME, size: 100 },
      ];

      const orderingHandler = new RunScanHandler(
        makeLibraryRepo(Library.register({ id: 'lib-y', name: 'Lib Y', rootPath: '/lib' })),
        makeScanRepo(),
        courseRepo,
        lessonRepo,
        new FakeFsAdapter(orderingFiles),
        makePassthroughFfmpeg(),
        makeTranscriptRepo(),
        makeFakeAppConfig(),
        makeCentrifugoService(),
        makeMetadataLinker(),
        makePosterSync(),
      );

      await orderingHandler.execute(new RunScanCommand('lib-y', ACTOR_USER_ID));
      await drainMicrotasks();

      const course = [...courseRepo.store.values()].find((c) => c.slug === 'course-z')!;
      expect(course).toBeDefined();
      // Numbered sections first (in numeric order), then unordered ones
      // (alphabetical fallback): Appendix before Bonus Material.
      expect(course.sections.map((s) => s.title)).toEqual([
        'Intro',
        'Middle',
        'Appendix',
        'Bonus Material',
      ]);
    });
  });

  // -------------------------------------------------------------------------
  // Slice 7: metadata pipeline integration
  //
  // Verifies that course.json v1/v2 data drives upserts of Instructor/Studio/Tag
  // rows and that the course aggregate has all enrichment fields set after scan.
  // -------------------------------------------------------------------------
  describe('Slice 7: metadata pipeline', () => {
    it('course.json v2 with full enrichment → instructor/studio/tag rows created, course fields set', async () => {
      vi.useRealTimers();

      const instructorRepo = makeInstructorRepo();
      const studioRepo = makeStudioRepo();
      const tagRepo = makeTagRepo();
      const enrichedCourseRepo = makeCourseRepo();

      const courseJsonV2 = JSON.stringify({
        schemaVersion: 2,
        title: 'Enriched Course',
        instructorNames: ['Alice Smith', 'Bob Jones'],
        studioName: 'Acme Studio',
        tags: ['TypeScript', 'NestJS'],
        level: 'intermediate',
        language: 'en',
        releaseDate: '2024-03-15',
        posterUrl: 'https://example.com/poster.jpg',
        externalIds: [{ source: 'udemy', externalId: 'course-123' }],
      });

      const metadataFiles: FileRecord[] = [
        { path: '/lib/Enriched Course/01 - Intro.mp4', mtime: BASE_TIME, size: 100 },
        {
          path: '/lib/Enriched Course/course.json',
          mtime: BASE_TIME,
          size: courseJsonV2.length,
          content: courseJsonV2,
        },
      ];

      const metadataLinker = makeMetadataLinker(instructorRepo, studioRepo, tagRepo);
      const metadataFs = new FakeFsAdapter(metadataFiles);
      const metadataScanRepo = makeScanRepo();
      const metadataHandler = new RunScanHandler(
        libraryRepo,
        metadataScanRepo,
        enrichedCourseRepo,
        makeLessonRepo(),
        metadataFs,
        makePassthroughFfmpeg(),
        makeTranscriptRepo(),
        makeFakeAppConfig(),
        makeCentrifugoService(),
        metadataLinker,
        makePosterSync(),
      );

      const scan = await metadataHandler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const saved = metadataScanRepo.store.get(scan.id)!;
      expect(saved.status).toBe('succeeded');

      // Instructor rows created.
      expect(instructorRepo.store.size).toBe(2);
      const instructorSlugs = [...instructorRepo.store.values()].map((i) => i.slug).toSorted();
      expect(instructorSlugs).toContain('alice-smith');
      expect(instructorSlugs).toContain('bob-jones');

      // Studio row created.
      expect(studioRepo.store.size).toBe(1);
      expect([...studioRepo.store.values()][0]!.slug).toBe('acme-studio');

      // Tag rows created.
      expect(tagRepo.store.size).toBe(2);
      const tagSlugs = [...tagRepo.store.values()].map((t) => t.slug).toSorted();
      expect(tagSlugs).toContain('typescript');
      expect(tagSlugs).toContain('nestjs');

      // Course aggregate has all enrichment fields set.
      const course = [...enrichedCourseRepo.store.values()][0]!;
      expect(course.instructors).toHaveLength(2);
      expect(course.studios).toHaveLength(1);
      expect(course.tags).toHaveLength(2);
      expect(course.level).toBe('intermediate');
      expect(course.language).toBe('en');
      expect(course.releaseDate?.toISOString().startsWith('2024-03-15')).toBe(true);
      expect(course.posterUrl).toBe('https://example.com/poster.jpg');
      expect(course.externalIds).toHaveLength(1);
      expect(course.externalIds[0]!.source).toBe('udemy');
      expect(course.externalIds[0]!.externalId).toBe('course-123');

      // No metadata-link-failed errors.
      const linkErrors = saved.errors.filter((e) => e.code === 'metadata-link-failed');
      expect(linkErrors).toHaveLength(0);
    });

    it('course.json v1 with instructor string → one Instructor row created, course has instructorRefs', async () => {
      vi.useRealTimers();

      const instructorRepo = makeInstructorRepo();
      const v1CourseRepo = makeCourseRepo();

      const courseJsonV1 = JSON.stringify({
        schemaVersion: 1,
        title: 'Classic Course',
        instructor: 'Jane Classic',
      });

      const v1Files: FileRecord[] = [
        { path: '/lib/Classic Course/01 - Intro.mp4', mtime: BASE_TIME, size: 100 },
        {
          path: '/lib/Classic Course/course.json',
          mtime: BASE_TIME,
          size: courseJsonV1.length,
          content: courseJsonV1,
        },
      ];

      const v1Linker = makeMetadataLinker(instructorRepo, makeStudioRepo(), makeTagRepo());
      const v1ScanRepo = makeScanRepo();
      const v1Handler = new RunScanHandler(
        libraryRepo,
        v1ScanRepo,
        v1CourseRepo,
        makeLessonRepo(),
        new FakeFsAdapter(v1Files),
        makePassthroughFfmpeg(),
        makeTranscriptRepo(),
        makeFakeAppConfig(),
        makeCentrifugoService(),
        v1Linker,
        makePosterSync(),
      );

      const scan = await v1Handler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const saved = v1ScanRepo.store.get(scan.id)!;
      expect(saved.status).toBe('succeeded');

      // One instructor row with displayName from v1 instructor field.
      expect(instructorRepo.store.size).toBe(1);
      const instructor = [...instructorRepo.store.values()][0]!;
      expect(instructor.displayName).toBe('Jane Classic');
      expect(instructor.slug).toBe('jane-classic');

      // Course has instructorRefs set.
      const course = [...v1CourseRepo.store.values()][0]!;
      expect(course.instructors).toHaveLength(1);
      expect(course.instructors[0]!.displayName).toBe('Jane Classic');
    });

    it('course.json v2 with empty instructorNames and tags → no entities created, course has empty refs', async () => {
      vi.useRealTimers();

      const instructorRepo = makeInstructorRepo();
      const tagRepo = makeTagRepo();
      const emptyMetaCourseRepo = makeCourseRepo();

      const courseJson = JSON.stringify({
        schemaVersion: 2,
        title: 'Bare Course',
        instructorNames: [],
        tags: [],
      });

      const emptyFiles: FileRecord[] = [
        { path: '/lib/Bare Course/01 - Intro.mp4', mtime: BASE_TIME, size: 100 },
        {
          path: '/lib/Bare Course/course.json',
          mtime: BASE_TIME,
          size: courseJson.length,
          content: courseJson,
        },
      ];

      const emptyLinker = makeMetadataLinker(instructorRepo, makeStudioRepo(), tagRepo);
      const emptyHandler = new RunScanHandler(
        libraryRepo,
        makeScanRepo(),
        emptyMetaCourseRepo,
        makeLessonRepo(),
        new FakeFsAdapter(emptyFiles),
        makePassthroughFfmpeg(),
        makeTranscriptRepo(),
        makeFakeAppConfig(),
        makeCentrifugoService(),
        emptyLinker,
        makePosterSync(),
      );

      await emptyHandler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      expect(instructorRepo.store.size).toBe(0);
      expect(tagRepo.store.size).toBe(0);

      const course = [...emptyMetaCourseRepo.store.values()][0]!;
      expect(course.instructors).toHaveLength(0);
      expect(course.tags).toHaveLength(0);
    });

    it('re-scan over same library → idempotent (instructor/studio/tag rows reused, no duplicates)', async () => {
      vi.useRealTimers();

      const instructorRepo = makeInstructorRepo();
      const studioRepo = makeStudioRepo();
      const tagRepo = makeTagRepo();
      const idempotentCourseRepo = makeCourseRepo();

      const courseJson = JSON.stringify({
        schemaVersion: 2,
        title: 'Idempotent Course',
        instructorNames: ['Repeat Author'],
        studioName: 'Repeat Studio',
        tags: ['repeat-tag'],
      });

      const idempotentFiles: FileRecord[] = [
        { path: '/lib/Idempotent Course/01 - Intro.mp4', mtime: BASE_TIME, size: 100 },
        {
          path: '/lib/Idempotent Course/course.json',
          mtime: BASE_TIME,
          size: courseJson.length,
          content: courseJson,
        },
      ];

      const idempotentLinker = makeMetadataLinker(instructorRepo, studioRepo, tagRepo);

      // First scan.
      const firstHandler = new RunScanHandler(
        libraryRepo,
        makeScanRepo(),
        idempotentCourseRepo,
        makeLessonRepo(),
        new FakeFsAdapter(idempotentFiles),
        makePassthroughFfmpeg(),
        makeTranscriptRepo(),
        makeFakeAppConfig(),
        makeCentrifugoService(),
        idempotentLinker,
        makePosterSync(),
      );

      await firstHandler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const instructorCountAfterFirst = instructorRepo.store.size;
      const studioCountAfterFirst = studioRepo.store.size;
      const tagCountAfterFirst = tagRepo.store.size;

      expect(instructorCountAfterFirst).toBe(1);
      expect(studioCountAfterFirst).toBe(1);
      expect(tagCountAfterFirst).toBe(1);

      // Second scan — same FS. Course slug already exists so the course is skipped
      // and metadata linking for that course is also skipped (correct idempotency).
      const secondHandler = new RunScanHandler(
        libraryRepo,
        makeScanRepo(),
        idempotentCourseRepo,
        makeLessonRepo(),
        new FakeFsAdapter(idempotentFiles),
        makePassthroughFfmpeg(),
        makeTranscriptRepo(),
        makeFakeAppConfig(),
        makeCentrifugoService(),
        idempotentLinker,
        makePosterSync(),
      );

      await secondHandler.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      // No new rows created on second scan.
      expect(instructorRepo.store.size).toBe(instructorCountAfterFirst);
      expect(studioRepo.store.size).toBe(studioCountAfterFirst);
      expect(tagRepo.store.size).toBe(tagCountAfterFirst);
    });
  });

  // -------------------------------------------------------------------------
  // E32-F01-S01: lesson position uniqueness (lesson-loss-report.md)
  //
  // Each measured shape asserts the persisted lesson COUNT equals the file
  // count — the assertion whose absence let 23% of a real library disappear
  // without a single red signal (no ScanError, scan reported success).
  // -------------------------------------------------------------------------
  describe('E32-F01-S01: lesson position uniqueness', () => {
    it('flat, digits-as-suffix ("lesson1" … "lesson23"): all 23 files import, distinct positions', async () => {
      vi.useRealTimers();

      const files: FileRecord[] = Array.from({ length: 23 }, (_, i) => ({
        path: `/lib/DDD Course/lesson${String(i + 1)}.mp4`,
        mtime: BASE_TIME,
        size: 100,
      }));

      const lessonRepo2 = makeLessonRepo();
      const scanRepo2 = makeScanRepo();
      const h = new RunScanHandler(
        libraryRepo,
        scanRepo2,
        makeCourseRepo(),
        lessonRepo2,
        new FakeFsAdapter(files),
        makePassthroughFfmpeg(),
        makeTranscriptRepo(),
        makeFakeAppConfig(),
        centrifugo,
        makeMetadataLinker(),
        makePosterSync(),
      );

      const scan = await h.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const saved = scanRepo2.store.get(scan.id)!;
      expect(saved.status).toBe('succeeded');
      expect(saved.errors).toHaveLength(0);
      expect(lessonRepo2.store.size).toBe(23);

      const positions = [...lessonRepo2.store.values()]
        .map((l) => l.position)
        .toSorted((a, b) => a - b);
      expect(positions).toEqual(Array.from({ length: 23 }, (_, i) => i + 1));
      // Trailing-digit ordinal parsing (E32-F01-S01) keeps the numeric order:
      // lesson1 → position 1, …, lesson23 → position 23.
      const byVideoPath = new Map([...lessonRepo2.store.values()].map((l) => [l.videoPath, l]));
      expect(byVideoPath.get(rel('/lib/DDD Course/lesson1.mp4'))!.position).toBe(1);
      expect(byVideoPath.get(rel('/lib/DDD Course/lesson23.mp4'))!.position).toBe(23);
    });

    it('flat, composite "N.M" prefixes (Golang shape): all 128 files import, chapter+lesson order preserved', async () => {
      vi.useRealTimers();

      const files: FileRecord[] = [];
      for (let chapter = 1; chapter <= 16; chapter++) {
        for (let lesson = 1; lesson <= 8; lesson++) {
          files.push({
            path: `/lib/Golang Course/${String(chapter)}.${String(lesson)}.mp4`,
            mtime: BASE_TIME,
            size: 100,
          });
        }
      }

      const lessonRepo2 = makeLessonRepo();
      const scanRepo2 = makeScanRepo();
      const h = new RunScanHandler(
        libraryRepo,
        scanRepo2,
        makeCourseRepo(),
        lessonRepo2,
        new FakeFsAdapter(files),
        makePassthroughFfmpeg(),
        makeTranscriptRepo(),
        makeFakeAppConfig(),
        centrifugo,
        makeMetadataLinker(),
        makePosterSync(),
      );

      const scan = await h.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const saved = scanRepo2.store.get(scan.id)!;
      expect(saved.status).toBe('succeeded');
      expect(saved.errors).toHaveLength(0);
      expect(lessonRepo2.store.size).toBe(128);

      const positions = new Set([...lessonRepo2.store.values()].map((l) => l.position));
      expect(positions.size).toBe(128);

      const byVideoPath = new Map([...lessonRepo2.store.values()].map((l) => [l.videoPath, l]));
      // Chapter-then-lesson order: 1.1 first, 16.8 last — never colliding on
      // the repeated lesson number ("M") alone.
      expect(byVideoPath.get(rel('/lib/Golang Course/1.1.mp4'))!.position).toBe(1);
      expect(byVideoPath.get(rel('/lib/Golang Course/16.8.mp4'))!.position).toBe(128);
    });

    it('already-correct nested course (49 lessons, no collisions) still imports exactly 49 — no regression', async () => {
      vi.useRealTimers();

      // Lesson basenames are unique across the whole course, not just within
      // their own section — stemMatch() keys off the basename alone (it does
      // not consider the containing folder), so two sections both containing
      // a file named identically (e.g. "1 - Lesson 1.mp4") would collapse
      // into a single stem group and lose one of them. Real exports name
      // lessons uniquely course-wide, so the fixture does too.
      const files: FileRecord[] = [];
      for (let section = 1; section <= 7; section++) {
        for (let lesson = 1; lesson <= 7; lesson++) {
          files.push({
            path: `/lib/Git Course/0${String(section)} - Section ${String(section)}/${String(lesson)} - S${String(section)}L${String(lesson)}.mp4`,
            mtime: BASE_TIME,
            size: 100,
          });
        }
      }

      const lessonRepo2 = makeLessonRepo();
      const scanRepo2 = makeScanRepo();
      const h = new RunScanHandler(
        libraryRepo,
        scanRepo2,
        makeCourseRepo(),
        lessonRepo2,
        new FakeFsAdapter(files),
        makePassthroughFfmpeg(),
        makeTranscriptRepo(),
        makeFakeAppConfig(),
        centrifugo,
        makeMetadataLinker(),
        makePosterSync(),
      );

      const scan = await h.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const saved = scanRepo2.store.get(scan.id)!;
      expect(saved.status).toBe('succeeded');
      expect(saved.errors).toHaveLength(0);
      expect(lessonRepo2.store.size).toBe(49);
    });

    it('nested layout: ordinals repeating within a single section still import both lessons', async () => {
      vi.useRealTimers();

      // Two distinct lessons in the same section both carry leading ordinal
      // "1" — the exact shape lesson-loss-report.md calls out for Unity/JS
      // ("ordinals repeat inside sections too").
      const files: FileRecord[] = [
        { path: '/lib/Repeat Course/01 - Basics/1. Overview.mp4', mtime: BASE_TIME, size: 100 },
        { path: '/lib/Repeat Course/01 - Basics/1. Bonus.mp4', mtime: BASE_TIME, size: 100 },
      ];

      const lessonRepo2 = makeLessonRepo();
      const scanRepo2 = makeScanRepo();
      const h = new RunScanHandler(
        libraryRepo,
        scanRepo2,
        makeCourseRepo(),
        lessonRepo2,
        new FakeFsAdapter(files),
        makePassthroughFfmpeg(),
        makeTranscriptRepo(),
        makeFakeAppConfig(),
        centrifugo,
        makeMetadataLinker(),
        makePosterSync(),
      );

      const scan = await h.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const saved = scanRepo2.store.get(scan.id)!;
      expect(saved.status).toBe('succeeded');
      expect(saved.errors).toHaveLength(0);
      expect(lessonRepo2.store.size).toBe(2);
      const positions = [...lessonRepo2.store.values()].map((l) => l.position).toSorted();
      expect(positions).toEqual([1, 2]);
    });

    it('mixed folder: ordinal-parseable, trailing-digit, and bare-title files coexist in one section', async () => {
      vi.useRealTimers();

      const files: FileRecord[] = [
        { path: '/lib/Mixed Course/01 - Intro.mp4', mtime: BASE_TIME, size: 100 },
        { path: '/lib/Mixed Course/lesson2.mp4', mtime: BASE_TIME, size: 100 },
        { path: '/lib/Mixed Course/Bonus.mp4', mtime: BASE_TIME, size: 100 },
      ];

      const lessonRepo2 = makeLessonRepo();
      const scanRepo2 = makeScanRepo();
      const h = new RunScanHandler(
        libraryRepo,
        scanRepo2,
        makeCourseRepo(),
        lessonRepo2,
        new FakeFsAdapter(files),
        makePassthroughFfmpeg(),
        makeTranscriptRepo(),
        makeFakeAppConfig(),
        centrifugo,
        makeMetadataLinker(),
        makePosterSync(),
      );

      const scan = await h.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const saved = scanRepo2.store.get(scan.id)!;
      // "Bonus.mp4" parses no ordinal — advisory 'course-order-unreliable',
      // not a failure, but still a recorded ScanError → partial (#699). See
      // the "course-order-unreliable signal" describe block for the
      // dedicated test; this one still asserts zero *other* errors and the
      // resulting position order.
      expect(saved.status).toBe('partial');
      expect(saved.errors).toHaveLength(1);
      expect(saved.errors[0]?.code).toBe('course-order-unreliable');
      expect(lessonRepo2.store.size).toBe(3);

      const byVideoPath = new Map([...lessonRepo2.store.values()].map((l) => [l.videoPath, l]));
      expect(byVideoPath.get(rel('/lib/Mixed Course/01 - Intro.mp4'))!.position).toBe(1);
      expect(byVideoPath.get(rel('/lib/Mixed Course/lesson2.mp4'))!.position).toBe(2);
      expect(byVideoPath.get(rel('/lib/Mixed Course/Bonus.mp4'))!.position).toBe(3);
    });

    it('a genuine persist-time position conflict is recorded as a ScanError, never a silent overwrite', async () => {
      vi.useRealTimers();

      // assignLessonPositions() makes an application-level collision
      // structurally impossible (N entries always rank into N distinct
      // positions) — this exercises the remaining defensive backstop: an
      // unexpected DB-level (sectionId, position) conflict (e.g. a stale row)
      // still surfaces as a ScanError and the walk continues, rather than
      // throwing out of the scan or silently dropping the failure.
      const files: FileRecord[] = [
        { path: '/lib/Backstop Course/01 - First.mp4', mtime: BASE_TIME, size: 100 },
        { path: '/lib/Backstop Course/02 - Second.mp4', mtime: BASE_TIME, size: 100 },
      ];

      const lessonRepo2 = makeLessonRepo();
      lessonRepo2.save = vi.fn(async (l: Lesson) => {
        if (l.videoPath === rel('/lib/Backstop Course/02 - Second.mp4')) {
          throw new LessonPositionConflictError('simulated stale-row conflict');
        }
        lessonRepo2.store.set(l.id, l);
      });
      const scanRepo2 = makeScanRepo();
      const h = new RunScanHandler(
        libraryRepo,
        scanRepo2,
        makeCourseRepo(),
        lessonRepo2,
        new FakeFsAdapter(files),
        makePassthroughFfmpeg(),
        makeTranscriptRepo(),
        makeFakeAppConfig(),
        centrifugo,
        makeMetadataLinker(),
        makePosterSync(),
      );

      const scan = await h.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const saved = scanRepo2.store.get(scan.id)!;
      // Scan reaches a terminal state and reports the failure — never
      // silent, and partial rather than succeeded since it recorded one.
      expect(saved.status).toBe('partial');
      const err = saved.errors.find((e) => e.code === 'lesson-persist-failed');
      expect(err).toBeDefined();
      // The other lesson in the same course still gets persisted — one
      // failure does not sink the walk.
      expect(lessonRepo2.store.size).toBe(1);
      expect([...lessonRepo2.store.values()][0]!.videoPath).toBe(
        rel('/lib/Backstop Course/01 - First.mp4'),
      );
    });
  });

  // -------------------------------------------------------------------------
  // tuxedo 118: DiscoveredFile.size / Lesson.sizeBytes overflow Int32.
  // -------------------------------------------------------------------------
  describe('tuxedo 118: oversized video file size', () => {
    it('a file past Int32 range (~2.9 GiB) scans successfully and keeps its exact size', async () => {
      vi.useRealTimers();

      const OVERSIZED_BYTES = 3_129_930_702; // exceeds 2147483647 (Int32 max)
      const files: FileRecord[] = [
        { path: '/lib/Huge Course/01 - Intro.mp4', mtime: BASE_TIME, size: OVERSIZED_BYTES },
      ];

      const lessonRepo2 = makeLessonRepo();
      const scanRepo2 = makeScanRepo();
      const h = new RunScanHandler(
        libraryRepo,
        scanRepo2,
        makeCourseRepo(),
        lessonRepo2,
        new FakeFsAdapter(files),
        makePassthroughFfmpeg(),
        makeTranscriptRepo(),
        makeFakeAppConfig(),
        centrifugo,
        makeMetadataLinker(),
        makePosterSync(),
      );

      const scan = await h.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const saved = scanRepo2.store.get(scan.id)!;
      expect(saved.status).toBe('succeeded');
      expect(saved.errors).toHaveLength(0);
      const lesson = [...lessonRepo2.store.values()][0]!;
      expect(lesson.sizeBytes).toBe(OVERSIZED_BYTES);
    });
  });

  // -------------------------------------------------------------------------
  // E32-F01-S02: scoped rescan — POST /courses/{id}/rescan
  //
  // Fixture: two already-imported courses sharing one library. "Target
  // Course" gets a fresh, not-yet-ingested sidecar .srt dropped next to its
  // existing lesson — proves the scoped walk actually reprocessed its
  // folder. "Other Course" has its own existing lesson + Transcript row and
  // is included in the SAME fs fixture (the walk itself stays whole) but
  // must come out completely untouched — the trap the card is about.
  // -------------------------------------------------------------------------
  describe('E32-F01-S02: scoped rescan', () => {
    const targetFolder = 'Target Course';
    const targetVideoPath = `/lib/${targetFolder}/01 - Intro.mp4`;
    const targetSrtPath = `/lib/${targetFolder}/01 - Intro.en.srt`;

    const otherFolder = 'Other Course';
    const otherVideoPath = `/lib/${otherFolder}/01 - Intro.mp4`;

    function seedTwoCourses(
      courseRepo: ReturnType<typeof makeCourseRepo>,
      lessonRepo: ReturnType<typeof makeLessonRepo>,
    ): {
      targetCourseId: string;
      targetLessonId: string;
      otherCourseId: string;
      otherLessonId: string;
    } {
      const targetCourse = Course.create({
        id: 'course-target',
        libraryId: 'lib-1',
        slug: toSlugForTest(targetFolder),
        title: targetFolder,
      });
      courseRepo.store.set(targetCourse.id, targetCourse);
      const targetLesson = Lesson.create({
        id: 'lesson-target',
        courseId: targetCourse.id,
        sectionId: 'section-target',
        position: 1,
        title: 'Intro',
        videoPath: LibraryRelativePath.from(targetVideoPath, '/lib'),
        mtime: BASE_TIME,
        sizeBytes: 500,
      });
      lessonRepo.store.set(targetLesson.id, targetLesson);

      const otherCourse = Course.create({
        id: 'course-other',
        libraryId: 'lib-1',
        slug: toSlugForTest(otherFolder),
        title: otherFolder,
      });
      courseRepo.store.set(otherCourse.id, otherCourse);
      const otherLesson = Lesson.create({
        id: 'lesson-other',
        courseId: otherCourse.id,
        sectionId: 'section-other',
        position: 1,
        title: 'Intro',
        videoPath: LibraryRelativePath.from(otherVideoPath, '/lib'),
        mtime: BASE_TIME,
        sizeBytes: 500,
      });
      lessonRepo.store.set(otherLesson.id, otherLesson);

      return {
        targetCourseId: targetCourse.id,
        targetLessonId: targetLesson.id,
        otherCourseId: otherCourse.id,
        otherLessonId: otherLesson.id,
      };
    }

    function seedFixture() {
      const courseRepo2 = makeCourseRepo();
      const lessonRepo2 = makeLessonRepo();
      const ids = seedTwoCourses(courseRepo2, lessonRepo2);
      const transcriptRepo = makeTranscriptRepo();
      transcriptRepo.store.set(`${ids.otherLessonId}:en`, {
        origin: 'generated',
        sourceMtime: BASE_TIME,
        sourceSize: 500,
      });

      const files: FileRecord[] = [
        { path: targetVideoPath, mtime: BASE_TIME, size: 500 },
        // Fresh sidecar, not yet ingested — proves the scoped walk reprocessed it.
        {
          path: targetSrtPath,
          mtime: BASE_TIME,
          size: 30,
          content: '1\n00:00:00,000 --> 00:00:01,000\nHello\n',
        },
        // Present in the SAME walk (the walk stays whole) but must not be touched.
        { path: otherVideoPath, mtime: BASE_TIME, size: 500 },
      ];

      const scanRepo2 = makeScanRepo();
      const h = new RunScanHandler(
        libraryRepo,
        scanRepo2,
        courseRepo2,
        lessonRepo2,
        new FakeFsAdapter(files),
        makePassthroughFfmpeg(),
        transcriptRepo,
        makeFakeAppConfig(),
        centrifugo,
        makeMetadataLinker(),
        makePosterSync(),
      );

      return { h, scanRepo2, courseRepo2, lessonRepo2, transcriptRepo, ids };
    }

    it('imports the named course: the scoped walk reprocesses its own folder', async () => {
      vi.useRealTimers();
      const { h, scanRepo2, transcriptRepo, ids } = seedFixture();

      const scan = await h.execute(
        new RunScanCommand(undefined, ACTOR_USER_ID, { courseId: ids.targetCourseId }),
      );
      await drainMicrotasks();

      const saved = scanRepo2.store.get(scan.id)!;
      expect(saved.status).toBe('succeeded');
      expect(saved.errors.filter((e) => e.code === 'subtitle-sidecar-invalid')).toHaveLength(0);

      // The fresh sidecar next to the target's existing lesson got ingested.
      expect(transcriptRepo.replaceSidecar).toHaveBeenCalledWith(
        expect.objectContaining({ lessonId: ids.targetLessonId, language: 'en' }),
      );
    });

    it('leaves other courses lessons and transcripts untouched (the test that matters)', async () => {
      vi.useRealTimers();
      const { h, lessonRepo2, transcriptRepo, ids } = seedFixture();

      await h.execute(
        new RunScanCommand(undefined, ACTOR_USER_ID, { courseId: ids.targetCourseId }),
      );
      await drainMicrotasks();

      // Other course's lesson row: untouched.
      expect(lessonRepo2.store.has(ids.otherLessonId)).toBe(true);
      // Other course's Transcript row: NOT cleaned up as an orphan, even
      // though its videoPath never appeared in this scan's seenVideoPaths —
      // it must never have been a cleanup CANDIDATE in the first place.
      expect(transcriptRepo.deleteForLesson).not.toHaveBeenCalledWith(ids.otherLessonId);
      expect(transcriptRepo.store.has(`${ids.otherLessonId}:en`)).toBe(true);
    });

    it('names the scope on the scan record and every lifecycle event', async () => {
      vi.useRealTimers();

      const scopedCentrifugo = makeCentrifugoService();
      const courseRepo2 = makeCourseRepo();
      const targetCourse = Course.create({
        id: 'course-target',
        libraryId: 'lib-1',
        slug: toSlugForTest(targetFolder),
        title: targetFolder,
      });
      courseRepo2.store.set(targetCourse.id, targetCourse);
      const lessonRepo2 = makeLessonRepo();
      lessonRepo2.store.set(
        'lesson-target',
        Lesson.create({
          id: 'lesson-target',
          courseId: targetCourse.id,
          sectionId: 'section-target',
          position: 1,
          title: 'Intro',
          videoPath: LibraryRelativePath.from(targetVideoPath, '/lib'),
          mtime: BASE_TIME,
          sizeBytes: 500,
        }),
      );
      const scanRepo2 = makeScanRepo();
      const h = new RunScanHandler(
        libraryRepo,
        scanRepo2,
        courseRepo2,
        lessonRepo2,
        new FakeFsAdapter([{ path: targetVideoPath, mtime: BASE_TIME, size: 500 }]),
        makePassthroughFfmpeg(),
        makeTranscriptRepo(),
        makeFakeAppConfig(),
        scopedCentrifugo,
        makeMetadataLinker(),
        makePosterSync(),
      );

      const scan = await h.execute(
        new RunScanCommand(undefined, ACTOR_USER_ID, { courseId: targetCourse.id }),
      );
      expect(scan.scopeCourseId).toBe(targetCourse.id);
      expect(scan.scopeCourseName).toBe(targetFolder);

      expect(scopedCentrifugo.publish).toHaveBeenCalledWith(
        `scans:user:${ACTOR_USER_ID}`,
        expect.objectContaining({
          kind: 'started',
          scopeCourseId: targetCourse.id,
          scopeCourseName: targetFolder,
        }),
      );

      await drainMicrotasks();

      const finishedCalls = vi
        .mocked(scopedCentrifugo.publish)
        .mock.calls.filter(([, data]) => (data as { kind: string }).kind === 'finished');
      expect(finishedCalls).toHaveLength(1);
      expect(finishedCalls[0]?.[1]).toEqual(
        expect.objectContaining({
          scopeCourseId: targetCourse.id,
          scopeCourseName: targetFolder,
        }),
      );

      const saved = scanRepo2.store.get(scan.id)!;
      expect(saved.scopeCourseId).toBe(targetCourse.id);
      expect(saved.scopeCourseName).toBe(targetFolder);
    });

    it('throws CourseNotFoundError for an unknown courseId', async () => {
      await expect(
        handler.execute(new RunScanCommand(undefined, ACTOR_USER_ID, { courseId: 'nonexistent' })),
      ).rejects.toBeInstanceOf(CourseNotFoundError);
    });

    it('a scoped course with no existing lessons cannot be resolved: records an error, touches nothing', async () => {
      vi.useRealTimers();

      const courseRepo2 = makeCourseRepo();
      const lessonRepo2 = makeLessonRepo();
      const orphanCourse = Course.create({
        id: 'course-no-lessons',
        libraryId: 'lib-1',
        slug: 'no-lessons',
        title: 'No Lessons Course',
      });
      courseRepo2.store.set(orphanCourse.id, orphanCourse);
      // A second, unrelated course WITH lessons — must stay untouched.
      const ids = seedTwoCourses(courseRepo2, lessonRepo2);
      const transcriptRepo = makeTranscriptRepo();
      transcriptRepo.store.set(`${ids.otherLessonId}:en`, {
        origin: 'generated',
        sourceMtime: BASE_TIME,
        sourceSize: 500,
      });

      const files: FileRecord[] = [{ path: otherVideoPath, mtime: BASE_TIME, size: 500 }];
      const scanRepo2 = makeScanRepo();
      const h = new RunScanHandler(
        libraryRepo,
        scanRepo2,
        courseRepo2,
        lessonRepo2,
        new FakeFsAdapter(files),
        makePassthroughFfmpeg(),
        transcriptRepo,
        makeFakeAppConfig(),
        centrifugo,
        makeMetadataLinker(),
        makePosterSync(),
      );

      const scan = await h.execute(
        new RunScanCommand(undefined, ACTOR_USER_ID, { courseId: orphanCourse.id }),
      );
      await drainMicrotasks();

      const saved = scanRepo2.store.get(scan.id)!;
      const err = saved.errors.find((e) => e.code === 'course-scope-unresolvable');
      expect(err).toBeDefined();

      // The unrelated "Other Course" is untouched.
      expect(transcriptRepo.deleteForLesson).not.toHaveBeenCalled();
      expect(transcriptRepo.store.has(`${ids.otherLessonId}:en`)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // E32-F01-S03: a scoped rescan force-resyncs the course it names.
  //
  // Fixture — one library, two already-imported courses:
  //
  //   /lib/Target Course/01 - Basics/01 - Intro.mp4     ← on disk, NOT in DB
  //   /lib/Target Course/01 - Basics/02 - Values.mp4    ← on disk and in DB
  //   /lib/Target Course/02 - Advanced/01 - Deep.mp4    ← on disk, NOT in DB
  //   /lib/Other Course/01 - Intro.mp4                  ← on disk and in DB
  //
  // The target course in the DB is a partial, stale import — the shape the
  // maintainer's library was actually in (1577 of 5984 lessons missing):
  //   - "02 - Values" sits at position 1, because it was the only lesson the
  //     first import wrote, so bringing "01 - Intro" back has to renumber it;
  //   - "99 - Removed.mp4" has a lesson row but no file on disk;
  //   - the course was renamed through the API, so neither its title nor its
  //     slug matches the folder any more;
  //   - only the "Basics" section exists; "Advanced" was never imported.
  // -------------------------------------------------------------------------
  describe('E32-F01-S03: force-resync on a scoped rescan', () => {
    const targetFolder = 'Target Course';
    const introPath = `/lib/${targetFolder}/01 - Basics/01 - Intro.mp4`;
    const valuesPath = `/lib/${targetFolder}/01 - Basics/02 - Values.mp4`;
    const deepPath = `/lib/${targetFolder}/02 - Advanced/01 - Deep.mp4`;
    const removedPath = `/lib/${targetFolder}/01 - Basics/99 - Removed.mp4`;
    const otherFolder = 'Other Course';
    const otherVideoPath = `/lib/${otherFolder}/01 - Intro.mp4`;

    // A rename through PATCH /courses/{id} changes the title and leaves the
    // slug alone (`update-course-metadata.handler.ts` treats them as separate
    // patch fields), so the slug the first import derived from the folder is
    // still what the DB holds — which is exactly what makes the v1 skip fire
    // on this course and why a rescan used to be unable to repair it.
    const RENAMED_TITLE = 'Clean Architecture, my own name for it';

    function seedFixture(slug: string = toSlugForTest(targetFolder)) {
      const courseRepo2 = makeCourseRepo();
      const lessonRepo2 = makeLessonRepo();
      const transcriptRepo = makeTranscriptRepo();

      const target = Course.create({
        id: 'course-target',
        libraryId: 'lib-1',
        slug,
        title: RENAMED_TITLE,
      });
      target.addSection({ id: 'sec-basics', title: 'Basics', position: 1 });
      courseRepo2.store.set(target.id, target);

      lessonRepo2.store.set(
        'lesson-values',
        Lesson.create({
          id: 'lesson-values',
          courseId: target.id,
          sectionId: 'sec-basics',
          position: 1,
          title: 'Values',
          videoPath: LibraryRelativePath.from(valuesPath, '/lib'),
          mtime: BASE_TIME,
          sizeBytes: 500,
        }),
      );
      lessonRepo2.store.set(
        'lesson-removed',
        Lesson.create({
          id: 'lesson-removed',
          courseId: target.id,
          sectionId: 'sec-basics',
          position: 2,
          title: 'Removed',
          videoPath: LibraryRelativePath.from(removedPath, '/lib'),
          mtime: BASE_TIME,
          sizeBytes: 500,
        }),
      );
      // The vanished lesson's generated transcript — must go with the row.
      transcriptRepo.store.set('lesson-removed:en', {
        origin: 'generated',
        sourceMtime: BASE_TIME,
        sourceSize: 500,
      });

      const other = Course.create({
        id: 'course-other',
        libraryId: 'lib-1',
        slug: toSlugForTest(otherFolder),
        title: otherFolder,
      });
      other.addSection({ id: 'sec-other', title: 'Lessons', position: 1 });
      courseRepo2.store.set(other.id, other);
      lessonRepo2.store.set(
        'lesson-other',
        Lesson.create({
          id: 'lesson-other',
          courseId: other.id,
          sectionId: 'sec-other',
          position: 1,
          title: 'Intro',
          videoPath: LibraryRelativePath.from(otherVideoPath, '/lib'),
          mtime: BASE_TIME,
          sizeBytes: 500,
        }),
      );

      const files: FileRecord[] = [
        { path: introPath, mtime: BASE_TIME, size: 100 },
        { path: valuesPath, mtime: BASE_TIME, size: 500 },
        { path: deepPath, mtime: BASE_TIME, size: 300 },
        { path: otherVideoPath, mtime: BASE_TIME, size: 500 },
      ];

      const scanRepo2 = makeScanRepo();
      const h = new RunScanHandler(
        libraryRepo,
        scanRepo2,
        courseRepo2,
        lessonRepo2,
        new FakeFsAdapter(files),
        makePassthroughFfmpeg(),
        transcriptRepo,
        makeFakeAppConfig(),
        centrifugo,
        makeMetadataLinker(),
        makePosterSync(),
      );

      return { h, scanRepo2, courseRepo2, lessonRepo2, transcriptRepo, target };
    }

    async function rescanTarget() {
      vi.useRealTimers();
      const fixture = seedFixture();
      const scan = await fixture.h.execute(
        new RunScanCommand(undefined, ACTOR_USER_ID, { courseId: 'course-target' }),
      );
      await drainMicrotasks();
      return { ...fixture, saved: fixture.scanRepo2.store.get(scan.id)! };
    }

    it('imports the lessons the first scan missed: lesson count matches file count', async () => {
      const { lessonRepo2, saved } = await rescanTarget();

      expect(saved.status).toBe('succeeded');
      expect(saved.errors).toHaveLength(0);

      const videoPaths = [...lessonRepo2.store.values()]
        .filter((l) => l.courseId === 'course-target')
        .map((l) => l.videoPath)
        .toSorted();
      expect(videoPaths).toEqual([introPath, valuesPath, deepPath].map((p) => rel(p)).toSorted());
    });

    it('renumbers every section to 1..n — no gaps, no duplicates', async () => {
      const { lessonRepo2, courseRepo2 } = await rescanTarget();

      const course = courseRepo2.store.get('course-target')!;
      expect(course.sections.map((s) => s.title)).toEqual(['Basics', 'Advanced']);
      expect(course.sections.map((s) => s.position)).toEqual([1, 2]);

      for (const section of course.sections) {
        const positions = [...lessonRepo2.store.values()]
          .filter((l) => l.sectionId === section.id)
          .map((l) => l.position)
          .toSorted((a, b) => a - b);
        expect(positions).toEqual(Array.from({ length: positions.length }, (_, i) => i + 1));
      }

      // The stale lesson really did move: it was position 1 before the resync.
      expect(lessonRepo2.store.get('lesson-values')!.position).toBe(2);
    });

    it('keeps the id of a lesson still on disk — progress, bookmarks and notes hang off it', async () => {
      const { lessonRepo2 } = await rescanTarget();

      const values = lessonRepo2.store.get('lesson-values');
      expect(values).toBeDefined();
      expect(values!.videoPath).toBe(rel(valuesPath));
      // ...and no second row was minted for the same file.
      expect(
        [...lessonRepo2.store.values()].filter((l) => l.videoPath === rel(valuesPath)),
      ).toHaveLength(1);
    });

    it('reuses the existing section id instead of recreating it (Lesson.section cascades — #317)', async () => {
      const { courseRepo2 } = await rescanTarget();

      const basics = courseRepo2.store
        .get('course-target')!
        .sections.find((s) => s.title === 'Basics');
      expect(basics?.id).toBe('sec-basics');
    });

    it('leaves the course metadata the user edited alone', async () => {
      const { courseRepo2 } = await rescanTarget();

      const course = courseRepo2.store.get('course-target')!;
      // The folder is "Target Course"; the title is not, and stays not.
      expect(course.title).toBe(RENAMED_TITLE);
      expect(course.slug).toBe(toSlugForTest(targetFolder));
    });

    it('never mints a second course, even when the slug no longer matches the folder', async () => {
      vi.useRealTimers();
      // Slug edited through the API too, so the folder's own slug is not in the
      // library any more — the branch where the v1 skip would NOT have fired
      // and the walk would have imported the folder a second time as a new
      // course, duplicating every lesson under it.
      const { h, courseRepo2, lessonRepo2 } = seedFixture('renamed-by-hand');

      await h.execute(new RunScanCommand(undefined, ACTOR_USER_ID, { courseId: 'course-target' }));
      await drainMicrotasks();

      expect([...courseRepo2.store.values()].map((c) => c.id).toSorted()).toEqual([
        'course-other',
        'course-target',
      ]);
      expect(courseRepo2.store.get('course-target')!.slug).toBe('renamed-by-hand');
      expect(
        [...lessonRepo2.store.values()].filter((l) => l.videoPath === rel(valuesPath)),
      ).toHaveLength(1);
    });

    it('removes a lesson whose video is gone, with its transcript and learning rows', async () => {
      const { lessonRepo2, transcriptRepo } = await rescanTarget();

      expect(transcriptRepo.deleteForLesson).toHaveBeenCalledWith('lesson-removed');
      expect(transcriptRepo.store.has('lesson-removed:en')).toBe(false);
      // removeMany is what takes LessonProgress / Bookmark / Note with the row
      // — they reference lessonId with no foreign key. The delete order itself
      // is asserted in prisma-lesson.repository.spec.ts.
      expect(lessonRepo2.removeMany).toHaveBeenCalledWith(['lesson-removed']);
      expect(lessonRepo2.store.has('lesson-removed')).toBe(false);
    });

    it('does not delete anything when the course folder itself is gone from disk', async () => {
      vi.useRealTimers();
      const { courseRepo2, lessonRepo2, transcriptRepo } = seedFixture();
      const scanRepo2 = makeScanRepo();
      // Same seed, but the whole "Target Course" folder has disappeared —
      // every one of its lessons looks vanished to the walk.
      const h = new RunScanHandler(
        libraryRepo,
        scanRepo2,
        courseRepo2,
        lessonRepo2,
        new FakeFsAdapter([{ path: otherVideoPath, mtime: BASE_TIME, size: 500 }]),
        makePassthroughFfmpeg(),
        transcriptRepo,
        makeFakeAppConfig(),
        centrifugo,
        makeMetadataLinker(),
        makePosterSync(),
      );

      await h.execute(new RunScanCommand(undefined, ACTOR_USER_ID, { courseId: 'course-target' }));
      await drainMicrotasks();

      expect(lessonRepo2.removeMany).not.toHaveBeenCalled();
      expect(lessonRepo2.store.has('lesson-values')).toBe(true);
      expect(lessonRepo2.store.has('lesson-removed')).toBe(true);
    });

    it('leaves every other course in the library untouched', async () => {
      const { lessonRepo2, courseRepo2, transcriptRepo } = await rescanTarget();

      const other = lessonRepo2.store.get('lesson-other')!;
      expect(other.position).toBe(1);
      expect(other.sectionId).toBe('sec-other');
      expect(courseRepo2.store.get('course-other')!.sections).toHaveLength(1);
      expect(transcriptRepo.deleteForLesson).not.toHaveBeenCalledWith('lesson-other');
      expect(lessonRepo2.parkPositionsForResync).toHaveBeenCalledTimes(1);
      expect(lessonRepo2.parkPositionsForResync).toHaveBeenCalledWith('course-target');
    });

    it('a library-wide scan reconciles a course it already imported, not skips it (#544)', async () => {
      vi.useRealTimers();
      const { courseRepo2, lessonRepo2, transcriptRepo } = seedFixture();
      const scanRepo2 = makeScanRepo();
      // "Other Course" keeps the slug its folder produces, and its folder now
      // has a second video the DB does not know about yet.
      const h = new RunScanHandler(
        libraryRepo,
        scanRepo2,
        courseRepo2,
        lessonRepo2,
        new FakeFsAdapter([
          { path: otherVideoPath, mtime: BASE_TIME, size: 500 },
          { path: `/lib/${otherFolder}/02 - Second.mp4`, mtime: BASE_TIME, size: 500 },
        ]),
        makePassthroughFfmpeg(),
        transcriptRepo,
        makeFakeAppConfig(),
        centrifugo,
        makeMetadataLinker(),
        makePosterSync(),
      );

      const scan = await h.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      // The new file WAS imported: a library-wide scan now reconciles an
      // already-imported folder instead of skipping it (#544).
      const otherLessons = [...lessonRepo2.store.values()].filter(
        (l) => l.courseId === 'course-other',
      );
      expect(otherLessons).toHaveLength(2);
      // The pre-existing lesson kept its id — no re-import minted a fresh one.
      expect(otherLessons.find((l) => l.videoPath === rel(otherVideoPath))?.id).toBe(
        'lesson-other',
      );
      expect(lessonRepo2.parkPositionsForResync).toHaveBeenCalledWith('course-other');
      // Reconcile is narrower than force-resync: never deletes a lesson.
      expect(lessonRepo2.removeMany).not.toHaveBeenCalled();
      expect(scanRepo2.store.get(scan.id)!.errors).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Sibling section folders holding identically-named videos.
  //
  // `stemGroups` is built once per COURSE and `stemMatch` reads the basename
  // only, so keying it by the stem alone collapsed every `video.mp4` in the
  // course into one group — `group.video` overwrote the previous one with no
  // error and no warning, and only the last folder walked produced a lesson.
  // Measured on the maintainer's library: a 31-video course imported one
  // lesson; 296 videos across 18 courses lost the same way.
  // -------------------------------------------------------------------------
  describe('identically-named videos in sibling section folders', () => {
    const folder = 'Chess Course';
    const sectionCount = 4;
    // Distinct section folder titles, identical video filenames — the exact
    // shape of the course that imported one lesson out of thirty-one.
    const videoPaths = Array.from(
      { length: sectionCount },
      (_, i) =>
        `/lib/${folder}/${String(i + 1).padStart(2, '0')} - Part ${String(i + 1)}/video.mp4`,
    );

    it('imports one lesson per folder, not one lesson for the whole course', async () => {
      vi.useRealTimers();
      const courseRepo2 = makeCourseRepo();
      const lessonRepo2 = makeLessonRepo();
      const scanRepo2 = makeScanRepo();
      const h = new RunScanHandler(
        libraryRepo,
        scanRepo2,
        courseRepo2,
        lessonRepo2,
        new FakeFsAdapter(videoPaths.map((p) => ({ path: p, mtime: BASE_TIME, size: 100 }))),
        makePassthroughFfmpeg(),
        makeTranscriptRepo(),
        makeFakeAppConfig(),
        centrifugo,
        makeMetadataLinker(),
        makePosterSync(),
      );

      const scan = await h.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const saved = scanRepo2.store.get(scan.id)!;
      // Every "video.mp4" parses no ordinal — one advisory
      // 'course-order-unreliable' for the whole course, not a failure and not
      // one per section.
      expect(saved.errors).toHaveLength(1);
      expect(saved.errors[0]?.code).toBe('course-order-unreliable');
      expect(saved.errors[0]?.message).toContain(
        `${String(sectionCount)} of ${String(sectionCount)} lesson(s)`,
      );
      expect([...lessonRepo2.store.values()].map((l) => l.videoPath).toSorted()).toEqual(
        videoPaths.map((p) => rel(p)).toSorted(),
      );
      // One section each, one lesson in each — never two lessons fighting over
      // a single (sectionId, position).
      const course = [...courseRepo2.store.values()][0]!;
      expect(course.sections).toHaveLength(sectionCount);
      for (const section of course.sections) {
        expect(
          [...lessonRepo2.store.values()].filter((l) => l.sectionId === section.id),
        ).toHaveLength(1);
      }
    });

    it('still pairs a sidecar with the video it sits next to, not with a namesake elsewhere', async () => {
      vi.useRealTimers();
      const courseRepo2 = makeCourseRepo();
      const files: FileRecord[] = videoPaths.flatMap((p) => [
        { path: p, mtime: BASE_TIME, size: 100 },
        { path: p.replace('.mp4', '.en.srt'), mtime: BASE_TIME, size: 30, content: MINIMAL_SRT },
        { path: p.replace('video.mp4', 'video.pdf'), mtime: BASE_TIME, size: 20 },
      ]);
      const lessonRepo2 = makeLessonRepo();
      const scanRepo2 = makeScanRepo();
      const h = new RunScanHandler(
        libraryRepo,
        scanRepo2,
        courseRepo2,
        lessonRepo2,
        new FakeFsAdapter(files),
        makePassthroughFfmpeg(),
        makeTranscriptRepo(),
        makeFakeAppConfig(),
        centrifugo,
        makeMetadataLinker(),
        makePosterSync(),
      );

      await h.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const scan = [...scanRepo2.store.values()][0]!;
      expect(scan.errors.filter((e) => e.code === 'unsupported-extension')).toHaveLength(0);

      // Every lesson carries exactly its own folder's sidecars. Subtitle/
      // Material paths are library-relative too now (tuxedo 174, same
      // LibraryRelativePath guard #554 gave videoPath), so the comparison
      // resolves each back to absolute via the same library root.
      for (const lesson of lessonRepo2.store.values()) {
        const absoluteVideoPath = lesson.absoluteVideoPath('/lib');
        const dir = absoluteVideoPath.slice(0, absoluteVideoPath.lastIndexOf('/'));
        expect(lesson.subtitles.map((s) => s.absolutePath('/lib'))).toEqual([
          `${dir}/video.en.srt`,
        ]);
        expect(lesson.materials.map((m) => m.absolutePath('/lib'))).toEqual([`${dir}/video.pdf`]);
      }
    });

    it('a rescan back-fills the namesake lessons a previous import collapsed', async () => {
      vi.useRealTimers();
      // The DB as the old grouping left it: one section per folder, but a
      // single lesson — the last folder walked.
      const courseRepo2 = makeCourseRepo();
      const lessonRepo2 = makeLessonRepo();
      const course = Course.create({
        id: 'course-chess',
        libraryId: 'lib-1',
        slug: toSlugForTest(folder),
        title: folder,
      });
      for (const [i] of videoPaths.entries()) {
        course.addSection({
          id: `sec-${String(i + 1)}`,
          title: `Part ${String(i + 1)}`,
          position: i + 1,
        });
      }
      courseRepo2.store.set(course.id, course);
      const survivor = videoPaths.at(-1)!;
      lessonRepo2.store.set(
        'lesson-survivor',
        Lesson.create({
          id: 'lesson-survivor',
          courseId: course.id,
          sectionId: `sec-${String(sectionCount)}`,
          position: 1,
          title: 'video',
          videoPath: LibraryRelativePath.from(survivor, '/lib'),
          mtime: BASE_TIME,
          sizeBytes: 100,
        }),
      );

      const scanRepo2 = makeScanRepo();
      const h = new RunScanHandler(
        libraryRepo,
        scanRepo2,
        courseRepo2,
        lessonRepo2,
        new FakeFsAdapter(videoPaths.map((p) => ({ path: p, mtime: BASE_TIME, size: 100 }))),
        makePassthroughFfmpeg(),
        makeTranscriptRepo(),
        makeFakeAppConfig(),
        centrifugo,
        makeMetadataLinker(),
        makePosterSync(),
      );

      await h.execute(new RunScanCommand(undefined, ACTOR_USER_ID, { courseId: course.id }));
      await drainMicrotasks();

      expect([...lessonRepo2.store.values()].map((l) => l.videoPath).toSorted()).toEqual(
        videoPaths.map((p) => rel(p)).toSorted(),
      );
      // The one lesson that did survive keeps its id — its progress and
      // bookmarks are the only ones in this course that ever existed.
      expect(lessonRepo2.store.get('lesson-survivor')?.videoPath).toBe(rel(survivor));
    });
  });

  // -------------------------------------------------------------------------
  // tuxedo 132: a Latin-free course title must not delete the course.
  //
  // toSlug used to strip `[^a-z0-9]`, so every Latin-free title reduced to ''
  // and fell back to the literal 'untitled'. The duplicate-slug guard then
  // treated the second such folder as already-imported and `continue`d, with
  // no ScanError. Measured on the maintainer's library: eight Cyrillic course
  // folders, one imported, seven dropped, 253 lessons gone.
  // -------------------------------------------------------------------------
  /** Repositories a scan writes into, so a second scan can reuse the first's state. */
  interface ScanRepos {
    courseRepo: ReturnType<typeof makeCourseRepo>;
    lessonRepo: ReturnType<typeof makeLessonRepo>;
  }

  /**
   * Runs one library-wide scan over a fixture of one video per top-level
   * folder. Pass the previous call's result back in as `repos` to rescan the
   * same library — that is what makes the idempotency assertions below real.
   */
  async function scanFolders(
    folders: string[],
    repos?: ScanRepos,
  ): Promise<ScanRepos & { courses: Course[]; lessons: Lesson[]; scan: Scan }> {
    const courseRepo2 = repos?.courseRepo ?? makeCourseRepo();
    const lessonRepo2 = repos?.lessonRepo ?? makeLessonRepo();
    const scanRepo2 = makeScanRepo();
    const files: FileRecord[] = folders.map((f) => ({
      path: `/lib/${f}/01 - Intro.mp4`,
      mtime: BASE_TIME,
      size: 100,
    }));
    const h = new RunScanHandler(
      libraryRepo,
      scanRepo2,
      courseRepo2,
      lessonRepo2,
      new FakeFsAdapter(files),
      makePassthroughFfmpeg(),
      makeTranscriptRepo(),
      makeFakeAppConfig(),
      centrifugo,
      makeMetadataLinker(),
      makePosterSync(),
    );

    const started = await h.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
    await drainMicrotasks();

    return {
      courses: [...courseRepo2.store.values()],
      lessons: [...lessonRepo2.store.values()],
      scan: scanRepo2.store.get(started.id)!,
      courseRepo: courseRepo2,
      lessonRepo: lessonRepo2,
    };
  }

  describe('tuxedo 132: non-Latin course titles', () => {
    const CYRILLIC_FOLDERS = [
      'Графы и комбинаторика',
      'Алгоритмы и структуры данных',
      'Дискретная математика',
      'Теория вероятностей',
      'Линейная алгебра',
      'Математический анализ',
      'Функциональное программирование',
      'Основы криптографии',
    ];

    it('imports every Latin-free course, each under its own slug', async () => {
      vi.useRealTimers();
      const { courses, lessons, scan } = await scanFolders(CYRILLIC_FOLDERS);

      // The assertion whose absence cost 253 lessons: eight folders in, eight
      // courses out — not one course and seven silent skips.
      expect(courses).toHaveLength(CYRILLIC_FOLDERS.length);
      expect(lessons).toHaveLength(CYRILLIC_FOLDERS.length);
      expect(scan.coursesDiscovered).toBe(courses.length);

      const slugs = courses.map((c) => c.slug);
      expect(new Set(slugs).size).toBe(CYRILLIC_FOLDERS.length);
      expect(slugs).not.toContain('untitled');
      expect(slugs).toContain('графы-и-комбинаторика');

      expect(scan.status).toBe('succeeded');
      expect(scan.errors).toHaveLength(0);
    });

    it('accented Latin still slugifies the way it always did', async () => {
      vi.useRealTimers();
      const { courses } = await scanFolders(['Café Racer', 'Naive Bayes']);
      expect(courses.map((c) => c.slug).toSorted()).toEqual(['café-racer', 'naive-bayes']);
    });

    it('rescanning a Cyrillic library is a no-op, not a re-import', async () => {
      vi.useRealTimers();
      const first = await scanFolders(CYRILLIC_FOLDERS);
      const second = await scanFolders(CYRILLIC_FOLDERS, first);

      expect(first.courses).toHaveLength(CYRILLIC_FOLDERS.length);
      expect(second.courses.map((c) => c.slug).toSorted()).toEqual(
        first.courses.map((c) => c.slug).toSorted(),
      );
      expect(second.scan.errors).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // A slug collision is a naming coincidence, not an import. Both folders are
  // real courses and both must land; the loser takes a deterministic
  // folder-derived discriminator and the operator is told it happened.
  // -------------------------------------------------------------------------
  describe('tuxedo 132: slug collisions', () => {
    // Two distinct folders whose titles reduce to the same slug.
    const COLLIDING = ['Графы!', 'Графы?'];

    it('imports both colliding courses and records a ScanError', async () => {
      vi.useRealTimers();
      const { courses, lessons, scan } = await scanFolders(COLLIDING);

      expect(courses).toHaveLength(2);
      expect(lessons).toHaveLength(2);

      const slugs = courses.map((c) => c.slug).toSorted();
      expect(slugs).toContain('графы');
      expect(new Set(slugs).size).toBe(2);
      // The loser keeps the base slug as its stem and gains a suffix.
      expect(slugs.find((s) => s !== 'графы')).toMatch(/^графы-[\da-f]{8}$/u);

      // Reported, not silent — one course-slug-collision ScanError → partial.
      expect(scan.status).toBe('partial');
      const collision = scan.errors.filter((e) => e.code === 'course-slug-collision');
      expect(collision).toHaveLength(1);
      expect(collision[0]!.message).toContain('графы-');
    });

    it('gives the same folder the same discriminated slug on every scan', async () => {
      vi.useRealTimers();
      const first = await scanFolders(COLLIDING);
      const second = await scanFolders(COLLIDING, first);

      // A counter-based discriminator would renumber here and import a third
      // course; a folder-derived one reproduces the same two slugs and skips.
      expect(second.courses.map((c) => c.slug).toSorted()).toEqual(
        first.courses.map((c) => c.slug).toSorted(),
      );
      expect(second.courses).toHaveLength(2);
      // Nothing was dropped this time, so nothing is reported either.
      expect(second.scan.errors.filter((e) => e.code === 'course-slug-collision')).toHaveLength(0);
    });

    it('treats the two Unicode encodings of one folder title as one slug', async () => {
      vi.useRealTimers();
      // Same visual name, two encodings — what a library shared between macOS
      // (NFD) and Linux (NFC) actually looks like on disk. Both are real
      // folders, so both import; NFC normalisation is what makes the second
      // one collide (and be reported) instead of silently becoming a second
      // row the unique index cannot see as a duplicate.
      const nfc = 'Йога';
      const nfd = nfc.normalize('NFD');
      expect(nfc).not.toBe(nfd);

      const { courses, scan } = await scanFolders([nfc, nfd]);

      const slugs = courses.map((c) => c.slug).toSorted();
      expect(slugs).toHaveLength(2);
      expect(slugs).toContain('йога');
      expect(slugs.find((s) => s !== 'йога')).toMatch(/^йога-[\da-f]{8}$/u);
      expect(scan.errors.filter((e) => e.code === 'course-slug-collision')).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // #504: a library-wide scan must not duplicate a course whose slug was
  // edited through the API. update-course-metadata.handler.ts treats title
  // and slug as independent patch fields, so an operator editing the slug
  // alone leaves the folder-derived slug the next scan computes pointing at
  // nothing in `existingSlugSet` — the skip used to miss and re-import the
  // folder as a second course with fresh lesson ids. The folder is matched on
  // its own identity (a lesson's videoPath), which an API edit cannot touch.
  // -------------------------------------------------------------------------
  describe('#504: a slug edited through the API', () => {
    it('does not stop the next scan from recognising the folder as already imported', async () => {
      vi.useRealTimers();
      const folder = 'Edited Slug Course';

      const first = await scanFolders([folder]);
      expect(first.courses).toHaveLength(1);
      expect(first.lessons).toHaveLength(1);

      // Simulate PATCH /courses/{id} { slug: '...' } — same repo.save() call
      // update-course-metadata.handler.ts makes.
      const course = first.courses[0]!;
      course.changeSlug('operator-renamed-slug');
      await first.courseRepo.save(course);

      const second = await scanFolders([folder], first);

      // One course, not two — matched on the folder, not the now-stale
      // derived slug.
      expect(second.courses).toHaveLength(1);
      expect(second.courses[0]!.slug).toBe('operator-renamed-slug');
      // One lesson, and the SAME lesson — no re-import minted a fresh id.
      expect(second.lessons).toHaveLength(1);
      expect(second.lessons[0]!.id).toBe(first.lessons[0]!.id);
      expect(second.scan.errors).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // #544: library-wide scan reconciles an already-imported folder.
  //
  // The maintainer's production library, measured: 5973 (course, sectionId,
  // position, filename) rows dumped from prod and run through the real
  // `parseLessonFileName` + `assignLessonPositions` (reproduced independently
  // here, not copied from the issue) show 153 lessons across exactly 6
  // courses sitting at a stale position — data imported before the current
  // filename parser existed. A library-wide scan used to skip every one of
  // those 6 folders outright (`importedFolderNames.has(folderName) →
  // continue`), so nothing short of an operator rescanning each of the 6 by
  // hand could ever fix it.
  // -------------------------------------------------------------------------
  describe('#544: library-wide reconcile', () => {
    // -----------------------------------------------------------------------
    // The safety net #544 needs: `existingLessonByVideoPath` spans every
    // course in the library on a library-wide scan (unlike a scoped rescan,
    // where it is one course's own lessons). Reuse is now live on that path
    // too, so a lesson id must never be adopted from a course other than the
    // one being reconciled — without the `courseId` check this test fails:
    // "Course A"'s reconcile would rewrite "lesson-b-stray" in place,
    // silently moving it (and every row that references its id with no FK
    // behind it — progress, bookmarks, notes, transcripts) from Course B to
    // Course A.
    // -----------------------------------------------------------------------
    it('never adopts a lesson id that belongs to a different course', async () => {
      vi.useRealTimers();

      const courseA = Course.create({
        id: 'course-a-544',
        libraryId: 'lib-1',
        slug: 'course-a-544',
        title: 'Course A',
      });
      courseA.addSection({ id: 'sec-a-544', title: 'Lessons', position: 1 });
      const courseB = Course.create({
        id: 'course-b-544',
        libraryId: 'lib-1',
        slug: 'course-b-544',
        title: 'Course B',
      });
      courseB.addSection({ id: 'sec-b-544', title: 'Lessons', position: 1 });

      const courseRepo2 = makeCourseRepo();
      // Course B inserted first, Course A second — `courseByFolderName`
      // resolves "Course A" (the folder both entries below claim) to
      // whichever course is processed LAST, so this order is what makes
      // Course A win the folder, the correct outcome, while Course B's
      // colliding entry is still live in `existingLessonByVideoPath` for the
      // guard to reject.
      courseRepo2.store.set(courseB.id, courseB);
      courseRepo2.store.set(courseA.id, courseA);

      const lessonRepo2 = makeLessonRepo();
      lessonRepo2.store.set(
        'lesson-a-cover',
        Lesson.create({
          id: 'lesson-a-cover',
          courseId: courseA.id,
          sectionId: 'sec-a-544',
          position: 1,
          title: 'Cover',
          videoPath: LibraryRelativePath.from('/lib/Course A/00 - Cover.mp4', '/lib'),
          mtime: BASE_TIME,
          sizeBytes: 100,
        }),
      );
      // A stray row: same videoPath a file under "Course A" will resolve to,
      // but persisted under Course B — the corrupted-data shape the guard
      // exists for (see the comment above).
      lessonRepo2.store.set(
        'lesson-b-stray',
        Lesson.create({
          id: 'lesson-b-stray',
          courseId: courseB.id,
          sectionId: 'sec-b-544',
          position: 1,
          title: 'Stray',
          videoPath: LibraryRelativePath.from('/lib/Course A/01 - Intro.mp4', '/lib'),
          mtime: BASE_TIME,
          sizeBytes: 100,
        }),
      );

      const files: FileRecord[] = [
        { path: '/lib/Course A/00 - Cover.mp4', mtime: BASE_TIME, size: 100 },
        { path: '/lib/Course A/01 - Intro.mp4', mtime: BASE_TIME, size: 100 },
      ];
      const scanRepo2 = makeScanRepo();
      const h = new RunScanHandler(
        libraryRepo,
        scanRepo2,
        courseRepo2,
        lessonRepo2,
        new FakeFsAdapter(files),
        makePassthroughFfmpeg(),
        makeTranscriptRepo(),
        makeFakeAppConfig(),
        centrifugo,
        makeMetadataLinker(),
        makePosterSync(),
      );

      await h.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      // Course B's stray row is completely untouched — still its own course,
      // still its own id, still the same videoPath.
      const strayAfter = lessonRepo2.store.get('lesson-b-stray');
      expect(strayAfter?.courseId).toBe(courseB.id);
      expect(strayAfter?.videoPath).toBe(rel('/lib/Course A/01 - Intro.mp4'));
      expect([...lessonRepo2.store.values()].filter((l) => l.courseId === courseB.id)).toHaveLength(
        1,
      );

      // Course A got its own, freshly-minted lesson for "01 - Intro.mp4" —
      // never "lesson-b-stray" wearing a new courseId.
      const introForA = [...lessonRepo2.store.values()].find(
        (l) => l.courseId === courseA.id && l.videoPath === rel('/lib/Course A/01 - Intro.mp4'),
      );
      expect(introForA).toBeDefined();
      expect(introForA!.id).not.toBe('lesson-b-stray');
      expect([...lessonRepo2.store.values()].filter((l) => l.courseId === courseA.id)).toHaveLength(
        2,
      );
    });

    // -----------------------------------------------------------------------
    // Real data (measured, not deduced): 18 rows from ORDER-LESSONS.tsv for
    // "Nuxt - интенсивный базовый курс" — one of the 6 flagged courses,
    // chosen for being the smallest. Both the stored positions (the `1`..`18`
    // column dumped from prod) and the filenames are the real values; only
    // the videoPath prefix is synthetic (a real absolute prod path was not
    // in the dump). Recomputing through the real
    // `parseLessonFileName`/`assignLessonPositions` swaps lessons 1↔2 and
    // 3↔4 ("1-nuxt-about-ui-google-and-generate.mp4" and "2-nuxt-deploy.mp4"
    // sort before their un-prefixed same-ordinal siblings); 5..18 are
    // already correct. 8 of the 18 filenames ("*-hw*-intro/feedback") carry
    // no ordinal at all — the real reason this course also gets an advisory
    // 'course-order-unreliable', not a bug in this fixture.
    // -----------------------------------------------------------------------
    it('reorders a real course from ORDER-LESSONS.tsv and keeps every lesson id', async () => {
      vi.useRealTimers();

      const folder = 'Nuxt - интенсивный базовый курс';
      // [filename, stale stored position] — column order matches the TSV dump.
      const rows: [string, number][] = [
        ['nuxt-1.mp4', 1],
        ['1-nuxt-about-ui-google-and-generate.mp4', 2],
        ['nuxt-2.mp4', 3],
        ['2-nuxt-deploy.mp4', 4],
        ['nuxt-3.mp4', 5],
        ['nuxt-4.mp4', 6],
        ['nuxt-5.mp4', 7],
        ['nuxt-6.mp4', 8],
        ['nuxt-7.mp4', 9],
        ['nuxt-8.mp4', 10],
        ['nuxt-hw5-intro.mp4', 11],
        ['nuxt-hw3-intro.mp4', 12],
        ['nuxt-hw3-feedback.mp4', 13],
        ['nuxt-hw4-intro.mp4', 14],
        ['nuxt-1-hw-intro.mp4', 15],
        ['nuxt-hw1-feedback.mp4', 16],
        ['nuxt-hw6-intro.mp4', 17],
        ['nuxt-hw7-intro.mp4', 18],
      ];
      // Recomputed by assignLessonPositions() against the same 18 filenames —
      // only the first 4 move; 5..18 land back on their stored position.
      const expectedPosition = new Map<string, number>(rows);
      expectedPosition.set('nuxt-1.mp4', 2);
      expectedPosition.set('1-nuxt-about-ui-google-and-generate.mp4', 1);
      expectedPosition.set('nuxt-2.mp4', 4);
      expectedPosition.set('2-nuxt-deploy.mp4', 3);

      const courseRepo2 = makeCourseRepo();
      const course = Course.create({
        id: 'course-nuxt-544',
        libraryId: 'lib-1',
        slug: toSlugForTest(folder),
        title: folder,
      });
      course.addSection({ id: 'sec-nuxt-544', title: 'Lessons', position: 1 });
      courseRepo2.store.set(course.id, course);

      const lessonRepo2 = makeLessonRepo();
      const idByFilename = new Map<string, string>();
      for (const [filename, position] of rows) {
        const id = `lesson-nuxt-${filename}`;
        idByFilename.set(filename, id);
        lessonRepo2.store.set(
          id,
          Lesson.create({
            id,
            courseId: course.id,
            sectionId: 'sec-nuxt-544',
            position,
            title: filename,
            videoPath: LibraryRelativePath.from(`/lib/${folder}/${filename}`, '/lib'),
            mtime: BASE_TIME,
            sizeBytes: 100,
          }),
        );
      }

      const files: FileRecord[] = rows.map(([filename]) => ({
        path: `/lib/${folder}/${filename}`,
        mtime: BASE_TIME,
        size: 100,
      }));
      const scanRepo2 = makeScanRepo();
      const h = new RunScanHandler(
        libraryRepo,
        scanRepo2,
        courseRepo2,
        lessonRepo2,
        new FakeFsAdapter(files),
        makePassthroughFfmpeg(),
        makeTranscriptRepo(),
        makeFakeAppConfig(),
        centrifugo,
        makeMetadataLinker(),
        makePosterSync(),
      );

      const scan = await h.execute(new RunScanCommand('lib-1', ACTOR_USER_ID));
      await drainMicrotasks();

      const saved = scanRepo2.store.get(scan.id)!;
      // At least one lesson in this fixture has no parseable ordinal —
      // advisory 'course-order-unreliable', still a recorded ScanError (#699).
      expect(saved.status).toBe('partial');
      expect(lessonRepo2.parkPositionsForResync).toHaveBeenCalledWith(course.id);

      for (const [filename] of rows) {
        const id = idByFilename.get(filename)!;
        const lesson = lessonRepo2.store.get(id);
        // The id never changed, however far the lesson moved — progress,
        // bookmarks, notes and transcripts hang off exactly this id.
        expect(lesson?.id).toBe(id);
        expect(lesson?.position).toBe(expectedPosition.get(filename));
      }
      expect(lessonRepo2.store.size).toBe(18);

      // Advisory, not a failure: 8 of 18 filenames carry no ordinal.
      const orderErrors = saved.errors.filter((e) => e.code === 'course-order-unreliable');
      expect(orderErrors).toHaveLength(1);
      expect(orderErrors[0]?.message).toContain('8 of 18 lesson(s)');
    });
  });
});
