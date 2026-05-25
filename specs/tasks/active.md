# Active tasks

## T-2026-05-25-004 — Fix web vitest runner (whole-suite crash on @app/ui barrel import)

- Created: 2026-05-25
- Owner: claude
- Spec: infra — `pnpm --filter @app/web test` aborts at startup on `main`
- Root cause (systematic-debugging): `app/components/__tests__/SettingSyncIndicator.spec.ts` mounts the real component, which imports `{ IconCS } from '@app/ui'`. The `@app/ui` barrel transitively pulls `@nuxt/ui` runtime (e.g. `AppBadge.vue` → `@nuxt/ui/components/Badge.vue`), whose component files import the Nuxt build virtuals `#build/ui/*` and `#imports`. Outside a Nuxt build vite resolves those `#`-specifiers against `@nuxt/ui`'s own package `imports` map (absent) → `Missing "#build/ui/badge" specifier`. Because vitest builds the whole-project module graph during collection, that one spec aborts the entire run. The other 3 component specs avoid this by mocking `@app/ui`; this one is the outlier.
- Evidence: per-spec isolation run — only `SettingSyncIndicator.spec.ts` crashes; all others pass. Aliasing `#build`→`.nuxt` clears that error but reveals `#imports` from `@nuxt/ui` runtime (cascade) — confirms running `@nuxt/ui` in plain-vite vitest is the wrong path; the convention is to NOT load the barrel.
- Node note: vite@8/vitest@4 need Node ≥24 (engines already declares it); under Node 20 the config fails with `ERR_REQUIRE_ESM` (environmental, not the bug).
- Fix: mock `@app/ui` in `SettingSyncIndicator.spec.ts` (stub `IconCS`), matching the established component-spec convention. The asserted classes live on the component's own `<span>`s, so stubbing `IconCS` is behaviour-preserving.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] add `vi.mock('@app/ui')` stub for `IconCS` to `SettingSyncIndicator.spec.ts`
  - [x] run the FULL web suite (Node 24) → green (27 files, 171 tests, exit 0)
  - [x] remove throwaway bisect configs; eslint clean
  - [x] add `app/utils/**/*.spec.ts` to `test.include` (was an uncovered gap — `highlight.spec.ts` never ran); suite now 28 files / 183 tests green
- Findings: `.nvmrc` already pins `24` + engines `>=24.0.0` — Node aspect needs no change.
- Status: in-progress (awaiting commit/PR)
- Blockers: —
