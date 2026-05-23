import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Course } from '../../domain/course/course';
import { Studio } from '../../domain/studio/studio';
import { StudioNotFoundError } from '../../domain/studio/studio.errors';
import { GetStudioQuery } from './get-studio.query';
import { GetStudioHandler } from './get-studio.handler';

import type { StudioRepository } from '../../domain/studio/studio.repository';
import type { CourseRepository } from '../../domain/course/course.repository';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function makeStudio(): Studio {
  return Studio.create({
    id: 'studio-1',
    displayName: 'Acme',
    slug: 'acme',
    now: new Date('2026-01-01T00:00:00.000Z'),
  });
}

function makeCourse(id: string): Course {
  return Course.create({
    id,
    libraryId: 'lib-1',
    slug: `course-${id}`,
    title: `Course ${id}`,
    now: new Date('2026-01-01T00:00:00.000Z'),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GetStudioHandler', () => {
  let studioRepo: StudioRepository;
  let courseRepo: CourseRepository;
  let handler: GetStudioHandler;

  beforeEach(() => {
    studioRepo = makeStudioRepo();
    courseRepo = makeCourseRepo();
    handler = new GetStudioHandler(studioRepo, courseRepo);
  });

  it('returns StudioDetailDto on happy path', async () => {
    const studio = makeStudio();
    const course = makeCourse('c1');

    vi.mocked(studioRepo.findBySlug).mockResolvedValue(studio);
    vi.mocked(studioRepo.findCoursesForStudio).mockResolvedValue({ courseIds: ['c1'], total: 1 });
    vi.mocked(courseRepo.findByIds).mockResolvedValue([course]);

    const result = await handler.execute(new GetStudioQuery('acme'));

    expect(result.studio.id).toBe('studio-1');
    expect(result.coursesTotal).toBe(1);
    expect(result.courses).toHaveLength(1);
  });

  it('throws StudioNotFoundError when slug does not match', async () => {
    vi.mocked(studioRepo.findBySlug).mockResolvedValue(null);

    await expect(handler.execute(new GetStudioQuery('missing'))).rejects.toBeInstanceOf(
      StudioNotFoundError,
    );
  });

  it('returns empty courses array when studio has no courses', async () => {
    const studio = makeStudio();
    vi.mocked(studioRepo.findBySlug).mockResolvedValue(studio);
    vi.mocked(studioRepo.findCoursesForStudio).mockResolvedValue({ courseIds: [], total: 0 });

    const result = await handler.execute(new GetStudioQuery('acme'));

    expect(result.coursesTotal).toBe(0);
    expect(result.courses).toHaveLength(0);
    expect(courseRepo.findByIds).not.toHaveBeenCalled();
  });

  it('passes coursesOffset and coursesLimit to findCoursesForStudio', async () => {
    const studio = makeStudio();
    vi.mocked(studioRepo.findBySlug).mockResolvedValue(studio);
    vi.mocked(studioRepo.findCoursesForStudio).mockResolvedValue({ courseIds: [], total: 0 });

    await handler.execute(new GetStudioQuery('acme', 5, 10));

    expect(studioRepo.findCoursesForStudio).toHaveBeenCalledWith('studio-1', {
      offset: 5,
      limit: 10,
    });
  });
});
