# Active tasks

## T-2026-07-17-005 — design-token hygiene: dangling refs, magic numbers, and the CI gates that let them rot

- Created: 2026-07-17
- Owner: claude
- Spec: none — surfaced by [T-2026-07-17-004](./done.md)
- Goal: make the design-token discipline real — fix what drifted, and close the
  CI holes that let it drift silently.
- Acceptance:
  - No `var(--x)` in `apps/web` or `packages/ui` references a token the
    generator never emits.
  - `pnpm stylelint` is clean and runs in CI.
  - `turbo run lint` and `turbo run typecheck` cover every package, so no
    package can be silently skipped again.
- Spec diff: none
- Codegen impact: no
- Design impact: none intended — token _usage_ only. No token added or changed.
- Tests: `@app/ui` 868 + `@app/web` suites; some Storybook/vitest snapshots move
  where a dangling ref was suppressing a declaration (expected).
- Sub-steps:
  - [x] `AppScanProgress.spec.ts` — spread-after-key overwrote `errorsLabel`; a
        committed snapshot asserted "2 errors" for a fixture with `errors: 5`
  - [x] CI — turbo-ise lint + typecheck, add the stylelint gate
  - [ ] dangling `var()` refs + stylelint violations — `packages/ui` (3 agents)
  - [ ] dangling `var()` refs + stylelint violations — `apps/web`
- Status: in-progress
- Blockers: —

## Notes

**Root cause.** CI named packages by hand for `lint` and `typecheck`
(`backend`, `web`), silently skipping `@app/ui` — the same hole that once hid
`@app/ui`'s 852 tests, called out in a comment three lines below the one that
still had it. stylelint ran nowhere at all. Both gates are now inverted-filter
based, per that comment's own lesson.

**Dangling refs are real bugs, not nits.** A `var()` with no fallback and no
definition is the guaranteed-invalid value: it invalidates the _whole_
declaration. `AuthLayout.vue` asks for `--space-12`, which does not exist (the
scale stops at `--space-9`), so `padding: var(--space-8) var(--space-8)
var(--space-12)` renders as **no padding at all**. Fixing these changes
rendering — that is the point, and some snapshots legitimately move.

**A trap worth remembering:** token CSS is _generated_ into gitignored files
(`packages/ui/src/tokens.generated.css`). `git grep` cannot see it. Auditing
tokens without running `pnpm design:build` first makes every token look
dangling — it does not mean the design system is broken.

**Reported but NOT real:** an earlier agent claimed `eslint --fix` rewrites
`AppNavigationShell.vue` / `AppSwitch.vue`. Verified false — `eslint --fix`
changes nothing and `turbo run lint` is 7/7 green.
