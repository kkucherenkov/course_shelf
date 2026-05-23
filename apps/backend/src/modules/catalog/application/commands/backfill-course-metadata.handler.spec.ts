/**
 * Unit tests for BackfillCourseMetadataHandler.
 *
 * Uses in-memory fakes for all ports — no real DB, filesystem, or Centrifugo.
 *
 * Fixture:
 *   Library A  (rootPath=/libA)
 *     Course "course-a" → /libA/course-a/course.json (v2, instructor + studio + tag)
 *   Library B  (rootPath=/libB)
 *     Course "course-b" → no course.json on disk
 *
 * Scenarios:
 *   1. Empty library → finished with zero counts.
 *   2. Course with valid v2 course.json → updated=1, instructors/tags persisted.
 *   3. Course with missing course.json → skipped=1, no error.
 *   4. Course with malformed course.json → errors.length=1, course skipped.
 *   5. libraryId filter → only named library processed.
 *   6. progressChannel undefined → no centrifugo.publish calls.
 *   7. progressChannel set → publish called for Started, Progress, Finished.
 *   8. Idempotent re-run → no duplicate instructor/studio/tag rows.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Course } from '../../domain/course/course';
import { Instructor } from '../../domain/instructor/instructor';
import { InstructorSlugAlreadyTakenError } from '../../domain/instructor/instructor.errors';
import { Library } from '../../domain/library/library';
import { Studio } from '../../domain/studio/studio';
import { StudioSlugAlreadyTakenError } from '../../domain/studio/studio.errors';
import { Tag } from '../../domain/tag/tag';
import { TagSlugAlreadyTakenError } from '../../domain/tag/tag.errors';
import { MetadataLinker } from '../scan/metadata-linker';
import { BackfillCourseMetadataCommand } from './backfill-course-metadata.command';
import { BackfillCourseMetadataHandler } from './backfill-course-metadata.handler';

import type { CourseRepository } from '../../domain/course/course.repository';
import type { InstructorRepository } from '../../domain/instructor/instructor.repository';
import type { StudioRepository } from '../../domain/studio/studio.repository';
import type { TagRepository } from '../../domain/tag/tag.repository';
import type { LibraryRepository } from '../../domain/library/library.repository';
import type { FsAdapter } from '../../domain/scan/fs-adapter';
import type { CentrifugoService } from '../../../../common/centrifugo/centrifugo.service';

// ---------------------------------------------------------------------------
// Fake repositories
// ---------------------------------------------------------------------------

function makeLibraryRepo(libs: Library[] = []): LibraryRepository {
  const store = new Map<string, Library>(libs.map((l) => [l.id, l]));
  return {
    save: vi.fn(async (l: Library) => {
      store.set(l.id, l);
    }),
    findById: vi.fn(async (id: string) => store.get(id) ?? null),
    findByRootPath: vi.fn(async () => null),
    findAll: vi.fn(async () => [...store.values()]),
    findByIds: vi.fn(async (ids: string[]) =>
      ids.flatMap((id) => {
        const lib = store.get(id);
        return lib ? [lib] : [];
      }),
    ),
    update: vi.fn(async () => null),
    removeWithCascade: vi.fn(async () => false),
  };
}

function makeCourseRepo(courses: Course[] = []): CourseRepository & { store: Map<string, Course> } {
  const store = new Map<string, Course>(courses.map((c) => [c.id, c]));
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
    findRecentlyAdded: vi.fn(async () => []),
  };
}

function makeInstructorRepo(): InstructorRepository & { store: Map<string, Instructor> } {
  const store = new Map<string, Instructor>();
  const bySlug = new Map<string, Instructor>();
  return {
    store,
    save: vi.fn(async (inst: Instructor) => {
      if (bySlug.has(inst.slug)) throw new InstructorSlugAlreadyTakenError(inst.slug);
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
      if (bySlug.has(s.slug)) throw new StudioSlugAlreadyTakenError(s.slug);
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
      if (bySlug.has(t.slug)) throw new TagSlugAlreadyTakenError(t.slug);
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

// ---------------------------------------------------------------------------
// Fake FsAdapter
// ---------------------------------------------------------------------------

class FakeFsAdapter implements FsAdapter {
  private readonly files: Map<string, string>;

  constructor(files: Record<string, string> = {}) {
    this.files = new Map(Object.entries(files));
  }

  async *walk(): AsyncIterable<never> {
    // Not used by BackfillCourseMetadataHandler.
  }

  async readUtf8(path: string): Promise<string> {
    const content = this.files.get(path);
    if (content === undefined) throw new Error(`File not found: ${path}`);
    return content;
  }

  async statMtime(): Promise<null> {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Fake CentrifugoService
// ---------------------------------------------------------------------------

function makeCentrifugo(): CentrifugoService {
  return { publish: vi.fn().mockResolvedValue(undefined) } as unknown as CentrifugoService;
}

// ---------------------------------------------------------------------------
// Domain factories
// ---------------------------------------------------------------------------

function makeLibrary(id: string, rootPath: string): Library {
  return Library.register({ id, name: `Library ${id}`, rootPath });
}

function makeCourse(id: string, libraryId: string, slug: string): Course {
  return Course.create({ id, libraryId, slug, title: slug });
}

// ---------------------------------------------------------------------------
// V2 course.json fixture
// ---------------------------------------------------------------------------

const VALID_V2_JSON = JSON.stringify({
  schemaVersion: 2,
  title: 'Test Course',
  instructorNames: ['Alice Smith'],
  studioName: 'Acme Studio',
  tags: ['typescript', 'nestjs'],
  level: 'intermediate',
  language: 'en',
  releaseDate: '2024-01-15',
  posterUrl: 'https://example.com/poster.jpg',
});

const MALFORMED_JSON = '{ "title": "No schema version" }';

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

interface Repos {
  libraryRepo: LibraryRepository;
  courseRepo: CourseRepository & { store: Map<string, Course> };
  instructorRepo: ReturnType<typeof makeInstructorRepo>;
  studioRepo: ReturnType<typeof makeStudioRepo>;
  tagRepo: ReturnType<typeof makeTagRepo>;
}

function makeHandler(
  fs: FsAdapter,
  repos: Repos,
  centrifugo: CentrifugoService,
): BackfillCourseMetadataHandler {
  const linker = new MetadataLinker(repos.instructorRepo, repos.studioRepo, repos.tagRepo);
  return new BackfillCourseMetadataHandler(
    repos.libraryRepo,
    repos.courseRepo,
    fs,
    linker,
    centrifugo,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BackfillCourseMetadataHandler', () => {
  let centrifugo: CentrifugoService;

  beforeEach(() => {
    centrifugo = makeCentrifugo();
  });

  // ── 1. Empty library ───────────────────────────────────────────────────────

  describe('empty library', () => {
    it('returns finished payload with all counts at zero', async () => {
      const lib = makeLibrary('lib-empty', '/libE');
      const repos: Repos = {
        libraryRepo: makeLibraryRepo([lib]),
        courseRepo: makeCourseRepo(),
        instructorRepo: makeInstructorRepo(),
        studioRepo: makeStudioRepo(),
        tagRepo: makeTagRepo(),
      };
      const handler = makeHandler(new FakeFsAdapter(), repos, centrifugo);

      const result = await handler.execute(
        new BackfillCourseMetadataCommand('lib-empty', 'job-1', undefined),
      );

      expect(result.coursesProcessed).toBe(0);
      expect(result.coursesUpdated).toBe(0);
      expect(result.coursesSkipped).toBe(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  // ── 2. Course with valid v2 course.json ────────────────────────────────────

  describe('course with valid v2 course.json', () => {
    it('enriches the course and reports updated=1', async () => {
      const lib = makeLibrary('lib-a', '/libA');
      const course = makeCourse('course-a', 'lib-a', 'course-a');
      const repos: Repos = {
        libraryRepo: makeLibraryRepo([lib]),
        courseRepo: makeCourseRepo([course]),
        instructorRepo: makeInstructorRepo(),
        studioRepo: makeStudioRepo(),
        tagRepo: makeTagRepo(),
      };
      const handler = makeHandler(
        new FakeFsAdapter({ '/libA/course-a/course.json': VALID_V2_JSON }),
        repos,
        centrifugo,
      );

      const result = await handler.execute(
        new BackfillCourseMetadataCommand(undefined, 'job-2', undefined),
      );

      expect(result.coursesUpdated).toBe(1);
      expect(result.coursesSkipped).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('persists instructor, studio, and tag aggregates', async () => {
      const lib = makeLibrary('lib-a', '/libA');
      const course = makeCourse('course-a', 'lib-a', 'course-a');
      const repos: Repos = {
        libraryRepo: makeLibraryRepo([lib]),
        courseRepo: makeCourseRepo([course]),
        instructorRepo: makeInstructorRepo(),
        studioRepo: makeStudioRepo(),
        tagRepo: makeTagRepo(),
      };
      const handler = makeHandler(
        new FakeFsAdapter({ '/libA/course-a/course.json': VALID_V2_JSON }),
        repos,
        centrifugo,
      );

      await handler.execute(new BackfillCourseMetadataCommand(undefined, 'job-2b', undefined));

      expect(repos.instructorRepo.store.size).toBe(1);
      const inst = [...repos.instructorRepo.store.values()][0]!;
      expect(inst.displayName).toBe('Alice Smith');

      expect(repos.studioRepo.store.size).toBe(1);
      const studio = [...repos.studioRepo.store.values()][0]!;
      expect(studio.displayName).toBe('Acme Studio');

      expect(repos.tagRepo.store.size).toBe(2);
    });

    it('saves the enriched course via courseRepo', async () => {
      const lib = makeLibrary('lib-a', '/libA');
      const course = makeCourse('course-a', 'lib-a', 'course-a');
      const repos: Repos = {
        libraryRepo: makeLibraryRepo([lib]),
        courseRepo: makeCourseRepo([course]),
        instructorRepo: makeInstructorRepo(),
        studioRepo: makeStudioRepo(),
        tagRepo: makeTagRepo(),
      };
      const handler = makeHandler(
        new FakeFsAdapter({ '/libA/course-a/course.json': VALID_V2_JSON }),
        repos,
        centrifugo,
      );

      await handler.execute(new BackfillCourseMetadataCommand(undefined, 'job-2c', undefined));

      expect(repos.courseRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'course-a' }),
      );
    });
  });

  // ── 3. Course with missing course.json ────────────────────────────────────

  describe('course with missing course.json', () => {
    it('counts the course as skipped, not as an error', async () => {
      const lib = makeLibrary('lib-a', '/libA');
      const course = makeCourse('course-no-json', 'lib-a', 'course-no-json');
      const repos: Repos = {
        libraryRepo: makeLibraryRepo([lib]),
        courseRepo: makeCourseRepo([course]),
        instructorRepo: makeInstructorRepo(),
        studioRepo: makeStudioRepo(),
        tagRepo: makeTagRepo(),
      };
      const handler = makeHandler(new FakeFsAdapter(), repos, centrifugo);

      const result = await handler.execute(
        new BackfillCourseMetadataCommand(undefined, 'job-3', undefined),
      );

      expect(result.coursesSkipped).toBe(1);
      expect(result.coursesUpdated).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('does not save the course row when no course.json is found', async () => {
      const lib = makeLibrary('lib-a', '/libA');
      const course = makeCourse('course-no-json', 'lib-a', 'course-no-json');
      const repos: Repos = {
        libraryRepo: makeLibraryRepo([lib]),
        courseRepo: makeCourseRepo([course]),
        instructorRepo: makeInstructorRepo(),
        studioRepo: makeStudioRepo(),
        tagRepo: makeTagRepo(),
      };
      const handler = makeHandler(new FakeFsAdapter(), repos, centrifugo);

      await handler.execute(new BackfillCourseMetadataCommand(undefined, 'job-3b', undefined));

      // save was not called (the course was not enriched)
      expect(repos.courseRepo.save).not.toHaveBeenCalled();
    });
  });

  // ── 4. Malformed course.json ──────────────────────────────────────────────

  describe('course with malformed course.json', () => {
    it('records one error entry and skips the course', async () => {
      const lib = makeLibrary('lib-a', '/libA');
      const course = makeCourse('course-bad', 'lib-a', 'course-bad');
      const repos: Repos = {
        libraryRepo: makeLibraryRepo([lib]),
        courseRepo: makeCourseRepo([course]),
        instructorRepo: makeInstructorRepo(),
        studioRepo: makeStudioRepo(),
        tagRepo: makeTagRepo(),
      };
      const handler = makeHandler(
        new FakeFsAdapter({ '/libA/course-bad/course.json': MALFORMED_JSON }),
        repos,
        centrifugo,
      );

      const result = await handler.execute(
        new BackfillCourseMetadataCommand(undefined, 'job-4', undefined),
      );

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.courseId).toBe('course-bad');
      expect(result.coursesSkipped).toBe(1);
      expect(result.coursesUpdated).toBe(0);
    });

    it('does not throw — handler returns a finished payload even on parse failure', async () => {
      const lib = makeLibrary('lib-a', '/libA');
      const course = makeCourse('course-bad', 'lib-a', 'course-bad');
      const repos: Repos = {
        libraryRepo: makeLibraryRepo([lib]),
        courseRepo: makeCourseRepo([course]),
        instructorRepo: makeInstructorRepo(),
        studioRepo: makeStudioRepo(),
        tagRepo: makeTagRepo(),
      };
      const handler = makeHandler(
        new FakeFsAdapter({ '/libA/course-bad/course.json': MALFORMED_JSON }),
        repos,
        centrifugo,
      );

      await expect(
        handler.execute(new BackfillCourseMetadataCommand(undefined, 'job-4b', undefined)),
      ).resolves.toBeDefined();
    });
  });

  // ── 5. libraryId filter ────────────────────────────────────────────────────

  describe('libraryId filter', () => {
    it('processes only the named library when libraryId is specified', async () => {
      const libA = makeLibrary('lib-a', '/libA');
      const libB = makeLibrary('lib-b', '/libB');
      const courseA = makeCourse('course-a', 'lib-a', 'course-a');
      const courseB = makeCourse('course-b', 'lib-b', 'course-b');
      const repos: Repos = {
        libraryRepo: makeLibraryRepo([libA, libB]),
        courseRepo: makeCourseRepo([courseA, courseB]),
        instructorRepo: makeInstructorRepo(),
        studioRepo: makeStudioRepo(),
        tagRepo: makeTagRepo(),
      };
      const handler = makeHandler(
        new FakeFsAdapter({ '/libA/course-a/course.json': VALID_V2_JSON }),
        repos,
        centrifugo,
      );

      // Only lib-a is specified.
      const result = await handler.execute(
        new BackfillCourseMetadataCommand('lib-a', 'job-5', undefined),
      );

      // Only courseA was processed — courseB was never touched.
      expect(result.coursesProcessed).toBe(1);
      expect(result.coursesUpdated).toBe(1);
      expect(repos.courseRepo.findManyByLibrary).toHaveBeenCalledWith('lib-a');
      expect(repos.courseRepo.findManyByLibrary).not.toHaveBeenCalledWith('lib-b');
    });

    it('returns empty-counts result when the named library does not exist', async () => {
      const repos: Repos = {
        libraryRepo: makeLibraryRepo([]),
        courseRepo: makeCourseRepo([]),
        instructorRepo: makeInstructorRepo(),
        studioRepo: makeStudioRepo(),
        tagRepo: makeTagRepo(),
      };
      const handler = makeHandler(new FakeFsAdapter(), repos, centrifugo);

      const result = await handler.execute(
        new BackfillCourseMetadataCommand('nonexistent', 'job-5b', undefined),
      );

      expect(result.coursesProcessed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  // ── 6. progressChannel undefined → no publish calls ──────────────────────

  describe('progressChannel undefined (CLI path)', () => {
    it('makes no centrifugo.publish calls', async () => {
      const lib = makeLibrary('lib-a', '/libA');
      const course = makeCourse('course-a', 'lib-a', 'course-a');
      const repos: Repos = {
        libraryRepo: makeLibraryRepo([lib]),
        courseRepo: makeCourseRepo([course]),
        instructorRepo: makeInstructorRepo(),
        studioRepo: makeStudioRepo(),
        tagRepo: makeTagRepo(),
      };
      const handler = makeHandler(
        new FakeFsAdapter({ '/libA/course-a/course.json': VALID_V2_JSON }),
        repos,
        centrifugo,
      );

      await handler.execute(new BackfillCourseMetadataCommand(undefined, 'job-6', undefined));

      expect(centrifugo.publish).not.toHaveBeenCalled();
    });
  });

  // ── 7. progressChannel set → publish for Started / Progress / Finished ─────

  describe('progressChannel set', () => {
    it('publishes BackfillStarted, BackfillProgress, and BackfillFinished', async () => {
      const lib = makeLibrary('lib-a', '/libA');
      const course = makeCourse('course-a', 'lib-a', 'course-a');
      const repos: Repos = {
        libraryRepo: makeLibraryRepo([lib]),
        courseRepo: makeCourseRepo([course]),
        instructorRepo: makeInstructorRepo(),
        studioRepo: makeStudioRepo(),
        tagRepo: makeTagRepo(),
      };
      const handler = makeHandler(
        new FakeFsAdapter({ '/libA/course-a/course.json': VALID_V2_JSON }),
        repos,
        centrifugo,
      );

      const channel = 'maintenance:backfill:job-7';
      await handler.execute(new BackfillCourseMetadataCommand(undefined, 'job-7', channel));

      const calls = vi
        .mocked(centrifugo.publish)
        .mock.calls.map(([ch, data]) => ({ ch, kind: (data as Record<string, unknown>)['kind'] }));

      expect(calls.some((c) => c.ch === channel && c.kind === 'BackfillStarted')).toBe(true);
      expect(calls.some((c) => c.ch === channel && c.kind === 'BackfillProgress')).toBe(true);
      expect(calls.some((c) => c.ch === channel && c.kind === 'BackfillFinished')).toBe(true);
    });

    it('includes jobId in every published message', async () => {
      const lib = makeLibrary('lib-a', '/libA');
      const course = makeCourse('course-a', 'lib-a', 'course-a');
      const repos: Repos = {
        libraryRepo: makeLibraryRepo([lib]),
        courseRepo: makeCourseRepo([course]),
        instructorRepo: makeInstructorRepo(),
        studioRepo: makeStudioRepo(),
        tagRepo: makeTagRepo(),
      };
      const handler = makeHandler(
        new FakeFsAdapter({ '/libA/course-a/course.json': VALID_V2_JSON }),
        repos,
        centrifugo,
      );

      const jobId = 'job-7b';
      await handler.execute(
        new BackfillCourseMetadataCommand(undefined, jobId, 'maintenance:backfill:job-7b'),
      );

      const allCalls = vi.mocked(centrifugo.publish).mock.calls;
      expect(allCalls.length).toBeGreaterThan(0);
      for (const [, data] of allCalls) {
        expect((data as Record<string, unknown>)['jobId']).toBe(jobId);
      }
    });
  });

  // ── 8. Idempotent re-run ──────────────────────────────────────────────────

  describe('idempotent re-run', () => {
    it('produces the same final state (no duplicate instructor/studio/tag rows) on second run', async () => {
      const lib = makeLibrary('lib-a', '/libA');
      const course = makeCourse('course-a', 'lib-a', 'course-a');
      const repos: Repos = {
        libraryRepo: makeLibraryRepo([lib]),
        courseRepo: makeCourseRepo([course]),
        instructorRepo: makeInstructorRepo(),
        studioRepo: makeStudioRepo(),
        tagRepo: makeTagRepo(),
      };
      const fs = new FakeFsAdapter({ '/libA/course-a/course.json': VALID_V2_JSON });
      const handler = makeHandler(fs, repos, centrifugo);

      await handler.execute(new BackfillCourseMetadataCommand(undefined, 'job-8a', undefined));
      const instructorCountAfterFirst = repos.instructorRepo.store.size;
      const studioCountAfterFirst = repos.studioRepo.store.size;
      const tagCountAfterFirst = repos.tagRepo.store.size;

      await handler.execute(new BackfillCourseMetadataCommand(undefined, 'job-8b', undefined));

      // Counts must not grow on the second run.
      expect(repos.instructorRepo.store.size).toBe(instructorCountAfterFirst);
      expect(repos.studioRepo.store.size).toBe(studioCountAfterFirst);
      expect(repos.tagRepo.store.size).toBe(tagCountAfterFirst);
    });
  });
});
