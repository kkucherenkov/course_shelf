# CourseShelf Design Bundle

This directory is the canonical handoff bundle from Claude Design. Every
project lives in its own slug-keyed folder containing the JSX prototype,
its bootstrap HTML, and any project-local CSS. Cross-cutting concerns
(tokens, icons, auth shells) live under [`shared/`](./shared/), and the
design brief that drove all 16 projects is preserved at
[`DESIGN_BRIEF.md`](./DESIGN_BRIEF.md).

The code-stack uses this bundle as a **visual reference**, not as
import-time source: the JSX prototypes do not get bundled into
`apps/web` — they document state matrices, layout, copy, and token
usage. When a Storybook story or a Nuxt page is implemented, the
corresponding prototype is the spec.

The two cousins of `tokens.json` — `docs/design/shared/tokens.json`
(palette, prototype-only) and `specs/design/tokens/*.json` (DTCG
semantic, code-stack) — are kept in lock-step by
[`pnpm --filter @app/design-tokens audit:cross-source`](../../packages/design-tokens/README.md#cross-source-audit).

## Project index

| Slug                                                       | Status     | Consumed by                             | Files                                     |
| ---------------------------------------------------------- | ---------- | --------------------------------------- | ----------------------------------------- |
| [`shared`](./shared)                                       | ✅ landed  | foundation for every other project      | tokens, icons, auth, shell, util          |
| [`cs-foundation`](./cs-foundation)                         | ✅ landed  | E03-F01-S02, E12-F01-S01, E13-F01-\*    | `app.jsx`, `index.html`, CSS              |
| [`cs-components`](./cs-components)                         | ✅ landed  | E13-F02-\*, E17-F02-\*                  | `app.jsx`, `components.jsx`, CSS          |
| [`cs-web-home`](./cs-web-home)                             | ✅ landed  | E14-F01-S01                             | `app.jsx`, `index.html`                   |
| [`cs-web-browse-search`](./cs-web-browse-search)           | ✅ landed  | E14-F01-S02 (Stage B)                   | `app.jsx`, `components.jsx`, CSS          |
| [`cs-web-course-detail`](./cs-web-course-detail)           | ✅ landed  | E14-F01-S03                             | `app.jsx`, `index.html`                   |
| [`cs-web-auth`](./cs-web-auth)                             | ✅ landed  | E14-F02-S01                             | `app.jsx`, `index.html`                   |
| [`cs-web-settings`](./cs-web-settings)                     | ✅ landed  | E14-F02-S02 (Stage B)                   | `app.jsx`, `components.jsx`, CSS          |
| [`cs-web-lesson-player`](./cs-web-lesson-player)           | ✅ landed  | E14-F03-S01                             | `app.jsx`, `index.html`                   |
| [`cs-web-admin`](./cs-web-admin)                           | ✅ landed  | E14-F04-S01 (Stage B)                   | `app.jsx`, `screens.jsx`, components, CSS |
| [`cs-mobile-auth`](./cs-mobile-auth)                       | ✅ landed  | E18-F03-S01                             | `app.jsx`, `index.html`                   |
| [`cs-mobile-home`](./cs-mobile-home)                       | ✅ landed  | E18-F01-S01                             | `app.jsx`, `index.html`                   |
| [`cs-mobile-browse`](./cs-mobile-browse)                   | ⏳ partial | E18-F01-S02 (Stage B) — needs `app.jsx` | `index.html`, `styles.css`                |
| [`cs-mobile-course-detail`](./cs-mobile-course-detail)     | ⏳ pending | E18-F01-S03 (Stage B)                   | _missing_                                 |
| [`cs-mobile-lesson-player`](./cs-mobile-lesson-player)     | ✅ landed  | E18-F02-S01                             | `app.jsx`, `index.html`                   |
| [`cs-mobile-downloads`](./cs-mobile-downloads)             | ⏳ pending | E19-F01-S03 (Stage B)                   | _missing_                                 |
| [`cs-mobile-search-settings`](./cs-mobile-search-settings) | ⏳ pending | E18-F03-S02 (Stage B)                   | _missing_                                 |

> **Note on `cs-foundation`.** The folder is `cs-foundation` (singular)
> in the bundle even though `DESIGN_BRIEF.md §4` refers to it as
> `cs-foundations`. Treat the singular spelling as the canonical slug
> until the bundle is re-cut; story cards reference the actual folder.

## Authoring conventions

Each Claude Design project ships:

- `app.jsx` — the React/JSX prototype mounted into `index.html` via Babel
  Standalone (`type="text/babel"`).
- `index.html` — the bootstrap that loads `shared/tokens.css` plus any
  per-project CSS, then the `app.jsx`.
- `styles.css` (optional) — per-project styles that complement
  `shared/tokens.css`. Tokens are always CSS custom properties — no
  hard-coded hex outside of `shared/tokens.json`.
- `components.jsx` (optional) — large projects extract their domain
  components into a sibling file so `app.jsx` stays focused on layout.
- `screens.jsx` (optional, admin) — same idea for multi-screen flows.

`shared/` carries the design system primitives every project depends on:

- `tokens.json` — Style-Dictionary v3 schema. **Source of truth for the
  prototype.**
- `tokens.css` — generated CSS the JSX prototypes load directly. Lags
  `tokens.json` for the four pairs documented in
  [`packages/design-tokens/scripts/audit-cross-source.ts`](../../packages/design-tokens/scripts/audit-cross-source.ts);
  the code-stack tracks the CSS values.
- `icons.jsx` — 61 inline SVG icons used everywhere.
- `auth.{css,jsx}` — shared auth-screen scaffold.
- `shell.jsx` — top-bar / sidebar shell used by web projects.
- `util.jsx` — small helpers (`<Icon>`, `fmtTime`, etc.).

## Handoff into code

When a UI story is implemented:

1. Open the corresponding `cs-*/app.jsx` to read the state matrix, copy,
   and token usage.
2. Implement the equivalent in `apps/web` (Vue + Nuxt UI v4 + Tailwind 4)
   or `apps/mobile` (Flutter + flutter_bloc) using the same DTCG tokens
   exposed via `@app/design-tokens` (CSS vars short-name aliases match
   the prototype's `--bg`, `--surface`, `--primary`, etc.).
3. Add a Storybook story per visual state (`packages/ui`) or a Widgetbook
   use case (`packages/ui_flutter`).
4. Reference the bundle path in the PR description so reviewers can
   compare side-by-side.

The seven Stage-B stories in the roadmap (`E14-F01-S02`, `E14-F02-S02`,
`E14-F04-S01`, `E18-F01-S02`, `E18-F01-S03`, `E18-F03-S02`,
`E19-F01-S03`) require their bundle to be present before code work can
start; the `Status` column above tracks whether the prerequisite has
landed.
