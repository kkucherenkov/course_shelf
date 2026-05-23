import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Course } from '../../domain/course/course';
import { Tag } from '../../domain/tag/tag';
import {
  CourseNotFoundError,
  CourseLinkUnknownEntityError,
} from '../../domain/course/course.errors';
import { SetCourseTagsCommand } from './set-course-tags.command';
import { SetCourseTagsHandler } from './set-course-tags.handler';

import type { CourseRepository } from '../../domain/course/course.repository';
import type { TagRepository } from '../../domain/tag/tag.repository';

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

function makeCourse(id = 'course-1'): Course {
  return Course.create({
    id,
    libraryId: 'lib-1',
    slug: 'my-course',
    title: 'My Course',
    now: new Date('2026-01-01T00:00:00.000Z'),
  });
}

function makeTag(
  id: string,
  slug: string,
  displayName: string,
  category: string | null = null,
): Tag {
  return Tag.create({
    id,
    displayName,
    slug,
    category,
    now: new Date('2026-01-01T00:00:00.000Z'),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SetCourseTagsHandler', () => {
  let courseRepo: CourseRepository;
  let tagRepo: TagRepository;
  let handler: SetCourseTagsHandler;

  beforeEach(() => {
    courseRepo = makeCourseRepo();
    tagRepo = makeTagRepo();
    handler = new SetCourseTagsHandler(courseRepo, tagRepo);
  });

  it('sets tags on the course and saves (happy path)', async () => {
    const course = makeCourse();
    const tag1 = makeTag('tag-1', 'typescript', 'TypeScript', 'language');
    const tag2 = makeTag('tag-2', 'react', 'React', 'framework');

    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(tagRepo.findManyByIds).mockResolvedValue([tag1, tag2]);
    vi.mocked(courseRepo.save).mockResolvedValue(undefined);

    const result = await handler.execute(new SetCourseTagsCommand('course-1', ['tag-1', 'tag-2']));

    expect(result.tags).toHaveLength(2);
    expect(result.tags[0]).toMatchObject({ id: 'tag-1', category: 'language' });
    expect(result.tags[1]).toMatchObject({ id: 'tag-2', category: 'framework' });
    expect(courseRepo.save).toHaveBeenCalledOnce();
  });

  it('preserves input order even when adapter returns tags in a different order', async () => {
    const course = makeCourse();
    const tag1 = makeTag('tag-1', 'typescript', 'TypeScript');
    const tag2 = makeTag('tag-2', 'react', 'React');

    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(tagRepo.findManyByIds).mockResolvedValue([tag2, tag1]);
    vi.mocked(courseRepo.save).mockResolvedValue(undefined);

    const result = await handler.execute(new SetCourseTagsCommand('course-1', ['tag-1', 'tag-2']));

    expect(result.tags[0]).toMatchObject({ id: 'tag-1' });
    expect(result.tags[1]).toMatchObject({ id: 'tag-2' });
  });

  it('throws CourseNotFoundError when course does not exist', async () => {
    vi.mocked(courseRepo.findById).mockResolvedValue(null);

    await expect(
      handler.execute(new SetCourseTagsCommand('missing', ['tag-1'])),
    ).rejects.toBeInstanceOf(CourseNotFoundError);

    expect(courseRepo.save).not.toHaveBeenCalled();
  });

  it('throws CourseLinkUnknownEntityError for the first unknown tag id', async () => {
    const course = makeCourse();
    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(tagRepo.findManyByIds).mockResolvedValue([
      makeTag('tag-1', 'typescript', 'TypeScript'),
    ]);

    await expect(
      handler.execute(new SetCourseTagsCommand('course-1', ['tag-1', 'tag-missing'])),
    ).rejects.toBeInstanceOf(CourseLinkUnknownEntityError);

    expect(courseRepo.save).not.toHaveBeenCalled();
  });

  it('clears all tags when an empty array is passed (idempotent)', async () => {
    const course = makeCourse();
    course.setTags([
      { id: 'tag-1', slug: 'typescript', displayName: 'TypeScript', category: null },
    ]);

    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(tagRepo.findManyByIds).mockResolvedValue([]);
    vi.mocked(courseRepo.save).mockResolvedValue(undefined);

    const result = await handler.execute(new SetCourseTagsCommand('course-1', []));

    expect(result.tags).toHaveLength(0);
    expect(courseRepo.save).toHaveBeenCalledOnce();
  });

  it('includes category from tag aggregate in the ref', async () => {
    const course = makeCourse();
    const tag = makeTag('tag-1', 'typescript', 'TypeScript', 'language');

    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(tagRepo.findManyByIds).mockResolvedValue([tag]);
    vi.mocked(courseRepo.save).mockResolvedValue(undefined);

    const result = await handler.execute(new SetCourseTagsCommand('course-1', ['tag-1']));

    expect(result.tags[0]).toMatchObject({ category: 'language' });
  });
});
