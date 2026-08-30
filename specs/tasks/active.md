# Active tasks

## T-2026-08-30-010 — settle the locale parity claim (drop uk/el from mobile)

- Created: 2026-08-30
- Owner: claude
- Spec: [docs/roadmap/tasks/E31-F02-S03.md](../../docs/roadmap/tasks/E31-F02-S03.md) (issue #244)
- Goal: mobile ships `en`/`ru` like web; the machine-written `uk`/`el` locales go, and the two Known-limits rows that described the mismatch as a defect are rewritten.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [ ] delete `*_uk.i18n.json` / `*_el.i18n.json` and the unused `localeEl` / `localeUk` keys
  - [ ] drop the Greek/Ukrainian entries from the settings language picker
  - [ ] `pnpm check:i18n` green, mobile reported as 2 locales
  - [ ] rewrite both Known-limits rows + the Languages line in `docs/user-guide.md`
  - [ ] correct the locale claim in `README.md`, `README.ru.md`, `.claude/docs/i18n.md`
  - [ ] `flutter analyze && flutter test`
- Status: in-progress
- Blockers: —

