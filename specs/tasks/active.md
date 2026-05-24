# Active tasks

## T-2026-05-24-009 — Replace the undefined `--text-fg-muted` token app-wide

- Created: 2026-05-24
- Owner: claude
- Spec: `.impeccable/critique/2026-05-24T15-41-07Z__apps-web-app-pages-browse-vue.md` (re-critique P2, 36/40)
- Goal: "muted" text renders muted — no references to a token that resolves to nothing.
- Acceptance:
  - no `var(--text-fg-muted)` remains in the codebase (it was defined nowhere)
  - the Tailwind `--color-fg-muted` theme mapping resolves to a real token
- Spec diff: none
- Codegen impact: no
- Design impact: CSS value swap only (`--text-fg-muted` → `--text-secondary`) across ~15 sites
- Tests: none (CSS value); existing suites must stay green
- Notes: sibling `--text-fg-subtle` is the same undefined-token bug (~11 sites) but should map to `--text-tertiary`, not `--text-secondary` — left as a follow-up to keep this scope clean. Re-critique minors deferred: sort "duration" (backend-blocked — not in the OpenAPI `sort` enum), chip radiogroup semantics (needs an AppChip radio mode or AppSegmented, which would overflow with 4 wide labels on mobile).
- Sub-steps:
  - [x] sweep `var(--text-fg-muted)` → `var(--text-secondary)` (incl. the `@theme` mappings)
  - [x] lint/format/tests (eslint clean; @app/ui 848 green; prettier applied)
- Status: in-progress (awaiting commit/PR)
- Blockers: —
