/**
 * WHY this file exists:
 * Command handler for the admin-only PATCH /courses/{id} endpoint.
 * Loads the course, applies the non-null patch fields via aggregate methods,
 * and persists. CourseSlugAlreadyTakenError from the adapter propagates
 * unchanged so the controller/filter maps it to 409.
 *
 * For the *Ids patch fields (instructorIds, studioIds, tagIds) the handler
 * inlines the same fetch-and-validate logic as the dedicated Set* handlers
 * (using the same repository ports injected here) so the entire metadata
 * patch lands in ONE repo.save call. This keeps the update atomic from the
 * caller's perspective.
 *
 * Null semantics for *Ids:
 *   - undefined (key absent from patch): leave unchanged.
 *   - null: equivalent to [] — clear all associations.
 *   - string[]: set-replace.
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
import { STUDIO_REPOSITORY } from '../../domain/studio/studio.repository';
import { TAG_REPOSITORY } from '../../domain/tag/tag.repository';
import { toCourseDto } from '../../courses.dto';

import { UpdateCourseMetadataCommand } from './update-course-metadata.command';

import type { CourseRepository } from '../../domain/course/course.repository';
import type { InstructorRepository } from '../../domain/instructor/instructor.repository';
import type { StudioRepository } from '../../domain/studio/studio.repository';
import type { TagRepository } from '../../domain/tag/tag.repository';
import type { CourseDto } from '@app/api-client-ts';

@CommandHandler(UpdateCourseMetadataCommand)
export class UpdateCourseMetadataHandler implements ICommandHandler<
  UpdateCourseMetadataCommand,
  CourseDto
> {
  constructor(
    @Inject(COURSE_REPOSITORY) private readonly repo: CourseRepository,
    @Inject(INSTRUCTOR_REPOSITORY) private readonly instructorRepo: InstructorRepository,
    @Inject(STUDIO_REPOSITORY) private readonly studioRepo: StudioRepository,
    @Inject(TAG_REPOSITORY) private readonly tagRepo: TagRepository,
  ) {}

  async execute(command: UpdateCourseMetadataCommand): Promise<CourseDto> {
    const course = await this.repo.findById(command.courseId);

    if (!course) {
      throw new CourseNotFoundError(command.courseId);
    }

    const { patch } = command;

    // ---------------------------------------------------------------------------
    // Scalar fields
    // ---------------------------------------------------------------------------

    if (patch.title !== undefined) {
      course.rename(patch.title);
    }
    if (patch.description !== undefined) {
      course.setDescription(patch.description);
    }
    if (patch.slug !== undefined) {
      course.changeSlug(patch.slug);
    }
    if (patch.posterUrl !== undefined) {
      course.setPosterUrl(patch.posterUrl ?? undefined);
    }
    if (patch.level !== undefined) {
      course.setLevel(patch.level ?? undefined);
    }
    if (patch.language !== undefined) {
      course.setLanguage(patch.language ?? undefined);
    }
    if (patch.releaseDate !== undefined) {
      course.setReleaseDate(patch.releaseDate ?? undefined);
    }
    if (patch.sourceUpdatedAt !== undefined) {
      course.setSourceUpdatedAt(patch.sourceUpdatedAt ?? undefined);
    }
    if (patch.ratingAverage !== undefined || patch.ratingCount !== undefined) {
      // Both must be provided together, or both null/undefined to clear.
      const avg = patch.ratingAverage ?? undefined;
      const count = patch.ratingCount ?? undefined;
      course.setRating(avg, count);
    }
    if (patch.externalIds !== undefined) {
      course.setExternalIds(patch.externalIds ?? []);
    }

    // ---------------------------------------------------------------------------
    // Association (ID array) fields
    // Inline the fetch-and-validate logic from the dedicated Set* handlers so the
    // entire patch lands in one repo.save call.
    // null → equivalent to [] (clear all).
    // ---------------------------------------------------------------------------

    if (patch.instructorIds !== undefined) {
      const ids = patch.instructorIds ?? [];
      const instructors = await this.instructorRepo.findManyByIds(ids);
      if (instructors.length !== ids.length) {
        const foundIds = new Set(instructors.map((i) => i.id as string));
        const missingId = ids.find((id) => !foundIds.has(id));
        throw new CourseLinkUnknownEntityError('Instructor', missingId ?? 'unknown');
      }
      const byId = new Map(instructors.map((i) => [i.id as string, i]));
      course.setInstructors(
        ids.map((id) => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- presence validated above
          const inst = byId.get(id)!;
          return { id: inst.id, slug: inst.slug, displayName: inst.displayName };
        }),
      );
    }

    if (patch.studioIds !== undefined) {
      const ids = patch.studioIds ?? [];
      const studios = await this.studioRepo.findManyByIds(ids);
      if (studios.length !== ids.length) {
        const foundIds = new Set(studios.map((s) => s.id as string));
        const missingId = ids.find((id) => !foundIds.has(id));
        throw new CourseLinkUnknownEntityError('Studio', missingId ?? 'unknown');
      }
      const byId = new Map(studios.map((s) => [s.id as string, s]));
      course.setStudios(
        ids.map((id) => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- presence validated above
          const studio = byId.get(id)!;
          return { id: studio.id, slug: studio.slug, displayName: studio.displayName };
        }),
      );
    }

    if (patch.tagIds !== undefined) {
      const ids = patch.tagIds ?? [];
      const tags = await this.tagRepo.findManyByIds(ids);
      if (tags.length !== ids.length) {
        const foundIds = new Set(tags.map((t) => t.id as string));
        const missingId = ids.find((id) => !foundIds.has(id));
        throw new CourseLinkUnknownEntityError('Tag', missingId ?? 'unknown');
      }
      const byId = new Map(tags.map((t) => [t.id as string, t]));
      course.setTags(
        ids.map((id) => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- presence validated above
          const tag = byId.get(id)!;
          return {
            id: tag.id,
            slug: tag.slug,
            displayName: tag.displayName,
            category: tag.category,
          };
        }),
      );
    }

    // CourseSlugAlreadyTakenError (P2002) propagates from the adapter.
    await this.repo.save(course);

    return toCourseDto(course);
  }
}
