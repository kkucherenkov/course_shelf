/**
 * WHY this file exists:
 * Command handler for replacing a course's tag links. Mirrors
 * SetCourseInstructorsHandler — validates existence of all referenced tag ids,
 * preserves input order, throws CourseLinkUnknownEntityError for the first
 * missing id. Tags carry an additional category field that is included in the
 * TagRef shape embedded in the Course aggregate.
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
import { TAG_REPOSITORY } from '../../domain/tag/tag.repository';

import { SetCourseTagsCommand } from './set-course-tags.command';

import type { Course } from '../../domain/course/course';
import type { CourseRepository } from '../../domain/course/course.repository';
import type { TagRepository } from '../../domain/tag/tag.repository';

@CommandHandler(SetCourseTagsCommand)
export class SetCourseTagsHandler implements ICommandHandler<SetCourseTagsCommand, Course> {
  constructor(
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(TAG_REPOSITORY) private readonly tagRepo: TagRepository,
  ) {}

  async execute(command: SetCourseTagsCommand): Promise<Course> {
    const course = await this.courseRepo.findById(command.courseId);
    if (!course) {
      throw new CourseNotFoundError(command.courseId);
    }

    const tags = await this.tagRepo.findManyByIds([...command.tagIds]);

    if (tags.length !== command.tagIds.length) {
      const foundIds = new Set(tags.map((t) => t.id as string));
      const missingId = command.tagIds.find((id) => !foundIds.has(id));
      throw new CourseLinkUnknownEntityError('Tag', missingId ?? 'unknown');
    }

    // Preserve input order — findManyByIds order is unspecified.
    const byId = new Map(tags.map((t) => [t.id as string, t]));
    const ordered = command.tagIds.map((id) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- presence validated above
      const tag = byId.get(id)!;
      return { id: tag.id, slug: tag.slug, displayName: tag.displayName, category: tag.category };
    });

    course.setTags(ordered);
    await this.courseRepo.save(course);
    return course;
  }
}
