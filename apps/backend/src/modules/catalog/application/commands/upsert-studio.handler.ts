/**
 * WHY this file exists:
 * Command handler for studio upsert. Implements the same find-or-create
 * strategy as UpsertInstructorHandler:
 *   1. Derive effective slug (provided slug or slugify(displayName)).
 *   2. Look up by slug — if found, update and save.
 *   3. Look up by first external id — if found, update and save.
 *   4. Otherwise create new aggregate and save.
 *
 * No HTTP exceptions here — only domain errors.
 */
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { nanoid } from 'nanoid';

import { Studio } from '../../domain/studio/studio';
import { STUDIO_REPOSITORY } from '../../domain/studio/studio.repository';
import { slugify } from '../../domain/shared-vo/entity-slug';

import { UpsertStudioCommand } from './upsert-studio.command';

import type { StudioRepository } from '../../domain/studio/studio.repository';

@CommandHandler(UpsertStudioCommand)
export class UpsertStudioHandler implements ICommandHandler<UpsertStudioCommand, Studio> {
  constructor(@Inject(STUDIO_REPOSITORY) private readonly repo: StudioRepository) {}

  async execute(command: UpsertStudioCommand): Promise<Studio> {
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
    const studio = Studio.create({
      id: nanoid(),
      displayName: command.displayName,
      slug: effectiveSlug,
      externalIds,
    });
    await this.repo.save(studio);
    return studio;
  }
}
