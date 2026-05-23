/**
 * WHY this file exists:
 * Command handler for replacing a course's studio links. Mirrors
 * SetCourseInstructorsHandler — validates existence of all referenced studio
 * ids, preserves input order, and throws CourseLinkUnknownEntityError for the
 * first missing id.
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
import { STUDIO_REPOSITORY } from '../../domain/studio/studio.repository';

import { SetCourseStudiosCommand } from './set-course-studios.command';

import type { Course } from '../../domain/course/course';
import type { CourseRepository } from '../../domain/course/course.repository';
import type { StudioRepository } from '../../domain/studio/studio.repository';

@CommandHandler(SetCourseStudiosCommand)
export class SetCourseStudiosHandler implements ICommandHandler<SetCourseStudiosCommand, Course> {
  constructor(
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(STUDIO_REPOSITORY) private readonly studioRepo: StudioRepository,
  ) {}

  async execute(command: SetCourseStudiosCommand): Promise<Course> {
    const course = await this.courseRepo.findById(command.courseId);
    if (!course) {
      throw new CourseNotFoundError(command.courseId);
    }

    const studios = await this.studioRepo.findManyByIds([...command.studioIds]);

    if (studios.length !== command.studioIds.length) {
      const foundIds = new Set(studios.map((s) => s.id as string));
      const missingId = command.studioIds.find((id) => !foundIds.has(id));
      throw new CourseLinkUnknownEntityError('Studio', missingId ?? 'unknown');
    }

    // Preserve input order — findManyByIds order is unspecified.
    const byId = new Map(studios.map((s) => [s.id as string, s]));
    const ordered = command.studioIds.map((id) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- presence validated above
      const studio = byId.get(id)!;
      return { id: studio.id, slug: studio.slug, displayName: studio.displayName };
    });

    course.setStudios(ordered);
    await this.courseRepo.save(course);
    return course;
  }
}
