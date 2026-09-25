# `project-skeleton` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a GitHub template repository that gives a brand-new project the
process layer on its first commit — the task stack, the working agreement, the
contract headings the `shipyard` skills read, and a commit-message gate that
needs no package manager.

**Architecture:** ten files and no application code. Most content is lifted
from `course_shelf` with its project nouns removed. The one piece of real logic
is `scripts/check-pr-title.sh`, a POSIX shell validator for Conventional
Commits subjects, which exists because the original gate in `course_shelf`
depends on a local composite action and on Node — neither of which a fresh
repository has.

**Tech Stack:** POSIX shell, GitHub Actions, Markdown. No Node, no package
manager, no dependencies.

**Spec:** [`docs/superpowers/specs/2026-09-25-project-template-two-layer-design.md`](../specs/2026-09-25-project-template-two-layer-design.md)
— phase 2 of section 7. Read section 3 (the `CLAUDE.md` contract) before Task 2.

## Where the work happens

This repository is **not** `course_shelf`. Create it at
`~/projects/petProjects/project-skeleton`. Every path in this plan is relative
to that directory unless it says `course_shelf/`.

Source files are read from `~/projects/petProjects/course_shelf`.

## Global Constraints

Every task's requirements implicitly include this section.

- **No dependency on a package manager.** The skeleton is installed into
  projects whose stack is not yet chosen, and possibly is not Node. Nothing in
  it may require `npm`, `pnpm` or a lockfile. The Node-based `commitlint` and
  `husky` setup belongs to a layer-2 stack module, not here.
- **No `course_shelf` nouns.** No `courseshelf`, `course_shelf`, `@app/`,
  `E<NN>-F<NN>`, `apps/backend`, `apps/web`, `packages/specs`, Centrifugo,
  Prisma, Nuxt or NestJS. Task 6 greps for these and fails the build if any
  survive.
- **Placeholders use one syntax: `<ANGLE_CAPS>`.** `<PROJECT>`, `<LANG>`,
  `<OWNER>`. One grep (`grep -rn '<[A-Z_]\+>'`) must find every spot a human
  has to fill. Never use `{{ }}`, `TODO`, or a prose instruction in place of a
  placeholder.
- **Every heading a skill reads is spelled exactly as the spec's section 3
  spells it**, including case: `## Quality gates`, `## Deploy targets`,
  `## Issue mirroring`, `## Audit personas`, `## Audit routes`. A skill matches
  the heading text; a renamed heading is an unfindable section.
- **Committed content is English.** Prose addressed to the maintainer in chat
  is Russian; everything in the repository is English.
- **Conventional Commits with no `scope-enum`.** The skeleton does not know
  what scopes a project will have. Scope is optional and unconstrained.

## Review Focus

Five conditions the spec implies that no obvious task would exercise. Each has
a test in the task named.

1. **A PR title containing shell metacharacters** — `feat: add $(rm -rf /) support`.
   The gate must reject or accept it on its text alone and must never execute
   it. Title reaches the script as `"$1"`, and the workflow passes it through
   `env:`, never through `${{ }}` inside `run:`. Test in Task 3.
2. **A title that is valid but too long** — 100 characters of correct
   Conventional Commits. A regex-only gate passes it, and the squash commit
   lands an unreadable subject on the default branch. Test in Task 3.
3. **A title with a breaking-change marker** — `feat(api)!: drop v1`. A naive
   pattern anchors `:` straight after the scope and rejects the `!`, blocking
   exactly the commits that most need to land correctly. Test in Task 3.
4. **A revert commit** — `revert: feat(api): add pagination`. GitHub generates
   this subject itself, so a gate that omits `revert` from its type list
   blocks a revert during an incident. Test in Task 3.
5. **An unfilled placeholder reaching a real project** — someone creates a
   repository from the template and never runs the fill. `<PROJECT>` in
   `CLAUDE.md` then silently becomes the project's name in every `tuxedo` and
   `dnote` command. Test in Task 6, which is the template's own smoke test.

---

### Task 1: Repository and the task stack

**Files:**

- Create: `.gitignore`
- Create: `specs/tasks/README.md`
- Create: `specs/tasks/templates/feature.md`
- Create: `specs/tasks/active/.gitkeep`
- Create: `specs/tasks/done/.gitkeep`

**Interfaces:**

- Consumes: nothing.
- Produces: the directory pair `specs/tasks/active/` and `specs/tasks/done/`,
  and the id format `T-YYYY-MM-DD-<branch-slug>`. The `task-stack` skill in
  `shipyard` depends on both by path and by name.

- [ ] **Step 1: Create the repository**

```bash
mkdir -p ~/projects/petProjects/project-skeleton
cd ~/projects/petProjects/project-skeleton
git init -b main
mkdir -p specs/tasks/active specs/tasks/done specs/tasks/templates
touch specs/tasks/active/.gitkeep specs/tasks/done/.gitkeep
```

- [ ] **Step 2: Write `.gitignore`**

```gitignore
# Editors and OS
.DS_Store
*.swp

# Claude Code local state
.claude/settings.local.json
.claude/worktrees/
```

Nothing else. A skeleton that ignores `node_modules/` presumes a stack.

- [ ] **Step 3: Write `specs/tasks/README.md`**

Lift `course_shelf/specs/tasks/README.md` and make exactly these three
changes: drop the closing section "Entries older than the split" (it recounts
`course_shelf`'s own migration), change the example branches to generic ones,
and keep everything else — in particular both rationale sections, which are the
reason the format is what it is.

```markdown
# Task stack

The only durable record of what Claude (or a human) is working on, what is
blocked, and what has already shipped. Two directories, **one file per entry**:

- **`active/`** — work in flight. One file per task, named after its id.
- **`done/`** — the archive. Shipped and cancelled tasks, same file, moved here
  with `git mv`.

There is no index file and nothing to regenerate: `ls specs/tasks/active/` is
the stack, and `cat specs/tasks/active/*.md` reads it.

## Why one file per entry

The obvious layout is two files, `active.md` and `done.md`, each an
append-at-the-top list. Every lane then writes at the top of the same file, so
every lane after the first hits a conflict there — in a file whose entries
never actually overlap.

A custom merge driver (`merge=taskstack`) resolves that locally and works. It
cannot help where the cost actually lands: **GitHub does not run custom merge
drivers.** It computes mergeability with a plain three-way merge, so the PR
page says CONFLICTING regardless, the lane has to rebase, the force-push
restarts the whole CI run, and a green PR goes back through the full check
suite to absorb a bookkeeping line.

Separate files cannot conflict — locally or on GitHub. Finishing a task is a
rename, which git tracks by itself, so the "the other lane already moved this
entry to done" case that the driver needed special code for cannot arise.

## Rules

1. **Before touching code**, create `active/<id>.md` from
   [`templates/feature.md`](templates/feature.md).

2. **While working**, tick sub-steps in place. If the task is blocked, set
   `Status: blocked` and fill `Blockers:`.

3. **When shipped**, `git mv specs/tasks/active/<id>.md specs/tasks/done/`,
   set `Status: done`, and add `- Completed: YYYY-MM-DD` and
   `- Result: <PR link>`. The entry must reference the spec it implemented so
   the audit trail survives.

4. **Never delete** a file from `done/`. A cancelled task moves there with
   `- Result: cancelled — <reason>`.

5. **Stack depth** — `active/` should rarely hold more than three files. If it
   does, something is being left half-done. Close or cancel before opening the
   next.

## Task ID format

`T-YYYY-MM-DD-<branch-slug>` — the date the entry was created, then the task's
own branch with its Conventional-Commits type prefix dropped and `/` replaced
by `-`:

| Branch                    | Id                                |
| ------------------------- | --------------------------------- |
| `fix/dark-theme-contrast` | `T-2026-01-15-dark-theme-contrast` |
| `feat/export-to-markdown` | `T-2026-01-15-export-to-markdown`  |
| `chore/bump-node-22`      | `T-2026-01-15-bump-node-22`        |

**Do not allocate a number.** A counter of the form `T-YYYY-MM-DD-NNN` has no
allocator: a lane picks the next free number by reading what exists, so two
lanes working at the same time read the same state and pick the same number.
A branch slug needs no allocator because the uniqueness already exists further
up — two lanes cannot share a branch.

The filename is the id, so a collision is not a merge conflict; it is two lanes
trying to create the same path, which git refuses outright.
```

- [ ] **Step 4: Write `specs/tasks/templates/feature.md`**

```markdown
# Feature task template

Copy this block into a new file at `specs/tasks/active/<id>.md` when starting a
task. Replace the placeholder values. The id is the creation date plus your
branch slug — `T-YYYY-MM-DD-<branch-slug>`, no counter to allocate; the format
and why it is not a number are in [`specs/tasks/README.md`](../README.md).

​```md
## T-YYYY-MM-DD-{branch-slug} — {short title, verb-led}

- Created: YYYY-MM-DD
- Owner: claude | @handle
- Spec: [link to a design doc, ADR, or issue]
- Goal: one sentence on the outcome, not the steps.
- Acceptance:
  - observable behaviour 1
  - observable behaviour 2
- Tests: {unit / integration / e2e — what is covered}
- Sub-steps:
  - [ ] …
  - [ ] …
- Status: in-progress | blocked | paused
- Blockers: —
​```

## Field rules

- **Goal** is the _why_. The sub-steps are the _how_. Keep them separate — the
  goal survives re-planning, the sub-steps do not.
- **Acceptance** is what a human can verify without reading code. "Users can
  cancel a booking from the detail page" — not "CancelBookingCommand is
  dispatched".
- **Status: blocked** requires a filled `Blockers:` line naming what is needed
  and from whom. A blocked task with an empty blocker is an abandoned task.
```

Note: the two `​```md` fences above carry a zero-width space so this plan
renders. Write them as plain triple backticks in the real file.

- [ ] **Step 5: Verify no project nouns survived**

Run:

```bash
cd ~/projects/petProjects/project-skeleton
grep -rniE 'course.?shelf|@app/|apps/(backend|web|mobile)|packages/specs|centrifugo|prisma|nuxt|nestjs' specs/ && echo "FOUND — fix them" || echo "clean"
```

Expected: `clean`.

- [ ] **Step 6: Commit**

```bash
git add .gitignore specs/
git commit -m "chore: add the task stack and its rationale"
```

---

### Task 2: The `CLAUDE.md` contract

**Files:**

- Create: `.claude/CLAUDE.md`

**Interfaces:**

- Consumes: the directory layout from Task 1.
- Produces: the headings `## Quality gates`, `## Deploy targets`,
  `## Issue mirroring`, `## Audit personas`, `## Audit routes`, and the marker
  pair `<!-- STACK:BEGIN -->` / `<!-- STACK:END -->`. Every `shipyard` skill
  and the layer-2 stack plugin address these by exact text.

- [ ] **Step 1: Write `.claude/CLAUDE.md`**

```markdown
# <PROJECT> — quick reference

## Working agreement

Five rules that govern _how_ work happens here, independent of what is being
built. They apply to every task, including one-line fixes.

### 1. Answer in <LANG>

All prose addressed to the maintainer is in **<LANG>**. Code, identifiers, file
paths, commit messages, code comments, and everything committed to this
repository stay in **English** — the codebase has one language and it is not
the conversation's.

### 2. Plan before you touch anything

Every task starts with a plan, not an edit. Read the code the change touches,
trace the real flow end to end, then say what you intend to do before doing it.
For anything larger than a one-line fix, that plan becomes a file under
`specs/tasks/active/` **before** the first edit — not after.

If the task is ambiguous, if there is an architectural fork, or if a library
has to be chosen, ask **first**. A plan built on a guess costs more than the
question.

### 3. Update the documentation in the same pass

A change is not done when the code works. If the change alters behaviour,
structure, contracts, or setup, the docs that describe it change in the same
commit or PR.

**Never leave a document asserting something that is no longer true.** A stale
claim is worse than no claim.

### 4. Long-term memory lives outside the chat

Two tools, two roles, no overlap:

| Tool     | Holds                                            | Test                 |
| -------- | ------------------------------------------------ | -------------------- |
| `tuxedo` | **what still has to be done** — tasks, deadlines | a verb in the future |
| `dnote`  | **what was learned** — gotchas, rationale        | a fact in the past   |

Project key for both: `+<PROJECT>` / book `<PROJECT>`.

Write a note only when it will outlive the session **and** cannot be derived
from the repository. Never a retelling of the diff, the file layout, or git
history.

### 5. Record every change in the dnote changelog

One dedicated note holds the change history, newest first, one entry per landed
change:

​```
YYYY-MM-DD · What changed — briefly, by substance.
​```

What changed and why it matters, not which files were touched. Append before
reporting the work as finished.

## Task stack

One file per task: `specs/tasks/active/<id>.md` while it runs,
`specs/tasks/done/<id>.md` once it ships. Format and rationale in
[`specs/tasks/README.md`](../specs/tasks/README.md).

**Session start: read `specs/tasks/active/` first** —
`cat specs/tasks/active/*.md`.

## Quality gates

The checks branch protection requires, spelled **exactly** as the branch
protection rule spells them. This list is read, not decorative: a required
check that has not started yet is absent from `gh pr checks` output, so a gate
that counts checks reads an unstarted one as passing. Compare against these
names.

- `PR title (conventional commit)`

## Never do

- Commit to the default branch without a pull request.
- Skip updating `specs/tasks/active/` and `specs/tasks/done/`.
- Leave a document asserting something that is no longer true.

<!-- STACK:BEGIN -->
<!-- STACK:END -->
```

The two `​```` fences inside rule 5 carry a zero-width space so this plan
renders. Write them as plain triple backticks in the real file.

The optional contract sections — `## Deploy targets`, `## Issue mirroring`,
`## Audit personas`, `## Audit routes` — are **deliberately absent**. Per the
spec's D6, an empty contract heading is indistinguishable to the skill reading
it from a filled one, so the skill would run its procedure against nothing and
report success. A project adds the heading when it has the fact.

- [ ] **Step 2: Verify every placeholder is findable by one grep**

Run:

```bash
cd ~/projects/petProjects/project-skeleton
grep -rno '<[A-Z_]\+>' .claude/CLAUDE.md | sort -u
```

Expected: exactly `<LANG>` and `<PROJECT>` and nothing else. If anything else
appears, either it is a real placeholder that Task 6's check must know about,
or it is a typo.

- [ ] **Step 3: Verify the contract headings are spelled as the spec spells them**

Run:

```bash
cd ~/projects/petProjects/project-skeleton
grep -c '^## Quality gates$' .claude/CLAUDE.md
grep -c '^<!-- STACK:BEGIN -->$' .claude/CLAUDE.md
grep -c '^<!-- STACK:END -->$' .claude/CLAUDE.md
```

Expected: `1` three times.

- [ ] **Step 4: Commit**

```bash
git add .claude/CLAUDE.md
git commit -m "chore: add the working agreement and the skill contract"
```

---

### Task 3: A stack-free Conventional Commits gate

**Files:**

- Create: `scripts/check-pr-title.sh`
- Create: `scripts/check-pr-title.test.sh`
- Create: `.github/workflows/pr-title.yml`

**Interfaces:**

- Consumes: nothing.
- Produces: `scripts/check-pr-title.sh <title>` — exit `0` valid, `1` invalid,
  `2` called wrong. The workflow and the test both call it this way.

This task replaces `course_shelf`'s `.github/workflows/pr-title.yml` rather
than copying it. That file runs `npx --no-install commitlint` after
`./.github/actions/setup-cs`, a composite action that exists only in that
repository — and it presumes Node. A skeleton installs into projects whose
stack is not chosen yet.

- [ ] **Step 1: Write the failing test**

Create `scripts/check-pr-title.test.sh`:

```sh
#!/usr/bin/env sh
# Table test for check-pr-title.sh. No framework: the gate has no dependencies
# and neither does its test.
set -u

here=$(dirname "$0")
subject="$here/check-pr-title.sh"
failures=0

expect() {
  want=$1
  title=$2
  sh "$subject" "$title" >/dev/null 2>&1
  got=$?
  if [ "$got" -ne "$want" ]; then
    printf 'FAIL want=%s got=%s title=%s\n' "$want" "$got" "$title" >&2
    failures=$((failures + 1))
  fi
}

# Accepted
expect 0 'feat: add calendar view'
expect 0 'fix(web): stop the list from collapsing'
expect 0 'feat(api)!: drop the v1 endpoints'
expect 0 'revert: feat(api): add pagination'
expect 0 'chore(deps): bump node to 22'
expect 0 'docs: explain the sync model'

# Rejected: unknown type
expect 1 'feature: add calendar view'
expect 1 'Add calendar view'
expect 1 'FEAT: add calendar view'

# Rejected: no description
expect 1 'feat:'
expect 1 'feat: '

# Length boundary. Build the strings instead of typing them: a literal run of
# 66 versus 67 'a' characters is a transcription risk, and a miscounted
# fixture fails in a way that looks like a bug in the gate.
pad() {
  i=0
  s=''
  while [ "$i" -lt "$1" ]; do
    s="${s}a"
    i=$((i + 1))
  done
  printf '%s' "$s"
}

expect 0 "feat: $(pad 66)"   # 'feat: ' is 6 chars, so this is exactly 72
expect 1 "feat: $(pad 67)"   # 73, one over

# Shell metacharacters are text, never code. If the gate executed this, the
# marker file would exist.
rm -f /tmp/check-pr-title-pwned
expect 1 'oops: $(touch /tmp/check-pr-title-pwned)'
if [ -f /tmp/check-pr-title-pwned ]; then
  echo 'FAIL the gate executed its input' >&2
  failures=$((failures + 1))
fi

# Called wrong
expect 2 ''

if [ "$failures" -gt 0 ]; then
  printf '%s failing case(s)\n' "$failures" >&2
  exit 1
fi
echo 'all cases pass'
```

- [ ] **Step 2: Run it to make sure it fails**

Run:

```bash
cd ~/projects/petProjects/project-skeleton
sh scripts/check-pr-title.test.sh
```

Expected: FAIL — every case reports a mismatch, because
`scripts/check-pr-title.sh` does not exist yet and `sh` on a missing file
exits `127`.

- [ ] **Step 3: Write the minimal implementation**

Create `scripts/check-pr-title.sh`:

```sh
#!/usr/bin/env sh
# Validate a Conventional Commits subject line.
#
# No Node, no package manager, no install step: this gate runs in repositories
# that have not chosen a stack yet, and it must not be the reason one is
# chosen. The title arrives as "$1" and is only ever matched against, never
# evaluated — a PR title is author-controlled text.
set -u

max=72
types='feat|fix|chore|docs|refactor|test|perf|ci|build|style|revert'
pattern="^($types)(\([a-z0-9._/-]+\))?!?: .+"

if [ "$#" -ne 1 ] || [ -z "$1" ]; then
  echo 'usage: check-pr-title.sh "<title>"' >&2
  exit 2
fi

title=$1

if ! printf '%s' "$title" | grep -Eq "$pattern"; then
  echo "error: not a Conventional Commits subject: $title" >&2
  echo "expected: type(scope)?!?: description" >&2
  echo "types: $types" >&2
  exit 1
fi

length=${#title}
if [ "$length" -gt "$max" ]; then
  echo "error: subject is $length characters, limit is $max" >&2
  exit 1
fi

exit 0
```

There is no `scope-enum`. The skeleton does not know what a project's scopes
will be, and a wrong allow-list is worse than none: it rejects correct titles
and teaches people to bypass the gate.

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
cd ~/projects/petProjects/project-skeleton
chmod +x scripts/check-pr-title.sh scripts/check-pr-title.test.sh
sh scripts/check-pr-title.test.sh
```

Expected: `all cases pass`.

- [ ] **Step 5: Write the workflow**

Create `.github/workflows/pr-title.yml`:

```yaml
name: PR title

# `on: pull_request` with no `types:` defaults to
# `[opened, synchronize, reopened]`. `edited` is not in that list, so retitling
# a PR never re-runs the job: the check stays red describing a title that no
# longer exists, and the only way to clear it is to push something unrelated.
# The one correction this gate exists to catch is the one it cannot see.
#
# Adding `edited` to a larger workflow's trigger would re-run the whole suite
# every time somebody fixed a typo in a PR body, and gating the expensive jobs
# behind `github.event.action != 'edited'` is worse: branch protection counts a
# skipped required job as blocking rather than passing, so an edit would leave
# the PR unmergeable. One small job in its own file takes the trigger without
# dragging anything along.

on:
  pull_request:
    types: [opened, reopened, synchronize, edited]

concurrency:
  group: pr-title-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # A squash merge takes the PR TITLE as the commit subject on the default
  # branch, and a local commit-msg hook only ever sees local commits. So a PR
  # whose commits are all conventional can still land an unconventional
  # subject, and a changelog generator drops what it cannot parse.
  #
  # The title is author-controlled text. It reaches the shell through `env:`,
  # never through `${{ }}` interpolation inside `run:`, which would let a title
  # containing shell metacharacters execute as code.
  pr-title:
    name: PR title (conventional commit)
    runs-on: ubuntu-latest
    timeout-minutes: 5

    steps:
      - uses: actions/checkout@v6

      - name: Lint the PR title
        env:
          PR_TITLE: ${{ github.event.pull_request.title }}
        run: sh scripts/check-pr-title.sh "$PR_TITLE"
```

The job's `name:` is `PR title (conventional commit)`, which is the string
already listed under `## Quality gates` in Task 2. Branch protection matches
this text; changing one without the other breaks the gate silently.

- [ ] **Step 6: Verify the workflow is valid YAML and references a real script**

Run:

```bash
cd ~/projects/petProjects/project-skeleton
yq '.jobs["pr-title"].name' .github/workflows/pr-title.yml
test -f scripts/check-pr-title.sh && echo "script present"
grep -c 'PR title (conventional commit)' .claude/CLAUDE.md
```

Expected: `PR title (conventional commit)`, then `script present`, then `1`.

- [ ] **Step 7: Commit**

```bash
git add scripts/ .github/workflows/pr-title.yml
git commit -m "ci: gate PR titles without depending on a package manager"
```

---

### Task 4: ADR 0001, CONTRIBUTING, README

**Files:**

- Create: `docs/adr/0001-record-architecture-decisions.md`
- Create: `CONTRIBUTING.md`
- Create: `README.md`

**Interfaces:**

- Consumes: everything from Tasks 1-3, which the README describes.
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Write `docs/adr/0001-record-architecture-decisions.md`**

```markdown
# 1. Record architecture decisions

- Status: accepted
- Date: <DATE>

## Context

A decision that is only in someone's head is re-litigated every time a new
person — or a new session — meets the code it shaped. The code shows what was
decided and never why, so the alternatives get re-proposed, re-argued, and
sometimes re-adopted after they were already rejected for a reason nobody
wrote down.

## Decision

Record every architecturally significant decision as a numbered Markdown file
in `docs/adr/`, in the format of Michael Nygard's original ADR proposal:
context, decision, consequences. Numbers are sequential and never reused. A
superseded ADR stays in place with its status changed and a link to the one
that replaced it; it is never deleted, because the record of having changed
course is the point.

"Architecturally significant" means: it constrains what can be built later, it
is expensive to reverse, or someone will otherwise ask "why is it like this".

## Consequences

Decisions become reviewable in a pull request alongside the code they justify.
The cost is one small file per decision, written while the reasoning is still
in hand rather than reconstructed later.
```

- [ ] **Step 2: Write `CONTRIBUTING.md`**

```markdown
# Contributing

## Before you write code

Read `specs/tasks/active/`. That is the current stack of work:

​```sh
cat specs/tasks/active/*.md
​```

Then create your own entry from `specs/tasks/templates/feature.md`, named
`T-YYYY-MM-DD-<your-branch-slug>.md`. Before the first edit, not after.

## Branches and commits

- Work on a branch; the default branch takes changes only through a pull
  request.
- Commit subjects and PR titles follow Conventional Commits. The PR title is
  what a squash merge puts on the default branch, so it is gated in CI —
  `scripts/check-pr-title.sh` is the same check, runnable locally:

​```sh
sh scripts/check-pr-title.sh "feat(web): add the calendar view"
​```

- The commit body says **why**. What changed is what `git diff` is for.

## Finishing

​```sh
git mv specs/tasks/active/<id>.md specs/tasks/done/
​```

Set `Status: done`, add `- Completed:` and `- Result: <PR link>`. Never delete
a file from `done/` — a cancelled task moves there with its reason.
```

The `​```sh` fences carry a zero-width space so this plan renders. Write them
as plain triple backticks.

- [ ] **Step 3: Write `README.md`**

```markdown
# <PROJECT>

<SUMMARY>

## What is already here

This repository was created from `project-skeleton`, which supplies the process
layer and nothing else — no application code, no stack, no dependencies:

| Path | Holds |
| --- | --- |
| `.claude/CLAUDE.md` | the working agreement, and the headings the `shipyard` skills read |
| `specs/tasks/` | the task stack — one file per task, `active/` then `done/` |
| `scripts/check-pr-title.sh` | the Conventional Commits gate, runnable locally |
| `.github/workflows/pr-title.yml` | that gate in CI |
| `docs/adr/` | architecture decision records |

## First steps in a new project

1. Fill the placeholders. `grep -rn '<[A-Z_]\+>' .` finds every one.
2. Install the process plugin:

   ​```sh
   /plugin marketplace add <OWNER>/shipyard
   /plugin install shipyard
   ​```

3. Choose a stack. A layer-2 stack plugin writes its section between the
   `<!-- STACK:BEGIN -->` and `<!-- STACK:END -->` markers in
   `.claude/CLAUDE.md` and leaves the rest of the file alone.
4. Set branch protection to require the check named
   `PR title (conventional commit)`, and add any further required checks to
   `## Quality gates` in `.claude/CLAUDE.md` using the exact names branch
   protection uses.
5. Write ADR 0002 for the first decision this project makes that would
   otherwise be re-argued.

## What this skeleton deliberately omits

A package manager, a lockfile, a linter and a formatter. All four presume a
stack. They arrive with the stack plugin, which knows which ones apply.
```

The `​```sh` fences carry a zero-width space so this plan renders. Write them
as plain triple backticks.

- [ ] **Step 4: Verify the internal links resolve**

Run:

```bash
cd ~/projects/petProjects/project-skeleton
for f in specs/tasks/README.md specs/tasks/templates/feature.md scripts/check-pr-title.sh .github/workflows/pr-title.yml docs/adr/0001-record-architecture-decisions.md; do
  test -e "$f" && echo "ok   $f" || echo "MISS $f"
done
```

Expected: `ok` five times.

- [ ] **Step 5: Commit**

```bash
git add README.md CONTRIBUTING.md docs/
git commit -m "docs: describe the skeleton and record ADR 0001"
```

---

### Task 5: Publish as a GitHub template

**Files:**

- Modify: nothing. This task only publishes.

**Interfaces:**

- Consumes: the whole repository.
- Produces: `<OWNER>/project-skeleton` marked as a template repository, which
  is what `gh repo create --template` needs.

- [ ] **Step 1: Create the remote and push**

```bash
cd ~/projects/petProjects/project-skeleton
gh repo create project-skeleton --private --source=. --remote=origin --push
```

- [ ] **Step 2: Mark it as a template and tag it**

```bash
gh repo edit --template
gh repo edit --add-topic claude-code --add-topic project-template --add-topic scaffolding
gh repo edit --description "Process layer for a new project: task stack, working agreement, and a stack-free Conventional Commits gate."
```

- [ ] **Step 3: Verify the template flag took**

Run:

```bash
gh repo view --json isTemplate,repositoryTopics --jq '{template: .isTemplate, topics: [.repositoryTopics[].name]}'
```

Expected: `{"template": true, "topics": ["claude-code","project-template","scaffolding"]}`.
If `template` is `false`, `gh repo edit --template` silently did nothing —
re-run it and check again rather than proceeding.

- [ ] **Step 4: Commit**

Nothing to commit; this task changes only remote settings. Confirm the working
tree is clean:

```bash
git status --porcelain
```

Expected: empty.

---

### Task 6: Smoke-test the template end to end

**Files:**

- Create: `scripts/smoke-test.sh` (in `project-skeleton`)

**Interfaces:**

- Consumes: the published template from Task 5.
- Produces: a repeatable check that a repository created from the template is
  usable. Run it again whenever the skeleton changes.

This is the task that catches Review Focus item 5 — a placeholder reaching a
real project — and it is the only check that exercises the template the way a
person actually meets it.

- [ ] **Step 1: Write the smoke test**

Create `scripts/smoke-test.sh`:

```sh
#!/usr/bin/env sh
# Create a throwaway repository from the published template, assert the
# skeleton arrived intact, then delete it.
#
# This runs against the REMOTE template, not the local working tree: the thing
# under test is what `gh repo create --template` actually hands a person.
set -eu

name="skeleton-smoke-$(date +%s)"
owner=$(gh api user --jq .login)
work=$(mktemp -d)
failures=0

cleanup() {
  gh repo delete "$owner/$name" --yes >/dev/null 2>&1 || true
  rm -rf "$work"
}
trap cleanup EXIT

check() {
  if [ "$1" -eq 0 ]; then
    printf 'ok   %s\n' "$2"
  else
    printf 'FAIL %s\n' "$2" >&2
    failures=$((failures + 1))
  fi
}

gh repo create "$name" --private --template "$owner/project-skeleton" --clone -- "$work/$name" >/dev/null
cd "$work/$name"

test -f .claude/CLAUDE.md;                    check $? "CLAUDE.md present"
test -d specs/tasks/active;                   check $? "specs/tasks/active present"
test -d specs/tasks/done;                     check $? "specs/tasks/done present"
test -f .github/workflows/pr-title.yml;       check $? "pr-title workflow present"

# The gate must work in the new repository with nothing installed.
sh scripts/check-pr-title.sh 'feat: works in a fresh clone' >/dev/null 2>&1
check $? "title gate accepts a valid subject"

if sh scripts/check-pr-title.sh 'nope' >/dev/null 2>&1; then
  check 1 "title gate rejects an invalid subject"
else
  check 0 "title gate rejects an invalid subject"
fi

# Review Focus 5: placeholders must still be present and findable, so the
# person filling them cannot miss one. A skeleton with none has been filled
# already, which means the template was published from a filled copy.
found=$(grep -rno '<[A-Z_]\+>' .claude/CLAUDE.md README.md | wc -l | tr -d ' ')
if [ "$found" -ge 3 ]; then
  check 0 "placeholders present and greppable ($found)"
else
  check 1 "placeholders present and greppable ($found, expected at least 3)"
fi

# No project nouns from the repository the skeleton was extracted from.
if grep -rqniE 'course.?shelf|@app/|centrifugo' . --exclude-dir=.git; then
  check 1 "no source-project nouns"
else
  check 0 "no source-project nouns"
fi

if [ "$failures" -gt 0 ]; then
  printf '%s failing check(s)\n' "$failures" >&2
  exit 1
fi
echo 'smoke test passed'
```

- [ ] **Step 2: Run it**

Run:

```bash
cd ~/projects/petProjects/project-skeleton
chmod +x scripts/smoke-test.sh
sh scripts/smoke-test.sh
```

Expected: eight `ok` lines then `smoke test passed`. The throwaway repository
is deleted by the `trap`, including on failure.

If `gh repo create --template` errors with "repository is not a template",
Task 5 Step 2 did not take — go back and re-verify with Step 3 there.

- [ ] **Step 3: Commit**

```bash
git add scripts/smoke-test.sh
git commit -m "test: add an end-to-end smoke test for the published template"
git push
```

---

## Done means

- `gh repo view <OWNER>/project-skeleton --json isTemplate` reports `true`.
- `sh scripts/check-pr-title.test.sh` prints `all cases pass`.
- `sh scripts/smoke-test.sh` prints `smoke test passed`.
- `grep -rn '<[A-Z_]\+>' .` in a freshly created repository lists every spot a
  human must fill, and nothing else.

## What this plan does not do

- **It does not add `/bootstrap`.** That command lives in the `shipyard`
  plugin (phase 1) and has its own plan. Until it exists, the placeholders are
  filled by hand — which is the point: the first manual fill is what tells
  `/bootstrap` what to automate.
- **It does not add the optional contract sections.** `## Deploy targets`,
  `## Issue mirroring`, `## Audit personas` and `## Audit routes` are absent by
  design (spec D6). A project adds the heading when it has the fact.
- **It does not set branch protection.** That is per-project configuration and
  cannot travel in a template; the README tells the reader to do it, and Task 2
  puts the check's exact name where the reader will find it.
