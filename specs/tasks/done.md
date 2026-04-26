# Done tasks

_Archive of shipped tasks. Never delete entries — cancelled tasks go here with reason._

## T-2026-04-26-023 — Bookmarks endpoints (E09-F02-S01)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: three commits on `feat/bookmarks`: `cdd36b7` (spec), `195ee04` (codegen), `421881d` (impl). Backend tests 547/547; lint + typecheck clean.
- Owner: claude
- Goal: per-user, per-lesson timestamped bookmarks; owner-only mutations + admin moderation bypass.
- Sub-steps:
  - [x] OpenAPI: list / create / update / delete + 4 schemas
  - [x] TS + Dart codegen
  - [x] Prisma `Bookmark` + manual migration SQL
  - [x] domain — aggregate (trim + 1–200 label, at-least-one-field, label:null clears) + repo + 4 errors
  - [x] Prisma adapter; ordering by positionSeconds ASC; null/undefined label mapping
  - [x] 4 handlers; admin bypass symmetric on UPDATE + DELETE
  - [x] BookmarksController in LearningModule
  - [x] ~30 new tests; 547/547 total

## T-2026-04-26-022 — CourseProgressProjector + continue-watching endpoint (E10-F01-S01)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: single impl commit `3c0e35e` on `feat/progress-projector`. 47 files changed, 2456 insertions(+). Backend tests 486/486; lint + typecheck clean.
- Owner: claude
- PR: feat/progress-projector → main

## T-2026-04-26-021 — LessonProgress aggregate + record endpoint (E09-F01-S01)

- Created: 2026-04-26
- Completed: 2026-04-27
- Result: single impl commit on `feat/lesson-progress`. Backend tests 441/441 (+34 new); lint + typecheck clean.
- Owner: claude

## T-2026-04-26-020 — `GET /stream/lessons/{id}` with HTTP Range support (E08-F02-S01)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: single impl commit `1751817` on `feat/stream-range`. Backend tests 407/407; lint + typecheck clean.
- Owner: claude
- Goal: standards-compliant byte-range video delivery; full 200/206/416/400/401/404/500 branch coverage; path traversal provably impossible.

## T-2026-04-26-019 — Short-lived signed stream tokens (E08-F01-S01)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: three commits on `feat/stream-tokens`: `cf645ae` (spec), `b0486ae` (codegen), `55fd5b4` (impl). Backend tests 375/375; lint + typecheck clean.
- Owner: claude
- Goal: `GET /api/v1/lessons/{id}/stream-url` mints an opaque HMAC-signed token bound to `(userId, lessonId, expiresAt)`; verify in O(1) with no DB lookup.
- Spec diff: `packages/specs/openapi/openapi.yaml` — `GET /lessons/{id}/stream-url` + `StreamUrlDto`. New top-level `Streaming` tag. Spec version 0.6.0 → 0.7.0.
- Codegen impact: yes — TS + Dart regenerated.
- Design impact: none.
- Sub-steps:
  - [x] OpenAPI: `issueStreamUrl` + `StreamUrlDto`
  - [x] TS + Dart codegen
  - [x] new module `apps/backend/src/modules/streaming/`; `StreamingController` registered in `app.module.ts`
  - [x] domain — `StreamTokenSigner` (HS256 over `header.payload.sig`; subkey HKDF-derived from `BETTER_AUTH_SECRET` with info `"courseshelf:stream-token:v1"`; cached after first call)
  - [x] errors — `StreamTokenInvalidError` base + Tampered / Expired / LessonMismatch / Malformed subclasses
  - [x] `IssueStreamTokenQuery` + handler — lesson load → parent-course walk → `AuthorizationService.canSee` → sign
  - [x] `AppConfig` extended with `streamTokenTtlSeconds` (default 900) and `streamTokenHkdfInfo` (default `"courseshelf:stream-token:v1"`)
  - [x] cross-module wiring via `apps/backend/src/common/catalog-tokens/` — re-exports `LESSON_REPOSITORY` / `COURSE_REPOSITORY` / `LessonNotFoundError` plus `CatalogRepositoriesModule` that binds the Prisma adapters; boundaries-config compliant
  - [x] 20+ new tests (signer round-trip + tamper + expiry + mismatch + malformed; handler admin / non-admin / missing-parent paths)

## T-2026-04-26-018 — Lesson + Material + Subtitle read model (E06-F03-S02)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: three commits on `feat/lesson-material`: `e36b5ed` (spec), `f44ce5a` (codegen), `1b4533f` (impl). Backend tests 355/355; lint + typecheck clean.
- Owner: claude
- Goal: `GET /api/v1/lessons/{id}` returns lesson metadata + sidecar materials and subtitles (language guessed from filename suffix); raw paths never leak in the DTO (NFR-S-01).
- Spec diff: `packages/specs/openapi/openapi.yaml` — `GET /lessons/{id}` + `LessonDto` / `MaterialDto` / `MaterialKind` / `SubtitleDto` / `LessonProgress`. Spec version 0.5.0 → 0.6.0.
- Codegen impact: yes — TS + Dart regenerated.
- Design impact: none for v1.
- Sub-steps:
  - [x] OpenAPI: `getLesson` + DTOs
  - [x] TS + Dart codegen
  - [x] Prisma `Lesson` + `Material` + `Subtitle` + manual migration SQL
  - [x] domain layer at `apps/backend/src/modules/catalog/domain/lesson/`: aggregate, value objects, errors, repo port
  - [x] Prisma adapter (delete-and-recreate of children inside `$transaction`)
  - [x] `stem-match.ts` utility — composite (`1.1 Title`/`1.1. Title`) + simple `01 - Title` prefixes; sidecars attach to videos instead of becoming `unsupported-extension` ScanErrors
  - [x] `RunScanHandler` upgraded — Scan aggregate gains `discoveredLessons[]` (in-memory only); Neovim "mass ScanError" pattern produces zero errors for matched companions
  - [x] `GetLessonQuery` + handler with `AuthorizationService.canSee` grant filter; DTO mapper strips raw paths
  - [x] `LessonsController` registered in `CatalogModule`
  - [x] ~30 new tests (value objects, aggregate, stem-match, handler, repo, scan-regression); 355 / 355 total

## T-2026-04-26-017 — Course aggregate + slug uniqueness + section ordering (E06-F03-S01)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: single impl commit on `feat/course-aggregate`. 73 new tests (273 total); lint/typecheck clean.
- Owner: claude
- Goal: Course aggregate keyed by (libraryId, slug) with ordered Section list; three new endpoints; admin-only PATCH; grant-filtered GETs.
- Spec diff: yes — spec commit acd4b97; codegen commit bd2251f
- Codegen impact: yes (TS + Dart — separate commits already landed)
- Design impact: none
- Sub-steps:
  - [x] T-017-A: spec edit — acd4b97
  - [x] T-017-B: codegen — bd2251f
  - [x] T-017-C: Prisma Course + Section models + migration SQL
  - [x] T-017-D: domain — Slug/Title/Position VOs + Course aggregate + errors + repo port
  - [x] T-017-E: PrismaCourseRepository (delete-and-recreate sections in $transaction; P2002 → CourseSlugAlreadyTakenError)
  - [x] T-017-F: UpdateCourseMetadataHandler + ListCoursesHandler + GetCourseHandler
  - [x] T-017-G: CoursesController (SessionGuard on GETs, AdminGuard on PATCH); wired into CatalogModule
  - [x] T-017-H: 73 new tests (value objects + aggregate invariants + 3 handlers + repo roundtrip)
  - [x] T-017-I: lint/typecheck/test/prettier all clean

## T-2026-04-26-016 — extend scan parser: composite ordinals + word-prefixed sections

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: single commit on `feat/scan-parser-extended` — `901aa83`. Backend tests 200/200; lint + typecheck clean.
- Owner: claude
- Goal: every realistic Russian / Udemy-style course folder layout in `docs/data/courses/` is recognised with clean section/lesson labels and correct ordinals.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Sub-steps:
  - [x] tier-3 `COMPOSITE_LESSON_RE` for `N.M Title` and `N.M` lessons (`2.5 Установка…` → `sectionOrdinal=2, ordinal=5, label="Установка на Windows"`)
  - [x] tier-2 `WORD_PREFIXED_RE` (`\p{L}+ N - Title`) for Russian / English module folders (`Модуль 2 - Настройки окружения` → `ordinal=2, label="Настройки окружения"`)
  - [x] `RunScanHandler` runs `parseFolderName` on section folders so `sectionTitles` are clean labels
  - [x] +9 spec cases covering composite + word-prefixed forms; existing 191 tests still green
  - [x] sample `course.json` for `videosmile - Super Figma` (gitignored — manual-verification helper for lessons whose file names are just `N.M.mp4` with no inline title)

## T-2026-04-26-015 — Scan aggregate, FsAdapter, incremental scan (E06-F02-S01)

- Created: 2026-04-25
- Completed: 2026-04-26
- Result: single commit on `feat/library-scan`. Scan aggregate + FsAdapter port + NodeFsAdapter + incremental (mtime,size) detection + course.json v1 parser + folder-name parser + RunScanHandler (fire-and-forget walk) + GetLatestScanHandler + ScansController + PrismaScanRepository + migration. 191 tests green; lint/typecheck clean.
- Owner: claude

## T-2026-04-26-014 — AuthorizationService consumed by Catalog & Streaming (E07-F01-S02)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: single commit on `feat/authorization-service`. `CommonAccessModule` in `src/common/access/` provides `LruAuthorizationService` behind `AUTHORIZATION_SERVICE` token. `ListLibrariesHandler` + `GetLibraryHandler` filter by grant. 127 tests green.
- Owner: claude

## T-2026-04-26-013 — AccessGrant aggregate + admin endpoints (E07-F01-S01)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: three commits on `feat/access-grant`: `d82bceb` (spec), `cba2ae2` (codegen), `9315210` (impl). Merged into main as a fast-forward chain.
- Owner: claude
- Goal: admin can grant a user READ access on a library or course, revoke it, and list a user's grants — gated by Better Auth session role check.
- Spec diff: `packages/specs/openapi/openapi.yaml` — three new paths + AccessGrantDto / AccessGrantListDto / RegisterGrantRequest / GrantTarget / GrantLevel. Spec version 0.2.0 → 0.3.0.
- Codegen impact: yes — TS + Dart regenerated end-to-end (Java prerequisite from T-012 in place).
- Design impact: none for v1.
- Sub-steps:
  - [x] OpenAPI: registerGrant / revokeGrant / listGrantsByUser + DTOs with discriminated GrantTarget
  - [x] TS + Dart codegen
  - [x] Prisma `AccessGrant` model + composite unique + migration SQL
  - [x] domain aggregate at `apps/backend/src/modules/access/domain/grant/` (mirror of catalog pattern)
  - [x] Prisma adapter; P2002 → `GrantAlreadyExistsError` (409)
  - [x] CQRS handlers: register, revoke, list-by-user, plus get-by-id for post-write re-read
  - [x] AccessController + AdminGuard + AccessModule registered in app.module.ts
  - [x] 32 new tests covering domain invariants, all four handlers, repo roundtrip, admin-guard. 102/102 passing.

## T-2026-04-26-012 — fix Dart codegen (openapi-generator-cli env conflict)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `a77c9af` (`git merge --ff-only` from `chore/dart-codegen-fix`).
- Owner: claude
- Goal: `pnpm spec:codegen` succeeds end-to-end so the Dart Dio client tracks the OpenAPI spec.
- Spec diff: none
- Codegen impact: yes — Dart leg now produces output for new endpoints
- Design impact: none
- Sub-steps:
  - [x] reproduced the failure: actual root cause is "Unable to locate a Java Runtime" (JVM missing on macOS), not a NestJS dep wrapper conflict — the earlier diagnosis was wrong
  - [x] installed OpenJDK 21 LTS via Homebrew (`brew install openjdk@21`) and set `JAVA_HOME`
  - [x] re-ran `pnpm spec:codegen` end-to-end — all four legs (openapi-typescript, hey-api/openapi-ts, openapi-generator-cli dart-dio, asyncapi) succeed
  - [x] committed regenerated Dart artefacts: CatalogApi + LibraryDto / LibraryListDto / RegisterLibraryRequest + ApiDoc markdown + test scaffolds
  - [x] documented the Java prerequisite in `docs/troubleshooting.md` (Homebrew install, JAVA_HOME export, Linux/Windows hints, CI `actions/setup-java@v4`)

## T-2026-04-26-011 — fix workspace tsc regression in generated `@app/api-client-ts`

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `03a6030` (`git merge --ff-only` from `chore/api-client-ts-strictness`).
- Owner: claude
- Goal: workspace `tsc --noEmit` exits 0 across the repo after E06 codegen introduced strict-typing mismatches in the generated `@hey-api/openapi-ts` output.
- Spec diff: none
- Codegen impact: subtle — consumers now read `.d.ts` from `dist/`, not raw `.ts`
- Design impact: none
- Sub-steps:
  - [x] add `packages/api-client-ts/tsconfig.build.json` (emitDeclarationOnly to `dist/`)
  - [x] flip `package.json`: `types`, `exports.types` → `./dist/index.d.ts`; runtime `main` stays at raw `.ts` (Node `--experimental-strip-types`)
  - [x] root `prepare` and `spec:codegen` chain `pnpm --filter @app/api-client-ts build` so dist always exists after install / codegen
  - [x] verified: `pnpm -r typecheck` clean for all 8 TS projects; lint 0 errors / 53 vue-formatting warnings; backend tests 70/70

## T-2026-04-26-010 — Library aggregate + register/list/get endpoints (E06-F01-S01)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: three commits on `feat/library-aggregate`: `a710c5d` (spec), `be9ac44` (TS codegen), `0ef1607` (impl). Merged into main as a fast-forward chain.
- Owner: claude
- Goal: first real domain story for Catalog — Library aggregate with name + rootPath invariants, persisted via Prisma behind a domain-owned port, exposed at `POST/GET /api/v1/libraries{,/{id}}`.
- Spec diff: `packages/specs/openapi/openapi.yaml` (3 paths + 3 schemas, version bumped 0.1.0 → 0.2.0)
- Codegen impact: yes — TS regenerated; Dart skipped (env issue tracked separately)
- Design impact: none
- Sub-steps:
  - [x] OpenAPI: registerLibrary / listLibraries / getLibrary + LibraryDto / LibraryListDto / RegisterLibraryRequest
  - [x] TS codegen committed separately
  - [x] Library aggregate at `apps/backend/src/modules/catalog/domain/library/` (path corrected from `contexts/` to match the existing `modules/` pattern + boundaries)
  - [x] LibraryRepository port + Prisma adapter + mapper
  - [x] CQRS: RegisterLibraryCommand + ListLibrariesQuery + GetLibraryQuery handlers
  - [x] CatalogController + CatalogModule registered in app.module.ts
  - [x] Prisma `Library` model + migration SQL (authored manually because Docker was off; identical to what `prisma migrate dev --create-only` would produce)
  - [x] 5 spec files (aggregate, three handlers, repository roundtrip), 70/70 passing
  - [x] backend `lint` clean; workspace `tsc` regression in generated TS clients tracked as T-011 (not E06 fault)

## T-2026-04-26-009 — Prisma generate postinstall + close E01-F01-S02

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `a6006cf` (no GitHub PR; `git merge --ff-only` from `chore/prisma-generate`).
- Owner: claude
- Goal: workspace-wide `pnpm -r lint` finishes with zero errors on a clean clone right after `pnpm install`, without any manual codegen step.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Sub-steps:
  - [x] run `prisma generate` once to verify lint/typecheck go green
  - [x] wire `postinstall: prisma generate` in `apps/backend/package.json`
  - [x] verify postinstall fires on `pnpm install`
  - [x] confirm `pnpm -r lint` reports 0 errors workspace-wide
  - [x] flip E01-F01-S02 to ✅ Done; TODO progress 7 / 115 → 8 / 115

## T-2026-04-26-008 — stage the design bundle under docs/design/ + index + .gitattributes

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `5a57b7f` (no GitHub PR; `git merge --ff-only` from `chore/design-bundle-index`).
- Owner: claude
- Goal: a clone of the repository carries the full design handoff bundle alongside an index that names every project slug, its consumption story, and its file inventory; `.gitattributes` collapses prototype HTML/JSX/CSS as vendored.
- Spec diff: none
- Codegen impact: no
- Design impact: yes — bundle is now first-class repo content
- Sub-steps:
  - [x] move `docs/design/uploads/DESIGN_BRIEF.md` → `docs/design/DESIGN_BRIEF.md`
  - [x] write `docs/design/README.md` (index + handoff conventions)
  - [x] write `.gitattributes` (linguist-vendored on `docs/design/**` + linguist-generated on Dart tokens)
  - [x] flip `docs/roadmap/tasks/E00-F01-S01.md` to ✅ Done; tick TODO; bump progress to 7 / 115
  - [x] move T-006 / T-007 to `done.md`

## T-2026-04-26-007 — apps/backend/src/shared kernel: Branded IDs + DomainError + subclasses

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `a3a8449` (no GitHub PR; `git merge --ff-only` from `chore/backend-shared-kernel`).
- Owner: claude
- Goal: cross-context kernel for `apps/backend` — `Brand<T,B>`/`Id<B>` for compile-time identifier safety and `DomainError` (+ `InvariantViolation`/`NotFound`/`PermissionDenied`) for RFC 9457 mapping.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Sub-steps:
  - [x] write `apps/backend/src/shared/{branded-id,domain-error}.ts` + spec files
  - [x] move three `common/errors/domain-error` import sites to `shared/`
  - [x] remove `apps/backend/src/common/errors/`
  - [x] add `shared` element to `boundaries/elements`
  - [x] tests 43/43; lint/typecheck regress-free (only pre-existing prisma type errors remain)

## T-2026-04-26-006 — eslint-plugin-boundaries: enforce DDD bounded-context boundaries

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `6a17c89` (no GitHub PR; `git merge --ff-only` from `chore/eslint-boundaries`).
- Owner: claude
- Goal: a sibling-module import inside `apps/backend/src/modules/<X>` referencing `apps/backend/src/modules/<Y>` (Y ≠ X) fails lint with a readable, action-oriented message.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Sub-steps:
  - [x] add `eslint-plugin-boundaries` + `eslint-import-resolver-typescript` to `@app/eslint-config`
  - [x] wire `boundaries/elements` (module / common / i18n / app) and `boundaries/element-types` rule in `nest.mjs`
  - [x] mutation test confirmed cross-import rejection with the expected message
  - [x] left `boundaries/element-types` (v5 syntax) — v6 `boundaries/dependencies` rejected the migrated config; deferred follow-up

## T-2026-04-26-005 — archive sweep: mark already-shipped roadmap stories as Done

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `c19c247` (no GitHub PR; `git merge --ff-only` from `chore/roadmap-archive-sweep`).
- Owner: claude
- Goal: walk every `docs/roadmap/tasks/E*.md` card, flip status to ✅ Done where the story's acceptance is already satisfied by the current codebase. Conservative — borderline left at ⬜.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Sub-steps:
  - [x] inventory: 6 Done (E01-F01-S01, E02-F01-S02, E02-F02-S03, E03-F01-S01, E12-F01-S01, E22-F01-S02), 5 deliberate borderline
  - [x] update each Done card: status line, sub-step boxes, Notes block
  - [x] tick matching boxes in `docs/roadmap/TODO.md` and update progress counter (`6 / 115`)
  - [x] sanity check on counts
  - [x] prettier on touched markdown

## T-2026-04-26-004 — design-token cross-source audit (PR 3b)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `5189c92` (no GitHub PR; `git merge --ff-only` from `chore/design-tokens-audit`).
- Owner: claude
- Goal: cross-source audit script comparing `docs/design/shared/tokens.json` (palette) ↔ `specs/design/tokens/*.json` (DTCG); fails CI on hex drift. Plus closing residual scale drift (spacing/radius/font) surfaced by the first run.
- Spec diff: none
- Codegen impact: no
- Design impact: locked the brand alignment behind a script
- Sub-steps:
  - [x] write `packages/design-tokens/scripts/audit-cross-source.ts`
  - [x] add `audit:cross-source` script to `packages/design-tokens/package.json`
  - [x] close residual scale drift in `specs/design/tokens/{spacing,radius,typography}.json`
  - [x] mutation test confirmed audit fails on a flipped hex
  - [x] new `packages/design-tokens/README.md` documents both sources, alias layer, and audit's role
  - [x] lint, typecheck, audit (42 / 42) all green; 4 known prototype-internal drifts reported as ℹ

## T-2026-04-26-003 — brand-align design tokens + emit alias layer (PR 3a)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `9e0a851` (no GitHub PR; merge happened on the local clone via `git merge --ff-only` from `chore/design-tokens-canonical`).
- Owner: claude
- Goal: replace the blue-stub palette in `specs/design/tokens/*.json` with CourseShelf brand values and teach the emitter to publish prototype short CSS-var names (`--bg`, `--surface`, `--primary`, …) as `var()` aliases of the DTCG long names.
- Spec diff: none
- Codegen impact: no
- Design impact: yes — first time the code-stack carries actual CourseShelf brand
- Sub-steps:
  - [x] rewrite `specs/design/tokens/color.json` with brand hex values + new roles (text.loud, surface.skeleton{Base,Shine}, brand.accentSoft, status.{\*}Soft)
  - [x] rewrite `specs/design/tokens/shadow.json` with brand shadow tints
  - [x] tune `specs/design/tokens/motion.json` durations/easings to match prototype curves
  - [x] extend `emit-scss.ts` with themed alias section + static `--d-*`/`--e-*` aliases
  - [x] verified: short-name alias hex byte-equals prototype hex for all 22 color/shadow pairs (dark + light)
  - [x] lint --fix + typecheck clean

## T-2026-04-26-002 — rewrite roadmap story registry under the current stack

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `417bcfe` (no GitHub PR; merge happened on the local clone via `git merge --ff-only` from `chore/roadmap-collapse`).
- Owner: claude
- Goal: every story in `docs/roadmap/tools/generate.py` reflects the real codebase — `apps/backend`, generated `@app/api-client-{ts,dart}`, Nuxt UI v4 + Tailwind 4 + `@app/ui`, Centrifugo realtime, and the current `packages/design-tokens` pipeline.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Sub-steps:
  - [x] inventory legacy terms in the registry
  - [x] swap paths: `apps/api`→`apps/backend`; legacy contract packages → `packages/specs` + `@app/api-client-{ts,dart}`; `packages/shared-kernel`→`apps/backend/src/shared`
  - [x] swap web stack: Vuetify→Nuxt UI v4 + Tailwind 4 + `@app/ui`; remove `useApi/useAuth/useAuthToken` composables in favour of `@app/api-client-ts`
  - [x] swap design pipeline: Style Dictionary → current `packages/design-tokens` (`pnpm design:build`)
  - [x] swap commands: `pnpm gen:all` → `pnpm spec:codegen`
  - [x] add Centrifugo coverage: AsyncAPI sub-step in E02 + new epic E24
  - [x] dissolve E05 into E04-F01-S01
  - [x] keep Drift in E15 as-is
  - [x] run generator; 115 task files, zero warnings
  - [x] prettier on regenerated `.md`; sanity-grep clean

## T-2026-04-26-001 — collapse duplicate roadmap copies, retarget generator path

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `32dcead` (no GitHub PR; merge happened on the local clone via `git merge --ff-only` from `chore/roadmap-collapse`).
- Owner: claude
- Goal: one source of truth for the roadmap lives under `docs/roadmap/`; the generator writes there instead of a sandbox path.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Sub-steps:
  - [x] move `docs/tasks/` → `docs/roadmap/tasks/`
  - [x] remove `docs/{README,ROADMAP,TODO}.md` (untracked duplicates)
  - [x] write `docs/roadmap/README.md` (workflow points at `specs/tasks/active.md`; `packages/api-contracts` → `packages/specs/openapi/openapi.yaml`; `pnpm gen:all` → `pnpm spec:codegen`)
  - [x] retarget `docs/roadmap/tools/generate.py`: `OUT` derived from `__file__`; `write_readme()`/`write_roadmap()` mention the script at its real path
  - [x] prettier on touched `.md`
