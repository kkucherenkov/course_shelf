/**
 * WHY this file exists:
 * Command handler for instructor upsert. Implements a find-or-create strategy:
 *   1. Derive effective slug (provided slug or slugify(displayName)).
 *   2. Look up by slug — if found, update and save.
 *   3. Look up by first external id — if found, update and save.
 *   4. Otherwise create new aggregate and save.
 *
 * ExternalIdConflictError from the adapter propagates unchanged (409) when a
 * save collides on the (source, externalId) unique constraint.
 *
 * No HTTP exceptions here — only domain errors.
 */
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { nanoid } from 'nanoid';

import { Instructor } from '../../domain/instructor/instructor';
import { INSTRUCTOR_REPOSITORY } from '../../domain/instructor/instructor.repository';
import { slugify } from '../../domain/shared-vo/entity-slug';

import { UpsertInstructorCommand } from './upsert-instructor.command';

import type { InstructorRepository } from '../../domain/instructor/instructor.repository';

@CommandHandler(UpsertInstructorCommand)
export class UpsertInstructorHandler implements ICommandHandler<
  UpsertInstructorCommand,
  Instructor
> {
  constructor(@Inject(INSTRUCTOR_REPOSITORY) private readonly repo: InstructorRepository) {}

  async execute(command: UpsertInstructorCommand): Promise<Instructor> {
    const effectiveSlug = command.slug ?? slugify(command.displayName);
    const externalIds = [...(command.externalIds ?? [])];

    // 1. Look up by slug.
    const existingBySlug = await this.repo.findBySlug(effectiveSlug);
    if (existingBySlug) {
      existingBySlug.rename(command.displayName);
      existingBySlug.setExternalIds(externalIds);
      await this.repo.save(existingBySlug);
      return existingBySlug;
    }

    // 2. Look up by first external id when provided.
    const firstRef = externalIds[0];
    if (firstRef) {
      const existingByExternal = await this.repo.findByExternalId(
        firstRef.source,
        firstRef.externalId,
      );
      if (existingByExternal) {
        existingByExternal.rename(command.displayName);
        existingByExternal.setExternalIds(externalIds);
        await this.repo.save(existingByExternal);
        return existingByExternal;
      }
    }

    // 3. Create new.
    const instructor = Instructor.create({
      id: nanoid(),
      displayName: command.displayName,
      slug: effectiveSlug,
      externalIds,
    });
    await this.repo.save(instructor);
    return instructor;
  }
}
