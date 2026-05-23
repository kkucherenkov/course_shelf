import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Course } from '../../domain/course/course';
import { Instructor } from '../../domain/instructor/instructor';
import {
  CourseNotFoundError,
  CourseLinkUnknownEntityError,
} from '../../domain/course/course.errors';
import { SetCourseInstructorsCommand } from './set-course-instructors.command';
import { SetCourseInstructorsHandler } from './set-course-instructors.handler';

import type { CourseRepository } from '../../domain/course/course.repository';
import type { InstructorRepository } from '../../domain/instructor/instructor.repository';

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SetCourseInstructorsHandler', () => {
  let courseRepo: CourseRepository;
  let instructorRepo: InstructorRepository;
  let handler: SetCourseInstructorsHandler;

  beforeEach(() => {
    courseRepo = makeCourseRepo();
    instructorRepo = makeInstructorRepo();
    handler = new SetCourseInstructorsHandler(courseRepo, instructorRepo);
  });

  it('sets instructors on the course and saves (happy path)', async () => {
    const course = makeCourse();
    const inst1 = makeInstructor('inst-1', 'alice', 'Alice');
    const inst2 = makeInstructor('inst-2', 'bob', 'Bob');

    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(instructorRepo.findManyByIds).mockResolvedValue([inst1, inst2]);
    vi.mocked(courseRepo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new SetCourseInstructorsCommand('course-1', ['inst-1', 'inst-2']),
    );

    expect(result.instructors).toHaveLength(2);
    expect(result.instructors[0]).toMatchObject({ id: 'inst-1', slug: 'alice' });
    expect(result.instructors[1]).toMatchObject({ id: 'inst-2', slug: 'bob' });
    expect(courseRepo.save).toHaveBeenCalledOnce();
  });

  it('preserves input order even when adapter returns instructors in a different order', async () => {
    const course = makeCourse();
    const inst1 = makeInstructor('inst-1', 'alice', 'Alice');
    const inst2 = makeInstructor('inst-2', 'bob', 'Bob');

    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    // Adapter returns in reverse order.
    vi.mocked(instructorRepo.findManyByIds).mockResolvedValue([inst2, inst1]);
    vi.mocked(courseRepo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new SetCourseInstructorsCommand('course-1', ['inst-1', 'inst-2']),
    );

    // Must match input order, not adapter return order.
    expect(result.instructors[0]).toMatchObject({ id: 'inst-1' });
    expect(result.instructors[1]).toMatchObject({ id: 'inst-2' });
  });

  it('throws CourseNotFoundError when course does not exist', async () => {
    vi.mocked(courseRepo.findById).mockResolvedValue(null);

    await expect(
      handler.execute(new SetCourseInstructorsCommand('missing', ['inst-1'])),
    ).rejects.toBeInstanceOf(CourseNotFoundError);

    expect(courseRepo.save).not.toHaveBeenCalled();
  });

  it('throws CourseLinkUnknownEntityError for the first unknown instructor id', async () => {
    const course = makeCourse();
    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    // Only one of the two instructors exists.
    vi.mocked(instructorRepo.findManyByIds).mockResolvedValue([
      makeInstructor('inst-1', 'alice', 'Alice'),
    ]);

    await expect(
      handler.execute(new SetCourseInstructorsCommand('course-1', ['inst-1', 'inst-missing'])),
    ).rejects.toBeInstanceOf(CourseLinkUnknownEntityError);

    expect(courseRepo.save).not.toHaveBeenCalled();
  });

  it('clears all instructors when an empty array is passed (idempotent)', async () => {
    const course = makeCourse();
    // Set initial instructors.
    course.setInstructors([{ id: 'inst-1', slug: 'alice', displayName: 'Alice' }]);

    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(instructorRepo.findManyByIds).mockResolvedValue([]);
    vi.mocked(courseRepo.save).mockResolvedValue(undefined);

    const result = await handler.execute(new SetCourseInstructorsCommand('course-1', []));

    expect(result.instructors).toHaveLength(0);
    expect(courseRepo.save).toHaveBeenCalledOnce();
  });

  it('is idempotent when called twice with the same ids', async () => {
    const course = makeCourse();
    const inst = makeInstructor('inst-1', 'alice', 'Alice');

    vi.mocked(courseRepo.findById).mockResolvedValue(course);
    vi.mocked(instructorRepo.findManyByIds).mockResolvedValue([inst]);
    vi.mocked(courseRepo.save).mockResolvedValue(undefined);

    await handler.execute(new SetCourseInstructorsCommand('course-1', ['inst-1']));
    await handler.execute(new SetCourseInstructorsCommand('course-1', ['inst-1']));

    expect(course.instructors).toHaveLength(1);
  });
});
