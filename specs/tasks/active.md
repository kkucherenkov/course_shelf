# Active tasks

## T-2026-08-29-010 — Audit items 9, 11, 12 · arm the last two gates, correct the rule

- Created: 2026-08-29
- Owner: claude
- Branch: `ci/arm-remaining-gates`
- Cards: none (audit remediation — `docs/audit/2026-08-29-plan-vs-code.md` §4)
- Goal: the two remaining gates that could not fail, and a rule that described
  a repository which does not exist.
- Spec diff: none
- Codegen impact: no
- Design impact: no
- Sub-steps:
  - [x] 9 — ffmpeg installed in ci.yml's `checks` job; the suite it unblocks
        verified green locally first (2 tests that had never run)
  - [x] 9 — the "Fix (CI)" section deleted from `docs/troubleshooting.md`:
        the instruction is now the config
  - [x] 11 — `tests/e2e/csp.spec.ts` fails instead of skipping when
        `E2E_EXPECT_CSP=1`, which `e2e.yml` sets
  - [x] 12 — the issue-mirroring rule narrowed to the epics actually mirrored
- Status: in-progress

Item 10 is deliberately not here: it changes the public API of two
design-system components and belongs in its own PR.
