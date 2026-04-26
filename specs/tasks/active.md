# Active tasks

## T-2026-04-26-009 — Prisma generate postinstall + close E01-F01-S02

- Created: 2026-04-26
- Owner: claude
- Spec: closes the third acceptance bullet of `docs/roadmap/tasks/E01-F01-S02.md` ("`pnpm lint` runs across the workspace and reports zero errors"). Pre-existing 4 prisma `no-unsafe-call` / TS2339 errors stemmed from a missing Prisma client generation; running `prisma generate` closes them, and adding it to `postinstall` ensures any clean clone gets the same treatment automatically.
- Goal: workspace-wide `pnpm -r lint` finishes with **zero errors** on a clean clone right after `pnpm install`, without any manual codegen step.
- Acceptance:
  - `apps/backend/package.json` carries a `postinstall: prisma generate` script that runs after every workspace install.
  - `pnpm --filter @app/backend lint` reports zero errors (only the v5→v6 boundaries deprecation warnings, which are non-blocking).
  - `pnpm --filter @app/backend typecheck` exits 0.
  - `pnpm -r lint` across the whole workspace reports zero errors (warnings allowed).
  - `pnpm --filter @app/backend test` 43/43 still pass.
  - Card `docs/roadmap/tasks/E01-F01-S02.md` flips to ✅ Done; `docs/roadmap/TODO.md` ticks `E01-F01-S02` and the progress counter goes from `7 / 115` to `8 / 115`.
- Spec diff: none
- Codegen impact: no (Prisma client lives in node_modules, not the repo)
- Design impact: none
- Tests: workspace lint, backend typecheck + tests.
- Sub-steps:
  - [x] run `pnpm --filter @app/backend prisma:generate` once to verify lint/typecheck go green
  - [x] wire `postinstall: prisma generate` in `apps/backend/package.json`
  - [x] verify `pnpm --filter @app/backend install --offline` triggers the postinstall and regenerates the client
  - [x] confirm `pnpm -r lint` reports 0 errors workspace-wide (36 vue formatting warnings remain — out of scope)
  - [x] flip `E01-F01-S02` to ✅ Done; tick TODO.md; bump progress counter to 8 / 115
  - [x] prettier on touched files
- Status: in-progress
- Blockers: —
