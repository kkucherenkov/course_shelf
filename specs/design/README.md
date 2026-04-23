# Design System — Tokens & Component Inventory

## Token pipeline

Source of truth: `specs/design/tokens/*.json` (W3C DTCG format).

```
specs/design/tokens/*.json
        │
        ▼  pnpm design:build  (@app/design-tokens)
        ├── apps/web/app/assets/css/tokens.generated.css
        ├── packages/ui/src/tokens.generated.css          (Storybook)
        ├── apps/web/app/design-tokens.generated.ts
        ├── packages/ui/src/design-tokens.generated.ts    (Storybook)
        └── packages/ui_flutter/lib/src/theme/tokens.g.dart
```

All generated files are committed — never edit them by hand. Run
`pnpm design:build` after changing any token JSON.

## Preparing a design in Claude for this repo

If you're using **claude.ai / Claude Design** to draft the UI before coding,
ask Claude to emit artefacts that drop straight into this repo — no manual
reformatting. Use the prompt below as a starting brief; fill in the bracketed
parts for your project.

<details>
<summary>Copy-paste brief for Claude Design</summary>

```
I'm designing the UI for [PRODUCT] in a greenfield repo that expects two
kinds of design artefacts. Please produce both so they drop into the repo
with no manual reformatting.

### 1. Token JSON (W3C DTCG format)

Output one JSON file per category, matching this layout exactly:

- color.json       — brand (accent/accentHover/accentActive/accentFg/accentSubtle),
                     surface (page/surface/raised/overlay), border (default/muted/strong),
                     text (fg/muted/subtle/inverse), status (success/warning/danger/info),
                     each as { light: {...}, dark: {...} }
- typography.json  — font families, weights, sizes, tracking, leading, text roles
                     (displayLg, headlineMd, titleSm, body, caption, …)
- spacing.json     — 4 px grid scale (space.0 … space.24)
- radius.json      — sm / md / lg / xl / full
- shadow.json      — elevation presets, light + dark variants
- motion.json      — duration (fast/base/slow), easing (standard/decelerate/accelerate),
                     lift, z-index scale
- opacity.json     — muted / subtle / disabled / scrim

Token shape:
  { "$value": "...", "$type": "color" | "dimension" | "duration" | ... }
Themeable tokens wrap values:
  { "light": { "$value": "#…", "$type": "color" }, "dark": { "$value": "#…", "$type": "color" } }

Every colour MUST have both light and dark values. No hex literals outside
token JSON. No Tailwind class names in tokens.

### 2. JSX/TSX mockups — one file per screen

- File naming: kebab-case route — `home.tsx`, `sign-in.tsx`, `settings-profile.tsx`.
- Self-contained React components — no external imports besides React.
- Styling ONLY via CSS variables from the tokens:
    color      → var(--brand-accent), var(--text-fg), var(--surface-page), …
    spacing    → var(--space-4)
    radius     → var(--radius-md)
    shadow     → var(--shadow-md)
    motion     → var(--duration-base), var(--easing-standard)
  NO hex, NO px literals, NO Tailwind utility classes, NO inline style={{}}
  with raw values.
- Use BEM class names prefixed `app-<name>`: `.app-button`, `.app-button__icon`,
  `.app-button--block`. Match the component names in the inventory below.
- Include every state the screen needs: default / hover / focus-visible /
  active / disabled / loading / empty / error.
- Include both a light and a dark rendering of each screen (either two files
  or a `[data-theme='dark']` variant in the same file).

### Component inventory to use

Primitives: AppButton, AppBadge, AppChip, AppInput, AppSelect, AppSwitch,
AppTextarea, AppField, AppLabel, AppCard, AppIcon.
Compositions: page hero, pricing card, feature list, empty state, skeleton,
master card, service row.

If a new primitive is needed, name it `App<Name>` and add a one-line entry to
the inventory so it flows into the Storybook pipeline.

### Output format

Return a single zip-ready bundle with this structure:

  design-bundle/
    tokens/
      color.json
      typography.json
      spacing.json
      radius.json
      shadow.json
      motion.json
      opacity.json
    mockups/
      home.tsx
      sign-in.tsx
      …
    README.md    # list of screens, design decisions, open questions
```

</details>

### Loading the bundle into the repo

1. Unpack into `specs/design/`:
   - `tokens/*.json` → `specs/design/tokens/` (overwrite, keep filenames).
   - `mockups/*.tsx` → `specs/design/mockups/`.
   - `README.md` → `specs/design/mockups/README.md` (append to existing).
2. Regenerate artefacts:
   ```sh
   pnpm design:build
   ```
   This emits `tokens.generated.css`, `design-tokens.generated.ts`, and
   `tokens.g.dart`. Commit the generated files alongside the source.
3. Verify in Storybook (`pnpm storybook`) — every primitive should pick up
   the new palette without code changes. If a component still renders old
   colours, it's using a literal instead of a token — fix the component, not
   the token.
4. For each new screen, push a task to `specs/tasks/active.md` using the
   template at `specs/tasks/templates/feature.md`.

### If the design doesn't match the expected shape

Don't patch JSON by hand. Go back to Claude Design with the specific gap
("tokens/shadow.json is missing the dark variants", "mockups use raw hex in
the footer") and ask for a corrected bundle. The prompt above is the
contract — any drift from it should be fixed at the source.

## Extracting tokens from design files

1. Export the Figma / Penpot tokens plugin output as JSON.
2. Map each token to the correct file:
   - `color.json` — semantic colour roles (brand, surface, border, text, status)
   - `typography.json` — font families, weights, sizes, tracking, leading, text roles
   - `spacing.json` — spacing scale (4 px grid)
   - `radius.json` — border-radius scale
   - `shadow.json` — box-shadow presets (light + dark variants)
   - `motion.json` — duration, easing, lift, z-index
   - `opacity.json` — opacity presets
3. All values use the DTCG `{ "$value": ..., "$type": ... }` shape.
   Themeable tokens use `{ "light": {...}, "dark": {...} }`.
4. Run `pnpm design:build` and commit the generated artefacts.

## Component inventory

| Category | Component       | Vue (`@app/ui`) | Flutter (`app_ui`) |
| -------- | --------------- | --------------- | ------------------ |
| Feedback | `AppBadge`      | ✓               | —                  |
| Forms    | `AppButton`     | ✓               | —                  |
| Surface  | `AppCard`       | ✓               | —                  |
| Feedback | `AppChip`       | ✓               | —                  |
| Forms    | `AppField`      | ✓               | —                  |
| Media    | `AppIcon`       | ✓               | —                  |
| Forms    | `AppInput`      | ✓               | —                  |
| Forms    | `AppLabel`      | ✓               | —                  |
| Forms    | `AppSelect`     | ✓               | —                  |
| Forms    | `AppSwitch`     | ✓               | —                  |
| Forms    | `AppTextarea`   | ✓               | —                  |

> The `pnpm design:audit` script cross-checks this table against the actual
> component folders. Run it before shipping new components.
