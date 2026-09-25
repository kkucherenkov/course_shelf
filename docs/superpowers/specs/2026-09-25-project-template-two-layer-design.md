# A two-layer project template, extracted from this repository

This repository accumulated something worth more than its code: a working
agreement, six subagents, three skills, a task stack whose format was arrived at
by paying for the alternatives, and a list of traps each of which cost a day to
find. None of it is reachable from a new project. This design takes the part
that does not depend on Nuxt or NestJS, puts it where every future project can
install it, and leaves the stack-specific part behind a second layer that is
built when a second project actually needs it.

**Goal:** a new project starts with the process already in place — the task
stack, the lane discipline, the release audit, the deploy verification, and the
traps — and an improvement made in any one project reaches the others without
being copied by hand.

## 1. Decisions

| # | Decision | Why |
| --- | --- | --- |
| D1 | Two repositories, two delivery mechanisms: a Claude Code plugin for behaviour, a GitHub template for in-repo artefacts | A plugin carries `skills/`, `agents/`, `commands/` and `hooks/` and updates everywhere with one command; it cannot put `CLAUDE.md`, `specs/tasks/` or a workflow file into a repository, because those are per-repository by definition. Trying to deliver both through one mechanism means either the skills freeze at copy time or the repository files never arrive. |
| D2 | The plugin repository is its own marketplace | `.claude-plugin/marketplace.json` with `"source": "./"` makes one repository both the catalogue and the plugin, which is how `ponytail` ships. A separate marketplace repository would be a second thing to keep in sync for no gain at this scale, and the manifest already supports listing further plugins when the stack layer arrives. |
| D3 | The six existing agents do not go into the process plugin | Every one is stack-bound: `backend-engineer` is NestJS with CQRS and Prisma, `frontend-engineer` is Nuxt with Tailwind, `spec-writer` is OpenAPI. A new project has no surface for them until it has a stack, and an agent without its surface produces confident work in the wrong idiom. They belong to the layer-2 stack plugin. |
| D4 | Standing rules live in the template's `CLAUDE.md`; triggered procedures live in the plugin's skills | A skill is selected by its `description` matching the task at hand. "Plan before you touch anything" has no trigger — it applies to every task including the one-line fix — so as a skill it would never fire. Rules that are always in force must be in the file that is always in context. |
| D5 | Project facts reach a skill through named sections of `CLAUDE.md`, not a config file | `deploy-verify` needs container names and a health URL; `release-audit` needs personas and routes. A new file format needs a parser, a schema and a validator. A named heading needs none of that, is read by the same human who reads the rest of the file, and is diffed in review like prose. |
| D6 | `/bootstrap` deletes an inapplicable contract section instead of leaving the heading empty | An empty `## Deploy targets` is indistinguishable, to the skill reading it, from a filled one — so `deploy-verify` would run its procedure against nothing and report success. This is the repository's own rule that a stale claim is worse than no claim, applied to a reader that cannot tell it is being lied to. Each skill, finding its section absent, says so and stops rather than guessing. |
| D7 | Layer 2 is a recipe for the parts that rot and a file template for the parts that do not | Dependency versions and scaffolding decay in months; conventions, CI structure and agent definitions do not. A frozen fork would carry this repository's `pnpm.overrides` pin of `vue` at `3.5.39` — a workaround for snapshot loss in `@app/ui` — into projects that have neither Vue snapshots nor the bug. |
| D8 | The stack preset is drafted against a named project, never in the abstract | Written from memory it would encode a recollection of this repository rather than what a new project turned out to require, and speculative scaffolding is the specific way templates die — written once, never exercised, wrong by the time anyone tries it. The trigger is no longer hypothetical: a self-hosted todo/PIM system is the first consumer (section 5). |
| D14 | The recipe is a set of modules with declared dependencies, not one scaffold script | This repository's stack is a superset of what a new project needs, and the dependencies between its parts are neither mutual nor obvious. `specs` without `backend` is pointless because `express-openapi-validator` is a runtime gate rather than a linter; `tokens` without a consumer emits files nobody reads, and the first `git grep` reports every token as dangling. A monolithic script hides those links and hands a backend-less project a spec validator with no spec — the exact debris that makes people stop using a template. |
| D9 | Traps are filed by the task during which they will be looked for, not by where they were found | Seven CI traps currently sit inside `pre-release-audit` because that is the work that uncovered them. In this repository that is harmless: the whole `CLAUDE.md` is always in context. In a plugin, context loads on demand, so a trap about a pending check reporting `conclusion: ""` inside a skill described as "use before cutting a release" will not be read during "why is this PR green with nothing merged". |
| D10 | The three migrated skills are renamed on the way out | `pre-release-audit` becomes `release-audit`, `card-bookkeeping` becomes `issue-bookkeeping`, `deploy-nas` becomes `deploy-verify`. Without a rename, migrating this repository means choosing between deleting the local skill before the plugin version is proven and not installing the plugin until the local one is gone. Different names let both exist during a bake period, which turns an irreversible swap into a parallel run. |
| D11 | This repository becomes the plugin's first consumer, after 1.9.1 ships | A plugin nobody runs accumulates errors that surface in the next project, at the worst moment. Migrating during a release cycle risks the process this repository is currently using to ship, so it waits for the release rather than for a second project. |
| D12 | No version number travels, except a minimum major where a convention depends on it | "Nuxt 4+, because the `app/` layout" is a statement about a convention. "Nuxt 4.0.3" is a statement about a Tuesday. The recipe ends by running the gates and comparing what the generators produced against what it expected, so a stale recipe reports itself instead of emitting a broken tree. |
| D13 | Versioning and discoverability are set in four places, deliberately | `version` and `keywords` in `plugin.json`; `category` and `description` in `marketplace.json`; repository topics via `gh repo edit --add-topic`; a `v*.*.*` git tag per release. Claude Code installs a plugin from git and reads its version from the manifest, so a manifest bump without a tag leaves no recoverable point to roll back to, and a tag without a bump installs as the previous version. |

## 2. Layout

### `shipyard` — the process plugin

```text
shipyard/
  .claude-plugin/
    marketplace.json      # plugins: [shipyard, shipyard-ts-monorepo]
    plugin.json           # name, version, keywords
  skills/
    task-stack/
    lane-discipline/
    release-audit/        # SKILL.md, setup.md, driver.mjs, auth-adapter.mjs
    deploy-verify/
    issue-bookkeeping/
    ci-gates/
  commands/
    bootstrap.md
  stacks/
    ts-monorepo/          # second plugin, phase 4 (section 5)
  README.md
```

### `project-skeleton` — the GitHub template

```text
project-skeleton/
  .claude/CLAUDE.md               # the contract, section 3
  specs/tasks/active/.gitkeep
  specs/tasks/done/.gitkeep
  specs/tasks/README.md
  specs/tasks/templates/feature.md
  .github/workflows/pr-title.yml
  docs/adr/0001-record-architecture-decisions.md
  CONTRIBUTING.md
  README.md
  commitlint.config.mjs
```

### Composing a new project

```sh
gh repo create my-thing --template kkucherenkov/project-skeleton --private --clone
cd my-thing
/plugin marketplace add kkucherenkov/shipyard   # once per machine
/plugin install shipyard
/bootstrap
```

`pr-title.yml` is in the template rather than the stack plugin because a
Conventional Commits gate is the same in every stack. `e2e.yml` is not, because
Playwright is not always the answer — it goes to layer 2.

## 3. The `CLAUDE.md` contract

The template ships this skeleton. Headings marked as read by a skill are the
interface between the two layers.

```markdown
# <PROJECT> — quick reference

## Working agreement
  1. Answer in <LANG>
  2. Plan before you touch anything
  3. Update the documentation in the same pass
  4. Long-term memory lives in dnote and tuxedo   (key +<PROJECT>)
  5. Record every change in the dnote changelog

## Task stack
## Quality gates                  # read by ci-gates
## Never do

<!-- STACK:BEGIN -->
<!-- STACK:END -->

## Deploy targets                 # read by deploy-verify      (optional)
## Issue mirroring                # read by issue-bookkeeping  (optional)
## Audit personas                 # read by release-audit      (optional)
## Audit routes                   # read by release-audit      (optional)
```

`## Quality gates` holds the required check names exactly as branch protection
spells them. This is not documentation: a required check that has not started
yet is absent from `gh pr checks` output, so a gate that counts checks reads an
unstarted one as passing. `ci-gates` compares against these names.

The `STACK:BEGIN` / `STACK:END` markers are owned by the stack plugin, which
rewrites only what is between them. Without markers a reinstall has two bad
options — overwrite the file and lose hand edits, or leave it and never update.

### `/bootstrap`

Four questions: project name, conversation language, stack (`none` or the name
of a stack plugin), and which optional contract sections apply. Then, without
asking: the first ADR, repository topics, and the first task file under
`specs/tasks/active/`.

The project name is one identifier across three systems — the `tuxedo` project
key, the `dnote` book, and the vault folder — because they are queried together.

## 4. Skill inventory

### Moves verbatim

| Source | Skill | Edit |
| --- | --- | --- |
| `specs/tasks/README.md` | `task-stack` | Drop "Entries older than the split"; it is this repository's history. The reasoning for a branch-slug id over a counter, and for separate files over a merge driver, travels intact. |
| `CLAUDE.md` § Parallel work, § A subagent shares your checkout | `lane-discipline` | Paths become placeholders. "A subagent without its own worktree commits to your branch" and "a lane that runs `docker compose up` without its own project name rewrites the dev stack" stay word for word. |
| `.github/workflows/pr-title.yml` | template | Verbatim, including the `edited` trigger it was split out of `ci.yml` to get. |

### Rewritten — procedure stays, facts move to `CLAUDE.md`

| Source | Skill | Facts extracted |
| --- | --- | --- |
| `deploy-nas` | `deploy-verify` | `## Deploy targets`: container names, health URL, image registry, stack name. Portable: find the stack from the running container's `com.docker.compose.project.config_files` label rather than typing a path; image tags are literal, so editing `RELEASE_TAG` in `.env` deploys nothing and reports success; verify with the health endpoint's `version`, never with `Up (healthy)`; keep `compose.yaml.<old>` so rollback needs neither git nor memory; a release carrying a migration is not rollable this way. |
| `card-bookkeeping` | `issue-bookkeeping` | `## Issue mirroring`: card location, id format, milestone name. Portable: `Closes #N` and never `Closes <card-id>`, which silently does nothing; a PR that schedules work carries no `Closes` at all; a progress counter is not a mergeable quantity, since two lanes writing `14 / 36` produce no conflict and lose two cards, so recount with `grep -c` after every merge. |
| `pre-release-audit` | `release-audit` | `## Audit personas`, `## Audit routes`, plus a new `auth-adapter.mjs` holding the sign-in route, the session cookie name and the locale cookie. The driver already reads `AUDIT_BASE`, `AUDIT_OUT`, `AUDIT_CORE`, `AUDIT_ALL` and `AUDIT_PASSWORD` from the environment. Portable: audit the release images and not a dev server, because CSP and minification differ exactly where it matters; restore production-shaped data rather than the seed; a run reporting zero findings is the failure mode and not the result; 20-32/40 is where real interfaces land. |

### Re-filed into `ci-gates`

Seven traps currently inside `pre-release-audit` that are not about auditing:

- `gh` reports an in-progress check as `conclusion: ""`, not `null`, so jq's `//`
  never substitutes and every "is it still running" test passes; gate on
  `.status != "COMPLETED"`.
- A required check that has not started is absent from the check list, which
  reads as passing; gate on the context names from branch protection.
- A baseline regeneration does not re-run the checks: a push as
  `github-actions[bot]` with `GITHUB_TOKEN` deliberately triggers no workflow,
  so a stale red looks like a slow queue.
- A branch carrying a bot commit puts later runs into `action_required`, where
  they never start on their own and do not appear in the PR's check list.
- `for id in $ids` under zsh iterates once over the whole string; it approved
  one of five runs while the output looked complete. Use
  `printf '%s\n' $ids | while read -r id`.
- Wait for CI with the `Monitor` tool; a sleep-and-poll loop spends the lane's
  context on its own output and reports last.
- `docker build … || echo FAILED` exits 0, so a failed build reads as a success
  and the next `compose up` silently runs the previous image. Verify the
  artefact — the image's presence and age — not the exit code.

### Stays behind

The six agents, `handbook.md`, `design-system.md`, `i18n.md`, `migration.md`,
the spec-first loop, and `ci.yml` / `e2e.yml` / `quality.yml` / `release.yml` /
`regen-snapshots.yml`. All of it is layer 2.

## 5. Layer 2 — the stack recipe

Drafted against its first consumer (D8), not in the abstract. Two questions
decide the shape: which parts rot, and which parts a given project even wants.

### What form each part takes

| Part | Form | Why |
| --- | --- | --- |
| Dependencies, application scaffolding | recipe: call the upstream generator | versions rot in months |
| CI workflows | file template | fixed path, stack-specific, structure is not version-bound |
| The five stack agents | file template | bound to the stack, not to time |
| `handbook`, `design-system`, `i18n`, `testing` | file template | conventions outlive major versions |
| Design-token pipeline (JSON to CSS/TS/Dart) | recipe | small enough that rewriting beats carrying |
| `@app/ui` and its 62 exports | does not travel | a domain library, not a skeleton |
| Lockfile, `pnpm.overrides`, pins | does not travel | this is where the `vue` pin lives |

```text
stacks/ts-monorepo/
  SKILL.md
  agents/            # backend-engineer, frontend-engineer, spec-writer,
                     # spec-reviewer, codegen-runner
  templates/
    workflows/
    docs/
    claude-md-block.md    # written between STACK:BEGIN and STACK:END
```

Conventions the recipe carries, none of which depend on a version: the
spec-first loop; `AppConfig` rather than `process.env`; no `any` to escape a
type error; `t()` on every user-visible string; a Storybook story and a
colocated spec per component; BEM with tokens instead of `!important` and
hard-coded hex; codegen artefacts in their own commit.

### The modules (D14)

| Module | Provides | Requires |
| --- | --- | --- |
| `core` | pnpm workspace, turbo, base tsconfig, eslint-config, prettier, commitlint, husky with lint-staged | — |
| `backend` | NestJS, Prisma, `AppConfig`, RFC 9457 errors, URI versioning under `/api/v1` | `core` |
| `web` | Nuxt 4 SPA, Tailwind, Nuxt UI | `core` |
| `specs` | OpenAPI and AsyncAPI, client codegen, `express-openapi-validator` | `backend` |
| `ui` | component package, Storybook, colocated specs | `web` |
| `tokens` | design tokens, JSON to CSS/TS/Dart | `ui` or `mobile` |
| `realtime` | Centrifugo, a JWT endpoint with TTL under five minutes | `backend` |
| `mobile` | Flutter, feature-first layering, bloc with get_it | — |
| `cli` | a TypeScript CLI consuming the generated client | `specs` |
| `docker` | compose, an nginx proxy folding web and API onto one origin | whatever is present |
| `ci` | workflows matched to the modules actually installed | whatever is present |

`cli` does not exist in this repository. It is written for the first consumer
and is a module from the start rather than a special case, because the
dependency it declares — `specs` — is the reason it is cheap at all.

### First consumer

A self-hosted todo and PIM system: personal tasks, projects, contexts,
priorities and tags, with list, kanban and calendar views, a web client, a
mandatory CLI and a mandatory Flutter client. It takes every module except
`realtime`, which is deferred.

Two of its product decisions reach back into the recipe and are recorded here
for that reason. **Sync is offline-first over an operation log**, so every
client module needs a local store and a replay path, and the `specs` module
must carry the operations endpoint before any client is written. **The CLI
cannot authenticate through a browser**, so the session model needs a
device-code flow or scoped personal tokens; handing a CLI a bearer token leaks
it into shell history and process listings. Both belong in the OpenAPI document
on day one — deciding them after the web client exists means rewriting three
clients around a cookie.

Its remaining product design — data model, recurrence (RRULE), view
configuration — is a separate brainstorming cycle with its own spec, and is not
this document's scope.

The stack plugin writes files into the repository, which looks like a
contradiction of section 2 putting fixed-path artefacts in the template. It is
not: a fixed path means *someone must physically place the file*. Which of the
two does it is decided by the second axis, stack-independence. `pr-title.yml`
is stack-independent, so the template places it; `e2e.yml` is not, so the stack
plugin does.

## 6. Migrating this repository

The renames (D10) let both versions coexist, so the order is bake, then delete.

1. Install the plugin alongside the existing `.claude/skills/`.
2. Run each migrated skill once on real work.
3. Delete the local three.
4. Add the contract sections to `.claude/CLAUDE.md`.

| Skill | Baked on | Evidence the generalisation held |
| --- | --- | --- |
| `deploy-verify` | the 1.9.1 deploy | the health endpoint reports `1.9.1` |
| `release-audit` | the pre-1.9.1 run | a score inside the range of prior runs, not zero findings |
| `issue-bookkeeping` | the #807 / #808 PR | both issues closed by the merge, none by hand |
| `task-stack`, `lane-discipline`, `ci-gates` | the next wave | — |

The six agents stay in this repository until the stack plugin exists. Moving
them earlier trades a working process for a tidier layout.

## 7. Work order

| Phase | Work | Depends on |
| --- | --- | --- |
| 0 | #807 / #808, then cut and deploy 1.9.1 | in flight; blocked on removing a root-owned `apps/web/.nuxt` |
| 1 | `shipyard`: manifests, six skills, the trap re-filing, `auth-adapter.mjs` split out of the driver, README, tags | — |
| 2 | `project-skeleton`: the contract, `specs/tasks/`, `pr-title.yml`, `/bootstrap` | — |
| 3 | This repository becomes a consumer: bake, delete, contract sections | 0, 1, 2 |
| 4 | `stacks/ts-monorepo`, drafted then run against the PIM project's scaffold | 2 |

Phases 1 and 2 touch different repositories and run as parallel lanes.

Phase 4 does not wait for phases 1 or 3. The recipe is drafted from this
repository's layout, the PIM scaffold is its first run, and every place it
fails is a recipe fix made the same day — which is D12's self-check performed
by hand the first time. What it does wait for is phase 2, because the project
needs the process layer on day one rather than retrofitted.

Each repository's README is a deliverable of its phase, not an afterthought,
and covers: what the layer is for, what it does not do, install and update, the
contract it expects from the other layer, and one worked example from empty
directory to first commit. The plugin README additionally lists each skill with
its trigger, since a reader deciding whether to install cannot see a
`description` that only Claude reads.

## 8. What this design does not do

- **It does not keep the standing rules in sync.** Rules 1-5 are copied into
  each repository and drift. The upgrade path, if drift starts costing more
  than it saves, is a `SessionStart` hook in the plugin that injects the
  agreement. Not now: a rule in a file is visible to a human reviewer and to a
  contributor without the plugin, and an injected one is visible to neither.
- **It does not make the template a product.** No multi-user concerns, no
  configuration surface beyond the four `/bootstrap` questions, no support for
  a stack nobody has written yet.
- **It does not move the six agents.** They ship with layer 2 or not at all.
- **It does not extract machine-specific traps.** Those in the maintainer's
  memory that concern this workstation — a `zoxide` relative `cd` landing in
  another repository, the `orca-ide` wrapper injecting flags into CLI
  subcommands, neighbouring projects holding ports — stay in `~/.claude`. Only
  traps that hold on any machine travel into the plugin.
