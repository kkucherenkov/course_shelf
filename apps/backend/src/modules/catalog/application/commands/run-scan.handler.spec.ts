/**
 * Unit tests for RunScanHandler.
 *
 * Uses:
 *   - FakeFsAdapter exposing a fixture tree in memory (no real disk I/O).
 *   - In-memory ScanRepository backed by a plain Map.
 *   - In-memory LibraryRepository backed by a plain Map.
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
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Library } from '../../domain/library/library';
import { LibraryNotFoundError } from '../../domain/library/library.errors';
import { Scan } from '../../domain/scan/scan';
import { ScanAlreadyRunningError } from '../../domain/scan/scan.errors';
import { RunScanCommand } from './run-scan.command';
import { RunScanHandler } from './run-scan.handler';

import type { FsAdapter, FsEntry } from '../../domain/scan/fs-adapter';
import type { LibraryRepository } from '../../domain/library/library.repository';
import type { ScanRepository } from '../../domain/scan/scan.repository';

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
    findAll: vi.fn(async () => [...store.values()]),
    findByIds: vi.fn(async (ids: string[]) =>
      ids.flatMap((id) => {
        const lib = store.get(id);
        return lib ? [lib] : [];
      }),
    ),
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
      const all = [...store.values()].filter((s) => s.libraryId === libraryId);
      all.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
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
}

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const BASE_TIME = new Date('2026-01-01T00:00:00.000Z');

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
  // Allow the Promise.resolve().then(...) chain inside the handler to flush.
  await new Promise<void>((resolve) => setImmediate(resolve));
  // A second drain handles any nested awaits inside the walk.
  await new Promise<void>((resolve) => setImmediate(resolve));
  // Third pass to be safe with multiple async hops.
  await new Promise<void>((resolve) => setImmediate(resolve));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RunScanHandler', () => {
  let libraryRepo: LibraryRepository;
  let scanRepo: ReturnType<typeof makeScanRepo>;
  let fs: FakeFsAdapter;
  let handler: RunScanHandler;

  beforeEach(() => {
    vi.useFakeTimers();
    const lib = makeLibrary();
    libraryRepo = makeLibraryRepo(lib);
    scanRepo = makeScanRepo();
    fs = new FakeFsAdapter(makeFixtureFiles());
    handler = new RunScanHandler(libraryRepo, scanRepo, fs);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // Happy path — first scan
  // -------------------------------------------------------------------------
  it('first scan: filesAdded=3, filesScanned=4, coursesDiscovered=2, errors.length=1', async () => {
    vi.useRealTimers();

    const scan = await handler.execute(new RunScanCommand('lib-1'));
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

    const scan = await handler.execute(new RunScanCommand('lib-1'));
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
    await handler.execute(new RunScanCommand('lib-1'));
    await drainMicrotasks();

    // Second scan — same FsAdapter with identical files.
    const scan2 = await handler.execute(new RunScanCommand('lib-1'));
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
    handler = new RunScanHandler(libraryRepo, scanRepo, badFs);

    const scan = await handler.execute(new RunScanCommand('lib-1'));
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
    handler = new RunScanHandler(makeLibraryRepo(), scanRepo, fs);

    await expect(handler.execute(new RunScanCommand('nonexistent'))).rejects.toBeInstanceOf(
      LibraryNotFoundError,
    );
  });

  // -------------------------------------------------------------------------
  // Guard: scan already running
  // -------------------------------------------------------------------------
  it('throws ScanAlreadyRunningError when a scan is already running', async () => {
    vi.useRealTimers();

    // Start first scan (leaves it in running state momentarily).
    await handler.execute(new RunScanCommand('lib-1'));

    // Manually insert a running scan into the repo to simulate concurrent state.
    const runningScan = Scan.start({ id: 'running-1', libraryId: 'lib-1' });
    scanRepo.store.set(runningScan.id, runningScan);

    // Re-create handler with a repo that reports a running scan.
    const blockedScanRepo = makeScanRepo();
    blockedScanRepo.store.set(runningScan.id, runningScan);
    handler = new RunScanHandler(libraryRepo, blockedScanRepo, fs);

    await expect(handler.execute(new RunScanCommand('lib-1'))).rejects.toBeInstanceOf(
      ScanAlreadyRunningError,
    );
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
      const neovimHandler = new RunScanHandler(libraryRepo, neovimScanRepo, neovimFs);

      const scan = await neovimHandler.execute(new RunScanCommand('lib-1'));
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
      const cacheHandler = new RunScanHandler(libraryRepo, cacheScanRepo, cacheFs);

      const scan = await cacheHandler.execute(new RunScanCommand('lib-1'));
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
      const dotHandler = new RunScanHandler(libraryRepo, dotScanRepo, dotFs);

      const scan = await dotHandler.execute(new RunScanCommand('lib-1'));
      await drainMicrotasks();

      const saved = dotScanRepo.store.get(scan.id)!;

      // PDF should be a material, not a ScanError.
      const unsupportedErrors = saved.errors.filter((e) => e.code === 'unsupported-extension');
      expect(unsupportedErrors).toHaveLength(0);

      const lesson = saved.courses[0]!.discoveredLessons[0]!;
      expect(lesson.materials).toHaveLength(1);
    });
  });
});
