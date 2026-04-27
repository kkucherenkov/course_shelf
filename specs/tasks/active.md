# Active tasks

## T-2026-04-27-037 — Form primitives (E13-F01-S03)

- Created: 2026-04-27
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F01-S03.md`. Existing `AppField`/`AppInput`/`AppSelect`/`AppSwitch` are scaffolded but the card asks for 7 named components; `AppTextField`, `AppNumberField`, `AppSearchField`, `AppCheckbox`, `AppRadio` don't exist; `AppInput` heights use `var(--space-20)` (a non-existent token) so heights are unset; `AppField` references `--status-danger` (also non-existent — should be `--status-error-fg`). No `[data-density="compact"]` switch anywhere.
- Goal: ship the 7-control set, all sharing the `.field` wrapper, all matching the bundle's exact heights / paddings / focus rings / error styles, with a working compact-density mode.
- Acceptance:
  - **Add** `AppTextField`, `AppNumberField`, `AppSearchField` — composite components wrapping `AppField` + `AppInput` (with `type="text"|"number"|"search"`). `AppNumberField` adds optional `:min/:max/:step` and `+`/`−` stepper buttons; `AppSearchField` adds a leading `IconCS name="search"` and a trailing clear (`x`) button visible only when there's a value.
  - **Add** `AppCheckbox` — single checkbox with `label` prop (or `<label>` slot), `:modelValue: boolean`, `:indeterminate: boolean` (sets `aria-checked="mixed"` + visual state), `:disabled`, full keyboard support (Space toggles).
  - **Add** `AppRadio` and `AppRadioGroup` — radio button family. `AppRadioGroup` owns the `name` + `:modelValue: T`; renders as `role="radiogroup"`. `AppRadio` is a child option with `:value: T`, `label`/slot, optional `:disabled`. Arrow-key navigation moves between radios.
  - **Audit & fix** `AppInput`: replace broken `var(--space-20)` heights with explicit pixel values matching the bundle (`sm: 28px`, `md: 36px`, `lg: 44px`); add `[data-density="compact"]` ancestor selector to drop md to 30px (matches `.input` in `tokens.css`).
  - **Audit & fix** `AppField`: replace `--status-danger` with the actually-shipped `--status-error-fg` (or whichever exists in `tokens.generated.css`).
  - **Audit & fix** `AppSelect` and `AppSwitch`: confirm they accept `AppField` slot attrs (id, aria-describedby, aria-invalid, aria-required) and propagate them correctly; align heights with the same density rules; document any deviations.
  - States in stories per control: Empty, Filled, Focused, Error, Disabled (`AppRadioGroup` adds Multiple options + arrow-key nav demo).
  - A11y: `aria-invalid` on errored controls; `aria-describedby` linking to help/error text; `aria-required` propagated; the radio group exposes `role="radiogroup"` with `aria-labelledby` if the group has a label; checkbox `aria-checked="mixed"` for indeterminate.
  - All new components exported from `packages/ui/src/index.ts`.
- Spec diff: none.
- Codegen impact: no.
- Design impact: yes.
- Tests: vitest spec per new component (mount + a11y attribute assertions + interaction simulation where applicable: keyboard space on checkbox, arrow keys on radio group, `+`/`−` clicks on number field, clear button on search). Storybook stories per component covering the 5 mandated states.
- Sub-steps:
  - [ ] T-037-A: fix `AppInput` heights + `[data-density="compact"]`; fix `AppField` error token; audit AppSelect/AppSwitch alignments
  - [ ] T-037-B: `AppCheckbox` + spec + story
  - [ ] T-037-C: `AppRadio` + `AppRadioGroup` + spec + story
  - [ ] T-037-D: `AppTextField`/`AppNumberField`/`AppSearchField` composites + specs + stories
  - [ ] T-037-E: barrel exports + lint, typecheck, test, prettier; flip card; archive T-037
- Status: in-progress
- Blockers: —
