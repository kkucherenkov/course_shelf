# Active tasks

## T-2026-04-27-033 — Web SPA bootstrap closeout (E11-F01-S01)

- Created: 2026-04-27
- Owner: claude
- Spec: `docs/roadmap/tasks/E11-F01-S01.md`. The Nuxt 4 SPA was already scaffolded (Nuxt UI v4, Tailwind 4 via `@tailwindcss/vite`, `@nuxtjs/i18n`, tokens.generated.css piped through `@theme inline`, runtime `apiBaseUrl` env). Two acceptance items remain: dark theme as default, and the `/__tokens` foundations canvas page.
- Goal: tick all five sub-steps with truth and ship the missing foundations canvas so future component work can verify token rendering in the browser.
- Acceptance:
  - Dark theme is the default — add `colorMode: { preference: 'dark', fallback: 'dark' }` to `nuxt.config.ts` so first-time visitors land on dark and `useColorMode().preference === 'dark'` until toggled.
  - `pages/__tokens.vue` renders every token category from `app/design-tokens.generated.ts`:
    - **Color** — for each of `brand`, `surface`, `text`, `border`, `state` (whatever exists), render swatches with the resolved hex/rgba and the CSS custom property name (`--surface-page`, etc.). Show light + dark variants side by side where the source has them.
    - **Spacing** — visual ruler (rectangle of width `var(--space-N)`) plus the px value.
    - **Radius** — square with the `border-radius` applied plus the px value.
    - **Typography** — for each `--role-*` group (display, h-1, h-2, h-3, h-4, body, small, meta, label), render a one-line specimen using `font-size`/`font-weight`/`letter-spacing`/`line-height` from the token + the variable name.
    - **Duration / easing** — list raw values (animations are out of scope here).
    - **Opacity** — small overlay swatches.
  - Page is developer-only — no i18n. Plain English labels are fine.
  - Page must render in both light and dark themes (use Nuxt UI's `<UButton>` color-mode toggle in the header for quick verification).
  - Existing `pages/index.vue` and `pages/login.vue` keep working.
- Spec diff: none.
- Codegen impact: no.
- Design impact: yes — the foundations canvas is the visible output of the design-tokens pipeline.
- Tests:
  - Component-mount test for `pages/__tokens.vue` — asserts at least one swatch from each category is present in the DOM.
- Sub-steps:
  - [ ] T-033-A: dark default + colorMode block in `nuxt.config.ts`
  - [ ] T-033-B: `pages/__tokens.vue` foundations canvas
  - [ ] T-033-C: component test for the page
  - [ ] T-033-D: lint, typecheck, test, prettier; flip card; archive T-033
- Status: in-progress
- Blockers: —
