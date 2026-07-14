# Active tasks

## T-2026-07-14-001 — fix broken `--` arg-forwarding patterns (CLAUDE.md + issues:lookup)

- Created: 2026-07-14
- Owner: claude
- Spec: follow-up from T-2026-07-13-001 — pnpm forwards a literal `--` verbatim (unlike npm), so every documented `script -- args` pattern was broken
- Goal: every command documented in CLAUDE.md works as written.
- Spec diff: none (no OpenAPI/AsyncAPI change)
- Codegen impact: no
- Sub-steps:
  - [x] CLAUDE.md "Running a single test": dropped `--` from all vitest/Playwright forms + added a warning note; verified empirically (`pnpm --filter @app/backend test <file>` → 1 file; `test -t "resolves" <file>` → filtered; `test -- <bogus-file>` proven to silently start the full suite)
  - [x] `pnpm issues:lookup -- <card-id>` was broken the same way (script only parsed `--key=value`, so the id was ignored and lookup resolved to the literal string `true`). Fixed at the root: `seed-forgejo-issues.ts` now collects positional args (skipping the forwarded `--`) and `--lookup` takes the id positionally; bare `--lookup` without an id exits 1 instead of falling through to the full seed run. All three invocations verified (documented form → `55`)
- Status: in-review
- Blockers: —
