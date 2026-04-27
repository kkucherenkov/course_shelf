# CourseShelf — TODO

Flat checklist with all stories. Click a story ID to open its task file.
Tick the box (`- [ ]` → `- [x]`) when the task is done; the task file's
Status field changes to ✅ Done at the same time.

Legend: **A** = implementable now from the bundle · **B** = needs design pre-step.

Progress: `50 / 115` complete (update by hand or via a pre-commit hook).

## E00 — Stage the design bundle

- [x] [E00-F01-S01](./tasks/E00-F01-S01.md) `A` — Place the Claude Design bundle under docs/design/

## E01 — Repository foundations

- [x] [E01-F01-S01](./tasks/E01-F01-S01.md) `A` — Initialize pnpm + Turborepo workspace
- [x] [E01-F01-S02](./tasks/E01-F01-S02.md) `A` — Shared TypeScript & lint configs · ⇐ E01-F01-S01
- [ ] [E01-F02-S01](./tasks/E01-F02-S01.md) `A` — Env scaffolding and dev docker-compose · ⇐ E01-F01-S01

## E02 — API contracts as the spine

- [x] [E02-F01-S01](./tasks/E02-F01-S01.md) `A` — OpenAPI + AsyncAPI workspace, Spectral lint, bundle scripts · ⇐ E01-F01-S02
- [x] [E02-F01-S02](./tasks/E02-F01-S02.md) `A` — Reusable error schema, security scheme, version prefix · ⇐ E02-F01-S01
- [x] [E02-F02-S01](./tasks/E02-F02-S01.md) `A` — Generate `@app/api-client-ts` from the spec · ⇐ E02-F01-S02
- [x] [E02-F02-S02](./tasks/E02-F02-S02.md) `A` — Generate NestJS DTOs as `@app/api-client-ts/server` subpath · ⇐ E02-F01-S02
- [x] [E02-F02-S03](./tasks/E02-F02-S03.md) `A` — Generate Dart Dio client as `@app/api-client-dart` · ⇐ E02-F01-S02
- [x] [E02-F02-S04](./tasks/E02-F02-S04.md) `A` — `pnpm spec:codegen` aggregate + contract-test scaffold · ⇐ E02-F02-S01, E02-F02-S02, E02-F02-S03

## E03 — Design tokens

- [x] [E03-F01-S01](./tasks/E03-F01-S01.md) `A` — Import bundle tokens.json verbatim; wire custom design-tokens pipeline · ⇐ E00-F01-S01, E01-F01-S02
- [ ] [E03-F01-S02](./tasks/E03-F01-S02.md) `A` — Tailwind/Nuxt UI and Flutter theme adapters + Foundations canvas · ⇐ E03-F01-S01

## E04 — Backend skeleton + Better Auth

- [x] [E04-F01-S01](./tasks/E04-F01-S01.md) `A` — Bootstrap apps/backend with Prisma, modules skeleton, and shared kernel · ⇐ E02-F02-S04
- [x] [E04-F01-S02](./tasks/E04-F01-S02.md) `A` — `/healthz` and `/readyz` outside the OpenAPI spec · ⇐ E04-F01-S01
- [x] [E04-F02-S01](./tasks/E04-F02-S01.md) `A` — Configure Better Auth with bearer + admin plugins · ⇐ E04-F01-S01
- [x] [E04-F02-S02](./tasks/E04-F02-S02.md) `A` — Mount Better Auth + register global guard · ⇐ E04-F02-S01
- [x] [E04-F02-S03](./tasks/E04-F02-S03.md) `A` — Mount express-openapi-validator for /api/v1/\* · ⇐ E04-F02-S02

## E06 — Catalog bounded context

- [x] [E06-F01-S01](./tasks/E06-F01-S01.md) `A` — Library aggregate + repository port · ⇐ E04-F02-S03
- [x] [E06-F02-S01](./tasks/E06-F02-S01.md) `A` — Scan aggregate, FsAdapter, incremental scan · ⇐ E06-F01-S01
- [x] [E06-F02-S02](./tasks/E06-F02-S02.md) `A` — ffprobe + thumbnail extraction · ⇐ E06-F02-S01
- [x] [E06-F03-S01](./tasks/E06-F03-S01.md) `A` — Course aggregate + slug uniqueness + section ordering · ⇐ E06-F02-S01
- [x] [E06-F03-S02](./tasks/E06-F03-S02.md) `A` — Lesson + Material + Subtitle read model · ⇐ E06-F03-S01

## E07 — Access control

- [x] [E07-F01-S01](./tasks/E07-F01-S01.md) `A` — AccessGrant aggregate + admin endpoints · ⇐ E06-F01-S01
- [x] [E07-F01-S02](./tasks/E07-F01-S02.md) `A` — AuthorizationService consumed by Catalog & Streaming · ⇐ E07-F01-S01

## E08 — Streaming

- [x] [E08-F01-S01](./tasks/E08-F01-S01.md) `A` — Short-lived signed stream tokens · ⇐ E06-F03-S02, E07-F01-S02
- [x] [E08-F02-S01](./tasks/E08-F02-S01.md) `A` — `GET /stream/lessons/{id}` with Range support · ⇐ E08-F01-S01
- [x] [E08-F02-S02](./tasks/E08-F02-S02.md) `A` — Subtitle delivery (SRT → VTT) · ⇐ E06-F03-S02

## E09 — Learning

- [x] [E09-F01-S01](./tasks/E09-F01-S01.md) `A` — LessonProgress aggregate + record endpoint · ⇐ E04-F02-S03
- [x] [E09-F01-S02](./tasks/E09-F01-S02.md) `A` — Batch progress endpoint for sync · ⇐ E09-F01-S01
- [x] [E09-F02-S01](./tasks/E09-F02-S01.md) `A` — Bookmarks endpoints · ⇐ E04-F02-S03
- [x] [E09-F02-S02](./tasks/E09-F02-S02.md) `A` — Notes endpoints (one per user+lesson) · ⇐ E04-F02-S03

## E10 — Cross-context coupling

- [x] [E10-F01-S01](./tasks/E10-F01-S01.md) `A` — CourseProgressProjector + read model table · ⇐ E06-F03-S02, E09-F01-S01

## E11 — Web foundations

- [x] [E11-F01-S01](./tasks/E11-F01-S01.md) `A` — Bootstrap Nuxt SPA with Nuxt UI v4, Tailwind 4, and tokens · ⇐ E03-F01-S02, E04-F02-S03
- [x] [E11-F01-S02](./tasks/E11-F01-S02.md) `A` — Wire @app/api-client-ts with bearer interceptor + auth store · ⇐ E11-F01-S01
- [x] [E11-F01-S03](./tasks/E11-F01-S03.md) `A` — Auth store + minimal sign-in/setup pages · ⇐ E11-F01-S02

## E12 — Storybook for web

- [x] [E12-F01-S01](./tasks/E12-F01-S01.md) `A` — Configure Storybook for Vue 3 + Nuxt UI v4 + tokens · ⇐ E11-F01-S01

## E13 — Web component catalog

- [x] [E13-F01-S01](./tasks/E13-F01-S01.md) `A` — IconCS — port the bundle's 61-icon family to Vue · ⇐ E12-F01-S01
- [x] [E13-F01-S02](./tasks/E13-F01-S02.md) `A` — AppButton + AppIconButton (matches .btn classes) · ⇐ E12-F01-S01, E13-F01-S01
- [x] [E13-F01-S03](./tasks/E13-F01-S03.md) `A` — AppTextField, AppNumberField, AppSearchField, AppSelect, AppSwitch, AppCheckbox, AppRadio · ⇐ E12-F01-S01, E13-F01-S01
- [x] [E13-F01-S04](./tasks/E13-F01-S04.md) `A` — AppCard (.card, .card-lg, .card-hover) · ⇐ E12-F01-S01
- [x] [E13-F01-S05](./tasks/E13-F01-S05.md) `A` — AppRow — leading/body/trailing slots, selected + compact states · ⇐ E12-F01-S01, E13-F01-S01
- [x] [E13-F01-S06](./tasks/E13-F01-S06.md) `A` — AppTabs and AppSegmented controls · ⇐ E12-F01-S01
- [x] [E13-F01-S07](./tasks/E13-F01-S07.md) `A` — AppBanner (info/success/warning/error), AppToast, inline alerts · ⇐ E12-F01-S01, E13-F01-S01
- [x] [E13-F01-S08](./tasks/E13-F01-S08.md) `A` — AppDialog (sm/md), AppCommandPalette (desktop) · ⇐ E12-F01-S01, E13-F01-S02
- [x] [E13-F01-S09](./tasks/E13-F01-S09.md) `A` — AppProgressLinear, AppProgressCircle, AppSpinner, AppSkeleton · ⇐ E12-F01-S01
- [x] [E13-F01-S10](./tasks/E13-F01-S10.md) `A` — AppEmptyState, AppErrorState, AppNoPermission · ⇐ E12-F01-S01, E13-F01-S01, E13-F01-S02
- [x] [E13-F01-S11](./tasks/E13-F01-S11.md) `A` — AppAvatar (xs/sm/default/lg/xl, with role-admin and role-guest badges) · ⇐ E12-F01-S01
- [x] [E13-F01-S12](./tasks/E13-F01-S12.md) `A` — AppChip (default/primary/success/warning/error/info; removable variant) · ⇐ E12-F01-S01, E13-F01-S01
- [ ] [E13-F02-S01](./tasks/E13-F02-S01.md) `A` — CourseCard — Poster, Wide, Compact variants · ⇐ E13-F01-S01, E13-F01-S09
- [ ] [E13-F02-S02](./tasks/E13-F02-S02.md) `A` — LessonRow with state matrix; SectionHeader with collapse · ⇐ E13-F01-S01, E13-F01-S05, E13-F01-S09
- [ ] [E13-F02-S03](./tasks/E13-F02-S03.md) `A` — PlayerChrome (web) — overlay + minimal modes, full state set · ⇐ E13-F01-S01, E13-F01-S02, E13-F01-S09
- [ ] [E13-F02-S04](./tasks/E13-F02-S04.md) `A` — Bookmark, BookmarkAdd, BookmarkList · ⇐ E13-F01-S01, E13-F01-S02, E13-F01-S03
- [ ] [E13-F02-S05](./tasks/E13-F02-S05.md) `A` — NoteEditor with edit/preview toggle and self-evident sync indicator · ⇐ E13-F01-S01, E13-F01-S02, E13-F01-S03
- [ ] [E13-F02-S06](./tasks/E13-F02-S06.md) `A` — ProgressBadge — ring, bar, pill variants · ⇐ E13-F01-S01
- [ ] [E13-F02-S07](./tasks/E13-F02-S07.md) `A` — ScanProgress — live scan indicator with stats and current file · ⇐ E13-F01-S02, E13-F01-S09
- [ ] [E13-F02-S08](./tasks/E13-F02-S08.md) `A` — NavigationShell — top bar + sidebar (composes AppRow + IconCS) · ⇐ E13-F01-S01, E13-F01-S05, E13-F01-S11
- [ ] [E13-F02-S09](./tasks/E13-F02-S09.md) `A` — PasswordField — input with visibility toggle and optional strength meter · ⇐ E13-F01-S01, E13-F01-S03
- [ ] [E13-F02-S10](./tasks/E13-F02-S10.md) `A` — SsoBlock — third-party / SSO provider button row · ⇐ E13-F01-S02, E13-F01-S01

## E14 — Web pages

- [ ] [E14-F01-S01](./tasks/E14-F01-S01.md) `A` — Stage A · Home page (cs-web-home) · ⇐ E13-F02-S01, E13-F02-S08, E10-F01-S01, E11-F01-S03
- [ ] [E14-F01-S02](./tasks/E14-F01-S02.md) `B` — Stage B · Browse + Search (precede with cs-web-browse-search design) · ⇐ E13-F02-S01, E13-F02-S08
- [ ] [E14-F01-S03](./tasks/E14-F01-S03.md) `A` — Stage A · Course detail (cs-web-course-detail) · ⇐ E13-F02-S01, E13-F02-S02, E13-F02-S08
- [ ] [E14-F02-S01](./tasks/E14-F02-S01.md) `A` — Stage A · Sign in / sign up / forgot password (cs-web-auth) · ⇐ E11-F01-S03, E13-F02-S09, E13-F02-S10, E13-F01-S07
- [ ] [E14-F02-S02](./tasks/E14-F02-S02.md) `B` — Stage B · Settings page (precede with cs-web-settings) · ⇐ E13-F02-S08
- [ ] [E14-F03-S01](./tasks/E14-F03-S01.md) `A` — Stage A · Lesson player page wired to <video> (cs-web-lesson-player) · ⇐ E13-F02-S03, E13-F02-S04, E13-F02-S05, E08-F02-S01, E09-F01-S01
- [ ] [E14-F04-S01](./tasks/E14-F04-S01.md) `B` — Stage B · Admin section (precede with cs-web-admin) · ⇐ E13-F02-S07, E13-F02-S08, E07-F01-S01, E21-F01-S01

## E15 — Mobile foundations

- [ ] [E15-F01-S01](./tasks/E15-F01-S01.md) `A` — Flutter bootstrap, theme from tokens · ⇐ E03-F01-S02
- [ ] [E15-F01-S02](./tasks/E15-F01-S02.md) `A` — Wire generated Dio client with bearer interceptor · ⇐ E02-F02-S03, E15-F01-S01
- [ ] [E15-F01-S03](./tasks/E15-F01-S03.md) `A` — AuthCubit + AuthHttpClient (mobile sign-in/out) · ⇐ E15-F01-S02, E04-F02-S02
- [ ] [E15-F02-S01](./tasks/E15-F02-S01.md) `A` — Drift schema + DAOs · ⇐ E15-F01-S01

## E16 — Widgetbook

- [ ] [E16-F01-S01](./tasks/E16-F01-S01.md) `A` — widgetbook/main.dart + canary use case · ⇐ E15-F01-S01

## E17 — Mobile widget catalog

- [ ] [E17-F01-S01](./tasks/E17-F01-S01.md) `A` — IconCS Flutter widget — port the 61 icons · ⇐ E16-F01-S01
- [ ] [E17-F01-S02](./tasks/E17-F01-S02.md) `A` — AppButton, AppIconButton (Flutter) · ⇐ E16-F01-S01, E17-F01-S01
- [ ] [E17-F01-S03](./tasks/E17-F01-S03.md) `A` — AppTextField, AppNumberField, AppSearchField, AppDropdown, AppSwitch, AppCheckbox, AppRadio · ⇐ E16-F01-S01, E17-F01-S01
- [ ] [E17-F01-S04](./tasks/E17-F01-S04.md) `A` — AppCard, AppRow, AppTabs, AppSegmented · ⇐ E16-F01-S01, E17-F01-S01
- [ ] [E17-F01-S05](./tasks/E17-F01-S05.md) `A` — AppBanner, AppToast, AppAlert · ⇐ E16-F01-S01, E17-F01-S01
- [ ] [E17-F01-S06](./tasks/E17-F01-S06.md) `A` — AppDialog, AppBottomSheet · ⇐ E16-F01-S01, E17-F01-S02
- [ ] [E17-F01-S07](./tasks/E17-F01-S07.md) `A` — AppProgressLinear, AppProgressCircle, AppSpinner, AppSkeleton · ⇐ E16-F01-S01
- [ ] [E17-F01-S08](./tasks/E17-F01-S08.md) `A` — AppEmptyState, AppErrorState · ⇐ E16-F01-S01, E17-F01-S01, E17-F01-S02
- [ ] [E17-F01-S09](./tasks/E17-F01-S09.md) `A` — AppAvatar with role badges · ⇐ E16-F01-S01
- [ ] [E17-F01-S10](./tasks/E17-F01-S10.md) `A` — AppChip · ⇐ E16-F01-S01, E17-F01-S01
- [ ] [E17-F02-S01](./tasks/E17-F02-S01.md) `A` — CourseCard (poster / wide / compact in Flutter) · ⇐ E17-F01-S01, E17-F01-S07
- [ ] [E17-F02-S02](./tasks/E17-F02-S02.md) `A` — Mobile LessonRow including download state · ⇐ E17-F01-S01, E17-F01-S04, E17-F01-S07
- [ ] [E17-F02-S03](./tasks/E17-F02-S03.md) `A` — Mobile-landscape PlayerChrome with edge gestures · ⇐ E17-F01-S01, E17-F01-S02
- [ ] [E17-F02-S04](./tasks/E17-F02-S04.md) `A` — Bookmark, BookmarkAdd, NoteEditor (Flutter equivalents) · ⇐ E17-F01-S01, E17-F01-S02, E17-F01-S03
- [ ] [E17-F02-S05](./tasks/E17-F02-S05.md) `A` — ProgressBadge (Flutter — ring/bar/pill) · ⇐ E17-F01-S01
- [ ] [E17-F02-S06](./tasks/E17-F02-S06.md) `A` — DownloadRow (mobile-only) — full state machine · ⇐ E17-F01-S01, E17-F01-S07
- [ ] [E17-F02-S07](./tasks/E17-F02-S07.md) `A` — NavigationShell (mobile — bottom tab bar with 5 tabs) · ⇐ E17-F01-S01
- [ ] [E17-F02-S08](./tasks/E17-F02-S08.md) `A` — PasswordField (Flutter) — visibility toggle + strength meter · ⇐ E17-F01-S01, E17-F01-S03
- [ ] [E17-F02-S09](./tasks/E17-F02-S09.md) `A` — SsoBlock (Flutter) — provider button list · ⇐ E17-F01-S02, E17-F01-S01

## E18 — Mobile features

- [ ] [E18-F01-S01](./tasks/E18-F01-S01.md) `A` — Stage A · Home tab (cs-mobile-home) · ⇐ E17-F02-S01, E17-F02-S07, E15-F02-S01, E14-F01-S01
- [ ] [E18-F01-S02](./tasks/E18-F01-S02.md) `B` — Stage B · Browse tab (precede with cs-mobile-browse) · ⇐ E17-F02-S01, E17-F02-S07
- [ ] [E18-F01-S03](./tasks/E18-F01-S03.md) `B` — Stage B · Mobile Course detail (precede with cs-mobile-course-detail) · ⇐ E17-F02-S01, E17-F02-S02, E17-F02-S07
- [ ] [E18-F02-S01](./tasks/E18-F02-S01.md) `A` — Stage A · Mobile player BLoC + portrait/landscape lesson screen · ⇐ E17-F02-S03, E17-F02-S04, E15-F02-S01
- [ ] [E18-F03-S01](./tasks/E18-F03-S01.md) `A` — Stage A · Mobile sign in / sign up / forgot (cs-mobile-auth) · ⇐ E15-F01-S03, E17-F02-S08, E17-F02-S09, E17-F01-S05, E14-F02-S01
- [ ] [E18-F03-S02](./tasks/E18-F03-S02.md) `B` — Stage B · Search + Settings tabs (precede with cs-mobile-search-settings) · ⇐ E17-F02-S07

## E19 — Mobile offline

- [ ] [E19-F01-S01](./tasks/E19-F01-S01.md) `A` — DownloadsBloc with resumable encrypted downloads · ⇐ E18-F02-S01, E15-F02-S01
- [ ] [E19-F01-S02](./tasks/E19-F01-S02.md) `A` — Offline-first lesson resolution · ⇐ E19-F01-S01
- [ ] [E19-F01-S03](./tasks/E19-F01-S03.md) `B` — Stage B · Downloads tab UI (precede with cs-mobile-downloads) · ⇐ E19-F01-S01, E17-F02-S06

## E20 — Mobile sync

- [ ] [E20-F01-S01](./tasks/E20-F01-S01.md) `A` — SyncBloc with connectivity + ticker triggers · ⇐ E19-F01-S01

## E21 — Admin & operations

- [x] [E21-F01-S01](./tasks/E21-F01-S01.md) `A` — GET /admin/dashboard aggregator · ⇐ E10-F01-S01, E07-F01-S01
- [ ] [E21-F01-S02](./tasks/E21-F01-S02.md) `A` — POST /admin/backups (DB snapshot archive) · ⇐ E04-F02-S03
- [x] [E21-F02-S01](./tasks/E21-F02-S01.md) `A` — Rate limit on Better Auth sign-in · ⇐ E04-F02-S03
- [ ] [E21-F02-S02](./tasks/E21-F02-S02.md) `A` — CSP + secure headers (Helmet) tuned for SPA + bearer · ⇐ E11-F01-S01

## E22 — CI/CD

- [ ] [E22-F01-S01](./tasks/E22-F01-S01.md) `A` — Reusable setup action (Node + pnpm + Flutter cache) · ⇐ E01-F02-S01
- [x] [E22-F01-S02](./tasks/E22-F01-S02.md) `A` — ci.yml with parallel jobs per app/package · ⇐ E22-F01-S01
- [ ] [E22-F01-S03](./tasks/E22-F01-S03.md) `A` — Storybook test-runner job · ⇐ E22-F01-S01, E12-F01-S01
- [ ] [E22-F01-S04](./tasks/E22-F01-S04.md) `A` — Visual regression (Storybook test-runner snapshots) + manual approval label · ⇐ E22-F01-S03
- [ ] [E22-F01-S05](./tasks/E22-F01-S05.md) `A` — Flutter golden test job · ⇐ E22-F01-S01, E16-F01-S01
- [ ] [E22-F01-S06](./tasks/E22-F01-S06.md) `A` — release.yml — build + publish API+web Docker image to GHCR · ⇐ E22-F01-S02

## E23 — Distribution & docs

- [ ] [E23-F01-S01](./tasks/E23-F01-S01.md) `A` — Multi-stage Dockerfile (api + built web SPA) · ⇐ E22-F01-S06
- [ ] [E23-F01-S02](./tasks/E23-F01-S02.md) `A` — docker-compose.yml (sqlite default) + docker-compose.postgres.yml · ⇐ E23-F01-S01
- [ ] [E23-F02-S01](./tasks/E23-F02-S01.md) `A` — Top-level README + quickstart + screenshots · ⇐ E14-F03-S01, E18-F02-S01
- [ ] [E23-F02-S02](./tasks/E23-F02-S02.md) `A` — Seed ADRs (10 entries) · ⇐ E04-F02-S03
- [ ] [E23-F02-S03](./tasks/E23-F02-S03.md) `A` — Contributor docs covering the spec-first and design-first workflows · ⇐ E14-F01-S01

## E24 — Realtime / Centrifugo

- [x] [E24-F01-S01](./tasks/E24-F01-S01.md) `A` — AsyncAPI Centrifugo channels + POST /api/v1/realtime/token · ⇐ E04-F02-S03
