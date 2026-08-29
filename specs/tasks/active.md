# Active tasks

## T-2026-08-29-011 — Audit item 10 · every design-system string overridable

- Created: 2026-08-29
- Owner: claude
- Branch: `feat/design-system-i18n-props`
- Cards: none (audit remediation — `docs/audit/2026-08-29-plan-vs-code.md` §8)
- Goal: no user-visible string in `@app/ui` or `app_ui` that a consumer cannot
  translate. Closes the `.claude/CLAUDE.md` hard rule "never ship a
  user-visible string without `t()` / `AppLocalizations`" for the design system.
- Spec diff: none
- Codegen impact: no
- Design impact: adds label props; no visual change

### The item's count was wrong in both directions

§8 names five strings. One of them — `AppSpinner.semanticLabel` — is **already**
a constructor parameter with an English default, so it was never a defect. The
other four are real but are 4 of ~65.

Measured across both packages, excluding punctuation separators and the token
demo screen:

| Platform           | Components | Strings |
| ------------------ | ---------- | ------- |
| Vue (`@app/ui`)    | 11         | 36      |
| Flutter (`app_ui`) | 10         | 29      |

`AppPlayerChrome` (Vue) is **not** in that count and needs no work: its 23
strings are already props, with the aria set merged over a `DEFAULT_ARIA`
constant. It is the pattern the rest of this task follows rather than a
component to fix. Several Flutter widgets are partly done the same way
(`app_download_row` has four label parameters, `app_player_chrome` five), so
this extends an established convention instead of inventing one.

### Approach

Defaults stay byte-identical to today's English, so the 88 `@app/ui` snapshots
and every Flutter golden must remain green without regeneration — that is the
check that this refactor changed no rendering.

- Sub-steps:
  - [ ] Flutter: label parameters on the 10 widgets
  - [ ] Vue: label props on the 11 components
  - [ ] wire the consumers that actually surface each string
  - [ ] locale keys: web `en`/`ru`, mobile `en`/`ru`/`uk`/`el`
  - [ ] `pnpm check:i18n` green (it enforces per-app key parity)
  - [ ] snapshots and goldens unchanged, both suites green
- Status: in-progress
