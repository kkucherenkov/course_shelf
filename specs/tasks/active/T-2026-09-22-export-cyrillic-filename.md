# T-2026-09-22-export-cyrillic-filename

- Created: 2026-09-22
- Owner: claude
- Spec: none — release blocker found by the second pre-release audit pass
  (`~/audit-courseshelf/run21/assessment-a.md`, finding 1), filed as #790
- Goal: `GET /api/v1/courses/{id}/export` and the lesson equivalent stop
  answering 500 for any title that is not pure ASCII.
- Context: `slugifyForFilename` deliberately keeps `\p{L}\p{N}` — any-script
  letters — because the slug names files _inside_ the ZIP, where UTF-8 is
  fine. The same slug then reaches `Content-Disposition`, and Node rejects
  any header byte outside latin1 with `ERR_INVALID_CHAR`. 32 of the 68
  courses in the production dump (47%) cannot be exported; a Latin-titled
  course exports in 22 ms, so the feature works and fails on the name alone.
- Why CI missed it: `seed-catalog.ts` produces Latin titles, and both
  existing header assertions in `export.controller.spec.ts` use `intro.zip`
  and `signals.zip`. The whole gate ran green over a defect that the
  production dump surfaces on the first Cyrillic course.
- Fix: RFC 6266 §4.1 + RFC 5987 at the HTTP boundary — `filename=` carries an
  ASCII-only fallback, `filename*=UTF-8''…` carries the real name
  percent-encoded. The slug itself is not touched: mangling it would degrade
  the names inside the archive to fix a header.
- Spec diff: none — response headers, not the contract's shape
- Codegen impact: no
- Design impact: none
- Tests: header assertions for a Cyrillic title, a mixed-script title and a
  pure-ASCII title; an integration case that the ZIP still unpacks.
- Sub-steps:
  - [x] `contentDisposition` helper in `zip-writer.ts`, both parameters
  - [x] Update the two existing ASCII header assertions to the new format
  - [x] Add Cyrillic + mixed-script cases, so the next regression cannot pass
        — `zip-writer.spec.ts`, 10 cases including Japanese and Greek, and one
        `it.each` asserting the header carries no byte outside ASCII at all
  - [x] `pnpm --filter @app/backend test src/modules/learning` — 378 passed in
        46 files; typecheck and lint clean
  - [ ] PR with `Closes #790`, wait for the five required contexts by name
- Deviation: the RFC 5987 escape table is a literal map rather than a computed
  `codePointAt`, because the excluded set is fixed by the RFC and the computed
  form returns `number | undefined`, which would need an assertion to satisfy
  `tsc`.
- Status: in-progress
- Blockers: —
