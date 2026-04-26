import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Course } from '../../domain/course/course';
import {
  CourseNotFoundError,
  CourseSlugAlreadyTakenError,
} from '../../domain/course/course.errors';
import { UpdateCourseMetadataCommand } from './update-course-metadata.command';
import { UpdateCourseMetadataHandler } from './update-course-metadata.handler';

import type { CourseRepository } from '../../domain/course/course.repository';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRepo(): CourseRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findManyByLibrary: vi.fn(),
    findAll: vi.fn(),
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

const adminActor = { id: 'admin-1', role: 'admin' };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('UpdateCourseMetadataHandler', () => {
  let repo: CourseRepository;
  let handler: UpdateCourseMetadataHandler;

  beforeEach(() => {
    repo = makeRepo();
    handler = new UpdateCourseMetadataHandler(repo);
  });

  it('returns updated CourseDto on happy path (all fields)', async () => {
    const course = makeCourse();
    vi.mocked(repo.findById).mockResolvedValue(course);
    vi.mocked(repo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new UpdateCourseMetadataCommand('course-1', adminActor, {
        title: 'New Title',
        description: 'A description',
        slug: 'new-slug',
      }),
    );

    expect(result.title).toBe('New Title');
    expect(result.description).toBe('A description');
    expect(result.slug).toBe('new-slug');
    expect(repo.save).toHaveBeenCalledOnce();
  });

  it('applies only the fields that are present in the patch', async () => {
    const course = makeCourse();
    vi.mocked(repo.findById).mockResolvedValue(course);
    vi.mocked(repo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new UpdateCourseMetadataCommand('course-1', adminActor, { title: 'Only Title' }),
    );

    expect(result.title).toBe('Only Title');
    expect(result.slug).toBe('my-course'); // unchanged
  });

  it('throws CourseNotFoundError when course does not exist', async () => {
    vi.mocked(repo.findById).mockResolvedValue(null);

    await expect(
      handler.execute(new UpdateCourseMetadataCommand('missing', adminActor, { title: 'X' })),
    ).rejects.toBeInstanceOf(CourseNotFoundError);

    expect(repo.save).not.toHaveBeenCalled();
  });

  it('propagates CourseSlugAlreadyTakenError from the adapter', async () => {
    const course = makeCourse();
    vi.mocked(repo.findById).mockResolvedValue(course);
    vi.mocked(repo.save).mockRejectedValue(new CourseSlugAlreadyTakenError('new-slug'));

    await expect(
      handler.execute(
        new UpdateCourseMetadataCommand('course-1', adminActor, { slug: 'new-slug' }),
      ),
    ).rejects.toBeInstanceOf(CourseSlugAlreadyTakenError);
  });
});
