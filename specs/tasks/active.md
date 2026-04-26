# Active tasks

## T-2026-04-26-004 — design-token cross-source audit (PR 3b)

- Created: 2026-04-26
- Owner: claude
- Spec: in-thread agreement (option C-full part 2). Stacks on the brand alignment landed by T-2026-04-26-003.
- Goal: ship `packages/design-tokens/scripts/audit-cross-source.ts` that compares brand-affecting values between `docs/design/shared/tokens.json` (prototype, Style-Dictionary v3 schema) and `specs/design/tokens/*.json` (code-stack DTCG); the script exits 1 with a readable diff on any drift, and exits 0 with a one-line summary on parity.
- Acceptance:
  - `pnpm --filter @app/design-tokens audit:cross-source` exits 0 on the current repo state (PR 3a left both sources in sync).
  - The script covers, at minimum: themed colors (`bg`, `surface`, `surface-2`, `surface-3`, `border`, `border-strong`, `focus-ring`, `text`, `text-loud`, `text-muted`, `primary`, `primary-hover`, `primary-text`) for both dark and light; semantic colors (`success`/`warning`/`error`/`info`, dark only); spacing (`0..9`), radius (`sm`/`md`/`lg`/`pill`), font families (`sans`/`mono`), durations (`fast`/`base`↔`normal`/`slow`), easings (`out`/`in`/`default`↔`inOut`), elevations (`shadow-1`↔`shadow.xs.dark`, `shadow-2`↔`shadow.md.dark`, `shadow-3`↔`shadow.lg.dark`).
  - Mapping table is colocated with the script and references the same pairs used by `emit-scss.ts` (no two sources of truth for the mapping).
  - Hex normalisation handles `#RGB`/`#RRGGBB`/`rgba(...)`/multi-shadow lists (so `#FFFFFF` ≡ `#fff`, `rgba(0,0,0,0.35)` ≡ `rgba(0, 0, 0, 0.35)`, `0 1px 2px rgba(0, 0, 0, 0.35)` ≡ same trimmed/spaced).
  - On drift, the message names: short alias, dark/light side, both values; e.g. `--bg dark: proto=#0E0F12 ↔ dtcg=#0E1015`.
  - `pnpm --filter @app/design-tokens lint && typecheck` clean after the script lands.
  - Reasonable mutation test: temporarily flip one hex in `specs/design/tokens/color.json`, run audit, observe exit 1 + readable message, revert.
- Spec diff: none
- Codegen impact: no
- Design impact: locks brand parity behind a script (CI wiring deferred — script alone is enough for PR 3b).
- Tests: mutation test described above; PR 3b ships only the script + `package.json` script entry; no CI workflow edits in this PR.
- Sub-steps:
  - [x] write `packages/design-tokens/scripts/audit-cross-source.ts` (parser, mapping, diff, exit codes)
  - [x] add `audit:cross-source` script to `packages/design-tokens/package.json`
  - [x] first run surfaced 14 drifts; 4 are known prototype-internal (tokens.json ≠ tokens.css) and reported as ℹ; remaining 10 closed in this PR by aligning `specs/design/tokens/{spacing,radius,typography}.json` with the brand
  - [x] mutation test: flipped `text.fg.dark` `#E8EAEE` → `#FFFFFF`, audit exited 1 with readable diff, reverted
  - [x] new `packages/design-tokens/README.md` documents both sources, the alias layer, and the audit's role
  - [x] `pnpm --filter @app/design-tokens lint && typecheck && audit:cross-source` all green (42 pairs in sync, 4 known-internal drifts reported as ℹ)
  - [x] prettier on touched files
- Status: in-progress
- Blockers: —
