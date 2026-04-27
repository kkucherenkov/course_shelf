# @app/design-tokens

Single-step build pipeline that turns the design handout into the artefacts the
code-stack consumes (CSS, TypeScript, Dart).

## Source of truth

`docs/design/shared/tokens.json` — a single W3C DTCG document owned by the
design system. It contains:

- `_palette` — raw colour primitives (`neutral.0..950`, `warm.50..900`,
  `accent.{amber,teal,indigo}.50..700`, `semantic.*`). Designer reference and
  prototype preview only — **codegen does not consume this section**.
- `color.{brand,surface,border,text,status}` — themed semantic tokens (each leaf
  has a `light` / `dark` variant).
- `space`, `radius`, `shadow`, `motion`, `zIndex`, `opacity`, `typography` —
  W3C-DTCG-shaped values consumed by the build.

The companion file `docs/design/shared/tokens.css` is hand-maintained CSS used
only by the JSX prototype HTML (`docs/design/index.html`). Its values track
this JSON; the code-stack does **not** load it.

## Pipeline

```
docs/design/shared/tokens.json
            │
            ▼  loadTokens()
       src/build.ts
            │
            ▼  emit-{scss,typescript,dart}.ts
   apps/web/app/assets/css/tokens.generated.css
   apps/web/app/design-tokens.generated.ts
   packages/ui/src/tokens.generated.css
   packages/ui/src/design-tokens.generated.ts
   packages/ui_flutter/lib/src/theme/tokens.g.dart
```

All five generated files are committed — never edit them by hand. Run
`pnpm design:build` after changing any token in `tokens.json`.

`emit-scss.ts` adds an alias section that re-exports prototype short-names
(`--bg`, `--surface`, `--primary`, `--shadow-1`, …) as `var()` references to
the DTCG long-names (`--surface-page`, `--surface-surface`, `--brand-accent`,
`--shadow-xs`, …). Components lifted from a JSX prototype keep working under
code-stack tokens unchanged.

## Scripts

```sh
pnpm --filter @app/design-tokens build              # regenerate all artefacts
pnpm --filter @app/design-tokens audit:inventory    # find token use across the repo
pnpm --filter @app/design-tokens lint
pnpm --filter @app/design-tokens typecheck
```
