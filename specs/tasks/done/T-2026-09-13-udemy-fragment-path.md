## T-2026-09-13-udemy-fragment-path — make the Udemy fragment path actually work

- Created: 2026-09-13
- Completed: 2026-09-13
- Result: https://github.com/kkucherenkov/course_shelf/pull/457
- Owner: claude
- Spec: tuxedo 90, tuxedo 92, tuxedo 106 (no roadmap card)
- Goal: the only working Udemy scrape path — paste-the-HTML fragment — keeps
  the external id, and a Udemy URL scrape fails with a legible error instead
  of a generic fetch failure.
- Spec diff: `openapi.yaml` — `ScrapePreviewRequest.url` reused as an optional
  source URL for `kind=fragment`; new `502` example for the bot-challenge case;
  `ratingCount` bounded to the int4 max at its three declaration sites
  (tuxedo 106 — pre-existing bug, unrelated to Udemy, surfaced by this PR's own
  contract-test CI run; folded in rather than a second codegen cycle).
- Codegen impact: yes — landed in its own commit (the ratingCount bound added
  no codegen diff: JSON Schema numeric bounds don't change generated types).
- Sub-steps:
  - [x] widen `ScrapeRequest` fragment variant with optional `sourceUrl`
  - [x] spec-first: `ScrapePreviewRequest.url` doubles as fragment source URL
  - [x] `pnpm spec:validate && pnpm spec:bundle && pnpm spec:codegen`
  - [x] `UdemyScraper` mints `externalIds` from a pasted fragment's `sourceUrl`
  - [x] `HttpFetcher` detects a Cloudflare-shaped 403 and throws
        `ScrapeBotChallengeError` (general, not Udemy-specific)
  - [x] `catalog-scrape-admin.controller.ts` maps `body.url` → `sourceUrl` for
        `kind=fragment`
  - [x] unit tests: udemy.scraper, http-fetcher, scraper.errors,
        catalog-scrape-admin.controller
  - [x] `docs/user-guide.md` — Udemy is unfetchable, affiliate API closed
        2025-01-01, paste-HTML steps
  - [x] `schemathesis.toml` — exempted `negative_data_rejection` across the
        `/libraries/{id}` family: every operation there pins a required
        `path.id`, and the override defeats the negative generator's id
        mutation, so a fully valid request lands and gets misreported as
        "accepted a schema-violating request". No product code involved.
  - [x] `ratingCount` bounded to `maximum: 2147483647` (int4) at all three
        declaration sites; audited every other int4-backed integer field in
        the file — all response-only, not the same risk class
  - [x] gates: lint --fix, format, test, typecheck, spec:validate
- Status: done
