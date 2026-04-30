/**
 * WHY this file exists:
 * A single cross-cutting read-only contract: "can this user see this resource?"
 * Any bounded context (Catalog, Streaming, …) depends on this interface + token
 * without importing from a sibling module, which would violate boundaries/element-types.
 *
 * LibraryId / CourseId / LessonId are branded aliases imported from the shared
 * kernel so type safety propagates across call sites.
 */
import type { Id } from '../../shared/branded-id';

/** Phantom-branded id aliases shared across all contexts that call canSee(). */
export type LibraryId = Id<'Library'>;
export type CourseId = Id<'Course'>;
export type LessonId = Id<'Lesson'>;

/**
 * Discriminated union describing the resource whose visibility we are checking.
 *
 * Callers that have the parent ids available SHOULD pass them — the implication
 * rules (library grant ⇒ access to all child courses/lessons) are evaluated
 * server-side only when parent ids are present.
 */
export type AuthorizationResource =
  | { kind: 'library'; id: LibraryId }
  | { kind: 'course'; id: CourseId; libraryId?: LibraryId }
  | { kind: 'lesson'; id: LessonId; courseId: CourseId; libraryId?: LibraryId };

/** Minimum user context that callers must supply to canSee(). */
export interface AuthorizationActor {
  id: string;
  role: string;
}

/**
 * Public contract. Implementations MUST be idempotent and MUST NOT throw for
 * "not found" resources — return false instead.
 */
export interface AuthorizationService {
  /**
   * Returns true iff the actor is allowed to see the resource.
   *
   * Admins always get true (short-circuit). Non-admins are evaluated against the
   * grant set persisted in the database (with a short-lived in-process LRU cache).
   */
  canSee(actor: AuthorizationActor, resource: AuthorizationResource): Promise<boolean>;

  /**
   * Return the set of library ids the actor has READ access to, or null if the
   * actor is an admin (meaning no filter should be applied — all libraries are
   * accessible). An empty array means the actor has no grants at all.
   *
   * Designed for bulk pre-filtering: callers pass the returned value as
   * `libraryIds` to repository search methods so the DB query itself is
   * already scoped to the accessible library set.
   */
  listAccessibleLibraryIds(actor: AuthorizationActor): Promise<string[] | null>;

  /**
   * Drop all cached decisions for the given userId. Call after any grant
   * register or revoke so the next canSee() reflects the new state.
   */
  invalidate(userId: string): void;
}

/** Nest DI injection token — Symbol prevents collisions with class-name strings. */
export const AUTHORIZATION_SERVICE = Symbol('AUTHORIZATION_SERVICE');
