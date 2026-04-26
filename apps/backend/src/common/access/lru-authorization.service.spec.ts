/**
 * Unit tests for LruAuthorizationService.
 * Covers: admin short-circuit, library grant hit, course-via-library implication,
 * lesson-via-course implication, miss path, cache TTL (via LRU ttl), and
 * invalidate-drops-entries behaviour.
 *
 * The AppConfig mock returns a short TTL (100 ms) to keep the cache-expiry
 * test fast without needing to mock Date globally.
 */
import { describe, expect, it, vi } from 'vitest';

import { LruAuthorizationService } from './lru-authorization.service';
import { AccessGrant } from '../../modules/access/domain/grant/grant';

import type { GrantRepository } from '../../modules/access/domain/grant/grant.repository';
import type { AppConfig } from '../config/app-config';
import type { GrantId } from '../../modules/access/domain/grant/grant';
import type { AuthorizationActor, AuthorizationResource } from './authorization.service';

// ── helpers ────────────────────────────────────────────────────────────────────

function makeGrant(
  userId: string,
  target: { kind: 'library'; libraryId: string } | { kind: 'course'; courseId: string },
): AccessGrant {
  return AccessGrant.reconstitute({
    id: `grant-${Math.random()}` as GrantId,
    userId,
    target,
    level: 'READ',
    createdAt: new Date(),
  });
}

function makeRepo(grants: AccessGrant[] = []): GrantRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findManyByUser: vi.fn().mockResolvedValue(grants),
    delete: vi.fn(),
  };
}

function makeConfig(ttlMs = 30_000): AppConfig {
  return {
    authorizationCache: { ttlMs, maxEntries: 1000 },
  } as unknown as AppConfig;
}

const adminActor: AuthorizationActor = { id: 'admin-1', role: 'admin' };
const userActor: AuthorizationActor = { id: 'user-1', role: 'user' };

// ── tests ──────────────────────────────────────────────────────────────────────

describe('LruAuthorizationService', () => {
  describe('admin short-circuit', () => {
    it('returns true for admins without querying the repository', async () => {
      const repo = makeRepo([]);
      const svc = new LruAuthorizationService(repo, makeConfig());

      const result = await svc.canSee(adminActor, {
        kind: 'library',
        id: 'lib-1' as never,
      });

      expect(result).toBe(true);
      expect(repo.findManyByUser).not.toHaveBeenCalled();
    });
  });

  describe('library grant', () => {
    it('returns true when a library grant matches the resource id', async () => {
      const grant = makeGrant('user-1', { kind: 'library', libraryId: 'lib-1' });
      const repo = makeRepo([grant]);
      const svc = new LruAuthorizationService(repo, makeConfig());

      const result = await svc.canSee(userActor, { kind: 'library', id: 'lib-1' as never });

      expect(result).toBe(true);
    });

    it('returns false when no library grant matches', async () => {
      const grant = makeGrant('user-1', { kind: 'library', libraryId: 'lib-2' });
      const repo = makeRepo([grant]);
      const svc = new LruAuthorizationService(repo, makeConfig());

      const result = await svc.canSee(userActor, { kind: 'library', id: 'lib-1' as never });

      expect(result).toBe(false);
    });
  });

  describe('course-via-library implication', () => {
    it('returns true for a course when the user has a library grant covering it', async () => {
      const grant = makeGrant('user-1', { kind: 'library', libraryId: 'lib-1' });
      const repo = makeRepo([grant]);
      const svc = new LruAuthorizationService(repo, makeConfig());

      const resource: AuthorizationResource = {
        kind: 'course',
        id: 'course-1' as never,
        libraryId: 'lib-1' as never,
      };

      const result = await svc.canSee(userActor, resource);

      expect(result).toBe(true);
    });

    it('returns true for a course when user has a direct course grant', async () => {
      const grant = makeGrant('user-1', { kind: 'course', courseId: 'course-1' });
      const repo = makeRepo([grant]);
      const svc = new LruAuthorizationService(repo, makeConfig());

      const resource: AuthorizationResource = {
        kind: 'course',
        id: 'course-1' as never,
      };

      const result = await svc.canSee(userActor, resource);

      expect(result).toBe(true);
    });

    it('returns false for a course when libraryId is not provided and no course grant exists', async () => {
      const grant = makeGrant('user-1', { kind: 'library', libraryId: 'lib-1' });
      const repo = makeRepo([grant]);
      const svc = new LruAuthorizationService(repo, makeConfig());

      // libraryId not provided — implication cannot be evaluated
      const resource: AuthorizationResource = {
        kind: 'course',
        id: 'course-1' as never,
      };

      const result = await svc.canSee(userActor, resource);

      expect(result).toBe(false);
    });
  });

  describe('lesson-via-course implication', () => {
    it('returns true for a lesson when user has a course grant for its parent course', async () => {
      const grant = makeGrant('user-1', { kind: 'course', courseId: 'course-1' });
      const repo = makeRepo([grant]);
      const svc = new LruAuthorizationService(repo, makeConfig());

      const resource: AuthorizationResource = {
        kind: 'lesson',
        id: 'lesson-1' as never,
        courseId: 'course-1' as never,
      };

      const result = await svc.canSee(userActor, resource);

      expect(result).toBe(true);
    });

    it('returns true for a lesson when user has a library grant covering its library', async () => {
      const grant = makeGrant('user-1', { kind: 'library', libraryId: 'lib-1' });
      const repo = makeRepo([grant]);
      const svc = new LruAuthorizationService(repo, makeConfig());

      const resource: AuthorizationResource = {
        kind: 'lesson',
        id: 'lesson-1' as never,
        courseId: 'course-1' as never,
        libraryId: 'lib-1' as never,
      };

      const result = await svc.canSee(userActor, resource);

      expect(result).toBe(true);
    });
  });

  describe('miss path', () => {
    it('returns false when user has no grants at all', async () => {
      const repo = makeRepo([]);
      const svc = new LruAuthorizationService(repo, makeConfig());

      const result = await svc.canSee(userActor, { kind: 'library', id: 'lib-1' as never });

      expect(result).toBe(false);
    });
  });

  describe('cache behaviour', () => {
    it('calls findManyByUser once for the same (userId, resource) pair', async () => {
      const grant = makeGrant('user-1', { kind: 'library', libraryId: 'lib-1' });
      const repo = makeRepo([grant]);
      const svc = new LruAuthorizationService(repo, makeConfig());
      const resource: AuthorizationResource = { kind: 'library', id: 'lib-1' as never };

      await svc.canSee(userActor, resource);
      await svc.canSee(userActor, resource);

      expect(repo.findManyByUser).toHaveBeenCalledOnce();
    });

    it('re-queries after cache TTL expires', async () => {
      // Use a 50 ms TTL so we can wait out the expiry in the test.
      const repo = makeRepo([]);
      const svc = new LruAuthorizationService(repo, makeConfig(50));
      const resource: AuthorizationResource = { kind: 'library', id: 'lib-1' as never };

      await svc.canSee(userActor, resource);

      // Wait for TTL to elapse.
      await new Promise((resolve) => setTimeout(resolve, 80));

      await svc.canSee(userActor, resource);

      expect(repo.findManyByUser).toHaveBeenCalledTimes(2);
    });

    it('invalidate drops all entries for the userId and forces a re-query', async () => {
      const grant = makeGrant('user-1', { kind: 'library', libraryId: 'lib-1' });
      const repo = makeRepo([grant]);
      const svc = new LruAuthorizationService(repo, makeConfig());
      const resource: AuthorizationResource = { kind: 'library', id: 'lib-1' as never };

      await svc.canSee(userActor, resource);
      expect(repo.findManyByUser).toHaveBeenCalledOnce();

      svc.invalidate('user-1');

      await svc.canSee(userActor, resource);
      expect(repo.findManyByUser).toHaveBeenCalledTimes(2);
    });

    it('invalidate does not drop entries for other users', async () => {
      const otherActor: AuthorizationActor = { id: 'user-2', role: 'user' };
      const repo = makeRepo([]);
      const svc = new LruAuthorizationService(repo, makeConfig());
      const resource: AuthorizationResource = { kind: 'library', id: 'lib-1' as never };

      // Warm up cache for user-2
      await svc.canSee(otherActor, resource);
      expect(repo.findManyByUser).toHaveBeenCalledOnce();

      // Invalidate only user-1 — user-2's cache should remain
      svc.invalidate('user-1');

      await svc.canSee(otherActor, resource);
      // Still only one call; user-2's cache is intact
      expect(repo.findManyByUser).toHaveBeenCalledOnce();
    });
  });
});
