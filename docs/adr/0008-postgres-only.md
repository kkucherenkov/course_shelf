# 0008 — Postgres only; the SQLite default was dropped

- **Status:** accepted
- **Date:** 2026-08-29
- **Deciders:** @kkucherenkov
- **Tags:** backend, infra, persistence

> Recorded retroactively, and it reverses a planned decision.
> [E23-F01-S02](../roadmap/tasks/E23-F01-S02.md) carded "docker-compose.yml
> (sqlite default) + docker-compose.postgres.yml", and the seed list for these
> ADRs asked for "ADR-0008 SQLite default, Postgres opt-in". Neither describes
> what was built. The card was cancelled on 2026-08-29 and this ADR records why,
> so the SQLite plan is not resurrected from the roadmap by someone reading it
> as a to-do.

## Context

The original plan was the familiar self-hosted ladder: SQLite by default so a
first run needs no database container, Postgres as an opt-in for anyone who
outgrows it. That is a good default for a single-user note app.

CourseShelf's write path is not that. A library scan walks the filesystem and
writes `DiscoveredFile`, `Course`, `Section`, `Lesson`, `Material` and
`Subtitle` rows while `ffprobe` shells out per file; identify tasks and progress
writes run concurrently with it. SQLite is single-writer, so that pipeline
serialises against every other write in the process.

The schema also stopped being portable. It relies on `@db.Decimal(3, 2)` for
`Course.ratingAverage`, two `Json` columns on `IdentifyTask`, and a descending
index (`@@index([userId, lastSeenAt(sort: Desc)])`) — and 15 migrations have
accumulated against `provider = "postgresql"`. Prisma's `provider` is a
build-time choice: supporting both means two schemas and two migration
histories, and every future migration has to be written and tested twice.

## Decision

Postgres only. `provider = "postgresql"` with the `@prisma/adapter-pg` driver
adapter (`common/prisma/prisma.service.ts`), and `postgres:18.1-alpine` in every
compose file — dev, CI, prod and release. No SQLite path exists in the backend,
and none will be added.

## Consequences

### Positive

- One schema, one migration history, one set of behaviours to test. A migration
  is written once.
- The scan pipeline's concurrent writes are a normal workload rather than a
  contention problem.
- Postgres types (`Decimal`, `Json`, sorted indexes) are available without asking
  whether the other engine supports them.

### Negative

- **A database container is mandatory.** There is no "download one binary and
  run it" mode, which is a real cost for a self-hosted product and the reason the
  SQLite default was planned in the first place.
- Backups are `pg_dump`, not "copy the file" — which is why
  [E21-F01-S02](../roadmap/tasks/E21-F01-S02.md) exists as its own card.
- Anyone arriving from the PRD or the roadmap will find SQLite promised in
  several places. Those texts are stale; this ADR is the current answer.

### Neutral

- The mobile app _does_ use SQLite, via `drift`. That is an unrelated decision
  about on-device storage and has no bearing on the server.

## Alternatives considered

### Option A — SQLite default, Postgres opt-in (the carded plan)

Rejected once the schema and the write path were real. Supporting both would
mean maintaining two Prisma schemas and two migration histories for the life of
the project, and accepting single-writer contention on the scan pipeline in the
configuration most users would actually run.

### Option B — SQLite only

Rejected on the same write-concurrency grounds, and it would have to give up the
column types the schema already uses.

### Option C — keep the SQLite path but mark it unsupported

Rejected as the worst of both: the maintenance cost of a second engine with none
of the confidence, and a documented path that nobody tests.

## Related

- [ADR-0003](0003-cqrs-without-event-sourcing.md) — the state tables this store
  holds.
- [E23-F01-S02](../roadmap/tasks/E23-F01-S02.md) — the cancelled card.
