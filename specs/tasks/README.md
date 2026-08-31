# Task stack

The only durable record of what Claude (or a human) is working on, what is blocked, and what has already shipped. Two files:

- **`active.md`** — LIFO stack of in-flight work. Newest task on top. Every in-progress task lives here until it ships.
- **`done.md`** — append-only archive of shipped tasks. Each entry links back to the feature spec / ADR / PR.

## Rules

1. **Before touching code**, push a new entry to the top of `active.md` using
   the template at [`templates/feature.md`](templates/feature.md). Minimal
   example:

   ```md
   ## T-2026-04-18-booking-create — add booking endpoint

   - Created: 2026-04-18
   - Owner: claude
   - Spec: [specs/features/booking-create.md](../features/booking-create.md)
   - Goal: users can create a booking from the detail page.
   - Spec diff: openapi.yaml — POST /api/v1/bookings
   - Codegen impact: yes
   - Sub-steps:
     - [ ] extend openapi.yaml with POST /api/v1/bookings
     - [ ] regen clients
     - [ ] implement command handler
     - [ ] wire page
   - Status: in-progress
   - Blockers: —
   ```

2. **While working**, check sub-step boxes in place. If the task is blocked, flip `Status: blocked` and fill `Blockers:`.

3. **When shipped**, move the whole entry to the top of `done.md`, add `- Completed: YYYY-MM-DD` and `- Result: <PR link or commit sha>`. The entry in `done.md` must reference the spec it implemented (ADR, feature doc, or linear issue) so the audit trail survives.

4. **Never delete** entries from `done.md`. If a task was cancelled, move it to `done.md` with `- Result: cancelled — <reason>`.

5. **Stack depth** — `active.md` should rarely have more than three entries. If it does, something is being left half-done. Close or cancel before opening the next.

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
the next free number by reading the two files, so two lanes working at the
same time read the same state and pick the same number. On 2026-08-31 five
parallel lanes collided three times — two both took `-001`, and a third took
an id another lane had already written into `done.md`. Every collision surfaced
as a merge conflict in a file whose entries do not otherwise overlap.

A branch slug needs no allocator because the uniqueness already exists further
up: one lane is one branch is one PR (see **Parallel work** in
`.claude/CLAUDE.md`), and git will not let two lanes hold the same branch name.
The id stops being a second identifier that has to be kept unique by hand and
becomes a restatement of one that already is.

Entries written before this change keep their numeric ids — `done.md` is an
archive, and rewriting history there would break every link that points at it.

## Why this exists

Claude loses memory between sessions. Git history records commits, not intent. The task stack is the one place where "what is currently being worked on and why" is legible both to a cold-start Claude and to a human skimming the repo.
