# `stacks/monorepo` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `shipyard-monorepo`, a second plugin inside the `shipyard`
repository, carrying six installable modules — `core`, `docker`, `specs`,
`backend`, `cli`, `ci` — plus the four agents and three templates whose modules
are in scope, extracted from the first consumer and proved by generating a tree
from the recipe and diffing it against that consumer.

**Architecture:** One plugin, `stacks/monorepo/`, listed as a second entry in
the existing `.claude-plugin/marketplace.json`. Its skill holds the module graph
and the install procedure; each module is its own file under
`skills/monorepo-stack/modules/`, so a module is one reviewable unit and two
lanes never edit the same file. Parts that rot travel as instructions to call an
upstream generator; parts that do not — CI structure, agent definitions,
convention docs, the `CLAUDE.md` stack block — travel as file templates. A
second validator script, `scripts/check-stack.sh`, enforces the constraints this
plan cannot enforce by reading, and every module task is test-driven against it.

**Tech Stack:** POSIX `sh` (the validators and their table tests, matching
`scripts/check-skills.sh`), Markdown (the skill, modules, agents, docs
templates), JSON (plugin and marketplace manifests), YAML (the workflow
template). The recipe *describes* a pnpm/turbo/TypeScript workspace; the plugin
itself contains no TypeScript.

**Spec:**
`/home/kkucherenkov/projects/petProjects/course_shelf/docs/superpowers/specs/2026-09-25-project-template-two-layer-design.md`
— section 5 defines the module table and the form-per-part table; D7, D8, D12,
D13 and D14 bind this plan; section 7 places it as phase 4.

**Primary source:**
`/home/kkucherenkov/projects/petProjects/course_shelf/docs/superpowers/plans/ts-monorepo-recipe-notes.md`
— 565 lines written task-by-task while the first consumer was built. The
"Learned here" column of each section is the material; a module written without
it is a diff with the reasoning stripped out.

**Consumer snapshot:** `~/projects/petProjects/todoer` at `b9c5fe3` on `main`.
Read it; never copy from it verbatim, and never name it in a committed file.

**Where the work happens:** the `shipyard` repository,
`~/projects/petProjects/shipyard`, on a branch off `main` named
`feat/monorepo-stack`. Nothing in `course_shelf` and nothing in the consumer is
modified by this plan. `shipyard` has no `specs/tasks/` stack of its own — this
plan is the record, and the eleven tasks are its entries.

---

## Global Constraints

Every task's requirements implicitly include this section.

- **No source-project nouns in anything committed.** Forbidden as literal text:
  `course_shelf`, `courseshelf`, `@app/`, `Centrifugo`, `Dockge`, a bare `NAS`,
  card ids shaped `E15-F03`. The consumer's nouns are forbidden on the same
  footing: `@todoer/`, `todoer`.
- **Where the line falls between a technology and a project.** The recipe
  installs real software and must be free to name it: `NestJS`, `Prisma`,
  `Nuxt`, `pnpm`, `turbo`, `PostgreSQL`, `Redocly`, `vitest`, `ESLint`,
  `Prettier` are technology nouns and are allowed inside `stacks/`. So are the
  workspace paths the recipe *prescribes* — `apps/backend`, `apps/cli`,
  `packages/specs` — because in a recipe those are the shape being instructed,
  not a reference to someone's tree. What is forbidden is an **identity** noun:
  a name that only means one existing repository, its package scope, its host,
  or its card numbering. Layer 1 keeps the stricter list, because a process
  skill has no business naming a framework at all; the two lists therefore live
  in two scripts, not one script with a flag. See Task 1.
- **No version number travels**, except a minimum major (or minor) carried
  together with the convention that justifies it — `Node 24.15+, because
  node:sqlite`, never `Node 24.15.0`; `Nuxt 4+, because the app/ layout`, never
  `Nuxt 4.0.3` (D12). A version appearing as **evidence inside a trap** is not a
  pin and stays: "`set -o pipefail` is not POSIX and dash rejected it until
  0.5.12" is a fact about history. What must never appear is a version in an
  **install specifier**: `pkg@1.2.3`, `image: name:1.2-alpine`, `"^1.2.3"`.
- **Committed content is English.** Conversation with the maintainer is Russian.
- **Every trap keeps its evidence** — what was observed, what it looked like,
  what it cost. An instruction whose observation has been compressed away is
  ignored by the next reader, which is the whole reason the capture notes exist.
- **Omit, never disable.** A declined module leaves no disabled workflow job, no
  commented-out target, no stub file, no `if:` guard, no empty heading.
- **No `Co-Authored-By`, no `Claude-Session`, no attribution trailer** in any
  commit or PR body.
- **Conventional Commits.** Match the repository's existing style: imperative
  subject under ~70 characters, scope used where it names a real surface
  (`docs(bootstrap):`, `fix(release-audit):`), body explaining *why*.
- **One branch, one PR**, `feat/monorepo-stack` off `main`. Never commit to
  `main` directly.

## Review Focus

Six rather than five, because the sixth is not hypothetical: the spec's own tree
sketch contains it.

1. **A module that cannot be declined.** A module whose files are reached by
   another module's script cannot be omitted without editing the module that
   reaches it. Pinned by Task 2 (`## Declining this module` is a required
   heading, rule R3, and a module file without it fails the build), by Task 5
   (`specs` must name exactly which steps of `backend` and `cli` disappear with
   it) and by Task 11, which generates a second tree with two modules declined
   and asserts the remaining tree carries no reference to them and still passes
   its gates.
2. **A stack plugin whose skill is never loaded.** The spec sketches
   `stacks/ts-monorepo/SKILL.md` at the plugin root. Claude Code discovers a
   plugin's skills at `<plugin>/skills/<name>/SKILL.md`, so that path makes
   every word in the recipe unreachable, and no text validator notices —
   everything reads correctly and nothing runs. Pinned by Task 1, which installs
   the plugin from the marketplace and fails if the skill does not appear in the
   listing.
3. **A recipe step that names a version.** D12's failure mode: a pin that was
   right on the Tuesday it was written and emits a broken tree six months later.
   Pinned by Task 1's rule R2, which rejects an install specifier carrying a
   version while leaving a floor (`24.15+`) and a version quoted as evidence
   inside a trap alone; every later task runs the validator.
4. **A trap that lost its evidence between the notes and the recipe.** Pinned by
   Task 1's rule R5, the same 200-character floor `check-skills.sh` already
   applies to layer 1 — an instruction under `## Traps` with no observation
   attached fails the build.
5. **The recipe emitting a script the consumer has no command for.** The
   consumer's own documentation described a three-command pipeline of which one
   command had never existed in that repository. Pinned by Task 1's rule R6
   (every `pnpm <word>:<word>` token in stack prose must match a `"<word>:<word>":`
   key in a fenced block somewhere in the plugin) and by Task 11, which runs
   every command the recipe names.
6. **A validation task that passes because it compared nothing.** Pinned by Task
   11's precondition gate: before any diff runs, the generated tree must contain
   a named list of files and `turbo run build typecheck` must exit 0; if either
   fails the task stops and reports failure, and the comparison is not attempted.

---

## What this plan does not do

- **It does not write `web`, `ui`, `tokens` or `mobile`.** The first consumer
  has no web client and no Flutter client, so those four modules would be
  written from a recollection of the source project rather than from what a
  project turned out to need — the speculative scaffolding D8 exists to reject.
  What unblocks them: a named consumer that actually installs them. `web` and
  `ui` unblock together when a project takes a browser client; `tokens` unblocks
  behind whichever of `ui` or `mobile` arrives first, since a token pipeline with
  no consumer emits files nobody reads; `mobile` unblocks on a project with a
  Flutter client. Until then the four are absent from the module table, not
  listed as "planned" — a module table that advertises a module nobody wrote is
  the same lie as an empty contract heading.
- **It does not ship `frontend-engineer` or `flutter-engineer`.** The
  maintainer's principle is that if a module ships, its agent ships with it; read
  the other way, a module that does not ship does not ship its agent.
  `frontend-engineer` is deferred with `web`, `flutter-engineer` with `mobile`.
  The spec's five-agent list omits `flutter-engineer` altogether; that is a gap
  in the sketch, not a decision that `mobile` has no agent, and this plan records
  it so the phase that writes `mobile` does not read the list as exhaustive.
- **It does not invent a `cli-engineer`.** `cli` is in scope as a module and has
  no agent in the source project, so there is no captured practice to
  de-project. The CLI conventions live in the module file, where they were
  learned.
- **It does not widen `scripts/check-skills.sh` to cover `stacks/`.** Its noun
  list forbids `nestjs`, `prisma`, `nuxt`, `apps/backend` and `packages/specs`,
  every one of which the recipe legitimately instructs. See Task 1.
- **It does not touch `realtime`.** Not in the first consumer, not in scope.
- **It does not migrate the source project onto the stack plugin.** That is a
  later phase and it needs this one to exist first.

---

## File Structure

All paths relative to `~/projects/petProjects/shipyard`.

| Path | Responsibility | Task |
| --- | --- | --- |
| `.claude-plugin/marketplace.json` | **modify** — add the second plugin entry, `source: "./stacks/monorepo"` | 1 |
| `scripts/check-stack.sh` | **create** — the stack plugin's own validator: seven rules, disjoint from layer 1's | 1, 2 |
| `scripts/check-stack.test.sh` | **create** — fixture table test for it, same shape as `check-skills.test.sh` | 1, 2 |
| `.github/workflows/check.yml` | **modify** — run both new scripts | 1 |
| `README.md` | **modify** — name the second plugin and what installing it gets you | 1 |
| `stacks/monorepo/.claude-plugin/plugin.json` | **create** — name, version, keywords, repository (D13) | 1 |
| `stacks/monorepo/README.md` | **create** — what the layer is for, what it does not do, install, the contract with layer 1; gains the validation record in Task 11 | 1, 11 |
| `stacks/monorepo/skills/monorepo-stack/SKILL.md` | **create** then **extend** — purpose and omit-never-disable (T1); module graph, dependency rules, decline-and-re-run, the module-file contract (T2) | 1, 2 |
| `…/modules/core.md` | **create** — workspace, build graph, TypeScript, lint, format | 3 |
| `…/modules/docker.md` | **create** — local service dependencies | 4 |
| `…/modules/specs.md` | **create** — the contract, its lint, its generated client package | 5 |
| `…/modules/backend.md` | **create** — the server shell, the schema, write ordering, auth | 6 |
| `…/modules/cli.md` | **create** — a client with a local store and an outbox | 7 |
| `…/modules/ci.md` | **create** — the gates and what a gate has to refuse | 8 |
| `stacks/monorepo/templates/workflows/tests.yml` | **create** — one job per gate, blocks deleted for declined modules | 8 |
| `stacks/monorepo/agents/backend-engineer.md` | **create** — de-projected from the source | 9 |
| `stacks/monorepo/agents/spec-writer.md` | **create** — de-projected from the source | 9 |
| `stacks/monorepo/agents/spec-reviewer.md` | **create** — de-projected from the source | 9 |
| `stacks/monorepo/agents/codegen-runner.md` | **create** — de-projected from the source | 9 |
| `stacks/monorepo/templates/claude-md-block.md` | **create** — what goes between `STACK:BEGIN` and `STACK:END` | 10 |
| `stacks/monorepo/templates/docs/handbook.md` | **create** — backend and TypeScript conventions only | 10 |
| `stacks/monorepo/templates/docs/testing.md` | **create** — pyramid, DoD, PR checklist, the test lessons | 10 |

Why modules are separate files rather than sections of one `SKILL.md`: a skill
loads its body into context whole, and six modules of real content is a page
nobody reads to the end when they only want one of them. `release-audit` already
uses the split (`SKILL.md` plus `setup.md`), so this matches the house pattern.
It also makes one module one task and one review surface, and keeps two lanes
off the same file.

---

### Task 1: The second plugin, and a validator that can see it

**Files:**
- Create: `stacks/monorepo/.claude-plugin/plugin.json`
- Create: `stacks/monorepo/skills/monorepo-stack/SKILL.md`
- Create: `stacks/monorepo/README.md`
- Create: `scripts/check-stack.sh`
- Test: `scripts/check-stack.test.sh`
- Modify: `.claude-plugin/marketplace.json`
- Modify: `.github/workflows/check.yml`
- Modify: `README.md`

**Interfaces:**
- Consumes: nothing.
- Produces: `sh scripts/check-stack.sh <root>` — exits `0` and prints
  `stack ok`, or prints one `FAIL <file>: <reason>` line per problem to stderr,
  a count, and exits `1`. Every later task runs it. Rules R1, R2, R5, R6, R7
  land here; R3 and R4 need the module-file contract and land in Task 2.
  `stacks/monorepo/skills/monorepo-stack/SKILL.md` exists with valid
  frontmatter — Task 2 extends its body, Tasks 3-8 add rows to a table it
  defines.

**Decision recorded here:** `scripts/check-skills.sh` is **not** widened.
Its `check_forbidden_nouns` rejects `nestjs`, `prisma`, `nuxt`, `apps/backend`
and `packages/specs`, which are exactly what a monorepo recipe instructs
installing. Its globs (`"$root"/skills/*/SKILL.md`, `"$root"/commands/*.md`) do
not descend into `stacks/`, so it already ignores the new tree and needs no
change to keep ignoring it. Putting both rule sets in one script behind a mode
flag would place two contradictory noun lists inside one function, and the
temptation would then be to relax the strict one. Two scripts, both wired into
CI.

- [ ] **Step 1: Write the failing test file**

Create `scripts/check-stack.test.sh`. It follows `check-skills.test.sh`'s shape:
a fixture builder, an `expect` helper, cases, a count. Note the `fm_desc` naming
convention from the existing file — POSIX `sh` has no function-local scope, so a
fixture's own description must not be called `desc`.

````sh
#!/usr/bin/env sh
# Table test for check-stack.sh, driven by fixture stack trees.
#
# The rules under test are deliberately NOT check-skills.sh's. A stack recipe
# installs real software and must name it; what it must never carry is an
# identity noun (a name that means one existing repository) or a pinned
# version.
set -u

here=$(dirname "$0")
subject="$here/check-stack.sh"
failures=0

# Build a one-module stack tree in $1. $2 is the SKILL.md body, $3 the body of
# modules/sample.md. Frontmatter is fixed and valid so a case only ever
# exercises the rule it names.
make_stack() {
  root=$1
  skill_body=$2
  module_body=$3
  mkdir -p "$root/stacks/monorepo/skills/monorepo-stack/modules"
  {
    printf -- '---\n'
    printf 'name: monorepo-stack\n'
    printf 'description: Use when scaffolding a monorepo or adding a module.\n'
    printf -- '---\n\n'
    printf '# Monorepo stack\n\n%s\n' "$skill_body"
  } > "$root/stacks/monorepo/skills/monorepo-stack/SKILL.md"
  printf '# sample\n\n%s\n' "$module_body" \
    > "$root/stacks/monorepo/skills/monorepo-stack/modules/sample.md"
}

expect() {
  want=$1
  label=$2
  root=$(mktemp -d)
  make_stack "$root" "$3" "$4"
  sh "$subject" "$root" >/dev/null 2>&1
  got=$?
  rm -rf "$root"
  if [ "$got" -ne "$want" ]; then
    printf 'FAIL want=%s got=%s %s\n' "$want" "$got" "$label" >&2
    failures=$((failures + 1))
  fi
}

# --- R1: identity nouns ---
expect 1 'rejects the source project by name' '' 'Copied from course_shelf.'
expect 1 'rejects the source package scope' '' 'Import from @app/specs.'
expect 1 'rejects the consumer by name' '' 'As todoer does it.'
expect 1 'rejects the consumer package scope' '' 'Import from @todoer/specs.'
expect 1 'rejects a card id' '' 'Tracked as E15-F03 on the board.'
expect 0 'allows a technology noun' '' 'Install NestJS and Prisma under apps/backend.'

# --- R2: pinned versions ---
expect 1 'rejects a pinned dependency specifier' '' 'Run pnpm add prisma@6.19.3 here.'
expect 1 'rejects a pinned image tag' '' '    image: postgres:18.1-alpine'
expect 1 'rejects a pinned range in a manifest block' '' '    "typescript": "^5.6.3"'
expect 0 'allows a floor with its reason' '' 'Node 24.15+, because node:sqlite removes the native dependency.'
expect 0 'allows a version quoted as evidence' '' 'set -o pipefail is not POSIX; dash rejected it until 0.5.12.'

# --- R5: a trap keeps its evidence ---
short_trap='## Traps

**Use a non-default host port.** Otherwise there is a collision.'
expect 1 'rejects a trap with no evidence' '' "$short_trap"

long_trap='## Traps

**Publish the database on a non-default host port.** A developer very likely
already has one listening on the default, and the failure that produces is not
a refused connection but a successful connection to the wrong database — which
reads as a data bug for as long as it takes somebody to notice which instance
they are talking to. A recipe that says "use a non-default port" without that
sentence gets overridden by the next person who finds it inconvenient.'
expect 0 'accepts a trap that carries its evidence' '' "$long_trap"

# --- R6: no script the recipe never creates ---
phantom='Run `pnpm spec:validate && pnpm spec:bundle`.

```json
{ "scripts": { "spec:validate": "redocly lint openapi/openapi.yaml" } }
```'
expect 1 'rejects a pnpm script with no matching key' '' "$phantom"

real='Run `pnpm spec:validate`.

```json
{ "scripts": { "spec:validate": "redocly lint openapi/openapi.yaml" } }
```'
expect 0 'accepts a pnpm script the recipe creates' '' "$real"

# --- R7: relative links resolve ---
expect 1 'rejects a dangling relative link' '' 'See [the core module](modules/core.md).'
expect 0 'accepts a link that resolves' '' 'See [the sample module](sample.md).'

if [ "$failures" -gt 0 ]; then
  printf '%s failing case(s)\n' "$failures" >&2
  exit 1
fi
echo 'check-stack tests ok'
````

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd ~/projects/petProjects/shipyard && sh scripts/check-stack.test.sh`
Expected: every case reports `got=127` (the subject does not exist) and the
script exits `1`.

- [ ] **Step 3: Write the validator**

Create `scripts/check-stack.sh`. Rules R3 and R4 are deliberately absent — they
arrive in Task 2 with the contract they check.

```sh
#!/usr/bin/env sh
# Validate the stack plugin under <root>/stacks/.
#
# A stack recipe is not a process skill and does not take check-skills.sh's
# rules. That script forbids naming a framework, which is the one thing a
# recipe must do. What a recipe must never carry is an IDENTITY noun — a name
# that means exactly one existing repository — or a version pinned into an
# install specifier, because a pin is a statement about the Tuesday it was
# written and the recipe outlives it.
set -u

root=${1:-.}
failures=0
stack_root="$root/stacks"
[ -d "$stack_root" ] || { echo 'no stacks/ to check'; exit 0; }

fail() {
  printf 'FAIL %s: %s\n' "$1" "$2" >&2
  failures=$((failures + 1))
}

files=$(find "$stack_root" -type f \( -name '*.md' -o -name '*.json' \
  -o -name '*.yml' -o -name '*.yaml' \) | sort)
[ -n "$files" ] || { echo 'stack ok'; exit 0; }

oldifs=$IFS
IFS='
'
set -f
for f in $files; do
  dir=$(dirname "$f")

  # R1. Identity nouns. Not technology nouns: a recipe that installs Nest has
  # to be able to say Nest. What it may never say is the name of the project
  # it was extracted from, or of the project it was first proved against — a
  # recipe that names its consumer is a fork of it.
  if grep -qiE 'course.?shelf|@app/|@todoer/|\btodoer\b|dockge|\bnas\b|\bE[0-9]{2}-F[0-9]{2}\b' "$f"; then
    fail "$f" 'carries an identity noun (source project or first consumer)'
  fi

  # R2. A version in an install specifier. Three shapes, and only three: a
  # package specifier, a container image tag, and a quoted range in a manifest
  # block. A floor written "24.15+" matches none of them, and neither does a
  # version quoted inside a trap as evidence ("dash rejected it until 0.5.12"),
  # which is a fact about history rather than an instruction.
  if grep -qE '[A-Za-z0-9._/-]@[0-9]+\.[0-9]+|image: *[A-Za-z0-9./_-]+:[0-9]+\.[0-9]+|"[~^]?[0-9]+\.[0-9]+\.[0-9]+"' "$f"; then
    fail "$f" 'pins a version in an install specifier (D12: a floor, or nothing)'
  fi

  case $f in *.md) ;; *) continue ;; esac

  # R5. Every trap keeps its evidence. Same 200-character floor check-skills.sh
  # applies to layer 1, and for the same reason: an instruction stripped of the
  # observation that earned it is an instruction the next reader overrides.
  short_traps=$(awk '
    /^## Traps/ { inside = 1; next }
    /^## / { inside = 0 }
    inside && /^\*\*/ {
      para = $0
      while ((getline line) > 0 && line != "") para = para " " line
      if (length(para) < 200) print para
    }
  ' "$f")
  if [ -n "$short_traps" ]; then
    inner_ifs=$IFS
    IFS='
'
    for short in $short_traps; do
      [ -n "$short" ] && fail "$f" "trap without evidence: $(printf '%s' "$short" | cut -c1-60)..."
    done
    IFS=$inner_ifs
  fi

  # R7. Every relative link resolves. A recipe that names a file it does not
  # have costs the whole session that trusts it.
  links=$(grep -o '](\([^)#][^)]*\))' "$f" | sed 's/^](//; s/)$//')
  if [ -n "$links" ]; then
    inner_ifs=$IFS
    IFS='
'
    for link in $links; do
      case $link in http*|mailto:*) continue ;; esac
      target=$(printf '%s' "$link" | sed 's/#.*//')
      [ -z "$target" ] && continue
      [ -e "$dir/$target" ] || [ -e "$root/$target" ] || fail "$f" "dangling link: $target"
    done
    IFS=$inner_ifs
  fi
done
set +f
IFS=$oldifs

# R6. No pnpm script the recipe never tells anyone to create. The failure this
# catches is documented rather than imagined: a consumer's own docs described a
# three-command pipeline of which one command had never existed in that
# repository, and the reader who ran the documented line got a missing-script
# error. Namespaced script names (word:word) are the shape this stack uses, and
# matching only those keeps the rule precise enough to have no exceptions.
used=$(grep -rhoE 'pnpm (run )?[a-z][a-z-]*:[a-z][a-z-]*' "$stack_root" \
  | sed 's/^pnpm \(run \)\?//' | sort -u)
declared=$(grep -rhoE '"[a-z][a-z-]*:[a-z][a-z-]*" *:' "$stack_root" \
  | tr -d '" :' | sort -u)
if [ -n "$used" ]; then
  inner_ifs=$IFS
  IFS='
'
  set -f
  for script in $used; do
    printf '%s\n' "$declared" | grep -qx "$script" \
      || fail "$stack_root" "recipe runs \`pnpm $script\` but never creates that script"
  done
  set +f
  IFS=$inner_ifs
fi

if [ "$failures" -gt 0 ]; then
  printf '%s problem(s)\n' "$failures" >&2
  exit 1
fi
echo 'stack ok'
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `sh scripts/check-stack.test.sh`
Expected: `check-stack tests ok`, exit `0`.

If a case fails, fix the validator, not the case — each case names a failure
that has actually happened.

- [ ] **Step 5: Create the plugin manifest**

Create `stacks/monorepo/.claude-plugin/plugin.json`. The name drops `ts-`
deliberately: the module graph describes the *shape* of a monorepo, and a Go CLI
could legitimately sit in one.

```json
{
  "name": "shipyard-monorepo",
  "description": "A monorepo stack as installable modules: workspace and build graph, local services, an API contract with a generated client, a server, a CLI, and the CI gates that match whichever of those a project took.",
  "version": "0.1.0",
  "author": { "name": "Kirill Kucherenkov" },
  "homepage": "https://github.com/kkucherenkov/shipyard",
  "repository": "https://github.com/kkucherenkov/shipyard",
  "license": "MIT",
  "keywords": [
    "claude-code",
    "stack",
    "monorepo",
    "pnpm",
    "turborepo",
    "openapi",
    "scaffold"
  ]
}
```

- [ ] **Step 6: Create the skill, at the path a plugin actually loads**

Create `stacks/monorepo/skills/monorepo-stack/SKILL.md`. The path matters: a
plugin's skills are discovered at `<plugin>/skills/<name>/SKILL.md`, so a
`SKILL.md` sitting at the plugin root is never loaded and nothing says so. Task 2
extends this body with the module graph.

```markdown
---
name: monorepo-stack
description: Use before scaffolding a new monorepo, and again whenever a module is added to one that already exists — a server, a CLI, a contract package, local services, or the CI gates for them. Covers which modules exist, what each requires, and why a declined module leaves nothing behind.
---

# Monorepo stack

A monorepo is not one scaffold. It is a set of parts with real dependencies
between them, and a given project wants some of them. This skill installs those
parts one at a time.

Two things are true of every part and are the reason this is a recipe rather
than a template repository:

**Versions rot; conventions do not.** Anything whose correctness expires — a
dependency version, the exact shape a generator emits this month — is installed
by calling the upstream generator, never by copying a frozen file. Anything
whose correctness does not expire — the CI structure, an agent definition, the
convention documents, the block written into `CLAUDE.md` — travels as a file
template. No version number appears anywhere in this recipe except a floor, and
a floor always arrives with the convention that justifies it: "Node 24.15+,
because `node:sqlite`" is a statement about a capability, while "Node 24.15.0"
is a statement about a Tuesday.

**Omit, never disable.** A module this project declined leaves nothing behind:
no file emitted switched-off, no commented-out target, no stub, no `if:` guard
on a CI job, no heading with nothing under it. This is not tidiness. A skipped
CI job reports green, and a required check that never started is absent from
`gh pr checks` entirely rather than pending — so a disabled gate reads as a
passing one from both directions. The same holds for prose: an empty section
reads, to a machine, exactly like a filled one.

## Before installing anything

Read what is already here. Every module below states its preconditions and what
to check for, and every module can be installed into a workspace that already
has others. There is no idempotency machinery and none is wanted: this is a set
of instructions, and the instruction is to look before acting.
```

- [ ] **Step 7: Create the plugin's README**

Create `stacks/monorepo/README.md`. Task 11 appends the validation record.

```markdown
# shipyard-monorepo

The stack layer of [`shipyard`](../../README.md). `shipyard` carries process —
the task stack, lane discipline, CI gating, issue bookkeeping, deploy
verification, the release audit. This plugin carries the shape of one kind of
repository: a package-manager workspace under a build graph, with a contract
package upstream of the things that consume it.

It is a **recipe**, not a template repository. Nothing here is a frozen copy of
a working project, because the parts of a working project worth copying are the
ones that stop being true — the dependency versions, the generator output, the
lockfile. What travels instead is the instruction to call the generator, the
conventions that outlive its major versions, and every trap that cost somebody a
day, with the evidence still attached.

## What it does not do

- It does not install what you did not ask for. Six modules exist; a project
  takes the ones it needs and the rest leave no trace.
- It does not carry a version number. A floor, where a convention depends on
  one; never a pin.
- It does not carry a lockfile, a dependency override, or a workaround pinned
  for a bug in somebody else's repository.
- It does not cover a browser client, a component library, a design-token
  pipeline or a Flutter client. Those modules are unwritten because no project
  has installed them yet, and writing them from memory is how a template dies.

## Install

```sh
/plugin marketplace add kkucherenkov/shipyard   # once per machine
/plugin install shipyard-monorepo
```

Then ask for the module you want. The skill names its preconditions, checks
what is already present, and stops rather than guessing.

## The contract with the other layer

`shipyard` and `project-skeleton` own a project's `CLAUDE.md`; this plugin owns
exactly the region between `<!-- STACK:BEGIN -->` and `<!-- STACK:END -->` and
rewrites nothing outside it. Without those markers a reinstall has two bad
options — overwrite the file and lose hand edits, or leave it and never update.

The agents under `agents/` ship with the modules whose surface they own, and no
others. An agent without its surface produces confident work in the wrong
idiom.

## License

MIT. See [`../../LICENSE`](../../LICENSE).
```

- [ ] **Step 8: Add the marketplace entry**

Modify `.claude-plugin/marketplace.json` — add a second object to `plugins`,
after the existing `shipyard` entry:

```json
    {
      "name": "shipyard-monorepo",
      "description": "A monorepo stack as installable modules: workspace and build graph, local services, an API contract with a generated client, a server, a CLI, and CI gates matched to what the project took.",
      "source": "./stacks/monorepo",
      "category": "development"
    }
```

Also update the top-level `description` from
`"Portable process layer for new projects, plus stack presets."` to
`"Portable process layer for new projects, and the monorepo stack that fills it in."`
— the plural was a promise made before anything was written.

- [ ] **Step 9: Wire both scripts into CI**

Modify `.github/workflows/check.yml`, after the existing
`- run: sh scripts/check-skills.test.sh` step:

```yaml
      - run: sh scripts/check-stack.sh
      - run: sh scripts/check-stack.test.sh
```

Order matters the same way it does for the pair above: the subject runs against
the real tree first, so a real regression is the first thing reported; the table
test runs second and catches a validator that has stopped checking.

- [ ] **Step 10: Name the second plugin in the root README**

Modify `README.md`. Under `## Install and update`, after the existing install
block, add:

```markdown
This repository is also the marketplace for `shipyard-monorepo`, the stack
layer — the monorepo shape this process was extracted alongside. It installs
separately and is worth installing only if that is the kind of repository you
are building:

```sh
/plugin install shipyard-monorepo
```

See [`stacks/monorepo/README.md`](stacks/monorepo/README.md) for its modules
and what each one costs to decline.
```

- [ ] **Step 11: Prove the plugin is actually loadable**

This is Review Focus item 2, and it is the only step in the plan that a text
validator cannot stand in for.

Run, in order, and record the output of each:

```sh
cd ~/projects/petProjects/shipyard
python3 -m json.tool .claude-plugin/marketplace.json > /dev/null && echo 'marketplace json ok'
python3 -m json.tool stacks/monorepo/.claude-plugin/plugin.json > /dev/null && echo 'plugin json ok'
test -f stacks/monorepo/skills/monorepo-stack/SKILL.md && echo 'skill is at a loadable path'
claude plugin validate . 2>&1 | tail -20
```

If `claude plugin validate` is not a subcommand this CLI has, say so and fall
back to an install: from a scratch directory, `/plugin marketplace add
~/projects/petProjects/shipyard`, then `/plugin install
shipyard-monorepo@shipyard`, then confirm `monorepo-stack` appears in the
session's skill listing.

**Expected:** the skill appears. If it does not, the layout is wrong and no
later task is worth starting — fix the layout here.

- [ ] **Step 12: Commit**

```bash
git switch -c feat/monorepo-stack
git add .claude-plugin/marketplace.json README.md .github/workflows/check.yml \
  scripts/check-stack.sh scripts/check-stack.test.sh stacks/monorepo
git commit -m "feat(monorepo): add the stack plugin and its own validator"
```

---

### Task 2: The module graph, the decline procedure, and the module-file contract

**Files:**
- Modify: `stacks/monorepo/skills/monorepo-stack/SKILL.md`
- Modify: `scripts/check-stack.sh` (adds rules R3 and R4)
- Test: `scripts/check-stack.test.sh` (adds their cases)

**Interfaces:**
- Consumes: `SKILL.md` and its frontmatter from Task 1; `check-stack.sh`'s
  `fail()` helper and its `$stack_root` variable.
- Produces:
  - The module table in `SKILL.md`, whose first column is the exact set of
    basenames under `modules/`. Tasks 3-8 each add one row and one file, and
    rule R4 fails if either half is missing.
  - The six required headings every `modules/*.md` carries, in this order and
    spelled exactly: `## Preconditions`, `## Steps`, `## What the consumer
    decides`, `## Traps`, `## Declining this module`, `## Verify`. Rule R3
    enforces presence; Tasks 3-8 fill them.

- [ ] **Step 1: Write the failing cases**

Append to `scripts/check-stack.test.sh`, before the final `if` block. These need
a fixture builder that can vary the module table, so add one alongside
`make_stack`:

```sh
# Build a stack whose SKILL.md declares modules $2 (space separated) and whose
# modules/ directory contains files for $3 (space separated). The two lists
# differ in the R4 cases and match everywhere else.
make_graph() {
  root=$1
  mkdir -p "$root/stacks/monorepo/skills/monorepo-stack/modules"
  {
    printf -- '---\nname: monorepo-stack\n'
    printf 'description: Use when scaffolding a monorepo or adding a module.\n'
    printf -- '---\n\n# Monorepo stack\n\n## The modules\n\n'
    printf '| Module | Provides | Requires |\n| --- | --- | --- |\n'
    for m in $2; do
      printf '| [`%s`](modules/%s.md) | something | nothing |\n' "$m" "$m"
    done
  } > "$root/stacks/monorepo/skills/monorepo-stack/SKILL.md"
  for m in $3; do
    {
      printf '# %s\n\n## Preconditions\n\nNone.\n\n## Steps\n\n1. Do it.\n\n' "$m"
      printf '## What the consumer decides\n\nNames.\n\n## Traps\n\nNone yet.\n\n'
      printf '## Declining this module\n\nNothing reaches into it.\n\n'
      printf '## Verify\n\nIt exists.\n'
    } > "$root/stacks/monorepo/skills/monorepo-stack/modules/$m.md"
  done
}

expect_graph() {
  want=$1
  label=$2
  root=$(mktemp -d)
  make_graph "$root" "$3" "$4"
  sh "$subject" "$root" >/dev/null 2>&1
  got=$?
  rm -rf "$root"
  if [ "$got" -ne "$want" ]; then
    printf 'FAIL want=%s got=%s %s\n' "$want" "$got" "$label" >&2
    failures=$((failures + 1))
  fi
}

# --- R4: the table and the directory are the same set ---
expect_graph 0 'table and directory agree' 'core docker' 'core docker'
expect_graph 1 'table names a module with no file' 'core docker' 'core'
expect_graph 1 'directory holds a module the table omits' 'core' 'core docker'

# --- R3: every module file carries the six headings ---
missing_decline=$(mktemp -d)
mkdir -p "$missing_decline/stacks/monorepo/skills/monorepo-stack/modules"
{
  printf -- '---\nname: monorepo-stack\n'
  printf 'description: Use when scaffolding a monorepo or adding a module.\n'
  printf -- '---\n\n# Monorepo stack\n\n## The modules\n\n'
  printf '| Module | Provides | Requires |\n| --- | --- | --- |\n'
  printf '| [`core`](modules/core.md) | a workspace | nothing |\n'
} > "$missing_decline/stacks/monorepo/skills/monorepo-stack/SKILL.md"
{
  printf '# core\n\n## Preconditions\n\nNone.\n\n## Steps\n\n1. Do it.\n\n'
  printf '## What the consumer decides\n\nNames.\n\n## Traps\n\nNone yet.\n\n'
  printf '## Verify\n\nIt exists.\n'
} > "$missing_decline/stacks/monorepo/skills/monorepo-stack/modules/core.md"
sh "$subject" "$missing_decline" >/dev/null 2>&1
if [ $? -ne 1 ]; then
  printf 'FAIL want=1 a module file with no "## Declining this module"\n' >&2
  failures=$((failures + 1))
fi
rm -rf "$missing_decline"
```

- [ ] **Step 2: Run the test to verify the new cases fail**

Run: `sh scripts/check-stack.test.sh`
Expected: the four new cases report `want=1 got=0` (three of them) and the R4
`want=0` case passes trivially — the validator does not yet know about either
rule, so it accepts everything.

- [ ] **Step 3: Add rules R3 and R4 to the validator**

Insert into `scripts/check-stack.sh`, after the `for f in $files` loop's `done`
and before the R6 block:

```sh
# R3. Every module file carries the same six headings, in any file, spelled the
# same way. The one that earns this rule is "## Declining this module": a module
# whose files are reached by another module's script cannot be omitted without
# editing that other module, and the only way to find out is to make somebody
# write down what a decline removes. A module file that cannot answer has a
# seam in it.
skill_dir="$stack_root/monorepo/skills/monorepo-stack"
if [ -d "$skill_dir/modules" ]; then
  for m in "$skill_dir"/modules/*.md; do
    [ -e "$m" ] || continue
    for heading in '## Preconditions' '## Steps' '## What the consumer decides' \
      '## Traps' '## Declining this module' '## Verify'; do
      grep -qxF "$heading" "$m" || fail "$m" "missing required heading: $heading"
    done
  done

  # R4. The module table in SKILL.md and the files under modules/ are the same
  # set. A table row with no file sends a reader to a page that does not exist;
  # a file with no row is a module nobody can find, which is the same as not
  # having written it.
  tabled=$(grep -oE '\(modules/[a-z-]+\.md\)' "$skill_dir/SKILL.md" 2>/dev/null \
    | sed 's|(modules/||; s|\.md)||' | sort -u)
  present=$(find "$skill_dir/modules" -name '*.md' -exec basename {} .md \; | sort -u)
  if [ "$tabled" != "$present" ]; then
    only_tabled=$(printf '%s\n' "$tabled" | grep -vxF -f <(printf '%s\n' "$present") 2>/dev/null | tr '\n' ' ')
    only_present=$(printf '%s\n' "$present" | grep -vxF -f <(printf '%s\n' "$tabled") 2>/dev/null | tr '\n' ' ')
    fail "$skill_dir" "module table and modules/ disagree — tabled only: ${only_tabled:-none}; present only: ${only_present:-none}"
  fi
fi
```

Process substitution (`<(...)`) is not POSIX. Replace those two lines with
temporary files rather than relying on the runner's `/bin/sh` being bash — the
same class of mistake the proof-script trap records:

```sh
    t=$(mktemp); p=$(mktemp)
    printf '%s\n' "$tabled" > "$t"; printf '%s\n' "$present" > "$p"
    only_tabled=$(grep -vxF -f "$p" "$t" | tr '\n' ' ')
    only_present=$(grep -vxF -f "$t" "$p" | tr '\n' ' ')
    rm -f "$t" "$p"
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `sh scripts/check-stack.test.sh && sh scripts/check-stack.sh .`
Expected: `check-stack tests ok`, then `stack ok`.

`check-stack.sh .` passes against the real tree because `modules/` does not
exist yet and R3/R4 are both guarded on its presence. Task 3 is what makes them
bite.

- [ ] **Step 5: Write the module graph into `SKILL.md`**

Append to `stacks/monorepo/skills/monorepo-stack/SKILL.md`, after the "Before
installing anything" section. The table rows are added by Tasks 3-8; write the
table header and the surrounding text now, and add the first row in Task 3.

```markdown
## The modules

| Module | Provides | Requires |
| --- | --- | --- |

Four more modules belong in this table and are not written: a browser client, a
component package, a design-token pipeline, and a mobile client. They are absent
rather than listed as planned, because a table that advertises a module nobody
wrote misleads exactly the reader it is for. Each unblocks when a project
actually installs it.

### How to read `Requires`

`Requires` is a hard dependency, not a suggestion. A module whose requirement is
absent does not degrade — it produces debris. A contract package with no server
is a validator with nothing to validate; a token pipeline with no consumer emits
files nobody reads, and the first search of the new repository reports every
token as dangling.

So: if a requested module names a requirement this workspace does not have, say
so and ask, rather than installing the requirement silently. Installing two
modules when one was asked for is how a scaffold ends up holding things nobody
chose.

## Installing a module

The same procedure whether this is the first module in an empty directory or
the fifth added in month six.

1. **Read the module file.** Each one is `modules/<name>.md`, with the same six
   sections in the same order.
2. **Check its preconditions against what is here**, by reading the tree, not by
   asking. A module states what it needs to find and what it must not overwrite.
3. **Stop if a requirement is missing** and say which one, rather than pulling it
   in.
4. **Follow the steps.** Where a step says to call a generator, call it — do not
   write out what you remember it emitting.
5. **Run the module's `## Verify` section.** Every check there has an expected
   answer that cannot be produced by accident; a step that "looks right" is not
   a verification.
6. **Write the module's row into the project's `CLAUDE.md`**, between
   `<!-- STACK:BEGIN -->` and `<!-- STACK:END -->`, from
   [`../../templates/claude-md-block.md`](../../templates/claude-md-block.md).
   Nothing outside those markers is yours to rewrite.

There is no idempotency machinery and none is wanted. This is a set of
instructions to a reader who can look at the tree first, and step 2 is that
reader looking.

## Declining a module, and adding it later

A project that declines a module gets nothing from it: no file, no script, no
job, no heading. Every module file's `## Declining this module` section says
what that costs and — this is the part that matters — **names the steps in other
modules that disappear with it.** A module whose decline forces an edit to a
different module's files is a design defect in this recipe, not a decision for
the project to live with. If you find one, fix the recipe.

Adding a module in month six is this same procedure run again for that one
module. It is not a second plugin and not a migration: the preconditions in step
2 exist precisely so a module can be installed into a workspace that has been
running for months.
```

- [ ] **Step 6: Run both validators**

Run: `sh scripts/check-stack.sh . && sh scripts/check-skills.sh . && sh scripts/check-stack.test.sh`
Expected: `stack ok`, `skills ok`, `check-stack tests ok`.

The empty table is valid here and stops being valid the moment `modules/` has a
file in it, which is Task 3.

- [ ] **Step 7: Commit**

```bash
git add scripts/check-stack.sh scripts/check-stack.test.sh \
  stacks/monorepo/skills/monorepo-stack/SKILL.md
git commit -m "feat(monorepo): define the module graph and the module contract"
```

---

### Task 3: Module `core` — workspace, build graph, TypeScript, lint, format

**Files:**
- Create: `stacks/monorepo/skills/monorepo-stack/modules/core.md`
- Modify: `stacks/monorepo/skills/monorepo-stack/SKILL.md` (one table row)

**Interfaces:**
- Consumes: the six-heading contract and the module table from Task 2.
- Produces, for every later module:
  - The workspace globs `apps/*` and `packages/*`, so a later module knows where
    its package goes.
  - The four turbo tasks `build`, `typecheck`, `test`, `lint`, each declaring
    `dependsOn: ["^build"]`. Later modules add scripts with these exact names.
  - The two-tsconfig-per-package rule: `tsconfig.json` sees everything and is
    what `typecheck` and type-aware lint read; `tsconfig.build.json` extends it,
    sets `noEmit: false`, and excludes specs. Tasks 5, 6 and 7 all rely on this
    split and must not re-derive it.
  - `tsconfig.base.json` at the root, with `strict`, `noUncheckedIndexedAccess`
    and `exactOptionalPropertyTypes`.

- [ ] **Step 1: Add the table row and run the validator to watch it fail**

Add to the module table in `SKILL.md`:

```markdown
| [`core`](modules/core.md) | Package-manager workspace, build graph, base TypeScript config, lint, format | nothing |
```

Run: `sh scripts/check-stack.sh .`
Expected: FAIL — `module table and modules/ disagree — tabled only: core;
present only: none`, plus the dangling-link failure from R7. Two rules catch the
same missing file from different directions, which is the point.

- [ ] **Step 2: Write the module**

Create `stacks/monorepo/skills/monorepo-stack/modules/core.md`:

````markdown
# `core` — workspace, build graph, TypeScript

The floor every other module stands on. It is the one module that cannot be
declined.

## Preconditions

- A git repository with no `package.json` at its root, or one that is not
  already a workspace. If a workspace file already exists, read it and stop:
  this module would rewrite the build graph of a repository that has one.
- A package manager with workspace support and a task runner that understands a
  dependency graph. This recipe is written for pnpm and turbo; the conventions
  below hold for any pair with the same two capabilities, and the file names do
  not.

## Steps

1. **Initialise the workspace root.** A private root package that ships nothing,
   holding the scripts that fan out across the graph:

   ```json
   {
     "name": "<project>",
     "private": true,
     "version": "0.1.0",
     "packageManager": "pnpm@<the version you installed>",
     "engines": { "node": ">=<your floor>" },
     "scripts": {
       "build": "turbo run build",
       "test": "turbo run test",
       "typecheck": "turbo run typecheck",
       "lint": "turbo run lint && prettier --check .",
       "format": "prettier --write ."
     }
   }
   ```

   Install the dev dependencies by name and let the package manager resolve
   them — `pnpm add -Dw typescript eslint @eslint/js typescript-eslint prettier
   turbo`. Do not write versions into this file by hand.

2. **Declare two workspace globs, not one.**

   ```yaml
   packages:
     - "apps/*"
     - "packages/*"
   ```

   Two, so a package is filed by *what it is* — a deployable thing or a library
   — rather than by who imports it. One glob makes that distinction a naming
   convention, and a naming convention is not enforced by anything.

3. **Declare the build graph.** Four tasks, and the first three wait for their
   dependencies' builds:

   ```json
   {
     "$schema": "https://turbo.build/schema.json",
     "tasks": {
       "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
       "typecheck": { "dependsOn": ["^build"] },
       "test": { "dependsOn": ["^build"] },
       "lint": {
         "dependsOn": ["^build"],
         "inputs": ["$TURBO_DEFAULT$", "$TURBO_ROOT$/eslint.config.mjs"]
       }
     }
   }
   ```

   A `typecheck` that does not wait for upstream builds passes against
   yesterday's types.

   **Declare a task's environment variables on the task, never in `globalEnv`.**
   The task runner runs each task in a filtered environment, so a variable set
   on a CI job or exported in a shell reaches the task only if the task names
   it. `env` is also part of the cache key, which is right for the task that
   reads a database and wrong for `build` and `typecheck` — those would miss
   cache on every change to a connection string they never read.

4. **Write the base TypeScript config** at the root, extended by every package:

   ```json
   {
     "compilerOptions": {
       "target": "<a recent ES target>",
       "module": "NodeNext",
       "moduleResolution": "NodeNext",
       "strict": true,
       "noUncheckedIndexedAccess": true,
       "exactOptionalPropertyTypes": true,
       "skipLibCheck": true,
       "declaration": true,
       "sourceMap": true
     }
   }
   ```

5. **Give every package two tsconfigs, not one.** `tsconfig.json` includes
   everything — sources, specs, and the package's own root-level config files —
   with `noEmit: true`. `tsconfig.build.json` extends it, sets `noEmit: false`
   with an `outDir` and a `rootDir`, and excludes `**/*.spec.ts`. `typecheck`
   and ESLint read the first; `build` reads the second.

6. **Configure ESLint once, at the workspace root**, as a flat config using the
   recommended type-checked rule set with the project service enabled, ignoring
   `**/dist/` and any generated directory. Add a final block applying the
   disable-type-checked preset to `**/*.{js,mjs}`, so config files that sit
   outside every tsconfig get syntax rules rather than an error.

7. **Configure Prettier, and keep it away from Markdown.** A `.prettierignore`
   covering the lockfile, every generated directory, and `*.md`.

8. **Create `.git-blame-ignore-revs`** at the root with a comment naming
   `git config blame.ignoreRevsFile .git-blame-ignore-revs`, and add the SHA of
   the first formatting-only commit to it once that commit exists.

## What the consumer decides

The package scope, the Node floor, the package-manager version, the ES target,
Prettier's print width and quote style, any rule set beyond the recommended
type-checked one, and whether Markdown is formatted at all (see the trap below
before deciding yes).

## Traps

**`noUncheckedIndexedAccess` is not a taste setting, and the recipe has to say
why or the first person who hits a compile error turns it off.** The case it
exists for looks exactly like a false positive: code indexing a record by a key
the type does not guarantee is present — a per-field timestamp map keyed by
field name, for instance — compiles silently without the flag and hands the
next line an `undefined` typed as a value. That is precisely the case the
surrounding logic exists to handle, and the compiler was the only thing that
could have pointed at it. Carry the flag and carry this sentence with it.

**Two tsconfigs per package is not tidiness, and the failure is silent in the
direction that matters.** Two packages here each had one `tsconfig.json` that
excluded `*.spec.ts` so the build would not emit them — which meant `typecheck`
never looked at a spec file either. Six type errors were sitting in spec files
with nothing failing anywhere. They surfaced only when type-aware lint was
added, months later. The fix is structural rather than a rule anyone has to
remember: the config that excludes is the build's, and typecheck and lint read
the one that sees everything.

**`dependsOn: ["^build"]` on the `lint` task looks like over-ordering until the
first clean run.** Type-aware rules resolve types through the project graph, so
linting a package that imports a workspace library needs that library's built
output to exist. Without the dependency, lint passes on any machine with a warm
build and fails on CI — which is the worst available ordering of those two
outcomes, because the failure arrives after review rather than before it.

**Prettier turned loose on the whole tree rewrites prose whose line breaks were
chosen.** It reflowed seventeen architecture decision records here — documents
that are records rather than code, where a line break is sometimes the author's
and a reformat destroys the diff of every later edit to them. Add `*.md` to
`.prettierignore` deliberately rather than leaving the next project to discover
it by reading a seventeen-file formatting diff. When a formatting pass does
happen, land it in a commit of its own and put that commit's SHA in
`.git-blame-ignore-revs`, so blame keeps pointing at whoever wrote the line
rather than at the formatter.

## Declining this module

It cannot be declined. Every other module requires it, and each of them says so
in its own `Requires`. This section exists rather than being left implied
because a table of modules where one of them is silently mandatory is a table
that will be read wrong exactly once.

## Verify

Each of these has an answer that cannot be produced by accident:

1. `pnpm -w exec turbo run typecheck lint` exits `0` on the empty workspace.
   Not "prints no errors" — exits `0`; a task runner that found no tasks to run
   also prints no errors.
2. `grep -c noUncheckedIndexedAccess tsconfig.base.json` prints `1`.
3. `pnpm exec prettier --check .` exits `0`, and adding a deliberately
   misformatted `.ts` file makes it exit non-zero. Run both halves — a formatter
   whose ignore file is too wide passes the first and fails to catch anything.
4. In any package, `pnpm exec tsc -p tsconfig.json --listFiles | grep -c '\.spec\.ts'`
   is greater than `0` once specs exist, and the same command against
   `tsconfig.build.json` prints `0`. This is the two-tsconfig split proved
   rather than assumed.
````

- [ ] **Step 3: Run the validators to verify they pass**

Run: `sh scripts/check-stack.sh . && sh scripts/check-stack.test.sh`
Expected: `stack ok`, `check-stack tests ok`.

If R6 fails naming a `pnpm` script, the module used a namespaced script it never
creates — fix the module, not the rule.

- [ ] **Step 4: Commit**

```bash
git add stacks/monorepo/skills/monorepo-stack/SKILL.md \
  stacks/monorepo/skills/monorepo-stack/modules/core.md
git commit -m "feat(monorepo): add the core module"
```

---

### Task 4: Module `docker` — local service dependencies

**Files:**
- Create: `stacks/monorepo/skills/monorepo-stack/modules/docker.md`
- Modify: `stacks/monorepo/skills/monorepo-stack/SKILL.md` (one table row)

**Interfaces:**
- Consumes: nothing from `core` — this module's `Requires` is `nothing`, because
  a repository can have local services before it has a workspace.
- Produces: `docker/compose.yml` with a named project and services published on
  non-default host ports. `backend`'s `## Verify` and `ci`'s test job both refer
  to this file; `ci` reads the image name and the *container-internal* port from
  it, never the host remap.

- [ ] **Step 1: Add the table row and run the validator to watch it fail**

```markdown
| [`docker`](modules/docker.md) | A compose file for the services the project develops against, on non-colliding host ports | nothing |
```

Run: `sh scripts/check-stack.sh .`
Expected: FAIL — the table names `docker`, `modules/docker.md` does not exist.

- [ ] **Step 2: Write the module**

Create `stacks/monorepo/skills/monorepo-stack/modules/docker.md`:

````markdown
# `docker` — local service dependencies

Everything the project needs running to develop against, and nothing it does not.

## Preconditions

- No `docker/compose.yml` already present. If there is one, read it: this module
  adds services to it rather than replacing it.
- A container runtime with compose support on the machine.

## Steps

1. **Create `docker/compose.yml` with an explicit project name.** Compose
   derives one from the directory otherwise, so two checkouts of the same
   repository silently share one stack and rewrite each other's services:

   ```yaml
   name: <project>-dev
   ```

2. **Publish every service on a non-default host port**, remapped from the
   image's own. Give each a healthcheck and a named volume where it holds state:

   ```yaml
   services:
     <service>:
       image: <image>:<the tag you chose>
       environment: {}
       ports:
         - "<non-default host port>:<the image's own port>"
       volumes:
         - <service>data:/<the image's data path>
       healthcheck:
         test: ["CMD-SHELL", "<the image's own readiness command>"]
         interval: 5s
         timeout: 3s
         retries: 10

   volumes:
     <service>data:
   ```

3. **Write the connection string into the project's `CLAUDE.md` stack block**,
   using the remapped host port, alongside a one-line note that the port is
   remapped and why. A remap nobody documented is a remap somebody undoes.

## What the consumer decides

Which services, which images and tags, which host ports, whether state survives
`down` — and the answer to whether this module is wanted at all, which is a real
question for a project whose only dependency is a file on disk.

## Traps

**Publish on a non-default host port, and carry the reason with the rule or the
rule loses.** A developer machine very likely already has a database of the same
kind listening on the default port. The failure that produces is not a refused
connection, which anyone would debug in a minute — it is a *successful*
connection to the wrong database, which presents as a data bug for as long as it
takes somebody to work out which instance they have been talking to. A recipe
that says "use a non-default port" without that sentence gets overridden by the
next person who finds the remap inconvenient.

**A CI service container is reached on the image's own port, not the host
remap, and the comment saying so has to live in the workflow.** The remap exists
only to dodge a collision on a developer machine; a job's service container has
a network to itself and nothing to collide with. Every time this is rediscovered
it is rediscovered as a connection refused in CI against a config that works
locally, so the workflow template carries the explanation next to the port
rather than leaving it to be re-derived.

## Declining this module

A project whose services are all in-process declines it, and two things must
then not appear anywhere else:

- `backend`'s `## Verify` must not instruct bringing a compose stack up. Use
  whatever the project actually runs against.
- `ci`'s workflow template must have its `services:` block deleted — deleted,
  not commented out and not guarded by an `if:`. A required job that does not
  start is absent from the check list rather than pending, which reads as
  passing.

Nothing else reaches into `docker/`. No other module's script writes a file
under it, so the decline is clean once those two are handled.

## Verify

1. `docker compose -f docker/compose.yml config` exits `0` — it resolves and
   validates the file without starting anything.
2. `docker compose -f docker/compose.yml up -d` followed by
   `docker compose -f docker/compose.yml ps` shows every service `healthy`, not
   merely `running`. A container that is up and not yet accepting connections is
   the state that makes the next step flaky.
3. The published host port differs from the image's default. Check it, do not
   assume it: `docker compose -f docker/compose.yml port <service> <internal port>`
   prints the host mapping, and reading it back is what catches a copied block
   whose remap was never changed.
````

- [ ] **Step 3: Run the validators**

Run: `sh scripts/check-stack.sh . && sh scripts/check-stack.test.sh`
Expected: `stack ok`, `check-stack tests ok`.

R2 will fail if a concrete image tag survived into the file. `<image>:<the tag
you chose>` is a placeholder and does not match; `postgres:18.1-alpine` does.

- [ ] **Step 4: Commit**

```bash
git add stacks/monorepo/skills/monorepo-stack/SKILL.md \
  stacks/monorepo/skills/monorepo-stack/modules/docker.md
git commit -m "feat(monorepo): add the docker module"
```

---

### Task 5: Module `specs` — the contract and its generated client

**Files:**
- Create: `stacks/monorepo/skills/monorepo-stack/modules/specs.md`
- Modify: `stacks/monorepo/skills/monorepo-stack/SKILL.md` (one table row)

**Interfaces:**
- Consumes: from `core`, the `apps/*` / `packages/*` globs, the four turbo tasks,
  and the two-tsconfig rule.
- Produces:
  - `packages/specs/openapi/openapi.yaml` — the path `backend` mounts its
    runtime validator against.
  - Two root scripts, named exactly `spec:validate` and `spec:codegen`, and no
    third. Tasks 6, 8, 9 and 11 all name these; none of them may name a step
    this module does not create.
  - A package that **builds** and exports `dist/` only. `backend` and `cli`
    import from it and rely on `turbo`'s `dependsOn: ["^build"]` to have it
    built.
  - Generated sources committed under `src/generated/`; `dist/` gitignored.

- [ ] **Step 1: Add the table row and run the validator to watch it fail**

```markdown
| [`specs`](modules/specs.md) | An OpenAPI contract, its linter, and a typed client generated from it and shipped as built output | `core` |
```

Run: `sh scripts/check-stack.sh .`
Expected: FAIL on the missing file, from R4 and R7 both.

- [ ] **Step 2: Write the module**

Create `stacks/monorepo/skills/monorepo-stack/modules/specs.md`:

````markdown
# `specs` — the contract and its generated client

One document that every client and the server agree on, and the package that
turns it into code.

## Preconditions

- `core` installed: the workspace globs, the build graph, and the base
  TypeScript config.
- No existing `packages/specs`. If one exists, read its `openapi.yaml` and add
  to it rather than replacing it.

## Steps

1. **Create `packages/specs`** with an OpenAPI 3.1 document at
   `openapi/openapi.yaml`. Declare `servers` with the versioned prefix the
   server will actually mount (`/api/v1`), a `securitySchemes` entry, and a
   shared error schema. Use RFC 9457 `application/problem+json` unless the
   project has a reason not to:

   ```yaml
   components:
     schemas:
       Problem:
         type: object
         required: [type, title, status]
         properties:
           type: { type: string }
           title: { type: string }
           status: { type: integer }
           detail: { type: string }
   ```

2. **Add the linter and the generator as dev dependencies** — a spec linter and
   an OpenAPI-to-TypeScript generator — by name, resolving versions at install
   time.

3. **Declare exactly two scripts, and only scripts that exist.**

   ```json
   {
     "scripts": {
       "validate": "<the linter> openapi/openapi.yaml",
       "codegen": "<the generator>",
       "build": "pnpm codegen && <the bundler> src/generated/index.ts --format esm --dts --clean",
       "typecheck": "tsc --noEmit",
       "lint": "eslint ."
     }
   }
   ```

   At the workspace root, expose them under namespaced names:

   ```json
   {
     "scripts": {
       "spec:validate": "pnpm --filter <scope>/specs validate",
       "spec:codegen": "pnpm --filter <scope>/specs codegen"
     }
   }
   ```

   Two, not three. Add a bundle step only if the project has one — see the last
   trap.

4. **Make the package export built output.** `main`, `types` and `exports` all
   point at `dist/`; `files` lists `dist`; `dist/` is in the package's
   `.gitignore` while the **generated sources under `src/generated/` stay
   committed**. The generated source is the reviewable artefact; the bundle is
   not.

5. **Declare the generated client's runtime dependency explicitly.** The
   generator emits imports of its own HTTP runtime and does not add it to
   `package.json`.

6. **Commit generated output in its own commit.** A reviewer then reads the
   contract change without the derived diff, and a regeneration that changes
   nothing shows up as an empty commit rather than as noise inside a feature.

7. **Write four rules into the document itself**, because each one is a
   difference between what the types say and what the validator enforces:
   - `additionalProperties: false` on every request body.
   - Split a variant type by its discriminator with `oneOf`.
   - A `default` error response on every operation.
   - A `summary` on every operation.

## What the consumer decides

The package scope, which paths exist, the error schema, the generator, whether a
second client in another language is generated alongside, and whether a bundle
step exists at all.

## Traps

**The default rule set errors on a missing operation summary, and the reflex —
add a config that relaxes the rule — is backwards.** A summary is contract
content, not a linter's opinion: it becomes the docstring on every generated
client method, in every language the contract is generated into. Write the
summaries. The general shape, worth stating once and applying everywhere: fix
the document, not the linter.

**The exception to that rule, and it needs naming or somebody silences the whole
rule set over one warning.** Not every default rule fits every operation. The
concrete case here: the rule requiring a 4xx response fires on a liveness probe,
which has no client error to declare — it answers, or the process is not there
to answer. Inventing a 4xx would put an impossible response in the contract that
every generated client writes a branch for. Leave that one warning visible and
unsilenced, and say in the document why. A silenced warning and an absent one
look identical six months later.

**A package whose contents are generated must build and export `dist/`; it must
never export raw TypeScript.** Generated code follows its generator's idiom, and
the generator here emits extension-less relative imports (`from "./types.gen"`).
A package exporting raw TypeScript does not resolve those itself — the
*consumer* does, under its own module resolution — and a server and a CLI both
compiling under `NodeNext`, where extension-less relative imports do not
resolve, fail at once and neither can fix it. The bundler resolves them at build
time and the bundle is all any consumer imports.

**Setting `moduleResolution: "Bundler"` inside the generating package looks like
the fix and is not.** It turns that package's own typecheck green and moves
nothing for its consumers, who still resolve those imports themselves. A recipe
that stops at "give the package a tsconfig" produces exactly that: a green gate
over a broken import graph. The override is correct *only* alongside a real
bundle step, and the tsconfig has to say so in a comment or the next person
removes the bundler and keeps the override.

**Nothing catches a missing runtime dependency until a clean install.** The
generated client imports an HTTP runtime the generator does not add to
`package.json`. Typecheck passes, the import resolves through the workspace's
hoisted modules, every developer machine is fine, and it fails on the first
install that starts from nothing — which is CI, or a new contributor, whichever
comes first.

**Never write a pipeline step the project has no script for.** This project's
predecessor documented a three-command pipeline copied from another repository
where all three existed; here the middle one never had. It was found when
somebody ran the documented line and got a missing-script error, which is the
cheap version of this failure. The expensive version is a recipe that tells a
new project to run three commands of which one has never existed anywhere, and
the reader who hits it cannot tell a typo from a missing install step. Name only
what you created, and check the manifest before writing a command into prose.

**A type union and a wire schema are different documents, and the validator
believes the schema.** A discriminated union in TypeScript says each variant
requires its own fields. One flat schema with four common `required` entries
says something much weaker, and it is the schema the runtime validator enforces
— so the types promise a guarantee nothing checks. Split by discriminator with
`oneOf`, or the union is decoration.

## Declining this module

A project with no wire contract declines it. Two other modules name it in
`Requires`, and declining it decides them:

- **`cli` is declined with it.** Its whole cheapness comes from consuming the
  generated client; a CLI written against a hand-maintained client is a
  different module and this recipe does not have it.
- **`backend` keeps every step except two**: mounting the runtime request and
  response validator, and generating its DTOs from the contract. Its
  configuration class, its error filter, its write ordering and its schema
  guidance are all independent of this module. Say which of the two you removed
  in the project's `CLAUDE.md`, because a reader who finds no validator will
  otherwise assume it was forgotten.

Nothing in this module emits a file into another module's directory, and it
generates no client the project did not ask for. That is what makes both
declines above a deletion of this module's own files rather than an edit to
somebody else's.

## Verify

1. `pnpm spec:validate` exits `0`, with any surviving warnings explained in the
   document.
2. `pnpm -w exec turbo run build` produces `packages/specs/dist/index.js` and
   `packages/specs/dist/index.d.ts`. Check for both files by name; a bundler
   that emitted JavaScript and no declarations passes a build and breaks every
   consumer's typecheck.
3. From a **clean install** — `rm -rf node_modules && pnpm install
   --frozen-lockfile` — `pnpm -w exec turbo run build typecheck` exits `0`. This
   is the only check that catches the undeclared runtime dependency, and running
   it on a warm tree proves nothing.
4. `git status --short packages/specs` after `pnpm spec:codegen` shows either no
   change or only files under `src/generated/`. Anything else means codegen is
   writing outside its own output directory.
````

- [ ] **Step 3: Run the validators**

Run: `sh scripts/check-stack.sh . && sh scripts/check-stack.test.sh`
Expected: `stack ok`, `check-stack tests ok`.

R6 now has teeth: `pnpm spec:validate` and `pnpm spec:codegen` both appear in
prose and both appear as keys in the fenced JSON block above. Adding
`pnpm spec:bundle` to a sentence without adding the key fails the build — that
is Review Focus item 5 wired to a command.

- [ ] **Step 4: Commit**

```bash
git add stacks/monorepo/skills/monorepo-stack/SKILL.md \
  stacks/monorepo/skills/monorepo-stack/modules/specs.md
git commit -m "feat(monorepo): add the specs module"
```

---

### Task 6: Module `backend` — the server shell, the schema, write ordering, auth

**Files:**
- Create: `stacks/monorepo/skills/monorepo-stack/modules/backend.md`
- Modify: `stacks/monorepo/skills/monorepo-stack/SKILL.md` (one table row)

**Interfaces:**
- Consumes: from `core`, the two-tsconfig rule and the four turbo tasks; from
  `specs`, `packages/specs/openapi/openapi.yaml` and the built client package;
  from `docker`, the compose file the database runs in.
- Produces:
  - A configuration class that is the only reader of the process environment,
    exposing `required(name)` and a validating port reader. `ci` and the
    `CLAUDE.md` block both refer to it by that description.
  - `apps/backend` with `build`, `typecheck`, `test`, `lint` and a `postinstall`
    that generates the ORM client. `ci` relies on `postinstall`, never on a CI
    step.
  - The test-database guard (`assertTestDatabase`) in the package's test setup
    file. `ci` names it.

- [ ] **Step 1: Add the table row and run the validator to watch it fail**

```markdown
| [`backend`](modules/backend.md) | An HTTP server validated against the contract at runtime, its schema, its write ordering and its authentication | `core` (and `specs`, for the runtime validator) |
```

Run: `sh scripts/check-stack.sh .`
Expected: FAIL on the missing `modules/backend.md`.

- [ ] **Step 2: Write the module**

Create `stacks/monorepo/skills/monorepo-stack/modules/backend.md`:

````markdown
# `backend` — the server

## Preconditions

- `core` installed.
- `specs` installed, if this server is to validate against the contract at
  runtime. Without it, skip steps 4 and 5 and say so in the project's
  `CLAUDE.md`.
- A database reachable, from `docker` or from wherever this project runs one.
- No existing `apps/backend`.

## Steps

1. **Scaffold the server by calling its framework's own generator**, then delete
   whatever sample module it leaves behind. Do not hand-write the scaffold from
   memory of what it emits.

2. **Make one class the only reader of the process environment.** Everything
   else injects it. It exposes a `required(name)` that throws on a missing or
   empty value, and any parsed value validates its own shape:

   ```ts
   private required(name: string): string {
     const value = process.env[name];
     if (value === undefined || value === '') throw new Error(`${name} is required`);
     return value;
   }
   ```

   Failing loudly at boot is the point. A server that starts with half its
   configuration missing fails later, further away, and looks like a different
   bug. Parse numbers rather than coercing them: `Number('abc')` is `NaN`, and
   binding a port of `NaN` binds a random free one — which starts, passes its own
   health check, and answers on a port nothing in the deployment knows.

3. **Version the URI under a global prefix**, so a controller declaring version
   `1` serves `/api/v1/...`. Never hand-write the prefix into a route decorator;
   it is configuration, and a hand-written copy drifts from it silently.

4. **Mount the body parser before the contract validator, explicitly.** Disable
   the framework's built-in parser and register your own first. See the trap.

5. **Mount the contract validator against the spec package's document**, with
   request and response validation on and **security validation off**.
   Authentication is a framework guard's job; letting the validator reject first
   turns a 401 into a 500 and hides which layer refused.

6. **Install a global exception filter** that reads the status off either an
   framework exception or a plain `{ status, message }` object, and renders the
   error schema the contract declares. It logs 5xx at `error` with the original
   object and its stack, and 4xx at `warn` with no stack. See the two traps
   below: this filter is wrong in two specific ways that pass review.

7. **Add the ORM**, with its CLI and its client **exact-pinned to the same
   version** — not a caret on either. Wire `prisma generate` (or the ORM's
   equivalent) to the package's own `postinstall`, never to a CI step.

8. **Put whatever the synchronisation design needs on every synchronised
   table** — a version counter, per-field timestamps, a monotonic sequence, a
   soft-delete marker — and read the trap about hand-written SQL before adding
   anything the ORM cannot express.

9. **Take a per-subject advisory lock as the first statement of every write
   transaction**, and use `SELECT … FOR UPDATE` wherever a handler reads a row,
   computes from it, and writes it back.

10. **For authentication**: identical answers for an unknown account and a wrong
    secret, constant-time comparison including the length check the comparison
    function requires, an asynchronous key derivation, and a guard that takes
    the identity from the token and from nothing a request can influence.

11. **Add the test-database guard** in the package's test setup file, loaded for
    every spec rather than opted into by the specs that need it. It refuses the
    whole run when the database name does not end in `_test`, and its message
    prints the two commands that create one.

## What the consumer decides

The framework, the ORM, the entities and their relations, the retention rules,
the error schema, the lock's key shape, the token format, and the schedule of
any batch job.

## Traps

**The framework registers its own body parser inside `listen()`, which runs
after every `app.use()`.** So a contract validator registered the obvious way
reads an undefined body and rejects **every** POST with a 400 complaining the
body is missing a required property. It presents as "the contract is wrong", and
it is not — the contract never saw a body. Disable the built-in parser at
creation and mount your own ahead of the validator. This was found a task late,
after a change to the ordering made every POST answer 400 and the task that
introduced it verified two GET requests and saw nothing.

**The contract validator rejects by throwing a plain object, not a framework
exception.** It throws `{ status, message }`. The default exception filter reads
the status only off its own exception type, so every validator rejection — a 400
on a bad body, a 404 on an undeclared route — surfaces as an unhandled 500. A
filter that reads the status off either shape is required, and its body must
match the error schema the contract declares, or the first client to read an
error gets a shape the contract does not describe.

**The filter must distinguish a 4xx message from a 5xx one, and the defect that
proves it recurs in every codebase that writes one.** The rule: a 4xx may carry
the message, because it describes what the caller did wrong and the caller
already knows it; a 5xx never does, because it describes what broke inside and
the caller has no business seeing it. The filter here was written for the
validator's plain object and detected that shape by asking whether the value has
a string `message`. A plain `Error` satisfies that test identically — so a filter
aimed at one narrow source silently took on every other, and the distinction
between "our message, meant for the client" and "someone else's message that
happens to be a string" existed nowhere in the types. Both halves failed
together: the exception was exposed to an untrusted client **and** invisible in
the log, because replacing the default filter also removed its logging. A fix
that only suppresses the leak trades one failure for the other, so the test is
two assertions — the 5xx body does not contain the thrown message, **and** the
logger received it. A test that checks only the body passes on a filter that has
gone silent.

**The dependency-injection metadata import must be the first line of the entry
point.** Without it injection silently does not work — not an error at boot, a
container that resolves nothing.

**An ORM cannot always express what the design needs, and the hand-written part
becomes a standing hazard.** One sequence shared across several tables has no
declarative form here, so its SQL was hand-written into a migration. The schema
therefore does not know the default exists, and every later migration touching
those models generates SQL that drops it — silently: nothing fails at migration
time, nothing fails at boot, and the column starts coming back null. Write the
warning in **both** places, the schema and the migration, and read the generated
SQL of every later migration touching those models before applying it.

**Verify a hand-written migration with a query that has an expected answer.**
"Remember to append the SQL" is an instruction somebody can follow and not notice
failed. `SELECT nextval(...), nextval(...)` returning two consecutive numbers is
a check that cannot be passed by accident. This mattered because the symptom of
the omission appeared two tasks later, in correct-looking code, as a cursor that
never advanced.

**Pin an ORM's CLI and client to the same exact version, not a range on either.**
They ship a binary protocol between them, so a range says "any of these is
compatible" about a pair for which that is simply untrue. The drift fails
neither the build nor the typecheck — it fails at runtime. The tell is an
asymmetry inside one file: one of the pair exact, the other a range.

**An applied migration is immutable.** Commentary goes beside it, never inside
it: editing applied SQL desyncs the migration tool's stored checksum, and the
repair is a manual write to its bookkeeping table.

**A read-modify-write without a row lock loses one of two concurrent updates to
different fields of the same row.** This survived eight per-task reviews here and
was found only by a whole-branch one: a handler read a row, computed from it, and
wrote every column back inside a transaction at the default isolation level, with
no lock. Two concurrent updates to *different* fields lost one of them, 39 times
out of 40 — and the loser's per-field timestamp was clobbered along with its
value, so the row ended up holding the **new timestamp against the old value**.
Last-write-wins is the mechanism meant to repair exactly this, and it cannot
repair a row whose timestamp lies; the client had been told the write applied, so
it would never retry. Take `SELECT … FOR UPDATE` in the same transaction. Two
alternatives both lose: raising the isolation level turns an ordinary concurrent
edit — the case the design promises is conflict-free — into a serialisation
failure the client must retry, and narrowing the `UPDATE` to the changed column
repairs the timestamp but not the version counter and leaves the comparison
running against a stale snapshot.

**A rules module wrapped in a per-item transaction must never throw.** If it can,
one malformed item fails the whole batch, the caller retries the same batch, and
a client that retries by default is stuck forever behind its own bad item. Write
"never throws for any object input" into the module's doc comment as an
invariant, state what it excludes, and then check every property access, every
date construction and every key enumeration against it. The invariant held only
in someone's head is the one that breaks.

**Split database errors by whether a retry could succeed, not by exception
class.** Those are orthogonal: a constraint violation and a type error live in
different classes and both mean "retrying will not help"; a timeout and a
deadlock share a class with the constraint violation and both mean "retrying
will". Getting it backwards either fails a whole batch on bad data or turns a
transient blip into a permanent refusal the person is shown and the client
discards. Keep a named set of retryable codes with the criterion written beside
it, and apply the criterion to the **whole** vocabulary, not only to the codes
somebody happened to name.

**Guard protocol-owned columns by an explicit list, not by key order.** An object
spread that happens to place literals after a computed key protects some fields
by accident. The accident survives until somebody reorders the lines, and then
nothing fails.

**"Identical answers for an unknown account and a wrong secret" includes
time.** Answering an unknown address without doing the key-derivation work makes
the two paths differ by two orders of magnitude, which enumerates every account
on the instance with a stopwatch and no statistics. Do the same work on the
not-found path against a fixed dummy salt and hash of the same lengths. A review
that checks only the message and the status records this property as satisfied.
And derive the key **asynchronously**: a synchronous key-derivation function on
an unauthenticated endpoint is a denial-of-service amplifier on the very server
whose job is answering requests.

**A refused write is the system working — log it at `warn`.** At `error` it pages
whoever is on call for a stale cursor. And a batch job that processes many
subjects keeps going when one fails, naming the subject in the error; a job that
aborts on the first failure leaves the rest unprocessed with no record of which.

**The body limit and the contract's own maximum must agree, in both
directions.** A limit below what the contract calls legal rejects legal requests
— a batch of the contract's maximum size can exceed a default limit by itself.
A limit raised for one route raises it for the unauthenticated ones too, so bound
the fields in the contract rather than trusting the transport limit.

## Declining this module

A workspace with no server declines it. What disappears elsewhere:

- `specs` keeps every step; its contract is still generated and consumed, just
  not enforced at runtime by anything here.
- `ci` must have its database service, its migration step and its live-server
  proof step **deleted** from the workflow template — not commented out and not
  guarded.
- `docker`'s database service is probably unwanted too, but that is a question
  for the project rather than a consequence.

Nothing in another module writes a file under `apps/backend`, and this module
emits nothing outside it.

## Verify

1. **Two assertions on the error filter, not one**: a request that makes a
   handler throw returns a 5xx whose body does **not** contain the thrown
   message, **and** the logger received that message. Write both; a test that
   checks only the body passes on a filter that has gone silent.
2. A POST carrying a body reaches its handler and is not answered 400. This is
   the body-parser ordering proved, and no GET request proves it.
3. If a hand-written default was added to a migration:
   `SELECT nextval('<sequence>'), nextval('<sequence>')` returns two consecutive
   numbers.
4. The server refuses to start with a required variable unset, and the error
   names the variable.
5. Concurrency is verified **staged, not raced**: one client pauses inside its
   transaction immediately after the read, the other is released from its first
   statement, which makes the interleaving deterministic instead of
   timing-dependent. Then watch it both ways — with the lock removed it must
   fail every time, with the lock in place it must pass every time. Five of five
   and ten of ten is what was run here. A concurrency test nobody has watched
   fail is the least trustworthy kind of test there is, and a test of two
   operations arriving out of order *sequentially* is not a test of concurrency
   at all, though it reads exactly like one.
6. `pnpm --filter <scope>/backend test` refuses to run when the database name
   does not end in `_test`, and prints the two commands that create one.
````

- [ ] **Step 3: Run the validators**

Run: `sh scripts/check-stack.sh . && sh scripts/check-stack.test.sh`
Expected: `stack ok`, `check-stack tests ok`.

- [ ] **Step 4: Commit**

```bash
git add stacks/monorepo/skills/monorepo-stack/SKILL.md \
  stacks/monorepo/skills/monorepo-stack/modules/backend.md
git commit -m "feat(monorepo): add the backend module"
```

---

### Task 7: Module `cli` — a client with a local store and an outbox

**Files:**
- Create: `stacks/monorepo/skills/monorepo-stack/modules/cli.md`
- Modify: `stacks/monorepo/skills/monorepo-stack/SKILL.md` (one table row)

**Interfaces:**
- Consumes: from `core`, the tsconfig split and the turbo tasks; from `specs`,
  the built client package.
- Produces: `apps/cli` with a `bin` entry and the same four turbo tasks. Nothing
  later in this plan depends on it; that is deliberate and is what makes it the
  clean-decline example.

- [ ] **Step 1: Add the table row and run the validator to watch it fail**

```markdown
| [`cli`](modules/cli.md) | A command-line client consuming the generated client, with a local store and an outbox | `specs` |
```

Run: `sh scripts/check-stack.sh .`
Expected: FAIL on the missing `modules/cli.md`.

- [ ] **Step 2: Write the module**

Create `stacks/monorepo/skills/monorepo-stack/modules/cli.md`:

````markdown
# `cli` — a command-line client

The module that costs almost nothing, entirely because `specs` already exists.

## Preconditions

- `core` and `specs` installed. Without `specs` this is a different module and
  this recipe does not have it: a CLI written against a hand-maintained client
  is not cheap and does not stay in agreement with the server.
- No existing `apps/cli`.

## Steps

1. **Create `apps/cli`** as a private package with a `bin` entry pointing at its
   built entry point, depending on the contract package from the workspace.

2. **Read and validate the whole configuration in one place, at startup**, and
   refuse to start rather than failing at first use. Same reasoning as the
   server's configuration class, and the same failure if skipped: a process that
   runs with half its configuration fails later, further away.

3. **Treat exit codes as part of the interface.** A caller must be able to tell
   from the code alone whether to retry, to fix its input, or to stop. Write the
   table into the CLI's own help output, not only into a document.

4. **Parse arguments so that everything after the positional is content.** A
   `-h` inside a task title is part of the title, not a request for help.

5. **Give it a local store holding two things**: a replica of the server's rows,
   and an outbox of operations not yet acknowledged. Prefer a store the runtime
   has built in over one that needs compiling — that choice is what keeps the
   CLI from being the hardest thing in the workspace to install, and it is the
   one place this recipe names a version floor (see the traps).

6. **Present reads as the outbox overlaid on the replica**, and guard unknown
   identifiers on every read path.

## What the consumer decides

The argument parser, the output format, the exit-code vocabulary, the runtime
floor, and the store.

## Traps

**The runtime floor is a real constraint and belongs in the recipe as a minimum
rather than a pin.** The CLI here requires a runtime version recent enough to
carry an embedded SQL database in its standard library, and that single
requirement is what removes the native dependency that would otherwise make this
the hardest package in the workspace to install — on every contributor machine
and in every container image. Write it the way the requirement actually reads:
"Node 24.15+, because `node:sqlite`", never "Node 24.15.0". The first is a
statement about a capability and stays true; the second is a statement about a
Tuesday and is wrong by the next release.

**A CLI that shows the server's rows is wrong the moment it queues an
operation**, because the user's own last action is then the one thing missing
from the screen — and the user has no way to tell "not sent yet" from "did not
work". The fix is to overlay the outbox on the replica for every read, and the
cost is an unknown-identifier guard on every read path. That guard is not
optional and not defensive: the outbox can name a row the replica has never
seen, because the operation that creates a row is itself in the outbox.

## Declining this module

The clean case, and worth reading as the example of what a clean decline looks
like. Nothing else in this recipe reaches into `apps/cli`: no other module's
script writes a file under it, no other module's build reads from it, no CI job
outside this module's own gate mentions it, and no shared script branches on
whether it is present. Declining it is deleting this module's own steps and
nothing else.

That is the property every module is supposed to have. If a future module cannot
say this paragraph about itself, the seam belongs in the recipe's own design
rather than in the project that hits it.

## Verify

1. `<cli> add "fix the -h flag"` stores a title containing `-h` and does not
   print help.
2. With a required configuration value unset, the process exits non-zero before
   doing any work, and the message names the value.
3. An operation queued while the server is unreachable appears in the next
   `list` **before** any successful sync. This is the overlay proved; a list that
   only shows it after a sync is reading the replica.
4. A read that touches an outbox entry naming a row the replica has never seen
   returns without throwing.
5. The documented exit code for a retryable failure differs from the one for a
   bad input, and both differ from `0`. Check the actual codes; a CLI that exits
   `1` for everything has documented a vocabulary it does not speak.
````

- [ ] **Step 3: Run the validators**

Run: `sh scripts/check-stack.sh . && sh scripts/check-stack.test.sh`
Expected: `stack ok`, `check-stack tests ok`.

- [ ] **Step 4: Commit**

```bash
git add stacks/monorepo/skills/monorepo-stack/SKILL.md \
  stacks/monorepo/skills/monorepo-stack/modules/cli.md
git commit -m "feat(monorepo): add the cli module"
```

---

### Task 8: Module `ci` and the workflow template

**Files:**
- Create: `stacks/monorepo/skills/monorepo-stack/modules/ci.md`
- Create: `stacks/monorepo/templates/workflows/tests.yml`
- Modify: `stacks/monorepo/skills/monorepo-stack/SKILL.md` (one table row)

**Interfaces:**
- Consumes: every module above — the turbo task names from `core`, the compose
  service from `docker`, `spec:validate` from `specs`, the `postinstall` and the
  test-database guard from `backend`.
- Produces: `.github/workflows/tests.yml` in the target project, with one
  separately named job per gate. Those names are what the project writes under
  `## Quality gates` in its `CLAUDE.md`, which is the heading layer 1's
  `ci-gates` skill reads.

**Why `ci` comes last rather than third:** a workflow that names a project's
scripts cannot be written before those scripts are named. Putting it third means
writing a template against remembered script names and correcting it five tasks
later, which is how the phantom-script defect got into the consumer's docs in
the first place.

- [ ] **Step 1: Add the table row and run the validator to watch it fail**

```markdown
| [`ci`](modules/ci.md) | Gates matched to the modules the project installed, each a separately named check | whatever is present |
```

Run: `sh scripts/check-stack.sh .`
Expected: FAIL on the missing `modules/ci.md`.

- [ ] **Step 2: Write the workflow template**

Create `stacks/monorepo/templates/workflows/tests.yml`. Every version is a
placeholder: R2 rejects a pinned image tag or a pinned package-manager version,
which is the constraint doing its job rather than an inconvenience.

```yaml
# Copy to .github/workflows/tests.yml and DELETE the job blocks for modules this
# project declined. Delete them — do not comment them out and do not add an
# `if:`. Branch protection counts a skipped required job as blocking rather than
# passing, so a guarded job leaves pull requests unmergeable; and a required
# check that never starts is absent from the check list entirely, which reads as
# passing. Both directions of "disable it" are wrong, in opposite ways.

name: Tests

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: tests-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # --- always ---
  lint:
    name: Lint
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v4
        with:
          version: <the packageManager version in the root package.json>
      - uses: actions/setup-node@v4
        with:
          node-version: <the major from engines.node>
          cache: pnpm
      # Also runs the ORM's generate through the server package's postinstall.
      # Without the generated client, type-aware rules see the ORM's namespace
      # as a stub and pass on code that does not compile.
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: ESLint and Prettier
        run: pnpm lint

  # --- delete this job unless the `specs` module is installed ---
  contract:
    name: Contract
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v4
        with:
          version: <the packageManager version in the root package.json>
      - uses: actions/setup-node@v4
        with:
          node-version: <the major from engines.node>
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Lint the contract
        run: pnpm spec:validate
      # A regeneration that changes anything means the committed client and the
      # contract disagree, which every consumer compiles against.
      - name: Fail if the generated client is stale
        run: |
          pnpm spec:codegen
          git diff --exit-code -- packages/specs/src/generated

  workspace-tests:
    name: Workspace tests
    runs-on: ubuntu-latest
    timeout-minutes: 15

    # --- delete this services block unless the `docker` and `backend` modules
    # are installed. The image and credentials match docker/compose.yml. The
    # port here is the image's OWN port, not the host remap that file uses: the
    # remap exists only to dodge a collision on a developer machine, and a
    # service container has a network to itself.
    #
    # The database name ends in _test because the DB-backed specs empty every
    # table in whatever they connect to, and the test setup refuses a name that
    # does not. This container is thrown away with the job, but the name is what
    # makes that true rather than assumed — and the same guard is what stops the
    # suite reaching a developer's own database, which is how it destroyed one.
    services:
      postgres:
        image: <the image in docker/compose.yml>
        env:
          POSTGRES_USER: <as in docker/compose.yml>
          POSTGRES_PASSWORD: <as in docker/compose.yml>
          POSTGRES_DB: <project>_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    # Setting these here is necessary but not sufficient: the task runner runs
    # each task in a filtered environment, so a variable present in the step is
    # still absent inside the test process unless the task declares it in
    # turbo.json — on the task, never in globalEnv.
    env:
      DATABASE_URL: postgresql://<user>:<password>@localhost:5432/<project>_test
      <OTHER_REQUIRED_VARS>: <ci-only values>

    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v4
        with:
          version: <the packageManager version in the root package.json>
      - uses: actions/setup-node@v4
        with:
          node-version: <the major from engines.node>
          cache: pnpm
      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      # --- delete unless `backend` is installed ---
      # `migrate deploy` applies migrations and nothing else; unlike
      # `migrate dev` it does NOT generate the client. The client comes from the
      # server package's postinstall, which the install step above runs.
      - name: Apply database migrations
        working-directory: apps/backend
        run: pnpm prisma migrate deploy

      # build is listed explicitly although dependsOn: ["^build"] would pull it
      # in, so the ordering is an assertion this job makes rather than an
      # implementation detail of another package's turbo.json.
      - name: Build, typecheck, and test the workspace
        run: pnpm -w exec turbo run build typecheck test

      # --- delete the three steps below unless `backend` is installed ---
      # Everything above calls services and pure functions directly. Nothing
      # above starts an HTTP server, so the controller, the body-parser
      # ordering, the error filter in a real pipeline and the contract validator
      # have no coverage at all. That gap is not hypothetical: an ordering change
      # here once made every POST answer 400, and the task that introduced it
      # verified two GET requests and saw nothing.
      #
      # The port differs from the server's default so the command is the same one
      # a developer runs locally, where the default is often already taken.
      - name: Start the server
        env:
          PORT: 3010
        run: |
          node apps/backend/dist/main.js > backend.log 2>&1 &
          echo $! > backend.pid
          for _ in $(seq 1 30); do
            if curl -sf http://localhost:3010/api/v1/health > /dev/null; then
              exit 0
            fi
            sleep 1
          done
          echo 'the server never answered /health' >&2
          cat backend.log >&2
          exit 1

      - name: Prove the end-to-end path
        env:
          <PROJECT>_URL: http://localhost:3010/api/v1
        run: sh scripts/<proof>.sh

      # Always, so a failed proof still shows what the server logged, and so the
      # job does not wait on a process it started.
      - name: Stop the server
        if: always()
        run: |
          if [ -f backend.log ]; then cat backend.log; fi
          if [ -f backend.pid ]; then kill "$(cat backend.pid)" || true; fi
```

- [ ] **Step 3: Write the module**

Create `stacks/monorepo/skills/monorepo-stack/modules/ci.md`:

````markdown
# `ci` — the gates, and what a gate has to refuse

## Preconditions

- At least one other module installed. This module's content is derived from
  which ones.
- A repository hosted somewhere that runs workflows.
- `core`'s `lint`, `typecheck`, `test` and `build` tasks present, since every
  gate is one of them.

## Steps

1. **Copy [`../../templates/workflows/tests.yml`](../../templates/workflows/tests.yml)**
   to `.github/workflows/tests.yml` and **delete the job blocks and steps for
   every module this project declined.** The template marks each with a comment
   naming its module. Delete — never comment out, never guard with an `if:`.

2. **Replace every placeholder** in the copied file. Run
   `grep -n '<[^>]*>' .github/workflows/tests.yml` and treat the output as the
   list of what remains; an empty result is the check, not a reading of the
   file.

3. **Keep each gate a separate job with its own name**, so a red check names its
   own cause. Lint needs no database and should not wait on one.

4. **Write the job names into the project's `CLAUDE.md` under
   `## Quality gates`**, spelled exactly as branch protection will spell them.
   This list is read by tooling, not decorative: a required check that has not
   started is absent from the check list rather than pending, so a gate that
   counts checks reads an unstarted one as passing.

5. **If the project has an end-to-end proof script**, give it an `sh` shebang and
   keep it POSIX.

6. **Declare each task's environment variables on the task in `turbo.json`**, not
   in `globalEnv` and not only on the CI job.

## What the consumer decides

The runner, how the database is provisioned, the timeouts, whether there is an
end-to-end proof script at all, and which of the named jobs branch protection
actually requires.

## Traps

**A suite that passes everywhere is not yet a suite that runs from a clean
checkout, and the difference is invisible to every local command.** The server
here typechecked and passed 83 tests on every developer machine and failed
instantly on the first honest CI run, because the ORM's client generation was
wired to nothing: `migrate deploy` — the command a CI job reaches for, since
`migrate dev` is interactive — applies migrations and does not generate the
client, while `migrate dev` does. A client generated once during development sat
in `node_modules` and made the repository look buildable for as long as nobody
started from zero. Run the generator from the **package's own `postinstall`**,
never from a CI step: a CI step fixes the pipeline and leaves a fresh clone and
the image build broken, while `postinstall` fixes all three in one line. The
general rule is worth more than the instance: every generated artefact the build
reads must be produced by something the install runs, because the machine that
has it will never tell you it is missing.

**The failure above does not read as a missing artefact, which is why it
survives.** Against a stub client the ORM's types quietly degrade: the namespace
loses its error and isolation-level types, transaction callbacks take an
implicit `any`, and the spec files that import the client throw during collection
and are reported as `(0 test)` — a count that is neither a pass nor a failure and
scrolls past as neither.

**The task runner filters each task's environment, so a variable set on the job
does not reach the task.** The next red run after the one above had a clean
typecheck and 26 of 83 tests failing on a missing `DATABASE_URL` — a variable the
workflow sets on the job where every step can see it. The suite passed under a
direct package-filtered run and failed under the task runner with the identical
environment, and CI runs the latter. Declare the variable on the task. Not in
`globalEnv`: `env` is part of the cache key, which is right for the task that
reads the database and wrong for `build` and `typecheck`, which would then miss
cache on every change to a connection string they never touch.

**A workflow written when the repository held one kind of test does not widen
itself as workspaces appear.** A green pipeline that runs a tenth of the tests
looks exactly like a green pipeline. Check what the job actually executed — the
count, not the colour — every time a package is added.

**The test-database guard is a repair, not defensive programming.** The DB-backed
specs truncate six tables in `beforeEach` with no regard for what is in them, and
they destroyed the development database once before the guard existed. Any recipe
that ships truncating specs must ship the guard in the same module, because the
gap between the two is exactly one afternoon of somebody's data. Put the guard in
the shared setup file rather than in the specs that wipe: a guard a new spec has
to remember to opt into is a guard a new spec will not have. And make the marker
a database **name** rather than an opt-out variable — a variable exported once in
a shell survives into every later command in that shell, including the one run
against the wrong database. A name cannot be exported.

**A proof script with an `sh` shebang and a bash-ism passes on the author's
machine and fails on the runner, and the failure looks like the thing being
proved is broken.** The concrete cost: `set -o pipefail` is not POSIX and `dash`
rejected it outright until 0.5.12, which is the shell `/bin/sh` points at on the
usual runner image. The same applies to process substitution and to `for x in
$var` relying on word-splitting. Capture a command's output into a variable and
parse it afterwards rather than piping, so the exit status stays the command's
and `set -e` can see it.

**Gates must be separate checks with separate names.** One job named "CI" that
runs lint, typecheck, tests and a proof script reports one red square for four
unrelated causes, and the first thing anyone does with it is open the log to find
out which — every time. Separate names also make branch protection expressible:
you cannot require "the tests but not the proof" out of one job.

## Declining this module

A project with no hosted CI declines it, and nothing else changes: no other
module's steps reference a workflow file, and no script reads one. What the
project loses is the only place several of the traps above are caught at all —
say so in its `CLAUDE.md` rather than leaving the gap silent.

## Verify

1. Open a pull request and confirm each gate appears as its **own** named check.
   Count them against the job list; a job that failed to parse does not appear
   and its absence is not an error anywhere.
2. `grep -n '<[^>]*>' .github/workflows/tests.yml` prints nothing.
3. The proof script parses under the runner's shell, not yours:
   `dash -n scripts/<proof>.sh` (or `sh -n` where `/bin/sh` is dash).
4. From a **fresh clone into an empty directory**, `pnpm install
   --frozen-lockfile && pnpm -w exec turbo run build typecheck test` exits `0`.
   This is the clean-checkout trap checked rather than trusted, and it cannot be
   run in the working tree that has been building all along.
5. The number of tests the CI run reports matches what a local run reports. A
   suite that silently collected nothing reports `(0 test)`, which is neither a
   pass nor a failure.
````

- [ ] **Step 4: Run the validators**

Run: `sh scripts/check-stack.sh . && sh scripts/check-stack.test.sh && sh scripts/check-skills.sh .`
Expected: `stack ok`, `check-stack tests ok`, `skills ok`.

Two likely failures, both real: R2 firing on a version left in the workflow
template, and R6 firing on `pnpm spec:validate` or `pnpm spec:codegen` if the
`specs` module's JSON block was edited. Fix the file the rule names.

- [ ] **Step 5: Commit**

```bash
git add stacks/monorepo/skills/monorepo-stack/SKILL.md \
  stacks/monorepo/skills/monorepo-stack/modules/ci.md \
  stacks/monorepo/templates/workflows/tests.yml
git commit -m "feat(monorepo): add the ci module and its workflow template"
```

---

### Task 9: The four in-scope agents, de-projected

**Files:**
- Create: `stacks/monorepo/agents/backend-engineer.md`
- Create: `stacks/monorepo/agents/spec-writer.md`
- Create: `stacks/monorepo/agents/spec-reviewer.md`
- Create: `stacks/monorepo/agents/codegen-runner.md`

**Sources to read before writing, all under
`/home/kkucherenkov/projects/petProjects/course_shelf/.claude/agents/`:**
`backend-engineer.md`, `spec-writer.md`, `spec-reviewer.md`, `codegen-runner.md`.
Read them as a starting point, not as text to edit — each is soaked in the source
project's architecture, and three of the four describe conventions this stack's
`backend` module does not have.

**Interfaces:**
- Consumes: the conventions written in Tasks 5 and 6. An agent must not contradict
  its module, and must not repeat it at length either — it points at the module.
- Produces: four agent definitions discovered at `<plugin>/agents/*.md`.

**Which agents ship, and why not the others.** An agent ships with the module
whose surface it owns. `backend-engineer` owns `backend`; `spec-writer`,
`spec-reviewer` and `codegen-runner` own `specs`. `frontend-engineer` owns `web`
and `flutter-engineer` owns `mobile`, neither of which this plan writes, so
neither ships — an agent without its surface produces confident work in the
wrong idiom, which is D3's reasoning applied inside layer 2. No `cli-engineer` is
invented: there is no captured practice for one, and writing an agent from the
module file it would point at is circular.

**Four things to strip from every one of them:**

1. **Identity nouns.** `@app/specs` becomes "the contract package";
   `apps/backend` stays (it is the shape the recipe prescribes); the source
   project's name and card format go entirely.
2. **Architecture the stack's own `backend` module does not have.** The source
   `backend-engineer` prescribes CQRS with a command bus and a query bus, a
   `domain/application/infra` layering under `src/modules/<context>/`, an
   authentication library, a realtime token endpoint and a data loader. The
   `backend` module written in Task 6 prescribes none of those. Keep only what
   the module actually installs, plus the conventions that are independent of
   layering: typed from the contract, validated at runtime, no hidden I/O in
   controllers, the configuration class as the only reader of the environment,
   list queries shaping their selection rather than projecting in application
   code, errors rendered by the filter.
3. **`pnpm spec:bundle`.** All three spec agents name it. It is the phantom
   script, and the `specs` module creates two scripts, not three. R6 fails the
   build if it survives.
4. **Skills that do not exist.** The source agents' Skills tables name
   `nestjs-expert`, `cqrs-implementation` and `sql-optimization-patterns`; none
   of the three is on this machine's skill list. Real ones covering the same
   ground: `nestjs-best-practices`, `postgresql-table-design`,
   `database-migration`, `security-and-hardening`, `vitest`,
   `api-design-principles`, `typescript-advanced-types`, `pnpm`, `turborepo`.
   Also: `context7` is an MCP server, not a skill — name it as a server, in its
   own line, not as a row in a skills table. Add the note that an agent file's
   Skills section names skills from the host's own set, so a missing one means
   carry on rather than stop.

- [ ] **Step 1: Write `backend-engineer`**

Create `stacks/monorepo/agents/backend-engineer.md`:

```markdown
---
name: backend-engineer
description: Implements server features in apps/backend — controllers, services, schema changes, migrations, authentication. Knows the contract-first loop, the configuration class, the error filter and the write-ordering rules. Use for any change inside apps/backend.
model: sonnet
tools: Read, Write, Edit, Grep, Glob, Bash
---

You own `apps/backend`. Every endpoint you ship is typed from the contract
package, validated at runtime against the same document, and free of hidden I/O
in its controller.

Read the `backend` module of the `monorepo-stack` skill before your first change
in this package. It carries the conventions and the traps; this file carries how
to work, not what the conventions are.

## Rules

- **The contract moves first.** A route changes in `packages/specs/openapi/openapi.yaml`
  before it changes here. The runtime validator rejects drift, so a mismatch
  surfaces as a 400 nobody expected rather than as a failing test.
- **Nothing reads the process environment except the configuration class.** Not
  a default, not a feature flag, not a test.
- **No `any` to escape a type error.** If the type is wrong, the type is the bug.
- **Controllers validate, dispatch and return.** No database calls in a
  controller, no business rules in one.
- **List queries shape their selection for the use case.** Never fetch whole
  entities and project in application code, and never fan out one query per row.
- **Errors go through the filter.** A 4xx may carry its message; a 5xx never
  does, and the logger always gets it.
- **Every write transaction takes its per-subject lock as the first statement**,
  and a read-modify-write locks the row it read.
- **A user-visible string goes through the project's translation layer**, if the
  project has one.

## Workflow for a new endpoint

1. Land the contract change first, or ask `spec-writer` for it.
2. Run `pnpm spec:validate && pnpm spec:codegen`, and commit the generated
   output separately.
3. Write the failing unit test for the handler before the persistence adapter.
4. Wire the controller; start the server and call the endpoint for real. The
   runtime validator catches a response shape that drifted from the contract,
   and nothing else does.
5. Add the end-to-end step if this endpoint is on a path the proof script walks.

## Before you finish

`pnpm -w exec turbo run build typecheck test lint`. Not the package-filtered
run — the task runner filters each task's environment, and a suite that passes
under a filter can fail under the graph with the identical shell.

## Skills

Invoke these before writing code, not after. They come from the host's skill
set rather than from this plugin; if one is missing on this machine, carry on
without it.

| Skill | When |
| --- | --- |
| `nestjs-best-practices` | Module wiring, providers, guards, interceptors, pipes |
| `postgresql-table-design` | Any schema change |
| `database-migration` | Writing or reviewing a migration, especially one with hand-written SQL |
| `security-and-hardening` | Authentication, sessions, tokens, uploads, anything reachable without a session |
| `typescript-advanced-types` | A type that is fighting you |
| `vitest` | Writing or fixing the tests for the above |

The `context7` MCP server answers what a library's current API is. Ask it rather
than trusting your memory of a version.
```

- [ ] **Step 2: Write `spec-writer`**

Create `stacks/monorepo/agents/spec-writer.md`:

```markdown
---
name: spec-writer
description: Writes and evolves the OpenAPI contract in packages/specs. Use proactively whenever an endpoint is being added, renamed or changed, before any implementation. Does NOT write implementation code.
model: sonnet
tools: Read, Write, Edit, Grep, Glob, Bash
---

You are the guardian of `packages/specs`. The contract is the product of your
work; implementation follows it.

Read the `specs` module of the `monorepo-stack` skill before your first change
here.

## Your remit

- Paths, components, schemas and examples in `packages/specs/openapi/openapi.yaml`.
- Keep `info.version` semver-correct: patch for documentation, minor for
  additive, major for breaking.
- Run `pnpm spec:validate` before finishing, and show the result.

## Non-negotiables

- Never touch implementation code under `apps/`, and never touch generated
  output under `src/generated/`.
- Operation ids are camelCase, unique, and verb-first. Client generators build
  method names from them.
- **Every operation has a `summary`.** It becomes the docstring on every
  generated client method, in every language this contract is generated into.
  It is contract content, not a linter's opinion — write it rather than relaxing
  the rule that asks for it.
- **Every request body has `additionalProperties: false`.** JSON Schema defaults
  to open, so a schema with a full `required` list looks strict and accepts any
  extra field. That is the road to mass assignment and it looks closed.
- **Split a variant type by its discriminator with `oneOf`.** A flat schema with
  the common fields in `required` says something much weaker than the
  TypeScript union does, and the runtime validator believes the schema.
- **Every operation declares a `default` error response.** With response
  validation on, a status with no schema makes the validator throw *inside* the
  response, after the error filter has already run — so the client gets a broken
  answer exactly when something is already wrong.
- Every non-2xx response references the shared error schema. Every successful
  response has an example.
- Define an enum once under `components/schemas` and reference it. No inline
  enums in paths.
- A breaking change needs a new URL prefix and an architecture decision record.

## Workflow

1. Read the task's own spec, if it has one.
2. Skim the document for the right place and reuse an existing schema.
3. Make the change; keep path groups together and alphabetised within a group.
4. `pnpm spec:validate`. Fix what it reports rather than handing the error back.
   Where a default rule genuinely does not apply to an operation — a liveness
   probe has no client error to declare — leave the warning visible and say in
   the document why. A silenced warning and an absent one look identical six
   months later.
5. Tell the user, in one line, to run `pnpm spec:codegen` next.

If the ask is underspecified — authentication? pagination? which error codes? —
ask one batched question rather than guessing.

## Skills

| Skill | When |
| --- | --- |
| `api-design-principles` | Naming a resource, choosing a status code, shaping a payload |

The `context7` MCP server answers what OpenAPI 3.1 actually says. Ask it rather
than recalling it.
```

- [ ] **Step 3: Write `spec-reviewer`**

Create `stacks/monorepo/agents/spec-reviewer.md`:

```markdown
---
name: spec-reviewer
description: Read-only review of changes to packages/specs. Use before merging any contract change. Surfaces breaking changes, open request bodies, missing error responses and semver mistakes. Does NOT edit files.
model: sonnet
tools: Read, Grep, Glob, Bash
---

You audit proposed changes to `packages/specs`. You are strict, and you explain
your reasoning so the author can fix things themselves.

## What to check

1. **Semver.** A removed operation, a renamed field, a narrowed type, a newly
   required request field — breaking, and a breaking change without a major bump
   fails.
2. **Open request bodies.** A body without `additionalProperties: false` accepts
   anything the author did not think of, and reads as strict because its
   `required` list is complete.
3. **Variants.** A type with variants must split on its discriminator with
   `oneOf`. A flat schema with the common fields required is weaker than the
   generated union claims, and the runtime validator enforces the schema.
4. **Error responses.** Every operation has a `default`; every non-2xx
   references the shared error schema. A status with no schema makes response
   validation throw inside the response.
5. **Summaries.** Every operation has one. It is the docstring every generated
   client carries.
6. **Examples.** Every successful response and every request body has one.
7. **Consistency.** Pagination, sort and filter parameters, and the datetime
   format, match the operations already there.
8. **Security.** An authenticated operation references an existing scheme; a
   public one says `security: []` explicitly rather than by omission.

## How to report

```
## Verdict
<pass | changes requested | breaking — needs major bump>

## Must fix
- <concrete item with file:line>

## Should fix
- <concrete item>

## Nits
- <concrete item>
```

Be specific. "This is wrong" without a line number is useless.

## Skills

| Skill | When |
| --- | --- |
| `api-design-principles` | The yardstick for naming, status codes and payload shape |
```

- [ ] **Step 4: Write `codegen-runner`**

Create `stacks/monorepo/agents/codegen-runner.md`:

```markdown
---
name: codegen-runner
description: Runs the contract's validate and codegen scripts after a spec change, checks the generated diff is sane, and stages it as its own commit. Use whenever packages/specs has been edited.
model: haiku
tools: Read, Bash, Grep, Glob
---

Fast, mechanical. One job: regenerate, look at the diff, stage it.

## Steps

1. `pnpm spec:validate`. If it fails, stop and report — do not fix the contract.
2. `pnpm spec:codegen`. Two commands, not three: check the root `package.json`
   before running anything else you think belongs in this pipeline.
3. `git status --short packages/specs` to see what changed.
4. Sanity-check the diff:
   - Only files under `src/generated/` changed. Anything else means the
     generator is writing outside its output directory.
   - An operation disappeared from the client **only if** the contract removed
     it — check the contract's own diff, not your memory of it.
   - No empty or truncated generated file.
   - If the generated client imports a runtime package, that package is a
     declared dependency of `packages/specs`. The generator does not add it, and
     nothing catches its absence until a clean install.
5. Report a one-screen summary: files changed, line counts, anomalies.
6. Suggest the commit message: `chore(codegen): regenerate the client for <what
   changed in the contract>`. Generated output lands in its **own** commit, so a
   reviewer reads the contract change without the derived diff, and a
   regeneration that changes nothing shows up as an empty commit rather than as
   noise inside a feature.

## Do not

- Hand-edit a generated file.
- Change the contract to make the generated output look nicer. That is
  `spec-writer`'s job.
- Commit without being asked. Prepare and report.
```

- [ ] **Step 5: Run the validators**

Run: `sh scripts/check-stack.sh . && sh scripts/check-stack.test.sh`
Expected: `stack ok`, `check-stack tests ok`.

Then grep for the two classes of leak the validator cannot see, and read what
comes back rather than counting it:

```sh
grep -rniE 'cqrs|commandbus|querybus|better auth|dataloader|spec:bundle|nestjs-expert|cqrs-implementation|sql-optimization' stacks/monorepo/agents/
```

Expected: no output. Each hit is architecture or a skill name that came from the
source project and has no surface here.

- [ ] **Step 6: Commit**

```bash
git add stacks/monorepo/agents
git commit -m "feat(monorepo): add the backend and contract agents"
```

---

### Task 10: The `CLAUDE.md` stack block and the two in-scope doc templates

**Files:**
- Create: `stacks/monorepo/templates/claude-md-block.md`
- Create: `stacks/monorepo/templates/docs/handbook.md`
- Create: `stacks/monorepo/templates/docs/testing.md`
- Modify: `stacks/monorepo/skills/monorepo-stack/SKILL.md` (a short section
  naming the three templates and where each is written)

**Sources:** the consumer's `.claude/CLAUDE.md`, specifically the 90 lines
between `<!-- STACK:BEGIN -->` and `<!-- STACK:END -->`, which the maintainer
wrote by hand and which carry six traps with their evidence. For the docs,
`/home/kkucherenkov/projects/petProjects/course_shelf/.claude/docs/handbook.md`
and `.../testing.md`.

**Interfaces:**
- Consumes: the module files from Tasks 3-8 — every convention named in a
  template must exist in a module, and the block's trap list is the modules'
  traps reduced to the ones a person needs in context at all times.
- Produces: three templates the `monorepo-stack` skill writes into a project.

**Which doc templates are in scope, and why two rather than four.** The spec
lists `handbook`, `design-system`, `i18n` and `testing`. `design-system` belongs
to `ui` and `i18n` to `web` and `mobile`, all three out of scope, so both are
deferred with their modules. `handbook` and `testing` ship — reduced, not copied:
the source `handbook.md` carries Nuxt and Flutter sections, and the source
`testing.md` carries Storybook, Playwright, a component-audit script and a table
of ratchet coverage thresholds. The thresholds do not travel at all and the
template says why: a ratchet number is a snapshot of one repository's baseline,
and a wrong one either blocks correct work or teaches people to lower it.

- [ ] **Step 1: Write the `CLAUDE.md` stack block template**

Create `stacks/monorepo/templates/claude-md-block.md`. Placeholders use the same
`<UPPERCASE>` convention layer 1 uses, so the same grep finds them.

````markdown
<!--
Written between <!-- STACK:BEGIN --> and <!-- STACK:END --> in the project's
CLAUDE.md, and nowhere else. Nothing outside those markers belongs to this
plugin.

Delete every section whose module this project declined. Do not leave a heading
with nothing under it: an empty section reads, to a machine, exactly like a
filled one, and to a person like an oversight to fix.
-->

## The stack

A <PACKAGE MANAGER> workspace under <TASK RUNNER>. <N> packages, and the
contract package is upstream of everything that consumes it.

| Path | What |
| --- | --- |
| `packages/specs` | The contract: the OpenAPI document and the client generated from it. |
| `apps/backend` | <FRAMEWORK> over <DATABASE>. <THE WRITE SURFACE, IN ONE LINE>. |
| `apps/cli` | <WHAT IT IS FOR, AND WHO CALLS IT>. |
| `scripts/<PROOF>.sh` | The end-to-end proof. CI runs it against a live server. |

Design and rationale live in `docs/`. Where the code and a document disagree,
<WHICH DOCUMENT IS BINDING>.

### Contract first, always

A route changes in `packages/specs/openapi/openapi.yaml` **before** it changes
in the server — the runtime validator rejects drift, so a mismatch surfaces as a
400 nobody expected rather than as a failing test.

```sh
pnpm spec:validate && pnpm spec:codegen
```

Generated artefacts land in their own commit.

### Running it

```sh
pnpm install                     # also generates the ORM client (see below)
docker compose -f docker/compose.yml up -d
pnpm -w exec turbo run build typecheck test
pnpm lint
```

<SERVICE> is published on **<REMAPPED PORT>**, remapped from the container's
<DEFAULT PORT> so it does not collide with a developer's own.

```sh
<REQUIRED ENVIRONMENT VARIABLES, ONE PER LINE>
```

### Tests need a database whose name ends in `_test`

`apps/backend/<TEST SETUP FILE>` aborts the run otherwise, and prints the two
commands that create one. The guard exists because the DB-backed specs truncate
every table in `beforeEach` with no regard for what is in them — they destroyed
the development database once before the guard was added.

### Traps, each of which cost real time

<!--
Keep every trap's evidence: what was observed, what it looked like, and what it
cost. A trap compressed to an instruction is a trap the next reader overrides.
Delete the ones whose module this project declined; add the project's own as
they are found.
-->

1. **`migrate deploy` does not generate the ORM client** — only `migrate dev`
   does, and `migrate dev` is interactive so CI never runs it. The client comes
   from the server package's `postinstall`. Without it the ORM's namespace
   silently degrades to a stub: the compiler loses its error and isolation-level
   types, transaction callbacks take an implicit `any`, and the DB-backed specs
   throw on import and are reported as `(0 test)` — which is neither a pass nor
   a failure and scrolls past as neither.
2. **The task runner filters each task's environment.** A variable set in the
   shell or on a CI job reaches a task only if that task declares it in
   `turbo.json`. Put it on the task, never in `globalEnv`, which drags it into
   the cache keys of tasks that never read it.
3. **The body parser must be registered before the contract validator.** The
   framework registers its own inside `listen()`, which runs after every
   `app.use()`, so the validator reads an undefined body and rejects **every**
   POST with a 400 complaining the body is missing. `main.ts` does this
   deliberately; do not reorder it.
4. **`scripts/<PROOF>.sh` has an `sh` shebang.** Nothing non-POSIX belongs in
   it — `set -o pipefail` is not POSIX and `dash` rejected it until 0.5.12, and
   `dash` is what `/bin/sh` points at on the runner.
5. **<THE PROJECT'S SINGLE WRITE SURFACE, IF IT HAS ONE>** — so every invariant a
   client could violate is enforced there or nowhere. List them.
6. **<ANY HAND-WRITTEN SQL THE ORM CANNOT SEE>.** The schema does not know it
   exists, so every generated migration touching those models drops it —
   silently, since nothing fails at migration time or at boot. Read the generated
   SQL of every such migration before applying it, and say here exactly what to
   delete from it.
````

- [ ] **Step 2: Write the handbook template**

Create `stacks/monorepo/templates/docs/handbook.md`. Take the source handbook's
TypeScript, module, inversion-of-control, ORM, validation, errors, API
conventions and migration sections; drop its Nuxt and Flutter sections
wholesale, and drop the CQRS command-return-type rule, which belongs to an
architecture this stack does not install.

Sections, in this order: **Hard bans** (no reading the environment outside the
configuration class, no `any` to escape a type error, no route without a
contract entry first, no hand-edited generated output, no applied migration
edited in place); **TypeScript** (explicit return types on exported functions;
`noUncheckedIndexedAccess` and what it is for); **Modules and inversion of
control** (a port is an interface, an adapter implements it, nothing constructs
its own dependency); **Persistence** (shape the selection for the use case, no
query per row, the read-modify-write lock); **Validation** (the contract
validates the wire, the application validates the invariant, and the two are
different jobs); **Errors** (the 4xx/5xx message rule, the retryable-vs-not
split by criterion rather than exception class); **API conventions** (URI
versioning under a global prefix, camelCase operation ids, the shared error
schema, pagination); **Migrations** (immutable once applied, commentary beside
not inside, read the generated SQL when hand-written defaults exist).

Every one of those has its evidence in the `backend` and `specs` module files —
carry the evidence, do not summarise it into advice.

- [ ] **Step 3: Write the testing template**

Create `stacks/monorepo/templates/docs/testing.md`. Sections: **The pyramid**
(unit on handlers and pure functions with ports mocked; integration through the
real persistence layer against a disposable database; one end-to-end proof
against a live server, because nothing below it exercises the controller, the
parser ordering, the error filter in a real pipeline or the contract validator);
**Don't mock what you own** (mock ports, not the persistence layer and not the
HTTP layer); **Definition of done**; **The PR checklist**.

Then the four test lessons, each with its evidence, which is the part no
checklist carries:

- **A test that passes with and without the code it covers is worse than no
  test**, because it reads as coverage. The only way to know is to break the
  code and watch the test fail. This caught a vacuous assertion at the moment of
  writing once, and a round later three more times.
- **Strengthening a test is changing a test** and deserves the same proof. A
  positive control added in the wrong place can make the assertion true for a
  legitimate reason and silently stop measuring.
- **A concurrency test must be staged, not raced, and watched failing.** Two
  operations arriving out of order *sequentially* is not concurrency, and a test
  of it reads exactly like coverage of concurrency while proving nothing about
  it — one such test existed, passed, and a lost-update defect went to
  whole-branch review. Stage it: one client pauses inside its transaction
  immediately after the read, the other is released from its first statement.
  Then verify both directions, five failures out of five with the guard removed
  and ten passes out of ten with it.
- **Make sure the suite actually runs, and runs from a clean checkout.** A
  workflow written when the repository held one kind of test does not widen
  itself as workspaces appear, and a green pipeline running a tenth of the tests
  looks exactly like a green pipeline.

Say explicitly that no coverage threshold travels, and why: a ratchet number is
one repository's baseline on one day. A wrong one either fails correct work or
teaches people to lower it, and both are worse than measuring coverage and
reading the number.

- [ ] **Step 4: Name the templates in the skill**

Append to `stacks/monorepo/skills/monorepo-stack/SKILL.md`:

```markdown
## Templates

Three files travel as templates rather than as instructions, because their
correctness does not expire with a major version.

| Template | Written to | When |
| --- | --- | --- |
| [`claude-md-block.md`](../../templates/claude-md-block.md) | between `<!-- STACK:BEGIN -->` and `<!-- STACK:END -->` in the project's `CLAUDE.md` | after every module install, rewriting only that region |
| [`docs/handbook.md`](../../templates/docs/handbook.md) | `docs/handbook.md` (or wherever the project keeps convention docs) | once, with `backend` |
| [`docs/testing.md`](../../templates/docs/testing.md) | `docs/testing.md` | once, with the first module that adds tests |

Two more — a design-system document and an i18n document — belong to modules
this plugin does not yet have, and are absent rather than shipped empty.

Delete from each template every section whose module the project declined, and
replace every `<PLACEHOLDER>`. `grep -n '<[A-Z_ ]*>' <file>` printing nothing is
the check.
```

- [ ] **Step 5: Run the validators and check for leaks**

Run: `sh scripts/check-stack.sh . && sh scripts/check-stack.test.sh`
Expected: `stack ok`, `check-stack tests ok`.

Then, and read the output rather than counting it:

```sh
grep -rniE 'storybook|playwright|schemathesis|nuxt|flutter|dart|tailwind|coverage threshold|audit:components' stacks/monorepo/templates/
```

Expected: no output. Every hit is a convention belonging to a module this plan
does not write.

- [ ] **Step 6: Commit**

```bash
git add stacks/monorepo/templates stacks/monorepo/skills/monorepo-stack/SKILL.md
git commit -m "feat(monorepo): add the CLAUDE.md block and the convention docs"
```

---

### Task 11: Generate a tree from the recipe, diff it against the consumer, fix the recipe

**Files:**
- Modify: whichever module files the diff proves wrong — that is the deliverable.
- Modify: `stacks/monorepo/README.md` (the validation record)
- Scratch, never committed: `$SCRATCH/tree-a/` and `$SCRATCH/tree-b/`, where
  `SCRATCH` is this session's scratchpad directory.

**Interfaces:**
- Consumes: every file written by Tasks 1-10.
- Produces: a recipe that has been run, and a record in the README saying when
  and against what.

**This task is the plan's own self-check, and it is written so it cannot pass by
comparing nothing.** Every generation step is followed by an assertion that the
generation happened, and the diff is not attempted until those assertions hold.

- [ ] **Step 1: Generate tree A — every in-scope module**

Create the scratch directory and follow the recipe. Read each module file and do
what it says. Where a module says "the consumer decides", decide as a new
project would: scope `@probe`, a database on a non-default host port, an ES
target, a Node floor. **Do not copy a single file from the consumer's tree** —
the point of this step is to find out whether the recipe alone gets there.

```sh
SCRATCH=/tmp/claude-1000/-home-kkucherenkov-projects-petProjects-course-shelf/f510be5a-5b09-4ae7-a213-385d6c7eb32a/scratchpad
mkdir -p "$SCRATCH/tree-a" && cd "$SCRATCH/tree-a" && git init -q
```

Then, in order: `core`, `docker`, `specs`, `backend`, `cli`, `ci`. For `specs`,
write two operations — a liveness probe and one POST with a request body — which
is the minimum that exercises the summary rule, the `oneOf` rule, the
`additionalProperties` rule and the `default` response rule.

- [ ] **Step 2: Assert the generation happened, before any comparison**

This is the gate. If it fails, the task fails; do not proceed to the diff and do
not report a result.

```sh
cd "$SCRATCH/tree-a"
missing=0
for f in package.json pnpm-workspace.yaml turbo.json tsconfig.base.json \
  eslint.config.mjs .prettierignore docker/compose.yml \
  packages/specs/package.json packages/specs/openapi/openapi.yaml \
  packages/specs/tsconfig.json apps/backend/package.json \
  apps/backend/tsconfig.json apps/backend/tsconfig.build.json \
  apps/cli/package.json apps/cli/tsconfig.json apps/cli/tsconfig.build.json \
  .github/workflows/tests.yml; do
  [ -e "$f" ] || { echo "MISSING $f" >&2; missing=$((missing + 1)); }
done
[ "$missing" -eq 0 ] || { echo "generation did not happen: $missing file(s) absent" >&2; exit 1; }

pnpm install || { echo 'install failed — the recipe does not produce an installable tree' >&2; exit 1; }
pnpm -w exec turbo run build typecheck lint || { echo 'gates failed on the generated tree' >&2; exit 1; }
echo 'tree A generated and its gates pass'
```

**A missing file, a failed install or a failed gate is a recipe defect, not a
scratch-directory problem.** Fix the module that should have produced it, and
re-run from Step 1. Record what you fixed.

- [ ] **Step 3: Diff tree A against the consumer's snapshot, file by file**

Read the consumer's version out of git rather than off disk, so the comparison
is against `b9c5fe3` and not against whatever has landed since:

```sh
CONSUMER=~/projects/petProjects/todoer
for f in package.json pnpm-workspace.yaml turbo.json tsconfig.base.json \
  eslint.config.mjs .prettierignore .gitignore \
  docker/compose.yml \
  packages/specs/package.json packages/specs/tsconfig.json packages/specs/.gitignore \
  apps/backend/package.json apps/backend/tsconfig.json apps/backend/tsconfig.build.json \
  apps/cli/package.json apps/cli/tsconfig.json apps/cli/tsconfig.build.json \
  .github/workflows/tests.yml; do
  echo "=== $f ==="
  git -C "$CONSUMER" show "b9c5fe3:$f" 2>/dev/null > "$SCRATCH/consumer-file" \
    || { echo '(absent in the consumer)'; continue; }
  diff -u "$SCRATCH/consumer-file" "$SCRATCH/tree-a/$f" || true
done
```

Note that the consumer's workflow file is `test.yml`, not `tests.yml` — compare
the template against that one and either rename in the template or record why
the names differ.

**An acceptable difference:**
- the lockfile, and every dependency version inside `package.json` (D12 — the
  recipe resolved them at install time, which is the whole design)
- the package scope (`@probe` against the consumer's)
- generated files under `src/generated/`, and `dist/`
- the consumer's own domain: its entities, its routes, its migrations, its
  source files, its proof script's contents
- timestamps, and any absolute path
- the consumer's own later additions — anything committed after the snapshot is
  not in scope, which is why the snapshot is pinned

**A recipe defect:**
- a configuration **key** the consumer has and tree A does not, or vice versa —
  a missing `exactOptionalPropertyTypes`, a missing `env` on the `test` task, a
  missing `ignoreRestSiblings`
- a **file** the consumer has, that its build or its gates need, and that no
  module told you to create
- a script named in the recipe's prose with no matching key in tree A's
  manifests (R6 should have caught this statically; if the diff finds one the
  rule missed, fix the rule too)
- a step in a module's `## Verify` that does not actually run, or that passes on
  a tree where the thing it verifies is absent
- an ordering the consumer has for a reason — the body parser before the
  validator, `build` before `typecheck` — that the recipe left unstated

Fix each defect in the module that owns it, and re-run Steps 1-3 for the
affected module. Commit each fix with a message saying what the diff showed:
`fix(monorepo): <module> never told anyone to <thing>`.

- [ ] **Step 4: Generate tree B with two modules declined, and prove the decline is clean**

This is Review Focus item 1, and it is the only real test of it: a decline that
has never been performed is a paragraph.

```sh
mkdir -p "$SCRATCH/tree-b" && cd "$SCRATCH/tree-b" && git init -q
```

Install `core`, `docker` and `backend` only — `specs` declined, and therefore
`cli` declined with it, following each module's `## Declining this module`
section exactly.

Then assert:

```sh
cd "$SCRATCH/tree-b"
# No orphan reference to a declined module anywhere in the tree.
if grep -rn --exclude-dir=node_modules --exclude-dir=.git \
   -E 'packages/specs|apps/cli|spec:validate|spec:codegen' .; then
  echo 'a declined module left a reference behind — recipe defect' >&2
  exit 1
fi
# Nothing emitted switched-off.
if grep -rn --exclude-dir=node_modules --exclude-dir=.git \
   -E '^\s*#\s*(- run:|- name:)|if: *false' .github/workflows/; then
  echo 'a declined job was disabled rather than deleted — recipe defect' >&2
  exit 1
fi
pnpm install && pnpm -w exec turbo run build typecheck lint \
  || { echo 'the declined-module tree does not build' >&2; exit 1; }
echo 'tree B: declines are clean and its gates pass'
```

Every failure here is a seam in the recipe. Fix the module that owns the seam —
never the assertion, and never by telling the project to edit another module's
files.

- [ ] **Step 5: Run every command the recipe names**

R6 proves a named script exists in a manifest. This proves it runs.

```sh
cd "$SCRATCH/tree-a"
grep -rhoE 'pnpm (run )?[a-z][a-z-]*:[a-z][a-z-]*' \
  ~/projects/petProjects/shipyard/stacks/monorepo | sed 's/^pnpm \(run \)\?//' \
  | sort -u > "$SCRATCH/named-scripts"
while read -r s; do
  printf '=== pnpm %s ===\n' "$s"
  pnpm "$s" || echo "FAILED: pnpm $s"
done < "$SCRATCH/named-scripts"
```

Expected: every one runs. A `FAILED` line is Review Focus item 5 caught at the
last possible moment, and the fix is in the module that named it.

- [ ] **Step 6: Record the validation in the plugin README**

Append to `stacks/monorepo/README.md`. The record names the date, the modules
and the gates — **not** the consumer, which is an identity noun R1 forbids and
would make this recipe read as a fork of one repository:

```markdown
## Validated

Last run: 2026-09-26. Every in-scope module was installed from these
instructions into an empty directory, and the resulting workspace installed,
built, typechecked and linted clean. A second tree was generated with the
contract and CLI modules declined; it left no reference to either, disabled
nothing, and passed the same gates.

Re-run this when a module changes. A recipe that calls upstream generators goes
stale silently — the generators move and the instructions do not — so the run is
what reports the staleness, and the date above is how long ago something last
did.
```

- [ ] **Step 7: Final gate and commit**

```bash
cd ~/projects/petProjects/shipyard
sh scripts/check-skills.sh . && sh scripts/check-skills.test.sh \
  && sh scripts/check-stack.sh . && sh scripts/check-stack.test.sh
```

Expected: `skills ok`, `check-skills tests ok` (whatever its exact wording),
`stack ok`, `check-stack tests ok`.

```bash
git add stacks/monorepo
git commit -m "docs(monorepo): record the recipe's first validation run"
```

- [ ] **Step 8: Open the pull request**

```bash
git push -u origin feat/monorepo-stack
gh pr create --title "feat: add the monorepo stack plugin" --body "$(cat <<'EOF'
Phase 4 of the two-layer template: a second plugin, `shipyard-monorepo`, under
`stacks/monorepo/`.

Six modules — core, docker, specs, backend, cli, ci — extracted from a first
consumer and validated by generating a workspace from the instructions alone and
diffing it against that consumer's tree. A second generation with two modules
declined proves a decline leaves nothing behind.

Four modules (web, ui, tokens, mobile) and two agents (frontend-engineer,
flutter-engineer) are deliberately absent: no project has installed them, and
writing them from memory is what this design exists to avoid.

`scripts/check-stack.sh` enforces the constraints reading cannot: no identity
noun from the source project or the first consumer, no version pinned into an
install specifier, every trap carrying its evidence, every module answering what
declining it costs, and no command named in prose that the recipe never creates.
EOF
)"
```

Wait for CI with the `Monitor` tool, not a sleep-and-poll loop. No attribution
trailer in either the commits or the body.

---

## Self-Review

**1. Spec coverage.** Section 5's form table: recipe-shaped parts (dependencies
and scaffolding) are Tasks 3-8's `## Steps`, every one of which calls a generator
rather than freezing output; file-template parts are Tasks 8 (workflows), 9
(agents) and 10 (`claude-md-block`, handbook, testing). The module table:
`core` (T3), `docker` (T4), `specs` (T5), `backend` (T6), `cli` (T7), `ci` (T8);
`web`, `ui`, `tokens`, `mobile` and `realtime` have no task and the reason is in
"What this plan does not do". The tree the spec sketches is implemented with one
correction, stated as Review Focus item 2 — `SKILL.md` moves under
`skills/monorepo-stack/` or the plugin loads nothing. D12 is Global Constraint 3
and validator rule R2; D13 is Task 1's `plugin.json` keywords and version, with
the `v*.*.*` tag left to the release rather than to this branch, since tagging a
branch that has not merged is D13's own failure mode in reverse; D14 is Task 2's
module graph. Two things in section 5 I could not turn into a task: the first
consumer's **offline-first operation log** and its **device-code or scoped-token
session model** are product decisions of one project, not stack shape — they
appear only as the shapes that justify a rule (`cli`'s outbox overlay,
`backend`'s row lock), which is the most a recipe can honestly carry. Section 5's
"`@app/ui` and its 62 exports does not travel" needed no task, being a statement
that something is out of scope.

**2. Placeholder scan.** No "TBD", no "add appropriate error handling", no
"similar to Task N". Task 10's steps 2 and 3 describe section lists rather than
printing the full templates — that is the one place in the plan where an
executor writes substantial prose from named sources rather than transcribing a
block, and both steps name every section, its source file, and the evidence each
must keep. The `<PLACEHOLDER>` tokens inside the templates are the artefact's own
content, filled by a project rather than by this plan, and every template names
the grep that proves they were filled.

**3. Type consistency.** Script names are `spec:validate` and `spec:codegen`
everywhere and nowhere is there a third — Tasks 5, 8, 9, 11 and validator rule
R6 all use exactly those two. The six module headings are spelled identically in
Task 2's R3 loop, Task 2's fixture builder, and Tasks 3-8's files:
`## Preconditions`, `## Steps`, `## What the consumer decides`, `## Traps`,
`## Declining this module`, `## Verify`. The validator is
`scripts/check-stack.sh` with test `scripts/check-stack.test.sh` in every task.
The plugin is `shipyard-monorepo`, the directory `stacks/monorepo/`, the skill
`monorepo-stack`, consistently — and deliberately not the spec's
`shipyard-ts-monorepo` / `ts-monorepo`, for the reason in Global Constraints.
Turbo task names `build`/`typecheck`/`test`/`lint` are fixed in Task 3 and reused
unchanged in 5, 6, 7, 8 and 11.

**4. Review Focus.** Six lines, each with an owning task and a runnable check:
undeclinable module (T2 rule R3, T5's prose, T11 step 4), unloadable plugin (T1
step 11), a pinned version (T1 rule R2, run in every later task), a trap without
its evidence (T1 rule R5), a phantom script (T1 rule R6 statically, T11 step 5
by running it), and a validation that compared nothing (T11 step 2's gate, which
exits non-zero before any diff runs). The sixth exists because the spec's own
tree sketch contains the defect, which made it too likely to leave off the list.
