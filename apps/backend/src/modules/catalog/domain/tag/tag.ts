/**
 * WHY this file exists:
 * Tag is a lightweight aggregate root that owns the invariants for tag
 * identity within the Catalog bounded context. It mirrors the Instructor and
 * Studio aggregates in structure but adds an optional category field (free-form
 * string, max 64 chars, trimmed) for organising tags into groups.
 *
 * Category validation rejects strings longer than 64 characters to keep the
 * field useful as a lightweight grouping mechanism without requiring a separate
 * Category aggregate.
 */
import { brand } from '../../../../shared/branded-id';
import { EntitySlug, slugify } from '../shared-vo/entity-slug';
import { DisplayName } from '../shared-vo/display-name';
import { ExternalIdRefVO } from '../shared-vo/external-id-ref';
import { TagCategoryInvalidError } from './tag.errors';

import type { Id } from '../../../../shared/branded-id';
import type { ExternalIdRef } from '../shared-vo/external-id-ref';

/** Phantom-branded id for Tag — prevents mixing with Course/Instructor/Studio ids. */
export type TagId = Id<'Tag'>;

const TAG_CATEGORY_MAX_LENGTH = 64;

export interface TagProps {
  readonly id: TagId;
  readonly slug: string;
  readonly displayName: string;
  readonly category: string | null;
  readonly externalIds: readonly ExternalIdRef[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class Tag {
  readonly id: TagId;
  readonly createdAt: Date;
  private _slug: EntitySlug;
  private _displayName: DisplayName;
  private _category: string | null;
  private _externalIds: ExternalIdRef[];
  private _updatedAt: Date;

  private constructor(props: TagProps) {
    this.id = props.id;
    this.createdAt = props.createdAt;
    this._slug = EntitySlug.from(props.slug, 'Tag');
    this._displayName = DisplayName.from(props.displayName, 'Tag');
    this._category = props.category;
    this._externalIds = [...props.externalIds];
    this._updatedAt = props.updatedAt;
  }

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------

  get slug(): string {
    return this._slug.value;
  }

  get displayName(): string {
    return this._displayName.value;
  }

  get category(): string | null {
    return this._category;
  }

  get externalIds(): readonly ExternalIdRef[] {
    return this._externalIds;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ---------------------------------------------------------------------------
  // Factories
  // ---------------------------------------------------------------------------

  /**
   * Factory that enforces domain invariants before constructing the aggregate.
   * Derives slug from displayName via slugify when slug is not provided.
   * Validates displayName via DisplayName VO, category length (≤64 chars after
   * trim), and each externalId ref via ExternalIdRefVO.from.
   * The now parameter defaults to new Date() so callers in tests can pin the clock.
   */
  static create(props: {
    id: string;
    displayName: string;
    slug?: string;
    category?: string | null;
    externalIds?: ExternalIdRef[];
    now?: Date;
  }): Tag {
    const now = props.now ?? new Date();
    // Validate displayName first so invalid display names surface the right error
    // before slugify is called (which would otherwise throw EntitySlugInvalidError).
    const nameVo = DisplayName.from(props.displayName, 'Tag');
    const rawSlug = props.slug ?? slugify(nameVo.value);
    const category = validateCategory(props.category ?? null);
    const validatedRefs = (props.externalIds ?? []).map((r) => ExternalIdRefVO.from(r));
    return new Tag({
      id: brand<string, 'Tag'>(props.id),
      slug: rawSlug,
      displayName: nameVo.value,
      category,
      externalIds: validatedRefs,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitutes an aggregate from persisted data. Bypasses validation because
   * the DB is the source of truth for already-valid data. Used exclusively by
   * the Prisma adapter.
   */
  static reconstitute(props: TagProps): Tag {
    const tag = Object.create(Tag.prototype) as Tag;
    const w = tag as unknown as Record<string, unknown>;
    w['id'] = props.id;
    w['createdAt'] = props.createdAt;
    w['_slug'] = EntitySlug.from(props.slug, 'Tag');
    w['_displayName'] = DisplayName.from(props.displayName, 'Tag');
    w['_category'] = props.category;
    w['_externalIds'] = [...props.externalIds];
    w['_updatedAt'] = props.updatedAt;
    return tag;
  }

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  /**
   * Rename the tag. Trims and validates via DisplayName VO.
   * Calls _touch() on success.
   */
  rename(newDisplayName: string): void {
    this._displayName = DisplayName.from(newDisplayName, 'Tag');
    this._touch();
  }

  /**
   * Change the slug. Validates via EntitySlug VO. The uniqueness constraint
   * is enforced by the repository (TagSlugAlreadyTakenError on P2002).
   * Calls _touch() on success.
   */
  changeSlug(newSlug: string): void {
    this._slug = EntitySlug.from(newSlug, 'Tag');
    this._touch();
  }

  /**
   * Set or clear the category. Pass null to clear. Trims non-null input.
   * Throws TagCategoryInvalidError when the trimmed value exceeds 64 characters.
   * Calls _touch() on success.
   */
  setCategory(category: string | null): void {
    this._category = validateCategory(category);
    this._touch();
  }

  /**
   * Replace the entire external-id set atomically. Dedupes by (source, externalId)
   * pair — last occurrence wins when input accidentally contains duplicates.
   * Validates each ref via ExternalIdRefVO.from. Calls _touch() always.
   */
  setExternalIds(refs: ExternalIdRef[]): void {
    const validated = refs.map((r) => ExternalIdRefVO.from(r));
    this._externalIds = dedupeRefs(validated);
    this._touch();
  }

  /**
   * Append an external-id ref when the (source, externalId) pair is not already
   * present. No-op (and no _touch) when the pair already exists. Validates via
   * ExternalIdRefVO.from before checking for duplicates.
   */
  addExternalId(ref: ExternalIdRef): void {
    const validated = ExternalIdRefVO.from(ref);
    const exists = this._externalIds.some(
      (r) => r.source === validated.source && r.externalId === validated.externalId,
    );
    if (!exists) {
      this._externalIds.push(validated);
      this._touch();
    }
  }

  /**
   * Remove the external-id ref matching the given (source, externalId) pair.
   * No-op when the pair is not present; calls _touch() only when something is removed.
   */
  removeExternalId(pair: { source: string; externalId: string }): void {
    const before = this._externalIds.length;
    this._externalIds = this._externalIds.filter(
      (r) => !(r.source === pair.source && r.externalId === pair.externalId),
    );
    if (this._externalIds.length < before) {
      this._touch();
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _touch(): void {
    this._updatedAt = new Date();
  }
}

// ---------------------------------------------------------------------------
// Module-private helpers
// ---------------------------------------------------------------------------

/** Validates and trims category. Returns null when category is null. */
function validateCategory(category: string | null): string | null {
  if (category === null) return null;
  const trimmed = category.trim();
  if (trimmed.length > TAG_CATEGORY_MAX_LENGTH) {
    throw new TagCategoryInvalidError(trimmed.length);
  }
  return trimmed.length === 0 ? null : trimmed;
}

/** Dedupe by (source, externalId) — last occurrence wins, insertion order preserved for first-seen. */
function dedupeRefs(refs: ExternalIdRef[]): ExternalIdRef[] {
  const seen = new Map<string, ExternalIdRef>();
  for (const ref of refs) {
    seen.set(`${ref.source}:${ref.externalId}`, ref);
  }
  return [...seen.values()];
}
