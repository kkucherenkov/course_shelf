# Active tasks

## T-2026-04-26-014 — AuthorizationService consumed by Catalog & Streaming (E07-F01-S02)

- Created: 2026-04-26
- Owner: claude
- Spec: `docs/roadmap/tasks/E07-F01-S02.md` — single `canSee(user, resource)` reused everywhere. No new HTTP endpoints; pure infra glue. Unblocks E08-F01-S01 (signed stream tokens refuse to mint for unauthorized lessons) and tightens Catalog list/get behaviour for non-admins.
- Goal: a single read-only authorization service that any module can ask "can this user see this resource?". Catalog uses it to filter `GET /libraries` and `GET /libraries/{id}` for non-admins; Streaming uses it (in E08) before issuing a signed stream token.
- Acceptance:
  - `AuthorizationService` lives where any module can depend on its interface without breaking the boundaries config — concretely under `apps/backend/src/common/access/` (interface + token + impl + cache wrapper). Module code consumes the Symbol token, never a sibling module's source file.
  - API: `canSee(user, resource): Promise<boolean>` where `resource` is a discriminated union `{ kind: 'library', id: LibraryId } | { kind: 'course', id: CourseId } | { kind: 'lesson', id: LessonId, courseId: CourseId }`. Admins always get `true`. Non-admin → `true` iff a matching `AccessGrant` exists (library grants imply access to all child courses/lessons; course grants imply access to all child lessons).
  - In-memory LRU cache keyed by `(userId, resource.kind, resource.id)` with a short TTL (≤30s) — TTL configurable via `AppConfig`. Cache invalidation on grant register/revoke (the bus emits an event, the service subscribes). Default sizes: 1000 entries, 30s TTL.
  - `ListLibrariesQuery` updated: non-admin sessions get only libraries they have a READ grant for; admins get all. `GetLibraryQuery` throws `PermissionDenied` for non-admin without a grant.
  - Tests: unit tests for `canSee()` covering admin shortcut, library grant, course-via-library implication, lesson-via-course implication, miss path. Cache TTL test (Date mocking) + invalidation-on-grant-event test. Updated `ListLibrariesHandler` and `GetLibraryHandler` specs cover non-admin filter / 403.
  - Quality gates: `pnpm --filter @app/backend lint && typecheck && test` clean.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Tests: see Acceptance.
- Sub-steps:
  - [x] design module layout that respects the `eslint-plugin-boundaries` rule (Catalog cannot import Access source). Recommended: `src/common/access/` carries the public interface + Symbol token + LRU impl; the impl reads grants via the existing `GRANT_REPOSITORY` port (also moved to common, or surfaced via a small port re-export — backend-engineer's call).
  - [x] write `AuthorizationService` interface + `AUTHORIZATION_SERVICE` Symbol token
  - [x] implementation: `LruAuthorizationService` wrapping a grant lookup; LRU library `lru-cache` (already a transitive dep — verify; otherwise add)
  - [x] cache invalidation: subscribe to `GrantRegisteredEvent` / `GrantRevokedEvent` (emit them from the existing handlers) or expose an explicit `invalidate(userId)` and call it from those handlers
  - [x] wire into `ListLibrariesHandler` and `GetLibraryHandler` — non-admin filter / 403
  - [x] tests: 6+ for the service itself, 2 for the cache, plus updated handler specs
  - [x] backend lint / typecheck / test all clean; prettier on touched files
  - [x] flip card to ✅ Done; tick TODO; bump progress 10 / 115 → 11 / 115; archive T-014
- Status: done
