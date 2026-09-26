## T-2026-09-26-stacks-recipe-plan — Harvest the todoer findings and plan the stack recipe

- Created: 2026-09-26
- Owner: claude
- Spec: [two-layer project template](../../docs/superpowers/specs/2026-09-25-project-template-two-layer-design.md) §5, §7 phase 4
- Goal: `stacks/ts-monorepo` becomes executable work — the capture notes catch up
  with todoer, and the phase-4 plan exists.
- Acceptance:
  - `docs/superpowers/plans/ts-monorepo-recipe-notes.md` covers todoer through
    the CLI outbox wave and is tracked by git (it is untracked today)
  - `docs/superpowers/plans/2026-09-26-stacks-ts-monorepo.md` exists, names every
    one of the 11 modules, and says per module whether it is extracted-and-diffed
    or first-run
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Tests: none — documents only. The plan's own tasks carry the tests.
- Sub-steps:
  - [x] Harvest the 50 todoer commits since 2026-09-25 21:35 into the notes
  - [x] Track the notes file with `git add -f` (global gitignore hides `docs/`)
  - [x] Write the phase-4 plan, after the shipyard repository exists —
        `docs/superpowers/plans/2026-09-26-stacks-monorepo.md`, 11 tasks. Scoped
        to the six modules the first consumer has actually built; `web`, `ui`,
        `tokens` and `mobile` are deferred by D8 until a consumer needs them.
  - [x] Correct the spec: it named the plugin `ts-monorepo` and put `SKILL.md`
        at the plugin root, where Claude Code never loads it
  - [x] Correct tuxedo 337 — phase 1's plan landed in PR #814

### Design points the phase-4 plan must settle (raised 2026-09-26)

Optional Flutter, asked for directly by the maintainer.

- **Modules are opt-in already** — D14 makes the recipe a module graph, `mobile`
  has no dependents, and `tokens` declares `ui` **or** `mobile`. What is missing
  is the mechanism, and the mechanism is the stack skill asking which modules to
  install, not a shell script: D14 rejected the monolithic scaffold script.
- **Omit, never disable.** D6 already decided this for `CLAUDE.md` sections —
  `/bootstrap` deletes an inapplicable section rather than leaving it empty,
  because empty and filled are indistinguishable to the skill reading it. A
  skipped CI job reports green, and an absent required check is missing from
  `gh pr checks` entirely, so a switched-off Flutter gate is worse than none.
- **The seam is three shared packages, not `apps/mobile`.** Measured in this
  repository: `packages/specs/scripts/codegen.ts` (38 Dart/Flutter references
  and a hard `EXPECTED_DART_VERSION = '3.12.2'`), `packages/design-tokens/src/emit-dart.ts`
  called from `build.ts`, `scripts/check-i18n` reading `apps/mobile/lib/i18n` as
  a third parity source, four workflows, the root `dev:widgetbook` script, and
  the whole `packages/api-client-dart` package. Declining mobile must also
  remove the Dart 3.12.2 toolchain requirement (tuxedo 265) rather than leave
  it documented for a project that will never need it.
- **OPEN: can a module be added later?** A project that declines Flutter on day
  one and wants it in month six. Leaning to re-runnable per-module installs,
  because `realtime` is deferred by the spec for the first consumer and lands in
  the same trap otherwise. Not yet decided.
- **OPEN: the spec is inconsistent about agents.** Its `stacks/ts-monorepo/agents/`
  tree lists five — `backend-engineer`, `frontend-engineer`, `spec-writer`,
  `spec-reviewer`, `codegen-runner` — with no `flutter-engineer`, while `mobile`
  is a module. If a module ships, its agent ships with it.

- Status: in-progress
- Blockers: —
