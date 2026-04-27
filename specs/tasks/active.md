# Active tasks

## T-2026-04-27-039 — AppBanner / AppToast / AppAlert (E13-F01-S07)

- Created: 2026-04-27
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F01-S07.md`. Bundle CSS in `docs/design/shared/tokens.css` ships `.banner` (4 variants), `.toast` (compact with dot indicator), and the implicit "inline alerts" follow-on. Backed by shipped tokens `--{success,warning,error,info}` + `--{success,warning,error,info}-soft`.
- Goal: three new components in `packages/ui` covering the bundle's notification surfaces.
- Acceptance:
  - **AppBanner** — `variant: 'info' | 'success' | 'warning' | 'error'` (default `info`), optional `title`, optional `dismissible: boolean` showing a close (`x`) button that emits `dismiss`. Markup: leading `IconCS` (info → `info`, success → `check-circle`, warning → `alert`, error → `alert`), then a column with `<strong>title</strong>` (if any) on top of the body slot/text, then optional dismiss `AppIconButton`. Default slot for body content; `body` prop as text shorthand.
  - **AppToast** — compact `variant: 'success' | 'info' | 'error'` + `message` text + optional `dismissible`. Markup: colored dot (8px circle filled with the variant color), then message, then optional dismiss button. Min-width 280px, drop-shadow, sized for `.toast` parity. Toast container/queue is out of scope — this is just the visual component.
  - **AppAlert** — single-line inline alert (smaller, no title support, sits inside form fields). Same 4 variants as AppBanner but with `var(--text-xs)` font and no top/bottom padding; meant for placement directly under form fields with `role="alert"`.
  - All three use only design tokens — no hard-coded colors.
  - A11y: AppBanner is `role="status"` (or `role="alert"` for `error`); AppToast is `role="status"` (`role="alert"` if `error`); AppAlert is always `role="alert"`. Dismiss button has `aria-label="Dismiss"` (overridable).
  - Stories per component cover the 4 variants (3 for AppToast) + dismissible variant + a "with title and body slot" variant for AppBanner.
- Spec diff: none.
- Codegen impact: no.
- Design impact: yes.
- Tests: vitest spec per component (mount + a11y attribute assertions + dismiss event emission).
- Sub-steps:
  - [ ] T-039-A: AppBanner + spec + stories
  - [ ] T-039-B: AppToast + spec + stories
  - [ ] T-039-C: AppAlert + spec + stories
  - [ ] T-039-D: barrel exports; lint, typecheck, test, prettier; flip card; archive T-039
- Status: in-progress
- Blockers: —
