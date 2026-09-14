# Active tasks

## T-2026-09-14-poster-download — a scraped course poster can never be displayed

- Created: 2026-09-14
- Owner: claude
- Spec: [packages/specs/openapi/openapi.yaml](../../packages/specs/openapi/openapi.yaml) —
  `GET /api/v1/courses/{id}/poster` (5th #278 binary exception)
- Goal: `Course.posterUrl` (scraped, third-party CDN) gets downloaded into
  `DERIVED_PATH` and served from our own origin, so the SPA's
  `img-src 'self'` CSP can actually display it — closes #496.
- Spec diff: openapi.yaml — new `GET /courses/{id}/poster` path only;
  `CourseDto.posterUrl`'s schema is unchanged, its runtime meaning changes
  (signed own-origin URL instead of the raw external one).
- Codegen impact: yes (spec:codegen run, artefacts included)
- Sub-steps:
  - [x] `PosterDownloader` port + `HttpPosterDownloader` adapter (reuses
        `HttpFetcher`'s SSRF guard via new `fetchBinary`)
  - [x] `derivedCoursePosterPath` in `derived-path.ts`
  - [x] `PosterSyncService` — single call site for the 3 handlers that set
        `Course.posterUrl` (scan, admin PATCH, backfill)
  - [x] `CoursePosterTokenSigner` + `CoursePosterLocator` + `GET :id/poster`
        route on `CoursesController`
  - [x] `toCourseDto` embeds the signed URL (no separate issue-token
        round-trip — threaded through all 6 call sites incl.
        instructor/studio/tag detail pages)
  - [x] web: `browse.vue` wires `posterUrl` into `CoursePosterCard`'s `cover`
  - [x] unit tests for every new domain/application/infra piece + a
        controller-level poster-route spec; backend+web suites green
  - [ ] open PR, confirm CI green
- Status: in-progress
- Blockers: —

## T-2026-09-14-fix-centrifugo-namespaces — declare the namespaces the contract uses

- Created: 2026-09-14
- Owner: claude
- Spec: none — the AsyncAPI contract was already correct; found while
  debugging a live NAS deployment whose scan progress never moved
- Goal: every Centrifugo namespace used by a channel in
  `packages/specs/asyncapi/centrifugo.yaml` must be declared in every
  Centrifugo configuration, and stay that way.
- Sub-steps:
  - [x] add `scans` and `maintenance` to dev, prod and release configs
  - [x] `scripts/check-realtime-namespaces.ts` deriving the required set from
        the contract
  - [x] wire it as `pnpm check:realtime` and a CI step
- Status: in-progress
- Blockers: —
