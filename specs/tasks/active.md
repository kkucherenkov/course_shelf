# Active tasks

## T-2026-08-29-009 — Audit item 8 · make the design inventory true, then gate it

- Created: 2026-08-29
- Owner: claude
- Branch: `chore/design-inventory-strict`
- Cards: none (audit remediation — `docs/audit/2026-08-29-plan-vs-code.md` §5)
- Goal: `pnpm design:audit --strict` in CI, on an inventory that describes the
  components that actually exist.
- Spec diff: none
- Codegen impact: no
- Design impact: rewrites the inventory table in `specs/design/README.md`

### The item as written would produce a lying inventory

Item 8 says "backfill 37 Vue and 17 Flutter components, then `--strict`". The
37 Vue names are real. **The 17 Flutter ones are not components** — the audit
lists `packages/ui_flutter/lib/src/` _directories_, which are groupings
(`buttons/`, `fields/`, `progress/`), and pascalises them into `AppButtons`,
`AppFields`, `AppProgress`. No such widgets exist. Adding those rows would
satisfy the check by inventing names, which is the kostyl
`.claude/CLAUDE.md` "Fix root causes, not symptoms" exists to forbid.

The Vue half of the audit is correct — that package is one folder per
component. Only the Flutter half walks the wrong level, so only it is rewritten.

### What the Flutter set actually is

Public widget classes reachable from the package barrel `lib/app_ui.dart`:
78 exported files, 70 widget classes, of which 17 are Dart-private (`_`-prefixed
internals) and one is the token demo screen. **52 real components.**

Deriving them from the barrel rather than from filenames uses the package's own
declaration of its public API, so a widget that is not exported is not claimed
as a component, and a new export is picked up with no list to maintain.

### Also fixing what the script promises and never did

Its header comment advertises "Vue ↔ Flutter parity drift (one side has it, the
other doesn't)" and no such check is implemented. The inventory's
`Flutter (app_ui)` column is `—` on every row — written when the Flutter
package was empty and never updated, though parity is now near-complete. Since
both sets are known, the column is verified rather than trusted.

- Sub-steps:
  - [ ] Flutter enumeration reads the barrel, not the directory names
  - [ ] the stale-row check accepts a Flutter-only component
        (`AppBottomSheet`, `AppDownloadRow`) instead of flagging it
  - [ ] parity check: the `Vue` / `Flutter` columns must match the code
  - [ ] rewrite the inventory table — every Vue and Flutter component, real
        parity marks
  - [ ] `--strict` in ci.yml
  - [ ] prove the gate fails on a removed row before committing
- Status: in-progress
