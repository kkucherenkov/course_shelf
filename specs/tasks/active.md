# Active tasks

## T-2026-09-13-e27-transcript-search — trigram index + transcript hits in the search API

- Created: 2026-09-13
- Owner: claude
- Spec: [docs/superpowers/specs/2026-08-29-transcript-first-design.md §6](../../docs/superpowers/specs/2026-08-29-transcript-first-design.md), [E27-F01-S02](../../docs/roadmap/tasks/E27-F01-S02.md), [E27-F02-S01](../../docs/roadmap/tasks/E27-F02-S01.md)
- Goal: `GET /api/v1/search` answers "where was this said, and what minute?" via a trigram-indexed cue search, respecting the same per-library grants as course/lesson hits.
- Acceptance:
  - Migration creates `pg_trgm` + a GIN index on `transcript_cue.text`
  - `SearchResultDto.transcripts[]` returned alongside courses/lessons, additive
  - `libraryIds: []` short-circuits without a DB call; a grant on library A never returns a cue from library B
- Spec diff: openapi.yaml — `SearchTranscriptHitDto` + `transcripts[]` on `SearchResultDto`
- Codegen impact: yes — own commit
- Design impact: none
- Tests: adapter spec (access control), handler spec (ranking + limit), controller spec passthrough
- Sub-steps:
  - [ ] openapi.yaml + codegen (own commit)
  - [ ] schema.prisma: pg_trgm extension + GIN index + migration
  - [ ] SearchPort.findTranscriptHits + PrismaSearchAdapter
  - [ ] search-catalogue.handler wiring + ranking
  - [ ] search.controller passthrough
  - [ ] specs (adapter, handler, controller)
  - [ ] bookkeeping: cards → done, TODO.md counter, dnote changelog
  - [ ] PR
- Status: in-progress
- Blockers: —
