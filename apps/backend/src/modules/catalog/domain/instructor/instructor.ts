/**
 * WHY this file exists:
 * Instructor is a lightweight aggregate root that owns the invariants for
 * instructor identity within the Catalog bounded context. It enforces slug
 * uniqueness at the domain level (repo port throws InstructorSlugAlreadyTakenError
 * on P2002), validates display names and external-id refs on mutation, and
 * provides a single authoritative reconstitution path for the Prisma adapter.
 *
 * External-id management uses atomic set-replace (setExternalIds) for bulk
 * operations and idempotent add/remove for surgical mutations — both patterns
 * appear in the application-layer command handlers.
 */
import { brand } from '../../../../shared/branded-id';
import { EntitySlug, slugify } from '../shared-vo/entity-slug';
import { DisplayName } from '../shared-vo/display-name';
import { ExternalIdRefVO } from '../shared-vo/external-id-ref';

import type { Id } from '../../../../shared/branded-id';
import type { ExternalIdRef } from '../shared-vo/external-id-ref';

/** Phantom-branded id for Instructor — prevents mixing with Course/Studio/Tag ids. */
export type InstructorId = Id<'Instructor'>;

export interface InstructorProps {
  readonly id: InstructorId;
  readonly slug: string;
  readonly displayName: string;
  readonly externalIds: readonly ExternalIdRef[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class Instructor {
  readonly id: InstructorId;
  readonly createdAt: Date;
  private _slug: EntitySlug;
  private _displayName: DisplayName;
  private _externalIds: ExternalIdRef[];
  private _updatedAt: Date;

  private constructor(props: InstructorProps) {
    this.id = props.id;
    this.createdAt = props.createdAt;
    this._slug = EntitySlug.from(props.slug, 'Instructor');
    this._displayName = DisplayName.from(props.displayName, 'Instructor');
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
   * Validates displayName via DisplayName VO and each externalId ref via
   * ExternalIdRefVO.from. The now parameter defaults to new Date() so callers
   * in tests can pin the clock.
   */
  static create(props: {
    id: string;
    displayName: string;
    slug?: string;
    externalIds?: ExternalIdRef[];
    now?: Date;
  }): Instructor {
    const now = props.now ?? new Date();
    // Validate displayName first so invalid display names surface the right error
    // before slugify is called (which would otherwise throw EntitySlugInvalidError).
    const nameVo = DisplayName.from(props.displayName, 'Instructor');
    const rawSlug = props.slug ?? slugify(nameVo.value);
    const validatedRefs = (props.externalIds ?? []).map((r) => ExternalIdRefVO.from(r));
    return new Instructor({
      id: brand<string, 'Instructor'>(props.id),
      slug: rawSlug,
      displayName: nameVo.value,
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
  static reconstitute(props: InstructorProps): Instructor {
    const inst = Object.create(Instructor.prototype) as Instructor;
    const w = inst as unknown as Record<string, unknown>;
    w['id'] = props.id;
    w['createdAt'] = props.createdAt;
    w['_slug'] = EntitySlug.from(props.slug, 'Instructor');
    w['_displayName'] = DisplayName.from(props.displayName, 'Instructor');
    w['_externalIds'] = [...props.externalIds];
    w['_updatedAt'] = props.updatedAt;
    return inst;
  }

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  /**
   * Rename the instructor. Trims and validates via DisplayName VO.
   * Calls _touch() on success.
   */
  rename(newDisplayName: string): void {
    this._displayName = DisplayName.from(newDisplayName, 'Instructor');
    this._touch();
  }

  /**
   * Change the slug. Validates via EntitySlug VO. The uniqueness constraint
   * is enforced by the repository (InstructorSlugAlreadyTakenError on P2002).
   * Calls _touch() on success.
   */
  changeSlug(newSlug: string): void {
    this._slug = EntitySlug.from(newSlug, 'Instructor');
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

/** Dedupe by (source, externalId) — last occurrence wins, insertion order preserved for first-seen. */
function dedupeRefs(refs: ExternalIdRef[]): ExternalIdRef[] {
  const seen = new Map<string, ExternalIdRef>();
  for (const ref of refs) {
    seen.set(`${ref.source}:${ref.externalId}`, ref);
  }
  return [...seen.values()];
}
