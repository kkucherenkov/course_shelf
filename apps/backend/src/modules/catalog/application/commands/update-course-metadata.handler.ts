/**
 * WHY this file exists:
 * Command handler for the admin-only PATCH /courses/{id} endpoint.
 * Loads the course, applies the non-null patch fields via aggregate methods,
 * and persists. CourseSlugAlreadyTakenError from the adapter propagates
 * unchanged so the controller/filter maps it to 409.
 *
 * No HTTP exceptions here — only domain errors.
 */
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import { CourseNotFoundError } from '../../domain/course/course.errors';
import { toCourseDto } from '../../courses.dto';

import { UpdateCourseMetadataCommand } from './update-course-metadata.command';

import type { CourseRepository } from '../../domain/course/course.repository';
import type { CourseDto } from '@app/api-client-ts';

@CommandHandler(UpdateCourseMetadataCommand)
export class UpdateCourseMetadataHandler implements ICommandHandler<
  UpdateCourseMetadataCommand,
  CourseDto
> {
  constructor(@Inject(COURSE_REPOSITORY) private readonly repo: CourseRepository) {}

  async execute(command: UpdateCourseMetadataCommand): Promise<CourseDto> {
    const course = await this.repo.findById(command.courseId);

    if (!course) {
      throw new CourseNotFoundError(command.courseId);
    }

    const { patch } = command;

    if (patch.title !== undefined) {
      course.rename(patch.title);
    }
    if (patch.description !== undefined) {
      course.setDescription(patch.description);
    }
    if (patch.slug !== undefined) {
      course.changeSlug(patch.slug);
    }

    // CourseSlugAlreadyTakenError (P2002) propagates from the adapter.
    await this.repo.save(course);

    return toCourseDto(course);
  }
}
