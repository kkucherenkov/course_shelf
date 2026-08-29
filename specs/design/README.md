# Design System — Tokens & Component Inventory

## Token pipeline

Source of truth: `docs/design/shared/tokens.json` (W3C DTCG format) — owned by
the design system.

```
docs/design/shared/tokens.json
        │
        ▼  pnpm design:build  (@app/design-tokens)
        ├── apps/web/app/assets/css/tokens.generated.css
        ├── packages/ui/src/tokens.generated.css          (Storybook)
        ├── apps/web/app/design-tokens.generated.ts
        ├── packages/ui/src/design-tokens.generated.ts    (Storybook)
        └── packages/ui_flutter/lib/src/theme/tokens.g.dart
```

All generated files are committed — never edit them by hand. Run
`pnpm design:build` after changing any token in `tokens.json`.

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

### 1. Token JSON (W3C DTCG format) — single file

Output **one** JSON file at `docs/design/shared/tokens.json` with these
top-level groups:

- `color.{brand,surface,border,text,status}` — semantic tokens, each leaf
  themed as `{ light: {...}, dark: {...} }`. Brand keys: `accent`,
  `accentHover`, `accentActive`, `accentFg`, `accentSubtle`, `accentSoft`.
- `typography.{font.{family,weight,size,tracking,leading},role}` — font
  scales + role aliases (`display`, `h1..h4`, `body`, `small`, `meta`,
  `label`, `code`).
- `space` — 4 px grid scale (`0..9` = 0/4/8/12/16/24/32/48/64/96 px).
- `radius` — `none`, `sm`, `md`, `lg`, `pill`.
- `shadow` — elevation presets, themed light + dark.
- `motion.{duration,easing,lift}` + `zIndex`.
- `opacity` — `disabled`, `muted`, `overlay`, `scrim`, `dangerHover`.
- `_palette` *(optional)* — raw colour primitives (`neutral`, `warm`,
  `accent.{amber,teal,indigo}`, `semantic`) — designer reference; ignored
  by codegen.

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

### Component inventory

Every component in `@app/ui` (Vue) and `app_ui` (Flutter), with the platforms
that actually have it. **Generated facts, not aspirations** — `pnpm design:audit`
fails when a mark here disagrees with the code, so a `—` means the component is
genuinely absent on that platform, not that nobody updated the row.

The Vue set is the folders under `packages/ui/src/components/`. The Flutter set
is every non-private widget class exported from `packages/ui_flutter/lib/app_ui.dart`
— that package groups several widgets per directory, so its folder names are not
component names.

| Category   | Component             | Vue (`@app/ui`) | Flutter (`app_ui`) |
| ---------- | --------------------- | --------------- | ------------------ |
| Auth       | `AppSsoBlock`         | ✓               | ✓                  |
| Catalog    | `AppDownloadRow`      | —               | ✓                  |
| Catalog    | `AppLessonRow`        | ✓               | ✓                  |
| Catalog    | `AppSectionHeader`    | ✓               | ✓                  |
| Catalog    | `CourseCard`          | ✓               | —                  |
| Catalog    | `CourseCompactRow`    | —               | ✓                  |
| Catalog    | `CourseCoverBackdrop` | —               | ✓                  |
| Catalog    | `CoursePosterCard`    | —               | ✓                  |
| Catalog    | `CourseProgressStrip` | —               | ✓                  |
| Catalog    | `CourseWideCard`      | —               | ✓                  |
| Feedback   | `AppAlert`            | ✓               | ✓                  |
| Feedback   | `AppBadge`            | ✓               | ✓                  |
| Feedback   | `AppBanner`           | ✓               | ✓                  |
| Feedback   | `AppChip`             | ✓               | ✓                  |
| Feedback   | `AppEmptyState`       | ✓               | ✓                  |
| Feedback   | `AppErrorState`       | ✓               | ✓                  |
| Feedback   | `AppNoPermission`     | ✓               | ✓                  |
| Feedback   | `AppProgressBadge`    | ✓               | ✓                  |
| Feedback   | `AppProgressCircle`   | ✓               | ✓                  |
| Feedback   | `AppProgressLinear`   | ✓               | ✓                  |
| Feedback   | `AppSkeleton`         | ✓               | ✓                  |
| Feedback   | `AppSpinner`          | ✓               | ✓                  |
| Feedback   | `AppToast`            | ✓               | ✓                  |
| Feedback   | `ScanProgress`        | ✓               | —                  |
| Forms      | `AppButton`           | ✓               | ✓                  |
| Forms      | `AppButtonSpinner`    | —               | ✓                  |
| Forms      | `AppCheckbox`         | ✓               | ✓                  |
| Forms      | `AppField`            | ✓               | —                  |
| Forms      | `AppFieldBox`         | —               | ✓                  |
| Forms      | `AppFieldFrame`       | —               | ✓                  |
| Forms      | `AppIconButton`       | ✓               | ✓                  |
| Forms      | `AppInput`            | ✓               | —                  |
| Forms      | `AppLabel`            | ✓               | —                  |
| Forms      | `AppNumberField`      | ✓               | ✓                  |
| Forms      | `AppPasswordField`    | ✓               | ✓                  |
| Forms      | `AppRadio`            | ✓               | ✓                  |
| Forms      | `AppRadioGroup`       | ✓               | ✓                  |
| Forms      | `AppSearchField`      | ✓               | ✓                  |
| Forms      | `AppSelect`           | ✓               | ✓                  |
| Forms      | `AppSwitch`           | ✓               | ✓                  |
| Forms      | `AppTextField`        | ✓               | ✓                  |
| Forms      | `AppTextarea`         | ✓               | ✓                  |
| Learning   | `AppBookmark`         | ✓               | ✓                  |
| Learning   | `AppBookmarkAdd`      | ✓               | ✓                  |
| Learning   | `AppBookmarkList`     | ✓               | ✓                  |
| Learning   | `AppNoteEditor`       | ✓               | ✓                  |
| Media      | `AppAvatar`           | ✓               | ✓                  |
| Media      | `AppIcon`             | ✓               | —                  |
| Media      | `IconCS`              | ✓               | ✓                  |
| Navigation | `AppNavigationShell`  | ✓               | ✓                  |
| Navigation | `AppSegmentedItem`    | ✓               | —                  |
| Navigation | `AppTab`              | ✓               | —                  |
| Overlay    | `AppBottomSheet`      | —               | ✓                  |
| Overlay    | `AppCommandPalette`   | ✓               | —                  |
| Overlay    | `AppDialog`           | ✓               | ✓                  |
| Player     | `AppPlayerChrome`     | ✓               | ✓                  |
| Player     | `AppPlayerScrubber`   | —               | ✓                  |
| Surface    | `AppCard`             | ✓               | ✓                  |
| Surface    | `AppRow`              | ✓               | ✓                  |
| Surface    | `AppSegmented`        | ✓               | ✓                  |
| Surface    | `AppTabs`             | ✓               | ✓                  |

> `pnpm design:audit` cross-checks this table against the code and runs
> `--strict` in CI, so a new component without a row here fails the build. Add
> the row in the same PR as the component.
```
