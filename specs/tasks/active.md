# Active tasks

## T-2026-04-27-038 — AppCard size + hoverable (E13-F01-S04)

- Created: 2026-04-27
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F01-S04.md`. AppCard exists with header/body/footer + `interactive` button mode but uses `--radius-lg` and `var(--space-4) var(--space-6)` paddings — the bundle's `.card` is `--radius-md` + uniform `16px`, `.card-lg` is `--radius-lg` + uniform `24px`, `.card-hover` is hover-only (visual lift without focusability).
- Goal: align AppCard with the three bundle classes by adding two props.
- Acceptance:
  - `size: 'md' | 'lg'` (default `md`). `md` → `--radius-md` + uniform `16px` (`var(--space-4)`) padding on body/header/footer. `lg` → `--radius-lg` + uniform `24px` (`var(--space-5)`).
  - `hoverable: boolean` (default `false`). When true and `interactive` is false, applies a hover transition that shifts `border-color` to `--border-strong` and `background` to `--surface-raised` (the bundle's `.card-hover` palette using shipped tokens). Stays a `<div>`, no focus ring, no click emit.
  - `interactive` stays as-is. Adding `hoverable` to an already-`interactive` card is a no-op (interactive already has hover affordance via `box-shadow`).
  - Existing 13 tests stay green.
  - New tests: `size='lg'` renders the `app-card--lg` modifier; `hoverable` renders the modifier on a non-interactive root; `hoverable` is ignored when `interactive` is also true (no double-hover styling).
- Spec diff: none.
- Codegen impact: no.
- Design impact: yes.
- Sub-steps:
  - [ ] T-038-A: AppCard.vue prop additions + CSS adjustments
  - [ ] T-038-B: tests for size + hoverable
  - [ ] T-038-C: stories — `Default`, `Large`, `Hoverable`
  - [ ] T-038-D: lint, typecheck, test, prettier; flip card; archive T-038
- Status: in-progress
- Blockers: —
