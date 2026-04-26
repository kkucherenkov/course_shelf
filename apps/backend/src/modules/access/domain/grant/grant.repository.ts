/**
 * WHY this file exists:
 * Domain code must not depend on infrastructure. This port (interface + Symbol
 * token) is the only contract the application layer and domain layer see.
 * The Prisma adapter in infra/ implements it and is bound via the token in
 * AccessModule — swapped for a vi.fn() mock in unit tests.
 *
 * Naming convention:
 *   Token:   GRANT_REPOSITORY
 *   Port:    GrantRepository (interface)
 *   Adapter: PrismaGrantRepository (infra/prisma-grant.repository.ts)
 *   Binding: { provide: GRANT_REPOSITORY, useClass: PrismaGrantRepository }
 */
import type { AccessGrant } from './grant';

/** Injection token — Symbol ensures global uniqueness across the process. */
export const GRANT_REPOSITORY = Symbol('GRANT_REPOSITORY');

export interface GrantRepository {
  /**
   * Persist the aggregate. Throws GrantAlreadyExistsError when the composite
   * unique constraint (userId, targetKind, libraryId, courseId) is violated
   * (Prisma P2002 → translated in the adapter).
   */
  save(grant: AccessGrant): Promise<void>;

  /** Return the aggregate by id, or null when not found. */
  findById(id: string): Promise<AccessGrant | null>;

  /** Return all grants for a given user, ordered by createdAt desc. */
  findManyByUser(userId: string): Promise<AccessGrant[]>;

  /**
   * Delete the grant by id. Returns true when deleted, false when not found
   * (the handler converts false → GrantNotFoundError so no Prisma leaks out).
   */
  delete(id: string): Promise<boolean>;
}
