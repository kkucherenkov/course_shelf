# @app/design-tokens

Single-step build pipeline that turns design-token JSON into the artefacts the
code-stack consumes (CSS, TypeScript, Dart). Two source files participate:

| Path                             | Role                                                                                                                                             | Owner     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| `specs/design/tokens/*.json`     | DTCG-shaped semantic tokens. **Source of truth** for the code-stack.                                                                             | dev team  |
| `docs/design/shared/tokens.json` | Style-Dictionary v3 schema. **Source of truth** for the JSX prototypes under `docs/design/`.                                                     | designers |
| `docs/design/shared/tokens.css`  | Generated CSS the JSX prototypes actually load. Mirrors `tokens.json`, but historically the CSS was hand-tuned and now sometimes leads the JSON. | designers |

The two `tokens.*` files coexist on purpose: prototype tooling expects palette
shape (`color.neutral.*`, `mode.dark.*`); the code-stack expects DTCG semantic
roles (`color.surface.page`, `color.text.fg`). Translation between the two
lives in the cross-source audit (see below) and the alias section of
`emit-scss.ts`.

## Pipeline

```
specs/design/tokens/{color,shadow,spacing,radius,typography,motion,opacity}.json
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

`emit-scss.ts` adds an alias section that re-exports prototype short-names
(`--bg`, `--surface`, `--primary`, `--shadow-1`, …) as `var()` references to
the DTCG long-names (`--surface-page`, `--surface-surface`, `--brand-accent`,
`--shadow-xs`, …). Any component lifted from a JSX prototype keeps working
under code-stack tokens unchanged.

## Scripts

```sh
pnpm --filter @app/design-tokens build              # regenerate all artefacts
pnpm --filter @app/design-tokens audit:inventory    # find token use across the repo
pnpm --filter @app/design-tokens audit:cross-source # diff prototype JSON vs DTCG JSON
pnpm --filter @app/design-tokens lint
pnpm --filter @app/design-tokens typecheck
```

## Cross-source audit

`scripts/audit-cross-source.ts` walks a fixed mapping table — short prototype
name ↔ DTCG long name — and compares normalised values across both sources.

- **Exits 0** with `✓ N pairs in sync` when there is no drift.
- **Exits 1** with a readable diff (`--<name> <side>: proto=… ↔ dtcg=…`) on
  any failure.
- Surfaces **known prototype-internal drifts** as informational lines: the
  prototype's own `tokens.json` is occasionally out of sync with its
  `tokens.css` (which is what the JSX prototypes actually render). When that
  happens the code-stack tracks `tokens.css`, the audit reports the
  discrepancy as `ℹ`, and does not fail.

Add or remove pairs by editing `makePairs()` in the script; keep the mapping
in sync with the alias table inside `src/emit-scss.ts`.
