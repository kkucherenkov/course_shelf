# `shipyard` Process Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a Claude Code plugin carrying the six procedures this repository
learned the hard way — the task stack, lane discipline, CI gating, issue
bookkeeping, deploy verification and the release audit — so an improvement made
in one project reaches every other with `/plugin update` instead of a copy.

**Architecture:** one git repository that is its own marketplace. Six skills,
one command, one validator script. Five skills are lifted from `course_shelf`
with their project facts removed; `ci-gates` is new, assembled from seven traps
that currently live inside the audit skill because that is the work which
uncovered them, not the work during which they will be looked for.

**Tech Stack:** Markdown with YAML frontmatter, POSIX shell for the validator,
Node for the audit driver (already written; only its auth adapter is split out).

**Spec:** [`docs/superpowers/specs/2026-09-25-project-template-two-layer-design.md`](../specs/2026-09-25-project-template-two-layer-design.md)
— phase 1 of section 7. Read section 4 (the skill inventory) before Task 2 and
keep it open; it names, per skill, exactly what travels and what is extracted.

## Where the work happens

A new repository at `~/projects/petProjects/shipyard`. Source files are read
from `~/projects/petProjects/course_shelf`. Nothing in `course_shelf` is
modified by this plan — its migration is phase 3.

## Global Constraints

Every task's requirements implicitly include this section.

- **A skill's `description` is the only thing that decides whether it ever
  runs.** Claude reads descriptions, not bodies, when choosing. Write each one
  as the *task the reader will be doing* ("use when a PR looks green but will
  not merge"), never as a summary of the contents ("notes about CI"). A skill
  whose description does not name a task is dead weight that will be read at
  the wrong time or not at all.
- **No `course_shelf` nouns.** No `courseshelf`, `course_shelf`, `@app/`,
  `apps/backend`, `apps/web`, `packages/specs`, `E<NN>-F<NN>`, Centrifugo,
  Prisma, Nuxt, NestJS, Dockge, or the NAS. `scripts/check-skills.sh` fails the
  build on any of them.
- **Project facts come from named `CLAUDE.md` headings, never from the skill.**
  The headings are `## Quality gates`, `## Deploy targets`, `## Issue
  mirroring`, `## Audit personas`, `## Audit routes`, spelled exactly so. A
  skill that needs a heading and does not find it **says so and stops**; it
  never guesses, and it never proceeds against a default.
- **Every trap keeps its evidence.** A trap written as "watch out for X" is
  advice and will be ignored. Each one states what was observed, what it looked
  like, and what it cost — that is the difference between this plugin and a
  style guide.
- **Committed content is English.**
- **Every file is Markdown with YAML frontmatter** carrying `name` and
  `description`, except the scripts and the manifests.

## Review Focus

Five conditions the spec implies that no obvious task exercises. Each has a
test in the task named.

1. **A skill whose `description` describes its contents rather than a task.**
   It parses, it validates, it is never selected — the most expensive failure
   here, and invisible to any syntactic check. Task 1 adds a validator rule
   requiring the description to contain a trigger phrase (`use when`, `use
   before`, `use after`); Task 2 onward run it.
2. **A skill that needs a `CLAUDE.md` heading the project does not have.**
   `deploy-verify` against a project with no `## Deploy targets` must report
   that and stop, not fall back to a default that deploys nothing and reports
   success. Tested in Task 6.
3. **Two skills claiming the same trigger.** `release-audit` and `ci-gates`
   both concern "the checks are not green". If both descriptions match, the
   choice is arbitrary and half the traps are unreachable. Task 1's validator
   fails on duplicate trigger nouns across skills; Task 4 is where the overlap
   actually arises.
4. **A trap that lost its evidence in the lift.** "Gate on `.status`" without
   "because `gh` reports a pending check as `conclusion: \"\"`, so jq's `//`
   never fires" is unactionable. Task 1's validator fails a trap paragraph
   shorter than 200 characters inside a `## Traps` section.
5. **A referenced file that does not exist.** `release-audit` points at
   `driver.mjs`, `setup.md` and `auth-adapter.mjs`. A skill confidently naming
   a missing file wastes the whole session that follows it. Task 1's validator
   resolves every relative link.

---

### Task 1: The repository, the manifests, and the validator

**Files:**

- Create: `.claude-plugin/plugin.json`
- Create: `.claude-plugin/marketplace.json`
- Create: `scripts/check-skills.sh`
- Create: `scripts/check-skills.test.sh`
- Create: `.gitignore`

**Interfaces:**

- Consumes: nothing.
- Produces: `sh scripts/check-skills.sh` — exit `0` when every skill under
  `skills/` satisfies the five rules below, exit `1` naming each violation.
  Every later task ends by running it.

- [ ] **Step 1: Create the repository and the manifests**

```bash
mkdir -p ~/projects/petProjects/shipyard
cd ~/projects/petProjects/shipyard
git init -b main
mkdir -p .claude-plugin skills commands scripts
```

`.claude-plugin/plugin.json`:

```json
{
  "name": "shipyard",
  "description": "Process discipline for a project: the task stack, lane discipline, CI gating, issue bookkeeping, deploy verification and the release audit.",
  "version": "0.1.0",
  "author": { "name": "Kirill Kucherenkov" },
  "homepage": "https://github.com/kkucherenkov/shipyard",
  "repository": "https://github.com/kkucherenkov/shipyard",
  "license": "MIT",
  "keywords": [
    "claude-code",
    "process",
    "task-stack",
    "ci",
    "release",
    "code-review"
  ]
}
```

`.claude-plugin/marketplace.json` — the repository is its own marketplace, the
layout `ponytail` uses. The second entry is reserved for the layer-2 stack
plugin and is added by its own plan, not here:

```json
{
  "name": "shipyard",
  "description": "Portable process layer for new projects, plus stack presets.",
  "owner": {
    "name": "Kirill Kucherenkov",
    "url": "https://github.com/kkucherenkov"
  },
  "plugins": [
    {
      "name": "shipyard",
      "description": "Process discipline: task stack, lane discipline, CI gating, issue bookkeeping, deploy verification, release audit.",
      "source": "./",
      "category": "productivity"
    }
  ]
}
```

`.gitignore`:

```gitignore
.DS_Store
*.swp
```

- [ ] **Step 2: Write the failing test**

Create `scripts/check-skills.test.sh`. It builds fixture skills in a temp
directory and asserts the validator's verdict on each — so the validator is
tested against violations that do not have to exist in the real tree.

```sh
#!/usr/bin/env sh
# Table test for check-skills.sh, driven by fixture skill trees.
set -u

here=$(dirname "$0")
subject="$here/check-skills.sh"
failures=0

# Build a one-skill tree in $1 with frontmatter $2 and body $3.
make_skill() {
  root=$1
  desc=$2
  body=$3
  mkdir -p "$root/skills/sample"
  {
    printf -- '---\n'
    printf 'name: sample\n'
    printf 'description: %s\n' "$desc"
    printf -- '---\n\n'
    printf '# Sample\n\n%s\n' "$body"
  } > "$root/skills/sample/SKILL.md"
}

expect() {
  want=$1
  desc=$2
  root=$(mktemp -d)
  make_skill "$root" "$3" "$4"
  sh "$subject" "$root" >/dev/null 2>&1
  got=$?
  rm -rf "$root"
  if [ "$got" -ne "$want" ]; then
    printf 'FAIL want=%s got=%s %s\n' "$want" "$got" "$desc" >&2
    failures=$((failures + 1))
  fi
}

good_trap='## Traps

**A pending check reports `conclusion: ""`, not `null`.** jq substitutes only
on false and null, so `.conclusion // "PENDING"` returns the empty string and
every "is it still running" test passes. Gate on `.status != "COMPLETED"`.'

expect 0 'a task-shaped description passes' \
  'Use when a pull request looks green but will not merge.' "$good_trap"

expect 1 'a contents-shaped description fails' \
  'Notes and tips about continuous integration.' "$good_trap"

expect 1 'a trap paragraph with no evidence fails' \
  'Use when a pull request looks green but will not merge.' \
  '## Traps

**Gate on `.status`.** Otherwise it breaks.'

expect 1 'a source-project noun fails' \
  'Use when deploying course_shelf to the NAS.' "$good_trap"

expect 1 'a dangling relative link fails' \
  'Use when a pull request looks green but will not merge.' \
  "$good_trap

See [the driver](driver.mjs)."

if [ "$failures" -gt 0 ]; then
  printf '%s failing case(s)\n' "$failures" >&2
  exit 1
fi
echo 'all cases pass'
```

- [ ] **Step 3: Run it to verify it fails**

Run:

```bash
cd ~/projects/petProjects/shipyard
sh scripts/check-skills.test.sh
```

Expected: FAIL — every case mismatches, because `scripts/check-skills.sh` does
not exist and `sh` on a missing file exits `127`.

- [ ] **Step 4: Write the validator**

Create `scripts/check-skills.sh`:

```sh
#!/usr/bin/env sh
# Validate every skill under <root>/skills/.
#
# Five rules, each of which encodes a way a skill can be syntactically perfect
# and still useless. The expensive one is the first: a skill is selected by its
# description alone, so a description that summarises the contents instead of
# naming a task is never read at the moment it would have helped.
set -u

root=${1:-.}
failures=0

fail() {
  printf 'FAIL %s: %s\n' "$1" "$2" >&2
  failures=$((failures + 1))
}

for skill in "$root"/skills/*/SKILL.md; do
  [ -e "$skill" ] || continue
  dir=$(dirname "$skill")

  desc=$(sed -n 's/^description: *//p' "$skill" | head -1)

  # 1. The description must name a task, not the contents.
  if ! printf '%s' "$desc" | grep -qiE 'use (when|before|after|while)'; then
    fail "$skill" 'description does not name a triggering task (needs "use when/before/after")'
  fi

  # 2. No nouns from the repository these procedures were extracted from.
  if grep -rqniE 'course.?shelf|@app/|apps/(backend|web|mobile)|packages/specs|centrifugo|prisma|nestjs|nuxt|dockge' "$dir"; then
    fail "$skill" 'carries a noun from the source project'
  fi

  # 3. Every trap keeps its evidence. A paragraph under ## Traps shorter than
  #    200 characters is an instruction without the observation that earned it,
  #    and an instruction without evidence is ignored.
  awk '
    /^## Traps/ { inside = 1; next }
    /^## / { inside = 0 }
    inside && /^\*\*/ {
      para = $0
      while ((getline line) > 0 && line != "") para = para " " line
      if (length(para) < 200) print para
    }
  ' "$skill" | while IFS= read -r short; do
    [ -n "$short" ] && fail "$skill" "trap without evidence: $(printf '%s' "$short" | cut -c1-60)..."
  done

  # 4. Every relative link resolves. A skill that names a file it does not have
  #    costs the whole session that trusts it.
  grep -o '](\([^)#][^)]*\))' "$skill" | sed 's/^](//; s/)$//' | while IFS= read -r link; do
    case $link in
      http*|mailto:*) continue ;;
    esac
    target=$(printf '%s' "$link" | sed 's/#.*//')
    [ -z "$target" ] && continue
    [ -e "$dir/$target" ] || [ -e "$root/$target" ] || fail "$skill" "dangling link: $target"
  done
done

# 5. No two skills may claim the same trigger, or the choice between them is
#    arbitrary and half of what they carry becomes unreachable.
dupes=$(sed -n 's/^description: *//p' "$root"/skills/*/SKILL.md 2>/dev/null \
  | tr 'A-Z' 'a-z' \
  | grep -oE 'use (when|before|after|while)[^.,;]*' \
  | sort | uniq -d)
if [ -n "$dupes" ]; then
  fail 'skills/' "two skills claim the same trigger: $dupes"
fi

if [ "$failures" -gt 0 ]; then
  printf '%s problem(s)\n' "$failures" >&2
  exit 1
fi
echo 'skills ok'
```

The `while` loops above run in subshells, so `failures` incremented inside them
does not survive. That is deliberate for rules 3 and 4 only as far as the
**message** goes — the `fail` output still reaches stderr and the reader. If a
run prints `FAIL` lines and still exits `0`, that is rule 3 or 4 firing, and the
fix is to collect those loops' output into a variable and test it non-empty.
Do that in Step 5 if the test demands it.

- [ ] **Step 5: Run the test to verify it passes**

Run:

```bash
cd ~/projects/petProjects/shipyard
chmod +x scripts/check-skills.sh scripts/check-skills.test.sh
sh scripts/check-skills.test.sh
```

Expected: `all cases pass`. If the two subshell-scoped rules report `FAIL` but
the script exits `0`, restructure those loops to write matches into a temp file
and test its size — the exit code is the contract the later tasks depend on.

- [ ] **Step 6: Commit**

```bash
git add .claude-plugin scripts .gitignore
git commit -m "chore: add the plugin manifests and the skill validator"
```

---

### Task 2: `skills/task-stack`

**Files:**

- Create: `skills/task-stack/SKILL.md`

**Interfaces:**

- Consumes: `scripts/check-skills.sh` from Task 1.
- Produces: the `task-stack` skill. `commands/bootstrap.md` (Task 9) points a
  new project at it.

**Source:** `course_shelf/specs/tasks/README.md`, which the phase-2 plan already
lifted into `project-skeleton/specs/tasks/README.md`. Take it from the
skeleton, which is already denatured, rather than from `course_shelf`.

- [ ] **Step 1: Write the skill**

Frontmatter, verbatim — the description names three distinct moments because
those are when someone needs it, and none of them is "read about task tracking":

```yaml
---
name: task-stack
description: Use before starting any task larger than a one-line fix, when a task is blocked, and when one ships. Covers the one-file-per-task layout, the id format and why it is a branch slug rather than a counter, and what moving an entry to done must record.
---
```

Body: the whole of `project-skeleton/specs/tasks/README.md` from `## Why one
file per entry` onward, plus a leading paragraph naming the two directories,
plus this section which the README does not carry because a human reading a
repository already knows where they are:

```markdown
## Where the stack lives

`specs/tasks/active/` and `specs/tasks/done/`, relative to the repository root.
If neither exists, this project does not use a task stack — say so and stop
rather than creating one unasked. The directories arrive with
`project-skeleton`; adding them to an existing project is a decision for the
maintainer, not a side effect of reading a task.
```

- [ ] **Step 2: Verify**

Run:

```bash
cd ~/projects/petProjects/shipyard
sh scripts/check-skills.sh
```

Expected: `skills ok`.

- [ ] **Step 3: Commit**

```bash
git add skills/task-stack
git commit -m "feat: add the task-stack skill"
```

---

### Task 3: `skills/lane-discipline`

**Files:**

- Create: `skills/lane-discipline/SKILL.md`

**Interfaces:**

- Consumes: Task 1's validator.
- Produces: the `lane-discipline` skill.

**Source:** `course_shelf/.claude/CLAUDE.md`, sections **Parallel work**, **What
a lane's brief must say**, and **A subagent shares your checkout unless you give
it one**.

- [ ] **Step 1: Write the skill**

```yaml
---
name: lane-discipline
description: Use before dispatching two or more agents to work in parallel, and when a lane's work has collided with another's. Covers what a lane's brief must contain, how to divide work by files rather than by findings, and the two failure modes that cost the most to unpick.
---
```

Body carries, with their evidence intact:

- One lane is one worktree is one branch is one pull request. Lanes never share
  a branch.
- Divide by **files**, not by findings. A brief that names two findings in one
  file has created a collision it did not mention.
- Name the paths the lane owns *and* the paths other lanes own. "Stay in your
  area" is not a boundary. A wave on 2026-09-18 lost time to two lanes both
  editing a component that sat between the two files each brief did name.
- A file two lanes both need belongs to exactly one of them; the others wait
  for that pull request to land.
- **A subagent dispatched without its own worktree runs git in your working
  copy, on your branch.** Asked to "work on a new branch", it may commit to
  yours instead — on 2026-09-18 that put ten changes on a local `main`. Dispatch
  with an explicit worktree, and check `git log --oneline -1` on your own branch
  after an agent reports.
- **A lane that brings up a container stack without its own project name
  adopts the existing one and rewrites its services.** A lane did that on
  2026-09-18; the dev stack happened to be down, so it took only the name.
- Wait for CI with a monitor, never a sleep-and-poll loop: a poll loop spends
  the lane's context on its own output and reports last.
- Tell each lane what it must **not** do — reach for a label instead of fixing
  a gate, change server semantics from a client lane, write to the shared
  notes store (the coordinator does that centrally, or five lanes edit one note
  at once).

- [ ] **Step 2: Verify**

Run: `sh scripts/check-skills.sh` — Expected: `skills ok`.

- [ ] **Step 3: Commit**

```bash
git add skills/lane-discipline
git commit -m "feat: add the lane-discipline skill"
```

---

### Task 4: `skills/ci-gates`

**Files:**

- Create: `skills/ci-gates/SKILL.md`

**Interfaces:**

- Consumes: Task 1's validator, and `## Quality gates` in the consuming
  project's `CLAUDE.md`.
- Produces: the `ci-gates` skill. This is the one artefact in the plugin that
  does not exist in `course_shelf` — it is assembled from traps filed under the
  audit skill because that is the work that uncovered them.

This task is where Review Focus 3 bites: `release-audit` (Task 7) and this
skill both concern "the checks are not green". Their descriptions must not
overlap. This one owns *the gate mechanics*; that one owns *the product's
quality*.

- [ ] **Step 1: Write the skill**

```yaml
---
name: ci-gates
description: Use when a pull request looks green but will not merge, when a required check is missing rather than failing, and before trusting any script that decides whether CI has finished. Covers how GitHub reports pending and blocked runs, and the ways a check that never ran reads as a check that passed.
---
```

Body must carry all seven traps **with their evidence**, since the validator
rejects a trap paragraph under 200 characters:

1. `gh` reports an in-progress check as `conclusion: ""`, not `null`. jq's `//`
   substitutes only on `false` and `null`, so `.conclusion // "PENDING"`
   returns the empty string and every "is it still running" test silently
   passes. Gate on `.status != "COMPLETED"`.
2. A required check that has not started is **absent** from the check list, and
   absence reads as success to anything that counts what it sees. Gate on the
   context names branch protection actually requires, read from
   `## Quality gates`, and distinguish "absent" from "pending".
3. A baseline regeneration does not re-run the checks. A push made as
   `github-actions[bot]` with `GITHUB_TOKEN` deliberately triggers no workflow —
   otherwise a regeneration would retrigger itself — so the pull request keeps
   showing the previous run and a stale red looks like a slow queue.
4. A branch carrying a bot commit puts subsequent runs into `action_required`.
   They never start on their own and do not appear in the check list at all, so
   it reads as "the checks have not started yet" rather than "the checks are
   blocked". Five runs sat waiting fifteen minutes before this was spotted.
   Approve each with the runs API.
5. `for id in $ids` under zsh iterates **once**, over the whole string. It
   approved one of five runs while the output looked complete. Use
   `printf '%s\n' "$ids" | while read -r id`.
6. Wait for CI with a monitor, never sleep-and-poll: the loop spends the
   session's context on its own output and reports last.
7. `docker build … || echo FAILED` exits `0`, so a failed build reads as a
   success and the next `compose up` silently runs the previous image. Verify
   the **artefact** — the image's presence and its age — not the exit code.

Plus the contract section:

```markdown
## Which checks matter

Read `## Quality gates` in `.claude/CLAUDE.md`. It lists the contexts branch
protection requires, spelled as branch protection spells them. If that heading
is absent, this project has not declared its gates — say so and stop. Counting
checks instead is the failure this skill exists to prevent.
```

- [ ] **Step 2: Verify the descriptions do not collide**

Run:

```bash
cd ~/projects/petProjects/shipyard
sh scripts/check-skills.sh
```

Expected: `skills ok`. If it reports `two skills claim the same trigger`, that
is Review Focus 3 firing before `release-audit` even exists — reword this one
to name the gate mechanics, not the product.

- [ ] **Step 3: Commit**

```bash
git add skills/ci-gates
git commit -m "feat: add the ci-gates skill, assembled from seven misfiled traps"
```

---

### Task 5: `skills/issue-bookkeeping`

**Files:**

- Create: `skills/issue-bookkeeping/SKILL.md`

**Interfaces:**

- Consumes: Task 1's validator, and `## Issue mirroring` in the consuming
  project's `CLAUDE.md`.
- Produces: the `issue-bookkeeping` skill.

**Source:** `course_shelf/.claude/skills/card-bookkeeping/SKILL.md`. Everything
about `docs/roadmap/`, epic ids, milestones and `generate.py` is a project fact
and does **not** travel; it is replaced by a read of `## Issue mirroring`.

- [ ] **Step 1: Write the skill**

```yaml
---
name: issue-bookkeeping
description: Use when opening a pull request that should close issues, after a pull request merged without closing them, and when reconciling a finished piece of work against its tracker. Covers the closing syntax GitHub actually recognises and the counter that merges cleanly while losing data.
---
```

Body carries:

- Put a `Closes #N` line for **each** issue in the pull request body. GitHub
  recognises only `#N`; `Closes <some-card-id>` silently does nothing, the merge
  does not auto-close, and you close them by hand. `Closes`, `Fixes` and
  `Resolves` all work, and fire on merge to the default branch.
- A pull request that **schedules** work rather than doing it carries no
  `Closes` lines at all — it would empty the milestone the moment it was
  created.
- A pull request merged without them: the completion is real. Close the issues
  and record which pull request did it, rather than leaving them open.
- **A progress counter is not a mergeable quantity.** Two lanes that each bump
  `12 / 36` to `14 / 36` produce no conflict — both sides wrote the same text —
  and the merge silently loses two items. Git cannot help. After every merge
  that touches the counter, recount with a `grep -c` over the checked rows and
  set it to what that prints.

Plus:

```markdown
## Where the tracker lives

Read `## Issue mirroring` in `.claude/CLAUDE.md`: it names where the source of
truth lives, the id format, and the milestone if there is one. If that heading
is absent, this project does not mirror its work into issues — say so and stop,
rather than inventing a scheme it will have to live with.
```

- [ ] **Step 2: Verify**

Run: `sh scripts/check-skills.sh` — Expected: `skills ok`.

- [ ] **Step 3: Commit**

```bash
git add skills/issue-bookkeeping
git commit -m "feat: add the issue-bookkeeping skill"
```

---

### Task 6: `skills/deploy-verify`

**Files:**

- Create: `skills/deploy-verify/SKILL.md`

**Interfaces:**

- Consumes: Task 1's validator, and `## Deploy targets` in the consuming
  project's `CLAUDE.md`.
- Produces: the `deploy-verify` skill.

**Source:** `course_shelf/.claude/skills/deploy-nas/SKILL.md`. Container names,
the registry path, the host and the stack directory are project facts and do
**not** travel.

- [ ] **Step 1: Write the skill**

```yaml
---
name: deploy-verify
description: Use when putting a released version on a host, rolling one back, or answering which version a host is actually running. Covers finding the stack from the running container rather than from memory, and the several ways a deploy reports success having changed nothing.
---
```

Body carries, with evidence:

- **Find the stack from the running container**, via its compose project
  config-files label, rather than typing a path from memory. The same command
  answers what is running right now.
- **The image tags in a rendered bundle are literal.** Editing a version
  variable in `.env` deploys nothing — the rendered compose file inlines the
  version — and the deploy reports success. Read the changed lines back with
  `grep` before pulling; that is the only place the change is visible.
- Keep a copy of the compose file named after the version you are leaving, so a
  rollback needs neither git nor memory.
- Restart only the services the release actually changes. The database and the
  proxy are unchanged by a release and restarting them costs uptime for nothing.
- **Verify with the version the application reports, never with the container's
  status.** `Up (healthy)` is the container's own check: it says the process
  answers, not which build it is.
- Read the migration line in the log. "No pending migrations" on a release you
  expected to carry one means the image is older than you think.
- A release **with** a migration is not rollable by restoring the previous
  compose file. Check what migrations sit between the two tags before promising
  a rollback, and dump the database first.

Plus:

```markdown
## Where this project deploys

Read `## Deploy targets` in `.claude/CLAUDE.md`: the host, the container names,
the image registry, the health endpoint, and the stack's own project name. If
that heading is absent, **this project has no deploy target configured — say so
and stop.** Do not infer one from a compose file: the procedure below is
precisely about not trusting a path you did not read from the running system.
```

- [ ] **Step 2: Write the failing test for Review Focus 2**

The behaviour under test is a skill's, not a script's, so the check is a
grep for the refusal clause rather than a run. Add to
`scripts/check-skills.test.sh`:

```sh
# Review Focus 2: a skill that reads a CLAUDE.md heading must say what it does
# when the heading is absent. A skill that omits this will be followed into a
# deploy against nothing, which reports success.
for s in deploy-verify issue-bookkeeping ci-gates; do
  f="$here/../skills/$s/SKILL.md"
  if [ -f "$f" ] && grep -qiE 'if that heading is absent' "$f"; then
    printf 'ok   %s states what to do when its heading is absent\n' "$s"
  else
    printf 'FAIL %s does not state what to do when its heading is absent\n' "$s" >&2
    failures=$((failures + 1))
  fi
done
```

- [ ] **Step 3: Run it**

Run:

```bash
cd ~/projects/petProjects/shipyard
sh scripts/check-skills.test.sh
```

Expected: three `ok` lines, then `all cases pass`. A `FAIL` names the skill
whose contract section is missing — add it there.

- [ ] **Step 4: Commit**

```bash
git add skills/deploy-verify scripts/check-skills.test.sh
git commit -m "feat: add the deploy-verify skill"
```

---

### Task 7: `skills/release-audit`

**Files:**

- Create: `skills/release-audit/SKILL.md`
- Create: `skills/release-audit/setup.md`
- Create: `skills/release-audit/driver.mjs` (copied, then edited in Task 8)

**Interfaces:**

- Consumes: Task 1's validator; `## Audit personas` and `## Audit routes`.
- Produces: the `release-audit` skill, and the driver that Task 8 splits.

**Source:** `course_shelf/.claude/skills/pre-release-audit/{SKILL.md,setup.md,driver.mjs}`.
Remove the seven CI traps — they are Task 4's now — and every reference to the
source project's routes, personas and seeding script.

- [ ] **Step 1: Copy the driver unchanged**

```bash
cd ~/projects/petProjects/shipyard
mkdir -p skills/release-audit
cp ~/projects/petProjects/course_shelf/.claude/skills/pre-release-audit/driver.mjs skills/release-audit/driver.mjs
```

It is edited in Task 8, not here. Copying first keeps the diff of Task 8 to the
auth adapter alone.

- [ ] **Step 2: Write the skill**

```yaml
---
name: release-audit
description: Use before cutting a release, after a wave of interface fixes to measure whether they moved anything, and when a user-experience review is requested. Covers standing the product up on production-shaped data, the two-assessment critique, and why a run that reports nothing is the failure mode.
---
```

Body carries, with evidence:

- **The environment is the whole game.** Restore a production-shaped dump into
  a local stack. Not the seed: seeded data produces short titles and small
  objects, and every bug this method has caught lived in the gap between that
  and reality — a non-Latin title that deleted a record, a 4203-character
  description with nowhere to go, 1945 items filed under an unknown language.
- The live production system is the other wrong answer: half the interesting
  scenarios are destructive and cannot run against real data.
- **Audit the release images, not a development server.** A dev server differs
  from what users get in exactly the places that matter: the content security
  policy, minification, and the rendered document.
- Two assessments, kept strictly apart: an exploratory sweep that reports what
  is broken, and a design critique that scores. Nielsen's ten heuristics, 0-4
  each. **Most real interfaces land 20-32 of 40.**
- **A run that reports zero findings is the failure mode, not the result.** The
  first sweep of this method reported "56 pages, 0 violations" while every page
  was the sign-in redirect. Make the harness refuse to continue when
  authentication did not take, and look at a screenshot before believing a
  clean result.
- Sign-in is rate-limited twice over. A harness that signs in per run burns the
  allowance on plumbing: mint once, cache to disk, reuse. The token probe must
  treat a rate-limit response as **valid**, not as an expired token, or the run
  drives itself into the stricter limiter.
- Filling a sign-in form does not work against a client that hydrates after
  the network settles: it replaces the inputs and discards the fill silently.
  Authenticate over the API and seed the credentials.
- A visibility probe that checks the element misses ancestors. Walk up the tree.
- A clip probe flags the visually-hidden heading pattern: `position:absolute;
  width:1px; clip-path:inset(50%)` is indistinguishable from a clipped element
  by geometry alone. Check the class before filing.
- Faking every API response also fakes the endpoints that decide whether the
  instance is initialised, which funnels every route into a first-run wizard —
  a different screen than the one under audit. Exclude auth and instance-config
  routes from the mock.
- **Normalise before comparing runs.** Raw counts mislead: a wider matrix
  produces more of everything, and rate-limit noise dominates both numerators.
- **One rule violation is usually one element.** A run reported 98 violations
  of one rule; they were a single unlabelled button multiplied by 128 matrix
  combinations. Group by rule, find the element, then size the work.
- **Expect the fixes to break things.** The first fix wave moved a score from
  18 to 22 and introduced three new inconsistencies, one of which made a
  previously inert setting actively contradictory. Audit the fixes, not just
  the original findings.
- Say what the audit systematically misses — interaction, long operations, the
  media player's native chrome, keyboard-only navigation, zoom, reduced motion,
  forced colours — rather than implying coverage you do not have.

Plus:

```markdown
## What this project audits

Read `## Audit personas` and `## Audit routes` in `.claude/CLAUDE.md`. If
either heading is absent, this project has not described its own surface — say
so and stop. Auditing a guessed route list produces a report whose gaps are
invisible.
```

- [ ] **Step 3: Write `setup.md`**

Lift `course_shelf/.claude/skills/pre-release-audit/setup.md`, replacing the
project's dump path, compose file and seeding command with the corresponding
values read from `## Audit personas` / `## Audit routes` and the project's own
deploy documentation.

- [ ] **Step 4: Verify**

Run:

```bash
cd ~/projects/petProjects/shipyard
sh scripts/check-skills.sh && sh scripts/check-skills.test.sh
```

Expected: `skills ok`, then `all cases pass`. A `two skills claim the same
trigger` failure here is Review Focus 3 — this skill must not claim "the checks
are not green"; that belongs to `ci-gates`.

- [ ] **Step 5: Commit**

```bash
git add skills/release-audit
git commit -m "feat: add the release-audit skill and its driver"
```

---

### Task 8: Split the driver's auth adapter

**Files:**

- Create: `skills/release-audit/auth-adapter.mjs`
- Modify: `skills/release-audit/driver.mjs`

**Interfaces:**

- Consumes: the driver copied in Task 7.
- Produces: `auth-adapter.mjs` exporting `signIn(base, persona, password)`
  returning `{ token, cookie }`, and `cookieNames()` returning
  `{ session, locale }`. The driver imports both and contains no project-specific
  authentication detail.

The driver already reads `AUDIT_BASE`, `AUDIT_OUT`, `AUDIT_CORE`, `AUDIT_ALL`
and `AUDIT_PASSWORD` from the environment. What does not travel is the sign-in
route, the session cookie name, the locale cookie name, the probe endpoint, and
the personas map.

- [ ] **Step 1: Write the failing test**

Create `skills/release-audit/auth-adapter.test.mjs`:

```js
// The adapter is the only project-specific part of the driver. This asserts
// its shape, so a project that rewrites it for its own API finds out here
// rather than during a run that reports zero findings.
import assert from 'node:assert/strict';
import { signIn, cookieNames } from './auth-adapter.mjs';

assert.equal(typeof signIn, 'function', 'signIn must be exported');
assert.equal(signIn.length, 3, 'signIn takes (base, persona, password)');

const names = cookieNames();
assert.ok(names.session, 'cookieNames().session must be a non-empty string');
assert.ok(names.locale, 'cookieNames().locale must be a non-empty string');

console.log('auth-adapter contract ok');
```

- [ ] **Step 2: Run it to verify it fails**

Run:

```bash
cd ~/projects/petProjects/shipyard/skills/release-audit
node auth-adapter.test.mjs
```

Expected: FAIL — `ERR_MODULE_NOT_FOUND`, because `auth-adapter.mjs` does not
exist yet.

- [ ] **Step 3: Extract the adapter**

Move out of `driver.mjs`, into `auth-adapter.mjs`, exactly: the `PERSONAS`
constant, the `fetch` to the sign-in route, the `getSetCookie` parsing of the
session cookie, the locale cookie name, and the cached-token probe endpoint.
Keep the trap comments with them — in particular that the probe must treat a
rate-limit response as a valid token, and that a non-browser client sending
`Sec-Fetch-*` headers without an `Origin` is rejected as a null-origin browser
request while `curl`, which sends neither, is let through.

`driver.mjs` then imports `signIn` and `cookieNames` and keeps everything else
unchanged.

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
cd ~/projects/petProjects/shipyard/skills/release-audit
node auth-adapter.test.mjs
```

Expected: `auth-adapter contract ok`.

- [ ] **Step 5: Verify the driver no longer names the source project**

Run:

```bash
cd ~/projects/petProjects/shipyard
grep -nE 'better-auth|/api/v1/courses|i18n_locale' skills/release-audit/driver.mjs && echo "STILL THERE" || echo "clean"
sh scripts/check-skills.sh
```

Expected: `clean`, then `skills ok`.

- [ ] **Step 6: Commit**

```bash
git add skills/release-audit
git commit -m "refactor: split the audit driver's auth adapter out of the driver"
```

---

### Task 9: `commands/bootstrap.md`

**Files:**

- Create: `commands/bootstrap.md`

**Interfaces:**

- Consumes: the `project-skeleton` template's placeholders and contract
  headings, which phase 2 produced.
- Produces: the `/bootstrap` slash command.

This is the command the phase-2 plan deliberately left out, because the first
manual fill is what tells it which questions are worth asking. Write it from
that experience, not from the spec's list.

- [ ] **Step 1: Write the command**

```yaml
---
name: bootstrap
description: Fill a freshly created project-skeleton repository — its placeholders, its contract sections, and its first ADR.
---
```

Body instructs, in order:

1. Refuse if `.claude/CLAUDE.md` has no `<PROJECT>` placeholder: this
   repository has already been bootstrapped, and re-running would overwrite
   hand edits.
2. Ask four questions and no more — the project's name, the conversation
   language, which stack (or none), and which optional contract sections apply.
3. Replace every placeholder found by `grep -rn '<[A-Z_]\+>' . --exclude-dir=.git`.
4. **Delete** each optional contract heading the project did not choose. An
   empty heading is indistinguishable, to the skill that reads it, from a filled
   one, so the skill would run its procedure against nothing and report success.
5. Replace `LICENSE` with one naming this project's owner, and delete
   `scripts/smoke-test.sh`, which tests the template rather than this project.
6. Write `docs/adr/0002` for the first decision this project has already made
   that someone would otherwise re-argue.
7. Create the first entry in `specs/tasks/active/`.

- [ ] **Step 2: Verify**

Run:

```bash
cd ~/projects/petProjects/shipyard
sh scripts/check-skills.sh
```

Expected: `skills ok` — the validator walks `skills/`, so this passes
trivially; the point of running it is that the command did not break anything.

- [ ] **Step 3: Commit**

```bash
git add commands/bootstrap.md
git commit -m "feat: add the bootstrap command"
```

---

### Task 10: README, publish, tags

**Files:**

- Create: `README.md`
- Create: `LICENSE`

**Interfaces:**

- Consumes: everything.
- Produces: the published, installable plugin.

- [ ] **Step 1: Write the README**

It covers, in this order: what the layer is for; what it does **not** do
(no stack, no scaffolding, no opinions about a framework); install and update;
**one line per skill naming its trigger**, because a reader deciding whether to
install cannot see a `description` that only Claude reads; the contract it
expects from the other layer, listing every `CLAUDE.md` heading a skill reads
and what happens when it is absent; and one worked example from an empty
directory to a first commit.

- [ ] **Step 2: Write the LICENSE**

MIT, `Copyright (c) 2026 Kirill Kucherenkov and contributors` — the same wording
`project-skeleton` carries, and for the same reason: parts of these procedures
were written by more than one person.

- [ ] **Step 3: Publish**

```bash
cd ~/projects/petProjects/shipyard
gh repo create shipyard --public --source=. --remote=origin
git remote set-url origin https://github.com/kkucherenkov/shipyard.git
git push -u origin main
```

The explicit `set-url` is not redundant: on this machine `gh repo create
--source=.` writes an ssh remote although `gh config get git_protocol` is
https, and there is no GitHub ssh key, so the push fails with exit 128 after
the repository already exists.

- [ ] **Step 4: Tag**

```bash
gh repo edit --add-topic claude-code --add-topic claude-code-plugin --add-topic process
gh repo edit --description "Process discipline for a project: task stack, lane discipline, CI gating, issue bookkeeping, deploy verification, release audit."
git tag v0.1.0
git push origin v0.1.0
```

Claude Code installs a plugin from git and reads its version from the manifest,
so the manifest bump and the tag go together: a bump without a tag leaves no
recoverable point to roll back to, and a tag without a bump installs as the
previous version.

- [ ] **Step 5: Verify the plugin installs and the skills are visible**

Run:

```bash
gh repo view kkucherenkov/shipyard --json isPrivate,repositoryTopics --jq '{private: .isPrivate, topics: [.repositoryTopics[].name]}'
```

Expected: `{"private": false, "topics": [...]}`.

Then, in a Claude Code session:

```
/plugin marketplace add kkucherenkov/shipyard
/plugin install shipyard
```

Expected: six skills and one command appear in the session's skill list. This
step needs a human at a session; there is no CLI assertion for it.

- [ ] **Step 6: Commit**

```bash
git add README.md LICENSE
git commit -m "docs: describe the plugin and license it"
git push
```

---

## Done means

- `sh scripts/check-skills.sh` prints `skills ok`.
- `sh scripts/check-skills.test.sh` prints `all cases pass`.
- `node skills/release-audit/auth-adapter.test.mjs` prints
  `auth-adapter contract ok`.
- `kkucherenkov/shipyard` is public, tagged `v0.1.0`, and installs.
- Every skill's `description` names a task someone will actually be doing.

## What this plan does not do

- **It does not migrate `course_shelf`.** That is phase 3, and it waits for
  this plugin to have been run on real work — the bake described in the spec's
  section 6.
- **It does not write the stack recipe.** That is phase 4, against the PIM
  project.
- **It does not add a second plugin to the marketplace manifest.** The entry
  for `shipyard-ts-monorepo` belongs to phase 4's plan, which is what will know
  its name and description.
