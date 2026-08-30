/**
 * WHY this file exists:
 * Port (interface + Symbol token) for Transcription persistence, shaped exactly
 * like `scan.repository.ts` — same lifecycle, same questions asked of it.
 *
 * `findById` carries a second job here that the scan port never needed: the walk
 * re-reads its own run between lessons to notice a cancel request. That is the
 * whole cancellation mechanism, so the method has to stay cheap.
 *
 * Naming convention:
 *   Token:   TRANSCRIPTION_REPOSITORY
 *   Port:    TranscriptionRepository (interface)
 *   Adapter: PrismaTranscriptionRepository (infra/prisma-transcription.repository.ts)
 *   Binding: { provide: TRANSCRIPTION_REPOSITORY, useClass: PrismaTranscriptionRepository }
 */
import type { Transcription } from './transcription';

/** Injection token — Symbol ensures global uniqueness across the process. */
export const TRANSCRIPTION_REPOSITORY = Symbol('TRANSCRIPTION_REPOSITORY');

export interface TranscriptionRepository {
  /** Persist (create or update) a run with its error records. */
  save(transcription: Transcription): Promise<void>;

  /** Return a run by its id, or null. */
  findById(id: string): Promise<Transcription | null>;

  /** The most recently started run for a library, whatever its status. */
  findLatestForLibrary(libraryId: string): Promise<Transcription | null>;

  /**
   * The currently-running run for a library, or null. Enforces the
   * "at most one running transcription per library" invariant.
   */
  findRunningForLibrary(libraryId: string): Promise<Transcription | null>;

  /** History for one library, newest first, capped at `limit`. */
  listForLibrary(libraryId: string, limit: number): Promise<Transcription[]>;
}
