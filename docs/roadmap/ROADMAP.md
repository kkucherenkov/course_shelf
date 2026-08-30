# CourseShelf — Roadmap (Gantt)

Mermaid Gantt of every story, grouped by epic. Dependencies encoded via `after`.
Durations are estimates; adjust as you go.

GitHub renders Mermaid in markdown; if your viewer does not, paste the
block into <https://mermaid.live>.

```mermaid
gantt
    title CourseShelf v1 implementation
    dateFormat  YYYY-MM-DD
    axisFormat  %b %d
    excludes weekends

    section E00 Stage the design bundle
    Place the Claude Design bundle under docs/design/            :done, e00f01s01, 2026-04-25, 1d

    section E01 Repository foundations
    Initialize pnpm + Turborepo workspace                        :done, e01f01s01, 2026-04-25, 1d
    Shared TypeScript & lint configs                             :done, e01f01s02, after e01f01s01, 1d
    Env scaffolding and dev docker-compose                       :done, e01f02s01, after e01f01s01, 1d

    section E02 API contracts as the spine
    OpenAPI + AsyncAPI workspace, Spectral lint, bundle scripts  :done, e02f01s01, after e01f01s02, 1d
    Reusable error schema, security scheme, version prefix       :done, e02f01s02, after e02f01s01, 1d
    Generate `@app/api-client-ts` from the spec                  :done, e02f02s01, after e02f01s02, 2d
    Generate NestJS DTOs as `@app/api-client-ts/server` subpath  :done, e02f02s02, after e02f01s02, 2d
    Generate Dart Dio client as `@app/api-client-dart`           :done, e02f02s03, after e02f01s02, 2d
    `pnpm spec —codegen` aggregate + contract-test scaffold      :done, e02f02s04, after e02f02s01 e02f02s02 e02f02s03, 1d

    section E03 Design tokens
    Import bundle tokens.json verbatim; wire custom design-token :done, e03f01s01, after e00f01s01 e01f01s02, 2d
    Tailwind/Nuxt UI and Flutter theme adapters + Foundations ca :done, e03f01s02, after e03f01s01, 2d

    section E04 Backend skeleton + Better Auth
    Bootstrap apps/backend with Prisma, modules skeleton, and sh :done, e04f01s01, after e02f02s04, 2d
    `/healthz` and `/readyz` outside the OpenAPI spec            :done, e04f01s02, after e04f01s01, 1d
    Configure Better Auth with bearer + admin plugins            :done, e04f02s01, after e04f01s01, 2d
    Mount Better Auth + register global guard                    :done, e04f02s02, after e04f02s01, 1d
    Mount express-openapi-validator for /api/v1/*                :done, e04f02s03, after e04f02s02, 1d

    section E06 Catalog bounded context
    Library aggregate + repository port                          :done, e06f01s01, after e04f02s03, 2d
    Scan aggregate, FsAdapter, incremental scan                  :done, e06f02s01, after e06f01s01, 3d
    ffprobe + thumbnail extraction                               :done, e06f02s02, after e06f02s01, 2d
    Course aggregate + slug uniqueness + section ordering        :done, e06f03s01, after e06f02s01, 2d
    Lesson + Material + Subtitle read model                      :done, e06f03s02, after e06f03s01, 2d

    section E07 Access control
    AccessGrant aggregate + admin endpoints                      :done, e07f01s01, after e06f01s01, 2d
    AuthorizationService consumed by Catalog & Streaming         :done, e07f01s02, after e07f01s01, 2d

    section E08 Streaming
    Short-lived signed stream tokens                             :done, e08f01s01, after e06f03s02 e07f01s02, 2d
    `GET /stream/lessons/{id}` with Range support                :done, e08f02s01, after e08f01s01, 2d
    Subtitle delivery (SRT → VTT)                                :done, e08f02s02, after e06f03s02, 1d

    section E09 Learning
    LessonProgress aggregate + record endpoint                   :done, e09f01s01, after e04f02s03, 2d
    Batch progress endpoint for sync                             :done, e09f01s02, after e09f01s01, 1d
    Bookmarks endpoints                                          :done, e09f02s01, after e04f02s03, 1d
    Notes endpoints (one per user+lesson)                        :done, e09f02s02, after e04f02s03, 1d

    section E10 Cross-context coupling
    CourseProgressProjector + read model table                   :done, e10f01s01, after e06f03s02 e09f01s01, 2d

    section E11 Web foundations
    Bootstrap Nuxt SPA with Nuxt UI v4, Tailwind 4, and tokens   :done, e11f01s01, after e03f01s02 e04f02s03, 2d
    Wire @app/api-client-ts with bearer interceptor + auth store :done, e11f01s02, after e11f01s01, 2d
    Auth store + minimal sign-in/setup pages                     :done, e11f01s03, after e11f01s02, 2d

    section E12 Storybook for web
    Configure Storybook for Vue 3 + Nuxt UI v4 + tokens          :done, e12f01s01, after e11f01s01, 1d

    section E13 Web component catalog
    IconCS — port the bundle's 61-icon family to Vue             :done, e13f01s01, after e12f01s01, 2d
    AppButton + AppIconButton (matches .btn classes)             :done, e13f01s02, after e12f01s01 e13f01s01, 2d
    AppTextField, AppNumberField, AppSearchField, AppSelect, App :done, e13f01s03, after e12f01s01 e13f01s01, 3d
    AppCard (.card, .card-lg, .card-hover)                       :done, e13f01s04, after e12f01s01, 1d
    AppRow — leading/body/trailing slots, selected + compact sta :done, e13f01s05, after e12f01s01 e13f01s01, 1d
    AppTabs and AppSegmented controls                            :done, e13f01s06, after e12f01s01, 1d
    AppBanner (info/success/warning/error), AppToast, inline ale :done, e13f01s07, after e12f01s01 e13f01s01, 1d
    AppDialog (sm/md), AppCommandPalette (desktop)               :done, e13f01s08, after e12f01s01 e13f01s02, 1d
    AppProgressLinear, AppProgressCircle, AppSpinner, AppSkeleto :done, e13f01s09, after e12f01s01, 1d
    AppEmptyState, AppErrorState, AppNoPermission                :done, e13f01s10, after e12f01s01 e13f01s01 e13f01s02, 1d
    AppAvatar (xs/sm/default/lg/xl, with role-admin and role-gue :done, e13f01s11, after e12f01s01, 1d
    AppChip (default/primary/success/warning/error/info; removab :done, e13f01s12, after e12f01s01 e13f01s01, 1d
    CourseCard — Poster, Wide, Compact variants                  :done, e13f02s01, after e13f01s01 e13f01s09, 3d
    LessonRow with state matrix; SectionHeader with collapse     :done, e13f02s02, after e13f01s01 e13f01s05 e13f01s09, 2d
    PlayerChrome (web) — overlay + minimal modes, full state set :done, e13f02s03, after e13f01s01 e13f01s02 e13f01s09, 4d
    Bookmark, BookmarkAdd, BookmarkList                          :done, e13f02s04, after e13f01s01 e13f01s02 e13f01s03, 1d
    NoteEditor with edit/preview toggle and self-evident sync in :done, e13f02s05, after e13f01s01 e13f01s02 e13f01s03, 2d
    ProgressBadge — ring, bar, pill variants                     :done, e13f02s06, after e13f01s01, 1d
    ScanProgress — live scan indicator with stats and current fi :done, e13f02s07, after e13f01s02 e13f01s09, 2d
    NavigationShell — top bar + sidebar (composes AppRow + IconC :done, e13f02s08, after e13f01s01 e13f01s05 e13f01s11, 2d
    PasswordField — input with visibility toggle and optional st :done, e13f02s09, after e13f01s01 e13f01s03, 2d
    SsoBlock — third-party / SSO provider button row             :done, e13f02s10, after e13f01s02 e13f01s01, 1d

    section E14 Web pages
    Stage A · Home page (cs-web-home)                            :done, e14f01s01, after e13f02s01 e13f02s08 e10f01s01 e11f01s03, 3d
    Stage B · Browse + Search (precede with cs-web-browse-search :crit, done, e14f01s02, after e13f02s01 e13f02s08, 4d
    Stage A · Course detail (cs-web-course-detail)               :done, e14f01s03, after e13f02s01 e13f02s02 e13f02s08, 3d
    Stage A · Sign in / sign up / forgot password (cs-web-auth)  :done, e14f02s01, after e11f01s03 e13f02s09 e13f02s10 e13f01s07, 4d
    Stage B · Settings page (precede with cs-web-settings)       :crit, done, e14f02s02, after e13f02s08, 2d
    Stage A · Lesson player page wired to <video> (cs-web-lesson :done, e14f03s01, after e13f02s03 e13f02s04 e13f02s05 e08f02s01 e09f01s01, 4d
    Stage B · Admin section (precede with cs-web-admin)          :crit, done, e14f04s01, after e13f02s07 e13f02s08 e07f01s01 e21f01s01, 5d

    section E15 Mobile foundations
    Flutter bootstrap, theme from tokens                         :done, e15f01s01, after e03f01s02, 2d
    Wire generated Dio client with bearer interceptor            :done, e15f01s02, after e02f02s03 e15f01s01, 1d
    AuthCubit + AuthHttpClient (mobile sign-in/out)              :done, e15f01s03, after e15f01s02 e04f02s02, 2d
    Drift schema + DAOs                                          :done, e15f02s01, after e15f01s01, 2d

    section E16 Widgetbook
    widgetbook/main.dart + canary use case                       :done, e16f01s01, after e15f01s01, 1d

    section E17 Mobile widget catalog
    IconCS Flutter widget — port the 66 icons                    :done, e17f01s01, after e16f01s01, 3d
    AppButton, AppIconButton (Flutter)                           :done, e17f01s02, after e16f01s01 e17f01s01, 2d
    AppTextField, AppNumberField, AppSearchField, AppSelect, App :done, e17f01s03, after e16f01s01 e17f01s01, 3d
    AppCard, AppRow, AppTabs, AppSegmented                       :done, e17f01s04, after e16f01s01 e17f01s01, 2d
    AppBanner, AppToast, AppAlert                                :done, e17f01s05, after e16f01s01 e17f01s01, 1d
    AppDialog (mirrors web AppDialog), AppBottomSheet (mobile-on :done, e17f01s06, after e16f01s01 e17f01s02, 1d
    AppProgressLinear, AppProgressCircle, AppSpinner, AppSkeleto :done, e17f01s07, after e16f01s01, 1d
    AppEmptyState, AppErrorState                                 :done, e17f01s08, after e16f01s01 e17f01s01 e17f01s02, 1d
    AppAvatar with role badges                                   :done, e17f01s09, after e16f01s01, 1d
    AppChip                                                      :done, e17f01s10, after e16f01s01 e17f01s01, 1d
    AppBadge (Flutter) — status/count badge                      :done, e17f01s11, after e16f01s01 e17f01s01, 1d
    AppTextarea (Flutter) — multiline text input                 :done, e17f01s12, after e16f01s01 e17f01s01, 1d
    AppNoPermission (Flutter) — permission-denied state          :done, e17f01s13, after e16f01s01 e17f01s01, 1d
    AppRadioGroup (Flutter) — radio group wrapper                :done, e17f01s14, after e16f01s01 e17f01s03, 1d
    CourseCard (poster / wide / compact in Flutter)              :done, e17f02s01, after e17f01s01 e17f01s07, 3d
    Mobile LessonRow including download state                    :done, e17f02s02, after e17f01s01 e17f01s04 e17f01s07, 2d
    Mobile-landscape PlayerChrome with edge gestures             :done, e17f02s03, after e17f01s01 e17f01s02, 3d
    Bookmark, BookmarkAdd, NoteEditor (Flutter equivalents)      :done, e17f02s04, after e17f01s01 e17f01s02 e17f01s03, 2d
    ProgressBadge (Flutter — ring/bar/pill)                      :done, e17f02s05, after e17f01s01, 1d
    DownloadRow (mobile-only) — full state machine               :done, e17f02s06, after e17f01s01 e17f01s07, 2d
    NavigationShell (mobile — bottom tab bar with 5 tabs)        :done, e17f02s07, after e17f01s01, 2d
    PasswordField (Flutter) — visibility toggle + strength meter :done, e17f02s08, after e17f01s01 e17f01s03, 2d
    SsoBlock (Flutter) — provider button list                    :done, e17f02s09, after e17f01s02 e17f01s01, 1d
    AppBookmarkList (Flutter) — bookmark list with hover edit/de :done, e17f02s10, after e17f02s04, 1d
    AppSectionHeader (Flutter) — collapsible section header (cou :done, e17f02s11, after e17f02s02, 1d

    section E18 Mobile features
    Stage A · Home tab (cs-mobile-home)                          :done, e18f01s01, after e17f02s01 e17f02s07 e15f02s01 e14f01s01, 3d
    Stage B · Browse tab (precede with cs-mobile-browse)         :crit, done, e18f01s02, after e17f02s01 e17f02s07, 3d
    Stage B · Mobile Course detail (precede with cs-mobile-cours :crit, done, e18f01s03, after e17f02s01 e17f02s02 e17f02s07, 4d
    Stage A · Mobile player BLoC + portrait/landscape lesson scr :done, e18f02s01, after e17f02s03 e17f02s04 e15f02s01, 4d
    Stage A · Mobile sign in / sign up / forgot (cs-mobile-auth) :done, e18f03s01, after e15f01s03 e17f02s08 e17f02s09 e17f01s05 e14f02s01, 4d
    Stage B · Search + Settings tabs (precede with cs-mobile-sea :crit, done, e18f03s02, after e17f02s07, 3d

    section E19 Mobile offline
    DownloadsBloc with resumable encrypted downloads             :done, e19f01s01, after e18f02s01 e15f02s01, 4d
    Offline-first lesson resolution                              :done, e19f01s02, after e19f01s01, 2d
    Stage B · Downloads tab UI (precede with cs-mobile-downloads :crit, done, e19f01s03, after e19f01s01 e17f02s06, 3d

    section E20 Mobile sync
    SyncBloc with connectivity + ticker triggers                 :done, e20f01s01, after e19f01s01, 3d

    section E21 Admin & operations
    GET /admin/dashboard aggregator                              :done, e21f01s01, after e10f01s01 e07f01s01, 2d
    POST /admin/backups (DB snapshot archive)                    :done, e21f01s02, after e04f02s03, 2d
    Rate limit on Better Auth sign-in                            :done, e21f02s01, after e04f02s03, 1d
    CSP + secure headers (Helmet) tuned for SPA + bearer         :done, e21f02s02, after e11f01s01, 2d

    section E22 CI/CD
    Reusable setup action (Node + pnpm + Flutter cache)          :done, e22f01s01, after e01f02s01, 1d
    ci.yml with parallel jobs per app/package                    :done, e22f01s02, after e22f01s01, 2d
    Storybook test-runner job                                    :done, e22f01s03, after e22f01s01 e12f01s01, 1d
    Visual regression (Storybook test-runner snapshots) + manual :done, e22f01s04, after e22f01s03, 2d
    Flutter golden test job                                      :done, e22f01s05, after e22f01s01 e16f01s01, 1d
    release.yml — build + publish API+web Docker image to GHCR   :done, e22f01s06, after e22f01s02, 2d

    section E23 Distribution & docs
    Top-level README + quickstart + screenshots                  :done, e23f02s01, after e14f03s01 e18f02s01, 2d
    Seed ADRs (10 entries)                                       :done, e23f02s02, after e04f02s03, 2d
    Contributor docs covering the spec-first and design-first wo :done, e23f02s03, after e14f01s01, 2d

    section E24 Realtime / Centrifugo
    AsyncAPI Centrifugo channels + POST /api/v1/realtime/token   :done, e24f01s01, after e04f02s03, 2d

    section E25 Transcription (Whisper)
    Derived-artifact volume, whisper config, and the binary in t :active, e25f01s01, after e01f02s01, 1d
    Derived path resolution with its own traversal guard         :active, e25f01s02, after e25f01s01, 1d
    ffmpeg audio extraction for whisper                          :done, e25f01s03, after e06f02s02, 1d
    whisper.cpp adapter behind a port                            :active, e25f01s04, after e25f01s01, 1d
    Transcript and transcription schema                          :done, e25f02s01, after e06f03s02, 1d
    Transcription aggregate                                      :done, e25f02s02, after e25f02s01, 1d
    The skip rule                                                :done, e25f02s03, after e25f02s01, 1d
    OpenAPI for transcription runs and generated subtitles       :done, e25f03s01, after e02f02s04, 1d
    The transcription run                                        :active, e25f03s02, after e25f01s02 e25f01s03 e25f01s04 e25f02s02 e25f02s03 e25f03s01, 3d
    Serve generated transcripts as subtitle tracks               :active, e25f03s03, after e08f02s02 e25f02s01, 1d
    Scan thumbnails to the derived volume, and orphan cleanup    :active, e25f04s01, after e25f01s02, 1d
    Transcription card in the admin library screen               :active, e25f04s02, after e25f03s01 e14f04s01, 2d
    Transcription documentation                                  :active, e25f04s03, after e25f03s02, 1d

    section E26 Transcript panel (web)
    Render the subtitle tracks in the web player                 :done, e26f01s01, after e08f02s02 e14f03s01, 1d
    useTranscriptCues composable                                 :done, e26f01s02, after e26f01s01, 1d
    Transcript tab in the player sidebar                         :active, e26f01s03, after e26f01s02, 2d
    `?t=` deep links into a lesson                               :done, e26f01s04, after e26f01s01, 1d

    section E27 Transcript storage and search
    Parse existing subtitle sidecars into cues                   :active, e27f01s01, after e25f02s01 e25f03s02, 2d
    Trigram index over cue text                                  :active, e27f01s02, after e27f01s01, 1d
    Transcript hits in the search API                            :active, e27f02s01, after e27f01s02, 2d
    Transcript results on the web search page                    :active, e27f02s02, after e27f02s01 e26f01s04, 1d

    section E28 Notes export
    Export a lesson or course digest as Markdown                 :crit, active, e28f01s01, after e27f01s01 e09f02s02, 2d

    section E29 Learning mechanics
    Flashcard and review schedule domain (SM-2)                  :crit, active, e29f01s01, after e09f02s02, 2d
    Flashcard API                                                :active, e29f01s02, after e29f01s01, 2d
    Review UI on web                                             :active, e29f01s03, after e29f01s02, 2d
    Quizzes generated from a transcript                          :crit, active, e29f02s01, after e27f01s01, 3d
    Learning paths                                               :crit, active, e29f03s01, after e06f03s01, 2d

    section E30 Scraper plugins
    Declarative scraper definitions                              :crit, active, e30f01s01, after e06f02s01, 3d
    Scraper inventory in the admin UI                            :active, e30f01s02, after e30f01s01, 1d

    section E31 Honest v1.1
    Finish the browse filters                                    :active, e31f01s01, after e14f01s02, 2d
    Backups UI                                                   :active, e31f01s02, after e21f01s02, 1d
    Fix the duplicated offline bookmark                          :done, e31f01s03, after e20f01s01, 2d
    Remove the SSO promise                                       :done, e31f02s01, after e14f02s01, 1d
    Remove the non-functional Settings controls                  :done, e31f02s02, after e14f02s02, 1d
    Settle the locale parity claim                               :active, e31f02s03, after e15f01s02, 1d
    Verify or remove the mobile storage bar                      :active, e31f02s04, after e19f01s03, 1d

```

## Reading the chart

Two independent axes; a row can carry one tag from each.

**Progress** — read from each card's `**Status:**`, not from this file.

- **Done (greyed / struck)** — the story has shipped.
- **Active (lighter)** — not started yet.
- Cancelled stories are not rendered at all, and no remaining row
  depends on one.

**Stage** —

- **Critical (darker / red-tinted)** — Stage B stories that require a
  design pre-step before implementation. Treat the duration as
  "design + build."
- Untinted rows are Stage A: implementable directly from the bundle.

## Sequencing notes

For a single-track contributor, walk epics in this order: E00 → E01 →
E02 → E03 → E04 → E05 → E06 → E07 → E08 → E09 → E10 → E11 → E12 → E13 →
E14 → E15 → E16 → E17 → E18 → E19 → E20 → (E21 in parallel) → E22 → E23.

For two parallel tracks once E10 lands:

- **Track A (web)**: E11 → E12 → E13 → E14
- **Track B (mobile)**: E15 → E16 → E17 → E18 → E19 → E20

Stage B design pre-steps are independently sequenceable — produce a
bundle while implementation continues on Stage A stories.

## Re-generating

```sh
python3 docs/roadmap/tools/generate.py --roadmap-only
```

Story metadata (titles, dependencies, durations, stage) comes from the
registry inside that script; progress comes from each card's
`**Status:**`. Do not hand-edit the chart — it will be clobbered.

`--roadmap-only` is the only safe mode once the cards carry real
status: a full run is a one-shot seeder that resets all 121 cards to
`Not started`, which is why `refuse_if_seeded()` blocks it. CI runs
`--roadmap-only --check` so the chart cannot drift from the cards
again.
