# 0003 — CQRS over a state-stored domain, not event sourcing

- **Status:** accepted
- **Date:** 2026-08-29
- **Deciders:** @kkucherenkov
- **Tags:** backend, architecture

> Recorded retroactively. The layering was established in E04–E06 and has held
> across 68 handlers.

## Context

The backend has genuinely asymmetric read and write paths. Writes are small and
invariant-heavy (record progress, grant access, apply an identify result); reads
are wide and denormalised (a course outline with sections, lessons, materials,
subtitles and per-user progress in one payload). Serving both from the same
service methods produces either N+1 queries on read or a repository interface
shaped by the widest query.

CQRS answers that. Event sourcing is a separate, much larger decision that often
arrives bundled with it: make the event log the source of truth and derive all
state from it.

## Decision

Split commands from queries via `@nestjs/cqrs` — 31 command handlers and 35
query handlers under `modules/*/application/{commands,queries}/`. **State stays
the source of truth.** The 26 Prisma models hold current state; there is no
event store.

Domain events (`lesson-progress-recorded.event.ts`, `lesson-completed.event.ts`)
exist, but they are in-process notifications on the `EventBus`, not a log.
`CourseProgressReadModel` is the one projection, and it is rebuildable from
`LessonProgress` at any time
(`catalog/application/projections/rebuild-projections.service.ts`) — which is
precisely the property an event-sourced system gets from its log and this one
gets from the state tables.

## Consequences

### Positive

- Read handlers shape their own queries without distorting the write model.
- The projection is recoverable by construction: a handler bug, a DB reset or a
  migration that drops the read-model table is fixed by re-running the rebuild,
  not by replaying history.
- A developer can `SELECT` current state directly. With an event store, "what is
  this user's progress right now" needs a fold.

### Negative

- No audit log. There is no record of _how_ state reached its current value —
  if that is ever needed for access grants or progress disputes, it has to be
  added as an explicit table, not derived.
- No temporal queries: "what did this look like last Tuesday" is unanswerable.
- The command/query split is real boilerplate — a command, a handler, and a
  registration for each write, which is heavy for genuinely trivial mutations.

### Neutral

- The `EventBus` is available and used, so an event-sourced slice could be added
  later for one aggregate without rewriting the others.

## Alternatives considered

### Option A — event sourcing with an event store

Rejected. It buys audit and time-travel, neither of which this product needs,
and charges for them in projection lag, schema-versioned events, and a much
harder debugging story. A self-hosted course library is not a domain where the
history of a progress percentage is worth that.

### Option B — plain layered services, no CQRS

Rejected because of the read/write asymmetry above: one repository interface
ends up shaped by the widest read, and the write path inherits it.

## Related

- [ADR-0008](0008-postgres-only.md) — the store the state lives in.
