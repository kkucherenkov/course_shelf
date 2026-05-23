# Stage 2 Scraper Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a declarative scraper port + registry with three concrete adapters (generic JSON-LD/OpenGraph, YouTube Data API, bespoke Udemy landing-page) and a preview-only admin endpoint that returns scraped course-metadata candidates without writing anything.

**Architecture:** Approach A — registry of self-contained `Scraper` adapters behind the `SCRAPER_REGISTRY` token. Shared outbound concerns live in injectable helpers: a SSRF-guarded `HttpFetcher` over native `fetch` and a cheerio-based `HtmlMetadataExtractor`. A CQRS `ScrapeCourseCommand` resolves a scraper, calls it, and returns `ScrapeCandidate[]`. No persistence, no entity resolution (those are Stage 4).

**Tech Stack:** NestJS 11 + CQRS, Node ≥24 native `fetch`/`AbortController`, `cheerio@^1.0.0`, Vitest, OpenAPI 3.1 (spec-first → regen `@app/api-client-ts` + `@app/api-client-dart`), RFC 9457 problem responses via the existing `DomainError` → `HttpExceptionFilter` path.

**Spec reference:** `docs/superpowers/specs/2026-05-23-stage2-scraper-port-design.md`

**Conventions to honor (verified in repo):**

- Domain errors extend `DomainError` / `NotFound` / `InvariantViolation` from `apps/backend/src/shared/domain-error.ts`; the global `HttpExceptionFilter` maps them to `application/problem+json` automatically — handlers/controllers never build problem documents.
- Config is read only through `AppConfig` (never `process.env`). Helpers: `stringOrDefault`, `numberOrDefault`, `boolOrDefault`.
- DI tokens are `Symbol(...)`, injected with `@Inject(TOKEN)`; ports live in `domain/`, adapters in `infra/`, wired in `catalog.module.ts`.
- Tests are Vitest `*.spec.ts` colocated with the unit. Run a single backend test: `pnpm --filter @app/backend test -- <path>`.
- After editing `.ts`: `pnpm --filter @app/backend lint --fix` then `pnpm format`. Commit messages follow Conventional Commits.
- Spec-first: edit `packages/specs/openapi/openapi.yaml`, then `pnpm spec:validate && pnpm spec:bundle && pnpm spec:codegen`, codegen artefacts land in their own commit.

**Task order & dependencies:**

1. Domain types / port / errors
2. `ScrapersConfig` in `AppConfig`
3. `HttpFetcher` (+ SSRF guard)
4. `HtmlMetadataExtractor` (+ `cheerio` dependency)
5. `JsonLdScraper`
6. `YouTubeScraper`
7. `UdemyScraper`
8. Mock scrapers + `ScraperRegistry`
9. `ScrapeCourseCommand` + handler
10. OpenAPI spec + client regen (own commit)
11. Controller + module wiring
12. e2e (mock mode)

---

## Task 1: Domain types, port, and errors

**Files:**

- Create: `apps/backend/src/modules/catalog/domain/scraper/scraper.types.ts`
- Create: `apps/backend/src/modules/catalog/domain/scraper/scraper.port.ts`
- Create: `apps/backend/src/modules/catalog/domain/scraper/scraper.errors.ts`
- Test: `apps/backend/src/modules/catalog/domain/scraper/scraper.errors.spec.ts`

- [ ] **Step 1: Write `scraper.types.ts`**

```ts
/**
 * WHY this file exists:
 * Wire-independent domain types for the scraping subsystem (Stage 2). A
 * ScrapedCourseFragment mirrors the upsert/course.json v2 payload shape (raw
 * names, not resolved entities) plus optional rating fields. Entity resolution
 * and persistence are deliberately out of scope — they belong to Stage 4.
 */
import type { CourseJsonLevel } from '../scan/course-json.schema';

export type ScraperKind = 'url' | 'name' | 'fragment';

export type ScrapeRequest =
  | { readonly kind: 'url'; readonly url: string }
  | { readonly kind: 'name'; readonly query: string }
  | { readonly kind: 'fragment'; readonly raw: string };

export interface ScrapedExternalId {
  readonly source: string;
  readonly externalId: string;
  readonly url?: string;
}

/** Raw scraped metadata — same shape as NormalisedCourseJsonV2 minus sections, plus rating. */
export interface ScrapedCourseFragment {
  readonly title?: string;
  readonly description?: string;
  readonly instructorNames?: string[];
  readonly studioName?: string;
  readonly tags?: string[];
  readonly level?: CourseJsonLevel;
  readonly language?: string;
  readonly releaseDate?: string;
  readonly posterUrl?: string;
  readonly externalIds?: ScrapedExternalId[];
  readonly ratingAverage?: number;
  readonly ratingCount?: number;
}

export interface ScrapeCandidate {
  readonly fragment: ScrapedCourseFragment;
  readonly source: string;
  readonly sourceUrl?: string;
  readonly confidence?: number;
}
```

- [ ] **Step 2: Write `scraper.port.ts`**

```ts
/**
 * WHY this file exists:
 * The Scraper port + SCRAPER_REGISTRY token. Each concrete scraper is a
 * self-contained adapter declaring which invocation kinds it supports and
 * whether it can handle a given URL (for auto-detection). The registry
 * dispatches by id or by URL and exposes only configured scrapers.
 */
import type { ScrapeCandidate, ScrapeRequest, ScraperKind } from './scraper.types';

export interface Scraper {
  readonly id: string;
  readonly supportedKinds: readonly ScraperKind[];
  /** True when this scraper recognises the URL (used for url-kind auto-detect). */
  canHandle(url: string): boolean;
  scrape(request: ScrapeRequest): Promise<ScrapeCandidate[]>;
}

export interface ScraperRegistry {
  /** @throws ScraperNotFoundError when no scraper with this id is configured. */
  get(id: string): Scraper;
  /** All configured scrapers (unconfigured ones, e.g. YouTube without a key, are excluded). */
  all(): readonly Scraper[];
  /** First configured scraper whose canHandle(url) is true; undefined if none match. */
  findByUrl(url: string): Scraper | undefined;
}

export const SCRAPER_REGISTRY = Symbol('SCRAPER_REGISTRY');
```

- [ ] **Step 3: Write `scraper.errors.ts`**

```ts
/**
 * WHY this file exists:
 * Domain errors for the scraping subsystem. They extend DomainError so the
 * global HttpExceptionFilter renders them as RFC 9457 problem responses.
 *   - ScraperNotFoundError       → 404 (unknown source id)
 *   - ScraperKindUnsupportedError → 422 (scraper does not support the kind)
 *   - ScraperNotConfiguredError   → 422 (e.g. YouTube without an API key)
 *   - ScrapeFetchError            → 502 (upstream network/timeout/HTTP failure)
 *   - ScrapeParseError            → 502 (upstream returned unparseable content)
 *   - ScrapeFragmentInvalidError  → 422 (caller-supplied fragment is malformed)
 */
import { DomainError, NotFound } from '../../../../shared/domain-error';

export class ScraperNotFoundError extends NotFound {
  constructor(id: string) {
    super(`No scraper registered for source "${id}".`, 'scraper-not-found');
    this.name = 'ScraperNotFoundError';
  }
}

export class ScraperKindUnsupportedError extends DomainError {
  constructor(id: string, kind: string) {
    super({
      code: 'scraper-kind-unsupported',
      status: 422,
      title: 'Scraper kind unsupported',
      detail: `Scraper "${id}" does not support the "${kind}" invocation kind.`,
    });
    this.name = 'ScraperKindUnsupportedError';
  }
}

export class ScraperNotConfiguredError extends DomainError {
  constructor(id: string) {
    super({
      code: 'scraper-not-configured',
      status: 422,
      title: 'Scraper not configured',
      detail: `Scraper "${id}" is not configured on this instance.`,
    });
    this.name = 'ScraperNotConfiguredError';
  }
}

export class ScrapeFetchError extends DomainError {
  constructor(url: string, cause?: unknown) {
    super({
      code: 'scrape-fetch-failed',
      status: 502,
      title: 'Scrape fetch failed',
      detail: `Failed to fetch "${url}" from the upstream source.`,
      cause,
    });
    this.name = 'ScrapeFetchError';
  }
}

export class ScrapeParseError extends DomainError {
  constructor(source: string, detail: string) {
    super({
      code: 'scrape-parse-failed',
      status: 502,
      title: 'Scrape parse failed',
      detail: `Scraper "${source}" could not parse the upstream response: ${detail}`,
    });
    this.name = 'ScrapeParseError';
  }
}

export class ScrapeFragmentInvalidError extends DomainError {
  constructor(detail: string) {
    super({
      code: 'scrape-fragment-invalid',
      status: 422,
      title: 'Scrape fragment invalid',
      detail,
    });
    this.name = 'ScrapeFragmentInvalidError';
  }
}
```

- [ ] **Step 4: Write the failing errors test**

```ts
// scraper.errors.spec.ts
import { describe, expect, it } from 'vitest';

import {
  ScrapeFetchError,
  ScrapeFragmentInvalidError,
  ScrapeParseError,
  ScraperKindUnsupportedError,
  ScraperNotConfiguredError,
  ScraperNotFoundError,
} from './scraper.errors';

describe('scraper errors', () => {
  it('maps each error to the correct RFC 9457 status and stable code', () => {
    expect(new ScraperNotFoundError('youtube').status).toBe(404);
    expect(new ScraperNotFoundError('youtube').code).toBe('scraper-not-found');

    expect(new ScraperKindUnsupportedError('json-ld', 'name').status).toBe(422);
    expect(new ScraperNotConfiguredError('youtube').status).toBe(422);

    expect(new ScrapeFetchError('https://x.test').status).toBe(502);
    expect(new ScrapeParseError('udemy', 'no JSON-LD').status).toBe(502);
    expect(new ScrapeFragmentInvalidError('bad json').status).toBe(422);
  });

  it('preserves the cause on fetch errors', () => {
    const cause = new Error('ECONNREFUSED');
    expect(new ScrapeFetchError('https://x.test', cause).cause).toBe(cause);
  });
});
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/domain/scraper/scraper.errors.spec.ts`
Expected: PASS (types compile, all assertions green).

- [ ] **Step 6: Lint, format, commit**

```bash
pnpm --filter @app/backend lint --fix
pnpm format
git add apps/backend/src/modules/catalog/domain/scraper/
git commit -m "feat(backend): scraper domain types, port, and errors (Stage 2)"
```

---

## Task 2: `ScrapersConfig` in `AppConfig`

**Files:**

- Modify: `apps/backend/src/common/config/app-config.ts` (add interface + getter)
- Test: `apps/backend/src/common/config/app-config.scrapers.spec.ts`

- [ ] **Step 1: Write the failing config test**

```ts
// app-config.scrapers.spec.ts
import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';

import { AppConfig } from './app-config';

function configWith(env: Record<string, string>): AppConfig {
  return new AppConfig(new ConfigService(env));
}

describe('AppConfig.scrapers', () => {
  it('defaults to real mode with sane http limits and no youtube key', () => {
    const cfg = configWith({}).scrapers;
    expect(cfg.mode).toBe('real');
    expect(cfg.httpTimeoutMs).toBe(10_000);
    expect(cfg.maxResponseBytes).toBe(2_000_000);
    expect(cfg.userAgent).toContain('courseShelf');
    expect(cfg.youtube.configured).toBe(false);
    expect(cfg.udemy.enabled).toBe(true);
  });

  it('marks youtube configured when an API key is present', () => {
    const cfg = configWith({ YOUTUBE_API_KEY: 'AIzaSyExample' }).scrapers;
    expect(cfg.youtube.configured).toBe(true);
    expect(cfg.youtube.apiKey).toBe('AIzaSyExample');
  });

  it('honors mock mode and disabled udemy', () => {
    const cfg = configWith({ SCRAPERS_MODE: 'mock', SCRAPERS_UDEMY_ENABLED: 'false' }).scrapers;
    expect(cfg.mode).toBe('mock');
    expect(cfg.udemy.enabled).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @app/backend test -- src/common/config/app-config.scrapers.spec.ts`
Expected: FAIL — `cfg.scrapers` is undefined / `ScrapersConfig` not exported.

- [ ] **Step 3: Add the interface near the other config interfaces in `app-config.ts`**

Insert after the `ProvidersConfig` interface (it reuses the existing `ProviderMode` type):

```ts
export interface ScrapersConfig {
  /** 'mock' swaps real adapters for fixture-backed ones (used in e2e/CI). Default 'real'. */
  readonly mode: ProviderMode;
  readonly httpTimeoutMs: number;
  readonly maxResponseBytes: number;
  readonly userAgent: string;
  readonly youtube: { readonly configured: boolean; readonly apiKey: string };
  readonly udemy: { readonly enabled: boolean };
}
```

- [ ] **Step 4: Add the getter on the `AppConfig` class**

Place it next to the `providers` getter:

```ts
  get scrapers(): ScrapersConfig {
    const apiKey = this.config.get<string>('YOUTUBE_API_KEY') ?? '';
    return {
      mode: this.stringOrDefault('SCRAPERS_MODE', 'real') as ProviderMode,
      httpTimeoutMs: this.numberOrDefault('SCRAPERS_HTTP_TIMEOUT_MS', 10_000),
      maxResponseBytes: this.numberOrDefault('SCRAPERS_MAX_RESPONSE_BYTES', 2_000_000),
      userAgent: this.stringOrDefault(
        'SCRAPERS_USER_AGENT',
        `courseShelf/${this.runtime.version} (+metadata-scraper)`,
      ),
      youtube: { configured: apiKey.length > 0, apiKey },
      udemy: { enabled: this.boolOrDefault('SCRAPERS_UDEMY_ENABLED', true) },
    };
  }
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @app/backend test -- src/common/config/app-config.scrapers.spec.ts`
Expected: PASS.

- [ ] **Step 6: Lint, format, commit**

```bash
pnpm --filter @app/backend lint --fix
pnpm format
git add apps/backend/src/common/config/
git commit -m "feat(backend): ScrapersConfig (mode/http limits/youtube/udemy) (Stage 2)"
```

---

## Task 3: `HttpFetcher` with SSRF guard

**Files:**

- Create: `apps/backend/src/modules/catalog/infra/scrapers/http-fetcher.ts`
- Test: `apps/backend/src/modules/catalog/infra/scrapers/http-fetcher.spec.ts`

The SSRF guard is pure and independently testable; the fetch path is tested against a loopback test server. Loopback is normally blocked — the test injects an `allowLoopbackForTests` flag so the integration assertions can exercise the real fetch path without disabling the guard in production.

- [ ] **Step 1: Write the failing test**

```ts
// http-fetcher.spec.ts
import { createServer, type Server } from 'node:http';
import { AddressInfo } from 'node:net';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ScrapeFetchError } from '../../domain/scraper/scraper.errors';
import { HttpFetcher, isBlockedHostname } from './http-fetcher';

const cfg = {
  httpTimeoutMs: 1000,
  maxResponseBytes: 1024,
  userAgent: 'courseShelf-test',
};

describe('isBlockedHostname', () => {
  it('blocks loopback, private, link-local and metadata addresses', async () => {
    expect(await isBlockedHostname('127.0.0.1')).toBe(true);
    expect(await isBlockedHostname('::1')).toBe(true);
    expect(await isBlockedHostname('10.0.0.5')).toBe(true);
    expect(await isBlockedHostname('192.168.1.1')).toBe(true);
    expect(await isBlockedHostname('172.16.4.4')).toBe(true);
    expect(await isBlockedHostname('169.254.169.254')).toBe(true);
    expect(await isBlockedHostname('0.0.0.0')).toBe(true);
  });

  it('allows a public address', async () => {
    expect(await isBlockedHostname('93.184.216.34')).toBe(false); // example.com
  });
});

describe('HttpFetcher', () => {
  let server: Server;
  let base: string;

  beforeAll(async () => {
    server = createServer((req, res) => {
      if (req.url === '/ok') {
        res.writeHead(200, { 'content-type': 'text/html' }).end('<html>ok</html>');
      } else if (req.url === '/huge') {
        res.writeHead(200).end('x'.repeat(5000));
      } else {
        res.writeHead(404).end('nope');
      }
    });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(() => server.close());

  it('rejects non-http(s) schemes', async () => {
    const f = new HttpFetcher(cfg);
    await expect(f.fetchText('file:///etc/passwd')).rejects.toBeInstanceOf(ScrapeFetchError);
  });

  it('rejects loopback by default (SSRF guard)', async () => {
    const f = new HttpFetcher(cfg);
    await expect(f.fetchText(`${base}/ok`)).rejects.toBeInstanceOf(ScrapeFetchError);
  });

  it('fetches text when loopback is explicitly allowed', async () => {
    const f = new HttpFetcher({ ...cfg, allowLoopbackForTests: true });
    const result = await f.fetchText(`${base}/ok`);
    expect(result.status).toBe(200);
    expect(result.body).toContain('ok');
  });

  it('aborts when the response exceeds maxResponseBytes', async () => {
    const f = new HttpFetcher({ ...cfg, allowLoopbackForTests: true });
    await expect(f.fetchText(`${base}/huge`)).rejects.toBeInstanceOf(ScrapeFetchError);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/infra/scrapers/http-fetcher.spec.ts`
Expected: FAIL — module `./http-fetcher` not found.

- [ ] **Step 3: Implement `http-fetcher.ts`**

```ts
/**
 * WHY this file exists:
 * The single outbound-HTTP egress point for the scraping subsystem. Wraps the
 * Node-native fetch with a timeout, a response-size cap, a fixed User-Agent,
 * a bounded redirect chain, and an SSRF guard that resolves the hostname and
 * rejects loopback / private / link-local / cloud-metadata addresses on every
 * hop. Self-hosted single-admin threat model — the guard is defence-in-depth.
 */
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

import { ScrapeFetchError } from '../../domain/scraper/scraper.errors';

export interface HttpFetcherConfig {
  readonly httpTimeoutMs: number;
  readonly maxResponseBytes: number;
  readonly userAgent: string;
  /** Test-only: permit loopback targets so the spec can hit a local server. Never set in prod. */
  readonly allowLoopbackForTests?: boolean;
}

export interface FetchResult {
  readonly status: number;
  readonly headers: Headers;
  readonly body: string;
}

const MAX_REDIRECTS = 5;

function ipIsBlocked(ip: string, allowLoopback: boolean): boolean {
  const v = isIP(ip);
  if (v === 4) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 0) return true;
    if (a === 127) return !allowLoopback; // loopback
    if (a === 10) return true; // private
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 169 && b === 254) return true; // link-local + metadata
    return false;
  }
  if (v === 6) {
    const lower = ip.toLowerCase();
    if (lower === '::1') return !allowLoopback; // loopback
    if (lower === '::') return true;
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique-local fc00::/7
    if (lower.startsWith('fe80')) return true; // link-local
    return false;
  }
  return true; // not a literal IP — caller resolves DNS first
}

/** Resolve hostname (or accept literal IP) and decide whether it must be blocked. */
export async function isBlockedHostname(hostname: string, allowLoopback = false): Promise<boolean> {
  if (isIP(hostname) !== 0) {
    return ipIsBlocked(hostname, allowLoopback);
  }
  try {
    const records = await lookup(hostname, { all: true });
    if (records.length === 0) return true;
    return records.some((r) => ipIsBlocked(r.address, allowLoopback));
  } catch {
    return true; // unresolvable → block
  }
}

export class HttpFetcher {
  constructor(private readonly config: HttpFetcherConfig) {}

  async fetchText(rawUrl: string): Promise<FetchResult> {
    let currentUrl = rawUrl;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
      const url = this.parseAndGuard(currentUrl);
      // eslint-disable-next-line no-await-in-loop -- redirects are inherently sequential
      const guardBlocked = await isBlockedHostname(
        url.hostname,
        this.config.allowLoopbackForTests ?? false,
      );
      if (guardBlocked) {
        throw new ScrapeFetchError(rawUrl, new Error(`Blocked address for host ${url.hostname}`));
      }
      // eslint-disable-next-line no-await-in-loop -- sequential redirect handling
      const res = await this.doFetch(url, rawUrl);
      if (res.status >= 300 && res.status < 400 && res.headers.has('location')) {
        currentUrl = new URL(res.headers.get('location') as string, url).toString();
        continue;
      }
      return res;
    }
    throw new ScrapeFetchError(rawUrl, new Error('Too many redirects'));
  }

  private parseAndGuard(rawUrl: string): URL {
    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch {
      throw new ScrapeFetchError(rawUrl, new Error('Malformed URL'));
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new ScrapeFetchError(rawUrl, new Error(`Unsupported scheme ${url.protocol}`));
    }
    return url;
  }

  private async doFetch(url: URL, rawUrl: string): Promise<FetchResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.httpTimeoutMs);
    try {
      const res = await fetch(url, {
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'user-agent': this.config.userAgent, accept: 'text/html,application/json' },
      });
      if (res.status >= 300 && res.status < 400) {
        return { status: res.status, headers: res.headers, body: '' };
      }
      const body = await this.readCapped(res, rawUrl);
      return { status: res.status, headers: res.headers, body };
    } catch (error) {
      if (error instanceof ScrapeFetchError) throw error;
      throw new ScrapeFetchError(rawUrl, error);
    } finally {
      clearTimeout(timer);
    }
  }

  private async readCapped(res: Response, rawUrl: string): Promise<string> {
    if (!res.body) return '';
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      // eslint-disable-next-line no-await-in-loop -- streaming read
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > this.config.maxResponseBytes) {
        await reader.cancel();
        throw new ScrapeFetchError(rawUrl, new Error('Response exceeds max size'));
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks).toString('utf8');
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/infra/scrapers/http-fetcher.spec.ts`
Expected: PASS (the public-address case may resolve DNS; if the CI sandbox blocks DNS, the test's public IP literal `93.184.216.34` avoids a lookup and stays deterministic).

- [ ] **Step 5: Lint, format, commit**

```bash
pnpm --filter @app/backend lint --fix
pnpm format
git add apps/backend/src/modules/catalog/infra/scrapers/http-fetcher.ts apps/backend/src/modules/catalog/infra/scrapers/http-fetcher.spec.ts
git commit -m "feat(backend): SSRF-guarded HttpFetcher for scrapers (Stage 2)"
```

---

## Task 4: `HtmlMetadataExtractor` (+ `cheerio` dependency)

**Files:**

- Modify: `apps/backend/package.json` (add `cheerio`)
- Create: `apps/backend/src/modules/catalog/infra/scrapers/html-metadata.extractor.ts`
- Test: `apps/backend/src/modules/catalog/infra/scrapers/html-metadata.extractor.spec.ts`

- [ ] **Step 1: Add the cheerio dependency**

```bash
pnpm --filter @app/backend add cheerio@^1.0.0
```

Verify it landed: `cat apps/backend/package.json | jq '.dependencies.cheerio'` → `"^1.0.0"`.

- [ ] **Step 2: Write the failing test**

```ts
// html-metadata.extractor.spec.ts
import { describe, expect, it } from 'vitest';

import { HtmlMetadataExtractor } from './html-metadata.extractor';

const extractor = new HtmlMetadataExtractor();

const jsonLdHtml = `<!doctype html><html><head>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Course","name":"Advanced TS",
 "description":"Deep dive","provider":{"@type":"Organization","name":"Acme Edu"},
 "instructor":[{"@type":"Person","name":"Jane Doe"}],
 "image":"https://cdn.test/poster.jpg","inLanguage":"en",
 "aggregateRating":{"@type":"AggregateRating","ratingValue":4.7,"ratingCount":1234}}
</script></head><body></body></html>`;

const ogOnlyHtml = `<!doctype html><html><head>
<meta property="og:title" content="OG Course"/>
<meta property="og:description" content="From OG"/>
<meta property="og:image" content="https://cdn.test/og.png"/>
</head><body></body></html>`;

describe('HtmlMetadataExtractor', () => {
  it('extracts a fragment from schema.org Course JSON-LD', () => {
    const f = extractor.extract(jsonLdHtml);
    expect(f.title).toBe('Advanced TS');
    expect(f.description).toBe('Deep dive');
    expect(f.studioName).toBe('Acme Edu');
    expect(f.instructorNames).toEqual(['Jane Doe']);
    expect(f.posterUrl).toBe('https://cdn.test/poster.jpg');
    expect(f.language).toBe('en');
    expect(f.ratingAverage).toBe(4.7);
    expect(f.ratingCount).toBe(1234);
  });

  it('falls back to OpenGraph when no JSON-LD is present', () => {
    const f = extractor.extract(ogOnlyHtml);
    expect(f.title).toBe('OG Course');
    expect(f.description).toBe('From OG');
    expect(f.posterUrl).toBe('https://cdn.test/og.png');
  });

  it('returns an empty fragment when nothing is extractable', () => {
    expect(extractor.extract('<html><body>nothing</body></html>')).toEqual({});
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/infra/scrapers/html-metadata.extractor.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `html-metadata.extractor.ts`**

```ts
/**
 * WHY this file exists:
 * Parses an HTML document and extracts a ScrapedCourseFragment from schema.org
 * JSON-LD (Course / VideoObject / Person / Organization / aggregateRating) and,
 * as a fallback, OpenGraph meta tags. Pure: a string in, a fragment out — no
 * network, no DI. JSON-LD wins over OpenGraph on conflict.
 */
import * as cheerio from 'cheerio';

import type { ScrapedCourseFragment } from '../../domain/scraper/scraper.types';

type JsonLdNode = Record<string, unknown>;

function asArray<T>(v: T | T[] | undefined): T[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

function num(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return undefined;
}

export class HtmlMetadataExtractor {
  extract(html: string): ScrapedCourseFragment {
    const $ = cheerio.load(html);
    const fromJsonLd = this.fromJsonLd($);
    const fromOg = this.fromOpenGraph($);
    // JSON-LD wins; OG fills gaps.
    return { ...fromOg, ...fromJsonLd };
  }

  private collectJsonLdNodes($: cheerio.CheerioAPI): JsonLdNode[] {
    const nodes: JsonLdNode[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      const raw = $(el).contents().text();
      try {
        const parsed: unknown = JSON.parse(raw);
        for (const entry of asArray(parsed as JsonLdNode | JsonLdNode[])) {
          if (entry && typeof entry === 'object') {
            const graph = (entry as JsonLdNode)['@graph'];
            if (Array.isArray(graph)) nodes.push(...(graph as JsonLdNode[]));
            else nodes.push(entry);
          }
        }
      } catch {
        // ignore a single malformed block; other blocks may still parse
      }
    });
    return nodes;
  }

  private fromJsonLd($: cheerio.CheerioAPI): ScrapedCourseFragment {
    const nodes = this.collectJsonLdNodes($);
    const course =
      nodes.find((n) => {
        const t = n['@type'];
        return t === 'Course' || t === 'VideoObject' || (Array.isArray(t) && t.includes('Course'));
      }) ?? nodes[0];
    if (!course) return {};

    const fragment: Record<string, unknown> = {};
    const title = str(course['name']);
    if (title) fragment['title'] = title;
    const description = str(course['description']);
    if (description) fragment['description'] = description;
    const image = course['image'];
    const posterUrl = str(typeof image === 'object' ? (image as JsonLdNode)['url'] : image);
    if (posterUrl) fragment['posterUrl'] = posterUrl;
    const language = str(course['inLanguage']);
    if (language) fragment['language'] = language;

    const provider = course['provider'] ?? course['publisher'];
    const studioName = str(provider && (provider as JsonLdNode)['name']);
    if (studioName) fragment['studioName'] = studioName;

    const instructors = asArray(course['instructor'] as JsonLdNode | JsonLdNode[])
      .map((p) => str(p && p['name']))
      .filter((n): n is string => n !== undefined);
    if (instructors.length > 0) fragment['instructorNames'] = instructors;

    const rating = course['aggregateRating'] as JsonLdNode | undefined;
    if (rating) {
      const avg = num(rating['ratingValue']);
      const count = num(rating['ratingCount'] ?? rating['reviewCount']);
      if (avg !== undefined) fragment['ratingAverage'] = avg;
      if (count !== undefined) fragment['ratingCount'] = count;
    }
    return fragment as ScrapedCourseFragment;
  }

  private fromOpenGraph($: cheerio.CheerioAPI): ScrapedCourseFragment {
    const og = (prop: string): string | undefined =>
      str($(`meta[property="og:${prop}"]`).attr('content'));
    const fragment: Record<string, unknown> = {};
    const title = og('title');
    if (title) fragment['title'] = title;
    const description = og('description');
    if (description) fragment['description'] = description;
    const image = og('image');
    if (image) fragment['posterUrl'] = image;
    return fragment as ScrapedCourseFragment;
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/infra/scrapers/html-metadata.extractor.spec.ts`
Expected: PASS.

- [ ] **Step 6: Lint, format, commit**

```bash
pnpm --filter @app/backend lint --fix
pnpm format
git add apps/backend/package.json apps/backend/src/modules/catalog/infra/scrapers/html-metadata.extractor.ts apps/backend/src/modules/catalog/infra/scrapers/html-metadata.extractor.spec.ts ../../pnpm-lock.yaml
git commit -m "feat(backend): cheerio-based HtmlMetadataExtractor (JSON-LD + OpenGraph) (Stage 2)"
```

(If `pnpm-lock.yaml` lives at repo root, stage it from there: `git add pnpm-lock.yaml`.)

---

## Task 5: `JsonLdScraper`

**Files:**

- Create: `apps/backend/src/modules/catalog/infra/scrapers/json-ld.scraper.ts`
- Test: `apps/backend/src/modules/catalog/infra/scrapers/json-ld.scraper.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// json-ld.scraper.spec.ts
import { describe, expect, it } from 'vitest';

import { HtmlMetadataExtractor } from './html-metadata.extractor';
import { JsonLdScraper } from './json-ld.scraper';
import type { FetchResult, HttpFetcher } from './http-fetcher';

function fakeFetcher(body: string): HttpFetcher {
  return {
    fetchText: async (): Promise<FetchResult> => ({ status: 200, headers: new Headers(), body }),
  } as unknown as HttpFetcher;
}

const html = `<html><head><script type="application/ld+json">
{"@context":"https://schema.org","@type":"Course","name":"Generic Course"}
</script></head></html>`;

describe('JsonLdScraper', () => {
  it('declares id, supported kinds and handles any URL (generic fallback)', () => {
    const s = new JsonLdScraper(fakeFetcher(html), new HtmlMetadataExtractor());
    expect(s.id).toBe('json-ld');
    expect([...s.supportedKinds]).toEqual(['url', 'fragment']);
    expect(s.canHandle('https://anything.test/x')).toBe(true);
  });

  it('scrapes a url into a single candidate', async () => {
    const s = new JsonLdScraper(fakeFetcher(html), new HtmlMetadataExtractor());
    const candidates = await s.scrape({ kind: 'url', url: 'https://x.test/c' });
    expect(candidates).toHaveLength(1);
    expect(candidates[0].fragment.title).toBe('Generic Course');
    expect(candidates[0].source).toBe('json-ld');
    expect(candidates[0].sourceUrl).toBe('https://x.test/c');
  });

  it('returns an empty list when nothing is extractable', async () => {
    const s = new JsonLdScraper(fakeFetcher('<html></html>'), new HtmlMetadataExtractor());
    expect(await s.scrape({ kind: 'url', url: 'https://x.test/c' })).toEqual([]);
  });

  it('parses a raw HTML fragment', async () => {
    const s = new JsonLdScraper(fakeFetcher(''), new HtmlMetadataExtractor());
    const candidates = await s.scrape({ kind: 'fragment', raw: html });
    expect(candidates[0].fragment.title).toBe('Generic Course');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/infra/scrapers/json-ld.scraper.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `json-ld.scraper.ts`**

```ts
/**
 * WHY this file exists:
 * The generic fallback scraper. Fetches an arbitrary URL (or accepts a raw
 * HTML fragment) and extracts schema.org JSON-LD / OpenGraph metadata. It
 * canHandle() any URL, so the registry must consult it last during URL
 * auto-detection (after the site-specific scrapers).
 */
import type { HtmlMetadataExtractor } from './html-metadata.extractor';
import type { HttpFetcher } from './http-fetcher';
import type { Scraper } from '../../domain/scraper/scraper.port';
import type {
  ScrapeCandidate,
  ScrapeRequest,
  ScrapedCourseFragment,
  ScraperKind,
} from '../../domain/scraper/scraper.types';

// Plain class — constructed manually by the SCRAPER_REGISTRY factory in
// catalog.module.ts (and by tests) with positional args. No DI decorators,
// because the registry is built conditionally (e.g. YouTube only when keyed).
export class JsonLdScraper implements Scraper {
  readonly id = 'json-ld';
  readonly supportedKinds: readonly ScraperKind[] = ['url', 'fragment'];

  constructor(
    private readonly fetcher: HttpFetcher,
    private readonly extractor: HtmlMetadataExtractor,
  ) {}

  canHandle(): boolean {
    return true;
  }

  async scrape(request: ScrapeRequest): Promise<ScrapeCandidate[]> {
    if (request.kind === 'url') {
      const { body } = await this.fetcher.fetchText(request.url);
      return this.toCandidates(this.extractor.extract(body), request.url);
    }
    if (request.kind === 'fragment') {
      return this.toCandidates(this.extractor.extract(request.raw));
    }
    return [];
  }

  private toCandidates(fragment: ScrapedCourseFragment, sourceUrl?: string): ScrapeCandidate[] {
    if (Object.keys(fragment).length === 0) return [];
    return [{ fragment, source: this.id, ...(sourceUrl ? { sourceUrl } : {}) }];
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/infra/scrapers/json-ld.scraper.spec.ts`
Expected: PASS.

- [ ] **Step 5: Lint, format, commit**

```bash
pnpm --filter @app/backend lint --fix
pnpm format
git add apps/backend/src/modules/catalog/infra/scrapers/json-ld.scraper.ts apps/backend/src/modules/catalog/infra/scrapers/json-ld.scraper.spec.ts
git commit -m "feat(backend): JsonLdScraper generic fallback (Stage 2)"
```

---

## Task 6: `YouTubeScraper`

**Files:**

- Create: `apps/backend/src/modules/catalog/infra/scrapers/youtube.scraper.ts`
- Test: `apps/backend/src/modules/catalog/infra/scrapers/youtube.scraper.spec.ts`

The scraper depends on the YouTube Data API v3. It reads JSON from `HttpFetcher.fetchText` and maps it. The API key is passed in via constructor (the registry only constructs it when configured).

- [ ] **Step 1: Write the failing test**

```ts
// youtube.scraper.spec.ts
import { describe, expect, it, vi } from 'vitest';

import { YouTubeScraper } from './youtube.scraper';
import type { FetchResult, HttpFetcher } from './http-fetcher';

function fetcherReturning(map: Record<string, unknown>): HttpFetcher {
  return {
    fetchText: vi.fn(async (url: string): Promise<FetchResult> => {
      const key = Object.keys(map).find((k) => url.includes(k)) ?? '';
      return { status: 200, headers: new Headers(), body: JSON.stringify(map[key] ?? {}) };
    }),
  } as unknown as HttpFetcher;
}

const playlistResponse = {
  items: [
    {
      id: 'PL123',
      snippet: {
        title: 'Rust Course',
        description: 'Learn Rust',
        channelTitle: 'Rustacean',
        thumbnails: { high: { url: 'https://i.ytimg.com/p.jpg' } },
        defaultLanguage: 'en',
      },
    },
  ],
};

describe('YouTubeScraper', () => {
  it('handles youtube URLs and supports url/name/fragment', () => {
    const s = new YouTubeScraper(fetcherReturning({}), 'KEY');
    expect(s.id).toBe('youtube');
    expect([...s.supportedKinds]).toEqual(['url', 'name', 'fragment']);
    expect(s.canHandle('https://www.youtube.com/playlist?list=PL123')).toBe(true);
    expect(s.canHandle('https://youtu.be/abc')).toBe(true);
    expect(s.canHandle('https://example.com')).toBe(false);
  });

  it('scrapes a playlist URL into a candidate', async () => {
    const s = new YouTubeScraper(fetcherReturning({ 'playlists?': playlistResponse }), 'KEY');
    const candidates = await s.scrape({
      kind: 'url',
      url: 'https://www.youtube.com/playlist?list=PL123',
    });
    expect(candidates).toHaveLength(1);
    expect(candidates[0].fragment.title).toBe('Rust Course');
    expect(candidates[0].fragment.studioName).toBe('Rustacean');
    expect(candidates[0].fragment.externalIds).toEqual([
      { source: 'youtube', externalId: 'youtube:playlist:PL123', url: expect.any(String) },
    ]);
  });

  it('returns empty when a url has no recognisable playlist or video id', async () => {
    const s = new YouTubeScraper(fetcherReturning({}), 'KEY');
    expect(await s.scrape({ kind: 'url', url: 'https://youtube.com/feed' })).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/infra/scrapers/youtube.scraper.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `youtube.scraper.ts`**

```ts
/**
 * WHY this file exists:
 * Scrapes course metadata from YouTube via the Data API v3. Playlists map to a
 * course (channel → studio, title/description, thumbnail → poster). name-kind
 * uses search.list. Constructed only when an API key is configured; the
 * registry omits it otherwise. All external ids are namespaced
 * "youtube:playlist:<id>" / "youtube:video:<id>".
 */
import { ScrapeFetchError } from '../../domain/scraper/scraper.errors';
import type { HttpFetcher } from './http-fetcher';
import type { Scraper } from '../../domain/scraper/scraper.port';
import type {
  ScrapeCandidate,
  ScrapeRequest,
  ScrapedCourseFragment,
  ScraperKind,
} from '../../domain/scraper/scraper.types';

const API = 'https://www.googleapis.com/youtube/v3';

interface YtSnippet {
  title?: string;
  description?: string;
  channelTitle?: string;
  defaultLanguage?: string;
  thumbnails?: Record<string, { url?: string }>;
}
interface YtItem {
  id?: string;
  snippet?: YtSnippet;
}
interface YtListResponse {
  items?: YtItem[];
}

export class YouTubeScraper implements Scraper {
  readonly id = 'youtube';
  readonly supportedKinds: readonly ScraperKind[] = ['url', 'name', 'fragment'];

  constructor(
    private readonly fetcher: HttpFetcher,
    private readonly apiKey: string,
  ) {}

  canHandle(url: string): boolean {
    try {
      const host = new URL(url).hostname.replace(/^www\./, '');
      return host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be';
    } catch {
      return false;
    }
  }

  async scrape(request: ScrapeRequest): Promise<ScrapeCandidate[]> {
    if (request.kind === 'url') {
      const playlistId = this.playlistId(request.url);
      if (playlistId) return this.scrapePlaylist(playlistId);
      const videoId = this.videoId(request.url);
      if (videoId) return this.scrapeVideo(videoId);
      return [];
    }
    if (request.kind === 'name') return this.search(request.query);
    if (request.kind === 'fragment') {
      // Treat a raw fragment as a bare URL or playlist id.
      const id =
        this.playlistId(request.raw) ?? (/^PL[\w-]+$/.test(request.raw) ? request.raw : undefined);
      return id ? this.scrapePlaylist(id) : [];
    }
    return [];
  }

  private playlistId(url: string): string | undefined {
    try {
      return new URL(url).searchParams.get('list') ?? undefined;
    } catch {
      return undefined;
    }
  }

  private videoId(url: string): string | undefined {
    try {
      const u = new URL(url);
      if (u.hostname.replace(/^www\./, '') === 'youtu.be') return u.pathname.slice(1) || undefined;
      return u.searchParams.get('v') ?? undefined;
    } catch {
      return undefined;
    }
  }

  private async getJson<T>(path: string): Promise<T> {
    const sep = path.includes('?') ? '&' : '?';
    const { body } = await this.fetcher.fetchText(`${API}${path}${sep}key=${this.apiKey}`);
    try {
      return JSON.parse(body) as T;
    } catch (error) {
      throw new ScrapeFetchError(`${API}${path}`, error);
    }
  }

  private async scrapePlaylist(id: string): Promise<ScrapeCandidate[]> {
    const res = await this.getJson<YtListResponse>(`/playlists?part=snippet&id=${id}`);
    const item = res.items?.[0];
    if (!item?.snippet) return [];
    const url = `https://www.youtube.com/playlist?list=${id}`;
    return [
      {
        fragment: this.toFragment(item.snippet, 'playlist', id, url),
        source: this.id,
        sourceUrl: url,
      },
    ];
  }

  private async scrapeVideo(id: string): Promise<ScrapeCandidate[]> {
    const res = await this.getJson<YtListResponse>(`/videos?part=snippet&id=${id}`);
    const item = res.items?.[0];
    if (!item?.snippet) return [];
    const url = `https://www.youtube.com/watch?v=${id}`;
    return [
      {
        fragment: this.toFragment(item.snippet, 'video', id, url),
        source: this.id,
        sourceUrl: url,
      },
    ];
  }

  private async search(query: string): Promise<ScrapeCandidate[]> {
    const res = await this.getJson<{
      items?: { id?: { playlistId?: string }; snippet?: YtSnippet }[];
    }>(`/search?part=snippet&type=playlist&maxResults=5&q=${encodeURIComponent(query)}`);
    return (res.items ?? [])
      .filter((i) => i.id?.playlistId && i.snippet)
      .map((i) => {
        const pid = i.id!.playlistId!;
        const url = `https://www.youtube.com/playlist?list=${pid}`;
        return {
          fragment: this.toFragment(i.snippet!, 'playlist', pid, url),
          source: this.id,
          sourceUrl: url,
          confidence: 0.5,
        };
      });
  }

  private toFragment(
    snippet: YtSnippet,
    kind: 'playlist' | 'video',
    id: string,
    url: string,
  ): ScrapedCourseFragment {
    const poster =
      snippet.thumbnails?.['maxres']?.url ??
      snippet.thumbnails?.['high']?.url ??
      snippet.thumbnails?.['default']?.url;
    const fragment: Record<string, unknown> = {
      externalIds: [{ source: 'youtube', externalId: `youtube:${kind}:${id}`, url }],
    };
    if (snippet.title) fragment['title'] = snippet.title;
    if (snippet.description) fragment['description'] = snippet.description;
    if (snippet.channelTitle) fragment['studioName'] = snippet.channelTitle;
    if (snippet.defaultLanguage) fragment['language'] = snippet.defaultLanguage;
    if (poster) fragment['posterUrl'] = poster;
    return fragment as ScrapedCourseFragment;
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/infra/scrapers/youtube.scraper.spec.ts`
Expected: PASS.

- [ ] **Step 5: Lint, format, commit**

```bash
pnpm --filter @app/backend lint --fix
pnpm format
git add apps/backend/src/modules/catalog/infra/scrapers/youtube.scraper.ts apps/backend/src/modules/catalog/infra/scrapers/youtube.scraper.spec.ts
git commit -m "feat(backend): YouTubeScraper (Data API v3, playlist/video/search) (Stage 2)"
```

---

## Task 7: `UdemyScraper`

**Files:**

- Create: `apps/backend/src/modules/catalog/infra/scrapers/udemy.scraper.ts`
- Test: `apps/backend/src/modules/catalog/infra/scrapers/udemy.scraper.spec.ts`

Bespoke landing-page scraper. Defensive: parse the embedded JSON-LD via the shared extractor; never throw on missing data — return `[]`. `name`-search is best-effort and may return `[]`.

- [ ] **Step 1: Write the failing test**

```ts
// udemy.scraper.spec.ts
import { describe, expect, it } from 'vitest';

import { HtmlMetadataExtractor } from './html-metadata.extractor';
import { UdemyScraper } from './udemy.scraper';
import type { FetchResult, HttpFetcher } from './http-fetcher';

function fakeFetcher(body: string): HttpFetcher {
  return {
    fetchText: async (): Promise<FetchResult> => ({ status: 200, headers: new Headers(), body }),
  } as unknown as HttpFetcher;
}

const courseHtml = `<html><head><script type="application/ld+json">
{"@context":"https://schema.org","@type":"Course","name":"Docker Mastery",
 "description":"Containers","provider":{"@type":"Organization","name":"Udemy"},
 "aggregateRating":{"ratingValue":4.6,"ratingCount":98765}}
</script></head></html>`;

describe('UdemyScraper', () => {
  it('handles udemy course URLs and supports all kinds', () => {
    const s = new UdemyScraper(fakeFetcher(courseHtml), new HtmlMetadataExtractor());
    expect(s.id).toBe('udemy');
    expect([...s.supportedKinds]).toEqual(['url', 'name', 'fragment']);
    expect(s.canHandle('https://www.udemy.com/course/docker-mastery/')).toBe(true);
    expect(s.canHandle('https://example.com')).toBe(false);
  });

  it('scrapes a course landing page via embedded JSON-LD', async () => {
    const s = new UdemyScraper(fakeFetcher(courseHtml), new HtmlMetadataExtractor());
    const candidates = await s.scrape({
      kind: 'url',
      url: 'https://www.udemy.com/course/docker-mastery/',
    });
    expect(candidates).toHaveLength(1);
    expect(candidates[0].fragment.title).toBe('Docker Mastery');
    expect(candidates[0].fragment.ratingAverage).toBe(4.6);
    expect(candidates[0].fragment.externalIds?.[0].source).toBe('udemy');
  });

  it('degrades to an empty list when the page has no metadata', async () => {
    const s = new UdemyScraper(fakeFetcher('<html>blocked</html>'), new HtmlMetadataExtractor());
    expect(await s.scrape({ kind: 'url', url: 'https://www.udemy.com/course/x/' })).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/infra/scrapers/udemy.scraper.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `udemy.scraper.ts`**

```ts
/**
 * WHY this file exists:
 * Bespoke scraper for Udemy course landing pages. Udemy embeds schema.org
 * Course JSON-LD, so we reuse HtmlMetadataExtractor and enrich it with a
 * udemy: external id derived from the course slug in the URL. Deliberately
 * defensive — the page layout is brittle and may change without notice, so any
 * miss yields an empty result rather than an error. name-search is best-effort.
 */
import type { HtmlMetadataExtractor } from './html-metadata.extractor';
import type { HttpFetcher } from './http-fetcher';
import type { Scraper } from '../../domain/scraper/scraper.port';
import type {
  ScrapeCandidate,
  ScrapeRequest,
  ScrapedCourseFragment,
  ScraperKind,
} from '../../domain/scraper/scraper.types';

// Plain class — constructed manually by the SCRAPER_REGISTRY factory (and tests)
// with positional args, like the other scrapers.
export class UdemyScraper implements Scraper {
  readonly id = 'udemy';
  readonly supportedKinds: readonly ScraperKind[] = ['url', 'name', 'fragment'];

  constructor(
    private readonly fetcher: HttpFetcher,
    private readonly extractor: HtmlMetadataExtractor,
  ) {}

  canHandle(url: string): boolean {
    try {
      const u = new URL(url);
      return (
        u.hostname.replace(/^www\./, '').endsWith('udemy.com') && u.pathname.includes('/course/')
      );
    } catch {
      return false;
    }
  }

  async scrape(request: ScrapeRequest): Promise<ScrapeCandidate[]> {
    if (request.kind === 'url') return this.scrapeUrl(request.url);
    if (request.kind === 'fragment') {
      const fragment = this.extractor.extract(request.raw);
      return Object.keys(fragment).length === 0 ? [] : [{ fragment, source: this.id }];
    }
    // name-kind: best-effort. Udemy has no stable public search; return empty
    // until/if an official API is wired. Documented as expected behaviour.
    return [];
  }

  private async scrapeUrl(url: string): Promise<ScrapeCandidate[]> {
    const { body } = await this.fetcher.fetchText(url);
    const base = this.extractor.extract(body);
    if (Object.keys(base).length === 0) return [];
    const slug = this.courseSlug(url);
    const fragment: ScrapedCourseFragment = slug
      ? {
          ...base,
          externalIds: [
            ...(base.externalIds ?? []),
            { source: 'udemy', externalId: `udemy:course:${slug}`, url },
          ],
        }
      : base;
    return [{ fragment, source: this.id, sourceUrl: url }];
  }

  private courseSlug(url: string): string | undefined {
    try {
      const segments = new URL(url).pathname.split('/').filter(Boolean);
      const idx = segments.indexOf('course');
      return idx >= 0 ? segments[idx + 1] : undefined;
    } catch {
      return undefined;
    }
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/infra/scrapers/udemy.scraper.spec.ts`
Expected: PASS.

- [ ] **Step 5: Lint, format, commit**

```bash
pnpm --filter @app/backend lint --fix
pnpm format
git add apps/backend/src/modules/catalog/infra/scrapers/udemy.scraper.ts apps/backend/src/modules/catalog/infra/scrapers/udemy.scraper.spec.ts
git commit -m "feat(backend): bespoke UdemyScraper (defensive landing-page) (Stage 2)"
```

---

## Task 8: Mock scrapers + `ScraperRegistry`

**Files:**

- Create: `apps/backend/src/modules/catalog/infra/scrapers/mock.scrapers.ts`
- Create: `apps/backend/src/modules/catalog/infra/scrapers/scraper.registry.ts`
- Test: `apps/backend/src/modules/catalog/infra/scrapers/scraper.registry.spec.ts`

The registry holds the scrapers it is constructed with. `findByUrl` consults site-specific scrapers (which return `false` for unrelated URLs) before the generic `json-ld` fallback (which returns `true` for everything) — so order matters: generic must be last.

- [ ] **Step 1: Write the failing test**

```ts
// scraper.registry.spec.ts
import { describe, expect, it } from 'vitest';

import { ScraperNotFoundError } from '../../domain/scraper/scraper.errors';
import { DefaultScraperRegistry } from './scraper.registry';
import type { Scraper } from '../../domain/scraper/scraper.port';

function stub(id: string, handles: (u: string) => boolean): Scraper {
  return { id, supportedKinds: ['url'], canHandle: handles, scrape: async () => [] };
}

const youtube = stub('youtube', (u) => u.includes('youtube'));
const jsonLd = stub('json-ld', () => true);

describe('DefaultScraperRegistry', () => {
  it('get() returns by id and throws ScraperNotFoundError otherwise', () => {
    const r = new DefaultScraperRegistry([youtube, jsonLd]);
    expect(r.get('youtube')).toBe(youtube);
    expect(() => r.get('nope')).toThrow(ScraperNotFoundError);
  });

  it('all() returns every registered scraper', () => {
    const r = new DefaultScraperRegistry([youtube, jsonLd]);
    expect(r.all().map((s) => s.id)).toEqual(['youtube', 'json-ld']);
  });

  it('findByUrl() prefers a site-specific scraper over the generic fallback', () => {
    const r = new DefaultScraperRegistry([youtube, jsonLd]);
    expect(r.findByUrl('https://youtube.com/playlist?list=1')?.id).toBe('youtube');
    expect(r.findByUrl('https://example.com')?.id).toBe('json-ld');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/infra/scrapers/scraper.registry.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `scraper.registry.ts`**

```ts
/**
 * WHY this file exists:
 * The concrete ScraperRegistry. Constructed with the list of configured
 * scrapers (the module decides which are configured — e.g. YouTube only when a
 * key is present). findByUrl scans in construction order, so callers must place
 * the generic json-ld fallback (canHandle ⇒ true) LAST.
 */
import { ScraperNotFoundError } from '../../domain/scraper/scraper.errors';
import type { Scraper, ScraperRegistry } from '../../domain/scraper/scraper.port';

export class DefaultScraperRegistry implements ScraperRegistry {
  private readonly byId: Map<string, Scraper>;

  constructor(private readonly scrapers: readonly Scraper[]) {
    this.byId = new Map(scrapers.map((s) => [s.id, s]));
  }

  get(id: string): Scraper {
    const scraper = this.byId.get(id);
    if (!scraper) throw new ScraperNotFoundError(id);
    return scraper;
  }

  all(): readonly Scraper[] {
    return this.scrapers;
  }

  findByUrl(url: string): Scraper | undefined {
    return this.scrapers.find((s) => s.canHandle(url));
  }
}
```

- [ ] **Step 4: Implement `mock.scrapers.ts` (fixture-backed, for `mode:mock`)**

```ts
/**
 * WHY this file exists:
 * Deterministic, network-free scrapers used when SCRAPERS_MODE=mock (e2e/CI).
 * They mirror the real scrapers' ids and supportedKinds so the registry and
 * controller behave identically without any outbound HTTP.
 */
import type { Scraper } from '../../domain/scraper/scraper.port';
import type {
  ScrapeCandidate,
  ScrapeRequest,
  ScraperKind,
} from '../../domain/scraper/scraper.types';

class MockScraper implements Scraper {
  constructor(
    readonly id: string,
    readonly supportedKinds: readonly ScraperKind[],
    private readonly handles: (url: string) => boolean,
  ) {}

  canHandle(url: string): boolean {
    return this.handles(url);
  }

  async scrape(request: ScrapeRequest): Promise<ScrapeCandidate[]> {
    if (request.kind === 'name' && request.query.trim() === '') return [];
    return [
      {
        source: this.id,
        sourceUrl: request.kind === 'url' ? request.url : undefined,
        fragment: {
          title: `Mock ${this.id} course`,
          description: 'Deterministic fixture fragment.',
          instructorNames: ['Mock Instructor'],
          studioName: 'Mock Studio',
          tags: ['mock', this.id],
          externalIds: [{ source: this.id, externalId: `${this.id}:mock:1` }],
        },
      },
    ];
  }
}

export function createMockScrapers(): Scraper[] {
  return [
    new MockScraper('youtube', ['url', 'name', 'fragment'], (u) => u.includes('youtube')),
    new MockScraper('udemy', ['url', 'name', 'fragment'], (u) => u.includes('udemy')),
    new MockScraper('json-ld', ['url', 'fragment'], () => true), // generic fallback last
  ];
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/infra/scrapers/scraper.registry.spec.ts`
Expected: PASS.

- [ ] **Step 6: Lint, format, commit**

```bash
pnpm --filter @app/backend lint --fix
pnpm format
git add apps/backend/src/modules/catalog/infra/scrapers/scraper.registry.ts apps/backend/src/modules/catalog/infra/scrapers/scraper.registry.spec.ts apps/backend/src/modules/catalog/infra/scrapers/mock.scrapers.ts
git commit -m "feat(backend): ScraperRegistry + mock scrapers (Stage 2)"
```

---

## Task 9: `ScrapeCourseCommand` + handler

**Files:**

- Create: `apps/backend/src/modules/catalog/application/commands/scrape-course.command.ts`
- Create: `apps/backend/src/modules/catalog/application/commands/scrape-course.handler.ts`
- Test: `apps/backend/src/modules/catalog/application/commands/scrape-course.handler.spec.ts`

- [ ] **Step 1: Write `scrape-course.command.ts`**

```ts
/**
 * WHY this file exists:
 * Command carrying inputs for a preview scrape. courseId scopes the preview to
 * a course (the handler verifies it exists). source is optional — when absent
 * the handler auto-detects by URL (url-kind) or defaults to json-ld (fragment).
 */
import type { ScrapeRequest } from '../../domain/scraper/scraper.types';

export class ScrapeCourseCommand {
  constructor(
    public readonly courseId: string,
    public readonly source: string | undefined,
    public readonly request: ScrapeRequest,
  ) {}
}
```

- [ ] **Step 2: Write the failing handler test**

```ts
// scrape-course.handler.spec.ts
import { describe, expect, it } from 'vitest';

import { CourseNotFoundError } from '../../domain/course/course.errors';
import {
  ScraperKindUnsupportedError,
  ScraperNotFoundError,
} from '../../domain/scraper/scraper.errors';
import { DefaultScraperRegistry } from '../../infra/scrapers/scraper.registry';
import { ScrapeCourseCommand } from './scrape-course.command';
import { ScrapeCourseHandler } from './scrape-course.handler';
import type { CourseRepository } from '../../domain/course/course.repository';
import type { Scraper } from '../../domain/scraper/scraper.port';
import type { ScrapeCandidate, ScrapeRequest } from '../../domain/scraper/scraper.types';

const candidate: ScrapeCandidate = { source: 'json-ld', fragment: { title: 'Hello' } };

function scraper(id: string, kinds: string[], handles: (u: string) => boolean): Scraper {
  return {
    id,
    supportedKinds: kinds as Scraper['supportedKinds'],
    canHandle: handles,
    scrape: async (_req: ScrapeRequest) => [candidate],
  };
}

function repo(found: boolean): CourseRepository {
  return {
    findById: async () => (found ? ({ id: 'c1' } as never) : null),
  } as unknown as CourseRepository;
}

const youtube = scraper('youtube', ['url', 'name'], (u) => u.includes('youtube'));
const jsonLd = scraper('json-ld', ['url', 'fragment'], () => true);

function handler(found = true): ScrapeCourseHandler {
  return new ScrapeCourseHandler(repo(found), new DefaultScraperRegistry([youtube, jsonLd]));
}

describe('ScrapeCourseHandler', () => {
  it('throws CourseNotFoundError when the course does not exist', async () => {
    await expect(
      handler(false).execute(
        new ScrapeCourseCommand('missing', 'json-ld', { kind: 'fragment', raw: 'x' }),
      ),
    ).rejects.toBeInstanceOf(CourseNotFoundError);
  });

  it('auto-detects the scraper by URL when source is omitted', async () => {
    const out = await handler().execute(
      new ScrapeCourseCommand('c1', undefined, { kind: 'url', url: 'https://youtube.com/x' }),
    );
    expect(out).toEqual([candidate]);
  });

  it('falls back to json-ld for a fragment with no source', async () => {
    const out = await handler().execute(
      new ScrapeCourseCommand('c1', undefined, { kind: 'fragment', raw: '<html/>' }),
    );
    expect(out).toEqual([candidate]);
  });

  it('throws ScraperNotFoundError for an unknown source', async () => {
    await expect(
      handler().execute(new ScrapeCourseCommand('c1', 'bogus', { kind: 'url', url: 'https://x' })),
    ).rejects.toBeInstanceOf(ScraperNotFoundError);
  });

  it('throws ScraperNotFoundError for name-kind without an explicit source', async () => {
    await expect(
      handler().execute(new ScrapeCourseCommand('c1', undefined, { kind: 'name', query: 'rust' })),
    ).rejects.toBeInstanceOf(ScraperNotFoundError);
  });

  it('throws ScraperKindUnsupportedError when the scraper lacks the kind', async () => {
    await expect(
      handler().execute(new ScrapeCourseCommand('c1', 'json-ld', { kind: 'name', query: 'rust' })),
    ).rejects.toBeInstanceOf(ScraperKindUnsupportedError);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/application/commands/scrape-course.handler.spec.ts`
Expected: FAIL — handler module not found.

- [ ] **Step 4: Implement `scrape-course.handler.ts`**

```ts
/**
 * WHY this file exists:
 * Resolves a scraper for a ScrapeCourseCommand and returns preview candidates.
 * Verifies the target course exists, picks the scraper (explicit source →
 * registry.get; url-kind → auto-detect via findByUrl; fragment without source →
 * json-ld; name without source → error), checks the kind is supported, and
 * delegates. Performs NO writes — persistence/merge is Stage 4.
 */
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import { CourseNotFoundError } from '../../domain/course/course.errors';
import {
  ScraperKindUnsupportedError,
  ScraperNotFoundError,
} from '../../domain/scraper/scraper.errors';
import { SCRAPER_REGISTRY } from '../../domain/scraper/scraper.port';
import { ScrapeCourseCommand } from './scrape-course.command';

import type { CourseRepository } from '../../domain/course/course.repository';
import type { Scraper, ScraperRegistry } from '../../domain/scraper/scraper.port';
import type { ScrapeCandidate } from '../../domain/scraper/scraper.types';

@CommandHandler(ScrapeCourseCommand)
export class ScrapeCourseHandler implements ICommandHandler<
  ScrapeCourseCommand,
  ScrapeCandidate[]
> {
  constructor(
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(SCRAPER_REGISTRY) private readonly registry: ScraperRegistry,
  ) {}

  async execute(command: ScrapeCourseCommand): Promise<ScrapeCandidate[]> {
    const course = await this.courseRepo.findById(command.courseId);
    if (!course) throw new CourseNotFoundError(command.courseId);

    const scraper = this.resolveScraper(command);
    if (!scraper.supportedKinds.includes(command.request.kind)) {
      throw new ScraperKindUnsupportedError(scraper.id, command.request.kind);
    }
    return scraper.scrape(command.request);
  }

  private resolveScraper(command: ScrapeCourseCommand): Scraper {
    if (command.source !== undefined) return this.registry.get(command.source);

    const { request } = command;
    if (request.kind === 'url') {
      return this.registry.findByUrl(request.url) ?? this.registry.get('json-ld');
    }
    if (request.kind === 'fragment') return this.registry.get('json-ld');
    // name-kind requires an explicit source — there is nothing to auto-detect from.
    throw new ScraperNotFoundError('(none — name-kind needs an explicit source)');
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/application/commands/scrape-course.handler.spec.ts`
Expected: PASS.

- [ ] **Step 6: Lint, format, commit**

```bash
pnpm --filter @app/backend lint --fix
pnpm format
git add apps/backend/src/modules/catalog/application/commands/scrape-course.command.ts apps/backend/src/modules/catalog/application/commands/scrape-course.handler.ts apps/backend/src/modules/catalog/application/commands/scrape-course.handler.spec.ts
git commit -m "feat(backend): ScrapeCourseCommand + handler (preview-only) (Stage 2)"
```

---

## Task 10: OpenAPI spec + client regen (own commit)

**Files:**

- Modify: `packages/specs/openapi/openapi.yaml` (2 paths + schemas)
- Regenerated (do NOT hand-edit): `packages/specs/src/openapi-types.ts`, `packages/api-client-ts/src/generated/**`, `packages/api-client-dart/lib/generated/**`

- [ ] **Step 1: Add the two paths to `openapi.yaml`**

Insert under `paths:` near the other `/api/v1/admin/...` routes (after `/api/v1/admin/maintenance/backfill-metadata`). Mirror the existing admin-route style (bearerAuth, Problem refs, examples):

```yaml
/api/v1/admin/scrapers:
  get:
    operationId: listScrapers
    summary: List available metadata scrapers
    description: Returns the scrapers configured on this instance with the invocation kinds each supports. Requires admin role.
    tags: [admin, Scrapers]
    security:
      - bearerAuth: []
    responses:
      '200':
        description: Configured scrapers
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ScraperListDto'
            examples:
              configured:
                value:
                  scrapers:
                    - id: youtube
                      supportedKinds: [url, name, fragment]
                      configured: true
                    - id: udemy
                      supportedKinds: [url, name, fragment]
                      configured: true
                    - id: json-ld
                      supportedKinds: [url, fragment]
                      configured: true
      '401':
        description: Missing or invalid bearer token
        content:
          application/problem+json:
            schema:
              $ref: '#/components/schemas/Problem'
      '403':
        description: Caller does not have the admin role
        content:
          application/problem+json:
            schema:
              $ref: '#/components/schemas/Problem'

/api/v1/admin/courses/{id}/scrape-preview:
  post:
    operationId: scrapeCoursePreview
    summary: Preview scraped metadata for a course
    description: |
      Runs the selected scraper against the given input and returns candidate
      metadata fragments. PREVIEW ONLY — nothing is persisted and scraped
      names are not resolved to existing entities. Requires admin role.
    tags: [admin, Scrapers]
    security:
      - bearerAuth: []
    parameters:
      - name: id
        in: path
        required: true
        schema: { type: string }
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ScrapePreviewRequest'
          examples:
            byUrl:
              summary: Scrape a URL with auto-detected source
              value:
                kind: url
                url: 'https://www.youtube.com/playlist?list=PL123'
            byName:
              summary: Search YouTube by name
              value:
                source: youtube
                kind: name
                query: 'rust programming'
    responses:
      '200':
        description: Scrape candidates (possibly empty)
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ScrapePreviewResponse'
            examples:
              oneCandidate:
                value:
                  candidates:
                    - source: youtube
                      sourceUrl: 'https://www.youtube.com/playlist?list=PL123'
                      fragment:
                        title: 'Rust Course'
                        studioName: 'Rustacean'
                        externalIds:
                          - source: youtube
                            externalId: 'youtube:playlist:PL123'
              empty:
                value:
                  candidates: []
      '400':
        description: Malformed request body
        content:
          application/problem+json:
            schema: { $ref: '#/components/schemas/Problem' }
      '401':
        description: Missing or invalid bearer token
        content:
          application/problem+json:
            schema: { $ref: '#/components/schemas/Problem' }
      '403':
        description: Caller does not have the admin role
        content:
          application/problem+json:
            schema: { $ref: '#/components/schemas/Problem' }
      '404':
        description: Course not found or unknown scraper source
        content:
          application/problem+json:
            schema: { $ref: '#/components/schemas/Problem' }
      '422':
        description: Scraper does not support the kind, or is not configured
        content:
          application/problem+json:
            schema: { $ref: '#/components/schemas/Problem' }
      '502':
        description: Upstream fetch or parse failed
        content:
          application/problem+json:
            schema: { $ref: '#/components/schemas/Problem' }
```

- [ ] **Step 2: Add the schemas under `components.schemas`**

Place near the existing entity DTOs. `ScrapedExternalId` reuses the same shape as the existing `ExternalIdRef`; reference `CourseLevel` which already exists in the spec.

```yaml
ScraperKind:
  type: string
  enum: [url, name, fragment]

ScraperInfoDto:
  type: object
  required: [id, supportedKinds, configured]
  properties:
    id: { type: string, example: youtube }
    supportedKinds:
      type: array
      items: { $ref: '#/components/schemas/ScraperKind' }
    configured: { type: boolean }

ScraperListDto:
  type: object
  required: [scrapers]
  properties:
    scrapers:
      type: array
      items: { $ref: '#/components/schemas/ScraperInfoDto' }

ScrapePreviewRequest:
  type: object
  required: [kind]
  properties:
    source:
      type: string
      description: Explicit scraper id. Omit to auto-detect (url) or default to json-ld (fragment). Required for kind=name.
    kind: { $ref: '#/components/schemas/ScraperKind' }
    url:
      type: string
      format: uri
      description: Required when kind=url.
    query:
      type: string
      description: Required when kind=name.
    fragment:
      type: string
      description: Required when kind=fragment (raw HTML or JSON-LD).

ScrapedCourseFragmentDto:
  type: object
  description: Raw scraped metadata. Names are not resolved to entities (Stage 4 does that).
  properties:
    title: { type: string }
    description: { type: string }
    instructorNames:
      type: array
      items: { type: string }
    studioName: { type: string }
    tags:
      type: array
      items: { type: string }
    level: { $ref: '#/components/schemas/CourseLevel' }
    language: { type: string }
    releaseDate: { type: string, format: date }
    posterUrl: { type: string, format: uri }
    externalIds:
      type: array
      items: { $ref: '#/components/schemas/ExternalIdRef' }
    ratingAverage: { type: number, format: float, minimum: 0, maximum: 5 }
    ratingCount: { type: integer, minimum: 0 }

ScrapeCandidateDto:
  type: object
  required: [source, fragment]
  properties:
    source: { type: string }
    sourceUrl: { type: string, format: uri }
    confidence: { type: number, format: float, minimum: 0, maximum: 1 }
    fragment: { $ref: '#/components/schemas/ScrapedCourseFragmentDto' }

ScrapePreviewResponse:
  type: object
  required: [candidates]
  properties:
    candidates:
      type: array
      items: { $ref: '#/components/schemas/ScrapeCandidateDto' }
```

- [ ] **Step 3: Validate, bundle, and codegen**

Run:

```bash
pnpm spec:validate && pnpm spec:bundle && pnpm spec:codegen
```

Expected: validate passes (no `$ref` errors), codegen regenerates `openapi-types.ts` and both clients. New exported types include `ScrapePreviewRequest`, `ScrapePreviewResponse`, `ScrapeCandidateDto`, `ScrapedCourseFragmentDto`, `ScraperListDto`, `ScraperInfoDto`, `ScraperKind`.

- [ ] **Step 4: Sanity-check the generated TS types exist**

Run: `grep -rl "ScrapePreviewRequest" packages/api-client-ts/src/generated`
Expected: at least one match (do not edit these files).

- [ ] **Step 5: Commit the spec edit and the regen as two commits**

```bash
git add packages/specs/openapi/openapi.yaml
git commit -m "feat(specs): scrape-preview + list-scrapers admin endpoints (Stage 2)"
git add packages/specs/src/openapi-types.ts packages/api-client-ts packages/api-client-dart
git commit -m "chore(codegen): regen api-client-ts + api-client-dart from Stage 2 spec"
```

---

## Task 11: Controller + module wiring

**Files:**

- Create: `apps/backend/src/modules/catalog/catalog-scrape-admin.controller.ts`
- Create: `apps/backend/src/modules/catalog/catalog-scrape-admin.controller.spec.ts`
- Modify: `apps/backend/src/modules/catalog/catalog.module.ts`

- [ ] **Step 1: Write the failing controller test**

```ts
// catalog-scrape-admin.controller.spec.ts
import { describe, expect, it, vi } from 'vitest';

import { CatalogScrapeAdminController } from './catalog-scrape-admin.controller';
import { ScrapeCourseCommand } from './application/commands/scrape-course.command';
import type { CommandBus } from '@nestjs/cqrs';
import type { ScraperRegistry } from './domain/scraper/scraper.port';

function commandBus(result: unknown): CommandBus {
  return { execute: vi.fn(async () => result) } as unknown as CommandBus;
}

const registry = {
  all: () => [
    {
      id: 'json-ld',
      supportedKinds: ['url', 'fragment'],
      canHandle: () => true,
      scrape: async () => [],
    },
  ],
} as unknown as ScraperRegistry;

describe('CatalogScrapeAdminController', () => {
  it('GET /admin/scrapers maps the registry to ScraperListDto', () => {
    const controller = new CatalogScrapeAdminController(commandBus([]), registry);
    expect(controller.listScrapers()).toEqual({
      scrapers: [{ id: 'json-ld', supportedKinds: ['url', 'fragment'], configured: true }],
    });
  });

  it('POST scrape-preview dispatches a ScrapeCourseCommand and wraps candidates', async () => {
    const bus = commandBus([{ source: 'json-ld', fragment: { title: 'X' } }]);
    const controller = new CatalogScrapeAdminController(bus, registry);
    const res = await controller.scrapeCoursePreview('c1', { kind: 'url', url: 'https://x.test' });
    expect(bus.execute).toHaveBeenCalledWith(expect.any(ScrapeCourseCommand));
    expect(res).toEqual({ candidates: [{ source: 'json-ld', fragment: { title: 'X' } }] });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/catalog-scrape-admin.controller.spec.ts`
Expected: FAIL — controller module not found.

- [ ] **Step 3: Implement `catalog-scrape-admin.controller.ts`**

```ts
/**
 * WHY this file exists:
 * Admin-only HTTP entry point for the scraping subsystem (Stage 2). Two routes:
 *   - GET  /api/v1/admin/scrapers                       → list configured scrapers
 *   - POST /api/v1/admin/courses/{id}/scrape-preview    → preview candidates
 * Both are guarded by AdminGuard. The controller does composition only:
 * dispatches the CQRS command and shapes the OpenAPI response. Domain errors
 * thrown by the handler become RFC 9457 problems via the global filter.
 */
import { Body, Controller, Get, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { AdminGuard } from '../../common/auth/admin.guard';
import { ScrapeCourseCommand } from './application/commands/scrape-course.command';
import { SCRAPER_REGISTRY } from './domain/scraper/scraper.port';

import type { ScraperRegistry } from './domain/scraper/scraper.port';
import type { ScrapeCandidate, ScrapeRequest } from './domain/scraper/scraper.types';
import type {
  ScrapeCandidateDto,
  ScrapePreviewRequest,
  ScrapePreviewResponse,
  ScraperListDto,
} from '@app/api-client-ts';

@UseGuards(AdminGuard)
@Controller({ path: 'admin', version: '1' })
export class CatalogScrapeAdminController {
  constructor(
    private readonly commandBus: CommandBus,
    @Inject(SCRAPER_REGISTRY) private readonly registry: ScraperRegistry,
  ) {}

  /** GET /api/v1/admin/scrapers */
  @Get('scrapers')
  listScrapers(): ScraperListDto {
    return {
      scrapers: this.registry.all().map((s) => ({
        id: s.id,
        supportedKinds: [...s.supportedKinds],
        configured: true,
      })),
    };
  }

  /** POST /api/v1/admin/courses/:id/scrape-preview */
  @Post('courses/:id/scrape-preview')
  async scrapeCoursePreview(
    @Param('id') id: string,
    @Body() body: ScrapePreviewRequest,
  ): Promise<ScrapePreviewResponse> {
    const request = this.toScrapeRequest(body);
    const candidates = await this.commandBus.execute<ScrapeCourseCommand, ScrapeCandidate[]>(
      new ScrapeCourseCommand(id, body.source, request),
    );
    return { candidates: candidates as ScrapeCandidateDto[] };
  }

  private toScrapeRequest(body: ScrapePreviewRequest): ScrapeRequest {
    if (body.kind === 'url') return { kind: 'url', url: body.url ?? '' };
    if (body.kind === 'name') return { kind: 'name', query: body.query ?? '' };
    return { kind: 'fragment', raw: body.fragment ?? '' };
  }
}
```

Note: `express-openapi-validator` rejects requests where the kind-specific field is missing (the spec marks `kind` required and documents the conditional fields); the `?? ''` fallbacks only guard the type, they are never reached for a spec-valid request.

- [ ] **Step 4: Wire the controller, command handler, and registry in `catalog.module.ts`**

Add imports at the top:

```ts
import { ScrapeCourseHandler } from './application/commands/scrape-course.handler';
import { CatalogScrapeAdminController } from './catalog-scrape-admin.controller';
import { SCRAPER_REGISTRY } from './domain/scraper/scraper.port';
import { DefaultScraperRegistry } from './infra/scrapers/scraper.registry';
import { HttpFetcher } from './infra/scrapers/http-fetcher';
import { HtmlMetadataExtractor } from './infra/scrapers/html-metadata.extractor';
import { JsonLdScraper } from './infra/scrapers/json-ld.scraper';
import { UdemyScraper } from './infra/scrapers/udemy.scraper';
import { YouTubeScraper } from './infra/scrapers/youtube.scraper';
import { createMockScrapers } from './infra/scrapers/mock.scrapers';
import { AppConfig } from '../../common/config/app-config';
import type { Scraper } from './domain/scraper/scraper.port';
```

Add `CatalogScrapeAdminController` to `controllers: [...]`.

Add to `providers: [...]`. The registry is a single factory provider — it constructs the fetcher + extractor itself and builds the scraper list conditionally (so neither helper needs its own DI token):

```ts
    ScrapeCourseHandler,
    {
      provide: SCRAPER_REGISTRY,
      useFactory: (config: AppConfig): DefaultScraperRegistry => {
        if (config.scrapers.mode === 'mock') {
          return new DefaultScraperRegistry(createMockScrapers());
        }
        const fetcher = new HttpFetcher(config.scrapers);
        const extractor = new HtmlMetadataExtractor();
        const scrapers: Scraper[] = [];
        if (config.scrapers.youtube.configured) {
          scrapers.push(new YouTubeScraper(fetcher, config.scrapers.youtube.apiKey));
        }
        if (config.scrapers.udemy.enabled) {
          scrapers.push(new UdemyScraper(fetcher, extractor));
        }
        scrapers.push(new JsonLdScraper(fetcher, extractor)); // generic fallback LAST
        return new DefaultScraperRegistry(scrapers);
      },
      inject: [AppConfig],
    },
```

(`AppConfig` is provided by the global `ConfigModule`; confirm it is importable here. If `AppConfig` is not already in the module graph, add the module that exports `AppConfig` to `imports`.)

- [ ] **Step 5: Run the controller test + the full catalog suite**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/catalog-scrape-admin.controller.spec.ts`
Expected: PASS.

Run: `pnpm --filter @app/backend test -- src/modules/catalog`
Expected: PASS (no regressions in the catalog module).

- [ ] **Step 6: Typecheck, lint, format, commit**

```bash
pnpm --filter @app/backend typecheck
pnpm --filter @app/backend lint --fix
pnpm format
git add apps/backend/src/modules/catalog/catalog-scrape-admin.controller.ts apps/backend/src/modules/catalog/catalog-scrape-admin.controller.spec.ts apps/backend/src/modules/catalog/catalog.module.ts
git commit -m "feat(backend): scrape-preview + scrapers admin controller + wiring (Stage 2)"
```

---

## Task 12: e2e (mock mode)

**Files:**

- Create: `apps/backend/test/scrape-preview.e2e.spec.ts` (match the existing backend e2e location/pattern — verify where `run-scan` style e2e specs live before writing; adjust path to match)
- Possibly modify: backend e2e bootstrap to set `SCRAPERS_MODE=mock`

- [ ] **Step 1: Discover the existing backend HTTP-test pattern (CRITICAL — do this first)**

The backend runs on **Express** (`@nestjs/platform-express`), so HTTP tests use `supertest` against `app.getHttpServer()` — NOT Fastify's `app.inject`. Before writing anything:

Run: `git ls-files apps/backend | grep -E "e2e|\.e2e\.|test/" ` and `grep -rl "supertest\|getHttpServer\|createTestingModule" apps/backend/src apps/backend/test 2>/dev/null`

Then decide:

- **If an HTTP e2e/integration harness exists** (a spec that boots the app and hits it with supertest, plus an admin-auth helper): copy that bootstrap + the exact admin-auth mechanism (AdminGuard expects a bearer token — reuse the repo's helper; do not hand-roll one). Set `SCRAPERS_MODE=mock` in that bootstrap's env so the registry uses `createMockScrapers()`.
- **If NO HTTP harness exists** (the catalog module is covered only by handler/controller unit specs, given `run-scan` is tested at handler level): do NOT invent an app-boot harness. Instead write a **controller-level integration spec** that builds a `Test.createTestingModule` with the real `ScrapeCourseHandler` + a `DefaultScraperRegistry(createMockScrapers())` bound to `SCRAPER_REGISTRY` and a stub `COURSE_REPOSITORY`, then calls the controller methods directly. This still proves the mock-mode wiring end-to-end through the command bus without an HTTP layer.

- [ ] **Step 2a: Write the HTTP e2e test — ONLY if Step 1 found a supertest harness**

```ts
// scrape-preview.e2e.spec.ts — adapt the bootstrap + adminHeaders import to the repo's helper
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// import { bootTestApp, adminHeaders, seedCourse } from '<repo e2e helper path>';

describe('scrape-preview (mock mode) [e2e]', () => {
  let app: import('@nestjs/common').INestApplication;
  let courseId: string;

  beforeAll(async () => {
    app = await bootTestApp({ env: { SCRAPERS_MODE: 'mock' } });
    courseId = await seedCourse(app);
  });
  afterAll(() => app.close());

  it('GET /api/v1/admin/scrapers lists the mock scrapers', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/scrapers')
      .set(adminHeaders());
    expect(res.status).toBe(200);
    expect(res.body.scrapers.map((s: { id: string }) => s.id)).toContain('json-ld');
  });

  it('POST scrape-preview returns deterministic mock candidates', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/admin/courses/${courseId}/scrape-preview`)
      .set(adminHeaders())
      .send({ kind: 'url', url: 'https://www.youtube.com/playlist?list=PL1' });
    expect(res.status).toBe(200);
    expect(res.body.candidates[0].source).toBe('youtube');
    expect(res.body.candidates[0].fragment.title).toContain('Mock');
  });

  it('returns 404 for an unknown course', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/courses/does-not-exist/scrape-preview')
      .set(adminHeaders())
      .send({ source: 'json-ld', kind: 'fragment', fragment: '<html/>' });
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2b: Write the controller integration spec — ONLY if Step 1 found NO HTTP harness**

File: `apps/backend/src/modules/catalog/catalog-scrape-admin.integration.spec.ts`

```ts
import { CommandBus, CqrsModule } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';

import { ScrapeCourseHandler } from './application/commands/scrape-course.handler';
import { CatalogScrapeAdminController } from './catalog-scrape-admin.controller';
import { COURSE_REPOSITORY } from './domain/course/course.repository';
import { SCRAPER_REGISTRY } from './domain/scraper/scraper.port';
import { DefaultScraperRegistry } from './infra/scrapers/scraper.registry';
import { createMockScrapers } from './infra/scrapers/mock.scrapers';

describe('scrape-preview wiring (mock mode) [integration]', () => {
  async function build(courseExists: boolean): Promise<CatalogScrapeAdminController> {
    const moduleRef = await Test.createTestingModule({
      imports: [CqrsModule],
      controllers: [CatalogScrapeAdminController],
      providers: [
        ScrapeCourseHandler,
        { provide: SCRAPER_REGISTRY, useValue: new DefaultScraperRegistry(createMockScrapers()) },
        {
          provide: COURSE_REPOSITORY,
          useValue: { findById: async () => (courseExists ? ({ id: 'c1' } as never) : null) },
        },
      ],
    }).compile();
    await moduleRef.createNestApplication().init();
    moduleRef.get(CommandBus); // ensures handlers are registered
    return moduleRef.get(CatalogScrapeAdminController);
  }

  it('lists mock scrapers', async () => {
    const controller = await build(true);
    expect(controller.listScrapers().scrapers.map((s) => s.id)).toContain('json-ld');
  });

  it('returns deterministic mock candidates for a known course', async () => {
    const controller = await build(true);
    const res = await controller.scrapeCoursePreview('c1', {
      kind: 'url',
      url: 'https://www.youtube.com/playlist?list=PL1',
    });
    expect(res.candidates[0].source).toBe('youtube');
    expect(res.candidates[0].fragment.title).toContain('Mock');
  });
});
```

- [ ] **Step 3: Run whichever spec you wrote**

Run: `pnpm --filter @app/backend test -- <the path you created>`
Expected: PASS.

- [ ] **Step 4: Run the full backend suite + spec contract test for no regressions**

Run:

```bash
pnpm --filter @app/backend test
pnpm spec:validate
```

Expected: all green; baseline test count + the new specs, zero failures.

- [ ] **Step 5: Lint, format, commit**

```bash
pnpm --filter @app/backend lint --fix
pnpm format
git add <the spec path you created in Step 2a or 2b>
git commit -m "test(backend): mock-mode coverage for scrape-preview (Stage 2)"
```

---

## Final verification

- [ ] `pnpm --filter @app/backend test` — all pass, no regressions from baseline (1452 passed / 2 skipped before Stage 2).
- [ ] `pnpm --filter @app/backend typecheck` — clean.
- [ ] `pnpm --filter @app/backend lint` — clean.
- [ ] `pnpm spec:validate && pnpm spec:bundle && pnpm spec:codegen` — clean, no uncommitted regen drift (`git status` clean after).
- [ ] Update `specs/tasks/active.md`: push the Stage 2 entry (template in `specs/tasks/README.md`); on PR, move it to the top of `specs/tasks/done.md` with the PR link and `Closes #<n>` (look up with `pnpm issues:lookup -- <card-id>` if a roadmap card exists).

## Bookkeeping note

This plan does NOT touch the database (no migration) and writes nothing — it is read/preview only. Persistence and entity resolution arrive in Stage 4 (identify task), and `scraper_source` config + community-DB connectors in Stage 3, per the roadmap in `~/.claude/plans/memoized-chasing-nest.md`.
