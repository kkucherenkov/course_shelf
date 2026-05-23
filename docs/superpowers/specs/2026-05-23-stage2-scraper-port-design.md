# courseShelf — Stage 2: Scraper port + concrete scrapers (design)

- Date: 2026-05-23
- Branch (base): builds on Stage 1 (`feat/stage1-metadata-enrichment`, commits `45102cf` spec / `e1f81dc` backend)
- Roadmap source: `~/.claude/plans/memoized-chasing-nest.md` § "Roadmap — Stages 2–6", Stage 2 paragraph
- Status: approved (design phase)

## Context

Stage 1 заложил модель данных Stash-style обогащения: lightweight aggregates `Instructor` / `Studio` / `Tag`, расширенный `Course` (poster, level, language, releaseDate, rating, externalIds), нормализованная таблица `ExternalId` с `@@unique([source, externalId])`, CQRS upsert/set/list/get и `course.json` v2. Никаких внешних источников ещё нет — метаданные приходят только из структуры папок, ffprobe и опционального `course.json`.

Stage 2 вводит **первый исходящий HTTP-слой** и абстракцию скрейперов: декларативный порт `Scraper`, registry, три конкретных адаптера и единственный admin-endpoint `scrape-preview`, который **возвращает превью и ничего не пишет**. Запись и слияние с существующими данными — забота Stage 4 (identify task с per-field merge policy). Stage 2 строит фундамент, на котором Stage 3 (community-DB connector) и Stage 4 (identify) встанут без изменения контракта скрейпера.

## Подтверждённые решения (brainstorm 2026-05-23)

- **Scope скрейперов:** все три из плана — generic JSON-LD/OpenGraph, YouTube Data API, bespoke Udemy landing-page.
- **Invocation kinds:** все три — `url`, `name` (search), `fragment` (ручной paste).
- **Entity resolution:** превью возвращает **сырые имена** (raw fragment, форма upsert payload); резолв/мэтчинг с существующими сущностями — Stage 4.
- **Архитектура:** Approach A — registry self-contained адаптеров (порт + `SCRAPER_REGISTRY`), общий HTTP/HTML вынесен в injectable-хелперы.
- **HTML-парсер:** `cheerio` (robust parse5 + удобный traversal для bespoke Udemy на «диком» HTML; вес на backend некритичен).
- **`GET /admin/scrapers`:** включён (нужен Stage 5 UI; дёшево).

## Scope

**В Stage 2:**

- Domain: `scraper.types.ts`, `scraper.port.ts`, `scraper.errors.ts`.
- Infra: `http-fetcher.ts` (+SSRF-guard), `html-metadata.extractor.ts`, `json-ld.scraper.ts`, `youtube.scraper.ts`, `udemy.scraper.ts`, `scraper.registry.ts`, mock-скрейперы для `mode:mock`.
- Application: `ScrapeCourseCommand` + handler.
- HTTP: `POST /api/v1/admin/courses/{id}/scrape-preview`, `GET /api/v1/admin/scrapers`.
- Config: `ScrapersConfig` в `AppConfig`.
- Spec-first: openapi.yaml + regen ts/dart (отдельный коммит).
- Dependency: `cheerio` в `apps/backend`.

**НЕ в Stage 2 (YAGNI):**

- Любая запись/persist и entity-resolution (Stage 4 identify/merge).
- `scraper_source` table + community-DB / GraphQL connector (Stage 3).
- Admin UI и disambiguation-экраны (Stage 5).
- YAML/plugin scraper-движок (Stage 6).
- Локальное кеширование poster-картинок (parked follow-up).
- Кеш результатов скрейпа (превью on-demand, эфемерно).

## Архитектура

```
HTTP  POST /admin/courses/{id}/scrape-preview ─┐
      GET  /admin/scrapers ────────────────┐  │
                                            │  ▼
Application                          ScrapeCourseHandler
                                            │  (verify course, resolve scraper,
                                            │   check kind, NO write)
                                            ▼
Domain port            Scraper (interface) · ScraperRegistry · ScrapeCandidate
                                            ▲
Infra                 ScraperRegistry impl ─┤
                       ├─ JsonLdScraper      } each uses
                       ├─ YouTubeScraper     } HttpFetcher (+SSRF) &
                       └─ UdemyScraper       } HtmlMetadataExtractor (cheerio)
```

Поток (`url`-kind): handler → `registry.findByUrl(url)` (или `registry.get(source)`) → `scraper.scrape({kind:'url', url})` → `HttpFetcher.fetch` (timeout/size-cap/SSRF) → `HtmlMetadataExtractor` (JSON-LD + OG) или source-специфичный парсинг → `ScrapeCandidate[]` → DTO. Никаких обращений к БД кроме `course.findById` для проверки существования.

## Domain — `apps/backend/src/modules/catalog/domain/scraper/`

### `scraper.types.ts`

```ts
export type ScraperKind = 'url' | 'name' | 'fragment';

export type ScrapeRequest =
  | { readonly kind: 'url'; readonly url: string }
  | { readonly kind: 'name'; readonly query: string }
  | { readonly kind: 'fragment'; readonly raw: string };

// форма NormalisedCourseJsonV2 минус sections/schemaVersion, плюс rating; все поля опциональны
export interface ScrapedCourseFragment {
  readonly title?: string;
  readonly description?: string;
  readonly instructorNames?: string[];
  readonly studioName?: string;
  readonly tags?: string[];
  readonly level?: CourseJsonLevel; // переиспользуем тип из course-json.schema
  readonly language?: string; // BCP-47 (структурно строка; VO валидирует на границе Stage 4)
  readonly releaseDate?: string; // ISO YYYY-MM-DD
  readonly posterUrl?: string;
  readonly externalIds?: { source: string; externalId: string; url?: string }[];
  readonly ratingAverage?: number; // 0..5
  readonly ratingCount?: number; // >=0
}

export interface ScrapeCandidate {
  readonly fragment: ScrapedCourseFragment;
  readonly source: string; // scraper id, e.g. 'youtube'
  readonly sourceUrl?: string; // canonical URL кандидата
  readonly confidence?: number; // 0..1, опциональная эвристика (для name-поиска)
}
```

### `scraper.port.ts`

```ts
export interface Scraper {
  readonly id: string; // 'json-ld' | 'youtube' | 'udemy'
  readonly supportedKinds: readonly ScraperKind[];
  canHandle(url: string): boolean; // для auto-detect при url-kind без явного source
  scrape(request: ScrapeRequest): Promise<ScrapeCandidate[]>;
}

export interface ScraperRegistry {
  get(id: string): Scraper; // ScraperNotFoundError если нет
  all(): readonly Scraper[]; // только сконфигурированные
  findByUrl(url: string): Scraper | undefined;
}

export const SCRAPER_REGISTRY = Symbol('SCRAPER_REGISTRY');
```

`fragment`-kind — source-agnostic ручной paste; каждый скрейпер парсит его в своём формате (json-ld парсит как HTML/JSON-LD блок, youtube/udemy — как минимально-валидный фрагмент). Если `source` не задан для `fragment`, дефолт — `json-ld`.

### `scraper.errors.ts`

Доменные ошибки (по образцу `*.errors.ts` Stage 1), маппятся в RFC 9457 на границе контроллера:

- `ScraperNotFoundError(id)` — неизвестный source.
- `ScraperKindUnsupportedError(id, kind)` — скрейпер не поддерживает kind.
- `ScraperNotConfiguredError(id)` — например YouTube без API-ключа.
- `ScrapeFetchError(url, cause)` — сеть/timeout/HTTP-статус upstream.
- `ScrapeParseError(source, detail)` — фрагмент структурно битый (не «пусто», а именно невалиден).
- `ScrapeFragmentInvalidError(detail)` — невалидный ручной `fragment`.

## Infra — `apps/backend/src/modules/catalog/infra/scrapers/`

### `http-fetcher.ts` (injectable)

Единственная точка исходящего HTTP. Нативный `fetch` (Node ≥24, undici):

- `AbortController` с `httpTimeoutMs` (default 10000).
- Cap размера ответа: читать тело потоком, прерывать при превышении `maxResponseBytes` (~2 MB).
- `User-Agent` из конфига.
- Лимит редиректов (например `redirect:'manual'` + ручной follow ≤5, перепроверяя SSRF на каждом hop).
- **SSRF-guard:** только `http(s)`; резолвить host в IP, реджектить loopback (`127.0.0.0/8`, `::1`), private (`10/8`, `172.16/12`, `192.168/16`, `fc00::/7`), link-local (`169.254/16` вкл. cloud-metadata `169.254.169.254`), `0.0.0.0`. На редиректах — повторная проверка (anti-DNS-rebinding в пределах разумного для self-hosted).
- Возвращает `{ status, headers, text(): Promise<string> }`.

Threat model: self-hosted, single-admin. SSRF-риск низкий (url задаёт доверенный админ), но guard — дёшевая defense-in-depth и тестируется отдельно.

### `html-metadata.extractor.ts` (cheerio)

- JSON-LD: `$('script[type="application/ld+json"]')` → `JSON.parse` (лояльно к массивам/`@graph`), извлечь `schema.org` типы Course, VideoObject, Person (→ instructor), Organization (→ studio), aggregateRating (→ rating).
- OpenGraph: `meta[property^="og:"]` → `og:title`, `og:description`, `og:image` (→ posterUrl), `og:url`.
- Маппинг schema.org/OG → `ScrapedCourseFragment`. JSON-LD приоритетнее OG при конфликте.
- Чистая функция от HTML-строки: `extract(html: string, baseUrl?: string): ScrapedCourseFragment`. Тестируется на фикстурах без сети.

### `json-ld.scraper.ts`

- `id:'json-ld'`, `supportedKinds:['url','fragment']`, `canHandle ⇒ true` (generic fallback / последний в auto-detect).
- `url`: `HttpFetcher.fetch` → `HtmlMetadataExtractor.extract` → 0..1 кандидат.
- `fragment`: трактует raw как HTML или голый JSON-LD блок → extract.

### `youtube.scraper.ts`

- `id:'youtube'`, `supportedKinds:['url','name','fragment']`, `canHandle` = `youtube.com` / `youtu.be` (playlist или video).
- YouTube Data API v3 через `HttpFetcher` (ключ из конфига): `playlists.list` + `playlistItems.list` (playlist → course + lessons-как-tags/desc), `videos.list`, `search.list` (kind `name`).
- Нет ключа ⇒ скрейпер не регистрируется в registry (`configured:false`). Вызов несконфигурированного → `ScraperNotConfiguredError`.
- Маппинг: channel → studio, title/description, thumbnails → posterUrl, externalIds `youtube:playlist:<id>` / `youtube:video:<id>`.

### `udemy.scraper.ts`

- `id:'udemy'`, `supportedKinds:['url','name','fragment']`, `canHandle` = `udemy.com/course`.
- `url`: fetch landing-page → парсить `__NEXT_DATA__`/embedded JSON-LD через cheerio, fallback на OG.
- `name`: best-effort парсинг страницы поиска; **может вернуть пусто** (документируем как ожидаемое).
- **Защитно:** все парс-промахи → пустой результат или `ScrapeParseError`, никогда не валит процесс. Флаг `udemy.enabled` (default true) — можно отключить хрупкий источник.
- **Риск (помечен):** ломается при смене вёрстки Udemy + ToS-серая зона. Изолирован за портом; деградирует молча.

### `scraper.registry.ts`

- Реализует `ScraperRegistry`. Конструктор инжектит все скрейперы; в `all()` отдаёт только `configured`.
- `findByUrl` — первый `canHandle(url) === true` среди специфичных (youtube/udemy) до generic `json-ld`; порядок детерминирован.
- Mock-режим: при `mode:'mock'` модуль регистрирует fixture-backed скрейперы вместо реальных (детерминированный вывод для e2e/CI без сети).

## Application — `apps/backend/src/modules/catalog/application/commands/`

### `scrape-course.command.ts`

`{ courseId: string; source?: string; request: ScrapeRequest }`

### `scrape-course.handler.ts`

1. `courseRepo.findById(courseId)` → `CourseNotFoundError` если нет.
2. Резолв скрейпера: если `source` задан → `registry.get(source)`; иначе для `kind:'url'` → `registry.findByUrl(url)` (fallback `json-ld`); для `fragment` без source → `json-ld`; для `name` без source → `ScraperNotFoundError` (нужен явный source).
3. Проверка `supportedKinds.includes(request.kind)` → `ScraperKindUnsupportedError`.
4. `scraper.scrape(request)` → `ScrapeCandidate[]`.
5. Вернуть кандидатов. **Никакой записи.**

CQRS Command (а не Query), как в плане: операция с внешним side-effect (HTTP), не чтение нашего состояния.

## HTTP (spec-first)

### `POST /api/v1/admin/courses/{id}/scrape-preview`

- Admin-guard (существующие auth-декораторы, как в `catalog-entities-admin.controller.ts`).
- Body `ScrapePreviewRequest`: `{ source?: string; kind: ScraperKind; url?: string; query?: string; fragment?: string }`. Валидация: `url` обязателен при `kind:url`, `query` при `name`, `fragment` при `fragment` (express-openapi-validator + проверка в handler).
- Response `ScrapePreviewResponse`: `{ candidates: ScrapeCandidateDto[] }`.

### `GET /api/v1/admin/scrapers`

- Admin-guard. Response: `{ scrapers: { id: string; supportedKinds: ScraperKind[]; configured: boolean }[] }`.

Контроллер: расширить `catalog-entities-admin.controller.ts` или новый `catalog-scrape-admin.controller.ts` (решается на этапе плана; склоняюсь к отдельному — иной домен).

### Error mapping (RFC 9457)

| Случай                                                    | Status                 |
| --------------------------------------------------------- | ---------------------- |
| курс не найден                                            | 404                    |
| неизвестный `source` (`ScraperNotFoundError`)             | 404                    |
| kind не поддержан (`ScraperKindUnsupportedError`)         | 422                    |
| скрейпер не сконфигурирован (`ScraperNotConfiguredError`) | 422                    |
| upstream timeout/down/5xx (`ScrapeFetchError`)            | 502                    |
| upstream вернул неразборный контент (`ScrapeParseError`)  | 502                    |
| битый ручной fragment (`ScrapeFragmentInvalidError`)      | 422                    |
| достижимо, метаданных нет                                 | 200 + `candidates: []` |
| невалидный body                                           | 400 (валидатор)        |

## Config — `ScrapersConfig` в `AppConfig`

```ts
export interface ScrapersConfig {
  readonly mode: ProviderMode; // 'mock' | 'real' (default 'mock' в test, 'real' иначе)
  readonly httpTimeoutMs: number; // SCRAPERS_HTTP_TIMEOUT_MS, default 10000
  readonly maxResponseBytes: number; // SCRAPERS_MAX_RESPONSE_BYTES, default 2_000_000
  readonly userAgent: string; // SCRAPERS_USER_AGENT, default 'courseShelf/…'
  readonly youtube: { configured: boolean; apiKey: string }; // YOUTUBE_API_KEY
  readonly udemy: { enabled: boolean }; // SCRAPERS_UDEMY_ENABLED, default true
}
```

Через `ConfigService` (никогда не `process.env` напрямую). Паттерн `ProviderMode` переиспользует существующий `ProvidersConfig`.

## Testing

- **Unit:**
  - `HtmlMetadataExtractor` — JSON-LD (Course/VideoObject/`@graph`/массив) + OG фикстуры.
  - Каждый скрейпер с fake `HttpFetcher` (записанные ответы) — маппинг в fragment, edge-cases пустого/битого HTML.
  - `ScraperRegistry` — dispatch по id, `findByUrl` порядок, отсев несконфигурированных.
  - `ScrapeCourseHandler` с FakeScraper — резолв source/kind, ветки ошибок, отсутствие записи.
- **Integration:**
  - `HttpFetcher` против локального тест-сервера — timeout, size-cap, редиректы; SSRF-guard реджектит loopback/private/link-local.
- **e2e:** `scrape-preview.e2e.spec.ts` в `mode:mock` — `POST` отдаёт детерминированные fixture-кандидаты, `GET /admin/scrapers` отдаёт список; без живой сети в CI.
- **Contract:** express-openapi-validator реджектит drift; `pnpm spec:contract-test`.

## Миграции

Нет. Stage 2 ничего не пишет; `ExternalId`/`Course` уже есть из Stage 1.

## Открытые follow-ups (не блокируют Stage 2)

- Кеш результатов скрейпа (rate-limit/quota YouTube) — при необходимости позже.
- Локальное кеширование poster-картинок — parked со Stage 1.
- Udemy name-search надёжность — best-effort; пересмотреть, если Udemy даст официальный API-доступ.

## Stage 2 — критичные файлы (для плана реализации)

- `apps/backend/src/modules/catalog/domain/scraper/{scraper.types,scraper.port,scraper.errors}.ts`
- `apps/backend/src/modules/catalog/infra/scrapers/{http-fetcher,html-metadata.extractor,json-ld.scraper,youtube.scraper,udemy.scraper,scraper.registry}.ts` (+ mock-скрейперы)
- `apps/backend/src/modules/catalog/application/commands/scrape-course.{command,handler}.ts`
- `apps/backend/src/modules/catalog/catalog-scrape-admin.controller.ts`
- `apps/backend/src/modules/catalog/catalog.module.ts` (регистрация registry + scrapers + handler)
- `apps/backend/src/common/config/app-config.ts` (`ScrapersConfig`)
- `packages/specs/openapi/openapi.yaml` (2 endpoint + DTO) → regen ts/dart (отдельный коммит)
- `apps/backend/package.json` (+`cheerio`)
