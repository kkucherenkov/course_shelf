# Repository quick-reference

Greenfield monorepo. Three apps, one backend, one auth system, one source of truth for every wire contract, one design system.

## Layout

```
apps/backend    NestJS 11 + Prisma 7 + CQRS + Better Auth
apps/web        Nuxt 4 (SPA, ssr:false) + Nuxt UI v4 + Tailwind 4 + @app/ui + @nuxtjs/i18n
apps/mobile     Flutter 3.41 + flutter_bloc + get_it + Dio
packages/specs  OpenAPI 3.1 + AsyncAPI 3.0 — single source of API truth
packages/ui     brand component library + colocated Storybook + stories
packages/api-client-{ts,dart}   generated clients — never edit by hand
specs/tasks/    active.md (LIFO stack) + done.md (archive)
specs/design/   tokens JSON + optional JSX mockups under mockups/ (primary design reference when provided)
docker/         local stack (postgres 18.1, redis 8.6, centrifugo v6)
```

## Task stack — read every session

1. Before coding: push entry to `specs/tasks/active.md` (template in `specs/tasks/README.md`).
2. Check boxes as you go; flip to `blocked` with reason if stuck.
3. On done: move whole entry to top of `specs/tasks/done.md` with PR link.
4. Never delete from `done.md` — cancelled tasks go there with reason.
5. Session start: **read `active.md` first**.

## Spec-first loop (non-negotiable)

1. Edit `packages/specs/openapi/openapi.yaml` (or `asyncapi/centrifugo.yaml`).
2. `pnpm spec:validate && pnpm spec:bundle && pnpm spec:codegen`.
3. Implement in `apps/backend` — `express-openapi-validator` rejects drift.
4. Consume in `apps/web` / `apps/mobile` via the regenerated client.
5. Land codegen artefacts in their own commit.

## Auto-format before done

After editing `.ts` / `.vue` / `.scss` / `.css` / `.json` / `.md`, run in order:

```sh
pnpm --filter <pkg> lint --fix   # ESLint
pnpm stylelint:fix               # Stylelint
pnpm format                      # Prettier
```

Never hand-fix what a fixer can do. Never add `eslint-disable` without a WHY comment.

## URLs

- API: `/api/v1/<resource>` (URI versioning, default v1)
- Auth: `/api/v1/auth/*` (Better Auth, mounted inside versioning)
- Realtime token: `POST /api/v1/realtime/token` (Centrifugo JWT, TTL ≤5 min)

## Local runtime (Docker Compose)

Stack is **normally running**. Check first: `docker ps --format '{{.Names}} {{.Status}} {{.Ports}}'`

| Service                   | Port     | URL                          |
| ------------------------- | -------- | ---------------------------- |
| **proxy (canonical SPA)** | **8080** | **http://localhost:8080**    |
| web                       | 3001     | http://localhost:3001        |
| backend                   | 3000     | http://localhost:3000/api/v1 |
| postgres                  | 5432     | —                            |
| redis                     | 6379     | —                            |
| centrifugo                | 8000     | ws://localhost:8000          |
| grafana (otel)            | 3200     | http://localhost:3200        |

The nginx `proxy` service folds web + backend onto a single origin so the
browser sees same-origin requests (no CORS, no CORP). Use **8080** in the
browser; 3000/3001 are still published for tooling that bypasses the proxy.

Containers mount the repo as a volume — edits reach the running container automatically. Do NOT start `pnpm dev` if the container is up.

## Common commands

```sh
# spec / codegen
pnpm spec:validate && pnpm spec:bundle && pnpm spec:codegen
pnpm spec:contract-test                  # Dredd/Prism-style contract tests

# design tokens
pnpm design:build                        # JSON → CSS / TS / Dart
pnpm design:audit                        # inventory drift report

# quality gates (whole monorepo)
turbo run lint test typecheck
pnpm format && pnpm stylelint:fix        # Prettier + Stylelint
pnpm check:i18n                          # locale key parity (web + mobile + backend)
pnpm e2e                                 # Playwright (tests/e2e/playwright.config.ts)

# storybook & docker
pnpm --filter @app/ui storybook          # :6006
docker compose -f docker/compose.yml up -d
docker compose -f docker/compose.yml logs -f web --tail=100
docker compose -f docker/compose.yml restart backend
```

### Running a single test

```sh
# backend (vitest)
pnpm --filter @app/backend test -- src/path/to/file.spec.ts
pnpm --filter @app/backend test -- -t "test name pattern"

# web (vitest + @nuxt/test-utils)
pnpm --filter @app/web test -- app/components/Foo.spec.ts

# @app/ui (vitest)
pnpm --filter @app/ui test -- src/Button/Button.spec.ts

# mobile (Flutter)
cd apps/mobile && flutter test test/path/to/file_test.dart

# e2e (Playwright)
pnpm e2e -- --grep "smoke"
```

## Forgejo issues mirror

Every roadmap card in `docs/roadmap/tasks/` is mirrored as a Forgejo issue with title `[<card-id>] <title>`. The card stays the source of truth; the issue is a stable URL for cross-referencing.

```sh
pnpm issues:sync                    # reconcile bodies + open/closed state with the cards
pnpm issues:map                     # print full card-id → #N map
pnpm issues:lookup -- E13-F02-S07   # print just one issue number (e.g. "55")
```

When opening a PR for a card, **use Forgejo's auto-close keyword in the body** so the linked issue closes on merge — don't rely on `pnpm issues:sync` running afterwards:

```
Closes #55
```

(Look up the number with `pnpm issues:lookup -- <card-id>`.) `Closes #N`, `Fixes #N`, and `Resolves #N` all work; Forgejo only closes the issue when the PR merges to the default branch.

## Commits

Conventional Commits enforced by `commitlint` (see `commitlint.config.mjs`).
`husky` runs `lint-staged` on pre-commit — staged `.ts`/`.vue` get
`eslint --fix` + `prettier --write`, `.scss`/`.css` get `stylelint --fix`,
spec edits trigger `pnpm --filter @app/specs validate`. Don't double-format
manually after staging.

Allowed types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`,
`ci`, `build`, `style`. PRs go through `main` — never push directly.

## Subagents (`.claude/agents/`)

Delegate when the task scope is bounded to one of these surfaces:

| Agent               | Use for                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------ |
| `backend-engineer`  | Anything in `apps/backend` (NestJS / CQRS / Prisma)                                                          |
| `frontend-engineer` | `apps/web` and `packages/ui`                                                                                 |
| `flutter-engineer`  | `apps/mobile`                                                                                                |
| `spec-writer`       | Adding/changing routes or channels in `packages/specs`                                                       |
| `spec-reviewer`     | Read-only review of spec changes before merge                                                                |
| `codegen-runner`    | Re-run `spec:validate && spec:bundle && spec:codegen` after a spec edit and stage the diff as its own commit |

## Fix root causes, not symptoms

When a toolchain error appears, prefer a structural fix over a workaround:

- If a CI step fails, fix the config that causes it — don't lower the bar
  (e.g. don't drop coverage thresholds, don't add `--audit-level=critical`
  without reading the advisory, don't `continue-on-error` a real failure).
- If a tsconfig `extends` chain breaks under a bundler, inline or flatten the
  chain. Don't document "run it from a different directory" as the fix.
- If a test coverage denominator blows up, narrow `coverage.include` or
  remove thresholds entirely in a greenfield — don't tune a kostyl number
  that will rot.
- If you find yourself writing a `troubleshooting.md` entry whose "Fix"
  section tells the reader to avoid a command, stop — change the config so
  the command works instead.

`docs/troubleshooting.md` is for upstream bugs you cannot fix locally. Every
entry whose fix lives in _this_ repo's config belongs in the config, not the
docs.

## Things Claude must never do

- Edit `packages/api-client-ts/src/generated/` or `packages/api-client-dart/lib/generated/`.
- Introduce an HTTP route without updating `packages/specs/openapi/openapi.yaml` first.
- Read `process.env` directly — use `AppConfig`.
- Use `any` to escape a type error.
- Ship a user-visible string without `t()` / `AppLocalizations`.
- Ship a `@app/ui` component without a Storybook story + colocated spec.
- Use `!important`, inline `style=""`, or hard-coded hex brand colors.
- Skip updating `specs/tasks/active.md` / `done.md`.
- Commit to `main` without going through a PR.

## Detailed docs

| Topic                                      | File                                                     |
| ------------------------------------------ | -------------------------------------------------------- |
| Backend, CQRS, Prisma, API conventions     | [`.claude/docs/handbook.md`](docs/handbook.md)           |
| Design system, @app/ui, tokens, BEM        | [`.claude/docs/design-system.md`](docs/design-system.md) |
| i18n (web + mobile + backend)              | [`.claude/docs/i18n.md`](docs/i18n.md)                   |
| Testing pyramid, DoD, PR checklist         | [`.claude/docs/testing.md`](docs/testing.md)             |
| Security, observability, a11y, performance | [`.claude/docs/security.md`](docs/security.md)           |
| Feature migration from another project     | [`.claude/docs/migration.md`](docs/migration.md)         |
