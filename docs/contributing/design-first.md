# Design-first runbook

UI changes flow through three artefacts: a **Claude Design bundle** (the source of truth for layout + states), a **`@app/ui` component** (the brand-system primitive), and a **page composition** in `apps/web` (or `apps/mobile`). Skipping a step makes the design system inconsistent — a one-off Tailwind class in a page bypasses the catalog and rots.

This runbook walks through introducing a new screen end-to-end. Substitute `<my-screen>` for your own surface.

## TL;DR

```sh
# 1. Produce / receive the Claude Design bundle
ls docs/design/<my-screen>/    # app.jsx, components.jsx, screens.jsx, styles.css

# 2. Pull design tokens that are new (rare — most reuse existing tokens)
pnpm design:build

# 3. Catalog any net-new component into packages/ui (Storybook-first)
$EDITOR packages/ui/src/components/<NewComponent>/<NewComponent>.vue
$EDITOR packages/ui/src/components/<NewComponent>/<NewComponent>.stories.ts
$EDITOR packages/ui/src/components/<NewComponent>/<NewComponent>.spec.ts
$EDITOR packages/ui/src/components/<NewComponent>/index.ts
pnpm --filter @app/ui storybook            # eyeball at :6006

# 4. Compose the page
$EDITOR apps/web/app/pages/<my-screen>.vue

# 5. Tests + types + ship
pnpm --filter @app/web typecheck && pnpm --filter @app/web test
```

## Worked example: a new "Recent scans" admin sidebar block

### 1 — The design bundle

Bundles live under `docs/design/<area>/`. A bundle for a single screen contains:

| File             | What                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------- |
| `app.jsx`        | Top-level layout + global providers                                                   |
| `screens.jsx`    | One JSX function per screen state (default / loading / empty / error / no-permission) |
| `components.jsx` | Bundle-local primitives that haven't reached `@app/ui` yet                            |
| `styles.css`     | Bundle-scoped CSS — design tokens read from `var(--…)`                                |
| `index.html`     | `<script type="module" src="./app.jsx">` so designers can load it standalone          |

If you're producing a new bundle, follow the [DESIGN_BRIEF](../design/DESIGN_BRIEF.md) section index — each card in the roadmap (e.g. `cs-web-browse-search`) maps to one folder.

When you receive a bundle from design, **read all four files** before opening any code. Look for:

- **States**: every screen has at least default / loading / empty / error. The `screens.jsx` exports them as separate components.
- **Tokens vs raw values**: anything `var(--*)` belongs in your CSS. Anything still hex / px / spacing in the bundle should round-trip back to design — never hardcode it in `@app/ui` or pages.
- **Reusable components**: bundle-local components in `components.jsx` that show up across screens are the catalog candidates.

### 2 — Tokens

```sh
pnpm design:build
```

Reads `docs/design/shared/tokens.json` (single source of truth) and emits:

| Output                                         | Consumer                                     |
| ---------------------------------------------- | -------------------------------------------- |
| `packages/ui/src/tokens.generated.css`         | every `@app/ui` component                    |
| `packages/ui/src/design-tokens.generated.ts`   | `designTokens.color.brand.light.accent` etc. |
| `apps/web/app/assets/css/tokens.generated.css` | the SPA                                      |
| `apps/web/app/design-tokens.generated.ts`      | `/dev/foundations` canvas                    |
| `apps/mobile/lib/foundations/tokens.dart`      | Flutter                                      |

Generated tokens are **gitignored** — every CI job that lints or types code runs `pnpm design:build` first. Local rebuild is automatic via Turbo when you run a downstream task; force a rebuild only if you've just edited `tokens.json`.

If a token is missing for the new screen, add it to `tokens.json` and rerun `pnpm design:build`. If a token _value_ needs to change, that's a separate design discussion — the `pnpm design:audit` script reports drift.

### 3 — Catalog new components

Every visual or interactive primitive on the screen comes from `@app/ui`. If the bundle introduces something we don't have yet, add it Storybook-first.

Required files for every component folder (enforced by `pnpm --filter @app/ui audit:components`):

```
packages/ui/src/components/<Name>/
├── <Name>.vue              # the component
├── <Name>.stories.ts       # Storybook stories — at least default + each state
├── <Name>.spec.ts          # Vitest spec — props/slots/events/keyboard
└── index.ts                # public re-export
```

Then export from the package barrel:

```ts
// packages/ui/src/index.ts
export { default as RecentScansBlock } from './components/RecentScansBlock';
```

Compound children (e.g. `AppRadio` inside `AppRadioGroup`, `AppTab` inside `AppTabs`) are exempted from the standalone-stories rule — they're integration-tested through the parent. Add them to `COMPOUND_EXEMPTIONS` in `packages/ui/scripts/audit-components.ts`.

Storybook must show **every state** the design bundle defines. Open `:6006` and eyeball both light + dark themes; Storybook switches via the toolbar.

```sh
pnpm --filter @app/ui storybook       # local dev
pnpm --filter @app/ui test            # vitest specs
pnpm --filter @app/ui storybook:build # what CI runs
```

Component must satisfy:

- **No `!important`**, no inline `style=""`, no hex brand colors. Use design tokens (`var(--brand-accent)`) and BEM class names.
- **Props in / events out**, no router or store calls. Pages compose; primitives stay portable.
- **A11y**: keyboard nav, ARIA roles where applicable, focus-visible rings, reduced-motion respected. The Storybook test-runner runs axe (warn-only in CI for now; an error in dev).

#### Visual regression baselines

The `ui-storybook` CI job screenshots every story and diffs it against a PNG
baseline under `packages/ui/test/__snapshots__/`. **Capture baselines from
the CI runner, never from a developer machine** — font metrics differ
between macOS/Linux/Windows and a few-pixel size delta will fail every
story. To regenerate after intentional design changes (or after env drift):

1. Push your branch.
2. GitHub UI → **Actions** → "**Regenerate visual snapshots**" →
   _Run workflow_ → pick the branch (suite: `storybook`).
3. The workflow drops the existing PNGs, captures fresh ones inside the
   Linux runner, and pushes a `chore(ui): regenerate Storybook visual
snapshots from CI` commit back to the branch. CI re-runs and the
   `ui-storybook` job goes green.

`docker-entrypoint.sh`, fonts on the runner, headless Chromium version —
all of those are the contract. Don't try to capture locally and commit; CI
will reject the size deltas.

### 4 — Compose the page

Pages live in `apps/web/app/pages/`. They:

- import primitives from `@app/ui` (never `@nuxt/ui` directly — ESLint blocks it)
- fetch data via composables under `apps/web/app/composables/` that wrap `@app/api-client-ts`
- localise every user-visible string with `t('…')` (en + ru locale parity is gated by `pnpm check:i18n`)

```vue
<script setup lang="ts">
  import { RecentScansBlock } from '@app/ui';
  import { useRecentScans } from '~/composables/useRecentScans';

  const { data, pending, error } = useRecentScans(libraryId);
</script>

<template>
  <RecentScansBlock
    :loading="pending"
    :error="error"
    :items="data?.items ?? []"
    :heading="$t('admin.recentScans.heading')"
    :empty-label="$t('admin.recentScans.empty')"
  />
</template>
```

Map every state in the design bundle to a real branch — loading / empty / error / no-permission must each be reachable in the SPA. Playwright e2e specs in `tests/e2e/` typically cover the happy path; loading and error states get vitest coverage in the page or composable spec.

### 5 — Quality gates before you ship

```sh
pnpm --filter @app/ui audit:components   # story + spec parity
pnpm --filter @app/ui test               # vitest (specs)
pnpm --filter @app/ui storybook:build    # Storybook static for the test-runner
pnpm --filter @app/web typecheck
pnpm --filter @app/web test              # vitest (composables/pages)
pnpm check:i18n                          # locale key parity
pnpm format && pnpm stylelint:fix        # auto-fix before commit
```

The CI pipeline runs the same gates. If anything fails, fix the source — never widen ESLint rules or stylelint thresholds without a reason recorded inline.

## Before you merge — checklist

- [ ] Every state from the bundle is reachable in the SPA (or marked `<TODO>` in the page with a follow-up issue).
- [ ] No `<UButton>` / `<UInput>` etc. — only `@app/ui` primitives.
- [ ] Storybook stories cover every state.
- [ ] Spec tests cover the component's interactive contract.
- [ ] Tokens come from `var(--…)` or `designTokens.*` — no raw hex.
- [ ] `pnpm check:i18n` is green; ru.json + en.json have parity.
- [ ] PR title is a Conventional Commit (`feat(web): …` or `feat(ui): …`).
- [ ] `specs/tasks/active.md` entry moved to `specs/tasks/done.md` with the PR link.

## Pitfalls

- **Skipping `pnpm design:build` after `tokens.json` edits**: components compile against stale CSS variables; you'll see an unexpected fallback color in Storybook.
- **Putting business logic in `@app/ui`**: components must be portable (Nuxt, Storybook, mobile-web). If your component needs to call `useRoute()` or a Pinia store, it belongs in `apps/web/app/components/` instead.
- **Hex colors in CSS**: stylelint catches `#fff` and similar in `.scss` / `<style>` blocks — use `var(--surface-page)` or whichever token applies.
- **Writing the page first, the component second**: leads to one-off styles that never reach the catalog. Always catalog → page.

## Related

- [`spec-first.md`](./spec-first.md) — parallel runbook for backend / API changes.
- [`.claude/docs/design-system.md`](../../.claude/docs/design-system.md) — design system, tokens, BEM conventions.
- [`.claude/docs/i18n.md`](../../.claude/docs/i18n.md) — locale workflow.
- [`docs/design/DESIGN_BRIEF.md`](../design/DESIGN_BRIEF.md) — the section index every bundle maps to.
