import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Course } from '../../domain/course/course';
import { Instructor } from '../../domain/instructor/instructor';
import { InstructorNotFoundError } from '../../domain/instructor/instructor.errors';
import { GetInstructorQuery } from './get-instructor.query';
import { GetInstructorHandler } from './get-instructor.handler';

import type { InstructorRepository } from '../../domain/instructor/instructor.repository';
import type { CourseRepository } from '../../domain/course/course.repository';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function makeInstructor(): Instructor {
  return Instructor.create({
    id: 'inst-1',
    displayName: 'Alice',
    slug: 'alice',
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

describe('GetInstructorHandler', () => {
  let instructorRepo: InstructorRepository;
  let courseRepo: CourseRepository;
  let handler: GetInstructorHandler;

  beforeEach(() => {
    instructorRepo = makeInstructorRepo();
    courseRepo = makeCourseRepo();
    handler = new GetInstructorHandler(instructorRepo, courseRepo);
  });

  it('returns InstructorDetailDto on happy path', async () => {
    const instructor = makeInstructor();
    const course = makeCourse('c1');

    vi.mocked(instructorRepo.findBySlug).mockResolvedValue(instructor);
    vi.mocked(instructorRepo.findCoursesForInstructor).mockResolvedValue({
      courseIds: ['c1'],
      total: 1,
    });
    vi.mocked(courseRepo.findByIds).mockResolvedValue([course]);

    const result = await handler.execute(new GetInstructorQuery('alice'));

    expect(result.instructor.id).toBe('inst-1');
    expect(result.instructor.slug).toBe('alice');
    expect(result.coursesTotal).toBe(1);
    expect(result.courses).toHaveLength(1);
    expect(result.courses[0]?.id).toBe('c1');
  });

  it('throws InstructorNotFoundError when slug does not match', async () => {
    vi.mocked(instructorRepo.findBySlug).mockResolvedValue(null);

    await expect(handler.execute(new GetInstructorQuery('missing'))).rejects.toBeInstanceOf(
      InstructorNotFoundError,
    );
  });

  it('returns empty courses array when instructor has no courses', async () => {
    const instructor = makeInstructor();
    vi.mocked(instructorRepo.findBySlug).mockResolvedValue(instructor);
    vi.mocked(instructorRepo.findCoursesForInstructor).mockResolvedValue({
      courseIds: [],
      total: 0,
    });

    const result = await handler.execute(new GetInstructorQuery('alice'));

    expect(result.coursesTotal).toBe(0);
    expect(result.courses).toHaveLength(0);
    // findByIds should not be called when there are no course ids.
    expect(courseRepo.findByIds).not.toHaveBeenCalled();
  });

  it('passes coursesOffset and coursesLimit to findCoursesForInstructor', async () => {
    const instructor = makeInstructor();
    vi.mocked(instructorRepo.findBySlug).mockResolvedValue(instructor);
    vi.mocked(instructorRepo.findCoursesForInstructor).mockResolvedValue({
      courseIds: [],
      total: 5,
    });

    await handler.execute(new GetInstructorQuery('alice', 2, 10));

    expect(instructorRepo.findCoursesForInstructor).toHaveBeenCalledWith('inst-1', {
      offset: 2,
      limit: 10,
    });
  });
});
