# Active tasks

## T-2026-09-13-udemy-fragment-path — make the Udemy fragment path actually work

- Created: 2026-09-13
- Owner: claude
- Spec: tuxedo 90, tuxedo 92 (no roadmap card)
- Goal: the only working Udemy scrape path — paste-the-HTML fragment — keeps
  the external id, and a Udemy URL scrape fails with a legible error instead
  of a generic fetch failure.
- Spec diff: `openapi.yaml` — `ScrapePreviewRequest.url` reused as an optional
  source URL for `kind=fragment`; new `502` example for the bot-challenge case.
- Codegen impact: yes — `pnpm spec:codegen`, landed in its own commit.
- Sub-steps:
  - [x] widen `ScrapeRequest` fragment variant with optional `sourceUrl`
  - [x] spec-first: `ScrapePreviewRequest.url` doubles as fragment source URL
  - [x] `pnpm spec:validate && pnpm spec:bundle && pnpm spec:codegen`
  - [x] `UdemyScraper` mints `externalIds` from a pasted fragment's `sourceUrl`
  - [x] `HttpFetcher` detects a Cloudflare-shaped 403 and throws
        `ScrapeBotChallengeError` (general, not Udemy-specific — every
        scraper fetching through it benefits)
  - [x] `catalog-scrape-admin.controller.ts` maps `body.url` → `sourceUrl` for
        `kind=fragment`
  - [x] unit tests: udemy.scraper, http-fetcher, scraper.errors,
        catalog-scrape-admin.controller
  - [x] `docs/user-guide.md` — Udemy is unfetchable, affiliate API closed
        2025-01-01, paste-HTML steps
  - [x] gates: lint --fix, format, test, typecheck, spec:validate
- Status: in-progress
- Blockers: —
