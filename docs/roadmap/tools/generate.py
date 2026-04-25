#!/usr/bin/env python3
"""
Generate the CourseShelf roadmap as separate files:
- docs/roadmap/README.md          — entry point + workflow
- docs/roadmap/TODO.md             — flat checklist with deps
- docs/roadmap/ROADMAP.md          — Mermaid Gantt + sequencing notes
- docs/roadmap/tasks/<ID>.md       — one file per story (~115 files)

Outputs land in the directory that holds this script's parent folder
(i.e. `docs/roadmap/`), resolved from __file__ so the script can be run
from any working directory.

Run: python3 docs/roadmap/tools/generate.py
"""

from pathlib import Path
from textwrap import dedent
from datetime import datetime

OUT = Path(__file__).resolve().parents[1]
TASKS = OUT / "tasks"
TASKS.mkdir(parents=True, exist_ok=True)

# -------------------------------------------------------------------------- #
# Story registry                                                             #
# -------------------------------------------------------------------------- #
# Each story is a dict.  Required fields: id, title, deps, duration, stage,
# epic_title, feature_title.  Other fields are optional and default sensibly.

S = []  # the story list

def add(**kw):
    kw.setdefault("owner", "claude")
    kw.setdefault("stage", "A")
    kw.setdefault("duration", 1)
    kw.setdefault("deps", [])
    kw.setdefault("spec_refs", [])
    kw.setdefault("acceptance", [])
    kw.setdefault("substeps", [])
    kw.setdefault("spec_diff", "none")
    kw.setdefault("codegen", "no")
    kw.setdefault("design", "no")
    kw.setdefault("tests", "")
    kw.setdefault("notes", "")
    kw.setdefault("goal", kw["title"])
    S.append(kw)

# ============================================================ E00 ============
add(
    id="E00-F01-S01",
    epic="E00", epic_title="Stage the design bundle",
    feature="F01", feature_title="Place the bundle",
    title="Place the Claude Design bundle under docs/design/",
    duration=1, stage="A",
    spec_refs=["AGENTS.md §6.4", "DESIGN.md §2.10"],
    goal="The bundle ships as a first-class repo asset that PRs link.",
    acceptance=[
        "`docs/design/` mirrors the bundle layout (cs-foundations, cs-components, cs-web-*, cs-mobile-*, shared)",
        "`docs/design/README.md` is an index keyed by project slug, with a `Status` column and a `Consumed by` column pointing at story IDs",
        "The brief is preserved at `docs/design/DESIGN_BRIEF.md`",
    ],
    design="yes — establishes the canonical handoff path",
    tests="A CI job grep-checks that every UI story's `spec_refs` references an existing `docs/design/<slug>/` path",
    substeps=[
        "copy bundle contents into `docs/design/`",
        "move `uploads/DESIGN_BRIEF.md` to `docs/design/DESIGN_BRIEF.md`",
        "write `docs/design/README.md` with the prototype/status/consumed-by index",
        "add `.gitattributes` rule marking `docs/design/**/*.{html,jsx,css}` as `linguist-vendored=true`",
    ],
)

# ============================================================ E01 ============
add(
    id="E01-F01-S01",
    epic="E01", epic_title="Repository foundations",
    feature="F01", feature_title="Workspace bootstrap",
    title="Initialize pnpm + Turborepo workspace",
    duration=1, stage="A",
    spec_refs=["AGENTS.md §2", "AGENTS.md §3"],
    goal="A pnpm workspace that Turborepo can drive, with the directory layout from AGENTS.md §2 in place.",
    acceptance=[
        "`pnpm install` runs cleanly from a fresh clone",
        "`turbo run build --dry` lists the expected app + package targets",
        "Directory layout matches AGENTS.md §2",
    ],
    substeps=[
        'add root `package.json` with `"private": true`, pin pnpm version via `packageManager`',
        "add `pnpm-workspace.yaml` declaring `apps/*` and `packages/*`",
        "add `turbo.json` with `build`, `lint`, `typecheck`, `test`, `dev` pipelines",
        "create empty `apps/{api,web,mobile}` and `packages/{api-contracts,api-types,api-dtos-nest,design-tokens,shared-kernel,eslint-config,tsconfig}`",
        "add `.editorconfig`, root `.gitignore` (covers `node_modules`, `dist`, `.turbo`, `.env*`, `apps/mobile/build`)",
        "add `.nvmrc` pinning Node 20 LTS",
    ],
)

add(
    id="E01-F01-S02",
    epic="E01", epic_title="Repository foundations",
    feature="F01", feature_title="Workspace bootstrap",
    title="Shared TypeScript & lint configs",
    duration=1, stage="A",
    deps=["E01-F01-S01"],
    spec_refs=["AGENTS.md §7.1", "AGENTS.md §10"],
    goal="One source of truth for tsconfig presets and ESLint rules, including DDD layering boundaries.",
    acceptance=[
        "`packages/tsconfig` exports `base.json`, `node.json`, `nuxt.json`",
        "`packages/eslint-config` exports flat-config presets for node, vue, and a `boundaries` ruleset that forbids cross-context imports",
        "`pnpm lint` runs across the workspace and reports zero errors",
    ],
    tests="A deliberate cross-context import in a fixture file fails lint",
    substeps=[
        "add `tsconfig` package with strict + path-mapping presets",
        "add `eslint-config` with Prettier integration and `eslint-plugin-boundaries`",
        "encode the layering rules from AGENTS.md §7.2 (`domain` → only `domain`/`shared-kernel`, etc.) in the boundaries config",
        "add root `.eslintrc.cjs` and `.prettierrc`",
        "add `pnpm lint`, `pnpm typecheck`, `pnpm format` scripts at the root",
    ],
)

add(
    id="E01-F02-S01",
    epic="E01", epic_title="Repository foundations",
    feature="F02", feature_title="Environment & docker shell",
    title="Env scaffolding and dev docker-compose",
    duration=1, stage="A",
    deps=["E01-F01-S01"],
    spec_refs=["AGENTS.md §4", "DESIGN.md §11"],
    goal="A documented env contract and a docker-compose that brings up a Postgres-mode dev environment when needed.",
    acceptance=[
        "`.env.example` lists all variables from AGENTS.md §4",
        "`docker compose -f docker/dev-postgres.yml up` boots a Postgres 16 container with persistent volume",
        "README documents both default (sqlite) and postgres flows",
    ],
    substeps=[
        "write `.env.example` with `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `WEB_ORIGIN`, `PORT`, `DB_PROVIDER`",
        "add `docker/dev-postgres.yml` and `docker/Dockerfile.api` (placeholder, multi-stage)",
        "add a top-level `README.md` quickstart",
    ],
)

# ============================================================ E02 ============
add(
    id="E02-F01-S01",
    epic="E02", epic_title="API contracts as the spine",
    feature="F01", feature_title="Spec authoring infrastructure",
    title="OpenAPI workspace, Spectral lint, bundle script",
    duration=1, stage="A",
    deps=["E01-F01-S02"],
    spec_refs=["AGENTS.md §6.3", "DESIGN.md §3"],
    goal="Author-and-bundle pipeline for `packages/api-contracts`.",
    acceptance=[
        "`packages/api-contracts/src/main.yaml` is the entry; uses `$ref` to pull in `paths/*` and `components/*`",
        "`pnpm contracts:lint` runs Spectral with our rules",
        "`pnpm contracts:bundle` writes `dist/openapi.json` (committed)",
    ],
    substeps=[
        "create `packages/api-contracts/src/main.yaml` with `info`, `servers`, empty `paths`/`components`",
        "add `.spectral.yaml` extending `spectral:oas` with rules: `oas3-1-only`, `examples-required`, `operation-tag-defined`, `path-kebab-case`",
        "write `scripts/bundle.ts` using `@redocly/openapi-core` to dereference and emit `dist/openapi.json`",
        "add npm scripts `contracts:lint`, `contracts:bundle`",
    ],
)

add(
    id="E02-F01-S02",
    epic="E02", epic_title="API contracts as the spine",
    feature="F01", feature_title="Spec authoring infrastructure",
    title="Reusable error schema, security scheme, version prefix",
    duration=1, stage="A",
    deps=["E02-F01-S01"],
    spec_refs=["DESIGN.md §3"],
    goal="Document the conventions every future path will reuse.",
    acceptance=[
        "`components/responses/Problem.yaml` conforms to RFC 7807",
        "`components/security/BearerAuth.yaml` declares `bearer` scheme",
        "All paths under `/api/v1` and explicitly tagged",
        "`/api/auth/*` is **not** in the spec (Better Auth governs)",
    ],
    spec_diff="components-only",
    substeps=[
        "add `components/responses/{Problem,NotFound,Unauthorized,Forbidden,Conflict}.yaml`",
        "add `components/security/BearerAuth.yaml` + global `security: [{BearerAuth: []}]`",
        "add a stub `paths/ping.yaml` returning `{ \"ok\": true }` with example",
        "document the convention in `packages/api-contracts/README.md`",
    ],
)

add(
    id="E02-F02-S01",
    epic="E02", epic_title="API contracts as the spine",
    feature="F02", feature_title="Codegen pipeline",
    title="Generate `@courseshelf/api-types` from the spec",
    duration=2, stage="A",
    deps=["E02-F01-S02"],
    spec_refs=["DESIGN.md §3.2"],
    goal="A consumable TS package with paths + schemas, exporting `paths`, `components`, and a `client` factory using `openapi-fetch`.",
    acceptance=[
        "`pnpm gen:api-types` writes generated files under `packages/api-types/src/generated/`",
        "`import { paths, components, createClient } from '@courseshelf/api-types'` works",
    ],
    codegen="yes — this *is* the codegen",
    substeps=[
        "add `openapi-typescript` as dev dep",
        "write `tools/scripts/gen-api-types.ts`",
        "export wrapper `createClient` configured for bearer-token injection (token getter callback)",
        "wire `gen:api-types` into `gen:all`",
    ],
)

add(
    id="E02-F02-S02",
    epic="E02", epic_title="API contracts as the spine",
    feature="F02", feature_title="Codegen pipeline",
    title="Generate `@courseshelf/api-dtos-nest` with class-validator",
    duration=2, stage="A",
    deps=["E02-F01-S02"],
    spec_refs=["AGENTS.md §7.3", "DESIGN.md §3.2"],
    goal="NestJS DTO classes with `class-validator` decorators inferred from schema constraints.",
    acceptance=[
        "`pnpm gen:api-dtos` writes classes under `packages/api-dtos-nest/src/generated/`",
        "Each class extends nothing and uses only `class-validator` and `class-transformer` decorators",
        "A unit test instantiates a generated DTO from a fixture and `validateSync` returns expected violations",
    ],
    codegen="yes",
    substeps=[
        "write a custom AST emitter (chosen over `openapi-generator-cli` to minimize drift)",
        "write a post-processor that maps schema → decorators (`@IsString`, `@IsEmail`, `@MinLength`, `@IsOptional`, `@Type`, `@IsEnum`, etc.)",
        "emit one file per schema, plus an index re-export",
        "mark the package as **generated, do not edit** in its README",
    ],
)

add(
    id="E02-F02-S03",
    epic="E02", epic_title="API contracts as the spine",
    feature="F02", feature_title="Codegen pipeline",
    title="Generate Dart Dio client",
    duration=2, stage="A",
    deps=["E02-F01-S02"],
    spec_refs=["DESIGN.md §3.2", "DESIGN.md §8"],
    goal="A typed Dart client compatible with Dio that the mobile app consumes for all `/api/v1/*` calls.",
    acceptance=[
        "`pnpm gen:dart-client` regenerates the client in `apps/mobile/lib/core/api/generated`",
        "Client compiles with `flutter analyze` clean",
    ],
    codegen="yes",
    substeps=[
        "use `openapi-generator-cli` with `dart-dio` template, pinned version",
        "script wraps the CLI; output path is `apps/mobile/lib/core/api/generated`",
        "add `gen:dart-client` to `gen:all`",
        "document that the directory is generated",
    ],
)

add(
    id="E02-F02-S04",
    epic="E02", epic_title="API contracts as the spine",
    feature="F02", feature_title="Codegen pipeline",
    title="Aggregate `gen:all` and contract-test scaffold",
    duration=1, stage="A",
    deps=["E02-F02-S01", "E02-F02-S02", "E02-F02-S03"],
    spec_refs=["AGENTS.md §8"],
    goal="One command regenerates everything; a stub contract test walks the bundled spec.",
    acceptance=[
        "`pnpm gen:all` runs lint → bundle → all three generators in order",
        "`pnpm test:contract` exists; for v1 it asserts every operationId has a matching test file",
    ],
    codegen="yes",
    substeps=[
        "add `gen:all` script chaining sub-tasks",
        "add `apps/api/test/contract/` with a runner that loads `dist/openapi.json`",
        "CI gate: error if `paths.*` count > test files count",
    ],
)

# ============================================================ E03 ============
add(
    id="E03-F01-S01",
    epic="E03", epic_title="Design tokens",
    feature="F01", feature_title="Token source",
    title="Import bundle tokens.json verbatim; wire Style Dictionary",
    duration=2, stage="A",
    deps=["E00-F01-S01", "E01-F01-S02"],
    spec_refs=["docs/design/shared/tokens.json", "AGENTS.md §7.9"],
    goal="One token source, two outputs (CSS + Dart), both faithful to the bundle.",
    acceptance=[
        "`packages/design-tokens/tokens.json` is identical to `docs/design/shared/tokens.json`",
        "`pnpm gen:design-tokens` produces `apps/web/assets/tokens.css` and `apps/mobile/lib/design/tokens.dart`",
        "Generated files include a banner: \"Generated from packages/design-tokens — do not edit by hand\"",
    ],
    design="yes — palette + type + spacing + radius + elevation + motion",
    tests="snapshot of generated outputs; failure if tokens.json is edited without re-running the generator",
    substeps=[
        "copy `docs/design/shared/tokens.json` to `packages/design-tokens/tokens.json`",
        "add Style Dictionary as dev dep",
        "write `style-dictionary.config.ts` with `web/css` and `mobile/dart` platforms",
        "match the existing CSS shape exactly: `:root, [data-mode=\"dark\"]` + `[data-mode=\"light\"]` blocks",
        "include the IBM Plex font import line at the top of `tokens.css`",
        "write the Dart emitter: `Tokens.color.surface`, `Tokens.space.s4`, plus a `Tokens.theme.dark|light` `ThemeData` factory",
        "commit the generated outputs",
    ],
)

add(
    id="E03-F01-S02",
    epic="E03", epic_title="Design tokens",
    feature="F01", feature_title="Token source",
    title="Vuetify and Flutter theme adapters + Foundations canvas",
    duration=2, stage="A",
    deps=["E03-F01-S01"],
    spec_refs=["docs/design/cs-foundations/", "DESIGN.md §2.11"],
    goal="Both apps render with the bundle's exact theme values; a Foundations canvas reproduces `cs-foundations`.",
    acceptance=[
        "`apps/web/plugins/vuetify.ts` derives Vuetify themes from CSS custom properties",
        "`apps/mobile/lib/app.dart` builds `ThemeData` from `Tokens.theme.*`",
        "A `/dev/foundations` route (web) and a Foundations folder (Widgetbook) reproduce `cs-foundations/`",
    ],
    design="yes",
    tests="visual regression on the Foundations canvas",
    substeps=[
        "Vuetify theme adapter",
        "Flutter `Tokens.theme.fromMode(...)` helper",
        "reproduce the foundations canvas content (sections from DESIGN_BRIEF §4: color, type, spacing, radius, buttons, inputs, cards, list rows, tabs/segmented, feedback, overlays, progress, empty states, loading skeletons, avatar, chip)",
    ],
)

# ============================================================ E04 ============
add(
    id="E04-F01-S01",
    epic="E04", epic_title="Backend skeleton + Better Auth",
    feature="F01", feature_title="Nest application bootstrap",
    title="Bootstrap apps/api with Prisma and modules skeleton",
    duration=2, stage="A",
    deps=["E02-F02-S04"],
    spec_refs=["AGENTS.md §7.2", "DESIGN.md §5"],
    goal="An app skeleton that compiles, with bounded-context module scaffolding ready.",
    acceptance=[
        "`apps/api/src/{main.ts,app.module.ts}` boot",
        "Empty modules: CatalogModule, AccessModule, LearningModule, StreamingModule, OpsModule",
        "PrismaModule + service in `infrastructure/prisma/`",
        "`apps/api/prisma/schema.prisma` exists with provider toggle via env",
    ],
    substeps=[
        "scaffold Nest app with `NestFactory.create`, Helmet, body parser raw mode",
        "add Prisma client wrapper with lifecycle hooks",
        "create empty bounded-context modules with placeholder controllers",
        "add `pnpm dev:api`",
    ],
)

add(
    id="E04-F01-S02",
    epic="E04", epic_title="Backend skeleton + Better Auth",
    feature="F01", feature_title="Nest application bootstrap",
    title="`/healthz` and `/readyz` outside the OpenAPI spec",
    duration=1, stage="A",
    deps=["E04-F01-S01"],
    spec_refs=["PRD.md FR-OPS-01"],
    goal="Always-public liveness/readiness probes that bypass auth and the spec validator.",
    acceptance=[
        "`GET /healthz` always 200",
        "`GET /readyz` 200 only when DB connection succeeds",
        "Both routes are exempted from the validator and the global auth guard",
    ],
    tests="e2e supertest for both",
    substeps=[
        "add `OpsController` with two routes",
        "decorate with `@AllowAnonymous()` (added in F02)",
        "add validator path exclusion",
    ],
)

add(
    id="E04-F02-S01",
    epic="E04", epic_title="Backend skeleton + Better Auth",
    feature="F02", feature_title="Better Auth integration",
    title="Configure Better Auth with bearer + admin plugins",
    duration=2, stage="A",
    deps=["E04-F01-S01"],
    spec_refs=["AGENTS.md §7.4", "DESIGN.md §2.5", "DESIGN.md §5.4"],
    goal="Better Auth boots, manages its own Prisma tables, exposes `/api/auth/*`, issues bearer tokens via `Set-Auth-Token`.",
    acceptance=[
        "`apps/api/src/identity/auth.ts` exports `createAuth(prisma)`",
        "`pnpm auth:schema` regenerates the Better Auth section of `schema.prisma`",
        "Plugins enabled: `emailAndPassword`, `bearer`, `admin`",
        "`additionalFields` declares `role` (default `USER`) and `displayName`",
    ],
    tests="integration test exercises sign-up, sign-in, get-session, sign-out via supertest",
    substeps=[
        "install `better-auth` and `@thallesp/nestjs-better-auth`",
        "write `createAuth` per DESIGN.md §5.4",
        "add `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` to env",
        "document `pnpm auth:schema` and the no-edit rule",
    ],
)

add(
    id="E04-F02-S02",
    epic="E04", epic_title="Backend skeleton + Better Auth",
    feature="F02", feature_title="Better Auth integration",
    title="Mount Better Auth + register global guard",
    duration=1, stage="A",
    deps=["E04-F02-S01"],
    spec_refs=["DESIGN.md §5.4"],
    goal="Routes are authenticated by default; `@AllowAnonymous()` opts out; `@Session()` resolves the current user.",
    acceptance=[
        "`GET /api/v1/ping` returns 401 without a token, 200 with a valid token",
        "`@Session()` resolves to `{ user: { id, role, ... }, session: {...} }`",
        "`@AllowAnonymous()` works on `/healthz` and `/readyz`",
    ],
    tests="e2e covering both decorators",
    substeps=[
        "register `AuthModule.forRootAsync` in `AppModule`",
        "write a `PingController` that injects `CommandBus` and reads `@Session()`",
        "add the operation to the spec under `paths/ping.yaml`",
    ],
)

add(
    id="E04-F02-S03",
    epic="E04", epic_title="Backend skeleton + Better Auth",
    feature="F02", feature_title="Better Auth integration",
    title="Mount express-openapi-validator for /api/v1/*",
    duration=1, stage="A",
    deps=["E04-F02-S02"],
    spec_refs=["DESIGN.md §3.3"],
    goal="Runtime validation of request/response against the bundled spec; `/api/auth/*` and `/healthz` exempted.",
    acceptance=[
        "Invalid request body returns RFC 7807 problem JSON",
        "Schema mismatches in responses fail in dev/test, log-only in prod",
        "Better Auth routes are not blocked",
    ],
    tests="integration tests asserting 400 with problem details on bad body",
    substeps=[
        "mount middleware with `ignorePaths: /^\\/(api\\/auth|healthz|readyz)/`",
        "map validator errors to `Problem` shape",
        "env toggle for response validation (default on in dev/test)",
    ],
)

# ============================================================ E05 ============
add(
    id="E05-F01-S01",
    epic="E05", epic_title="Shared kernel",
    feature="F01", feature_title="Branded IDs and errors",
    title="Branded ID + DomainError module",
    duration=1, stage="A",
    deps=["E01-F01-S02"],
    spec_refs=["AGENTS.md §7.2"],
    goal="Foundational types reused by every aggregate.",
    acceptance=[
        "`Id<'Course'>` and `Id<'Lesson'>` cannot be assigned to each other",
        "`DomainError` is the parent of typed subclasses; presentation layer maps each to a status code",
        "100% test coverage on this package",
    ],
    substeps=[
        "implement branded `Id<TBrand>` with `from`, `new`, `toString`, `equals`",
        "implement `DomainError` and named subclasses (`InvariantViolation`, `NotFound`, `PermissionDenied`)",
        "export from a barrel",
        "write a Nest `DomainErrorFilter` that maps to HTTP statuses",
    ],
)

# ============================================================ E06 ============
add(
    id="E06-F01-S01",
    epic="E06", epic_title="Catalog bounded context",
    feature="F01", feature_title="Library aggregate & registration",
    title="Library aggregate + repository port",
    duration=2, stage="A",
    deps=["E04-F02-S03", "E05-F01-S01"],
    spec_refs=["PRD.md FR-LIB-01", "DESIGN.md §4", "DESIGN.md §6.2"],
    goal="Persisting libraries with their invariants (name non-empty, rootPath absolute and unique).",
    acceptance=[
        "Domain test: cannot construct with empty name or relative path",
        "Roundtrip test: save → load returns equal aggregate",
    ],
    spec_diff="yes — `POST /libraries`, `GET /libraries`, `GET /libraries/{id}`",
    codegen="yes — regenerate api-client-{ts,dart} and DTOs",
    substeps=[
        "edit `packages/api-contracts/src/paths/libraries.yaml` and `components/schemas/library.yaml`",
        "`pnpm contracts:lint && pnpm contracts:bundle && pnpm gen:all`",
        "`Library` aggregate in `contexts/catalog/domain/library/`",
        "`LibraryRepository` interface in domain",
        "`prisma-library.repository.ts` + mapper in `infrastructure/persistence/`",
        "commands: `RegisterLibraryCommand` + handler",
        "queries: `ListLibrariesQuery`, `GetLibraryQuery` + handlers",
        "`LibrariesController` mapping DTO ↔ command/query",
        "tests",
    ],
)

add(
    id="E06-F02-S01",
    epic="E06", epic_title="Catalog bounded context",
    feature="F02", feature_title="Scanner",
    title="Scan aggregate, FsAdapter, incremental scan",
    duration=3, stage="A",
    deps=["E06-F01-S01"],
    spec_refs=["PRD.md FR-LIB-02", "PRD.md FR-LIB-03", "PRD.md FR-LIB-06", "DESIGN.md §10.1"],
    goal="A scan walks the library tree, builds Course → Section → Lesson, and only touches files whose `(mtime, size)` signature changed.",
    acceptance=[
        "First scan creates aggregates; second scan with no changes is a no-op",
        "`course.json` override file (if present) supersedes folder-derived metadata",
        "Per-file errors are recorded on the `Scan` aggregate",
    ],
    spec_diff="yes — `POST /libraries/{id}/scans`, `GET /libraries/{id}/scans/latest`",
    codegen="yes",
    tests="domain unit, integration with a fixture library tree on tmpfs",
    substeps=[
        "spec edits + regen",
        "`Scan` aggregate emits `ScanStarted`, `ScanProgress`, `ScanCompleted`, `ScanFailed`",
        "`FsAdapter` interface (port) and concrete `NodeFsAdapter`",
        "`course.json` schema + parser (versioned)",
        "folder-naming convention parser",
        "`RunScanCommand` + handler — orchestrates the walk",
        "mtime+size signature persisted on `Lesson` for incrementality",
    ],
)

add(
    id="E06-F02-S02",
    epic="E06", epic_title="Catalog bounded context",
    feature="F02", feature_title="Scanner",
    title="ffprobe + thumbnail extraction",
    duration=2, stage="A",
    deps=["E06-F02-S01"],
    spec_refs=["PRD.md FR-LIB-05", "DESIGN.md §4"],
    goal="Per video, extract duration/resolution/codec and write a poster thumbnail.",
    acceptance=[
        "Lessons in the test fixture get correct metadata",
        "Thumbnails are 320×180, JPEG, ~30% quality",
        "Failure on a single file does not abort the scan",
    ],
    tests="integration with a small open-licence video fixture",
    substeps=[
        "`FfmpegAdapter` port + `LocalFfmpegAdapter` impl using `fluent-ffmpeg`",
        "thumbnail writer with idempotent path scheme",
        "integrate into the scanner",
        "unit-test the adapter against pre-recorded ffprobe JSON",
    ],
)

add(
    id="E06-F03-S01",
    epic="E06", epic_title="Catalog bounded context",
    feature="F03", feature_title="Course / Section / Lesson aggregates",
    title="Course aggregate + slug uniqueness + section ordering",
    duration=2, stage="A",
    deps=["E06-F02-S01"],
    spec_refs=["PRD.md FR-LIB-02"],
    goal="Courses encode the structural invariants of the catalog.",
    acceptance=[
        "Slug is unique within a library",
        "Sections have unique `position` within a course",
        "Lessons have unique `position` within a section",
        "`course.addSection`, `course.reorderSection` enforce invariants",
    ],
    spec_diff="yes — `GET /courses`, `GET /courses/{id}`, `PATCH /courses/{id}`",
    codegen="yes",
    substeps=[
        "spec + regen",
        "aggregate + value objects (`Slug`, `Title`, `Position`)",
        "repo + mapper",
        "`UpdateCourseMetadataCommand` (admin only)",
        "`ListCoursesQuery`, `GetCourseQuery`",
        "read-side DTOs include progress placeholders (filled in E10)",
    ],
)

add(
    id="E06-F03-S02",
    epic="E06", epic_title="Catalog bounded context",
    feature="F03", feature_title="Course / Section / Lesson aggregates",
    title="Lesson + Material + Subtitle read model",
    duration=2, stage="A",
    deps=["E06-F03-S01"],
    spec_refs=["PRD.md FR-LIB-04", "PRD.md FR-PLAY-04"],
    goal="`GET /lessons/{id}` returns metadata, sidecar materials, and available subtitles.",
    acceptance=[
        "Sidecar `.srt`/`.vtt` files are listed with language guessed from filename",
        "Sidecar `.pdf`/`.md`/`.txt` files are listed as materials",
    ],
    spec_diff="yes — `GET /lessons/{id}`, schema for materials/subtitles",
    codegen="yes",
    substeps=[
        "spec + regen",
        "`Lesson` aggregate with `materials` and `subtitles` collections",
        "discovery during scan: stem-matching algorithm",
        "`GetLessonQuery` returning the read DTO",
        "omit raw paths from the DTO (NFR-S-01)",
    ],
)

# ============================================================ E07 ============
add(
    id="E07-F01-S01",
    epic="E07", epic_title="Access control",
    feature="F01", feature_title="Grants & enforcement",
    title="AccessGrant aggregate + admin endpoints",
    duration=2, stage="A",
    deps=["E06-F01-S01"],
    spec_refs=["PRD.md FR-AUTH-04", "PRD.md FR-AUTH-05"],
    goal="Admins can grant a user READ access to a library or to a specific course.",
    acceptance=[
        "`POST /access/grants` (admin) creates a grant",
        "`DELETE /access/grants/{id}` revokes",
        "`GET /access/grants?userId=` lists a user's grants",
    ],
    spec_diff="yes",
    codegen="yes",
    substeps=[
        "spec + regen",
        "aggregate + repo",
        "commands and queries",
        "admin guard via Better Auth `admin` plugin role check",
    ],
)

add(
    id="E07-F01-S02",
    epic="E07", epic_title="Access control",
    feature="F01", feature_title="Grants & enforcement",
    title="AuthorizationService consumed by Catalog & Streaming",
    duration=2, stage="A",
    deps=["E07-F01-S01"],
    spec_refs=["PRD.md NFR-S-01", "PRD.md FR-AUTH-04"],
    goal="A single `AuthorizationService.canSee(user, resource)` reused everywhere.",
    acceptance=[
        "`ListCoursesQuery` filters by grants for non-admins",
        "Stream-token issuance refuses to mint for unauthorized lessons",
    ],
    substeps=[
        "add `AuthorizationService` to `access` context's `application/`",
        "consumers depend on its interface, not its implementation",
        "caching: in-memory LRU keyed by `(userId, resourceId)` with short TTL",
    ],
)

# ============================================================ E08 ============
add(
    id="E08-F01-S01",
    epic="E08", epic_title="Streaming",
    feature="F01", feature_title="Signed URLs",
    title="Short-lived signed stream tokens",
    duration=2, stage="A",
    deps=["E06-F03-S02", "E07-F01-S02"],
    spec_refs=["PRD.md FR-PLAY-02", "PRD.md NFR-S-01"],
    goal="Issue an opaque token tied to (userId, lessonId, expiresAt), verifiable without DB lookup.",
    acceptance=[
        "Token is HMAC-signed with `BETTER_AUTH_SECRET`-derived subkey",
        "Default TTL = 15 min",
        "Verification fails on tamper, expiry, or mismatched lesson",
    ],
    spec_diff="yes — `GET /lessons/{id}/stream-url`",
    codegen="yes",
    substeps=[
        "spec + regen",
        "`StreamTokenSigner` with HKDF-derived key",
        "`IssueStreamTokenQuery` that calls `AuthorizationService` first",
    ],
)

add(
    id="E08-F02-S01",
    epic="E08", epic_title="Streaming",
    feature="F02", feature_title="Byte-range delivery",
    title="`GET /stream/lessons/{id}` with Range support",
    duration=2, stage="A",
    deps=["E08-F01-S01"],
    spec_refs=["PRD.md FR-PLAY-01", "PRD.md NFR-S-02"],
    goal="Standards-compliant range delivery; canonicalized path checks prevent traversal.",
    acceptance=[
        "Single-range, multi-range, and unsatisfiable-range cases handled",
        "Returns 200 if no `Range` header, 206 otherwise",
        "Path canonicalization rejects paths outside the configured library root",
    ],
    substeps=[
        "`StreamingController` outside the v1 prefix, validator-exempt",
        "`RangeRequestParser` utility",
        "`LessonFileLocator` resolves `lessonId → absolute path` via repository",
        "traversal-protection helper used by all file readers",
    ],
)

add(
    id="E08-F02-S02",
    epic="E08", epic_title="Streaming",
    feature="F02", feature_title="Byte-range delivery",
    title="Subtitle delivery (SRT → VTT)",
    duration=1, stage="A",
    deps=["E06-F03-S02"],
    spec_refs=["PRD.md FR-PLAY-04"],
    goal="Convert SRT to VTT on the fly; serve VTT files as-is.",
    acceptance=[
        "Existing `.vtt` is streamed",
        "`.srt` is converted (cached) to `.vtt`",
        "Unknown language returns 404 with problem detail",
    ],
    spec_diff="yes",
    codegen="yes",
    substeps=[
        "spec + regen",
        "`SubtitleService` with conversion + on-disk cache",
        "cache invalidation on source mtime change",
    ],
)

# ============================================================ E09 ============
add(
    id="E09-F01-S01",
    epic="E09", epic_title="Learning",
    feature="F01", feature_title="Progress",
    title="LessonProgress aggregate + record endpoint",
    duration=2, stage="A",
    deps=["E04-F02-S03", "E05-F01-S01"],
    spec_refs=["PRD.md FR-PROG-01", "PRD.md FR-PROG-02", "DESIGN.md §5.1"],
    goal="Position writes update progress; completion threshold raises a domain event.",
    acceptance=[
        "`POST /progress` upserts; out-of-order `clientUpdatedAt` is silently ignored (last-write-wins)",
        "Crossing 90% emits `LessonCompleted` exactly once per (user, lesson)",
    ],
    spec_diff="yes — `POST /progress`, `GET /progress/{lessonId}`",
    codegen="yes",
    substeps=[
        "spec + regen",
        "aggregate exactly as DESIGN.md §5.1",
        "handler + repository + mapper",
        "controller wiring with `@Session()`",
    ],
)

add(
    id="E09-F01-S02",
    epic="E09", epic_title="Learning",
    feature="F01", feature_title="Progress",
    title="Batch progress endpoint for sync",
    duration=1, stage="A",
    deps=["E09-F01-S01"],
    spec_refs=["PRD.md FR-PROG-04", "DESIGN.md §10.4"],
    goal="Accept up to N progress updates in one call; respond with per-item success/conflict.",
    acceptance=[
        "`200 OK` body lists per-item result",
        "Conflict response indicates server `updatedAt` so the client can pull and overwrite",
    ],
    spec_diff="yes",
    codegen="yes",
    substeps=[
        "spec edits + regen",
        "handler reuses `RecordLessonProgressCommand` per item",
        "cap N at 200, document in spec",
    ],
)

add(
    id="E09-F02-S01",
    epic="E09", epic_title="Learning",
    feature="F02", feature_title="Bookmarks & notes",
    title="Bookmarks endpoints",
    duration=1, stage="A",
    deps=["E04-F02-S03"],
    spec_refs=["PRD.md FR-NOTE-01"],
    goal="Per-user, per-lesson timestamped bookmarks.",
    acceptance=[
        "List, create, update, delete",
        "Owner-only access enforced",
    ],
    spec_diff="yes",
    codegen="yes",
    substeps=[
        "spec + regen",
        "aggregate (small) + repo",
        "handlers and controller",
    ],
)

add(
    id="E09-F02-S02",
    epic="E09", epic_title="Learning",
    feature="F02", feature_title="Bookmarks & notes",
    title="Notes endpoints (one per user+lesson)",
    duration=1, stage="A",
    deps=["E04-F02-S03"],
    spec_refs=["PRD.md FR-NOTE-02"],
    goal="Free-form Markdown note per (user, lesson).",
    acceptance=[
        "`PUT /notes` upserts the single note for a (user, lesson)",
        "`GET /notes/{lessonId}` returns the user's note",
    ],
    spec_diff="yes",
    codegen="yes",
    substeps=[
        "spec + regen",
        "handlers and controller",
    ],
)

# ============================================================ E10 ============
add(
    id="E10-F01-S01",
    epic="E10", epic_title="Cross-context coupling",
    feature="F01", feature_title="Course progress read model",
    title="CourseProgressProjector + read model table",
    duration=2, stage="A",
    deps=["E06-F03-S02", "E09-F01-S01"],
    spec_refs=["DESIGN.md §4.1", "DESIGN.md §10.7"],
    goal="A denormalized per-(user, course) row keeps completion ratio fast at read time.",
    acceptance=[
        "`LessonCompleted` triggers an update to `CourseProgressReadModel`",
        "`GET /home/continue-watching` reads from the projection only",
    ],
    spec_diff="yes — `GET /home/continue-watching`",
    codegen="yes",
    substeps=[
        "add Prisma model `CourseProgressReadModel` (composite key user+course)",
        "event handler in `catalog/application/event-handlers/`",
        "backfill command (`pnpm db:rebuild-projections`)",
        "spec + regen for home endpoint",
    ],
)

# ============================================================ E11 ============
add(
    id="E11-F01-S01",
    epic="E11", epic_title="Web foundations",
    feature="F01", feature_title="Nuxt + Vuetify shell",
    title="Bootstrap Nuxt SPA with Vuetify and tokens",
    duration=2, stage="A",
    deps=["E03-F01-S02", "E04-F02-S03"],
    spec_refs=["AGENTS.md §7.5", "DESIGN.md §2.9b", "DESIGN.md §7"],
    goal="A Nuxt 3 SPA with Vuetify themed by the generated tokens.",
    acceptance=[
        "`nuxt.config.ts` sets `ssr: false`",
        "Vuetify dark theme is the default",
        "A demo `/__tokens` page renders all tokens",
    ],
    design="yes — first consumer of design tokens",
    substeps=[
        "scaffold Nuxt",
        "add Vuetify and the tokens plugin",
        "empty `pages/index.vue` and `pages/__tokens.vue`",
    ],
)

add(
    id="E11-F01-S02",
    epic="E11", epic_title="Web foundations",
    feature="F01", feature_title="Nuxt + Vuetify shell",
    title="useApi, useAuth, useAuthToken composables",
    duration=2, stage="A",
    deps=["E11-F01-S01"],
    spec_refs=["AGENTS.md §7.4", "DESIGN.md §7.3", "DESIGN.md §10.5"],
    goal="A single way to call the API that always carries the bearer token, plus a thin Better Auth client wrapper.",
    acceptance=[
        "`useAuth().signIn(email, password)` stores token under `cs.bearer`",
        "`useApi().GET('/courses')` includes `Authorization: Bearer <token>`",
        "`401` clears the token and routes to `/login`",
    ],
    substeps=[
        "`composables/useAuthToken.ts` — localStorage adapter",
        "`composables/useAuth.ts` — wraps `better-auth/client` configured for bearer storage",
        "`composables/useApi.ts` — wraps `@courseshelf/api-types` `createClient` with token interceptor",
        "global Nuxt middleware redirecting unauthenticated users",
    ],
)

add(
    id="E11-F01-S03",
    epic="E11", epic_title="Web foundations",
    feature="F01", feature_title="Nuxt + Vuetify shell",
    title="useAuthStore + minimal login/setup pages",
    duration=2, stage="A",
    deps=["E11-F01-S02"],
    spec_refs=["PRD.md FR-AUTH-01"],
    goal="First-run wizard creates the admin; `/login` works against the real backend.",
    acceptance=[
        "First run: `/setup` is forced if no users exist",
        "Returning users: `/login` if no token, otherwise `/`",
    ],
    notes="The *real* login + setup design lands when `cs-web-auth` is prototyped (Stage B in E14-F02).",
    substeps=[
        "`pages/setup.vue` calls `authClient.signUp.email` then promotes role to admin",
        "`pages/login.vue`",
        "`useAuthStore` Pinia",
        'global middleware checks "users exist?" flag (small backend endpoint added here)',
    ],
)

# ============================================================ E12 ============
add(
    id="E12-F01-S01",
    epic="E12", epic_title="Storybook for web",
    feature="F01", feature_title="Storybook bootstrap",
    title="Configure Storybook for Vue 3 + Vuetify + tokens",
    duration=1, stage="A",
    deps=["E11-F01-S01"],
    spec_refs=["AGENTS.md §7.6", "DESIGN.md §2.9"],
    goal="Stories render with the same theme + tokens as the real app.",
    acceptance=[
        "A canary `Button.stories.ts` renders Default, Hover, Disabled",
        "`pnpm dev:storybook` works",
        "`pnpm build:storybook` produces a static site",
    ],
    design="yes",
    substeps=[
        "install Storybook 8 + Vue 3 framework",
        "`.storybook/main.ts`, `preview.ts` (Vuetify decorator, tokens.css import)",
        "add `pnpm dev:storybook`, `pnpm build:storybook`, `pnpm storybook:test`",
    ],
)

# ============================================================ E13 ============
# Web catalog — primitives (12 stories) + domain (8 stories)

E13_F01_FEAT = ("F01", "Primitive families (from cs-foundations)")
E13_BUNDLE = "docs/design/cs-foundations/, docs/design/shared/tokens.css"

add(
    id="E13-F01-S01",
    epic="E13", epic_title="Web component catalog",
    feature="F01", feature_title="Primitive families (from cs-foundations)",
    title="IconCS — port the bundle's 61-icon family to Vue",
    duration=2, stage="A",
    deps=["E12-F01-S01"],
    spec_refs=["docs/design/shared/icons.jsx"],
    goal="A single `<IconCS>` component rendering any of the 61 named glyphs from the bundle.",
    acceptance=[
        "`<IconCS name=\"play\" :size=\"16\" fill />` renders the play icon",
        "All 61 names compile (typed via a string-literal union)",
        "24px viewBox, 1.5px stroke, round caps; `fill` only applies to icons that document a filled variant (`play`, `bookmark`)",
    ],
    design="yes",
    tests="snapshot per icon; story interaction asserts `aria-hidden` by default and `role=\"img\"` + `aria-label` when given a `title`",
    substeps=[
        "translate JSX paths from `docs/design/shared/icons.jsx` to Vue `<svg>` templates (keep path data identical)",
        "type the `name` prop as a literal union",
        "write the grid story showing all icons with their names",
    ],
    notes="Icon names: play, pause, next, prev, home, library, search, settings, check, check-circle, circle, lock, download, cloud, cloud-down, bookmark, note, pdf, folder, user, users, plus, minus, x, chevron-{right,left,down,up}, arrow-right, sun, moon, volume, volume-mute, subtitles, fullscreen, pip, speed, list, grid, filter, sort, eye, eye-off, mail, key, shield, alert, info, wifi-off, refresh, edit, trash, copy, logout, menu, more, clock, calendar, **at**, **banner**, **github** (last three added with the auth bundle).",
)

add(
    id="E13-F01-S02",
    epic="E13", epic_title="Web component catalog",
    feature="F01", feature_title="Primitive families (from cs-foundations)",
    title="AppButton + AppIconButton (matches .btn classes)",
    duration=2, stage="A",
    deps=["E12-F01-S01", "E13-F01-S01"],
    spec_refs=["docs/design/shared/tokens.css §Buttons", "docs/design/cs-foundations/ §5"],
    goal="Variants and sizes match the design exactly.",
    acceptance=[
        "Variants: `primary`, `secondary`, `ghost`, `destructive`",
        "Sizes: `sm` (28px), default (36px), `lg` (44px)",
        "States in stories: Default, Hover, Active, Focus (keyboard), Disabled, Loading (spinner replaces label)",
        "`AppIconButton` is a square variant (28/36/44 wide)",
        'Loading state matches `data-loading="true"` in the bundle CSS',
    ],
    design="yes",
    tests="Storybook interaction (click, keyboard activation); a11y check (focus ring visible, `aria-busy` while loading, `aria-disabled`)",
)

add(
    id="E13-F01-S03",
    epic="E13", epic_title="Web component catalog",
    feature="F01", feature_title="Primitive families (from cs-foundations)",
    title="AppTextField, AppNumberField, AppSearchField, AppSelect, AppSwitch, AppCheckbox, AppRadio",
    duration=3, stage="A",
    deps=["E12-F01-S01", "E13-F01-S01"],
    spec_refs=["docs/design/shared/tokens.css §Inputs", "docs/design/cs-foundations/ §6"],
    goal="Inputs share the .field wrapper (label/help/error) and use the bundle's exact heights, paddings, focus ring, and error styles.",
    acceptance=[
        "States per control: Empty, Filled, Focused, Error, Disabled",
        "Labels above the field; help/error below; error icon next to error text",
        '36px height default, 30px in `[data-density="compact"]`',
    ],
    design="yes",
    tests="Storybook interactions (typing, keyboard nav); a11y (`aria-invalid`, `aria-describedby` for help/error)",
)

# Stub primitive families
def stub_primitive(sid, title, deps_extra=None, duration=1, spec_extra=None, accept=None):
    add(
        id=sid,
        epic="E13", epic_title="Web component catalog",
        feature="F01", feature_title="Primitive families (from cs-foundations)",
        title=title, duration=duration, stage="A",
        deps=["E12-F01-S01"] + (deps_extra or []),
        spec_refs=[E13_BUNDLE] + (spec_extra or []),
        goal=f"{title} matching the bundle.",
        acceptance=accept or ["States in stories match the bundle's state matrix", "Uses design tokens only (no hard-coded values)"],
        design="yes",
    )

stub_primitive("E13-F01-S04", "AppCard (.card, .card-lg, .card-hover)")
stub_primitive("E13-F01-S05", "AppRow — leading/body/trailing slots, selected + compact states", deps_extra=["E13-F01-S01"])
stub_primitive("E13-F01-S06", "AppTabs and AppSegmented controls")
stub_primitive("E13-F01-S07", "AppBanner (info/success/warning/error), AppToast, inline alerts", deps_extra=["E13-F01-S01"])
stub_primitive("E13-F01-S08", "AppDialog (sm/md), AppCommandPalette (desktop)", deps_extra=["E13-F01-S02"])
stub_primitive("E13-F01-S09", "AppProgressLinear, AppProgressCircle, AppSpinner, AppSkeleton")
stub_primitive("E13-F01-S10", "AppEmptyState, AppErrorState, AppNoPermission", deps_extra=["E13-F01-S01", "E13-F01-S02"])
stub_primitive("E13-F01-S11", "AppAvatar (xs/sm/default/lg/xl, with role-admin and role-guest badges)")
stub_primitive("E13-F01-S12", "AppChip (default/primary/success/warning/error/info; removable variant)", deps_extra=["E13-F01-S01"])

# Domain components
add(
    id="E13-F02-S01",
    epic="E13", epic_title="Web component catalog",
    feature="F02", feature_title="Domain components (from cs-components)",
    title="CourseCard — Poster, Wide, Compact variants",
    duration=3, stage="A",
    deps=["E13-F01-S01", "E13-F01-S09"],
    spec_refs=["docs/design/cs-components/components.jsx §CourseCard", "DESIGN_BRIEF §5.1"],
    goal="Three layouts (poster, wide, compact) covered by one Vue component family with shared logic.",
    acceptance=[
        "Props per variant exactly match the bundle (`course`, `state`, `loading`; `Wide` adds `resumeAt`)",
        "States rendered in stories: Default, Hover, Focus, InProgress, Completed, NotStarted, Locked, Loading (≥ 8 each)",
        "Cover treatment uses the bundle's `COVER` map (teal/amber/indigo/warm/coral/neutral) + initials glyph",
        "All variants emit `@click` and respond to Enter/Space",
    ],
    design="yes — primary discovery surface",
    tests="Storybook interactions; visual regression",
    substeps=[
        "reproduce the cover styling and state badges from the bundle",
        "one Vue component file per variant; shared composable `useCourseProgress(course, state)` derives `pct` and `realState`",
        "stories per variant per state",
    ],
)

add(
    id="E13-F02-S02",
    epic="E13", epic_title="Web component catalog",
    feature="F02", feature_title="Domain components (from cs-components)",
    title="LessonRow with state matrix; SectionHeader with collapse",
    duration=2, stage="A",
    deps=["E13-F01-S01", "E13-F01-S05", "E13-F01-S09"],
    spec_refs=["docs/design/cs-components/components.jsx §LessonRow + SectionHeader", "DESIGN_BRIEF §5.2"],
    goal="The row that fills course detail; a section header that collapses and tracks count + duration.",
    acceptance=[
        "LessonRow props match the bundle (`num, title, duration, state, materials?, current?, progress?, loading?`)",
        "States: Default, Hover, Current, Completed, InProgress (with thin underline bar), Locked, Loading",
        "Trailing area: PDF icon if `materials`, mono duration string",
        "SectionHeader props: `idx, title, count, duration, open, onToggle`; chevron rotates on `open`",
    ],
    design="yes",
)

add(
    id="E13-F02-S03",
    epic="E13", epic_title="Web component catalog",
    feature="F02", feature_title="Domain components (from cs-components)",
    title="PlayerChrome (web) — overlay + minimal modes, full state set",
    duration=4, stage="A",
    deps=["E13-F01-S01", "E13-F01-S02", "E13-F01-S09"],
    spec_refs=["docs/design/cs-components/components.jsx §PlayerChrome", "docs/design/cs-web-lesson-player/", "DESIGN_BRIEF §5.3"],
    goal="Presentational player chrome — no real `<video>` yet (that attaches in E14-F03-S01).",
    acceptance=[
        "Two layout modes: overlay (full chrome) and minimal (slim scrubber peek)",
        "Scrubber: track + buffered + played + thumb; chapter markers (`chapters: number[]`) and bookmark markers (`bookmarks: { time, label? }[]`)",
        "States: Idle, Playing, Paused, Buffering, Error, EndOfLesson (next-lesson countdown), Locked",
        "Emits: `@play`, `@pause`, `@seek(positionSec)`, `@speed(rate)`, `@toggleSubtitles`, `@togglePip`, `@toggleFullscreen`, `@nextLesson`",
        "Reduced-motion respected",
        "Keyboard map: Space (play/pause), ←/→ (seek 5s), J/K/L, F (fullscreen), M (mute), `,`/`.` (frame step), 0-9 (jump %)",
    ],
    design="yes — single most complex component",
    tests="extensive Storybook interactions; a11y (aria-labels, `aria-valuenow` on the slider)",
)

add(
    id="E13-F02-S04",
    epic="E13", epic_title="Web component catalog",
    feature="F02", feature_title="Domain components (from cs-components)",
    title="Bookmark, BookmarkAdd, BookmarkList",
    duration=1, stage="A",
    deps=["E13-F01-S01", "E13-F01-S02", "E13-F01-S03"],
    spec_refs=["docs/design/cs-components/components.jsx §Bookmark / BookmarkAdd"],
    goal="A list of bookmarks with hover-revealed edit/delete and an inline add row (no modal).",
    acceptance=[
        "Bookmark props: `time, label?, editable?`",
        "BookmarkAdd: shows current playhead time, label input, Save button",
        "States: Default, Hover (actions visible), Adding, Empty list",
    ],
    design="yes",
)

add(
    id="E13-F02-S05",
    epic="E13", epic_title="Web component catalog",
    feature="F02", feature_title="Domain components (from cs-components)",
    title="NoteEditor with edit/preview toggle and self-evident sync indicator",
    duration=2, stage="A",
    deps=["E13-F01-S01", "E13-F01-S02", "E13-F01-S03"],
    spec_refs=["docs/design/cs-components/components.jsx §NoteEditor", "PRD.md UX §7", "DESIGN_BRIEF §5.4"],
    goal='A simple markdown editor with toolbar, edit/preview toggle, and a "Saved · Ns ago" indicator (always inline, never modal).',
    acceptance=[
        "Modes: edit, view",
        "Sync indicator states: Syncing, Saved, Failed (retrying), Offline (queued) — all small inline",
        "Auto-save debounced to 600ms after last keystroke",
    ],
    design="yes",
)

add(
    id="E13-F02-S06",
    epic="E13", epic_title="Web component catalog",
    feature="F02", feature_title="Domain components (from cs-components)",
    title="ProgressBadge — ring, bar, pill variants",
    duration=1, stage="A",
    deps=["E13-F01-S01"],
    spec_refs=["docs/design/cs-components/components.jsx §ProgressBadge"],
    goal="One component, three visual variants, four domain states.",
    acceptance=[
        "`variant: 'ring' | 'bar' | 'pill'`",
        "`state: 'not-started' | 'in-progress' | 'completed' | 'locked'`",
        "Ring uses `conic-gradient`; renders a checkmark when completed, a lock when locked",
        "Pill text: `Done` / `Locked` / `—` / `4 of 12`",
        "Bar shows numeric pct in mono next to the bar",
    ],
    design="yes",
)

add(
    id="E13-F02-S07",
    epic="E13", epic_title="Web component catalog",
    feature="F02", feature_title="Domain components (from cs-components)",
    title="ScanProgress — live scan indicator with stats and current file",
    duration=2, stage="A",
    deps=["E13-F01-S02", "E13-F01-S09"],
    spec_refs=["docs/design/cs-components/components.jsx §ScanProgress", "DESIGN_BRIEF §5.6"],
    goal="The live scan card — used in the admin library detail page.",
    acceptance=[
        "Status pill (running/success/failed), course name, percentage (mono) + elapsed time (mono), cancel button (running only), errors affordance",
        "4-stat row: Scanned, Added, Updated, Errors (Errors red if > 0)",
        "Current file line with truncated absolute path; full path in tooltip",
        "States: Running, Success, Failed",
    ],
    design="yes",
    tests="Storybook with mocked stream",
)

add(
    id="E13-F02-S08",
    epic="E13", epic_title="Web component catalog",
    feature="F02", feature_title="Domain components (from cs-components)",
    title="NavigationShell — top bar + sidebar (composes AppRow + IconCS)",
    duration=2, stage="A",
    deps=["E13-F01-S01", "E13-F01-S05", "E13-F01-S11"],
    spec_refs=["docs/design/cs-web-home/", "docs/design/cs-web-course-detail/", "docs/design/cs-web-lesson-player/"],
    goal="The shell that wraps every authenticated page: top bar + left sidebar; collapses to bottom-tab nav at xs.",
    acceptance=[
        "Shell collapses to bottom-tab nav at xs (< 600 width)",
        "Avatar menu: profile, settings, sign out, mode toggle",
    ],
    design="yes",
    tests="Storybook at three reference widths (360, 1024, 1440)",
)

add(
    id="E13-F02-S09",
    epic="E13", epic_title="Web component catalog",
    feature="F02", feature_title="Domain components (from cs-components)",
    title="PasswordField — input with visibility toggle and optional strength meter",
    duration=2, stage="A",
    deps=["E13-F01-S01", "E13-F01-S03"],
    spec_refs=["docs/design/shared/auth.jsx §PasswordField", "docs/design/cs-web-auth/"],
    goal="Reusable password input shared by sign-in, sign-up, and password-reset forms.",
    acceptance=[
        "Props: `modelValue: string`, `label?: string` (default 'Password'), `withMeter?: boolean`, `autoComplete?: 'current-password' | 'new-password'`, `hint?: string`",
        "Lock icon on the left; eye/eye-off toggle on the right (`aria-label` toggles between `Show password` / `Hide password`)",
        "When `withMeter`, render a 3-segment strength bar with labels Empty / Weak / Okay / Strong (matches the bundle's `score` heuristic: <8 chars = Weak, <12 = Okay, ≥12 with symbol or >16 = Strong)",
        "States in stories: Empty, Filled (visible), Filled (masked), Focused, Error, Disabled, WithMeter (Empty/Weak/Okay/Strong)",
    ],
    design="yes",
    tests="Storybook interactions (toggle visibility, type to advance meter); a11y (input has `type=password` by default, `aria-pressed` on toggle button)",
    notes="The bundle's strength heuristic is intentionally simple — it lives entirely in this component so policy changes are localized. If we ever need a stricter zxcvbn-style score, swap the implementation here without touching consumers.",
)

add(
    id="E13-F02-S10",
    epic="E13", epic_title="Web component catalog",
    feature="F02", feature_title="Domain components (from cs-components)",
    title="SsoBlock — third-party / SSO provider button row",
    duration=1, stage="A",
    deps=["E13-F01-S02", "E13-F01-S01"],
    spec_refs=["docs/design/shared/auth.jsx §SsoBlock", "docs/design/cs-web-auth/"],
    goal="Visual home for OAuth/SSO providers — rendered when the admin has configured ≥1 provider.",
    acceptance=[
        "Props: `providers: Array<{ id: 'google' | 'github' | 'sso'; label: string; iconName: IconName }>`",
        "Renders one `AppButton` (secondary) per provider with the configured icon + label",
        "When `providers` is empty, the component renders nothing (auth pages also hide the surrounding `or` divider)",
        "States in stories: Default (3 providers as in bundle), GoogleOnly, GitHubOnly, SSOOnly, Empty",
    ],
    design="yes",
    notes=(
        "**v1 scope.** PRD lists OAuth/OIDC/SAML at v2+. v1 ships this component with an empty `providers` list "
        "by default — the visual is in place for when v2 lands. When the admin enables Better Auth's `genericOAuth` "
        "or per-provider plugins (post-v1), the auth page populates `providers` from `GET /admin/instance` and "
        "the SsoBlock renders. Until then, the divider and SsoBlock are hidden on the auth pages."
    ),
)

# ============================================================ E14 ============
add(
    id="E14-F01-S01",
    epic="E14", epic_title="Web pages",
    feature="F01", feature_title="Browsing & search",
    title="Stage A · Home page (cs-web-home)",
    duration=3, stage="A",
    deps=["E13-F02-S01", "E13-F02-S08", "E10-F01-S01", "E11-F01-S03"],
    spec_refs=["docs/design/cs-web-home/", "DESIGN_BRIEF §6.3"],
    goal='The first screen after login. "What should I watch next?"',
    acceptance=[
        "Top: greeting + role indicator (uses `AppAvatar` with role badge)",
        '"Continue watching": carousel of `CourseWideCard` with `resumeAt` populated; 5 visible at 1440',
        '"Recently added": carousel of `CoursePosterCard`; 6 visible at 1440',
        '"Recently completed": collapsed by default, expandable',
        'Right rail at lg+: "Your week" (minutes watched, lessons completed)',
        "Layout (md, 1024): right rail dropped",
        "Layout (xs, 360): bottom-tab nav, rows scroll horizontally",
        "States: Populated, Empty, Loading skeleton, Error",
    ],
    spec_diff="yes — `GET /home/{continue-watching,recently-added,recently-completed,your-week}`",
    codegen="yes",
    design="consumes existing",
    tests="Playwright across 3 widths; backend contract tests",
    substeps=[
        "spec edits + regen",
        "queries + handlers (read from the projection landed in E10)",
        "page composition",
        "test all 4 visual states",
    ],
)

add(
    id="E14-F01-S02",
    epic="E14", epic_title="Web pages",
    feature="F01", feature_title="Browsing & search",
    title="Stage B · Browse + Search (precede with cs-web-browse-search design)",
    duration=4, stage="B",
    deps=["E13-F02-S01", "E13-F02-S08"],
    spec_refs=["DESIGN_BRIEF §6.4", "docs/design/cs-web-browse-search/ (to be produced)"],
    goal="Browse grid with filter sidebar (md+) / bottom sheet (xs/sm), search overlay with grouped results.",
    acceptance=[
        "Filters: status, library, duration buckets, instructor",
        "Sort: recently-watched (default), newest, alphabetical, duration",
        "Search overlay: groups by Courses / Lessons; per-result snippet + thumbnail + course context",
        "Empty / loading / error states",
    ],
    spec_diff="yes — `GET /courses` (with filters + sort), `GET /search?q=...&group=courses|lessons`",
    codegen="yes",
    design="yes — produce bundle first",
    substeps=[
        "**Design pre-step**: produce `cs-web-browse-search` bundle in Claude Design from DESIGN_BRIEF §6.4; export to `docs/design/cs-web-browse-search/`",
        "spec edits + regen",
        "backend search query (FTS over course/lesson titles)",
        "page composition",
    ],
)

add(
    id="E14-F01-S03",
    epic="E14", epic_title="Web pages",
    feature="F01", feature_title="Browsing & search",
    title="Stage A · Course detail (cs-web-course-detail)",
    duration=3, stage="A",
    deps=["E13-F02-S01", "E13-F02-S02", "E13-F02-S08"],
    spec_refs=["docs/design/cs-web-course-detail/", "DESIGN_BRIEF §6.5"],
    goal="The course landing screen.",
    acceptance=[
        "Hero (1440): cover left, title/instructor/progress/description right",
        "Primary `Resume`/`Start`, secondary `Mark complete`/`Reset progress`",
        "Section list with `SectionHeader` + `LessonRow` (current lesson highlighted)",
        "Right rail: course materials (PDFs, MD), individually downloadable",
        "Layout (1024): hero stacked, materials rail moves below",
        "Layout (360): hero is a horizontal strip, then sections",
        "States: Default, InProgress, Completed (quiet completion banner — no festival), Locked / NoAccess",
    ],
    spec_diff="yes — `POST /courses/{id}/{mark-complete,reset-progress}`",
    codegen="yes",
    design="consumes existing",
)

add(
    id="E14-F02-S01",
    epic="E14", epic_title="Web pages",
    feature="F02", feature_title="Auth & profile",
    title="Stage A · Sign in / sign up / forgot password (cs-web-auth)",
    duration=4, stage="A",
    deps=["E11-F01-S03", "E13-F02-S09", "E13-F02-S10", "E13-F01-S07"],
    spec_refs=["docs/design/cs-web-auth/", "docs/design/shared/auth.jsx", "DESIGN_BRIEF §6.2"],
    goal="The full split-screen auth surface: sign-in, 3-step sign-up wizard, and 3-step forgot-password flow.",
    acceptance=[
        "Layout: split screen (form pane left, `AuthMarketing` pane right). On `xs`, the marketing pane collapses below the form.",
        "**Sign in** screen: email + `PasswordField` + 'Keep me signed in' + 'Forgot password?' link + primary submit. Emits to `useAuth().signIn`.",
        "**Sign-in error** state: inline `AppBanner banner-error` above the submit; never a modal.",
        "**Sign up** is a 3-step wizard with the bundle's stepper indicator (Account → Verify → Library):",
        "&nbsp;&nbsp;Step 1 — Full name + email + `PasswordField` with `withMeter`. Submits to `useAuth().signUp`.",
        "&nbsp;&nbsp;Step 2 — 6-digit code input with auto-advance + resend countdown. Calls Better Auth's email-verification endpoint.",
        "&nbsp;&nbsp;Step 3 — Library setup form (name, server path, cover-art strategy). On submit, creates the first `Library` (uses `RegisterLibraryCommand` from E06-F01-S01).",
        "**Forgot password** is a 3-step flow:",
        "&nbsp;&nbsp;Step 1 — email input + 'Send reset link' submit",
        "&nbsp;&nbsp;Step 2 — confirmation card + 'Open mail app' affordance",
        "&nbsp;&nbsp;Step 3 — new-password screen with two `PasswordField` (new + confirm) and `withMeter` on the new field",
        "**Rate-limited** state: `AppBanner banner-warning` with retry-after countdown (drives off the rate-limiter from E21-F02-S01).",
        "**SSO row** (`SsoBlock`) renders below the email/password block on sign-in and step 1 of sign-up only when the admin has configured ≥1 OAuth provider — see Notes for the v1 default.",
        "**First-user case**: when the database has no users, `/sign-in` and `/forgot` redirect to `/sign-up`, and step 1 promotes the new account to ADMIN. The bundle's 3-step wizard *is* the first-run experience — no separate `/setup` route needed.",
        "**Email verification**: step 2 is rendered when the admin has enabled Better Auth's `emailVerification` plugin; otherwise sign-up jumps step 1 → step 3 directly. The flag is exposed via `GET /admin/instance` alongside `selfRegistration`.",
    ],
    spec_diff="`GET /admin/instance` returning `{ selfRegistration: bool, emailVerificationRequired: bool, ssoProviders: Array<{id, label, iconName}> }`",
    codegen="yes (small — single GET endpoint)",
    design="consumes existing — `docs/design/cs-web-auth/`",
    tests="Playwright e2e covering: first-user signup → admin role asserted; second-user signup → USER role; sign-in error path; forgot-password full flow; sign-up disabled empty state",
    substeps=[
        "spec edits + regen for `GET /admin/instance`",
        "implement the `OpsController` handler returning the three flags (reads from env + Better Auth config)",
        "build `pages/sign-in.vue`, `pages/sign-up.vue` (with 3-step Cubit-style local state), `pages/forgot.vue`, `pages/reset.vue`",
        "compose `AuthBrand` + `AuthMarketing` + `PasswordField` + `SsoBlock` + form fields per the bundle",
        "wire `useAuth().signIn` / `signUp` / `forgotPassword` / `resetPassword` to Better Auth client SDK",
        "first-user detection: a `useFirstRun()` composable hits `GET /admin/has-users`; if false, all auth routes funnel into sign-up step 1",
        "after step-1 sign-up, if it was the first user, call admin plugin's `setRole({ userId, role: 'ADMIN' })`",
        "step-3 library registration calls `POST /libraries` (E06-F01-S01)",
        "rate-limit banner reads retry-after from the 429 response body (set by E21-F02-S01)",
    ],
    notes=(
        "**SSO/OAuth in v1.** PRD lists OAuth/OIDC at v2+. The bundle ships the `SsoBlock` so the layout is ready, "
        "but v1 returns an empty `ssoProviders` array from `GET /admin/instance` by default. When v2 lands "
        "Better Auth's `genericOAuth` (or per-provider) plugin, the admin toggles providers in their config and the "
        "SsoBlock starts rendering — no UI changes needed.\n\n"
        "**Email verification in v1.** Same shape: ships visually but `emailVerificationRequired` defaults to "
        "false. An admin who enables Better Auth's `emailVerification` plugin opts into step 2 of the wizard. "
        "Without it, sign-up is a 2-step flow (Account → Library)."
    ),
)

add(
    id="E14-F02-S02",
    epic="E14", epic_title="Web pages",
    feature="F02", feature_title="Auth & profile",
    title="Stage B · Settings page (precede with cs-web-settings)",
    duration=2, stage="B",
    deps=["E13-F02-S08"],
    spec_refs=["DESIGN_BRIEF §6.8", "docs/design/cs-web-settings/ (to be produced)"],
    goal="Single-column settings: Profile, Appearance, Playback defaults, Account.",
    acceptance=[
        "Inline saves with the self-evident sync indicator",
        "Appearance: theme (dark/light/system) + density",
        "Playback: default speed, autoplay next, completion threshold",
    ],
    design="yes — produce bundle first",
    substeps=[
        "**Design pre-step**: produce `cs-web-settings` bundle",
        "page composition",
    ],
)

add(
    id="E14-F03-S01",
    epic="E14", epic_title="Web pages",
    feature="F03", feature_title="Lesson player",
    title="Stage A · Lesson player page wired to <video> (cs-web-lesson-player)",
    duration=4, stage="A",
    deps=["E13-F02-S03", "E13-F02-S04", "E13-F02-S05", "E08-F02-S01", "E09-F01-S01"],
    spec_refs=["docs/design/cs-web-lesson-player/", "DESIGN_BRIEF §6.6"],
    goal="Real playback; the chrome from E13-F02-S03 attached to a `<video>` with progress reporting and right-sidebar tabs.",
    acceptance=[
        "Layout (1440): player ~70%, sidebar ~30% with tabs Sections, Notes, Bookmarks, Materials",
        "Layout (1024): narrower sidebar",
        "Layout (360): player full-width on top; tabs as horizontal scroller below",
        "Resume from server progress; speed + subtitle pickers; auto-advance banner",
        "Progress posted every 10s of played time + on visibility change + on `beforeunload`",
        "On 401 from stream URL endpoint, refresh token and retry once",
        "States: Loading, Playing, Buffering, Error, EndOfLesson, NoPermission",
    ],
    design="consumes existing",
    tests="Playwright e2e — login → open lesson → seek → close → reopen → resume from same position",
    substeps=[
        "page composition",
        "`useProgressReporter()` composable",
        "retry-on-401 wrapper around `useApi`",
        "sidebar tabs: each tab loads its content inline",
    ],
)

add(
    id="E14-F04-S01",
    epic="E14", epic_title="Web pages",
    feature="F04", feature_title="Admin",
    title="Stage B · Admin section (precede with cs-web-admin)",
    duration=5, stage="B",
    deps=["E13-F02-S07", "E13-F02-S08", "E07-F01-S01", "E21-F01-S01"],
    spec_refs=["DESIGN_BRIEF §6.7", "docs/design/cs-web-admin/ (to be produced)"],
    goal="All admin surfaces in one PR family. ScanProgress (E13-F02-S07) plugs into the libraries detail page.",
    acceptance=[
        "Dashboard: counts + last-scan summary + recent scans table",
        "Libraries: list + detail (with `ScanProgress`) + add CTA",
        "Users: list with role chips that admins can change inline",
        "Permissions: per-user grants with library + per-course overrides",
        "Responsive: desktop-first; works at 360 (tables become row lists)",
    ],
    spec_diff="yes — admin endpoints (already drafted in E07/E10) + `GET /admin/dashboard` aggregator",
    codegen="yes",
    design="yes — produce bundle first",
    substeps=[
        "**Design pre-step**: produce `cs-web-admin` bundle",
        "spec edits + regen",
        "handlers + projections (dashboard reads count tables)",
        "pages composition",
    ],
)

# ============================================================ E15 ============
add(
    id="E15-F01-S01",
    epic="E15", epic_title="Mobile foundations",
    feature="F01", feature_title="App skeleton",
    title="Flutter bootstrap, theme from tokens",
    duration=2, stage="A",
    deps=["E03-F01-S02"],
    spec_refs=["AGENTS.md §7.7", "DESIGN.md §8"],
    goal="Skeleton with feature-folder layout, BLoC dependencies, theme derived from generated tokens.",
    acceptance=[
        "`flutter analyze` clean",
        "`flutter test` passes (single smoke test)",
        "Token demo screen renders all tokens",
    ],
    design="yes",
    tests="golden of the token demo screen",
    substeps=[
        "`flutter create` + reorganize to layout in DESIGN.md §8",
        "add `flutter_bloc`, `equatable`, `dio`, `drift`, `flutter_secure_storage`, `widgetbook`",
        "`app.dart` builds `ThemeData.fromTokens()`",
    ],
)

add(
    id="E15-F01-S02",
    epic="E15", epic_title="Mobile foundations",
    feature="F01", feature_title="App skeleton",
    title="Wire generated Dio client with bearer interceptor",
    duration=1, stage="A",
    deps=["E02-F02-S03", "E15-F01-S01"],
    spec_refs=["DESIGN.md §8.5"],
    goal="One configured Dio + generated client used everywhere.",
    acceptance=[
        "`Authorization: Bearer <token>` injected for `/api/v1/*`",
        "401 triggers token clear via the auth cubit",
    ],
    substeps=[
        "`core/api/dio_factory.dart`",
        "interceptor reading from `flutter_secure_storage`",
        "expose typed `apiClient` from a single getter",
    ],
)

add(
    id="E15-F01-S03",
    epic="E15", epic_title="Mobile foundations",
    feature="F01", feature_title="App skeleton",
    title="AuthCubit + AuthHttpClient (mobile sign-in/out)",
    duration=2, stage="A",
    deps=["E15-F01-S02", "E04-F02-S02"],
    spec_refs=["DESIGN.md §8.5", "DESIGN.md §10.6"],
    goal="Mobile mirrors the web bearer flow.",
    acceptance=[
        "`AuthCubit` emits Unauthenticated, Authenticating, Authenticated(user), Failed",
        "Token persists across restarts",
    ],
    tests="bloc_test on the cubit; widget test on login",
    substeps=[
        "`AuthHttpClient` over Dio with `signUp`, `signIn`, `signOut`, `getSession`",
        "`AuthCubit` + secure storage",
        "root `BlocProvider`",
        "minimal login screen (final design lands in E18-F03-S01)",
    ],
)

add(
    id="E15-F02-S01",
    epic="E15", epic_title="Mobile foundations",
    feature="F02", feature_title="Local DB",
    title="Drift schema + DAOs",
    duration=2, stage="A",
    deps=["E15-F01-S01"],
    spec_refs=["DESIGN.md §8.2"],
    goal="Local persistence for cache + outbox + downloads.",
    acceptance=[
        "Migrations run cleanly on cold start",
        "DAOs cover the queries the BLoCs need (no widget code touches Drift)",
    ],
    substeps=[
        "tables: `cached_courses`, `cached_sections`, `cached_lessons`, `progress_outbox`, `bookmarks_outbox`, `notes_outbox`, `downloaded_lessons`",
        "DAOs per table",
        "migration helper for future versions",
    ],
)

# ============================================================ E16 ============
add(
    id="E16-F01-S01",
    epic="E16", epic_title="Widgetbook",
    feature="F01", feature_title="Widgetbook bootstrap",
    title="widgetbook/main.dart + canary use case",
    duration=1, stage="A",
    deps=["E15-F01-S01"],
    spec_refs=["AGENTS.md §7.8"],
    goal="A separately-buildable Widgetbook entry catalogs all mobile widgets.",
    acceptance=[
        "`flutter run -t widgetbook/main.dart` shows the catalog",
        "One canary widget has use cases per state",
    ],
    substeps=[
        "add `apps/mobile/widgetbook/main.dart`",
        "register a canary widget (`AppButton` placeholder)",
        "add `pnpm dev:widgetbook` script wrapping the Flutter command",
    ],
)

# ============================================================ E17 ============
def stub_mobile_primitive(sid, title, deps_extra=None, duration=1):
    add(
        id=sid,
        epic="E17", epic_title="Mobile widget catalog",
        feature="F01", feature_title="Mobile primitives",
        title=title, duration=duration, stage="A",
        deps=["E16-F01-S01"] + (deps_extra or []),
        spec_refs=["docs/design/cs-foundations/", "docs/design/shared/tokens.json"],
        goal=f"Flutter equivalent of the web {title}.",
        acceptance=["Widgetbook use case per state matches the bundle", "Uses Tokens.* (no hard-coded values)"],
        design="yes",
    )

add(
    id="E17-F01-S01",
    epic="E17", epic_title="Mobile widget catalog",
    feature="F01", feature_title="Mobile primitives",
    title="IconCS Flutter widget — port the 61 icons",
    duration=3, stage="A",
    deps=["E16-F01-S01"],
    spec_refs=["docs/design/shared/icons.jsx"],
    goal="The same 61 named glyphs available as a single `IconCS` widget, portable across web and mobile.",
    acceptance=[
        "`IconCS(name: IconName.play, size: 16, fill: true)` renders the same glyph as the web component",
        "61 named values in an enum (includes `at`, `banner`, `github` added with the auth bundle)",
    ],
    design="yes",
    tests="golden test per icon at 16/20/24",
    substeps=[
        "write a custom `Painter` (or small SVG rasterizer) for each glyph, derived from `shared/icons.jsx`",
        "enum + a `Map<IconName, IconPainter>` lookup",
    ],
)

stub_mobile_primitive("E17-F01-S02", "AppButton, AppIconButton (Flutter)", deps_extra=["E17-F01-S01"], duration=2)
stub_mobile_primitive("E17-F01-S03", "AppTextField, AppNumberField, AppSearchField, AppDropdown, AppSwitch, AppCheckbox, AppRadio", deps_extra=["E17-F01-S01"], duration=3)
stub_mobile_primitive("E17-F01-S04", "AppCard, AppRow, AppTabs, AppSegmented", deps_extra=["E17-F01-S01"], duration=2)
stub_mobile_primitive("E17-F01-S05", "AppBanner, AppToast, AppAlert", deps_extra=["E17-F01-S01"], duration=1)
stub_mobile_primitive("E17-F01-S06", "AppDialog, AppBottomSheet", deps_extra=["E17-F01-S02"], duration=1)
stub_mobile_primitive("E17-F01-S07", "AppProgressLinear, AppProgressCircle, AppSpinner, AppSkeleton", duration=1)
stub_mobile_primitive("E17-F01-S08", "AppEmptyState, AppErrorState", deps_extra=["E17-F01-S01", "E17-F01-S02"], duration=1)
stub_mobile_primitive("E17-F01-S09", "AppAvatar with role badges", duration=1)
stub_mobile_primitive("E17-F01-S10", "AppChip", deps_extra=["E17-F01-S01"], duration=1)

add(
    id="E17-F02-S01",
    epic="E17", epic_title="Mobile widget catalog",
    feature="F02", feature_title="Mobile domain widgets",
    title="CourseCard (poster / wide / compact in Flutter)",
    duration=3, stage="A",
    deps=["E17-F01-S01", "E17-F01-S07"],
    spec_refs=["docs/design/cs-components/components.jsx §CourseCard", "DESIGN_BRIEF §5.1"],
    goal="Flutter equivalent of the web CourseCard family.",
    acceptance=[
        "Same prop surface as the web component (variant, course, state, resumeAt)",
        "Same state matrix; Widgetbook use cases per state",
    ],
    design="yes",
)

add(
    id="E17-F02-S02",
    epic="E17", epic_title="Mobile widget catalog",
    feature="F02", feature_title="Mobile domain widgets",
    title="Mobile LessonRow including download state",
    duration=2, stage="A",
    deps=["E17-F01-S01", "E17-F01-S04", "E17-F01-S07"],
    spec_refs=["docs/design/cs-components/components.jsx §LessonRow (mobile branch)", "DESIGN_BRIEF §5.2"],
    goal="The web LessonRow plus mobile-specific `downloadState` in the trailing area.",
    acceptance=[
        "Trailing icon by state (check / spinner / cloud-down / alert) per the bundle's exact mapping",
        "Tapping the cloud-down icon enqueues download (intercepted by the feature layer, not the widget)",
    ],
    design="yes",
)

add(
    id="E17-F02-S03",
    epic="E17", epic_title="Mobile widget catalog",
    feature="F02", feature_title="Mobile domain widgets",
    title="Mobile-landscape PlayerChrome with edge gestures",
    duration=3, stage="A",
    deps=["E17-F01-S01", "E17-F01-S02"],
    spec_refs=["docs/design/cs-components/components.jsx §PlayerChrome (pc-mobile-landscape)", "docs/design/cs-mobile-lesson-player/", "DESIGN_BRIEF §5.3", "DESIGN_BRIEF §7.6"],
    goal="The mobile-landscape variant of PlayerChrome — edge-gesture hints, no PiP button.",
    acceptance=[
        "Double-tap left/right surfaces an edge hint and seeks ±10s",
        "Pinch-from-corners gesture dismisses to portrait",
        "Subtitle / speed pickers are bottom sheets",
        "States from web variant carry over",
    ],
    design="yes",
)

add(
    id="E17-F02-S04",
    epic="E17", epic_title="Mobile widget catalog",
    feature="F02", feature_title="Mobile domain widgets",
    title="Bookmark, BookmarkAdd, NoteEditor (Flutter equivalents)",
    duration=2, stage="A",
    deps=["E17-F01-S01", "E17-F01-S02", "E17-F01-S03"],
    spec_refs=["docs/design/cs-components/components.jsx §Bookmark / NoteEditor"],
    goal="Mobile equivalents of E13-F02-S04 + E13-F02-S05.",
    acceptance=["Same state matrices as web", "Self-evident sync indicator inline"],
    design="yes",
)

add(
    id="E17-F02-S05",
    epic="E17", epic_title="Mobile widget catalog",
    feature="F02", feature_title="Mobile domain widgets",
    title="ProgressBadge (Flutter — ring/bar/pill)",
    duration=1, stage="A",
    deps=["E17-F01-S01"],
    spec_refs=["docs/design/cs-components/components.jsx §ProgressBadge"],
    goal="Flutter equivalent of E13-F02-S06.",
    acceptance=["Three variants, four states, identical to web"],
    design="yes",
)

add(
    id="E17-F02-S06",
    epic="E17", epic_title="Mobile widget catalog",
    feature="F02", feature_title="Mobile domain widgets",
    title="DownloadRow (mobile-only) — full state machine",
    duration=2, stage="A",
    deps=["E17-F01-S01", "E17-F01-S07"],
    spec_refs=["docs/design/cs-components/components.jsx §DownloadRow", "DESIGN_BRIEF §5.7"],
    goal="One row per lesson in the downloads manager.",
    acceptance=[
        "Props: `lesson, course, sizeBytes, state (queued|downloading|paused|ready|failed), progress (0..1), accent`",
        "Visual per state matches the bundle exactly (queued/downloading/paused/ready/failed)",
        "Action area: cancel (downloading/queued) / refresh (failed) / overflow menu (ready)",
    ],
    design="yes",
)

add(
    id="E17-F02-S07",
    epic="E17", epic_title="Mobile widget catalog",
    feature="F02", feature_title="Mobile domain widgets",
    title="NavigationShell (mobile — bottom tab bar with 5 tabs)",
    duration=2, stage="A",
    deps=["E17-F01-S01"],
    spec_refs=["DESIGN_BRIEF §7"],
    goal="The persistent shell. iOS large title; Android Material 3 parallax.",
    acceptance=[
        "5 tabs: Home · Browse · Downloads · Search · Settings, with `IconCS` glyphs",
        "iOS: large title that collapses on scroll (Home tab)",
        "Android: Material 3 parallax for the same surface",
        "Active tab uses filled icon variant where one exists",
    ],
    design="yes",
)

add(
    id="E17-F02-S08",
    epic="E17", epic_title="Mobile widget catalog",
    feature="F02", feature_title="Mobile domain widgets",
    title="PasswordField (Flutter) — visibility toggle + strength meter",
    duration=2, stage="A",
    deps=["E17-F01-S01", "E17-F01-S03"],
    spec_refs=["docs/design/shared/auth.jsx §PasswordField", "docs/design/cs-mobile-auth/"],
    goal="Flutter equivalent of E13-F02-S09. Shared by mobile sign-in, sign-up, and password-reset screens.",
    acceptance=[
        "Constructor: `PasswordField({ required controller, label, withMeter = false, autofillHints, hint })`",
        "44px hit-target on mobile (overrides the web 36px default)",
        "Eye/eye-off action button toggles `obscureText`",
        "When `withMeter`, the same heuristic as web (Empty/Weak/Okay/Strong) renders below the field",
        "Widgetbook use cases: Empty, Filled (visible), Filled (masked), Focused, Error, Disabled, WithMeter (each strength)",
    ],
    design="yes",
    tests="bloc_test on a small `PasswordStrength` helper; widget test on toggle + obscureText state",
)

add(
    id="E17-F02-S09",
    epic="E17", epic_title="Mobile widget catalog",
    feature="F02", feature_title="Mobile domain widgets",
    title="SsoBlock (Flutter) — provider button list",
    duration=1, stage="A",
    deps=["E17-F01-S02", "E17-F01-S01"],
    spec_refs=["docs/design/shared/auth.jsx §SsoBlock", "docs/design/cs-mobile-auth/"],
    goal="Flutter equivalent of E13-F02-S10.",
    acceptance=[
        "Constructor: `SsoBlock({ required List<SsoProvider> providers })`",
        "Empty list renders nothing",
        "Each provider rendered as an `AppButton` (secondary) with the configured icon + label",
        "Widgetbook use cases: Default (3), GoogleOnly, GitHubOnly, SSOOnly, Empty",
    ],
    design="yes",
    notes=(
        "v1 leaves `providers` empty (PRD lists OAuth at v2+). Plumbing exists so v2 only needs to populate the list "
        "and the SsoBlock starts rendering."
    ),
)

# ============================================================ E18 ============
add(
    id="E18-F01-S01",
    epic="E18", epic_title="Mobile features",
    feature="F01", feature_title="Browsing",
    title="Stage A · Home tab (cs-mobile-home)",
    duration=3, stage="A",
    deps=["E17-F02-S01", "E17-F02-S07", "E15-F02-S01", "E14-F01-S01"],
    spec_refs=["docs/design/cs-mobile-home/", "DESIGN_BRIEF §7.3"],
    goal="Mirrors web Home in mobile idiom: large title, two horizontal carousels, quick-link buttons, pull-to-refresh.",
    acceptance=[
        "Sections: Continue watching, Recently added, Quick links (Downloads, Library)",
        "Pull-to-refresh",
        "States: Default, Empty, Loading skeleton, Error",
    ],
    design="consumes existing",
    tests="integration_test on the screen; bloc_test on its Cubit",
    substeps=[
        "`HomeCubit` with Loading | Loaded | Empty | Failed states",
        "screen composition",
    ],
)

add(
    id="E18-F01-S02",
    epic="E18", epic_title="Mobile features",
    feature="F01", feature_title="Browsing",
    title="Stage B · Browse tab (precede with cs-mobile-browse)",
    duration=3, stage="B",
    deps=["E17-F02-S01", "E17-F02-S07"],
    spec_refs=["DESIGN_BRIEF §7.4", "docs/design/cs-mobile-browse/ (to be produced)"],
    goal="Grid of poster CourseCards; filter bottom sheet; sort.",
    acceptance=[
        "2 columns at narrow widths, 3 at tablet widths",
        "Filter button opens a bottom sheet (status, library, duration, instructor)",
        "Empty / loading / error states",
    ],
    design="yes — produce bundle first",
    substeps=[
        "**Design pre-step**: produce `cs-mobile-browse` bundle",
        "BrowseCubit + screen",
    ],
)

add(
    id="E18-F01-S03",
    epic="E18", epic_title="Mobile features",
    feature="F01", feature_title="Browsing",
    title="Stage B · Mobile Course detail (precede with cs-mobile-course-detail)",
    duration=4, stage="B",
    deps=["E17-F02-S01", "E17-F02-S02", "E17-F02-S07"],
    spec_refs=["DESIGN_BRIEF §7.5", "docs/design/cs-mobile-course-detail/ (to be produced)"],
    goal="Course screen on mobile with download CTA + per-lesson download states.",
    acceptance=[
        "Hero collapsing on scroll",
        "Primary `Resume`/`Start` + secondary `Download course` (with size estimate)",
        "Sections expanded by default; LessonRow shows download state",
        "Per-lesson download tap enqueues to the DownloadsBloc (E19)",
        "States: default, in-progress, completed, no-access, mid-download, mostly-downloaded, all-downloaded",
    ],
    spec_diff="yes — `GET /courses/{id}/download-estimate` (sums sizes across permitted lessons)",
    codegen="yes",
    design="yes — produce bundle first",
    substeps=[
        "**Design pre-step**: produce `cs-mobile-course-detail`",
        "spec edits + regen",
        "CourseDetailCubit",
        "screen composition; tap-to-download wires to DownloadsBloc",
    ],
)

add(
    id="E18-F02-S01",
    epic="E18", epic_title="Mobile features",
    feature="F02", feature_title="Lesson player",
    title="Stage A · Mobile player BLoC + portrait/landscape lesson screen",
    duration=4, stage="A",
    deps=["E17-F02-S03", "E17-F02-S04", "E15-F02-S01"],
    spec_refs=["docs/design/cs-mobile-lesson-player/", "DESIGN.md §8.1", "DESIGN_BRIEF §7.6"],
    goal="Event-driven player BLoC; portrait shows player + tabs; landscape shows immersive PlayerChrome.",
    acceptance=[
        "Portrait: 16:9 player + tab strip (Sections / Notes / Bookmarks / Materials)",
        "Landscape: full-screen player + edge-revealed PlayerChrome",
        'Offline indicator: "Watching offline" when source is local file (from E19)',
        "Sleep timer affordance in the settings overlay",
        "States: Loading, Playing, Paused, Buffering, EndOfLesson, Error, WatchingOffline",
        "Throttled tick → `progress_outbox` write every 10s (sync handled by E20)",
    ],
    design="consumes existing",
    tests="bloc_test + integration_test",
    substeps=[
        "events + states per DESIGN.md §8.1",
        "BLoC + repository injection",
        "portrait + landscape screens",
        "write-through to `progress_outbox`",
    ],
)

add(
    id="E18-F03-S01",
    epic="E18", epic_title="Mobile features",
    feature="F03", feature_title="Auth & settings",
    title="Stage A · Mobile sign in / sign up / forgot (cs-mobile-auth)",
    duration=4, stage="A",
    deps=["E15-F01-S03", "E17-F02-S08", "E17-F02-S09", "E17-F01-S05", "E14-F02-S01"],
    spec_refs=["docs/design/cs-mobile-auth/", "docs/design/shared/auth.jsx", "DESIGN_BRIEF §7.2"],
    goal="Single-pane mobile auth surfaces — sign-in, 3-step sign-up wizard, 3-step forgot — sharing form logic with web.",
    acceptance=[
        "Three feature screens: `lib/features/auth/presentation/{sign_in_screen,sign_up_screen,forgot_screen}.dart`",
        "44px hit-target inputs, large titles, sticky primary action at the bottom",
        "Compose `AppBrand` + `PasswordField` (E17-F02-S08) + `SsoBlock` (E17-F02-S09) + `AppBanner` for errors/rate-limit",
        "Sign-up wizard: `SignUpCubit` with 3 states (Account, Verify, Library); identical state shape to web",
        "Forgot wizard: `ForgotCubit` with 3 states (Request, Sent, NewPassword)",
        "First-user bootstrap reuses the web's `GET /admin/has-users` and `GET /admin/instance` endpoints (defined in E14-F02-S01)",
        "Email-verification step rendered only when `instance.emailVerificationRequired == true`",
        "SSO row rendered only when `instance.ssoProviders.isNotEmpty` (empty in v1)",
        "Step-3 library setup calls `POST /libraries` against the same backend endpoint",
        "iOS: bottom-anchored primary CTA with safe-area inset; Android: same with system gesture region respected",
    ],
    spec_diff="reuses E14-F02-S01's `GET /admin/instance` and `GET /admin/has-users` (no new endpoints)",
    codegen="no",
    design="consumes existing — `docs/design/cs-mobile-auth/`",
    tests="bloc_test on `SignUpCubit` + `ForgotCubit`; integration_test for happy-path sign-in and first-user signup",
    substeps=[
        "auth feature folder under `lib/features/auth/`",
        "`SignInCubit` (delegates to `AuthCubit` from E15-F01-S03)",
        "`SignUpCubit` with 3-step state machine; calls Better Auth `signUp` then optionally email-verify endpoint",
        "`ForgotCubit` with 3-step state machine; calls Better Auth `forgotPassword` / `resetPassword`",
        "screens compose the new catalog widgets",
        "first-user check via `AuthHttpClient.hasUsers()` on app boot; if false, route to sign-up",
    ],
    notes=(
        "Pairs tightly with E14-F02-S01 — same backend contract, same UX shape. Implement E14-F02-S01 first; "
        "this story reuses its `/admin/*` endpoints unchanged."
    ),
)

add(
    id="E18-F03-S02",
    epic="E18", epic_title="Mobile features",
    feature="F03", feature_title="Auth & settings",
    title="Stage B · Search + Settings tabs (precede with cs-mobile-search-settings)",
    duration=3, stage="B",
    deps=["E17-F02-S07"],
    spec_refs=["DESIGN_BRIEF §7.8", "docs/design/cs-mobile-search-settings/ (to be produced)"],
    goal="Search results (grouped Courses/Lessons) + Settings list (Profile, Appearance, Playback, Account).",
    acceptance=["Recent searches when field is empty", "Sign-out at the bottom of Settings with destructive treatment"],
    design="yes — produce bundle first",
    substeps=[
        "**Design pre-step**: produce `cs-mobile-search-settings`",
        "SearchCubit + SettingsCubit",
        "screens",
    ],
)

# ============================================================ E19 ============
add(
    id="E19-F01-S01",
    epic="E19", epic_title="Mobile offline",
    feature="F01", feature_title="Download manager",
    title="DownloadsBloc with resumable encrypted downloads",
    duration=4, stage="A",
    deps=["E18-F02-S01", "E15-F02-S01"],
    spec_refs=["PRD.md FR-OFF-01..04", "DESIGN.md §8.3"],
    goal="BLoC-managed queue with byte-range resumption and AES-GCM encryption at rest.",
    acceptance=[
        "Pause + resume + retry",
        "Survives app kill and OS reboot (subject to platform background limits)",
        "Per-item progress emitted as state",
    ],
    tests="bloc_test + integration_test simulating a flaky network",
    substeps=[
        "events: `EnqueueLesson`, `EnqueueCourse`, `Pause`, `Resume`, `Cancel`, `Retry`",
        "file writer with byte-range continuation",
        "device-bound key in secure storage",
        "background scheduling via `workmanager` (Android), `BGTaskScheduler` (iOS)",
    ],
)

add(
    id="E19-F01-S02",
    epic="E19", epic_title="Mobile offline",
    feature="F01", feature_title="Download manager",
    title="Offline-first lesson resolution",
    duration=2, stage="A",
    deps=["E19-F01-S01"],
    spec_refs=["PRD.md FR-OFF-05"],
    goal="Player picks local file when available; falls back gracefully when missing.",
    acceptance=[
        "When `downloaded_lessons[lessonId].state == READY`, player uses local path",
        "Switching networks doesn't interrupt offline-sourced playback",
        "Deleted local file falls back gracefully and re-marks the download as failed",
    ],
    tests="integration_test toggling connectivity",
    substeps=[
        "resolution helper consulted by `PlayerBloc`",
        "integrity check (size match) before play",
    ],
)

add(
    id="E19-F01-S03",
    epic="E19", epic_title="Mobile offline",
    feature="F01", feature_title="Download manager",
    title="Stage B · Downloads tab UI (precede with cs-mobile-downloads)",
    duration=3, stage="B",
    deps=["E19-F01-S01", "E17-F02-S06"],
    spec_refs=["DESIGN_BRIEF §7.7", "docs/design/cs-mobile-downloads/ (to be produced)"],
    goal="Storage usage + grouped sections (In progress / Downloaded / Failed).",
    acceptance=[
        "Top: storage usage (CourseShelf used / total available)",
        "Sections: In progress, Downloaded (per-course with delete-all), Failed",
        'Empty: "Nothing downloaded yet — open a course and tap the download icon."',
        "Network-aware banner when offline",
    ],
    design="yes — produce bundle first",
    tests="integration_test",
    substeps=[
        "**Design pre-step**: produce `cs-mobile-downloads` bundle",
        "screen composes `DownloadRow` widgets",
        "storage usage from `path_provider` + Drift sums",
    ],
)

# ============================================================ E20 ============
add(
    id="E20-F01-S01",
    epic="E20", epic_title="Mobile sync",
    feature="F01", feature_title="Sync engine",
    title="SyncBloc with connectivity + ticker triggers",
    duration=3, stage="A",
    deps=["E19-F01-S01"],
    spec_refs=["PRD.md FR-PROG-04", "DESIGN.md §8.4", "DESIGN.md §10.4"],
    goal="BLoC-driven sync with predictable trigger rules and observable state.",
    acceptance=[
        "Outbox empties on reconnect within one tick window",
        "Conflict (server `updatedAt` > client) results in client overwrite from server",
        "Sync state exposed via `SyncState` (Idle, Syncing, Failed)",
    ],
    tests="bloc_test + integration_test simulating offline → online",
    substeps=[
        "events: ConnectivityChanged, AppResumed, Tick, ManualSync",
        "`SyncRepository` orchestrates each outbox in chronological order",
        "expose `Stream<SyncState>` via `RepositoryProvider`",
    ],
)

# ============================================================ E21 ============
add(
    id="E21-F01-S01",
    epic="E21", epic_title="Admin & operations",
    feature="F01", feature_title="Dashboard backend",
    title="GET /admin/dashboard aggregator",
    duration=2, stage="A",
    deps=["E10-F01-S01", "E07-F01-S01"],
    spec_refs=["PRD.md FR-OPS-02"],
    goal="Single endpoint returning library/user counts, last scan summary, error count over 24h.",
    acceptance=["Admin-only route", "Reads from existing projections; no new domain logic"],
    spec_diff="yes",
    codegen="yes",
)

add(
    id="E21-F01-S02",
    epic="E21", epic_title="Admin & operations",
    feature="F01", feature_title="Dashboard backend",
    title="POST /admin/backups (DB snapshot archive)",
    duration=2, stage="A",
    deps=["E04-F02-S03"],
    spec_refs=["PRD.md FR-OPS-03"],
    goal="Admin-triggered metadata DB backup; produces a single downloadable archive.",
    acceptance=["Archive includes Prisma schema + data dump (sqlite copy or pg_dump)", "Returns a signed download URL"],
    spec_diff="yes",
    codegen="yes",
)

add(
    id="E21-F02-S01",
    epic="E21", epic_title="Admin & operations",
    feature="F02", feature_title="Hardening",
    title="Rate limit on Better Auth sign-in",
    duration=1, stage="A",
    deps=["E04-F02-S03"],
    spec_refs=["PRD.md NFR-S-03"],
    goal="5 sign-in attempts per 15 min per IP, reverse-proxy-friendly (trust X-Forwarded-For).",
    acceptance=["6th attempt within window returns 429 with retry-after", "IPv4 + IPv6 supported"],
    substeps=[
        "Nest middleware in front of `/api/auth/sign-in*`",
        "in-memory store for v1; Redis swap-in deferred",
    ],
)

add(
    id="E21-F02-S02",
    epic="E21", epic_title="Admin & operations",
    feature="F02", feature_title="Hardening",
    title="CSP + secure headers (Helmet) tuned for SPA + bearer",
    duration=2, stage="A",
    deps=["E11-F01-S01"],
    spec_refs=["AGENTS.md §7.4", "DESIGN.md §7.3"],
    goal="Mitigate the bearer-token-in-localStorage XSS risk.",
    acceptance=[
        "CSP forbids inline scripts, third-party origins (default-src 'self')",
        "Build-time hashes for any unavoidable inline",
        "Lighthouse 'Best practices' >= 95",
    ],
    tests="e2e asserting CSP headers on `/` and `/api/v1/*`",
    substeps=[
        "Helmet config",
        "forbid `v-html` outside an explicit allowlist via ESLint rule",
    ],
)

# ============================================================ E22 ============
add(
    id="E22-F01-S01",
    epic="E22", epic_title="CI/CD",
    feature="F01", feature_title="GH Actions",
    title="Reusable setup action (Node + pnpm + Flutter cache)",
    duration=1, stage="A",
    deps=["E01-F02-S01"],
    goal="A composite action `actions/setup-cs` other workflows reuse.",
    acceptance=["Caches `~/.pnpm-store`, `~/.pub-cache`, Flutter SDK", "Used by every other CI job"],
)

add(
    id="E22-F01-S02",
    epic="E22", epic_title="CI/CD",
    feature="F01", feature_title="GH Actions",
    title="ci.yml with parallel jobs per app/package",
    duration=2, stage="A",
    deps=["E22-F01-S01"],
    goal="Fan out: lint, typecheck, test:api, test:web, test:contract, flutter analyze, flutter test.",
    acceptance=["All jobs run on PR; required for merge", "Codegen-no-diff job: runs `pnpm gen:all` then `git diff --exit-code`"],
)

add(
    id="E22-F01-S03",
    epic="E22", epic_title="CI/CD",
    feature="F01", feature_title="GH Actions",
    title="Storybook test-runner job",
    duration=1, stage="A",
    deps=["E22-F01-S01", "E12-F01-S01"],
    goal="Builds Storybook static + runs the test-runner against it.",
    acceptance=["Fails on story errors and failed interactions"],
)

add(
    id="E22-F01-S04",
    epic="E22", epic_title="CI/CD",
    feature="F01", feature_title="GH Actions",
    title="Visual regression (Storybook test-runner snapshots) + manual approval label",
    duration=2, stage="A",
    deps=["E22-F01-S03"],
    goal="Detect visual diffs in stories; require a `visual-approved` label to merge when diffs exist.",
    acceptance=["PR comment with diff thumbnails", "Required label gate"],
)

add(
    id="E22-F01-S05",
    epic="E22", epic_title="CI/CD",
    feature="F01", feature_title="GH Actions",
    title="Flutter golden test job",
    duration=1, stage="A",
    deps=["E22-F01-S01", "E16-F01-S01"],
    goal="Runs `flutter test --update-goldens=false` and fails on diffs.",
    acceptance=["Goldens stored under `test/goldens/`", "Diff artifacts uploaded on failure"],
)

add(
    id="E22-F01-S06",
    epic="E22", epic_title="CI/CD",
    feature="F01", feature_title="GH Actions",
    title="release.yml — build + publish API+web Docker image to GHCR",
    duration=2, stage="A",
    deps=["E22-F01-S02"],
    goal="Tagged release builds and publishes a multi-arch image.",
    acceptance=["Image: ghcr.io/<org>/courseshelf:{tag,latest}", "amd64 + arm64"],
)

# ============================================================ E23 ============
add(
    id="E23-F01-S01",
    epic="E23", epic_title="Distribution & docs",
    feature="F01", feature_title="Docker image and compose",
    title="Multi-stage Dockerfile (api + built web SPA)",
    duration=2, stage="A",
    deps=["E22-F01-S06"],
    goal="One image runs the API and serves the built web SPA.",
    acceptance=["Final image < 300MB", "Healthcheck wired"],
)

add(
    id="E23-F01-S02",
    epic="E23", epic_title="Distribution & docs",
    feature="F01", feature_title="Docker image and compose",
    title="docker-compose.yml (sqlite default) + docker-compose.postgres.yml",
    duration=1, stage="A",
    deps=["E23-F01-S01"],
    goal="Two compose files: minimal default + Postgres alternative.",
    acceptance=["Volumes documented", "First-run experience matches PRD §8"],
)

add(
    id="E23-F02-S01",
    epic="E23", epic_title="Distribution & docs",
    feature="F02", feature_title="Documentation",
    title="Top-level README + quickstart + screenshots",
    duration=2, stage="A",
    deps=["E14-F03-S01", "E18-F02-S01"],
    goal="Anyone can clone and have all three apps running locally inside 15 minutes.",
    acceptance=["Quickstart section verified end-to-end", "Screenshots taken from Stage A prototypes"],
)

add(
    id="E23-F02-S02",
    epic="E23", epic_title="Distribution & docs",
    feature="F02", feature_title="Documentation",
    title="Seed ADRs (10 entries)",
    duration=2, stage="A",
    deps=["E04-F02-S03"],
    spec_refs=["AGENTS.md §6.2"],
    goal="Capture the *why* of contentious decisions so future contributors don't relitigate them.",
    acceptance=[
        "ADR-0001 Monorepo with pnpm + Turborepo",
        "ADR-0002 Spec-first OpenAPI as the single source of truth",
        "ADR-0003 DDD/CQRS without event sourcing",
        "ADR-0004 Better Auth with bearer tokens for both clients",
        "ADR-0005 Nuxt SPA (no SSR)",
        "ADR-0006 BLoC/Cubit on mobile",
        "ADR-0007 Storybook + Widgetbook as the catalogs",
        "ADR-0008 SQLite default, Postgres opt-in",
        "ADR-0009 Direct progressive streaming for v1 (HLS deferred)",
        "ADR-0010 Design system authored in Claude Design; tokens.json is the SoT",
    ],
)

add(
    id="E23-F02-S03",
    epic="E23", epic_title="Distribution & docs",
    feature="F02", feature_title="Documentation",
    title="Contributor docs covering the spec-first and design-first workflows",
    duration=2, stage="A",
    deps=["E14-F01-S01"],
    spec_refs=["AGENTS.md §6.3", "AGENTS.md §6.4"],
    goal="Two short, copy-pasteable runbooks.",
    acceptance=[
        "`docs/contributing/spec-first.md` walks through edit YAML → bundle → gen → DTOs → command → controller → tests",
        "`docs/contributing/design-first.md` walks through Claude Design → handoff bundle → catalog component → page",
    ],
)


# -------------------------------------------------------------------------- #
# Renderers                                                                  #
# -------------------------------------------------------------------------- #

# Index by id for quick lookup
BY_ID = {s["id"]: s for s in S}


def fmt_dep_link(dep_id):
    """Markdown link to a dep file with the dep's title."""
    dep = BY_ID.get(dep_id)
    if not dep:
        return f"[{dep_id}](./{dep_id}.md) — _(unknown)_"
    return f"[{dep_id}](./{dep_id}.md) — {dep['title']}"


def fmt_acceptance(items):
    if not items:
        return "_To be defined when picked up._\n"
    return "\n".join(f"- {a}" for a in items) + "\n"


def fmt_substeps(items):
    if not items:
        return "- [ ] _Decompose when picking this up._\n"
    return "\n".join(f"- [ ] {x}" for x in items) + "\n"


def fmt_spec_refs(items):
    if not items:
        return "_None_\n"
    return "\n".join(f"- {r}" for r in items) + "\n"


def render_task(s):
    deps_section = (
        "\n".join(f"- {fmt_dep_link(d)}" for d in s["deps"])
        if s["deps"]
        else "_None_"
    )
    notes_body = s["notes"] if s.get("notes") else "_Empty initially; agent fills in during work._"
    duration_str = f"{s['duration']} day{'s' if s['duration'] != 1 else ''}"

    parts = [
        f"# {s['id']} — {s['title']}",
        "",
        f"**Status:** ⬜ Not started",
        f"**Stage:** {s['stage']}",
        f"**Owner:** {s['owner']}",
        f"**Estimated duration:** {duration_str}",
        "",
        f"**Epic:** {s['epic']} — {s['epic_title']}",
        f"**Feature:** {s['feature']} — {s['feature_title']}",
        "",
        "## Dependencies",
        "",
        deps_section,
        "",
        "## Spec / Design references",
        "",
        fmt_spec_refs(s["spec_refs"]).rstrip(),
        "",
        "## Goal",
        "",
        s["goal"],
        "",
        "## Acceptance",
        "",
        fmt_acceptance(s["acceptance"]).rstrip(),
        "",
        "## Spec diff",
        "",
        s["spec_diff"],
        "",
        "## Codegen impact",
        "",
        s["codegen"],
        "",
        "## Design impact",
        "",
        s["design"],
        "",
        "## Tests",
        "",
        s["tests"] or "_To be defined when picked up._",
        "",
        "## Sub-steps",
        "",
        fmt_substeps(s["substeps"]).rstrip(),
        "",
        "## Notes",
        "",
        notes_body,
        "",
        "---",
        "",
        "**Status legend:** ⬜ Not started · 🔄 In progress · 🚫 Blocked · ⏸ Paused · ✅ Done",
        "",
        "When marking done, also:",
        "",
        "1. Tick all sub-step checkboxes above.",
        "2. Add `- Completed: YYYY-MM-DD` and `- Result: <PR link>` under the Notes heading.",
        "3. Update the same row in `../TODO.md` (`- [ ]` → `- [x]`).",
        "",
    ]
    return "\n".join(parts)


def write_tasks():
    for s in S:
        (TASKS / f"{s['id']}.md").write_text(render_task(s))


# ----- TODO.md -----

def write_todo():
    by_epic = {}
    for s in S:
        by_epic.setdefault(s["epic"], []).append(s)

    out = ["# CourseShelf — TODO\n",
           "\nFlat checklist with all stories. Click a story ID to open its task file.\n",
           "Tick the box (`- [ ]` → `- [x]`) when the task is done; the task file's\n",
           "Status field changes to ✅ Done at the same time.\n",
           "\nLegend: **A** = implementable now from the bundle · **B** = needs design pre-step.\n",
           "\nProgress: `0 / " + str(len(S)) + "` complete (update by hand or via a pre-commit hook).\n"]

    for epic in sorted(by_epic.keys()):
        rows = by_epic[epic]
        epic_title = rows[0]["epic_title"]
        out.append(f"\n## {epic} — {epic_title}\n\n")
        for s in rows:
            deps_str = ""
            if s["deps"]:
                deps_str = " · ⇐ " + ", ".join(s["deps"])
            stage = f"`{s['stage']}`"
            out.append(f"- [ ] [{s['id']}](./tasks/{s['id']}.md) {stage} — {s['title']}{deps_str}\n")

    (OUT / "TODO.md").write_text("".join(out))


# ----- ROADMAP.md (Gantt) -----

def gantt_id(story_id):
    """Mermaid task IDs need to be alphanumeric; lowercase the dashes out."""
    return story_id.replace("-", "").lower()


def write_roadmap():
    out = ["# CourseShelf — Roadmap (Gantt)\n",
           "\nMermaid Gantt of every story, grouped by epic. Dependencies encoded via `after`.\n",
           "Durations are estimates; adjust as you go.\n",
           "\nGitHub renders Mermaid in markdown; if your viewer does not, paste the\n",
           "block into <https://mermaid.live>.\n",
           "\n```mermaid\n",
           "gantt\n",
           "    title CourseShelf v1 implementation\n",
           "    dateFormat  YYYY-MM-DD\n",
           "    axisFormat  %b %d\n",
           "    excludes weekends\n",
           "\n",
          ]

    by_epic = {}
    for s in S:
        by_epic.setdefault(s["epic"], []).append(s)

    start_date = "2026-04-25"  # placeholder; the first task's anchor

    for epic in sorted(by_epic.keys()):
        rows = by_epic[epic]
        epic_title = rows[0]["epic_title"].replace(":", " —")
        out.append(f"    section {epic} {epic_title}\n")
        for s in rows:
            sid = gantt_id(s["id"])
            label = s["title"][:60].replace(":", " —")
            tag = "active" if s["stage"] == "A" else "crit"
            if s["deps"]:
                deps = " ".join(gantt_id(d) for d in s["deps"])
                out.append(
                    f"    {label:60s} :{tag}, {sid}, after {deps}, {s['duration']}d\n"
                )
            else:
                out.append(
                    f"    {label:60s} :{tag}, {sid}, {start_date}, {s['duration']}d\n"
                )
        out.append("\n")

    out.append("```\n")

    out.append(dedent("""
        ## Reading the chart

        - **Active (lighter)** — Stage A stories implementable directly from the
          bundle.
        - **Critical (darker / red-tinted)** — Stage B stories that require a
          design pre-step before implementation. Treat the duration as
          "design + build."

        ## Sequencing notes

        For a single-track contributor, walk epics in this order: E00 → E01 →
        E02 → E03 → E04 → E05 → E06 → E07 → E08 → E09 → E10 → E11 → E12 → E13 →
        E14 → E15 → E16 → E17 → E18 → E19 → E20 → (E21 in parallel) → E22 → E23.

        For two parallel tracks once E10 lands:

        - **Track A (web)**: E11 → E12 → E13 → E14
        - **Track B (mobile)**: E15 → E16 → E17 → E18 → E19 → E20

        Stage B design pre-steps are independently sequenceable — produce a
        bundle while implementation continues on Stage A stories.

        ## Re-generating

        This file (and every task file) is generated by
        `docs/roadmap/tools/generate.py` from a story registry. Edit story
        metadata in the script, then re-run the generator. Avoid
        hand-editing the chart — it'll get clobbered.
        """))

    (OUT / "ROADMAP.md").write_text("".join(out))


# ----- README.md -----

def write_readme():
    total = len(S)
    stage_a = sum(1 for s in S if s["stage"] == "A")
    stage_b = total - stage_a

    by_epic = {}
    for s in S:
        by_epic.setdefault(s["epic"], []).append(s)
    epic_lines = []
    for epic in sorted(by_epic.keys()):
        rows = by_epic[epic]
        epic_lines.append(
            f"- **{epic}** {rows[0]['epic_title']} — {len(rows)} stor{'y' if len(rows) == 1 else 'ies'}"
        )

    parts = [
        "# CourseShelf — Roadmap",
        "",
        "This directory holds the executable plan for CourseShelf v1: 115 stories",
        "in 24 epics, each with a one-file task spec and a checkbox in `TODO.md`.",
        "The roadmap is the static plan; the live work log is `specs/tasks/active.md`.",
        "",
        "## Files",
        "",
        "- **[`TODO.md`](./TODO.md)** — flat checklist of every story, grouped by",
        "  epic. Click any ID to open its task file. Tick the box when the story",
        "  ships.",
        "- **[`ROADMAP.md`](./ROADMAP.md)** — Mermaid Gantt of the same stories",
        "  with dependencies and duration estimates.",
        f"- **[`tasks/`](./tasks)** — one markdown file per story (`{total}` files).",
        "  Each file follows the `feature.md` template: status, dependencies,",
        "  goal, acceptance, spec/codegen/design impact, tests, sub-steps, notes.",
        "- **[`tools/generate.py`](./tools/generate.py)** — regenerates",
        "  `README.md`, `TODO.md`, `ROADMAP.md`, and every `tasks/<ID>.md` from a",
        "  single in-script story registry.",
        "",
        "## Counts",
        "",
        f"- Total stories: **{total}**",
        f"  - Stage A (implementable directly from the design bundle): **{stage_a}**",
        f"  - Stage B (needs a design pre-step): **{stage_b}**",
        "",
        "## Epics",
        "",
        *epic_lines,
        "",
        "## Two trackers, one direction",
        "",
        "The roadmap is **the plan**. The task stack at `specs/tasks/active.md`",
        "is **what is happening right now**. Carry both:",
        "",
        "| | Roadmap (`docs/roadmap/`) | Task stack (`specs/tasks/`) |",
        "|---|---|---|",
        "| Lives forever | yes | `active.md` while in flight, `done.md` forever |",
        "| Granularity | one story = one card | one feature pass = one entry |",
        "| Statuses | ⬜ → ✅ on merge | `in-progress` / `blocked` / shipped |",
        "| Source of truth for *what is being built right now* | no | **yes** |",
        "| Source of truth for *what is on the v1 plan* | **yes** | no |",
        "",
        "## How an agent picks up a story",
        "",
        "1. Open `TODO.md` and find the next unchecked story whose dependencies",
        "   are all ✅.",
        "2. Open the linked `tasks/<ID>.md` file and read **Spec / Design",
        "   references**, **Goal**, **Acceptance**, sub-steps. If anything is",
        "   ambiguous, leave a question under **Notes** and stop.",
        "3. Push a fresh entry to the top of `specs/tasks/active.md` using the",
        "   `specs/tasks/templates/feature.md` template. The card under",
        "   `tasks/<ID>.md` stays at ⬜ Not started until the story actually ships",
        "   — the `active.md` entry is where progress is tracked while in flight.",
        "4. Do the work. Tick sub-step boxes inside the `active.md` entry as you",
        "   land them. If you get stuck, flip `Status: blocked` and document the",
        "   blocker.",
        "5. When the PR merges:",
        "   - Move the `active.md` entry to the top of `specs/tasks/done.md` with",
        "     `- Completed: YYYY-MM-DD` and `- Result: <PR link>`.",
        "   - Edit `tasks/<ID>.md`: change **Status** to ✅ Done, tick the",
        "     sub-step list, append `- Completed: YYYY-MM-DD` and",
        "     `- Result: <PR link>` under **Notes**.",
        "   - Edit `TODO.md`: change the matching `- [ ]` to `- [x]`.",
        "",
        "Use `🚫 Blocked` in `tasks/<ID>.md` only after a story was started and",
        "got blocked by an external dependency; document the blocker under",
        "**Notes**.",
        "",
        "## Status legend",
        "",
        "| Glyph | Meaning |",
        "|---|---|",
        "| ⬜ | Not started |",
        "| 🔄 | In progress (rare — `active.md` is the primary marker) |",
        "| 🚫 | Blocked (see Notes) |",
        "| ⏸ | Paused (see Notes) |",
        "| ✅ | Done |",
        "",
        "## Six non-negotiables that ride on every story",
        "",
        "These come from `.claude/CLAUDE.md` and `AGENTS.md`. Apply them without",
        "being asked.",
        "",
        "1. **Spec-first.** If the story changes an HTTP route, the",
        "   `packages/specs/openapi/openapi.yaml` edit is sub-step #1 and",
        "   `pnpm spec:validate && pnpm spec:bundle && pnpm spec:codegen` is",
        "   sub-step #2. For real-time channels, edit",
        "   `packages/specs/asyncapi/centrifugo.yaml` first. Codegen artefacts",
        "   land in their own commit.",
        "2. **Live work log.** No coding starts without an entry in",
        "   `specs/tasks/active.md`. The card in `tasks/<ID>.md` is the *plan*;",
        "   the `active.md` entry is the *log*.",
        "3. **Catalog-first.** Any new visual primitive starts as a `@app/ui`",
        "   Storybook story (web) or a `ui_flutter` Widgetbook use case (mobile),",
        "   each with a colocated spec. Pages and screens compose from the",
        "   catalog; they never inline a one-off primitive.",
        "4. **Domain-first.** Aggregates, value objects, and invariants come",
        "   before persistence and controllers. CQRS handlers route through",
        "   `apps/backend` modules; raw `process.env` reads are forbidden — use",
        "   `AppConfig`.",
        "5. **Better Auth owns auth.** No custom JWT, hashing, session, or",
        "   refresh plumbing. If a story seems to need one, stop and find the",
        "   plugin.",
        "6. **Design upstream of code.** UI stories reference a path under",
        "   `docs/design/<slug>/`. Stage B stories produce that bundle as their",
        "   first sub-step.",
        "",
        "Quality gate for every story:",
        "`turbo run lint test typecheck && pnpm format && pnpm stylelint:fix &&",
        "pnpm check:i18n`, plus `flutter analyze && flutter test` for mobile work.",
        "",
        "## Re-generating",
        "",
        "Everything in this directory is regenerated by",
        "`docs/roadmap/tools/generate.py`. The script reads a single in-script",
        "story registry and emits all files. Edit story metadata in the script",
        "and re-run:",
        "",
        "```sh",
        "python3 docs/roadmap/tools/generate.py",
        "```",
        "",
        "Outputs land in `docs/roadmap/` (the script resolves its target",
        "directory from `__file__`). Hand-edited notes inside a `tasks/<ID>.md`",
        "file are not preserved by the generator — copy them out before",
        "regenerating, or only run the generator after porting them into the",
        "in-script registry.",
        "",
        f"> Last generated: {datetime.now().strftime('%Y-%m-%d')}",
        "",
    ]
    (OUT / "README.md").write_text("\n".join(parts))


# -------------------------------------------------------------------------- #
# Run                                                                        #
# -------------------------------------------------------------------------- #

if __name__ == "__main__":
    write_tasks()
    write_todo()
    write_roadmap()
    write_readme()

    # Sanity checks
    ids = {s["id"] for s in S}
    for s in S:
        for d in s["deps"]:
            if d not in ids:
                print(f"WARNING: {s['id']} depends on unknown {d}")
    duplicates = [i for i in ids if sum(1 for s in S if s["id"] == i) > 1]
    if duplicates:
        print(f"WARNING: duplicate IDs: {duplicates}")

    print(f"Generated {len(S)} task files in {TASKS}")
    print(f"Outputs in {OUT}")
