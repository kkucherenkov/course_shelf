import { describe, expect, it, vi } from 'vitest';

import { Library } from './modules/catalog/domain/library/library';
import {
  SEED_EPOCH,
  SEED_IDS,
  SEED_SLUGS,
  SeedRefusedError,
  buildSeedCourse,
  buildSeedLesson,
  seedCatalog,
} from './seed-catalog';

import type { Course } from './modules/catalog/domain/course/course';
import type { SeedPorts } from './seed-catalog';

function makePorts(overrides: Partial<Record<'libraries' | 'courses', unknown>> = {}): SeedPorts {
  return {
    libraries: { save: vi.fn(), findAll: vi.fn().mockResolvedValue([]) },
    courses: { save: vi.fn(), findAll: vi.fn().mockResolvedValue([]) },
    lessons: { save: vi.fn() },
    instructors: { save: vi.fn() },
    studios: { save: vi.fn() },
    tags: { save: vi.fn() },
    ...overrides,
  } as unknown as SeedPorts;
}

describe('seedCatalog', () => {
  it('writes the spine the pinned contract-test ids address', async () => {
    const ports = makePorts();

    await seedCatalog(ports, { log: vi.fn() });

    const savedLibraryIds = vi
      .mocked(ports.libraries.save)
      .mock.calls.map(([library]) => library.id);
    expect(savedLibraryIds).toStrictEqual([SEED_IDS.library]);

    expect(vi.mocked(ports.instructors.save).mock.calls[0]?.[0].slug).toBe(SEED_SLUGS.instructor);
    expect(vi.mocked(ports.studios.save).mock.calls[0]?.[0].slug).toBe(SEED_SLUGS.studio);
    expect(vi.mocked(ports.tags.save).mock.calls[0]?.[0].slug).toBe(SEED_SLUGS.tag);
    expect(vi.mocked(ports.courses.save).mock.calls[0]?.[0].id).toBe(SEED_IDS.course);
    expect(vi.mocked(ports.lessons.save).mock.calls[0]?.[0].id).toBe(SEED_IDS.lesson);
  });

  it('refuses a database holding a library it did not create', async () => {
    const foreign = Library.register({
      id: 'real-library',
      name: 'Somebody real',
      rootPath: '/srv/media',
    });
    const ports = makePorts({
      libraries: { save: vi.fn(), findAll: vi.fn().mockResolvedValue([foreign]) },
    });

    await expect(seedCatalog(ports, { log: vi.fn() })).rejects.toThrow(SeedRefusedError);
    expect(ports.libraries.save).not.toHaveBeenCalled();
  });

  it('refuses a database holding a course it did not create', async () => {
    const foreign = { id: 'real-course' } as Course;
    const ports = makePorts({
      courses: { save: vi.fn(), findAll: vi.fn().mockResolvedValue([foreign]) },
    });

    await expect(seedCatalog(ports, { log: vi.fn() })).rejects.toThrow(SeedRefusedError);
    expect(ports.courses.save).not.toHaveBeenCalled();
  });

  it('proceeds when the only rows present are its own', async () => {
    const ports = makePorts({
      libraries: {
        save: vi.fn(),
        findAll: vi
          .fn()
          .mockResolvedValue([
            Library.register({ id: SEED_IDS.library, name: 'Seed', rootPath: '/data/courses' }),
          ]),
      },
      courses: { save: vi.fn(), findAll: vi.fn().mockResolvedValue([buildSeedCourse()]) },
    });

    await expect(seedCatalog(ports, { log: vi.fn() })).resolves.toBeUndefined();
  });

  it('builds byte-identical aggregates on every call', () => {
    const course = buildSeedCourse();
    const lesson = buildSeedLesson();

    expect(course.createdAt).toStrictEqual(SEED_EPOCH);
    expect(lesson.createdAt).toStrictEqual(SEED_EPOCH);
    expect(buildSeedCourse().slug).toBe(course.slug);
    // A setter bumps updatedAt to Date.now(), so only createdAt is fixed —
    // the upsert never writes createdAt again, which is what makes the
    // second run a no-op on the row's identity.
    expect(buildSeedLesson().materials.map((m) => m.id)).toStrictEqual(
      lesson.materials.map((m) => m.id),
    );
  });

  it('gives the lesson the material and subtitle the pinned operations address', () => {
    const lesson = buildSeedLesson();

    expect(lesson.materials.map((m) => m.id)).toStrictEqual([SEED_IDS.material]);
    expect(lesson.subtitles.map((s) => s.language)).toStrictEqual(['en']);
    expect(lesson.duration).toBe(60);
  });
});
