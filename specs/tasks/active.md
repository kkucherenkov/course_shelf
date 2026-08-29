# Active tasks

## T-2026-08-29-007 — Audit remediation, items 1–6

- Created: 2026-08-29
- Owner: claude
- Branch: `chore/audit-fixes`
- Cards: none (bookkeeping + CI hardening, not a roadmap story)
- Goal: close items 1–6 of the ranked list in
  `docs/audit/2026-08-29-plan-vs-code.md` — every _false statement_ in the
  repository, plus the two gates that make the rest enforceable.
- Spec diff: none
- Codegen impact: no
- Design impact: no
- Sub-steps:
  - [x] 1 — branch protection on `main` with the four required checks
  - [x] 3 — `pnpm check:i18n` as a step in ci.yml's `checks` job
  - [x] 4 — `docs/troubleshooting.md` fvm entry points at a real version
  - [x] 5 — Gantt: synced from the cards, drift gated in CI
  - [x] 2 — six false claims in README.md / README.ru.md
  - [x] 6 — stale follow-up note in `specs/tasks/active.md`
- Status: done (pending PR)

Scope grew twice, both times into the same root cause the item named.
Item 4's entry blamed local drift; the actual cause was
`.devcontainer/devcontainer.json` pinning Flutter 3.41.0, _below_ the
`>=3.44.0` floor in both pubspecs — the devcontainer could not run
`flutter pub get`. Item 5's Gantt was not stale-by-neglect: `write_roadmap()`
encoded Stage (A/B) as `active`/`crit` and never had a progress axis at all,
so "all 121 rows :active" was the design, not drift.

Also landed here at the maintainer's request: a **Working agreement** section
in `.claude/CLAUDE.md` (answer in Russian; plan first; update docs in the same
pass; `tuxedo`/`dnote` for long-term memory; a dnote changelog note appended
before reporting done), mirrored short in `AGENTS.md`.
