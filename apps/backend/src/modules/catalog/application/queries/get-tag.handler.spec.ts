import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Course } from '../../domain/course/course';
import { Tag } from '../../domain/tag/tag';
import { TagNotFoundError } from '../../domain/tag/tag.errors';
import { GetTagQuery } from './get-tag.query';
import { GetTagHandler } from './get-tag.handler';

import type { TagRepository } from '../../domain/tag/tag.repository';
import type { CourseRepository } from '../../domain/course/course.repository';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTagRepo(): TagRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findBySlug: vi.fn(),
    findByExternalId: vi.fn(),
    findManyByIds: vi.fn(),
    findManyPaginated: vi.fn(),
    count: vi.fn(),
    findCoursesForTag: vi.fn(),
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

function makeTag(category: string | null = 'language'): Tag {
  return Tag.create({
    id: 'tag-1',
    displayName: 'TypeScript',
    slug: 'typescript',
    category,
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

describe('GetTagHandler', () => {
  let tagRepo: TagRepository;
  let courseRepo: CourseRepository;
  let handler: GetTagHandler;

  beforeEach(() => {
    tagRepo = makeTagRepo();
    courseRepo = makeCourseRepo();
    handler = new GetTagHandler(tagRepo, courseRepo);
  });

  it('returns TagDetailDto on happy path', async () => {
    const tag = makeTag('language');
    const course = makeCourse('c1');

    vi.mocked(tagRepo.findBySlug).mockResolvedValue(tag);
    vi.mocked(tagRepo.findCoursesForTag).mockResolvedValue({ courseIds: ['c1'], total: 1 });
    vi.mocked(courseRepo.findByIds).mockResolvedValue([course]);

    const result = await handler.execute(new GetTagQuery('typescript'));

    expect(result.tag.id).toBe('tag-1');
    expect(result.tag.category).toBe('language');
    expect(result.coursesTotal).toBe(1);
    expect(result.courses).toHaveLength(1);
  });

  it('throws TagNotFoundError when slug does not match', async () => {
    vi.mocked(tagRepo.findBySlug).mockResolvedValue(null);

    await expect(handler.execute(new GetTagQuery('missing'))).rejects.toBeInstanceOf(
      TagNotFoundError,
    );
  });

  it('returns empty courses array when tag has no courses', async () => {
    const tag = makeTag(null);
    vi.mocked(tagRepo.findBySlug).mockResolvedValue(tag);
    vi.mocked(tagRepo.findCoursesForTag).mockResolvedValue({ courseIds: [], total: 0 });

    const result = await handler.execute(new GetTagQuery('typescript'));

    expect(result.tag.category).toBeNull();
    expect(result.coursesTotal).toBe(0);
    expect(result.courses).toHaveLength(0);
    expect(courseRepo.findByIds).not.toHaveBeenCalled();
  });

  it('passes coursesOffset and coursesLimit to findCoursesForTag', async () => {
    const tag = makeTag();
    vi.mocked(tagRepo.findBySlug).mockResolvedValue(tag);
    vi.mocked(tagRepo.findCoursesForTag).mockResolvedValue({ courseIds: [], total: 0 });

    await handler.execute(new GetTagQuery('typescript', 3, 5));

    expect(tagRepo.findCoursesForTag).toHaveBeenCalledWith('tag-1', { offset: 3, limit: 5 });
  });
});
