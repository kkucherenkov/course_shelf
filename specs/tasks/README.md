# Task stack

The only durable record of what Claude (or a human) is working on, what is blocked, and what has already shipped. Two files:

- **`active.md`** — LIFO stack of in-flight work. Newest task on top. Every in-progress task lives here until it ships.
- **`done.md`** — append-only archive of shipped tasks. Each entry links back to the feature spec / ADR / PR.

## Rules

1. **Before touching code**, push a new entry to the top of `active.md` using
   the template at [`templates/feature.md`](templates/feature.md). Minimal
   example:

   ```md
   ## T-2026-04-18-001 — add booking endpoint

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

`T-YYYY-MM-DD-NNN` where NNN is a zero-padded counter per-day. Unique forever.

## Why this exists

Claude loses memory between sessions. Git history records commits, not intent. The task stack is the one place where "what is currently being worked on and why" is legible both to a cold-start Claude and to a human skimming the repo.
