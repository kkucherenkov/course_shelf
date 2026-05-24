# Active tasks

## T-2026-05-24-010 — `--text-fg-subtle` token sweep + Settings P3 polish

- Created: 2026-05-24
- Owner: claude
- Spec: `.impeccable/critique/2026-05-24T16-10-37Z__apps-web-app-pages-settings-vue.md` (Settings re-critique, 31 → 38) + the `--text-fg-subtle` follow-up flagged in #217
- Goal: kill the second undefined-token bug app-wide and clear the Settings P3 polish.
- Acceptance:
  - no `var(--text-fg-subtle)` remains (it was emitted nowhere); subtle text resolves to `--text-tertiary`
  - the completion-threshold slider announces a percentage to screen readers
  - a wide segmented picker scrolls rather than overflowing on a narrow viewport
- Spec diff: none
- Codegen impact: no
- Design impact: CSS value swap (`--text-fg-subtle` → `--text-tertiary`) + `settings.vue` a11y
- Tests: none new (CSS/aria); existing suites stay green
- Notes: kept the disabled "coming soon" controls (avatar/email/delete) as disabled-with-cue rather than hiding — communicates the roadmap and is honest. Settings re-critique left no P0/P1/P2.
- Sub-steps:
  - [x] sweep `var(--text-fg-subtle)` → `var(--text-tertiary)` (incl. the `@theme` mappings)
  - [x] `settings.vue`: slider `aria-valuetext`; segmented overflow guard
  - [x] lint/format/tests (eslint clean; @app/ui 848 green; prettier applied)
- Status: in-progress (awaiting commit/PR)
- Blockers: —
