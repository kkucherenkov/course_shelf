# Declarative scraper definitions — design

Design pre-step for [E30-F01-S01](../../roadmap/tasks/E30-F01-S01.md), the
first sub-step that card lists. Settles the two things it names — the rule
vocabulary, and where definitions live on disk — plus the three questions that
turned out to sit underneath them.

**Goal:** add a metadata source without rebuilding the backend.

## 1. Decisions

| # | Decision | Why |
| --- | --- | --- |
| D1 | Definitions are **JSON**, not YAML | No YAML parser is reachable from `apps/backend` and none is in the root `package.json`, so the card's literal wording costs a dependency. `course-json.schema.ts` already establishes the opposite precedent — a hand-rolled parser/validator, "no runtime schema library … to keep the domain layer dependency-free" — and this product's users already hand-author `course.json`. A second hand-authored format being JSON is the consistent choice, not the lesser one. Revisit if definitions start carrying comments and long regexes. |
| D2 | Definitions live in `$DERIVED_PATH/scrapers/*.json`, read-only | No fourth bind mount. Verified safe against the existing cleanup: deletion under `/data/derived` is row-driven (`prisma-transcript.repository.ts:100` unlinks only a deleted row's `derivedPath`); nothing walks the directory removing what it does not recognise. |
| D3 | Rules **win** over the generic extractor | `HtmlMetadataExtractor` already resolves its own two sources as `{...fromOg, ...fromJsonLd}` — the more specific source wins. A hand-authored site rule is the most specific source there is, and an author who writes one must be able to correct a site whose JSON-LD lies. |
| D4 | A separate `RuleExtractor`, not a rules argument on `HtmlMetadataExtractor` | That class is documented as "Pure: a string in, a fragment out — no network, no DI". An optional rules parameter makes one class do two jobs and rewrites its existing tests. Two pure functions, composed by the scraper. |
| D5 | An id colliding with a built-in scraper is **rejected and reported**, never an override | Silently shadowing `udemy` with a definition file makes "why did udemy break" undebuggable. Rejection is also the simpler rule. |
| D6 | Loaded once at startup | The card says so, and a watcher is state and failure modes bought for a file that changes a few times a year. |

## 2. What already exists

The port is the right shape and needs no change:

- `Scraper { id, supportedKinds, canHandle(url), scrape(request) }` —
  `domain/scraper/scraper.port.ts`.
- `DefaultScraperRegistry` takes a ready list and dispatches by id or by URL.
  It scans **in construction order**, so the generic `json-ld` fallback
  (`canHandle` ⇒ always true) must stay last — stated in that file's header.
- `HtmlMetadataExtractor.extract(html)` — pure, cheerio, schema.org JSON-LD +
  OpenGraph.
- `HttpFetcher` — timeout, response size cap, user agent, all from `AppConfig`.
- `UdemyScraper` is the worked example of fetcher + extractor + a URL-derived
  external id.

The only missing thing is registration without a rebuild.

## 3. Definition format

```json
{
  "id": "my-site",
  "kinds": ["url"],
  "match": { "urlPattern": "^https://my\\.site/course/" },
  "rules": {
    "title":       { "selector": "h1.course-title", "from": "text" },
    "description": { "selector": "meta[name=description]", "from": "attr:content" },
    "tags":        { "selector": ".tag", "from": "text", "many": true },
    "releaseDate": { "json": "props.pageProps.course.publishedAt",
                     "jsonFrom": "script#__NEXT_DATA__" }
  }
}
```

- `id` — unique; must not collide with a built-in (D5).
- `kinds` — subset of `url | name | fragment`. A definition with no `name`
  strategy declares `["url"]` and the registry never routes a name search to it.
- `match.urlPattern` — a regex, compiled once at load. `canHandle` is a test
  against it.
- `rules` — a map whose **keys are `ScrapedCourseFragment` field names**. An
  unknown key is a validation error, not a silently ignored line.

Two rule kinds:

| Kind | Fields | Meaning |
| --- | --- | --- |
| CSS | `selector`, `from: "text" \| "attr:<name>"`, `many?` | cheerio select; `many` collects every match instead of the first |
| JSON | `json` (dotted path), `jsonFrom?` (CSS selector for the script tag) | parse that script's JSON and walk the path; `jsonFrom` defaults to every `script[type="application/ld+json"]` |

The dotted path is deliberately not JSONPath — `a.b.c` and numeric indices
(`a.0.b`) cover the embedded-state case without a dependency or an expression
language.

**No type declarations.** The target field decides the coercion:
`ratingAverage` / `ratingCount` → number, `tags` / `instructorNames` /
`externalIds` → list, everything else → string. A value that will not coerce is
dropped, and the field is left absent rather than set to something wrong. One
less thing in the vocabulary that can disagree with the domain type.

## 4. Execution

```ts
// DeclarativeScraper.scrape, url kind
const html = await this.fetcher.fetch(url);
const generic = this.extractor.extract(html);           // unchanged
const fromRules = this.ruleExtractor.extract(html, def.rules);
return [{ fragment: { ...generic, ...fromRules }, source: def.id, sourceUrl: url }];
```

`RuleExtractor` is pure the way `HtmlMetadataExtractor` is: html + rules in,
`Partial<ScrapedCourseFragment>` out, no network and no DI.

## 5. Loading and failure

`ScraperDefinitionLoader.load(dir)` returns
`{ definitions: ScraperDefinition[], errors: ScraperDefinitionError[] }`.

- A missing directory is not an error — it is the normal case for an instance
  that has never authored one.
- Per file: unreadable, not JSON, schema-invalid, bad regex, or a colliding id
  → one error entry naming the file and the reason; the file is skipped.
- **Startup never fails on a definition.** The card is explicit, and an
  instance that will not boot because of a typo in an optional metadata source
  is a worse outcome than one that boots without it.
- Errors are kept in memory so [E30-F01-S02](../../roadmap/tasks/E30-F01-S02.md)
  can render them. That surface is **not** built here.

Validation is hand-rolled in the shape of `course-json.schema.ts` (D1) — same
layer, same style, same absence of a schema library.

Wiring: the `SCRAPER_REGISTRY` factory in `catalog.module.ts` appends
declarative scrapers after the built-ins and **before** the `json-ld` fallback,
preserving the ordering contract. `SCRAPERS_MODE=mock` skips the loader
entirely, as it already skips the real scrapers.

## 6. Testing

| Unit | Test |
| --- | --- |
| `ScraperDefinitionLoader` | valid; missing directory; unparseable JSON; unknown rule target; bad regex; id colliding with a built-in; one bad file among good ones leaves the good ones loaded |
| `RuleExtractor` | one test per rule kind — `text`, `attr:`, `many`, dotted JSON path, `jsonFrom`; absent selector yields an absent field; a value that will not coerce is dropped |
| `DeclarativeScraper` | `canHandle` for matching and non-matching URLs; `scrape` merges with rules winning over the generic extractor |
| Registry wiring | declarative scrapers sit before the `json-ld` fallback |

## 7. Out of scope

- The admin inventory surface (E30-F01-S02).
- Hot reload (D6).
- Regex captures, replace, date formats. If a definition needs them, that is the
  signal to revisit D1 at the same time.
- Runtime JS plugins — the card already rejected them, and nothing here reopens
  it: a definition is data, and the only code that runs is ours.
