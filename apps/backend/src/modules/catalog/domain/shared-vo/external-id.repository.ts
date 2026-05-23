/**
 * WHY this file exists:
 * The ExternalId table in the DB is a polymorphic association table — it links
 * (source, externalId) pairs to any entity type (course, instructor, studio, tag).
 * Because Prisma does not support polymorphic relations natively, external IDs are
 * managed through this dedicated port rather than through each aggregate's own
 * repository. This keeps the aggregate repositories clean and lets the adapter
 * implement atomic replace semantics in one place.
 *
 * The tx? parameter uses `unknown` intentionally at the port boundary. The Prisma
 * adapter (Slice 3) narrows it to a Prisma transaction client. Callers in the
 * application layer that compose multiple writes into one transaction pass the tx
 * through; callers that do not need transactional composition omit it.
 */
import type { ExternalIdRef } from './external-id-ref';

/** Injection token — Symbol ensures global uniqueness across the process. */
export const EXTERNAL_ID_REPOSITORY = Symbol('EXTERNAL_ID_REPOSITORY');

/** The set of entity types that can own external ids. Must match the DB enum. */
export type ExternalIdEntityType = 'course' | 'instructor' | 'studio' | 'tag';

export interface ExternalIdRepository {
  /**
   * Replace the full set of external ids for one entity, atomically.
   * Deletes all existing rows for (entityType, entityId) and inserts the new set
   * in a single operation. Passing an empty refs array effectively clears all
   * external ids for the entity.
   *
   * The tx parameter accepts an optional Prisma transaction client so callers can
   * compose this write with the parent aggregate's own upsert inside one transaction.
   * The shape of tx is `unknown` at the port boundary; the adapter narrows it to
   * Prisma.TransactionClient.
   *
   * Throws ExternalIdConflictError (409) when any ref's (source, externalId) pair
   * is already owned by a different entity (Prisma P2002 on the unique index).
   */
  replaceForEntity(
    entityType: ExternalIdEntityType,
    entityId: string,
    refs: readonly ExternalIdRef[],
    tx?: unknown,
  ): Promise<void>;

  /**
   * Return all external id refs owned by the given entity. Returns an empty array
   * when no refs exist. Used by aggregate reconstitution when the adapter cannot
   * eagerly load external ids via a Prisma relation (because the association is
   * polymorphic and has no Prisma relation field).
   */
  findByEntity(entityType: ExternalIdEntityType, entityId: string): Promise<ExternalIdRef[]>;

  /**
   * Reverse lookup: given a (source, externalId) pair, return the entity that owns
   * it. Returns null when no external id matches. The unique key in the DB is
   * (source, externalId) — see Slice 1 schema — so this lookup is always O(1) via
   * the unique index.
   *
   * Used by upsert handlers to check whether an external id is already registered
   * before creating a new entity.
   */
  findEntity(
    source: string,
    externalId: string,
  ): Promise<{ entityType: ExternalIdEntityType; entityId: string; url: string | null } | null>;
}
