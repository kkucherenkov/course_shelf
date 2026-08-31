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

| You changed                                                           | Update                                                                               |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| A route or channel                                                    | `packages/specs/` **first** (spec-first loop below)                                  |
| Architecture, a bounded context, a data flow                          | `docs/architecture.md`, and an ADR under `docs/adr/` if the _decision_ is new        |
| User-visible behaviour, admin flows, folder/`course.json` conventions | `docs/user-guide.md`                                                                 |
| Setup, ports, versions, env vars                                      | `README.md` **and** `README.ru.md` (they are kept in sync)                           |
| A CI gate, a script, a command                                        | the section of `.claude/CLAUDE.md` or `README.md` that names it                      |
| A story's status                                                      | its card in `docs/roadmap/tasks/`, `docs/roadmap/TODO.md`, and `specs/tasks/done.md` |

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

Ports and URLs live in `docker/compose.yml` — read it rather than trusting a
copy here.

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

**Every epic is mirrored.** Issues are titled `[<card-id>] <title>`, with one
umbrella per epic titled `[<epic-id>] <name>`. Every card has an issue — if a
lookup comes up empty, the search was wrong, not the record.

- **v1 (E00–E24):** E15–E20 were mirrored as the work happened, down to
  per-sub-step `task` issues. E00–E14 and E21–E24 were backfilled in one pass
  (#271) — one `story` issue per card plus an epic umbrella, created and
  immediately closed, since the cards were already resolved. They carry no
  milestone and no sub-step issues; the card holds the detail.
- **v2 (E25–E31):** mirrored from the start — 36 story issues plus 7
  umbrellas, all on the **`v2 — Transcript-first`** milestone.

New v2 work gets a card, an issue on that milestone, and a line in the epic's
umbrella. **Put every one of a card's issue numbers in the PR body as
`Closes #N`** — GitHub only recognises `#N`, so `Closes <card-id>` silently does
nothing and you will be closing them by hand.

The recipes — looking issues up by prefix, closing what a merged PR missed,
reconciling a card marked ✅ Done, closing an epic umbrella — live in the
**`card-bookkeeping`** skill. Invoke it when opening a PR for a card, marking a
card Done, or auditing whether a card's issues match its status.

## Commits

Conventional Commits enforced by `commitlint` (see `commitlint.config.mjs`).
`husky` runs `lint-staged` on pre-commit — staged `.ts`/`.vue` get
`eslint --fix` + `prettier --write`, `.scss`/`.css` get `stylelint --fix`,
spec edits trigger `pnpm --filter @app/specs validate`. Don't double-format
manually after staging.

Allowed types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`,
`ci`, `build`, `style`. PRs go through `main` — never push directly.

## Subagents (`.claude/agents/`)

Delegate when the task scope is bounded to one surface. The available agents and
what each covers are listed for you at session start — read that list rather than
a copy here, which goes stale the moment an agent is added.

Each agent file ends with a **Skills** section naming the skills that agent
should reach for. Invoke the skill before writing code in its area, not after.
Those skills come from the host's plugin and global skill set, not from this
repository — if one is missing on the machine you are on, carry on without it
rather than stopping.

### Parallel work

Two or more lanes that touch different surfaces run in parallel, never one
after the other:

1. **Orca first.** If the `orca` CLI is on `PATH`, use Orca orchestration — the
   `orca-cli` skill for worktrees and terminals, the `orchestration` skill when
   lanes need to message each other, wait on one another, or pass a decision
   back. It gives each lane a real worktree and keeps the lanes addressable.
2. **Otherwise fan out subagents** with the `Agent` tool, one per lane, each in
   its own worktree (`isolation: "worktree"`), dispatched in a single message so
   they actually run concurrently.

**Every lane runs as the agent that owns its surface** — a lane touching
`apps/backend` is `backend-engineer`, `apps/web` or `packages/ui` is
`frontend-engineer`, `apps/mobile` is `flutter-engineer`, `packages/specs` is
`spec-writer`. A generic session re-derives from scratch what those files
already say, and skips the skills they name.

Orca spawns a terminal running a command, so name the agent in the command:

```sh
orca terminal create --worktree path:<lane worktree> \
  --command 'claude --agent backend-engineer' --json
```

With the `Agent` tool it is the `subagent_type`. Either way the name is the
agent's `name:` in `.claude/agents/<name>.md`. A lane that genuinely spans two
surfaces is two lanes, not one generic session.

Either way the lane discipline is the same:

- One lane = one worktree = one branch = one PR. Lanes never share a branch.
- Say in each lane's brief which paths belong to other lanes and are therefore
  off limits — file collisions between lanes are the failure mode that costs
  the most to unpick.
- A file two lanes both need (`packages/specs/openapi/openapi.yaml`,
  `docker/compose.yml`, a shared module) belongs to exactly one of them; the
  others wait for that PR to land.
- `specs/tasks/active.md` is the exception — every lane appends its own entry
  at the top and the union is resolved at merge.

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

- Hand-edit generated client output. The two packages differ, so check which
  you are in:
  - `packages/api-client-ts/` — only `src/generated/` is generated; `index.ts`
    and `realtime/` are hand-written.
  - `packages/api-client-dart/` — **everything except `pubspec.yaml`** is
    generated: `lib/`, `doc/` and `test/` alike. There is no nested
    `lib/generated/`, because dart-dio requires `lib/src/` to be the package's
    real `lib/` (see `packages/specs/scripts/codegen.ts` and that package's
    `.openapi-generator-ignore`).
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

## Codebase intelligence (Repowise)

This repository is indexed by [Repowise](https://repowise.dev) and exposes it as
an MCP server; the server supplies its own tool instructions at session start.
Use it for orientation — `get_overview`, `search_codebase`, `get_why`,
`get_risk` — then **read the actual source before changing anything.**

The index is a snapshot and can be months behind `main`. Treat every answer it
gives as a lead, never as the current state of the code. Entry points, hotspots,
dependency lists and script names are all derived from the repository — read the
repository when they matter, rather than a copy that went stale on the day it
was written.

<!-- REPOWISE:START — Do not edit below this line. Auto-generated by Repowise. -->

<!-- REPOWISE:END -->
