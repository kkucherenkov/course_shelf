import type { MeDto } from '@app/api-client-ts';

export const ME_PORT = Symbol('ME_PORT');

export interface MePort {
  /**
   * Returns the user's public profile, or null when no row matches the id.
   * In practice the session guard guarantees the user exists; null is only
   * reached in race conditions (e.g. account deleted between requests).
   */
  findById(userId: string): Promise<MeDto | null>;

  /**
   * Applies the patch to the user's profile and returns the updated shape.
   * Returns null when no row matches (maps to 404 in the handler).
   */
  updateProfile(userId: string, patch: { displayName?: string | null }): Promise<MeDto | null>;

  /**
   * Deletes every session row for `userId` except the row identified by
   * `currentSessionId`, keeping the caller's own session alive.
   */
  revokeOtherSessions(userId: string, currentSessionId: string): Promise<void>;
}
