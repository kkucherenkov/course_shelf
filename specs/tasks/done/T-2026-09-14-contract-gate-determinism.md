## T-2026-09-14-contract-gate-determinism — `negative_data_rejection` coin flip on numeric query params

- Created: 2026-09-14
- Owner: claude
- Spec: none — `packages/specs/schemathesis.toml` only. Closes #528.
- Goal: stop the contract gate failing on a coin flip for any of the eleven
  operations that declare `offset`/`limit` as `type: integer` in query.
- Measured, not deduced (live stack, `csh-laneh` compose project, ports
  13000/13801/15432/13200/14317/14318, seeded + ADMIN bearer minted the same
  way `e2e.yml` does):
  - Reproduced the exact mechanism with a hand-built request: `offset=1`
    (digit string) round-trips byte-identical through the query string and
    `express-openapi-validator` correctly coerces + accepts it — 200, not a
    bug in the API.
  - `yq` over `openapi.yaml`: exactly 11 operationIds declare `offset` and/or
    `limit` as inline `type: integer` in query (matches the issue's "roughly
    eleven" claim exactly): `getContinueWatching`, `getRecentlyAdded`,
    `getRecentlyCompleted`, `listAdminScans`, `listAdminTranscriptions`,
    `listAdminUsers`, `listInstructors`, `listLibraryTranscriptions`,
    `listStudios`, `listTags`, `searchCatalogue`.
  - 6 full-spec contract-test runs (fresh random seed each, ~6300-6700 cases,
    25 examples/op) all passed — consistent with "coin flip": the false
    positive is real (proven above) but not dense enough to hit on every run,
    matching one hit in many CI runs on `main`.
  - Option 2 (string+pattern on the wire) rejected on measured blast radius:
    the schema.json for schemathesis' own config confirms per-operation is
    the only granularity available (no per-parameter check toggle), so this
    isn't about schemathesis config shape — the actual finding is that
    `offset`/`limit` are duplicated inline 14 times across those 11
    operations (no shared `$ref`), and retyping them changes what every
    generated client emits (`number` → `string`) and what
    `express-openapi-validator` hands the handler, which reads it as a
    `number` today (repository `skip`/`take`). That is a wire-breaking
    change per this repo's own versioning rule (new `/api/v2` prefix + ADR)
    for a gate-determinism fix — disproportionate, and out of this lane's
    `packages/specs`-only boundary regardless.
  - Confirmed schemathesis' config accepts `include-operation-id` as an
    array, so the fix is one block, not eleven.
- Sub-steps:
  - [x] measure against a live stack (see above)
  - [x] add one `[[operations]]` block to `schemathesis.toml`,
        `include-operation-id` = the 11 operationIds,
        `checks.negative_data_rejection.enabled = false`, documented rationale
  - [x] `pnpm spec:validate`, `pnpm --filter @app/specs lint`, `typecheck`
  - [x] re-ran the real `pnpm spec:contract-test` against the live stack with
        the fix applied — green, same shape as every other CI pass
  - [x] PR with `Closes #528` —
        [#543](https://github.com/kkucherenkov/course_shelf/pull/543)
- Status: done
- Completed: 2026-09-14
- Blockers: — (CI green except `Storybook visual regression`, which is
  already failing on `main` HEAD `72183adc`/#533 — unrelated to this change,
  not in this lane's `packages/specs` remit)
