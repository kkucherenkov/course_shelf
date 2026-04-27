# Design system

## Source hierarchy

**JSX source bundle > screen `.md` specs > implementation.**

1. **JSX mockups** — `specs/design/source-bundle/project/components/*.jsx` are the pixel-precise reference for every screen. If a `.md` spec contradicts the JSX, the JSX wins.
2. **Tokens** — `docs/design/shared/tokens.json` is the single source for color, typography, spacing, radius, shadow, motion, z-index. Every `.vue`, `.scss`, `.dart` references a token — never a literal hex / px / ms.
3. **Inventory** — `specs/design/README.md` lists every primitive, composition, and screen. Check it before building a new element.
4. **Roadmap** — `specs/roadmap.md` assigns every feature to a phase.

## Loading your design

See `specs/design/README.md` for how to load and extract design tokens from your project's design files. The README describes the expected token format, folder layout, and the Claude prompt to use for extracting tokens from a design source (Figma export, JSX mockup bundle, or other format).

## Design workflow

1. Brand change → edit `docs/design/shared/tokens.json`.
2. Regenerate artefacts: `pnpm design:build` in `packages/design-tokens`. Emits `tokens.generated.css`, `design-tokens.generated.ts`, `tokens.g.dart`.
3. Build/update `@app/ui` component: `packages/ui/src/components/<Name>/{Name.vue, Name.stories.ts, Name.spec.ts, index.ts}`.
4. Consume in `apps/web` / `apps/mobile`.

Never rename or remove a token without an ADR — breaking change for every consumer.

## All stateless UI belongs in `@app/ui`

Pages in `apps/web/app/pages/` are thin orchestrators: fetch data, pass props, handle routing. No ad-hoc markup past one `<section>` wrapping `@app/ui` compositions.

- **Primitives**: button, badge, chip, input, switch, progress, icon, card, avatar, banner, tab, tooltip, kbd, stars, divider, seg control.
- **Compositions**: page hero, price display, pricing card, feature list, empty state, skeleton, master card, service row — also in `@app/ui`.
- **Storybook-first is blocking**: no `apps/web` PR may introduce a new visual element not already in `@app/ui` with a story + spec.

## Foundation primitives are native SCSS (not Nuxt UI wrappers)

`AppButton`, `AppBadge`, `AppChip`, `AppInput`, `AppSwitch`, `AppProgress`, `AppCard`, … are **native Vue SFCs** with scoped SCSS on tokens. Do NOT wrap `UButton`, `UBadge`, `UInput`, etc.

Rules:

- Rendered DOM contains **only** our `app-<name>` BEM classes. No Tailwind utilities, no `data-slot`.
- Styling only through `var(--brand-*)`, `var(--surface-*)`, `var(--text-*)`, `var(--radius-*)`, `var(--space-*)`.
- **Zero direct Nuxt UI imports in `apps/web`** — `import { UButton }` from `#components` is a review blocker.

Nuxt UI is allowed for **behavior-heavy** primitives only: `UModal`, `USlideover`, `UDropdownMenu`, `UPopover`, `UTooltip`, `UCommandPalette`, `UTable`, `UCalendar`. These are always wrapped by an `@app/ui` component (`AppModal`, `AppDropdown`, …) — that wrapper is the only place the Nuxt UI symbol may be imported.

## SCSS + BEM conventions

```
packages/ui/src/components/<Name>/
  Name.vue           # <script>, <template>, <style lang="scss" scoped>
  Name.stories.ts
  Name.spec.ts
  index.ts
```

- Block: component, kebab-case, prefixed `app-`: `.app-button`.
- Element: `__name` → `.app-button__icon`.
- Modifier: `--mod` → `.app-button--block`.
- Nesting ≤3 levels. Use `&__el` / `&--mod`.
- No inline `style=""` with literal values. No `!important`. Tokens only.

## Token cascade

`tokens.generated.css` emits light-theme values under `:root, [data-theme='light']` so they resolve without an explicit attribute. `[data-theme='dark']` overrides. If a CSS variable is undefined in devtools, fix the emitter (`packages/design-tokens/src/emit-scss.ts`), not the page.

## Component parity checklist (blocking review)

- [ ] Storybook story covers every variant × light/dark.
- [ ] Colocated `*.spec.ts` with rendering + a11y smoke + variant tests.
- [ ] Keyboard nav + `:focus-visible` styled; `@storybook/addon-a11y` panel clean.
- [ ] No `useI18n()` inside the component — translated strings via props.
- [ ] SCSS scoped, BEM `app-<name>`, no `!important`, no inline `style=""` literals, nesting ≤3.
- [ ] No literal hex / px / ms / z-index — tokens only.
- [ ] Accepts `data-testid` passthrough.

## Hard bans (design)

- Private brand hex like `#F26A1F` — reference `color.brand.accent` instead.
- `@app/ui` component without story + spec.
- Wrap a Nuxt UI foundation primitive as `@app/ui`.
- Tailwind utilities (`bg-primary`, `hover:*`) in the DOM of an `@app/ui` foundation primitive.
- Ad-hoc markup in `apps/web` pages instead of extending `@app/ui`.
