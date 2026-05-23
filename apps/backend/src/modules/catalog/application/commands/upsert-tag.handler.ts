/**
 * WHY this file exists:
 * Command handler for tag upsert. Mirrors UpsertInstructorHandler but also
 * applies the optional category field via tag.setCategory when present.
 *
 * Find-or-create strategy:
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

import { Tag } from '../../domain/tag/tag';
import { TAG_REPOSITORY } from '../../domain/tag/tag.repository';
import { slugify } from '../../domain/shared-vo/entity-slug';

import { UpsertTagCommand } from './upsert-tag.command';

import type { TagRepository } from '../../domain/tag/tag.repository';

@CommandHandler(UpsertTagCommand)
export class UpsertTagHandler implements ICommandHandler<UpsertTagCommand, Tag> {
  constructor(@Inject(TAG_REPOSITORY) private readonly repo: TagRepository) {}

  async execute(command: UpsertTagCommand): Promise<Tag> {
    const effectiveSlug = command.slug ?? slugify(command.displayName);
    const externalIds = [...(command.externalIds ?? [])];

    // 1. Look up by slug.
    const existingBySlug = await this.repo.findBySlug(effectiveSlug);
    if (existingBySlug) {
      existingBySlug.rename(command.displayName);
      existingBySlug.setExternalIds(externalIds);
      if (command.category !== undefined) {
        existingBySlug.setCategory(command.category);
      }
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
        if (command.category !== undefined) {
          existingByExternal.setCategory(command.category);
        }
        await this.repo.save(existingByExternal);
        return existingByExternal;
      }
    }

    // 3. Create new.
    const tag = Tag.create({
      id: nanoid(),
      displayName: command.displayName,
      slug: effectiveSlug,
      category: command.category ?? null,
      externalIds,
    });
    await this.repo.save(tag);
    return tag;
  }
}
