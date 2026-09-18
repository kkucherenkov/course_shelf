## T-2026-09-16-kkucherenkov-flashcards-domain — flashcard + SM-2 domain and API

- Created: 2026-09-16
- Owner: claude
- Spec: [docs/roadmap/tasks/E29-F01-S01.md](../../docs/roadmap/tasks/E29-F01-S01.md), [docs/roadmap/tasks/E29-F01-S02.md](../../docs/roadmap/tasks/E29-F01-S02.md)
- Goal: Flashcard aggregate with a pure SM-2 scheduler and review-queue query (S01), then CRUD + due-queue + grade endpoints over it (S02). Issues #232, #233, umbrella #250.
- Spec diff: openapi.yaml — flashcard routes (create/list per lesson, due queue, update, delete, grade)
- Codegen impact: yes
- Sub-steps:
  - [x] Prisma schema + migration for `Flashcard`
  - [x] `ReviewSchedule` pure SM-2 function + table-driven tests
  - [x] `Flashcard` aggregate + repository port + Prisma adapter
  - [x] Migration verified against real Postgres
  - [x] OpenAPI routes + codegen (own commit)
  - [x] Commands/queries + controller + handler specs
- Status: done
- Completed: 2026-09-16
- Result: [PR #684](https://github.com/kkucherenkov/course_shelf/pull/684) (domain, S01), [PR #690](https://github.com/kkucherenkov/course_shelf/pull/690) (API, S02) — both green. The API half was first opened as #686, stacked on the domain branch; GitHub auto-closed it when #684 merged and its base branch was deleted, so the same branch was reopened as #690 against `main`.
