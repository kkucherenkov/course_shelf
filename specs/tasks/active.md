# Active tasks

## T-2026-09-16-kkucherenkov-flashcards-domain — flashcard + SM-2 domain and API

- Created: 2026-09-16
- Owner: claude
- Spec: [docs/roadmap/tasks/E29-F01-S01.md](../../docs/roadmap/tasks/E29-F01-S01.md), [docs/roadmap/tasks/E29-F01-S02.md](../../docs/roadmap/tasks/E29-F01-S02.md)
- Goal: Flashcard aggregate with a pure SM-2 scheduler and review-queue query (S01), then CRUD + due-queue + grade endpoints over it (S02). Issues #232, #233, umbrella #250.
- Spec diff: openapi.yaml — flashcard routes (create/list per lesson, due queue, update, delete, grade)
- Codegen impact: yes
- Sub-steps:
  - [ ] Prisma schema + migration for `Flashcard`
  - [ ] `ReviewSchedule` pure SM-2 function + table-driven tests
  - [ ] `Flashcard` aggregate + repository port + Prisma adapter
  - [ ] OpenAPI routes + codegen (own commit)
  - [ ] Commands/queries + controller + handler specs
  - [ ] Migration verified against real Postgres
- Status: in-progress
- Blockers: —
