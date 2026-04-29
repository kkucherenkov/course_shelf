/**
 * WHY this file exists:
 * Domain code must not depend on infrastructure. This port (interface + Symbol
 * token) is the only contract the application layer and domain layer see.
 * The Prisma adapter in infra/ implements it and is bound via the token in
 * CatalogModule — swapped for a vi.fn() mock in unit tests.
 *
 * Naming convention:
 *   Token:   LIBRARY_REPOSITORY
 *   Port:    LibraryRepository (interface)
 *   Adapter: PrismaLibraryRepository (infra/prisma-library.repository.ts)
 *   Binding: { provide: LIBRARY_REPOSITORY, useClass: PrismaLibraryRepository }
 */
import type { Library } from './library';

/** Injection token — Symbol ensures global uniqueness across the process. */
export const LIBRARY_REPOSITORY = Symbol('LIBRARY_REPOSITORY');

export interface LibraryRepository {
  /**
   * Persist the aggregate. Throws LibraryAlreadyExistsError when the rootPath
   * unique constraint is violated (Prisma P2002 → translated in the adapter).
   */
  save(library: Library): Promise<void>;

  /** Return the aggregate by id, or null when not found. */
  findById(id: string): Promise<Library | null>;

  /** Return all libraries, ordered by name. */
  findAll(): Promise<Library[]>;

  /**
   * Bulk fetch libraries by a set of ids. Returns only the libraries that exist.
   * Order is unspecified — callers must index by id if order matters.
   * Added for the continue-watching query handler (E10-F01-S01).
   */
  findByIds(ids: string[]): Promise<Library[]>;

  /**
   * Apply a partial update to the library row.
   * Returns the updated aggregate, or null when no library with that id exists.
   * Only mutates the fields that are present in patch (currently only `name`).
   */
  update(id: string, patch: { name?: string }): Promise<Library | null>;

  /**
   * Delete the library and all dependent rows in a single transaction.
   * Returns true on success, or false when no library with that id exists.
   * Cascade order: lessonProgress → bookmark → note → courseProgressReadModel
   *   → accessGrant → scan → course → library.
   */
  removeWithCascade(id: string): Promise<boolean>;
}
