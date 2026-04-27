# Active tasks

## T-2026-04-27-035 — IconCS — port the bundle's 61-icon family to Vue (E13-F01-S01)

- Created: 2026-04-27
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F01-S01.md`. Source: `docs/design/shared/icons.jsx` (502-line JSX switch over 61 named glyphs).
- Goal: a single `<IconCS name="play" :size="16" fill />` Vue component renders any of the 61 hand-drawn CourseShelf glyphs. Path data identical to the JSX source. Typed `name` prop as a literal union. Storybook grid showing all 61. Snapshot per icon. A11y: `aria-hidden` by default, `role="img"` + `aria-label` when a `title` is given.
- Acceptance:
  - `packages/ui/src/components/IconCS/IconCS.vue` — renders `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none">` then a `<template v-if name === '...'>` (or render-function switch) for each glyph. Path `d` strings copied verbatim from `icons.jsx`.
  - `name` prop typed as `IconName` literal union exported alongside the component.
  - `size` prop accepts `number` (px) — defaults to `20` matching the source.
  - `fill` prop is a boolean. Only `play` and `bookmark` glyphs honour it (the card's acceptance list); the source JSX has additional fill behaviour we should preserve verbatim.
  - `title` prop optional `string`. When set, the SVG renders `role="img"` + `aria-label="<title>"` and an inner `<title>{{ title }}</title>` for tooltip support; when absent, `aria-hidden="true"`.
  - Component exported from `packages/ui/src/index.ts` alongside `IconName`.
  - Storybook story `IconCS.stories.ts` with: a default render of one icon, plus a "Grid" story showing all 61 icons in a 8-column grid with their names below each.
  - Vitest snapshot per name (61 cases) + a11y test asserting `aria-hidden` default vs `role="img"` + `aria-label` when `title` is set.
- Spec diff: none.
- Codegen impact: no.
- Design impact: yes — first brand-specific icon set landed in `@app/ui`.
- Tests: snapshot per icon (61) + 2 a11y cases.
- Sub-steps:
  - [ ] T-035-A: `IconCS.vue` + `IconName` type + `index.ts` barrel; verbatim path data from `icons.jsx`
  - [ ] T-035-B: Storybook stories (default + grid)
  - [ ] T-035-C: snapshot tests + a11y tests
  - [ ] T-035-D: barrel export from `packages/ui/src/index.ts`
  - [ ] T-035-E: lint, typecheck, test, prettier; flip card; archive T-035
- Status: in-progress
- Blockers: —
