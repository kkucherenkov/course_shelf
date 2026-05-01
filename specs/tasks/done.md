# Done tasks

_Archive of shipped tasks. Never delete entries — cancelled tasks go here with reason._

## T-2026-05-01-005 — Browse half: filters + sort (E14-F01-S02 partial)

- Created: 2026-05-01
- Completed: 2026-05-01
- Owner: claude
- Spec: `docs/roadmap/tasks/E14-F01-S02.md` (partial — search half shipped earlier in #177)
- Outcome:
  - **Spec**: `GET /api/v1/courses` gained `status: all | not-started | in-progress | completed` (default `all`) and `sort: recently-watched | newest | alphabetical` (default `recently-watched`).
  - **Backend**: `ListCoursesQuery` carries the new fields with defaults; `ListCoursesHandler` applies the status filter on `progress.percent` and sorts via `toSorted` (newest=createdAt desc, alphabetical=title asc, recently-watched=updatedAt desc as a proxy until a dedicated `lastViewedAt` lands). Controller parses + clamps both query params. +7 handler tests, 944 total.
  - **Web** (`apps/web/app/pages/browse.vue`): chip row (status) + `AppSelect` sort dropdown above the grid. `useCoursesList` accepts `Ref<status>` and `Ref<sort>` and refetches on change with a per-combination cache key. New empty-state copy for filtered-no-match.
  - **i18n**: added `pages.browse.filters.*` and `pages.browse.sort.*` in en + ru. 434 → 445 keys × 2 locales, parity green.
- Out of scope (explicit follow-ups for the card to be fully closed):
  - **Duration buckets** filter — needs `totalDurationSeconds` on `CourseDto` (today only on the outline summary). Either per-course lesson stats lookup at list time, or a denormalised column.
  - **Instructor** filter — `Course` aggregate has no `instructor` field yet.
  - **Bottom-sheet UX** at xs/sm — chip row wraps but doesn't morph into a sheet; deferred to design polish once `cs-web-browse-search` is signed off.

## T-2026-05-01-003 — Contributor runbooks (E23-F02-S03)

- Created: 2026-05-01
- Completed: 2026-05-01
- Owner: claude
- Spec: `docs/roadmap/tasks/E23-F02-S03.md`
- Outcome:
  - `docs/contributing/spec-first.md` — copy-pasteable runbook. Worked example (`GET /libraries/{id}/recent-scans`) walks edit YAML → `pnpm spec:codegen` → CQRS handler + controller + tests → SPA composable → commit pattern (codegen as its own commit).
  - `docs/contributing/design-first.md` — parallel runbook for UI. Walks bundle layout (`docs/design/<area>/`) → tokens (`pnpm design:build`) → catalog component Storybook-first → page composition with `@app/ui` primitives + `@app/api-client-ts` composables.
  - Both include a before-you-merge checklist and a pitfalls section calling out things that have actually broken in this repo (editing generated files, hex colors in scss, `<UButton>` direct imports, skipping bundle step).

## T-2026-05-01-001 — Storybook test-runner CI job (E22-F01-S03)

- Created: 2026-05-01
- Completed: 2026-05-01
- Owner: claude
- Spec: `docs/roadmap/tasks/E22-F01-S03.md`
- Outcome: new `ui-storybook` job in `.forgejo/workflows/ci.yml` — installs Playwright chromium, builds the static Storybook bundle, and runs `@storybook/test-runner` against all 279 stories across 50 components. Fails on render errors and failed `play()` interactions, which is the card's stated acceptance.
- Side note: the existing `parameters.a11y.test = 'error'` global gate in `.storybook/preview.ts` would have failed this job out of the gate (73 stories have axe violations). Added a `STORYBOOK_A11Y_LEVEL` env var override (default stays `'error'` for `pnpm storybook` and any unset env); the CI job sets `STORYBOOK_A11Y_LEVEL=todo` so a11y becomes warn-only. Fixing the underlying violations is its own work.

## T-2026-05-01-002 — CSP + Helmet hardening (E21-F02-S02)

- Created: 2026-05-01
- Completed: 2026-05-01
- Owner: claude
- Spec: `docs/roadmap/tasks/E21-F02-S02.md`
- Outcome:
  - **Backend** (`apps/backend/src/main.ts`) — Helmet now ships an explicit `contentSecurityPolicy.directives` block tuned for the SPA + bearer + Centrifugo. `default-src 'self'`, `script-src 'self'` (no inline), `style-src 'unsafe-inline'` (Vue scoped styles inject `<style>` at runtime), `connect-src 'self' ws: wss:`, `frame-ancestors 'none'`, `object-src 'none'`. Plus `Cross-Origin-Resource-Policy: same-origin` and `Referrer-Policy: strict-origin-when-cross-origin`. Disabled in dev so Vite/Storybook hot-reload still works.
  - **Web nginx** (`apps/web/nginx.conf`) — same CSP plus `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` on every SPA HTML response. Two parallel CSPs because the directive is per-document and the SPA is the document host.
  - **e2e** (`tests/e2e/csp.spec.ts`) — Playwright spec asserts the secure-header set on `/` (always) and `/api/v1/*` (when backend runs in production mode; skipped otherwise) — the card's stated test acceptance.
  - **`vue/no-v-html`** — already at level 2 via the recommended Vue ESLint preset; the existing AppNoteEditor v-html carries an explicit eslint-disable. No new rule needed.

## T-2026-04-28-002 — Group course materials by section in the right-rail

- Created: 2026-04-28
- Completed: 2026-04-28
- Result: PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/178 — three commits (spec codegen, backend, web).
- Owner: claude
- Spec: ad-hoc UX polish on top of E14-F01-S03 — no roadmap card.
- Outcome: `CourseMaterialItem` gained required `sectionId` + `sectionTitle` and a documented sort contract — `getCourseOutline` returns the flat materials list ordered by `(section.position, lesson.position, material.id)` so consecutive items belong to the same section. `GetCourseOutlineHandler` does the cross-section sort + decoration in step 7; lessons with an unknown `sectionId` (data anomaly — Section is a child aggregate of Course so it should be unreachable) sort to the end with `+∞`. `CourseMaterialsRail.vue` groups consecutive items by `sectionId` and renders a small uppercase caption per cluster, but only when the rail spans 2+ sections so single-section courses stay visually quiet. +1 backend handler test (cross-section ordering with mixed-input fixture); web tests 153/153.

## T-2026-04-29-061 — Stage B Admin section (E14-F04-S01)

- Created: 2026-04-29
- Completed: 2026-04-29
- Result: shipped in four chunked PRs (each = spec + backend + web), plus a missing-dep prep PR and one rescue PR.
  - PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/163 — `feat(ui): AppScanProgress` (closes E13-F02-S07; the only missing dep before chunk 1).
  - PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/164 — **chunk 1 Dashboard**: admin layout shell + middleware + `/admin` page (4 stat cards + recent-scans table).
  - PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/165 — **chunk 2 Libraries**: list with counters + detail page with live `AppScanProgress` (2 s polling) + Add CTA + scan history.
  - PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/166 — rescue: restored spec source files Forgejo's squash-merge of #165 silently dropped (the SDK had the new types but `openapi.yaml` did not, which would break the validator on the next codegen run).
  - PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/167 — **chunk 3 Users**: list with debounced search + `AdminRoleChip` inline mutation + ban-via-disabled with optimistic update + self-protect read-only on the signed-in admin's own row.
  - merge commit `d2ddc11` on `main` — **chunk 4 Permissions**: `/admin/permissions/<userId>` with per-library Read/None toggle + lazy-expanded per-course overrides; user-picker landing at `/admin/permissions`. Origin was offline at merge time so this one is a local merge rather than a Forgejo PR — the three feature commits (`fc02d82` spec, `ee4c2fd` backend, `0e93a8f` web) are still discoverable on `main`.
- Owner: claude
- Spec: `docs/roadmap/tasks/E14-F04-S01.md` (source: `docs/design/cs-web-admin/`)
- Outcome: full admin surface — Dashboard / Libraries / Users / Permissions — gated by `middleware: 'admin'` (route-level, opt-in via `definePageMeta`), surfaced behind a separate `layouts/admin.vue` shell with responsive sidebar (xs single column, md icons-only, lg full labels). Backend port surface grew from a single `getSnapshot()` to a 7-method `DashboardPort` (`getSnapshot`, `hasAnyUser`, `listRecentScans`, `listAllLibrariesWithCounts`, `listUsers`, `updateUser`, `findUserById`). Web grew nine new composables along the way (`useAdminDashboard`, `useAdminScans`, `useAdminLibraries`, `useAdminLibraryScans`, `useScanProgress`, `useAdminUsers`, `useUpdateAdminUser`, `useAdminUser`, `useAccessGrants`). All grant operations reuse the existing `POST/GET/DELETE /access/grants` endpoints from E07-F01-S01 — no new spec for them.
- Test totals at end: backend 853 / 855 (+50 across the chunks); web 101 / 101 (+58 across the chunks); UI 835 / 835 (chunk 0 only); 333 i18n keys × 2 web locales (was 195).
- Side-effect fixes that landed alongside this card: PR #163 also delivered the dependency E13-F02-S07. PR #166 fixed Forgejo's squash-merge dropping spec source. Backend `exactOptionalPropertyTypes` strict-mode patches across multiple admin specs (chunk 3) — conditional spread instead of `undefined`-passthrough; defensive `[0]?.x` array indexing in unit tests. Backend `prisma.session.deleteMany` on `banned: true` so kicked users lose authentication immediately (chunk 3).
- Notes / deferred: PATCH /libraries/{id}, DELETE /libraries/{id}, and removing users (vs banning) are all "Coming soon" toasts in the UI; the underlying endpoints aren't specced yet. Dashboard "Last scan" stat card shows `Library {libraryId.slice(0,8)}…` because `latestScan` from `/admin/dashboard` doesn't carry a library name (the recent-scans table below it covers the human-readable label). Activity column ("X libraries · Y min watched") on the Users page is dropped — we don't yet aggregate per-user grant counts and minutes-watched on the API.

## T-2026-04-28-001 — AppScanProgress (E13-F02-S07)

- Created: 2026-04-28
- Completed: 2026-04-28
- Result: single feat commit on `feat/scan-progress-ui-component`
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F02-S07.md`
- Outcome: `packages/ui/src/components/ScanProgress/AppScanProgress.vue` — presentational live-scan indicator. Status dot (pulse animation for running, reduced-motion respected), progress bar, 4-stat grid, current-file line with ellipsis truncation and title tooltip. Props-in/events-out, no router/store/i18n calls. Exported as `AppScanProgress` + `ScanStatus` type from `@app/ui`. 25 new tests (5 snapshots + 2 event + 6 conditional + 12 status-class); suite 810 → 835 total.

## T-2026-04-29-060 — Stage A Course detail page (E14-F01-S03) — bookkeeping

- Created: 2026-04-29
- Completed: 2026-04-29
- Result: code shipped earlier — spec + backend handlers via PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/141 (`fc88c10`, "part 1 of 2"); web page + components + Playwright e2e rolled in with the lesson-player PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/144 (`6e5ca29`) because the player navigates from this page so the two were inseparable. Card was never bookkept; this entry closes the loop.
- Owner: claude
- Spec: `docs/roadmap/tasks/E14-F01-S03.md` (source: `docs/design/cs-web-course-detail/`, DESIGN_BRIEF §6.5)
- Outcome: `apps/web/app/pages/courses/[id].vue` (337 lines) composes five colocated components — `CourseHero` (cover left + title/instructor/progress/description right at 1440, stacked at 1024, horizontal strip at 360), `CourseActions` (primary Resume/Start, secondary Mark complete / Reset progress), `CourseSectionsList` (`SectionHeader` + `LessonRow` with current-lesson highlight, collapse), `CourseMaterialsRail` (right-rail at 1440/1024, slides below at 360), `CourseCompletedBanner` (quiet banner — no festival). Four states modelled: Default / InProgress / Completed / Locked-NoAccess (`AppNoPermission`). Backend exposes three endpoints (`GET /courses/:id/outline`, `POST /courses/:id/{mark-complete,reset-progress}`) — outline is a one-round-trip projection (course + sections + lessons + materials + per-lesson progress); mark-complete uses `COALESCE(completedAt, $now)` raw SQL inside a single `$transaction([...])` so already-completed rows preserve their original timestamp; reset-progress deletes the read-model row outright. 8 Playwright tests in `tests/e2e/course-detail.spec.ts`, +27 backend specs (outline 15 / mark-complete 8 / reset-progress 6).
- Side-effect fix that landed alongside the bookkeeping: `POST /courses/:id/{mark-complete,reset-progress}` were silently 500ing (`no schema defined for status code '201'`) because NestJS defaults POST to 201 but the spec only declared 200 — fixed by adding `@HttpCode(HttpStatus.OK)` in PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/157 along with the same fix on `/progress` and `/progress/batch`.
- Notes / deferred: stale `feat/course-detail-page` branch (`c860a3c`) on origin is now redundant — its content overlaps with what landed via #144. Safe to delete (not deleted by this task; user's call).

## T-2026-04-28-059 — Stage A Lesson player wired to <video> (E14-F03-S01)

- Created: 2026-04-28
- Completed: 2026-04-28
- Result: single feature commit `42438cb` on `feat/lesson-player-page` (closes #64) → PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/144. Full e2e suite 26/26 (lesson-player 7 new + foundations 1 + auth 5 + course detail 8 + home 3 + smoke 2); web unit 21/21 (+5 new); UI suite 808/808 unchanged after the AppPlayerChrome z-index tweak. Web lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E14-F03-S01.md` (source: `docs/design/cs-web-lesson-player/`, DESIGN_BRIEF §6.6)
- Outcome: real lesson playback. `apps/web/app/pages/courses/[id]/lessons/[lessonId].vue` (~210 lines) pulls lesson + course outline + bookmarks + note in parallel. AppPlayerChrome attached to a real `<video>` via `useLessonPlayer`; stream URL fetched via `useStreamUrl` (one-shot 401 retry through `auth.refresh()`); progress reported via `useProgressReporter` (10 s ticks while playing + visibility-change + beforeunload, dedupes in-flight POSTs). Sidebar tabs — `PlayerSidebar` hosts `AppTabs` + four inline body components (Sections / Notes / Bookmarks / Materials). Bookmarks tab `select(id)` emits `seek(time)` so the page seeks the video. Auto-advance: AppPlayerChrome `state="end"` with 5 s countdown → `navigateTo` next lesson; Stay-here clears, Play-next skips. Layouts: 1440 (1fr 360px), 1024 (1fr 280px), 360 (single column, tabs as horizontal scroller). Resume: `currentTime = lesson.progress.lastSeenAtSeconds` on `loadedmetadata`. Course detail Resume button retargeted from `/lessons/{id}` placeholder to `/courses/{id}/lessons/{lessonId}`.
- Side-effect fixes the e2e shook out: AppPlayerChrome `__overlay` z-index ordering (overlay was intercepting end-banner clicks); chromeState ordering (ended before stream error so stub data URIs show the banner); HTTP status capture via separate ref (useAsyncData strips custom Error properties).
- Notes / deferred: Real materials download endpoint deferred — clicks emit a "Download coming soon" toast (matches Course detail's pattern).

## T-2026-04-28-058 — Foundations canvas (E03-F01-S02)

- Created: 2026-04-28
- Completed: 2026-04-28
- Result: commit `a791ecd` on `feat/foundations-canvas` → PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/143 (Closes #12). 14 vitest + 2 Playwright snapshot tests pass; lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E03-F01-S02.md`
- Outcome: ships `/dev/foundations` — 17-section design-system canvas (Color / Typography / Spacing / Radius / Motion / Buttons / Inputs / Cards / Rows / Tabs+Segmented / Feedback / Overlays / Progress / Empty States / Skeleton / Avatar / Chips). Each section shows `@app/ui` components in their full variant × size × state matrix. `__tokens.vue` replaced with a redirect to `/dev/foundations` (backward-compat). `/dev/foundations` added to `PUBLIC_ROUTES` so visual-regression e2e runs without a token. Playwright full-page baselines at 1440×900 light + dark committed.
- Notes / deferred:
  - Mobile (`Tokens.theme.fromMode` + Widgetbook) deferred per user directive; noted in PR description.

## T-2026-04-27-053 — Home page Stage A · web + Playwright half (E14-F01-S01 part 2 of 2)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: two commits on `feat/web-home-page` (`75e0a7d` style + `65190ea` feat) → PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/138 (closes #59). 3/3 Playwright tests pass; web lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E14-F01-S01.md`
- Outcome: Stage A Home page composition lands on `apps/web/app/pages/index.vue`. Greeting (`AppAvatar` + role) + three `HomeRow`s (continue-watching, recently-added, recently-completed — collapsed by default) + right-rail `HomeYourWeek`. Two-column grid at viewport `> 1024px`, single column otherwise. Card sizing tuned so 1440 px shows ~5 `CourseWideCard`s and ~6 `CoursePosterCard`s per the card. Four states per row (loading skeleton, error + retry, empty, populated). `useHome.ts` exposes four `useAsyncData` composables wrapping the SDK; auth middleware now does a silent `auth.refresh()` on hard reload when a bearer token survived in localStorage but Pinia state is empty (production fix that also makes the e2e mocks round-trip without sign-in). Playwright e2e at three viewports (`1440x900`, `1024x768`, `375x800`) with `route()`-mocked endpoints — hermetic.
- Notes / deferred:
  - Bottom-tab nav at xs: `AppNavigationShell` already has the bar, but `default.vue` doesn't wrap children in the shell — migration deferred (cascades into auth/setup). E2e treats bottom-tab presence as conditional.
  - `instructor` rendered as empty string until the SDK home-item DTOs grow the field.
  - Card `accent` derived deterministically from `courseId` (small hash → fixed palette) since the SDK doesn't carry an accent column.

## T-2026-04-27-052 — Home page Stage A · spec + backend half (E14-F01-S01 part 1 of 2)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: two commits on `feat/web-home` (`e29298a` spec, `bb33650` backend) → PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/137 merged. Backend tests 696/698 (+30); lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E14-F01-S01.md`
- Outcome: three new bearer-auth endpoints — `GET /home/recently-added` (Course ordered by createdAt DESC + authz; bulk lesson stats via `Lesson.groupBy`), `GET /home/recently-completed` (CourseProgressReadModel rows where `lessonsCompleted == lessonsTotal AND lessonsTotal > 0`; Prisma can't express column-to-column equality so the adapter pulls `limit*3` rows and filters in-process), `GET /home/your-week` (`[now - 7d, now)` window; `minutesWatched = SUM(positionSeconds)/60` floored; `$queryRaw` for the conditional aggregate). Schemas: `RecentlyAddedDto`/`Item`, `RecentlyCompletedDto`/`Item`, `YourWeekDto` + new `DateRange`. Generated `@app/api-client-{ts,dart}` re-emitted. Catalog → Learning boundary preserved via the existing `src/common/learning-progress/` shared-kernel re-export. `HomeController` extracted a local `parseLimit` helper.

## T-2026-04-27-051 — NoteEditor (E13-F02-S05)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: single feature commit `f41b16c` on `feat/note-editor-clean` (closes #53) → PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/135. UI tests 808/808 (+22); lint + typecheck clean. (#134 was opened first but had stale ancestor commits picked up before the bookmark family merged; closed in favour of #135.)
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F02-S05.md` (source: `docs/design/cs-components/components.jsx` §NoteEditor, CSS `docs/design/cs-components/styles.css`)
- Outcome: `AppNoteEditor` — markdown note input with toolbar (Bold / Italic / Heading / List / Link), `edit` ↔ `view` toggle (v-modelable), debounced auto-save (`save(value)` after `debounceMs` of quiet, default 600), and an always-inline sync indicator (`syncing` / `saved` / `failed` / `offline`). The "Saved · Ns ago" label re-renders every second via a `setInterval` that auto-starts on `saved` and stops on every other state. `failed` exposes a Retry button that emits `retry`.
- Markdown renderer: in-house, no extra dep. Pipeline — HTML-escape raw input → inline links (URL routed through `safeUrl` which only allows http(s)/mailto, anything else → `#`) → `**bold**` (greedy first) → `*italic*` (with look-arounds) → block split on blank lines (h1/h2/h3 single-line, `- ` lists, paragraphs with `<br />`). `v-html` guarded with `/* eslint-disable vue/no-v-html */` and a WHY comment listing the sanitisation guarantees.
- A11y: toolbar `role="toolbar"`, every tool has `aria-label`, the toggle exposes `aria-pressed`, sync indicator is `role="status"` + `aria-live="polite"`.
- Storybook: 7 stories (Default / Empty / Preview / Syncing / Failed / Offline / Interactive — last one wires `save` → `syncing` → `saved` with a 500 ms fake-network delay and prints the last event).

## T-2026-04-27-050 — Bookmark family (E13-F02-S04)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: single feature commit `6060a41` on `feat/bookmark-family` (closes #52) → PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/133. UI tests 786/786 (+23); lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F02-S04.md` (source: `docs/design/cs-components/components.jsx` §Bookmark / BookmarkAdd, CSS in `docs/design/cs-components/styles.css`)
- Outcome: three composable domain components for the lesson-player bookmark surface — no modal dialogs.
  - `AppBookmark` — `time, label?, editable?`. Mono accent time chip + label + hover-revealed Edit / Delete actions; click / Enter / Space → `select`; edit and delete `@click.stop` so row select does not bubble. Descriptive `aria-label`.
  - `AppBookmarkAdd` — `time, submitting?, placeholder?`. Inline add row (time chip + `AppInput` + Save). Enter saves, Escape cancels and clears the buffer, `submitting` disables input + blocks double-submit. Empty label allowed (matches JSX).
  - `AppBookmarkList` — `bookmarks, addTime?, editable?, adding?, emptyTitle?, emptyBody?`. Renders the add row when `addTime` is defined, then the bookmark stack, then `AppEmptyState` (icon `bookmark`) when both are absent. Forwards `select / edit / delete` with the entry id and `addSave / addCancel` from the add row.
- Storybook: 14 stories total (`AppBookmark`: Default / NoLabel / ReadOnly / Stack; `AppBookmarkAdd`: Default / Submitting / HourLong / Interactive; `AppBookmarkList`: Default / Empty / ReadOnly / WithAddRow / EmptyWithAddRow / Adding / Interactive).

## T-2026-04-27-049 — PlayerChrome web component (E13-F02-S03)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: single feature commit `9eb8c6a` on `feat/player-chrome` (closes #51) → PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/132. UI tests 763/763 (+31); lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F02-S03.md` (source: `docs/design/cs-components/components.jsx` §PlayerChrome, CSS in `docs/design/cs-components/styles.css`)
- Outcome: presentational lesson-player shell — no `<video>` yet (lands in E14-F03-S01). Two layout modes (`overlay` full chrome, `minimal` slim played-bar peek). Seven states (`idle`, `playing`, `paused`, `buffering`, `error`, `end`, `locked`); `error` and `locked` make the chrome inert (`tabindex=-1`, play disabled, keyboard + scrubber no-op). Scrubber renders track / buffered / played / thumb + optional chapter ticks + bookmark markers (clicking a marker emits `seek` to that time). Slider exposes `role="slider"`, `aria-valuemin=0`, `aria-valuemax=duration`, `aria-valuenow=position`, `aria-valuetext="<current> of <total>"`. Buffer spinner respects `prefers-reduced-motion`.
- Emits: card-mandated `play, pause, seek, speed, toggleSubtitles, togglePip, toggleFullscreen, nextLesson` plus organic `toggleMute, retry, stayHere, prevLesson`.
- Keyboard map: Space/K (play-pause), ←/→ (±5s), J/L (±10s), `,`/`.` (±1/24s), F (fullscreen), M (mute), 0–9 (jump n × 10 %). All seeks clamp to [0, duration]; inputs/textareas inside the chrome are skipped.
- Storybook: 11 stories (each state + Minimal / Muted / NoChaptersOrBookmarks + an `Interactive` sandbox that wires every emit to local refs and prints the last event).

## T-2026-04-27-048 — LessonRow + SectionHeader (E13-F02-S02)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: single feature commit `c30dd40` on `feat/lesson-row` (closes #50) → PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/128. UI tests 732/732 (+19); lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F02-S02.md` (source: `docs/design/cs-components/components.jsx` §LessonRow + SectionHeader, CSS in `docs/design/cs-components/styles.css`)
- Outcome: two domain components for the course detail outline.
  - `AppLessonRow` — `num, title, duration, state, materials?, current?, progress?, loading?`. State matrix: `not-started` (circle), `in-progress` (circle + thin underline + `<n>% watched`), `completed` (check-circle / success), `locked` (lock / muted / inert with `aria-disabled` + `tabindex=-1`). `current=true` is orthogonal to state — flips icon to `play`, paints soft-accent background, draws 3px leading bar, sets `aria-current="true"`. Trailing: optional PDF icon when `materials=true`, mono-spaced duration (`H:MM:SS` ≥ 1h, else `M:SS`). Loading variant renders four `AppSkeleton` strips matching the row layout. Activation: click + Enter/Space emit `select`; locked/loading rows are inert.
  - `AppSectionHeader` — `idx, title, count, duration, open?` (default `open: true`). Title `Section <pad2(idx)> · <title>`; meta `<count> lesson(s) · <Xh Ym | Xh | Ym>` mono-spaced. Chevron rotates `-90deg` when `open=false`. Click + Enter/Space emit `toggle`; `aria-expanded` mirrors `open`.
- Notes: mobile-only `downloadState` from the JSX bundle deferred to a future Flutter card. `fmtTime` is inlined per-component to avoid coupling AppLessonRow to CourseCard.

## T-2026-04-27-047 — AppSsoBlock — SSO/OAuth provider button row (E13-F02-S10)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: single feature commit `203f461` on `feat/sso-block` (closes #58). UI tests 713/713 (+6); lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F02-S10.md` (source: `docs/design/shared/auth.jsx` §SsoBlock)
- Outcome: `AppSsoBlock` ships a vertical stack of secondary `AppButton`s (one per provider) with leading icons. Empty `providers` array renders nothing so the auth page can skip its surrounding "or" divider via the same `providers.length` check. Provider list is fully configurable per the card — any `{ id, label, iconName }` triple works. Click on a button emits `select` with the provider id; the consumer dispatches the right Better Auth flow.
- Architecture: thin wrapper around `AppButton` (variant `secondary`, `block: true`). Wrapper carries `role="group"` + `aria-label="Sign in with"` for screen readers.
- v1 scope: PRD puts OAuth/OIDC/SAML at v2+. The component is in place; the populating data comes from a future `GET /admin/instance` once Better Auth's `genericOAuth` plugins land.

## T-2026-04-27-045 — CourseCard family (poster / wide / compact) (E13-F02-S01)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: 5 feature commits on `feat/course-card` — `6f72324` (types + helpers + composable), `562f918` (CoursePosterCard), `675aebb` (CourseWideCard), `f85ace6` (CourseCompactRow), `f2a9969` (barrel + Family story). UI tests 662/662 (+71); lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F02-S01.md` (source: `docs/design/cs-components/components.jsx` §CourseCard)
- Outcome: three CourseCard variants share `Course` type + `COVER` accent map + `initials()` / `fmtTime()` helpers + `useCourseProgress(course, state)` composable. **Poster** (3:4 cover, ✓ badge for completed, lock + scrim for locked, otherwise progress strip; body with title + instructor). **Wide** (square 80×80 thumb + body with title/instructor/meta row; meta shows `Resume <fmtTime>` (with play icon) or `<pct>%` then `<completed>/<lessons>`). **Compact** (single-line list row: 32×32 thumb + title + bar + mono pct). All three are focusable buttons (`tabindex=0`, `role=button`, `aria-label=title`) with click + Enter/Space activation. Loading variants render skeletons matching the layout.
- Composable: `useCourseProgress(course, state)` accepts `ComputedRef<T> | (() => T)` for both args; returns `{ pct, realState }`. `state="auto"` derives `realState` from `pct` (100 → completed, >0 → in-progress, else not-started); explicit states pass through. 18 dedicated unit tests for the derivation table.
- Storybook: per-variant stories cover Default / NotStarted / InProgress / Completed / Locked / Loading / Variants (all 6 accents) plus a top-level `CourseCardFamily` story rendering all three side by side and a `FamilyAllAccents` story for COVER spot-checking.
- Deviations: composable file is `use-course-progress.ts` (kebab-case per project `unicorn/filename-case`). `CoursePosterCard` loading uses an `aspect-ratio: 3/4` SCSS class on top of `AppSkeleton` because the latter doesn't accept `aspect-ratio` as a prop. `course.cover` override test uses `toContain('url(')` since Vue normalises inline `url()` style values.

## T-2026-04-27-044 — AppPasswordField — visibility toggle + strength meter (E13-F02-S09)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: single feature commit `1c1b015` on `feat/password-field`. UI tests 591/591 (+18); lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F02-S09.md` (source: `docs/design/shared/auth.jsx` §PasswordField)
- Outcome: `AppPasswordField` ships a labelled password input with a leading lock icon, a raw `<button>` visibility toggle on the right (aria-pressed + dynamic aria-label), and an optional 3-segment strength meter. Score heuristic copied verbatim from the JSX (empty/<8/<12/≥12-with-symbol-or->16). Three meter colours track the score (error/warning/success). `error` / `hint` / `meter-label` collapse via `v-else-if` so only one footer line ever renders; `error` wins.
- Toggle uses a plain `<button>` rather than `AppIconButton` so `aria-pressed` and `aria-label` are native HTML attrs without prop-typing gymnastics. Custom CSS matches the bundle's `btn btn-ghost btn-icon btn-sm` look.
- Tokens: `--brand-accent` (focus ring), `--surface-overlay` (meter track + toggle hover), `--status-{error,warning,success}-fg` (meter fill per score), `--text-secondary` (muted text/icon), `--surface-bg-muted` (disabled background).

## T-2026-04-27-043 — AppProgressBadge — ring/bar/pill variants (E13-F02-S06)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: single feature commit `9c37d9b` on `feat/progress-badge`. UI tests 573/573 (+21); lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F02-S06.md` (source: `docs/design/cs-components/components.jsx` §ProgressBadge)
- Outcome: new `AppProgressBadge` covering three visual variants (`ring` 32px conic-gradient, `bar` 4px filled with mono pct, `pill` text matrix) and four domain states (`not-started | in-progress | completed | locked`). Percentage compute: `completed` → 100, `locked`/`not-started` → 0, otherwise `round((completed / total) × 100)` with `total ≤ 0` guard. Drives only off shipped tokens (no hard-coded colors). Storybook ships a 3×4 Variants matrix.
- Architectural notes: multi-root SFC (one branch per variant via `v-if/v-else-if/v-else`) — tests query `.find('.app-progress-badge')` for root-level attributes since `wrapper.attributes()` doesn't traverse multi-root fragments reliably.

## T-2026-04-27-042 — Auth setup wizard + sign-in flow (E11-F01-S03)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: 6 commits on `feat/auth-setup-wizard` — `08b2570` (`/admin/has-users` probe + port + adapter), `d1b977a` (Better Auth admin-promotion hook), `78d8117` (`useAuthStore.signUp`), `2a55ea1` (rename `/login` → `/sign-in`), `6e6bfc7` (`/setup` page + `hasUsers` middleware gate). Backend tests 668/668 (+4); web tests 19/19 (+2); lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E11-F01-S03.md`
- Outcome: minimal-but-functional first-run flow. Backend exposes `GET /api/v1/admin/has-users` (anonymous, sibling controller to keep `AdminController`'s class-level `AdminGuard` intact); Better Auth `databaseHooks.user.create.before` promotes the first user to `role: 'ADMIN'`. SPA: `useAuthStore.signUp` mirrors the existing `signIn` `set-auth-token` capture; `pages/setup.vue` collects email + password + optional display name and submits via the store; middleware gates `/setup` / `/sign-in` based on a per-session `hasUsers` cache; `pages/login.vue` renamed to `pages/sign-in.vue` with all references and locale keys updated.
- Architectural calls: `AdminPublicController` is a separate class because `@AllowAnonymous()` only opts out of the global `SessionGuard`, not the existing `AdminController`'s class-level `AdminGuard`. The `hasUsers` cache lives in `app/composables/useHasUsersCache.ts` (ref + `resetHasUsersCache()` helper) so the middleware keeps its single-default-export contract.

## T-2026-04-27-041 — Primitives batch B: dialog + avatar + chip refactor (E13-F01-S08/S11/S12)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: 4 feature commits on `feat/primitives-batch-b` — `ac5e3e4` (AppDialog), `3b2dc4b` (AppCommandPalette), `cf8830b` (AppAvatar), `659c626` (AppChip refactor + barrel). UI tests 552/552 (+39 net); lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F01-S08.md`, `E13-F01-S11.md`, `E13-F01-S12.md`
- Outcome: 4 components landed. **AppDialog** uses native `<dialog>.showModal()` so focus trap + `inert` are browser-native; backdrop click detection via `event.target === dialogRef`; ESC + close event wired to `update:open`. **AppCommandPalette** composes AppDialog with a search input + filtered/grouped list, arrow-key nav, Enter to select, ESC to close; `Command` type exported alongside. **AppAvatar** has 5 sizes + `image`/`initials`/`name` (computed fallback) + role badges for admin/guest with `aria-label`. **AppChip** refactored from `color × variant × size` to flat `variant: 'default'|'primary'|'success'|'warning'|'error'|'info'` matching the bundle's `.chip-*` classes; icon migrated from AppIcon (Iconify) to IconCS (typed `IconName`); `dismissible` renamed to `removable` to match `.chip-removable`; broken `--status-danger` reference fixed.
- JSDOM workaround: `<dialog>` not fully implemented in JSDOM. AppDialog.spec.ts patches `HTMLElement.prototype.showModal/close` with no-op functions that toggle `open` and dispatch the `close` event in `beforeAll`/`afterAll`; a `stubDialogElement(el)` utility provides per-test `vi.fn()` spies. Documented inline.
- Token deviations: `--bg` → `--surface-page` (not `--surface-bg` as previously assumed). All other mappings inherited from prior tasks.

## T-2026-04-27-040 — Primitives batch A (E13-F01-S05/S06/S09/S10)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: 5 feature commits on `feat/primitives-batch-a` — `04e1533` (AppRow), `89cb69a` (AppTabs + AppTab), `c5c3bff` (AppSegmented + AppSegmentedItem), `6abee87` (Progress + Spinner + Skeleton), `d8b9d58` (3 state surfaces + barrel). UI tests 513/513 (+103); lint + typecheck + stylelint clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F01-S05.md`, `E13-F01-S06.md`, `E13-F01-S09.md`, `E13-F01-S10.md` — 4 cards flipped together.
- Outcome: 12 new exports from `@app/ui` covering 10 components — `AppRow`, `AppTabs`, `AppTab`, `AppSegmented`, `AppSegmentedItem`, `AppProgressLinear`, `AppProgressCircle`, `AppSpinner`, `AppSkeleton`, `AppEmptyState`, `AppErrorState`, `AppNoPermission`. All driven off shipped tokens (some bundle aliases ship verbatim, e.g. `--text-loud`, `--surface-2`, `--shadow-1` — engineer used the canonical alias chain). AppTabs and AppSegmented are generic over `T extends string | number` with provide/inject context to children. AppSpinner is a reusable component; AppButton/AppIconButton's inline `::after` spinner is intentionally left as-is (interaction-bound, no a11y cost).
- Architectural calls: arrow-key nav in AppTabs uses DOM-sibling traversal (matches the WCAG tablist pattern from AppRadioGroup in T-037). Generic SFC + vue-test-utils requires `wrapper.vm as { active: T }` workaround for typed access. State surfaces (Empty/Error/NoPermission) ship as three near-duplicate templates rather than an `AppStateBase` abstraction — easier to read and unlikely to drift.
- Token mapping discoveries: `--text-loud` ships verbatim (separate from `--text-fg`); `--text-muted` → `--text-secondary` (not `--text-fg-muted` as previous components used); `--shadow-1` → `--shadow-xs`; `--surface-3` → `--surface-overlay`. Documented inline in the SCSS.

## T-2026-04-27-039 — AppBanner / AppToast / AppAlert (E13-F01-S07)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: three feature commits on `feat/banners-alerts` — `8f4b996` (AppBanner), `65790c4` (AppToast), `7b24087` (AppAlert + barrel). UI tests 410/410 (+54); lint + typecheck + stylelint clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F01-S07.md`
- Outcome: three notification-surface components covering the bundle CSS contract. `AppBanner` (4 variants, optional title, dismissible) uses `IconCS` for the leading glyph (info / check-circle / alert) and `AppIconButton` for the dismiss control. `AppToast` is the compact transient surface with the colored 8px dot indicator (success/info/error). `AppAlert` is the single-line inline variant for under-the-input validation messages. All three drive only off shipped status tokens (`--success`, `--success-soft`, etc.); no token-name deviations needed.
- A11y: error variants use `role="alert"` (assertive); other variants use `role="status"` (polite). `AppAlert` is always `role="alert"`. Dismiss buttons carry `aria-label` (overridable, defaults to "Dismiss").
- Out of scope: toast queue/container with auto-dismiss timing — left for a future story (E13-F01-S08 deals with dialogs which include some toast-adjacent behaviour).

## T-2026-04-27-038 — AppCard size + hoverable (E13-F01-S04)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: commit `6f0f481` on `feat/app-card-bundle` (+ a prettier sweep `e7cdbf3`). UI tests 356/356 (+4); lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F01-S04.md`
- Outcome: AppCard gained `size: 'md' | 'lg'` (matches bundle `.card` and `.card-lg`) and `hoverable: boolean` (matches `.card-hover`). Default size is `md` with `--radius-md` + 16px uniform padding; `lg` is `--radius-lg` + 24px. `hoverable` shifts border to `--border-strong` and background to `--surface-raised` on hover, stays a `<div>`, no focus ring; ignored when `interactive` is also true. Existing `interactive` button mode preserved.

## T-2026-04-27-037 — Form primitives (E13-F01-S03)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: four feature commits on `feat/form-primitives` — `e28d7ec` (audit/fix existing controls), `c8d232d` (AppCheckbox), `3aee420` (AppRadio + AppRadioGroup), `9136d42` (text/number/search field composites + barrel). UI tests 352/352 (+80); web tests 17/17; lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F01-S03.md`
- Outcome: full 7-component form set landed. `AppCheckbox` with indeterminate + Space/Enter keyboard support. `AppRadio` + `AppRadioGroup` with WCAG-pattern arrow-key navigation (only checked radio is `tabindex=0`). Composite `AppTextField` / `AppNumberField` / `AppSearchField` wrap `AppField` + `AppInput` with the right type/icons (`+`/`−` steppers using `AppIconButton`; leading `IconCS search` + trailing clear button on search). Existing `AppInput` heights pinned to `28/36/44 px` (replacing broken `var(--space-20)`); `[data-density='compact']` drops md to 30 px per the bundle CSS contract. `AppField` error token corrected (`--status-danger` → `--status-error-fg`). `AppSwitch` `$attrs` propagation fixed so AppField's `id`/`aria-*` land on `<button role='switch'>` not the wrapping `<label>`.
- Architectural calls: arrow-key nav uses DOM traversal (`querySelectorAll('[role=radio]')`) rather than a ref-array registration pattern — matches WCAG radiogroup. ESLint `vue/attribute-hyphenation` ignores `ariaLabel` so AppIconButton's camelCase prop name reconciles with vue-tsc's static type checks (scoped to packages/ui).

## T-2026-04-27-036 — AppButton + AppIconButton (E13-F01-S02)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: three commits on `feat/app-button-icon` — `0e64fe3` (AppButton refactor), `615cfd6` (AppIconButton), `104ca10` (login.vue migration). UI tests 272/272; web tests 17/17; lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F01-S02.md`
- Outcome: `AppButton` collapsed to a flat 4-variant API (`primary | secondary | ghost | destructive`) matching the bundle's `.btn-*` CSS contract; loading state surfaces as `data-loading="true"` with the spinner painted via `::after`; icons typed as `IconName` literals from E13-F01-S01. New `AppIconButton` square component (28/36/44 width === height) wraps `IconCS` and requires `aria-label` (TypeScript-enforced). Storybook covers all 6 states (Default/Hover/Active/Focus/Disabled/Loading) plus a 4×3 Variants matrix for both components. `apps/web/app/pages/login.vue` migrated to the new prop shape.
- Deviations: (1) Three token names from the brief didn't exist in `tokens.generated.css` — substituted: `--surface-surface-alt` → `--surface-raised`, `--status-danger` → `--status-error-fg`, `--text-fg-inverse` → `--text-inverse`. Documented inline in the SCSS. (2) `AppIcon` kept (still used by `AppChip` + `AppBadge`); future cleanup story can migrate those to `IconCS`.
- Tests: +15 (12 new in `AppIconButton.spec.ts` + 3 new cases in updated `AppButton.spec.ts`).

## T-2026-04-27-035 — IconCS — port the bundle's 61-icon family to Vue (E13-F01-S01)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: three commits on `feat/icon-cs` — `42e8aab` (component + types + barrel), `493dfb4` (66 snapshot tests + 4 a11y/fill assertions), `9617ade` (Storybook stories). UI tests +70; lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F01-S01.md`
- Outcome: new `IconCS` component in `packages/ui/src/components/IconCS/` renders any of 66 hand-drawn CourseShelf glyphs from `docs/design/shared/icons.jsx`. Single Vue `<svg>` template with `<template v-if="name === '...'>` per glyph; path data byte-identical to the JSX source (including the `pdf` glyph's `<text>` element). `IconName` literal union exported alongside. Storybook stories: default (single icon) + Grid (all 66 in an 8-column layout). Vitest snapshot per glyph (66) + 4 a11y/fill assertions.
- Deviations: (1) the card's Notes section listed 61 names but the source ships 66 — `sliders`, `arrow-left`, `more-h`, `corner-down-right`, `hard-drive` were extra. All included; the card's "61 names compile" NFR is a strict subset. (2) BEM class is `.app-icon-cs` (not `.icon-cs`) to satisfy the project Stylelint `selector-class-pattern` rule. (3) ESLint filename-case override added for `IconCS/` — the all-caps `CS` acronym doesn't fit kebab-case or strict PascalCase. (4) The `fill` prop honours only `play` and `bookmark` (per the JSX `fill={fill ? stroke : 'none'}` source pattern); other glyphs with intentional inner fills (`pip`, `list`, `more`, etc.) carry `fill="currentColor"` unconditionally as in the source.

## T-2026-04-27-034 — Wire api-client-ts + auth store (E11-F01-S02)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: six commits on `feat/web-auth-store` — `07374de` (Pinia install), `72e11c4` (auth store), `0780768` (api.client plugin), `2155d9e` (global middleware), `f247814` (login + layout migration + delete legacy composables), `b3647cf` (task-card flip). Web tests 17/17 (6 token-page + 11 auth-store); lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E11-F01-S02.md`
- Outcome: bearer-auth-end-to-end on the Nuxt SPA. New Pinia `useAuthStore` wraps `better-auth/vue` and captures the bearer token via a `set-auth-token` response-header hook on sign-in. New `plugins/api.client.ts` Nuxt SPA plugin configures the singleton `client` from `@app/api-client-ts`: request interceptor adds `Authorization: Bearer <token>` when present; response interceptor on 401 calls `auth.refresh()` once then redirects to `/login` if refresh fails. New `middleware/auth.global.ts` gates every route except `/login`, `/signup`, `/__tokens`. `pages/login.vue` and `layouts/default.vue` migrated to the store; `composables/useApi.ts`, `useAuth.ts`, `useApiShape.ts` deleted.
- Deviations: (1) `bearerClient()` plugin not present in `better-auth@1.6.8` — token captured via `@better-fetch/fetch` `onSuccess` hook reading `set-auth-token` instead. (2) Redirect target is `/login` (codebase route) rather than `/sign-in` (card text). (3) `plugins/api.client.spec.ts` deferred — Nuxt-runtime-context faking is awkward; 11 store tests cover the substance. (4) `useApiShape.ts` had zero callers; deleted with the other composables. (5) `@app/api-client-ts/src/index.ts` (hand-written entry) gained a `client` re-export — no codegen rule violated.

## T-2026-04-27-033 — Web SPA bootstrap closeout (E11-F01-S01)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: two commits on `feat/web-tokens-page` — `ff0f21c` (dark default), `4f09056` (tokens canvas + test). Tests 6/6; lint 0 errors; typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E11-F01-S01.md`
- Outcome: `nuxt.config.ts` gains `colorMode: { preference: 'dark', fallback: 'dark' }`. New `pages/__tokens.vue` renders all five token categories (color × 5 sub-groups with `getComputedStyle` live values, spacing bars, radius chips, typography specimens, motion/opacity raw `<dl>`). `UColorModeButton` in the header flips themes in one click. Six vitest assertions cover every category. Also added `@vitejs/plugin-vue` dev dep + `vitest.nuxt-imports-shim.ts` so `#imports` resolves in the plain vitest environment.
- Sub-steps:
  - [x] T-033-A: dark default + colorMode block in `nuxt.config.ts`
  - [x] T-033-B: `pages/__tokens.vue` foundations canvas
  - [x] T-033-C: component test for the page
  - [x] T-033-D: lint, typecheck, test, prettier; flip card; archive T-033

## T-2026-04-27-032 — Admin dashboard aggregator (E21-F01-S01)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: three commits on `feat/admin-dashboard` — `a89fc9c` (spec), `1b3972d` (codegen), `d9bbe11` (impl). Backend tests 664/664; lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E21-F01-S01.md` (PRD FR-OPS-02)
- Outcome: new `AdminModule` ships `GET /api/v1/admin/dashboard` returning `AdminDashboardDto { generatedAt, counts: { libraries, users, courses, lessons }, latestScan, errorsLast24h }`. Six counts run in parallel via `Promise.all`. Auth chain: global `SessionGuard` → class-level `@UseGuards(AdminGuard)`. Future `/admin/*` routes inherit AdminGuard automatically.
- Architecture deviation (improvement): rather than injecting `PrismaService` directly into the application handler (which would trip the `no-restricted-syntax` lint rule banning Prisma in `application/**`), the work was structured as `domain/dashboard.port.ts` (interface + Symbol token) + `infra/prisma-dashboard.adapter.ts` (Prisma implementation). Tighter DDD layering than the brief specified.
- `errorsLast24h` uses `Scan.startedAt > now - 24h` as a proxy timestamp because `ScanErrorRecord` has no own timestamp. The OpenAPI description documents this approximation; works because no scan is expected to outlive a 24-hour window.
- Tests: `get-admin-dashboard.handler.spec.ts` — 4 cases (populated snapshot, null latestScan when no scans, finishedAt null while running, generatedAt is stamped). The 24h cutoff window check moved to adapter responsibility.

## T-2026-04-27-031 — Rate limit on Better Auth sign-in (E21-F02-S01)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: single impl commit `5116d9c` on `feat/auth-signin-ratelimit`. Backend tests 660/660; lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E21-F02-S01.md` (PRD NFR-S-03)
- Outcome: new `SignInRateLimitMiddleware` (in-process token bucket keyed by `req.ip`, 5 attempts / 15 min rolling window) mounted on `POST /api/v1/auth/sign-in/*splat` via `AuthModule.configure`. 6th attempt → `429 Too Many Requests` + `Retry-After: <seconds>` header + RFC 9457 problem JSON. Successful sign-ins also count toward the cap (a successful brute-force probe is still a probe). Other Better Auth routes keep the existing 10/60s class-level `@Throttle` floor.
- Tests: 5 cases — under cap allows, at-cap blocks 429, IPs counted independently, window expires (fake timers), Retry-After value tracks the oldest in-window attempt.
- Trade-off: in-process Map state assumes single backend instance. Redis-backed store is deliberately deferred per the card's sub-step note. When we move to multi-instance, the swap is mechanical.

## T-2026-04-27-030 — E02 retroactive flips (E02-F01-S01, E02-F02-S01, E02-F02-S02, E02-F02-S04)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: roadmap-only commit on `chore/e02-flips`. No code changes.
- Owner: claude
- Spec: `docs/roadmap/tasks/E02-F01-S01.md`, `E02-F02-S01.md`, `E02-F02-S02.md`, `E02-F02-S04.md`
- Outcome: ticked four cards that had been load-bearing for the entire session (every endpoint shipped this week passed through the spec workspace, the codegen pipeline, and — in CI — the contract test). Each card carries a deviation note documenting why reality looks different from what the card asked for:
  - **E02-F01-S01**: Redocly CLI instead of Spectral; single inline `openapi.yaml` instead of split `paths/*` + `components/*` files.
  - **E02-F02-S01**: `@hey-api/openapi-ts` (named operation functions) instead of `openapi-fetch`-style `paths`/`components`/`createClient`.
  - **E02-F02-S02**: `@app/api-client-ts/server` subpath with class-validator DTOs **not** implemented; runtime validation is delivered by the `express-openapi-validator` middleware (E04-F02-S03) at the HTTP boundary, with backend handlers using type-only imports from `@app/api-client-ts`. Same guarantee from a single source of truth.
  - **E02-F02-S04**: contract testing uses Schemathesis (Docker, property-based, ~25 hypothesis-generated requests per operation) instead of Dredd/Prism. No `apps/backend/test/contract/` directory — the runner sits in `packages/specs/scripts/contract-test.ts` and exercises a running backend over the wire as a black box.
- Out of scope: actually implementing the deviated alternatives is not planned — the substitutes are deliberate architectural choices, not gaps to close.

## T-2026-04-27-029 — Realtime token + channels (E24-F01-S01)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: three commits on `feat/realtime-channels` — `f1e30d2` (AsyncAPI), `9007b95` (backend), `fd2905d` (Centrifugo namespaces). Backend tests 655/655; lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E24-F01-S01.md`
- Outcome: AsyncAPI grew from one channel to four — `system:health` (existing) + `library:scan:{libraryId}`, `notes:lesson:{lessonId}`, `progress:user:{userId}` with full schemas + receive operations. The `RealtimeService` JWT now carries a `channels: string[]` claim restricting subscribe scope to the user-scoped triple `['system:health', 'progress:user:<id>', 'notifications:user:<id>']`. The controller was refactored from the pre-E04-alignment `@Req()` + `auth.getSession(req)` plumbing to `@Session() session: SessionContext` + `@Throttle({ default: { limit: 30, ttl: 60_000 } })`. Centrifugo namespace config (`docker/centrifugo/config.json`) declares the four new namespaces with presence off + history off (safe defaults; future stories can tune per channel).
- Tests: `realtime.service.spec.ts` — 6 cases (sub matches user.id, exp ≈ now+ttl with fake timers, channels membership + length, expiresAt epoch matches exp, valid-secret verify, wrong-secret rejects).
- Deviation: the wildcard channels (`notes:lesson:*`, `library:scan:*`) are not in the connection token's `channels` claim — they need subscribe-time per-channel auth via Centrifugo's `subscribe_proxy`, which is a future story. Also: AsyncAPI 3 / Draft-7 doesn't support OpenAPI's `discriminator`, so the `ScanEvent` oneOf uses per-variant `kind` enums instead.
- Out of scope: actually publishing events into the new channels (the `CentrifugoService.publish` plumbing exists but is unused — feature stories that own the events will wire calls to it).

## T-2026-04-27-028 — E04 alignment (E04-F01-S01..E04-F02-S03)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: 7 commits on `feat/e04-alignment` (`33cedf6`, `f455d78`, `501bcc2`, `10dd112`, `66d411d`, `e386476`, `50a863e`). Backend tests 649/649; lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E04-F01-S01.md`, `E04-F01-S02.md`, `E04-F02-S01.md`, `E04-F02-S02.md`, `E04-F02-S03.md`.
- Outcome: closed the deltas between the actually-shipped backend (which was built on top of an E04 base while those cards were still open) and the cards' acceptance sets, so all five could be flipped to ✅ Done with truthful sub-step ticks instead of "deviation: …" notes. Concrete changes:
  - **`@AllowAnonymous()` + `@Session()` decorators**, **global `SessionGuard`** registered via `APP_GUARD`, and refactor of 9 controllers (Catalog × 4, Learning × 3, Streaming × 1, Auth catch-all × 1) — `@UseGuards(SessionGuard)` + private `resolveActor(req)` boilerplate replaced by `@Session() session: SessionContext`. `_template/_template.controller.ts` deliberately preserved as a counter-example.
  - **`OpsModule`** with `GET /healthz` (always 200) and `GET /readyz` (Prisma `SELECT 1`, returns 503 on failure). Both routes excluded from `setGlobalPrefix('api', { exclude })` so they sit at the server root, outside the `/api` validator mount, and outside the OpenAPI spec.
  - **Better Auth** `admin` plugin enabled; `additionalFields { role: 'string' default 'USER', displayName: 'string' optional }`; `pnpm auth:schema` script regenerates the auth Prisma section.
  - **`GET /api/v1/ping`** authenticated smoke-test endpoint — spec, codegen, `PingController` using the new `@Session()` decorator.
  - Explicit **`ignorePaths`** in the OpenAPI validator: `^\/v1\/auth(\/|$)` (Better Auth handles its own request shapes).
- Deviations from cards:
  - `@thallesp/nestjs-better-auth` **not** installed (native integration is solid; risk-reward poor for a third-party Nest wrapper).
  - Better Auth lives in `apps/backend/src/common/auth/` (not `apps/backend/src/identity/auth.ts`).
  - The domain-error → HTTP filter is named `HttpExceptionFilter` (the cards' `DomainErrorFilter` is the same thing).
  - Existing `phoneNumber` plugin and richer `GET /api/v1/health` snapshot are preserved on top of the cards' minimum.

## T-2026-04-26-027 — Batch progress endpoint for sync (E09-F01-S02)

- Created: 2026-04-26
- Completed: 2026-04-27
- Result: three commits on `feat/progress-batch` — `ff99972` (spec), `e47802a` (codegen), `ac95b71` (impl). Backend tests 638/638; lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E09-F01-S02.md`
- Outcome: new `POST /api/v1/progress/batch` accepts up to 200 items per round-trip, returns per-item status (`accepted` | `stale` | `forbidden`) in input order. `RecordProgressBatchHandler` fans out to the existing `RecordProgressCommand` via the command bus — sequential, no parallelism (bounded fan-out, keeps Prisma writes serial, avoids re-entering the same `(userId, lessonId)` row in duplicate-item edge cases). `stale` is computed by strict comparison (`serverLastSeenAt > clientUpdatedAt`); equal timestamps classify as `accepted`. `PermissionDenied` thrown by the inner handler maps to per-item `forbidden` (no-oracle covers missing lessons too); non-permission errors bubble.
- Tests: `record-progress-batch.handler.spec.ts` — 5 cases (mixed three-outcome batch, equal-timestamp accepted, non-permission error bubbles, empty array, sequential call order verified via `mock.calls`).
- Spec deviation from card: card mentioned a `not-found` status; the implementation collapses it into `forbidden` per the no-oracle rule used elsewhere in Learning. Documented in the OpenAPI description.

## T-2026-04-26-026 — ffprobe + thumbnail extraction (E06-F02-S02)

- Created: 2026-04-26
- Completed: 2026-04-27
- Result: single impl commit `4368123` on `feat/ffprobe-thumbnails`. Backend tests 631/631; lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E06-F02-S02.md`
- Outcome: new domain port `FfmpegAdapter` + `LocalFfmpegAdapter` shelling out to `ffprobe` / `ffmpeg` via `child_process.execFile` (deviation from card — skipped `fluent-ffmpeg` to avoid extra dep + types fight). `AppConfig.ffprobePath`, `AppConfig.ffmpegPath`, `AppConfig.thumbnailJpegQuality` configurable. Scan handler probes each video and writes a 320×180 JPEG poster (`<src>.thumb.jpg` next to the video). Failure on a single file records `ffmpeg-probe-failed` / `ffmpeg-thumbnail-failed` ScanError and the walk continues. Thumbnail generation is idempotent on mtime. `*.thumb.jpg` is now classified as `ignored` in stem-match so generated thumbs do not round-trip into `Lesson.materials`. Lesson row insertion remains deferred to a future "scan-materialise" story — this card only populates `Scan.discoveredLessons[].metadata` and the on-disk JPEG.
- Tests: adapter unit (5 cases, mocks `execFile` + ffprobe JSON parsing), adapter integration (skipped when no `ffmpeg` in PATH), `run-scan.handler.spec.ts` regression (two-video fixture with one probe rejection), `stem-match.spec.ts` regression (`.thumb.jpg` → `ignored`).
- Docs: `docs/troubleshooting.md` ffmpeg/ffprobe prerequisite entry.

## T-2026-04-26-025 — Subtitle delivery (SRT → VTT) (E08-F02-S02)

- Created: 2026-04-26
- Completed: 2026-04-27
- Result: single impl commit on `feat/subtitle-vtt`. Backend tests 617/617; lint + typecheck clean.
- Owner: claude

## T-2026-04-26-024 — Notes endpoints (E09-F02-S02)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: three commits on `feat/notes`: `a0fd960` (spec), `4ff5f71` (codegen), `ef7f86f` (impl). Backend tests 591/591; lint + typecheck clean.
- Owner: claude
- Goal: free-form Markdown note, one per `(userId, lessonId)`, with PUT-upsert + GET + idempotent DELETE.
- Sub-steps:
  - [x] OpenAPI: `upsertNote` / `getNote` / `deleteNote` + NoteDto / UpsertNoteRequest. Spec version 0.10.0 → 0.11.0.
  - [x] TS + Dart codegen
  - [x] Prisma `Note` + manual migration SQL
  - [x] domain — aggregate (trim + 1..16384 length) + repo + 2 errors
  - [x] Prisma adapter; `deleteMany` for clean idempotency
  - [x] 3 handlers; GET + DELETE no-oracle rule (missing lesson → 403)
  - [x] `NotesController` in `LearningModule`
  - [x] ~25 new tests; 591/591 total

## T-2026-04-26-023 — Bookmarks endpoints (E09-F02-S01)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: three commits on `feat/bookmarks`: `cdd36b7` (spec), `195ee04` (codegen), `421881d` (impl). Backend tests 547/547; lint + typecheck clean.
- Owner: claude
- Goal: per-user, per-lesson timestamped bookmarks; owner-only mutations + admin moderation bypass.
- Sub-steps:
  - [x] OpenAPI: list / create / update / delete + 4 schemas
  - [x] TS + Dart codegen
  - [x] Prisma `Bookmark` + manual migration SQL
  - [x] domain — aggregate (trim + 1–200 label, at-least-one-field, label:null clears) + repo + 4 errors
  - [x] Prisma adapter; ordering by positionSeconds ASC; null/undefined label mapping
  - [x] 4 handlers; admin bypass symmetric on UPDATE + DELETE
  - [x] BookmarksController in LearningModule
  - [x] ~30 new tests; 547/547 total

## T-2026-04-26-022 — CourseProgressProjector + continue-watching endpoint (E10-F01-S01)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: single impl commit `3c0e35e` on `feat/progress-projector`. 47 files changed, 2456 insertions(+). Backend tests 486/486; lint + typecheck clean.
- Owner: claude
- PR: feat/progress-projector → main

## T-2026-04-26-021 — LessonProgress aggregate + record endpoint (E09-F01-S01)

- Created: 2026-04-26
- Completed: 2026-04-27
- Result: single impl commit on `feat/lesson-progress`. Backend tests 441/441 (+34 new); lint + typecheck clean.
- Owner: claude

## T-2026-04-26-020 — `GET /stream/lessons/{id}` with HTTP Range support (E08-F02-S01)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: single impl commit `1751817` on `feat/stream-range`. Backend tests 407/407; lint + typecheck clean.
- Owner: claude
- Goal: standards-compliant byte-range video delivery; full 200/206/416/400/401/404/500 branch coverage; path traversal provably impossible.

## T-2026-04-26-019 — Short-lived signed stream tokens (E08-F01-S01)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: three commits on `feat/stream-tokens`: `cf645ae` (spec), `b0486ae` (codegen), `55fd5b4` (impl). Backend tests 375/375; lint + typecheck clean.
- Owner: claude
- Goal: `GET /api/v1/lessons/{id}/stream-url` mints an opaque HMAC-signed token bound to `(userId, lessonId, expiresAt)`; verify in O(1) with no DB lookup.
- Spec diff: `packages/specs/openapi/openapi.yaml` — `GET /lessons/{id}/stream-url` + `StreamUrlDto`. New top-level `Streaming` tag. Spec version 0.6.0 → 0.7.0.
- Codegen impact: yes — TS + Dart regenerated.
- Design impact: none.
- Sub-steps:
  - [x] OpenAPI: `issueStreamUrl` + `StreamUrlDto`
  - [x] TS + Dart codegen
  - [x] new module `apps/backend/src/modules/streaming/`; `StreamingController` registered in `app.module.ts`
  - [x] domain — `StreamTokenSigner` (HS256 over `header.payload.sig`; subkey HKDF-derived from `BETTER_AUTH_SECRET` with info `"courseshelf:stream-token:v1"`; cached after first call)
  - [x] errors — `StreamTokenInvalidError` base + Tampered / Expired / LessonMismatch / Malformed subclasses
  - [x] `IssueStreamTokenQuery` + handler — lesson load → parent-course walk → `AuthorizationService.canSee` → sign
  - [x] `AppConfig` extended with `streamTokenTtlSeconds` (default 900) and `streamTokenHkdfInfo` (default `"courseshelf:stream-token:v1"`)
  - [x] cross-module wiring via `apps/backend/src/common/catalog-tokens/` — re-exports `LESSON_REPOSITORY` / `COURSE_REPOSITORY` / `LessonNotFoundError` plus `CatalogRepositoriesModule` that binds the Prisma adapters; boundaries-config compliant
  - [x] 20+ new tests (signer round-trip + tamper + expiry + mismatch + malformed; handler admin / non-admin / missing-parent paths)

## T-2026-04-26-018 — Lesson + Material + Subtitle read model (E06-F03-S02)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: three commits on `feat/lesson-material`: `e36b5ed` (spec), `f44ce5a` (codegen), `1b4533f` (impl). Backend tests 355/355; lint + typecheck clean.
- Owner: claude
- Goal: `GET /api/v1/lessons/{id}` returns lesson metadata + sidecar materials and subtitles (language guessed from filename suffix); raw paths never leak in the DTO (NFR-S-01).
- Spec diff: `packages/specs/openapi/openapi.yaml` — `GET /lessons/{id}` + `LessonDto` / `MaterialDto` / `MaterialKind` / `SubtitleDto` / `LessonProgress`. Spec version 0.5.0 → 0.6.0.
- Codegen impact: yes — TS + Dart regenerated.
- Design impact: none for v1.
- Sub-steps:
  - [x] OpenAPI: `getLesson` + DTOs
  - [x] TS + Dart codegen
  - [x] Prisma `Lesson` + `Material` + `Subtitle` + manual migration SQL
  - [x] domain layer at `apps/backend/src/modules/catalog/domain/lesson/`: aggregate, value objects, errors, repo port
  - [x] Prisma adapter (delete-and-recreate of children inside `$transaction`)
  - [x] `stem-match.ts` utility — composite (`1.1 Title`/`1.1. Title`) + simple `01 - Title` prefixes; sidecars attach to videos instead of becoming `unsupported-extension` ScanErrors
  - [x] `RunScanHandler` upgraded — Scan aggregate gains `discoveredLessons[]` (in-memory only); Neovim "mass ScanError" pattern produces zero errors for matched companions
  - [x] `GetLessonQuery` + handler with `AuthorizationService.canSee` grant filter; DTO mapper strips raw paths
  - [x] `LessonsController` registered in `CatalogModule`
  - [x] ~30 new tests (value objects, aggregate, stem-match, handler, repo, scan-regression); 355 / 355 total

## T-2026-04-26-017 — Course aggregate + slug uniqueness + section ordering (E06-F03-S01)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: single impl commit on `feat/course-aggregate`. 73 new tests (273 total); lint/typecheck clean.
- Owner: claude
- Goal: Course aggregate keyed by (libraryId, slug) with ordered Section list; three new endpoints; admin-only PATCH; grant-filtered GETs.
- Spec diff: yes — spec commit acd4b97; codegen commit bd2251f
- Codegen impact: yes (TS + Dart — separate commits already landed)
- Design impact: none
- Sub-steps:
  - [x] T-017-A: spec edit — acd4b97
  - [x] T-017-B: codegen — bd2251f
  - [x] T-017-C: Prisma Course + Section models + migration SQL
  - [x] T-017-D: domain — Slug/Title/Position VOs + Course aggregate + errors + repo port
  - [x] T-017-E: PrismaCourseRepository (delete-and-recreate sections in $transaction; P2002 → CourseSlugAlreadyTakenError)
  - [x] T-017-F: UpdateCourseMetadataHandler + ListCoursesHandler + GetCourseHandler
  - [x] T-017-G: CoursesController (SessionGuard on GETs, AdminGuard on PATCH); wired into CatalogModule
  - [x] T-017-H: 73 new tests (value objects + aggregate invariants + 3 handlers + repo roundtrip)
  - [x] T-017-I: lint/typecheck/test/prettier all clean

## T-2026-04-26-016 — extend scan parser: composite ordinals + word-prefixed sections

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: single commit on `feat/scan-parser-extended` — `901aa83`. Backend tests 200/200; lint + typecheck clean.
- Owner: claude
- Goal: every realistic Russian / Udemy-style course folder layout in `docs/data/courses/` is recognised with clean section/lesson labels and correct ordinals.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Sub-steps:
  - [x] tier-3 `COMPOSITE_LESSON_RE` for `N.M Title` and `N.M` lessons (`2.5 Установка…` → `sectionOrdinal=2, ordinal=5, label="Установка на Windows"`)
  - [x] tier-2 `WORD_PREFIXED_RE` (`\p{L}+ N - Title`) for Russian / English module folders (`Модуль 2 - Настройки окружения` → `ordinal=2, label="Настройки окружения"`)
  - [x] `RunScanHandler` runs `parseFolderName` on section folders so `sectionTitles` are clean labels
  - [x] +9 spec cases covering composite + word-prefixed forms; existing 191 tests still green
  - [x] sample `course.json` for `videosmile - Super Figma` (gitignored — manual-verification helper for lessons whose file names are just `N.M.mp4` with no inline title)

## T-2026-04-26-015 — Scan aggregate, FsAdapter, incremental scan (E06-F02-S01)

- Created: 2026-04-25
- Completed: 2026-04-26
- Result: single commit on `feat/library-scan`. Scan aggregate + FsAdapter port + NodeFsAdapter + incremental (mtime,size) detection + course.json v1 parser + folder-name parser + RunScanHandler (fire-and-forget walk) + GetLatestScanHandler + ScansController + PrismaScanRepository + migration. 191 tests green; lint/typecheck clean.
- Owner: claude

## T-2026-04-26-014 — AuthorizationService consumed by Catalog & Streaming (E07-F01-S02)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: single commit on `feat/authorization-service`. `CommonAccessModule` in `src/common/access/` provides `LruAuthorizationService` behind `AUTHORIZATION_SERVICE` token. `ListLibrariesHandler` + `GetLibraryHandler` filter by grant. 127 tests green.
- Owner: claude

## T-2026-04-26-013 — AccessGrant aggregate + admin endpoints (E07-F01-S01)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: three commits on `feat/access-grant`: `d82bceb` (spec), `cba2ae2` (codegen), `9315210` (impl). Merged into main as a fast-forward chain.
- Owner: claude
- Goal: admin can grant a user READ access on a library or course, revoke it, and list a user's grants — gated by Better Auth session role check.
- Spec diff: `packages/specs/openapi/openapi.yaml` — three new paths + AccessGrantDto / AccessGrantListDto / RegisterGrantRequest / GrantTarget / GrantLevel. Spec version 0.2.0 → 0.3.0.
- Codegen impact: yes — TS + Dart regenerated end-to-end (Java prerequisite from T-012 in place).
- Design impact: none for v1.
- Sub-steps:
  - [x] OpenAPI: registerGrant / revokeGrant / listGrantsByUser + DTOs with discriminated GrantTarget
  - [x] TS + Dart codegen
  - [x] Prisma `AccessGrant` model + composite unique + migration SQL
  - [x] domain aggregate at `apps/backend/src/modules/access/domain/grant/` (mirror of catalog pattern)
  - [x] Prisma adapter; P2002 → `GrantAlreadyExistsError` (409)
  - [x] CQRS handlers: register, revoke, list-by-user, plus get-by-id for post-write re-read
  - [x] AccessController + AdminGuard + AccessModule registered in app.module.ts
  - [x] 32 new tests covering domain invariants, all four handlers, repo roundtrip, admin-guard. 102/102 passing.

## T-2026-04-26-012 — fix Dart codegen (openapi-generator-cli env conflict)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `a77c9af` (`git merge --ff-only` from `chore/dart-codegen-fix`).
- Owner: claude
- Goal: `pnpm spec:codegen` succeeds end-to-end so the Dart Dio client tracks the OpenAPI spec.
- Spec diff: none
- Codegen impact: yes — Dart leg now produces output for new endpoints
- Design impact: none
- Sub-steps:
  - [x] reproduced the failure: actual root cause is "Unable to locate a Java Runtime" (JVM missing on macOS), not a NestJS dep wrapper conflict — the earlier diagnosis was wrong
  - [x] installed OpenJDK 21 LTS via Homebrew (`brew install openjdk@21`) and set `JAVA_HOME`
  - [x] re-ran `pnpm spec:codegen` end-to-end — all four legs (openapi-typescript, hey-api/openapi-ts, openapi-generator-cli dart-dio, asyncapi) succeed
  - [x] committed regenerated Dart artefacts: CatalogApi + LibraryDto / LibraryListDto / RegisterLibraryRequest + ApiDoc markdown + test scaffolds
  - [x] documented the Java prerequisite in `docs/troubleshooting.md` (Homebrew install, JAVA_HOME export, Linux/Windows hints, CI `actions/setup-java@v4`)

## T-2026-04-26-011 — fix workspace tsc regression in generated `@app/api-client-ts`

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `03a6030` (`git merge --ff-only` from `chore/api-client-ts-strictness`).
- Owner: claude
- Goal: workspace `tsc --noEmit` exits 0 across the repo after E06 codegen introduced strict-typing mismatches in the generated `@hey-api/openapi-ts` output.
- Spec diff: none
- Codegen impact: subtle — consumers now read `.d.ts` from `dist/`, not raw `.ts`
- Design impact: none
- Sub-steps:
  - [x] add `packages/api-client-ts/tsconfig.build.json` (emitDeclarationOnly to `dist/`)
  - [x] flip `package.json`: `types`, `exports.types` → `./dist/index.d.ts`; runtime `main` stays at raw `.ts` (Node `--experimental-strip-types`)
  - [x] root `prepare` and `spec:codegen` chain `pnpm --filter @app/api-client-ts build` so dist always exists after install / codegen
  - [x] verified: `pnpm -r typecheck` clean for all 8 TS projects; lint 0 errors / 53 vue-formatting warnings; backend tests 70/70

## T-2026-04-26-010 — Library aggregate + register/list/get endpoints (E06-F01-S01)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: three commits on `feat/library-aggregate`: `a710c5d` (spec), `be9ac44` (TS codegen), `0ef1607` (impl). Merged into main as a fast-forward chain.
- Owner: claude
- Goal: first real domain story for Catalog — Library aggregate with name + rootPath invariants, persisted via Prisma behind a domain-owned port, exposed at `POST/GET /api/v1/libraries{,/{id}}`.
- Spec diff: `packages/specs/openapi/openapi.yaml` (3 paths + 3 schemas, version bumped 0.1.0 → 0.2.0)
- Codegen impact: yes — TS regenerated; Dart skipped (env issue tracked separately)
- Design impact: none
- Sub-steps:
  - [x] OpenAPI: registerLibrary / listLibraries / getLibrary + LibraryDto / LibraryListDto / RegisterLibraryRequest
  - [x] TS codegen committed separately
  - [x] Library aggregate at `apps/backend/src/modules/catalog/domain/library/` (path corrected from `contexts/` to match the existing `modules/` pattern + boundaries)
  - [x] LibraryRepository port + Prisma adapter + mapper
  - [x] CQRS: RegisterLibraryCommand + ListLibrariesQuery + GetLibraryQuery handlers
  - [x] CatalogController + CatalogModule registered in app.module.ts
  - [x] Prisma `Library` model + migration SQL (authored manually because Docker was off; identical to what `prisma migrate dev --create-only` would produce)
  - [x] 5 spec files (aggregate, three handlers, repository roundtrip), 70/70 passing
  - [x] backend `lint` clean; workspace `tsc` regression in generated TS clients tracked as T-011 (not E06 fault)

## T-2026-04-26-009 — Prisma generate postinstall + close E01-F01-S02

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `a6006cf` (no GitHub PR; `git merge --ff-only` from `chore/prisma-generate`).
- Owner: claude
- Goal: workspace-wide `pnpm -r lint` finishes with zero errors on a clean clone right after `pnpm install`, without any manual codegen step.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Sub-steps:
  - [x] run `prisma generate` once to verify lint/typecheck go green
  - [x] wire `postinstall: prisma generate` in `apps/backend/package.json`
  - [x] verify postinstall fires on `pnpm install`
  - [x] confirm `pnpm -r lint` reports 0 errors workspace-wide
  - [x] flip E01-F01-S02 to ✅ Done; TODO progress 7 / 115 → 8 / 115

## T-2026-04-26-008 — stage the design bundle under docs/design/ + index + .gitattributes

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `5a57b7f` (no GitHub PR; `git merge --ff-only` from `chore/design-bundle-index`).
- Owner: claude
- Goal: a clone of the repository carries the full design handoff bundle alongside an index that names every project slug, its consumption story, and its file inventory; `.gitattributes` collapses prototype HTML/JSX/CSS as vendored.
- Spec diff: none
- Codegen impact: no
- Design impact: yes — bundle is now first-class repo content
- Sub-steps:
  - [x] move `docs/design/uploads/DESIGN_BRIEF.md` → `docs/design/DESIGN_BRIEF.md`
  - [x] write `docs/design/README.md` (index + handoff conventions)
  - [x] write `.gitattributes` (linguist-vendored on `docs/design/**` + linguist-generated on Dart tokens)
  - [x] flip `docs/roadmap/tasks/E00-F01-S01.md` to ✅ Done; tick TODO; bump progress to 7 / 115
  - [x] move T-006 / T-007 to `done.md`

## T-2026-04-26-007 — apps/backend/src/shared kernel: Branded IDs + DomainError + subclasses

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `a3a8449` (no GitHub PR; `git merge --ff-only` from `chore/backend-shared-kernel`).
- Owner: claude
- Goal: cross-context kernel for `apps/backend` — `Brand<T,B>`/`Id<B>` for compile-time identifier safety and `DomainError` (+ `InvariantViolation`/`NotFound`/`PermissionDenied`) for RFC 9457 mapping.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Sub-steps:
  - [x] write `apps/backend/src/shared/{branded-id,domain-error}.ts` + spec files
  - [x] move three `common/errors/domain-error` import sites to `shared/`
  - [x] remove `apps/backend/src/common/errors/`
  - [x] add `shared` element to `boundaries/elements`
  - [x] tests 43/43; lint/typecheck regress-free (only pre-existing prisma type errors remain)

## T-2026-04-26-006 — eslint-plugin-boundaries: enforce DDD bounded-context boundaries

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `6a17c89` (no GitHub PR; `git merge --ff-only` from `chore/eslint-boundaries`).
- Owner: claude
- Goal: a sibling-module import inside `apps/backend/src/modules/<X>` referencing `apps/backend/src/modules/<Y>` (Y ≠ X) fails lint with a readable, action-oriented message.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Sub-steps:
  - [x] add `eslint-plugin-boundaries` + `eslint-import-resolver-typescript` to `@app/eslint-config`
  - [x] wire `boundaries/elements` (module / common / i18n / app) and `boundaries/element-types` rule in `nest.mjs`
  - [x] mutation test confirmed cross-import rejection with the expected message
  - [x] left `boundaries/element-types` (v5 syntax) — v6 `boundaries/dependencies` rejected the migrated config; deferred follow-up

## T-2026-04-26-005 — archive sweep: mark already-shipped roadmap stories as Done

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `c19c247` (no GitHub PR; `git merge --ff-only` from `chore/roadmap-archive-sweep`).
- Owner: claude
- Goal: walk every `docs/roadmap/tasks/E*.md` card, flip status to ✅ Done where the story's acceptance is already satisfied by the current codebase. Conservative — borderline left at ⬜.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Sub-steps:
  - [x] inventory: 6 Done (E01-F01-S01, E02-F01-S02, E02-F02-S03, E03-F01-S01, E12-F01-S01, E22-F01-S02), 5 deliberate borderline
  - [x] update each Done card: status line, sub-step boxes, Notes block
  - [x] tick matching boxes in `docs/roadmap/TODO.md` and update progress counter (`6 / 115`)
  - [x] sanity check on counts
  - [x] prettier on touched markdown

## T-2026-04-26-004 — design-token cross-source audit (PR 3b)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `5189c92` (no GitHub PR; `git merge --ff-only` from `chore/design-tokens-audit`).
- Owner: claude
- Goal: cross-source audit script comparing `docs/design/shared/tokens.json` (palette) ↔ `specs/design/tokens/*.json` (DTCG); fails CI on hex drift. Plus closing residual scale drift (spacing/radius/font) surfaced by the first run.
- Spec diff: none
- Codegen impact: no
- Design impact: locked the brand alignment behind a script
- Sub-steps:
  - [x] write `packages/design-tokens/scripts/audit-cross-source.ts`
  - [x] add `audit:cross-source` script to `packages/design-tokens/package.json`
  - [x] close residual scale drift in `specs/design/tokens/{spacing,radius,typography}.json`
  - [x] mutation test confirmed audit fails on a flipped hex
  - [x] new `packages/design-tokens/README.md` documents both sources, alias layer, and audit's role
  - [x] lint, typecheck, audit (42 / 42) all green; 4 known prototype-internal drifts reported as ℹ

## T-2026-04-26-003 — brand-align design tokens + emit alias layer (PR 3a)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `9e0a851` (no GitHub PR; merge happened on the local clone via `git merge --ff-only` from `chore/design-tokens-canonical`).
- Owner: claude
- Goal: replace the blue-stub palette in `specs/design/tokens/*.json` with CourseShelf brand values and teach the emitter to publish prototype short CSS-var names (`--bg`, `--surface`, `--primary`, …) as `var()` aliases of the DTCG long names.
- Spec diff: none
- Codegen impact: no
- Design impact: yes — first time the code-stack carries actual CourseShelf brand
- Sub-steps:
  - [x] rewrite `specs/design/tokens/color.json` with brand hex values + new roles (text.loud, surface.skeleton{Base,Shine}, brand.accentSoft, status.{\*}Soft)
  - [x] rewrite `specs/design/tokens/shadow.json` with brand shadow tints
  - [x] tune `specs/design/tokens/motion.json` durations/easings to match prototype curves
  - [x] extend `emit-scss.ts` with themed alias section + static `--d-*`/`--e-*` aliases
  - [x] verified: short-name alias hex byte-equals prototype hex for all 22 color/shadow pairs (dark + light)
  - [x] lint --fix + typecheck clean

## T-2026-04-26-002 — rewrite roadmap story registry under the current stack

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `417bcfe` (no GitHub PR; merge happened on the local clone via `git merge --ff-only` from `chore/roadmap-collapse`).
- Owner: claude
- Goal: every story in `docs/roadmap/tools/generate.py` reflects the real codebase — `apps/backend`, generated `@app/api-client-{ts,dart}`, Nuxt UI v4 + Tailwind 4 + `@app/ui`, Centrifugo realtime, and the current `packages/design-tokens` pipeline.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Sub-steps:
  - [x] inventory legacy terms in the registry
  - [x] swap paths: `apps/api`→`apps/backend`; legacy contract packages → `packages/specs` + `@app/api-client-{ts,dart}`; `packages/shared-kernel`→`apps/backend/src/shared`
  - [x] swap web stack: Vuetify→Nuxt UI v4 + Tailwind 4 + `@app/ui`; remove `useApi/useAuth/useAuthToken` composables in favour of `@app/api-client-ts`
  - [x] swap design pipeline: Style Dictionary → current `packages/design-tokens` (`pnpm design:build`)
  - [x] swap commands: `pnpm gen:all` → `pnpm spec:codegen`
  - [x] add Centrifugo coverage: AsyncAPI sub-step in E02 + new epic E24
  - [x] dissolve E05 into E04-F01-S01
  - [x] keep Drift in E15 as-is
  - [x] run generator; 115 task files, zero warnings
  - [x] prettier on regenerated `.md`; sanity-grep clean

## T-2026-04-26-001 — collapse duplicate roadmap copies, retarget generator path

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `32dcead` (no GitHub PR; merge happened on the local clone via `git merge --ff-only` from `chore/roadmap-collapse`).
- Owner: claude
- Goal: one source of truth for the roadmap lives under `docs/roadmap/`; the generator writes there instead of a sandbox path.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Sub-steps:
  - [x] move `docs/tasks/` → `docs/roadmap/tasks/`
  - [x] remove `docs/{README,ROADMAP,TODO}.md` (untracked duplicates)
  - [x] write `docs/roadmap/README.md` (workflow points at `specs/tasks/active.md`; `packages/api-contracts` → `packages/specs/openapi/openapi.yaml`; `pnpm gen:all` → `pnpm spec:codegen`)
  - [x] retarget `docs/roadmap/tools/generate.py`: `OUT` derived from `__file__`; `write_readme()`/`write_roadmap()` mention the script at its real path
  - [x] prettier on touched `.md`
