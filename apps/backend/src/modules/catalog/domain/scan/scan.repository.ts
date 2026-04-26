/**
 * WHY this file exists:
 * Port (interface + Symbol token) for Scan persistence.
 * Application and domain layers depend only on this contract; the Prisma adapter
 * in infra/ implements it and is bound in CatalogModule.
 *
 * Naming convention:
 *   Token:   SCAN_REPOSITORY
 *   Port:    ScanRepository (interface)
 *   Adapter: PrismaScanRepository (infra/prisma-scan.repository.ts)
 *   Binding: { provide: SCAN_REPOSITORY, useClass: PrismaScanRepository }
 */
import type { Scan } from './scan';

/** Injection token — Symbol ensures global uniqueness across the process. */
export const SCAN_REPOSITORY = Symbol('SCAN_REPOSITORY');

export interface ScanRepository {
  /** Persist (create or update) a Scan aggregate with all its nested records. */
  save(scan: Scan): Promise<void>;

  /** Return a Scan by its id, or null if not found. */
  findById(id: string): Promise<Scan | null>;

  /**
   * Return the most recently started scan for the given library,
   * ordered by startedAt DESC. Returns null when no scan exists.
   */
  findLatestByLibrary(libraryId: string): Promise<Scan | null>;

  /**
   * Return the currently-running scan for the given library, or null.
   * Used by RunScanHandler to enforce the "at most one running scan" invariant.
   */
  findRunningByLibrary(libraryId: string): Promise<Scan | null>;
}
