# Active tasks

## T-2026-04-27-036 — AppButton + AppIconButton (E13-F01-S02)

- Created: 2026-04-27
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F01-S02.md`. The existing `AppButton` carries a richer-but-different prop axis (`variant: solid|outline|ghost|link` × `color: primary|neutral|success|warning|error`) than the design bundle's contract. The bundle CSS in `docs/design/shared/tokens.css` declares `.btn-primary | .btn-secondary | .btn-ghost | .btn-destructive` (flat variant) and `[data-loading="true"]` for the loading state. Plus there is no `AppIconButton` yet.
- Goal: bring `AppButton` to design parity (4-value flat variant matching `.btn-*`, `data-loading` attribute, IconCS for icons), and add the missing square `AppIconButton`.
- Acceptance:
  - `AppButton` prop axis collapsed to `variant: 'primary' | 'secondary' | 'ghost' | 'destructive'` (default `primary`). Drop the `color` prop. Keep `size`, `loading`, `disabled`, `block`, `type`, `iconLeading`, `iconTrailing` (typed as `IconName` from `@app/ui`).
  - Loading state surfaces as `data-loading="true"` on the `<button>` element so the bundle CSS contract is preserved. Internal CSS uses `&[data-loading='true']` selectors. Remove the `app-button--loading` class (or keep it for backward compat — agent's call).
  - Icon support uses `IconCS` (from E13-F01-S01); `iconLeading` / `iconTrailing` props accept `IconName` literals instead of free strings. Icon size comes from button size (sm → 16, md → 20, lg → 24).
  - New `AppIconButton` (square button): `width === height` per size — sm 28, md 36, lg 44; `name: IconName` required; `variant`/`size`/`loading`/`disabled` mirror AppButton; `aria-label` required (no slot/label since the icon has no text).
  - Stories cover the 6 states the card mentions: Default, Hover, Active, Focus (`:focus-visible`), Disabled, Loading. Plus a Variants story showing all four variants × three sizes for both AppButton and AppIconButton.
  - A11y: `aria-busy="true"` while loading; `aria-disabled` when disabled; loading state still keyboard-focusable but click handler short-circuits.
  - Single existing caller `apps/web/app/pages/login.vue` migrates to the new prop shape (`variant="primary"` instead of `variant="solid" color="primary"`).
- Spec diff: none.
- Codegen impact: no.
- Design impact: yes — both components replace the previous `solid/outline/ghost/link × primary/neutral/...` axis.
- Tests: keep existing `AppButton.spec.ts` passing post-refactor (update assertions for the new prop names); add a11y cases for `data-loading` + `aria-busy`. Add `AppIconButton.spec.ts` with mount + a11y assertions.
- Sub-steps:
  - [ ] T-036-A: refactor `AppButton.vue` to flat variant + `data-loading` + `IconCS`; update `AppButton.spec.ts` + stories
  - [ ] T-036-B: new `AppIconButton/AppIconButton.{vue,spec.ts,stories.ts,index.ts}` + barrel export
  - [ ] T-036-C: migrate `apps/web/app/pages/login.vue` to the new AppButton prop shape
  - [ ] T-036-D: lint, typecheck, test, prettier; flip card; archive T-036
- Status: in-progress
- Blockers: —
