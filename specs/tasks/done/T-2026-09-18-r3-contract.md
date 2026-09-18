## T-2026-09-18-r3-contract — add OpenAPI links for the four runtime-created resource chains

- Created: 2026-09-18
- Owner: claude
- Spec: [#485](https://github.com/kkucherenkov/course_shelf/issues/485) (tuxedo 40), [#493](https://github.com/kkucherenkov/course_shelf/issues/493) (tuxedo 94), history in [#441](https://github.com/kkucherenkov/course_shelf/issues/441)
- Goal: give the schemathesis Stateful phase a real id to chain into the
  identify-task, transcription, bookmark and access-grant operations that a
  seed cannot cover, and fix the stale `updateCourse` 400 example.
- Acceptance:
  - `runIdentifyTask`, `startTranscription`, `createBookmark`, `registerGrant`
    responses declare OpenAPI `links` into their dependent operations.
  - `packages/specs/schemathesis.toml`'s own "NOT overridden, deliberately"
    comment for these four families no longer describes a gap — the file
    itself is unchanged, since the fix is the links, not a seed.
  - `updateCourse`'s 400 example lists the same 14-field enumeration its own
    description already carries.
- Spec diff: `packages/specs/openapi/openapi.yaml` — `components.links` (new,
  7 entries) + `links:` on the 5 create responses that reference them +
  `updateCourse`'s 400 example body.
- Codegen impact: no — confirmed by running `spec:bundle` + `spec:codegen`;
  `git status` showed no diff outside `openapi.yaml` (links are response
  metadata, not part of either generator's output).
- Design impact: none.
- Tests: verified live — brought up `docker/compose.yml` +
  `docker/compose.ci.yml` (postgres, centrifugo, backend) under a scratch
  Compose project, signed up an admin, seeded the catalog, and ran
  `schemathesis/schemathesis:4.25.2` against it twice (once for the console
  summary, once with `--report ndjson` for a raw request/response trace).
  All 7 dependent operationIds (`getIdentifyTask`, `applyIdentifyResult`,
  `discardIdentifyTask`, `cancelTranscription`, `updateBookmark`,
  `deleteBookmark`, `revokeGrant`) received real chained ids and non-404
  responses in the same run — counts and status codes are in the PR body.
- Sub-steps:
  - [x] Add `components.links` (7 entries) and wire them into the 5 create
        responses (`runIdentifyTask` ×3, `startTranscription` ×1,
        `createBookmark` ×2 on both its 200 and 201, `registerGrant` ×1).
  - [x] Fix `updateCourse`'s stale 400 example.
  - [x] `pnpm spec:validate && pnpm spec:bundle && pnpm spec:codegen` — clean,
        no generated-client diff.
  - [x] Empirical verification against a live stack (see Tests above).
  - [x] `pnpm format` on this file.
- Status: done
- Completed: 2026-09-18
- Result: https://github.com/kkucherenkov/course_shelf/pull/742
