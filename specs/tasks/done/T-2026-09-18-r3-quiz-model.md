## T-2026-09-18-r3-quiz-model — rename `quiz.modelFilename` to `quiz.model`

- Created: 2026-09-18
- Owner: claude
- Spec: ADR-0012 (hosted-model-provider); tuxedo 214, last entry of the contract wave
- Goal: `quiz.modelFilename` no longer lies about its content — under the hosted
  provider it holds a provider model id (`mistralai/mistral-nemo`), not a
  `.gguf` filename, so the column, the DTO field and every backend symbol
  carrying that name become `model`.
- Acceptance:
  - `GET /quizzes`, `GET /quizzes/{id}`, apply/discard responses all serialize
    `model` instead of `modelFilename`.
  - Existing quiz rows keep their values after migration (rename, not
    drop+add).
  - `pnpm spec:validate/bundle/codegen` clean; generated clients carry `model`.
- Spec diff: `packages/specs/openapi/openapi.yaml` — `QuizDto.modelFilename` →
  `QuizDto.model` (4 response examples + schema + description).
- Codegen impact: yes — regenerate `api-client-ts` + `api-client-dart`.
- Design impact: none.
- Tests: existing unit specs updated in place (quiz.spec.ts,
  prisma-quiz.repository.spec.ts, quiz-queries.spec.ts,
  generate-quiz.handler.spec.ts, generate-lesson-quiz.controller.spec.ts,
  apply-quiz.handler.spec.ts, discard-quiz.handler.spec.ts) — no new coverage
  needed, this is a rename.
- Sub-steps:
  - [x] `pnpm install` (fresh worktree, no `node_modules`)
  - [x] Edit openapi.yaml: schema + 4 examples + stale comment reference
  - [x] `pnpm spec:validate && pnpm spec:bundle`
  - [x] `PATH="$HOME/fvm/default/bin:$PATH" pnpm spec:codegen`
  - [x] Prisma schema: rename `modelFilename` → `model`, update doc comment
  - [x] Generate migration, confirm it is `RENAME COLUMN` (hand-fix SQL if
        Prisma proposes drop+add) — `prisma migrate diff` proposed drop+add
        as expected, hand-wrote the rename, verified with a throwaway shadow
        Postgres that the migration history now diffs empty against
        `schema.prisma`
  - [x] Backend: domain (`quiz.ts`, `quiz.events.ts`), application
        (`generate-quiz.command.ts`, `generate-quiz.handler.ts` incl. stale
        comment), infra (`prisma-quiz.repository.ts`), `quiz.dto.ts`
  - [x] Backend specs updated to match
  - [x] `pnpm --filter @app/backend test` green (228 files, 2359 tests)
  - [x] `pnpm format`
  - [x] Commit: spec, codegen, and backend split into three commits (matches
        the repo's `feat(specs)` / `chore(specs): regenerate clients for …`
        convention)
  - [x] Open PR (#751), all checks green incl. Playwright smoke
- Status: done
- Blockers: —
- Completed: 2026-09-18
- Result: https://github.com/kkucherenkov/course_shelf/pull/751
