import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Course } from '../../domain/course/course';
import { Studio } from '../../domain/studio/studio';
import {
  CourseNotFoundError,
  CourseLinkUnknownEntityError,
} from '../../domain/course/course.errors';
import { SetCourseStudiosCommand } from './set-course-studios.command';
import { SetCourseStudiosHandler } from './set-course-studios.handler';

import type { CourseRepository } from '../../domain/course/course.repository';
import type { StudioRepository } from '../../domain/studio/studio.repository';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCourseRepo(): CourseRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findManyByLibrary: vi.fn(),
    findAll: vi.fn(),
    findByIds: vi.fn(),
    findRecentlyAdded: vi.fn(),
  };
}

function makeStudioRepo(): StudioRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findBySlug: vi.fn(),
    findByExternalId: vi.fn(),
    findManyByIds: vi.fn(),
    findManyPaginated: vi.fn(),
    count: vi.fn(),
    findCoursesForStudio: vi.fn(),
  };
}

function makeCourse(id = 'course-1'): Course {
  return Course.create({
    id,
    libraryId: 'lib-1',
    slug: 'my-course',
    title: 'My Course',
    now: new Date('2026-01-01T00:00:00.000Z'),
  });
}

function makeStudio(id: string, slug: string, displayName: string): Studio {
  return Studio.create({ id, displayName, slug, now: new Date('2026-01-01T00:00:00.000Z') });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SetCourseStudiosHandler', () => {
  let courseRepo: CourseRepository;
  let studioRepo: StudioRepository;
  let handler: SetCourseStudiosHandler;

  beforeEach(() => {
    courseRepo = makeCourseRepo();
    studioRepo = makeStudioRepo();
    handler = new SetCourseStudiosHandler(courseRepo, studioRepo);
  });

  it('sets studios on the course and saves (happy path)', async () => {
    const course = makeCourse();
    const studio1 = makeStudio('studio-1', 'acme', 'Acme');
    const studio2 = makeStudio('studio-2', 'beta', 'Beta');

    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(studioRepo.findManyByIds).mockResolvedValue([studio1, studio2]);
    vi.mocked(courseRepo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new SetCourseStudiosCommand('course-1', ['studio-1', 'studio-2']),
    );

    expect(result.studios).toHaveLength(2);
    expect(result.studios[0]).toMatchObject({ id: 'studio-1' });
    expect(result.studios[1]).toMatchObject({ id: 'studio-2' });
    expect(courseRepo.save).toHaveBeenCalledOnce();
  });

  it('preserves input order even when adapter returns studios in a different order', async () => {
    const course = makeCourse();
    const studio1 = makeStudio('studio-1', 'acme', 'Acme');
    const studio2 = makeStudio('studio-2', 'beta', 'Beta');

    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(studioRepo.findManyByIds).mockResolvedValue([studio2, studio1]);
    vi.mocked(courseRepo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new SetCourseStudiosCommand('course-1', ['studio-1', 'studio-2']),
    );

    expect(result.studios[0]).toMatchObject({ id: 'studio-1' });
    expect(result.studios[1]).toMatchObject({ id: 'studio-2' });
  });

  it('throws CourseNotFoundError when course does not exist', async () => {
    vi.mocked(courseRepo.findById).mockResolvedValue(null);

    await expect(
      handler.execute(new SetCourseStudiosCommand('missing', ['studio-1'])),
    ).rejects.toBeInstanceOf(CourseNotFoundError);

    expect(courseRepo.save).not.toHaveBeenCalled();
  });

  it('throws CourseLinkUnknownEntityError for the first unknown studio id', async () => {
    const course = makeCourse();
    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(studioRepo.findManyByIds).mockResolvedValue([makeStudio('studio-1', 'acme', 'Acme')]);

    await expect(
      handler.execute(new SetCourseStudiosCommand('course-1', ['studio-1', 'studio-missing'])),
    ).rejects.toBeInstanceOf(CourseLinkUnknownEntityError);

    expect(courseRepo.save).not.toHaveBeenCalled();
  });

  it('clears all studios when an empty array is passed (idempotent)', async () => {
    const course = makeCourse();
    course.setStudios([{ id: 'studio-1', slug: 'acme', displayName: 'Acme' }]);

    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(studioRepo.findManyByIds).mockResolvedValue([]);
    vi.mocked(courseRepo.save).mockResolvedValue(undefined);

    const result = await handler.execute(new SetCourseStudiosCommand('course-1', []));

    expect(result.studios).toHaveLength(0);
    expect(courseRepo.save).toHaveBeenCalledOnce();
  });
});
