/**
 * WHY this file exists:
 * Concrete implementation of AuthorizationService backed by GrantRepository +
 * an in-process LRU cache. Lives in src/common/access/ so every bounded context
 * can depend on the token without crossing the boundaries/element-types boundary.
 *
 * Cache strategy:
 *   - Key:  `${userId}|${resource.kind}|${resource.id}`
 *   - TTL:  AppConfig.authorizationCache.ttlMs (default 30 000 ms)
 *   - Size: AppConfig.authorizationCache.maxEntries (default 1 000)
 *   - invalidate(userId): evicts all keys that start with `${userId}|`
 *
 * Grant implication rules (v1):
 *   library → access to all child courses AND all child lessons
 *   course  → access to all child lessons
 *   lesson  → no implicit children
 *
 * For 'course' resources:
 *   canSee = TRUE if any of:
 *     (a) direct course grant for resource.id
 *     (b) library grant for resource.libraryId (when provided by caller)
 *
 * For 'lesson' resources:
 *   canSee = TRUE if any of:
 *     (a) course grant for resource.courseId
 *     (b) library grant for resource.libraryId (when provided by caller)
 *
 * v1 note: callers are responsible for passing libraryId when they need
 * library-implication for course/lesson resources. The service does NOT
 * resolve the parent library independently to avoid an extra DB round-trip.
 */
import { Inject, Injectable } from '@nestjs/common';
import { LRUCache } from 'lru-cache';

import { AppConfig } from '../config/app-config';
import { GRANT_REPOSITORY } from '../../modules/access/domain/grant/grant.repository';

import type { GrantRepository } from '../../modules/access/domain/grant/grant.repository';
import type { AccessGrant } from '../../modules/access/domain/grant/grant';
import type {
  AuthorizationActor,
  AuthorizationResource,
  AuthorizationService,
} from './authorization.service';

@Injectable()
export class LruAuthorizationService implements AuthorizationService {
  private readonly cache: LRUCache<string, boolean>;

  constructor(
    @Inject(GRANT_REPOSITORY) private readonly grantRepo: GrantRepository,
    private readonly config: AppConfig,
  ) {
    const { ttlMs, maxEntries } = this.config.authorizationCache;
    this.cache = new LRUCache<string, boolean>({
      max: maxEntries,
      ttl: ttlMs,
    });
  }

  async canSee(actor: AuthorizationActor, resource: AuthorizationResource): Promise<boolean> {
    // Admins always see everything — no cache needed for this fast path.
    if (actor.role === 'admin') {
      return true;
    }

    const cacheKey = `${actor.id}|${resource.kind}|${resource.id}`;
    const cached = this.cache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const grants = await this.grantRepo.findManyByUser(actor.id);
    const result = this.evaluate(grants, resource);

    this.cache.set(cacheKey, result);
    return result;
  }

  async listAccessibleLibraryIds(actor: AuthorizationActor): Promise<string[] | null> {
    // Admins see everything — no filter needed.
    if (actor.role === 'admin') {
      return null;
    }

    const grants = await this.grantRepo.findManyByUser(actor.id);
    const libraryIds = grants
      .filter((g) => g.target.kind === 'library')
      .map((g) => {
        // target.kind === 'library' guarantees libraryId is present — the grant
        // aggregate enforces this invariant at creation time.
        const target = g.target as { kind: 'library'; libraryId: string };
        return target.libraryId;
      });

    return libraryIds;
  }

  invalidate(userId: string): void {
    const prefix = `${userId}|`;
    // LRUCache v10 exposes keys() as an iterator — collect then evict.
    const toDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        toDelete.push(key);
      }
    }
    for (const key of toDelete) {
      this.cache.delete(key);
    }
  }

  // ── private ──────────────────────────────────────────────────────────────────

  private evaluate(grants: AccessGrant[], resource: AuthorizationResource): boolean {
    switch (resource.kind) {
      case 'library': {
        return grants.some(
          (g) => g.target.kind === 'library' && g.target.libraryId === resource.id,
        );
      }

      case 'course': {
        return grants.some((g) => {
          if (g.target.kind === 'library' && resource.libraryId) {
            return g.target.libraryId === resource.libraryId;
          }
          if (g.target.kind === 'course') {
            return g.target.courseId === resource.id;
          }
          return false;
        });
      }

      case 'lesson': {
        return grants.some((g) => {
          if (g.target.kind === 'library' && resource.libraryId) {
            return g.target.libraryId === resource.libraryId;
          }
          if (g.target.kind === 'course') {
            return g.target.courseId === resource.courseId;
          }
          return false;
        });
      }
    }
  }
}
