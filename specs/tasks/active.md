# Active tasks

## T-2026-04-26-027 — Batch progress endpoint for sync (E09-F01-S02)

- Created: 2026-04-26
- Owner: claude
- Spec: `docs/roadmap/tasks/E09-F01-S02.md` — Learning F01 second slice. Mobile clients accumulate progress writes while offline; the existing `POST /progress` is one-at-a-time and would force the client into N round trips after coming back online. This story adds `POST /progress/batch` that accepts up to 200 items in one call and returns a per-item result (`accepted` / `stale` / `forbidden` / `notFound`), so the client can resolve conflicts (newer-on-server) by pulling the server state for that lesson.
- Goal: a single round-trip can drain a user's offline buffer; per-item failures don't fail the whole batch (always `200 OK` with inline per-item status); conflicts (server `lastSeenAt` newer than client's `clientUpdatedAt`) return the server state so the mobile cache can overwrite locally.
- Acceptance:
  - `POST /api/v1/progress/batch` accepts a body of `{ items: RecordProgressRequest[] }` with `1 ≤ items.length ≤ 200`. `400` if 0 or >200 (validator-rejected).
  - Always `200 OK` (so long as the request is well-formed and the user is authenticated). Body: `{ results: BatchProgressItemResult[] }` indexed in the same order as the input.
  - Each `BatchProgressItemResult` is one of:
    - `{ status: 'accepted', state: LessonProgressDto }` — client write applied (or silently absorbed last-write-wins).
    - `{ status: 'stale', state: LessonProgressDto }` — client's `clientUpdatedAt` was older than server `lastSeenAt`; server state returned so the client can overwrite local cache.
    - `{ status: 'forbidden', lessonId }` — actor lacks READ grant. (No-oracle: also covers "lesson missing".)
    - `{ status: 'not-found', lessonId }` — never returned in the batch path; missing lessons collapse into `forbidden` (no oracle).
  - Per-item errors **do not abort** the batch — the handler iterates and collects per-item outcomes. The whole batch fails only if request body validation rejects (size cap, missing fields).
  - Handler reuses `RecordProgressCommand` per item — no new aggregate, no parallel write path. `stale` is determined by comparing the post-merge `lastSeenAt` returned by the existing command against the input's `clientUpdatedAt`: if the post-merge `lastSeenAt > clientUpdatedAt`, the write was absorbed but the server had newer state → `stale` for that item.
  - Cap N=200 documented in the OpenAPI summary + as `maxItems: 200, minItems: 1` on the array schema.
- Spec diff: yes — new path `POST /api/v1/progress/batch`, new schemas `BatchProgressRequest`, `BatchProgressResponse`, `BatchProgressItemResult` (oneOf with status discriminator).
- Codegen impact: yes — TS + Dart clients regenerate.
- Design impact: none.
- Tests:
  - `record-progress-batch.handler.spec.ts` — three items: one accepted, one returns stale (client clientUpdatedAt 5min behind server), one whose `canSee` returns false (forbidden); assert order preserved and one `stale.state` reflects server state.
  - Controller integration via existing test infra (covered by handler spec; controller is a thin adapter).
  - 400 case: array of length 201 → validator rejects (smoke-tested implicitly via openapi-validator wired on `/api/v1/*`).
- Sub-steps:
  - [ ] T-027-A: spec edits — add path + schemas (spec-writer subagent)
  - [ ] T-027-B: regen TS + Dart clients (codegen-runner subagent)
  - [ ] T-027-C: `RecordProgressBatchCommand` + handler that fans out into existing `RecordProgressCommand`; reuse aggregates/projections; controller method `POST /progress/batch`
  - [ ] T-027-D: tests
  - [ ] T-027-E: lint, typecheck, test, prettier; flip card; archive T-027
- Status: in-progress
- Blockers: —
