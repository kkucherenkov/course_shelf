# Task stack

The only durable record of what Claude (or a human) is working on, what is
blocked, and what has already shipped. Two directories, **one file per entry**:

- **`active/`** — work in flight. One file per task, named after its id.
- **`done/`** — the archive. Shipped and cancelled tasks, same file, moved here
  with `git mv`.

There is no index file and nothing to regenerate: `ls specs/tasks/active/` is
the stack, and `cat specs/tasks/active/*.md` reads it.

## Why one file per entry

It used to be two files, `active.md` and `done.md`, each an append-at-the-top
list. Every lane wrote at the top of the same file, so every lane after the
first hit a conflict there — in a file whose entries never actually overlap.

A custom merge driver (`merge=taskstack`) resolved that locally and worked. It
could not help where the cost actually landed: **GitHub does not run custom
merge drivers.** It computes mergeability with a plain three-way merge, so the
PR page said CONFLICTING regardless, the lane had to rebase, the force-push
restarted the whole CI run, and a green PR went back through twenty minutes of
checks to absorb a bookkeeping line. One wave of five lanes paid that twice.

Separate files cannot conflict — locally or on GitHub. Finishing a task is a
rename, which git tracks by itself, so the "the other lane already moved this
entry to done" case that the driver had special code for cannot arise.

## Rules

1. **Before touching code**, create `active/<id>.md` from
   [`templates/feature.md`](templates/feature.md).

2. **While working**, tick sub-steps in place. If the task is blocked, set
   `Status: blocked` and fill `Blockers:`.

3. **When shipped**, `git mv specs/tasks/active/<id>.md specs/tasks/done/`,
   set `Status: done`, and add `- Completed: YYYY-MM-DD` and `- Result: <PR
link>`. The entry must reference the spec it implemented (ADR, feature doc,
   or card) so the audit trail survives.

4. **Never delete** a file from `done/`. A cancelled task moves there with
   `- Result: cancelled — <reason>`.

5. **Stack depth** — `active/` should rarely hold more than three files. If it
   does, something is being left half-done. Close or cancel before opening the
   next.

## Task ID format

`T-YYYY-MM-DD-<branch-slug>` — the date the entry was created, then the task's
own branch with its Conventional-Commits type prefix dropped and `/` replaced
by `-`:

| Branch                           | Id                                       |
| -------------------------------- | ---------------------------------------- |
| `fix/dark-theme-contrast`        | `T-2026-08-31-dark-theme-contrast`       |
| `feat/backend-e2e-auth-contract` | `T-2026-08-31-backend-e2e-auth-contract` |
| `chore/backfill-issue-mirroring` | `T-2026-08-31-backfill-issue-mirroring`  |

**Do not allocate a number.** The id used to be `T-YYYY-MM-DD-NNN`, a
zero-padded counter per day, and that counter has no allocator: a lane picks
the next free number by reading what exists, so two lanes working at the same
time read the same state and pick the same number. On 2026-08-31 five parallel
lanes collided three times. A branch slug needs no allocator because the
uniqueness already exists further up: two lanes cannot share a branch.

The filename is now the id, so a collision is no longer a merge conflict — it
is two lanes trying to create the same path, which git refuses outright.

## Entries older than the split

The archive was one 6878-line file until 2026-09-18. Splitting it produced 249
files, named by their id where they had one and by `<date>-<slug>` where the
heading predated the id convention. One pair turned out to be the same entry
written twice by a union merge; the duplicate is gone.
