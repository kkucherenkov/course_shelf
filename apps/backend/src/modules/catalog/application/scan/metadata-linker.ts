/**
 * WHY this file exists:
 * MetadataLinker is a scan-layer orchestration helper that converts raw display
 * names (from course.json) into persisted Instructor/Studio/Tag aggregates and
 * returns their typed ref projections. It is deliberately kept separate from
 * RunScanHandler so that handler stays focused on file-walk orchestration while
 * the lookup-or-create logic lives in one testable place.
 *
 * Algorithm (same for each entity type):
 *   1. Trim input; skip empty strings.
 *   2. Deduplicate by slug (first occurrence wins).
 *   3. For each unique slug: findBySlug → return existing, or create new
 *      aggregate + save. On InstructorSlugAlreadyTakenError (concurrent race),
 *      retry findBySlug once and use that result.
 *   4. Map to the appropriate Ref type.
 *
 * No domain events are emitted here (deferred to Stage 4).
 * No Prisma types — all I/O goes through the domain port interfaces.
 */
import { Inject, Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid';

import { Instructor } from '../../domain/instructor/instructor';
import { InstructorSlugAlreadyTakenError } from '../../domain/instructor/instructor.errors';
import { INSTRUCTOR_REPOSITORY } from '../../domain/instructor/instructor.repository';
import { Studio } from '../../domain/studio/studio';
import { StudioSlugAlreadyTakenError } from '../../domain/studio/studio.errors';
import { STUDIO_REPOSITORY } from '../../domain/studio/studio.repository';
import { Tag } from '../../domain/tag/tag';
import { TagSlugAlreadyTakenError } from '../../domain/tag/tag.errors';
import { TAG_REPOSITORY } from '../../domain/tag/tag.repository';
import { slugify } from '../../domain/shared-vo/entity-slug';

import type { InstructorRepository } from '../../domain/instructor/instructor.repository';
import type { StudioRepository } from '../../domain/studio/studio.repository';
import type { TagRepository } from '../../domain/tag/tag.repository';
import type { InstructorRef, StudioRef, TagRef } from '../../domain/shared-vo/refs';

@Injectable()
export class MetadataLinker {
  constructor(
    @Inject(INSTRUCTOR_REPOSITORY) private readonly instructors: InstructorRepository,
    @Inject(STUDIO_REPOSITORY) private readonly studios: StudioRepository,
    @Inject(TAG_REPOSITORY) private readonly tags: TagRepository,
  ) {}

  /**
   * Resolve display names to instructor refs, creating new aggregates for any
   * not yet in the DB. Idempotent: re-running with the same names is a no-op.
   * Names are trimmed; empty/whitespace-only names and duplicates (by slug) are
   * filtered out. Returns refs in the same order as the de-duplicated input.
   */
  async upsertInstructorsByName(names: readonly string[]): Promise<InstructorRef[]> {
    const uniqueEntries = dedupeBySlug(names);
    const refs: InstructorRef[] = [];
    for (const { name, slug } of uniqueEntries) {
      const instructor = await this.findOrCreateInstructor(name, slug);
      refs.push({ id: instructor.id, slug: instructor.slug, displayName: instructor.displayName });
    }
    return refs;
  }

  /**
   * Resolve a display name to a studio ref, creating a new aggregate if needed.
   * Returns null when name is empty or whitespace-only.
   */
  async upsertStudioByName(name: string): Promise<StudioRef | null> {
    const trimmed = name.trim();
    if (trimmed.length === 0) return null;

    const slug = slugify(trimmed);
    const studio = await this.findOrCreateStudio(trimmed, slug);
    return { id: studio.id, slug: studio.slug, displayName: studio.displayName };
  }

  /**
   * Resolve display names to tag refs, creating new aggregates for any not yet
   * in the DB. Category remains undefined (null) when created via this method.
   * Same deduplication rules as upsertInstructorsByName.
   */
  async upsertTagsByName(names: readonly string[]): Promise<TagRef[]> {
    const uniqueEntries = dedupeBySlug(names);
    const refs: TagRef[] = [];
    for (const { name, slug } of uniqueEntries) {
      const tag = await this.findOrCreateTag(name, slug);
      refs.push({
        id: tag.id,
        slug: tag.slug,
        displayName: tag.displayName,
        category: tag.category,
      });
    }
    return refs;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async findOrCreateInstructor(name: string, slug: string): Promise<Instructor> {
    const existing = await this.instructors.findBySlug(slug);
    if (existing) return existing;

    const created = Instructor.create({ id: nanoid(), displayName: name, slug });
    try {
      await this.instructors.save(created);
      return created;
    } catch (error) {
      if (error instanceof InstructorSlugAlreadyTakenError) {
        // Concurrent race — retry the lookup once.
        const retried = await this.instructors.findBySlug(slug);
        if (retried) return retried;
      }
      throw error;
    }
  }

  private async findOrCreateStudio(name: string, slug: string): Promise<Studio> {
    const existing = await this.studios.findBySlug(slug);
    if (existing) return existing;

    const created = Studio.create({ id: nanoid(), displayName: name, slug });
    try {
      await this.studios.save(created);
      return created;
    } catch (error) {
      if (error instanceof StudioSlugAlreadyTakenError) {
        const retried = await this.studios.findBySlug(slug);
        if (retried) return retried;
      }
      throw error;
    }
  }

  private async findOrCreateTag(name: string, slug: string): Promise<Tag> {
    const existing = await this.tags.findBySlug(slug);
    if (existing) return existing;

    const created = Tag.create({ id: nanoid(), displayName: name, slug, category: null });
    try {
      await this.tags.save(created);
      return created;
    } catch (error) {
      if (error instanceof TagSlugAlreadyTakenError) {
        const retried = await this.tags.findBySlug(slug);
        if (retried) return retried;
      }
      throw error;
    }
  }
}

// ---------------------------------------------------------------------------
// Module-private helpers
// ---------------------------------------------------------------------------

interface SlugEntry {
  readonly name: string;
  readonly slug: string;
}

/**
 * Trim names, derive slugs, and deduplicate by slug (first occurrence wins).
 * Empty/whitespace-only names produce no slug entry and are dropped.
 */
function dedupeBySlug(names: readonly string[]): SlugEntry[] {
  const seen = new Set<string>();
  const result: SlugEntry[] = [];
  for (const raw of names) {
    const name = raw.trim();
    if (name.length === 0) continue;
    let slug: string;
    try {
      slug = slugify(name);
    } catch {
      // slugify throws EntitySlugInvalidError for all-symbol names; skip them.
      continue;
    }
    if (seen.has(slug)) continue;
    seen.add(slug);
    result.push({ name, slug });
  }
  return result;
}
