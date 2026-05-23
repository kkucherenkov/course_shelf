/**
 * WHY this file exists:
 * Command handler for replacing a course's instructor links. Validates that
 * every referenced instructor id exists before calling course.setInstructors,
 * throwing CourseLinkUnknownEntityError for the first missing id. The input
 * order is preserved even though findManyByIds may return instructors in a
 * different order.
 *
 * No HTTP exceptions here — only domain errors.
 */
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import {
  CourseNotFoundError,
  CourseLinkUnknownEntityError,
} from '../../domain/course/course.errors';
import { INSTRUCTOR_REPOSITORY } from '../../domain/instructor/instructor.repository';

import { SetCourseInstructorsCommand } from './set-course-instructors.command';

import type { Course } from '../../domain/course/course';
import type { CourseRepository } from '../../domain/course/course.repository';
import type { InstructorRepository } from '../../domain/instructor/instructor.repository';

@CommandHandler(SetCourseInstructorsCommand)
export class SetCourseInstructorsHandler implements ICommandHandler<
  SetCourseInstructorsCommand,
  Course
> {
  constructor(
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(INSTRUCTOR_REPOSITORY) private readonly instructorRepo: InstructorRepository,
  ) {}

  async execute(command: SetCourseInstructorsCommand): Promise<Course> {
    const course = await this.courseRepo.findById(command.courseId);
    if (!course) {
      throw new CourseNotFoundError(command.courseId);
    }

    const instructors = await this.instructorRepo.findManyByIds([...command.instructorIds]);

    if (instructors.length !== command.instructorIds.length) {
      // Find the first missing id to surface in the error.
      const foundIds = new Set(instructors.map((i) => i.id as string));
      const missingId = command.instructorIds.find((id) => !foundIds.has(id));
      throw new CourseLinkUnknownEntityError('Instructor', missingId ?? 'unknown');
    }

    // Preserve input order — findManyByIds order is unspecified.
    const byId = new Map(instructors.map((i) => [i.id as string, i]));
    const ordered = command.instructorIds.map((id) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- presence validated above
      const inst = byId.get(id)!;
      return { id: inst.id, slug: inst.slug, displayName: inst.displayName };
    });

    course.setInstructors(ordered);
    await this.courseRepo.save(course);
    return course;
  }
}
