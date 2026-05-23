import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Course } from '../../domain/course/course';
import { Instructor } from '../../domain/instructor/instructor';
import { Studio } from '../../domain/studio/studio';
import { Tag } from '../../domain/tag/tag';
import {
  CourseNotFoundError,
  CourseSlugAlreadyTakenError,
  CourseLinkUnknownEntityError,
} from '../../domain/course/course.errors';
import { UpdateCourseMetadataCommand } from './update-course-metadata.command';
import { UpdateCourseMetadataHandler } from './update-course-metadata.handler';

import type { CourseRepository } from '../../domain/course/course.repository';
import type { InstructorRepository } from '../../domain/instructor/instructor.repository';
import type { StudioRepository } from '../../domain/studio/studio.repository';
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

function makeInstructorRepo(): InstructorRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findBySlug: vi.fn(),
    findByExternalId: vi.fn(),
    findManyByIds: vi.fn(),
    findManyPaginated: vi.fn(),
    count: vi.fn(),
    findCoursesForInstructor: vi.fn(),
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

function makeInstructor(id: string, slug: string, displayName: string): Instructor {
  return Instructor.create({ id, displayName, slug, now: new Date('2026-01-01T00:00:00.000Z') });
}

function makeStudio(id: string, slug: string, displayName: string): Studio {
  return Studio.create({ id, displayName, slug, now: new Date('2026-01-01T00:00:00.000Z') });
}

function makeTag(
  id: string,
  slug: string,
  displayName: string,
  category: string | null = null,
): Tag {
  return Tag.create({ id, displayName, slug, category, now: new Date('2026-01-01T00:00:00.000Z') });
}

const adminActor = { id: 'admin-1', role: 'admin' };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('UpdateCourseMetadataHandler', () => {
  let courseRepo: CourseRepository;
  let instructorRepo: InstructorRepository;
  let studioRepo: StudioRepository;
  let tagRepo: TagRepository;
  let handler: UpdateCourseMetadataHandler;

  beforeEach(() => {
    courseRepo = makeCourseRepo();
    instructorRepo = makeInstructorRepo();
    studioRepo = makeStudioRepo();
    tagRepo = makeTagRepo();
    handler = new UpdateCourseMetadataHandler(courseRepo, instructorRepo, studioRepo, tagRepo);
  });

  // ---------------------------------------------------------------------------
  // Existing scalar field cases (unchanged behaviour)
  // ---------------------------------------------------------------------------

  it('returns updated CourseDto on happy path (title, description, slug)', async () => {
    const course = makeCourse();
    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(courseRepo.save).mockResolvedValue(undefined);

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
    expect(courseRepo.save).toHaveBeenCalledOnce();
  });

  it('applies only the fields that are present in the patch', async () => {
    const course = makeCourse();
    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(courseRepo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new UpdateCourseMetadataCommand('course-1', adminActor, { title: 'Only Title' }),
    );

    expect(result.title).toBe('Only Title');
    expect(result.slug).toBe('my-course'); // unchanged
  });

  it('throws CourseNotFoundError when course does not exist', async () => {
    vi.mocked(courseRepo.findById).mockResolvedValue(null);

    await expect(
      handler.execute(new UpdateCourseMetadataCommand('missing', adminActor, { title: 'X' })),
    ).rejects.toBeInstanceOf(CourseNotFoundError);

    expect(courseRepo.save).not.toHaveBeenCalled();
  });

  it('propagates CourseSlugAlreadyTakenError from the adapter', async () => {
    const course = makeCourse();
    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(courseRepo.save).mockRejectedValue(new CourseSlugAlreadyTakenError('new-slug'));

    await expect(
      handler.execute(
        new UpdateCourseMetadataCommand('course-1', adminActor, { slug: 'new-slug' }),
      ),
    ).rejects.toBeInstanceOf(CourseSlugAlreadyTakenError);
  });

  // ---------------------------------------------------------------------------
  // New scalar fields
  // ---------------------------------------------------------------------------

  it('sets posterUrl when provided', async () => {
    const course = makeCourse();
    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(courseRepo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new UpdateCourseMetadataCommand('course-1', adminActor, {
        posterUrl: 'https://example.com/poster.jpg',
      }),
    );

    expect(result.posterUrl).toBe('https://example.com/poster.jpg');
  });

  it('clears posterUrl when null is passed', async () => {
    const course = makeCourse();
    course.setPosterUrl('https://example.com/poster.jpg');
    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(courseRepo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new UpdateCourseMetadataCommand('course-1', adminActor, { posterUrl: null }),
    );

    expect(result.posterUrl).toBeNull();
  });

  it('sets level when provided', async () => {
    const course = makeCourse();
    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(courseRepo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new UpdateCourseMetadataCommand('course-1', adminActor, { level: 'beginner' }),
    );

    expect(result.level).toBe('beginner');
  });

  it('clears level when null is passed', async () => {
    const course = makeCourse();
    course.setLevel('beginner');
    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(courseRepo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new UpdateCourseMetadataCommand('course-1', adminActor, { level: null }),
    );

    expect(result.level).toBeNull();
  });

  it('sets language when provided', async () => {
    const course = makeCourse();
    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(courseRepo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new UpdateCourseMetadataCommand('course-1', adminActor, { language: 'en' }),
    );

    expect(result.language).toBe('en');
  });

  it('sets releaseDate when provided', async () => {
    const course = makeCourse();
    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(courseRepo.save).mockResolvedValue(undefined);

    const date = new Date('2024-06-15');
    const result = await handler.execute(
      new UpdateCourseMetadataCommand('course-1', adminActor, { releaseDate: date }),
    );

    expect(result.releaseDate).toBe('2024-06-15');
  });

  it('clears releaseDate when null is passed', async () => {
    const course = makeCourse();
    course.setReleaseDate(new Date('2024-06-15'));
    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(courseRepo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new UpdateCourseMetadataCommand('course-1', adminActor, { releaseDate: null }),
    );

    expect(result.releaseDate).toBeNull();
  });

  it('sets sourceUpdatedAt when provided', async () => {
    const course = makeCourse();
    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(courseRepo.save).mockResolvedValue(undefined);

    const ts = new Date('2025-01-01T12:00:00.000Z');
    const result = await handler.execute(
      new UpdateCourseMetadataCommand('course-1', adminActor, { sourceUpdatedAt: ts }),
    );

    expect(result.sourceUpdatedAt).toBe('2025-01-01T12:00:00.000Z');
  });

  it('sets ratingAverage and ratingCount when both are provided', async () => {
    const course = makeCourse();
    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(courseRepo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new UpdateCourseMetadataCommand('course-1', adminActor, {
        ratingAverage: 4.5,
        ratingCount: 100,
      }),
    );

    expect(result.ratingAverage).toBe(4.5);
    expect(result.ratingCount).toBe(100);
  });

  it('clears rating when both are null', async () => {
    const course = makeCourse();
    course.setRating(4.5, 100);
    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(courseRepo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new UpdateCourseMetadataCommand('course-1', adminActor, {
        ratingAverage: null,
        ratingCount: null,
      }),
    );

    expect(result.ratingAverage).toBeNull();
    expect(result.ratingCount).toBeNull();
  });

  it('sets externalIds when provided', async () => {
    const course = makeCourse();
    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(courseRepo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new UpdateCourseMetadataCommand('course-1', adminActor, {
        externalIds: [{ source: 'youtube', externalId: 'PLxxx' }],
      }),
    );

    expect(result.externalIds).toHaveLength(1);
    expect(result.externalIds?.[0]).toMatchObject({ source: 'youtube', externalId: 'PLxxx' });
  });

  it('clears externalIds when null is passed', async () => {
    const course = makeCourse();
    course.setExternalIds([{ source: 'youtube', externalId: 'PLxxx' }]);
    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(courseRepo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new UpdateCourseMetadataCommand('course-1', adminActor, { externalIds: null }),
    );

    expect(result.externalIds).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // ID array fields
  // ---------------------------------------------------------------------------

  it('sets instructorIds when provided — replaces existing', async () => {
    const course = makeCourse();
    const inst = makeInstructor('inst-1', 'alice', 'Alice');
    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(instructorRepo.findManyByIds).mockResolvedValue([inst]);
    vi.mocked(courseRepo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new UpdateCourseMetadataCommand('course-1', adminActor, { instructorIds: ['inst-1'] }),
    );

    expect(result.instructors).toHaveLength(1);
    expect(result.instructors?.[0]).toMatchObject({ id: 'inst-1' });
  });

  it('clears instructorIds when null is passed', async () => {
    const course = makeCourse();
    course.setInstructors([{ id: 'inst-1', slug: 'alice', displayName: 'Alice' }]);
    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(instructorRepo.findManyByIds).mockResolvedValue([]);
    vi.mocked(courseRepo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new UpdateCourseMetadataCommand('course-1', adminActor, { instructorIds: null }),
    );

    expect(result.instructors).toHaveLength(0);
  });

  it('clears instructorIds when empty array is passed', async () => {
    const course = makeCourse();
    course.setInstructors([{ id: 'inst-1', slug: 'alice', displayName: 'Alice' }]);
    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(instructorRepo.findManyByIds).mockResolvedValue([]);
    vi.mocked(courseRepo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new UpdateCourseMetadataCommand('course-1', adminActor, { instructorIds: [] }),
    );

    expect(result.instructors).toHaveLength(0);
  });

  it('throws CourseLinkUnknownEntityError for unknown instructorId', async () => {
    const course = makeCourse();
    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(instructorRepo.findManyByIds).mockResolvedValue([]);

    await expect(
      handler.execute(
        new UpdateCourseMetadataCommand('course-1', adminActor, {
          instructorIds: ['missing-inst'],
        }),
      ),
    ).rejects.toBeInstanceOf(CourseLinkUnknownEntityError);

    expect(courseRepo.save).not.toHaveBeenCalled();
  });

  it('sets studioIds when provided', async () => {
    const course = makeCourse();
    const studio = makeStudio('studio-1', 'acme', 'Acme');
    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(studioRepo.findManyByIds).mockResolvedValue([studio]);
    vi.mocked(courseRepo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new UpdateCourseMetadataCommand('course-1', adminActor, { studioIds: ['studio-1'] }),
    );

    expect(result.studios).toHaveLength(1);
    expect(result.studios?.[0]).toMatchObject({ id: 'studio-1' });
  });

  it('clears studioIds when null is passed', async () => {
    const course = makeCourse();
    course.setStudios([{ id: 'studio-1', slug: 'acme', displayName: 'Acme' }]);
    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(studioRepo.findManyByIds).mockResolvedValue([]);
    vi.mocked(courseRepo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new UpdateCourseMetadataCommand('course-1', adminActor, { studioIds: null }),
    );

    expect(result.studios).toHaveLength(0);
  });

  it('sets tagIds when provided', async () => {
    const course = makeCourse();
    const tag = makeTag('tag-1', 'typescript', 'TypeScript', 'language');
    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(tagRepo.findManyByIds).mockResolvedValue([tag]);
    vi.mocked(courseRepo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new UpdateCourseMetadataCommand('course-1', adminActor, { tagIds: ['tag-1'] }),
    );

    expect(result.tags).toHaveLength(1);
    expect(result.tags?.[0]).toMatchObject({ id: 'tag-1', category: 'language' });
  });

  it('clears tagIds when null is passed', async () => {
    const course = makeCourse();
    course.setTags([
      { id: 'tag-1', slug: 'typescript', displayName: 'TypeScript', category: null },
    ]);
    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(tagRepo.findManyByIds).mockResolvedValue([]);
    vi.mocked(courseRepo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new UpdateCourseMetadataCommand('course-1', adminActor, { tagIds: null }),
    );

    expect(result.tags).toHaveLength(0);
  });

  it('throws CourseLinkUnknownEntityError for unknown tagId', async () => {
    const course = makeCourse();
    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(tagRepo.findManyByIds).mockResolvedValue([]);

    await expect(
      handler.execute(
        new UpdateCourseMetadataCommand('course-1', adminActor, { tagIds: ['missing-tag'] }),
      ),
    ).rejects.toBeInstanceOf(CourseLinkUnknownEntityError);

    expect(courseRepo.save).not.toHaveBeenCalled();
  });

  it('applies mixed patch (title + posterUrl + tagIds) atomically in one save', async () => {
    const course = makeCourse();
    const tag = makeTag('tag-1', 'typescript', 'TypeScript', 'language');
    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(tagRepo.findManyByIds).mockResolvedValue([tag]);
    vi.mocked(courseRepo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new UpdateCourseMetadataCommand('course-1', adminActor, {
        title: 'Mixed Patch',
        posterUrl: 'https://example.com/p.jpg',
        tagIds: ['tag-1'],
      }),
    );

    expect(result.title).toBe('Mixed Patch');
    expect(result.posterUrl).toBe('https://example.com/p.jpg');
    expect(result.tags).toHaveLength(1);
    // Only one save call — the patch is atomic.
    expect(courseRepo.save).toHaveBeenCalledOnce();
  });
});
