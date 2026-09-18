## T-2026-09-14-spec-resolution — pick the newest OpenAPI spec copy, not the first one found

- Created: 2026-09-14
- Completed: 2026-09-14
- Owner: claude
- Goal: Closes #500 — `resolveSpecPath` in `openapi-validator.middleware.ts`
  picked the first existing candidate (`dist/specs/openapi.json` before
  `packages/specs/dist/openapi.json`) with no age comparison, so a stale
  build artefact silently outranked a freshly bundled spec and validated
  local test runs against the wrong contract.
- Spec diff: none — `apps/backend` only, `openapi.yaml` untouched.
- Codegen impact: no
- Design: of the issue's two options, chose "prefer the newest file, log the
  choice" over "build the spec into `dist` as part of the test task".
  Building into `dist` doesn't fix the second half of the bug — a
  root-owned `dist/` (left by a dev-container build) blocks a non-root
  developer from ever rebuilding or clearing it. Comparing mtime across the
  existing candidates needs only read access, so it works whoever owns the
  stale copy. Extracted the comparison into `pickNewestSpec(candidates)`, a
  pure function (existing repo pattern, see
  `scraper-definition.loader.spec.ts`) so it is unit-testable with real
  temp-dir fixtures rather than mocking `fs`. The final "armed with spec"
  log line now names any stale copy it passed over, so the choice is never
  silent again.
- Result: [PR #539](https://github.com/kkucherenkov/course_shelf/pull/539)
