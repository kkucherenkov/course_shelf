---
name: card-bookkeeping
description: Reconcile a roadmap card with its GitHub issues — look up a card's issues by prefix, write the Closes lines for a PR, close issues a merged PR missed, and close an epic umbrella. Use when opening a PR for a card, marking a card Done, or auditing whether a card's issues match its status.
---

# Card ↔ issue bookkeeping

The card in `docs/roadmap/tasks/` is always the source of truth. Issues are
stable URLs for cross-referencing, nothing more. Nothing here overrides a card.

## Look up a card's issues

Filter by the `[<card-id>]` **prefix**. A plain search also returns other cards'
issues that merely _mention_ the id in their title — `[E18-F03-S01] … (from
E15-F01-S03)` is E18's issue, not E15's:

```sh
gh issue list --state all --search "<card-id> in:title" \
  --json number,title,state \
  --jq '[.[] | select(.title | startswith("[<card-id>]"))]'
```

## Opening a PR for a card

Put a `Closes #N` line for **each** of the card's issues in the PR body. GitHub
only recognises `#N` — `Closes <card-id>` does nothing, so the merge will not
auto-close and you will be closing them by hand. `Closes`, `Fixes` and
`Resolves` all work, and fire when the PR merges to `main`.

Exception worth knowing: a PR that _schedules_ work rather than doing it (adding
cards, opening a milestone) must **not** carry `Closes` lines — it would empty
the milestone the moment it was created.

## A PR merged without `Closes #N`

The completion is real; close the issues and record why:

```sh
gh issue close <N> --reason completed --comment "Closed by PR #<pr> (<card-id>)."
```

## When a card is marked ✅ Done

Edit the card itself — `docs/roadmap/tasks/<ID>.md` gets `**Status:** ✅ Done`,
its sub-steps ticked, and `Completed` / `Result` under Notes. Then tick the
story's row in `docs/roadmap/TODO.md` and bump that milestone's progress
counter by hand.

**Never run `docs/roadmap/tools/generate.py` without `--roadmap-only`.** It is a
one-shot seeder: a plain run resets every card to `⬜ Not started`, wipes every
`Completed` / `Result` note, and rewrites the progress counter to `0 / N`.
`refuse_if_seeded()` blocks it, and `--force` past that guard destroys the
record. The only safe invocation regenerates the Gantt chart:

```sh
python3 docs/roadmap/tools/generate.py --roadmap-only
```

### The progress counter is not a mergeable quantity

Two lanes that each bump `12 / 36` to `14 / 36` produce no conflict — both
sides wrote the same text — and the merge silently loses two cards. Git cannot
help here, so after **every** merge that touches `TODO.md`, recount instead of
trusting the arithmetic:

```sh
grep -cE '^- \[x\] \[E(2[5-9]|3[01])-' docs/roadmap/TODO.md   # v2 epics E25-E31
```

Set the counter to what that prints. Do the same for v1 with its own epic
range.

Reconcile in the same pass: confirm every story issue for that card is closed,
and once **every** card under an epic is Done, close the epic's umbrella issue
too.

## Creating issues for new work

A new v2 card gets an issue on the `v2 — Transcript-first` milestone and a line
in its epic's umbrella. Title the issue `[<card-id>] <title>`; the body carries
the goal, a link to the card, and the epic/feature/stage/dependency table —
acceptance criteria and sub-steps stay on the card and are not duplicated.
