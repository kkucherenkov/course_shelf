# Repository quick-reference

Greenfield monorepo. Three apps, one backend, one auth system, one source of truth for every wire contract, one design system.

## Working agreement (read before anything else)

Five rules that govern _how_ you work here, independent of what you are
building. They apply to every task, including one-line fixes.

### 1. Answer in Russian

All prose addressed to the maintainer is in **Russian**. Code, identifiers,
file paths, commit messages, code comments, and everything committed to this
repository stay in **English** — the codebase has one language and it is not
the conversation's.

### 2. Plan before you touch anything

Every task starts with a plan, not an edit. Read the code the change
touches, trace the real flow end to end, then say what you intend to do
before doing it. For anything larger than a one-line fix, that plan becomes
an entry at the top of `specs/tasks/active.md` (see **Task stack** below)
_before_ the first edit — not after.

If the task is ambiguous, if there is an architectural fork, or if a library
has to be chosen, ask **first**. A plan built on a guess costs more than the
question.

### 3. Update the documentation in the same pass

A change is not done when the code works. If the change alters behaviour,
structure, contracts, or setup, the docs that describe it change **in the
same commit or PR**:

| You changed                                                           | Update                                                                        |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| A route or channel                                                    | `packages/specs/` **first** (spec-first loop below)                           |
| Architecture, a bounded context, a data flow                          | `docs/architecture.md`, and an ADR under `docs/adr/` if the _decision_ is new |
| User-visible behaviour, admin flows, folder/`course.json` conventions | `docs/user-guide.md`                                                          |
| Setup, ports, versions, env vars                                      | `README.md` **and** `README.ru.md` (they are kept in sync)                    |
| A CI gate, a script, a command                                        | the section of `.claude/CLAUDE.md` or `README.md` that names it               |
| A story's status                                                      | its card in `docs/roadmap/tasks/`, `TODO.md`, and `specs/tasks/done.md`       |

**Never leave a document asserting something that is no longer true.** A
stale claim is worse than no claim — see
`docs/audit/2026-08-29-plan-vs-code.md` for what a repository looks like when
this rule is skipped for a few months.

### 4. Long-term memory lives in `dnote` and `tuxedo`, not in the chat

Both are host-side CLIs, not repo dependencies. Two roles, no overlap:

| Tool     | Holds                                                        | Test                 |
| -------- | ------------------------------------------------------------ | -------------------- |
| `tuxedo` | **what still has to be done** — open tasks, deadlines        | a verb in the future |
| `dnote`  | **what was learned** — gotchas, rationale, invariants, links | a fact in the past   |

Project key for both: `+course_shelf` / book `course_shelf`.

```sh
tuxedo add "TEXT +course_shelf @backend due next friday"
tuxedo list --json          # N shifts after done/del/archive — re-list before mutating
dnote find "keyword" -b course_shelf
dnote add course_shelf -c "TEXT"
```

**Open a task** when the maintainer asks for something not being done right
now, when you find a defect or debt outside the current change (a task, never
a silent fix), or when you are blocked. Not for what you finish in the same
reply.

**Write a note** only when it will outlive the session **and** cannot be
derived from the repo: why a fork was resolved the way it was, a toolchain
gotcha whose workaround is not obvious from the code, an invariant whose
violation breaks something non-obviously. Never a retelling of the diff, the
file layout, git history, or this file. `dnote find` first — edit an existing
note instead of adding a duplicate.

### 5. Record every change in the dnote changelog

One dedicated note holds the project's change history, newest first.

```sh
dnote find "CHANGELOG course_shelf"   # locate it — the id is stable but find is safer
dnote view <id>                        # read the current body
dnote edit <id> -c "<new entry>

<existing body>"                       # prepend; dnote edit replaces the whole body
```

One entry per landed change, in this format:

```
YYYY-MM-DD · Что сделали — кратко, по сути изменений.
```

Substance, not ceremony: what changed and why it matters, not which files were
touched. This is separate from `specs/tasks/done.md` (per-task record, with
sub-steps and PR links) and from the knowledge notes in rule 4 — the changelog
is the flat chronology you read to answer "what happened to this project?".

Append before you report the work as finished.

## Layout

```
apps/backend    NestJS 11 + Prisma 7 + CQRS + Better Auth
apps/web        Nuxt 4 (SPA, ssr:false) + Nuxt UI v4 + Tailwind 4 + @app/ui + @nuxtjs/i18n
apps/mobile     Flutter 3.44 + flutter_bloc + get_it + Dio
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

No `--` separator before args — pnpm forwards them verbatim, and a literal
`--` makes vitest silently ignore the filter (runs the full suite) and makes
Playwright treat the flag as a test-file regex (`Error: No tests found`).

```sh
# backend (vitest)
pnpm --filter @app/backend test src/path/to/file.spec.ts
pnpm --filter @app/backend test -t "test name pattern"

# web (vitest + @nuxt/test-utils)
pnpm --filter @app/web test app/components/Foo.spec.ts

# @app/ui (vitest)
pnpm --filter @app/ui test src/Button/Button.spec.ts

# mobile (Flutter)
cd apps/mobile && flutter test test/path/to/file_test.dart

# e2e (Playwright)
pnpm e2e --grep "smoke"
```

## GitHub issues — card bookkeeping (REQUIRED)

**GitHub is the sole repo.** The card in `docs/roadmap/tasks/` is always the
source of truth; issues are stable URLs for cross-referencing, nothing more.

**Mirroring covers E15–E20 and every v2 epic (E25–E31).** Issues are titled
`[<card-id>] <title>`, with one umbrella per epic titled `[<epic-id>] <name>`.

- **v1 (E00–E24):** only E15–E20 were mirrored — 133 issues. E00–E14 and
  E21–E24 never were: the practice started mid-project and was not backfilled,
  and backfilling a finished milestone would be archaeology, not tracking. Do
  not go looking for an issue for `E13-F02-S01` and conclude the work is
  untracked — check the card.
- **v2 (E25–E31):** fully mirrored from the start — 36 story issues plus 7
  umbrellas, all on the **`v2 — Transcript-first`** milestone.

New v2 work gets a card, an issue on that milestone, and a line in the epic's
umbrella. Put every one of a card's issue numbers in the PR body as `Closes #N`.

**Look up a card's issues.** Filter by the `[<card-id>]` _prefix_
— a plain search also returns other cards' issues that merely _mention_ the id in
their title (e.g. `[E18-F03-S01] … (from E15-F01-S03)` is E18's, not E15's):

```sh
gh issue list --state all --search "<card-id> in:title" \
  --json number,title,state \
  --jq '[.[] | select(.title | startswith("[<card-id>]"))]'
```

**Opening a PR for a card:** put a `Closes #N` line for **each** of the card's
issues in the PR body. GitHub only recognises `#N` — `Closes <card-id>` does
nothing, so the merge won't auto-close and you'll have to close by hand. `Closes`,
`Fixes`, and `Resolves` all work; GitHub closes them when the PR merges to `main`.

**If a PR already merged without `Closes #N`** (issues still open), the completion
is real — close them and record it:

```sh
gh issue close <N> --reason completed --comment "Closed by PR #<pr> (<card-id>)."
```

**When a card is marked ✅ Done** (see the task-stack rules), reconcile its issues
in the same pass: confirm every story issue is closed, and once **all** cards
under an epic are Done, close the epic's umbrella issue too.

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

<!-- REPOWISE:START — Do not edit below this line. Auto-generated by Repowise. -->

## IMPORTANT: Codebase Intelligence Instructions for courseShelf

> This repository is indexed by [Repowise](https://repowise.dev).
> Use the MCP tools below for orientation, discovery, and enriched context
> (documentation, ownership, history, decisions). **Always verify against
> actual source files before making changes** — the index may be stale.

Last indexed: 2026-05-19 (commit 9899cf5)

### Entry Points

- `packages/ui/src/components/IconCS/index.ts`
- `packages/specs/src/index.ts`
- `packages/ui/src/index.ts`
- `apps/backend/src/common/auth/decorators/index.ts`
- `apps/backend/src/common/catalog-tokens/index.ts`
- `apps/backend/src/common/learning-events/index.ts`
- `apps/backend/src/common/learning-progress/index.ts`
- `apps/backend/src/main.ts`
- `docs/design/cs-components/app.jsx`
- `docs/design/cs-foundation/app.jsx`

### Tech Stack

**Languages:** Node.js, TypeScript

**Infra:** Turborepo### Hotspots (High Churn)
| File | Churn | 90d Commits | Owner |
|------|-------|-------------|-------|
| `packages/specs/src/openapi-types.ts` | 99.9th %ile | 32 | Kirill Kucherenkov |
| `packages/api-client-ts/src/generated/types.gen.ts` | 99.8th %ile | 30 | Kirill Kucherenkov |
| `packages/api-client-dart/lib/generated/lib/src/api/catalog_api.dart` | 99.7th %ile | 11 | Kirill Kucherenkov |
| `apps/backend/src/modules/catalog/application/commands/run-scan.handler.spec.ts` | 99.6th %ile | 11 | Kirill Kucherenkov |
| `packages/api-client-dart/lib/generated/lib/src/api/learning_api.dart` | 99.4th %ile | 5 | Kirill Kucherenkov |

### Repowise MCP Tools

This project has a Repowise MCP server configured. These tools provide documentation, ownership, architectural decisions, and risk signals. Use them for orientation and discovery — then read actual source to verify before editing.

**Recommended workflow:**

1. Start with `get_overview()` on a new task to orient yourself.
2. Call `get_context(targets=["path/to/file.py"])` for enriched context on unfamiliar files — but always read the source before editing.
3. Call `get_risk(targets=["path/to/file.py"])` before changing hotspot files.
4. Don't know where something lives? Call `search_codebase(query="authentication flow")`.
5. Need to understand why code is structured a certain way? Call `get_why(query="why JWT over sessions")` before architectural changes.
6. After **architectural changes**, consider calling `update_decision_records(action="create", ...)` to record the rationale.
7. Need to understand how two modules connect? Call `get_dependency_path(source="src/auth", target="src/db")`.
8. Before cleanup tasks, call `get_dead_code()` to find confirmed unused code.
9. For documentation or diagrams, call `get_architecture_diagram(scope="src/auth")`.

**Note:** MCP tool responses reflect the last index run. If the index is stale, verify against source files.

| Tool                                          | When to use                                    |
| --------------------------------------------- | ---------------------------------------------- |
| `get_overview()`                              | Orient yourself on a new task                  |
| `get_context(targets=[...])`                  | Enriched context on unfamiliar files           |
| `get_risk(targets=[...])`                     | Before changing hotspot files                  |
| `get_why(query="...")`                        | Before architectural changes                   |
| `update_decision_records(action=...)`         | After architectural changes — record decisions |
| `search_codebase(query="...")`                | When locating code                             |
| `get_dependency_path(source=..., target=...)` | When tracing module connections                |
| `get_dead_code()`                             | Before any cleanup or removal                  |
| `get_architecture_diagram(scope=...)`         | For visual structure or documentation          |

### Codebase Conventions

**Commands:**

- Build: `pnpm build`
- Test: `pnpm test`
- Lint: `pnpm lint`
- Dev: `pnpm dev`
- Format: `pnpm format`
- Typecheck: `pnpm typecheck`

<!-- REPOWISE:END -->
