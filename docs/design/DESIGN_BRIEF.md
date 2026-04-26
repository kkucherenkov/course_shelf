# CourseShelf — Design Brief for Claude Design

This document is the source of truth for the CourseShelf design effort. It
contains:

1. **Phase 0** — the prompt to use when onboarding the Claude Design org so
   the design system is built from the right context.
2. **Phase 1–4** — an ordered list of Claude Design projects to create, with
   a copy-pasteable brief for each.
3. **Cross-cutting specifications** — responsive breakpoints, required
   states, accessibility, motion, iconography.
4. **Handoff conventions** — how exports flow into the repo and into Claude
   Code.

> **Workflow recap.** Onboard the design system once; then create one Claude
> Design project per item below. Each project produces an interactive
> prototype. Iterate via inline comments and sliders. When a project is
> approved, export the **handoff bundle** to `docs/design/<project-slug>/`
> and link it from the corresponding PR. Claude Code reads the bundle and
> implements the component(s) in `apps/web/components/` or
> `apps/mobile/lib/widgets/`.

---

## 1. Product & brand context

**What CourseShelf is.** A self-hosted course management platform for people
who own large local collections of video courses (Udemy exports, conference
recordings, ripped DVDs, etc.) and want a tidy, trackable way to actually
finish them. _Audiobookshelf, but for video courses._ Web + Flutter mobile,
sharing one self-hosted backend.

**Who uses it.**

- **Owner-Admin** — tech-comfortable self-hoster. Sets it up, scans
  libraries, manages users.
- **Household / Team learner** — has their own account, picks up where
  they left off, doesn't want their kid's progress mixing with theirs.
- **Guest** — read-only / scoped access to specific courses.

**Tone.** Calm, focused, substantial, trustworthy. The interface should
feel like a tool a serious learner uses — closer to Linear / Things /
Reeder than to a marketing-heavy SaaS dashboard. Generous whitespace,
clear hierarchy, no decorative noise.

**Top-level UX principles** (from PRD §7):

- **Library first.** Home screen answers "what should I watch next?" — not
  a marketing pitch, not a menu.
- **One click to resume.** The most-recently-watched lesson is always one
  tap from the home screen.
- **Quiet UI while watching.** Player chrome fades away. No upsells, no
  notifications during playback.
- **Self-evident sync.** Progress changes show as small inline indicators,
  never modals.
- **Dark mode default.** Light mode supported as a respectful peer, not
  a fallback.

**Don't design for.** Discovery feeds, recommendations, social/sharing,
gamification badges, marketing surfaces. Self-hosted users don't want
these and we don't ship them.

---

## 2. Phase 0 — Design system onboarding

Set up a CourseShelf organization in Claude Design and run the onboarding
flow. Link the GitHub repository so Claude Design can read the codebase
(specifically `PRD.md`, `DESIGN.md`, `AGENTS.md`, and any existing tokens
under `packages/design-tokens/`).

**Paste this as the onboarding brief** in the design-system setup chat:

> CourseShelf is a self-hosted course management platform — think
> Audiobookshelf for video courses. The interface should feel calm,
> focused, and substantial. The user is a serious learner who owns their
> content, not a casual consumer being marketed to.
>
> Build a design system with the following characteristics:
>
> **Mode**: Dark mode is the default; the system must work equally well in
> light mode.
>
> **Color**: A near-black surface palette (think `#0E0F12` to `#1A1C20` in
> dark mode), warm neutrals for elevated surfaces, and a single confident
> accent color for primary actions and progress. Avoid vibrant tech-bro
> blues; lean toward something distinctive but unhurried — a deep amber,
> a muted teal, or a desaturated indigo are all fair starting points.
> Limited semantic colors (success, warning, error, info), each visible
> in both modes without leaning on hue alone.
>
> **Typography**: One sans-serif for the entire UI with strong screen
> readability (Inter, IBM Plex Sans, or system stack). Optional: a
> slightly more humanist secondary face for course titles to soften the
> feel. Clear scale with named sizes (caption, body, body-strong, title,
> heading, display). Numerals tabular where they appear in tables or
> progress.
>
> **Spacing**: 4px base. Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96.
>
> **Radius**: Three radii: `sm` (4px), `md` (8px), `lg` (16px). Cards
> use `md`; modals and large surfaces use `lg`.
>
> **Elevation**: Maximum three layers. Mostly flat with subtle
> separation via background tone, not shadow. Shadows reserved for true
> floating surfaces (menus, modals).
>
> **Density**: Comfortable by default; lists may opt into a denser
> variant. No micro-tap targets; minimum 44×44 hit area on mobile.
>
> **Iconography**: One lined icon set (Lucide is fine), 24px default,
> 1.5px stroke. No filled icons except for active/selected states.
>
> **Motion**: Functional only. Easing: standard ease-out for entrances,
> ease-in for exits, both ~150–250ms. No bouncy springs. Respect
> reduce-motion.
>
> **Component patterns** (please define):
>
> - Buttons (primary, secondary, ghost, destructive; with loading, disabled, focus states)
> - Inputs (text, number, search, select, switch, checkbox, radio)
> - Cards (course card, lesson row, dashboard tile)
> - Lists and rows (with leading icon/avatar, trailing meta)
> - Tabs, segmented controls
> - Toasts, banners, inline alerts (no modals for sync feedback)
> - Modals / dialogs / sheets (sheets preferred on mobile)
> - Empty states, loading skeletons, error states (these are first-class)
> - Progress indicators (linear bar, circular, ringed avatar)
> - Avatar (with role indicator: ADMIN / USER / GUEST)
> - Tag chip
> - Player chrome (custom — see brief in Phase 3)
>
> The system must be accessibility-grade WCAG 2.1 AA: contrast ≥ 4.5:1
> for body text, focus rings always visible, no information conveyed by
> color alone.
>
> Output: a published design system the team can use across all
> projects.

**What you should have after Phase 0:**

- A published design system in your Claude Design organization.
- Tokens exportable as Style Dictionary JSON (drop into
  `packages/design-tokens/tokens.json`).
- Component primitives defined and previewable.
- An organization-wide brand pickup that auto-applies to all subsequent
  projects.

---

## 3. Project plan (ordered)

| #   | Project                     | Phase | Output                                          |
| --- | --------------------------- | ----- | ----------------------------------------------- |
| 1   | Design System & Foundations | 1     | Tokens, primitive components                    |
| 2   | Domain components           | 2     | CourseCard, LessonRow, PlayerChrome, etc.       |
| 3   | Web — Auth & first-run      | 3     | Login, sign-up, setup wizard                    |
| 4   | Web — Home                  | 3     | Continue watching + recents                     |
| 5   | Web — Browse & search       | 3     | Course grid, filters, search                    |
| 6   | Web — Course detail         | 3     | Sections, lessons, progress                     |
| 7   | Web — Lesson player         | 3     | Player + sidebar (notes/bookmarks/materials)    |
| 8   | Web — Admin                 | 3     | Dashboard, users, libraries, permissions, scans |
| 9   | Web — Settings              | 3     | Profile, theme, account                         |
| 10  | Mobile — Auth               | 4     | Sign in / sign up                               |
| 11  | Mobile — Home               | 4     | Continue watching, jump back in                 |
| 12  | Mobile — Browse             | 4     | Library list, course list                       |
| 13  | Mobile — Course detail      | 4     | Sections + download controls                    |
| 14  | Mobile — Lesson player      | 4     | Portrait + landscape, offline indicator         |
| 15  | Mobile — Downloads          | 4     | Manager, queue, storage                         |
| 16  | Mobile — Search & settings  | 4     | Search results, settings, profile               |

Do them in order. Phase 1–2 establish primitives; phases 3–4 compose them.

---

## 4. Phase 1 — Design System & Foundations project

**Project name in Claude Design**: `cs-foundations`

**Brief to paste**:

> Generate the foundation page for the CourseShelf design system. Show
> the design system in use: a single long-scroll screen demonstrating
> every primitive component in every required state.
>
> Sections, in order:
>
> 1. **Color** — full palette swatches, both modes, with hex/HSL and
>    semantic names.
> 2. **Typography** — full scale (caption → display) with line-heights;
>    sample paragraph; sample number row.
> 3. **Spacing** — 4–96 scale visualized with labels.
> 4. **Radius** — sm / md / lg samples on cards.
> 5. **Buttons** — primary, secondary, ghost, destructive — each in
>    default / hover / active / focus / disabled / loading.
> 6. **Inputs** — text, search, number, select, switch, checkbox, radio,
>    each in empty / filled / focus / error / disabled.
> 7. **Cards** — base card, dashboard tile, with hover state.
> 8. **List rows** — leading icon, leading avatar, trailing meta,
>    selected state, hover state.
> 9. **Tabs & segmented controls** — both, default and selected.
> 10. **Feedback** — toast, banner (info/success/warning/error), inline
>     alert, sync-status indicator.
> 11. **Overlays** — dialog (sm/md), bottom sheet (mobile), command
>     palette (desktop).
> 12. **Progress** — linear, circular, ringed avatar, scrubber.
> 13. **Empty states** — generic empty, search empty, error,
>     no-permission.
> 14. **Loading skeletons** — for card, row, detail page.
> 15. **Avatar** — sizes; with admin/guest role badge.
> 16. **Tag / chip** — default, selected, removable.
>
> Show both dark and light mode side by side per section. Annotate each
> component with its name (used in code). Use realistic copy that fits
> the CourseShelf domain (course titles, lesson names, instructor
> names) — no lorem ipsum.

**Acceptance**:

- Every primitive enumerated above is present.
- All required states are visually distinct.
- Tokens used everywhere (no hard-coded hex outside the palette).
- Light + dark modes both pass WCAG AA.

---

## 5. Phase 2 — Domain components project

One Claude Design project per group. Components live in `apps/web/components/`
(web) and `apps/mobile/lib/widgets/` (mobile). Each component must be
designed once and adapt across breakpoints/platforms.

### 5.1 `cs-component-coursecard`

> Design the **CourseCard** component used to represent a course in
> grids and rows.
>
> Three variants:
>
> - **Poster card** (used in grids): vertical, cover image fills the
>   top, title + instructor + progress bar below.
> - **Wide card** (used in continue-watching rows): horizontal,
>   thumbnail left, title + instructor + progress + "resume at HH:MM"
>   right.
> - **Compact row** (used in dense lists): single line, small thumb,
>   title, progress as a thin bar.
>
> States per variant: default, hover, focus, in-progress (with progress
> bar), completed (with checkmark), not-started, locked (no permission),
> loading skeleton.
>
> Show all variants and all states in the same canvas. Realistic course
> titles. Show how progress percentage appears (numeric vs. visual).

### 5.2 `cs-component-lessonrow`

> Design the **LessonRow** used inside a course detail page.
>
> Single horizontal row: lesson position number, title, duration, status
> (completed / in-progress / not-started), optional materials icon
> (PDF/MD attached), optional download icon (mobile).
>
> States: default, hover, current (the lesson being viewed in the
> player), completed, in-progress (with thin progress underline),
> downloading (mobile), downloaded (mobile), failed-download (mobile),
> loading skeleton.
>
> Also show the **section header** that groups rows: section title,
> lesson count, total duration, expand/collapse affordance.

### 5.3 `cs-component-playerchrome`

> Design the **PlayerChrome** — the controls overlaid on the video
> player.
>
> Required: play/pause, scrubber with buffered/played/total, current
> time / total time, speed picker (0.5×–2×), volume, subtitle picker
> with language list, fullscreen, picture-in-picture, settings menu.
>
> Three contexts:
>
> - **Web — desktop hover-revealed overlay**.
> - **Web — desktop minimal mode** (after 3s of no movement: only the
>   scrubber peeks at the bottom).
> - **Mobile — landscape full-screen** with edge gesture hints.
>
> States: idle, playing, paused, buffering, error, end-of-lesson with
> "next lesson" affordance, locked (no permission).
>
> Show the scrubber with chapter/bookmark markers.

### 5.4 `cs-component-bookmarknote`

> Design the **Bookmark** and **Note** components used in the lesson
> sidebar.
>
> **Bookmark**: timestamp on the left, optional label, edit/delete on
> hover. Adding a bookmark uses an inline form; no modal.
>
> **Note**: a single per-lesson markdown editor. Show editing state
> (toolbar visible) and viewing state (toolbar collapsed). Auto-save
> indicator (the "self-evident sync" pattern).

### 5.5 `cs-component-progressbadge`

> Design the **ProgressBadge** used wherever a course or lesson's
> progress needs an at-a-glance summary.
>
> Variants: ringed (circle around an avatar/cover), inline pill
> ("4 of 12"), thin bar. Each in not-started, in-progress (e.g. 47%),
> completed (checkmark), locked.

### 5.6 `cs-component-libraryscan`

> Design the **ScanProgressIndicator** for the admin Library detail page
> while a scan is running.
>
> Shows: status (running / succeeded / failed), files scanned, files
> added, files updated, current file being processed (truncated path),
> elapsed time. Includes a "cancel" affordance and a "view errors"
> affordance when errors > 0.

### 5.7 `cs-component-downloadrow` (mobile only)

> Design the **DownloadRow** for the mobile downloads manager.
>
> Single row per lesson: lesson title, course title, size, state
> (queued / downloading / paused / ready / failed), progress for
> downloading state, action (cancel / retry / delete).

---

## 6. Phase 3 — Web screens (responsive)

### 6.1 Responsive breakpoints

| Name | Width     | Layout posture                                                 |
| ---- | --------- | -------------------------------------------------------------- |
| `xs` | < 600     | Single column, full-bleed cards, bottom-tab navigation         |
| `sm` | 600–959   | Two-column where it helps, condensed nav                       |
| `md` | 960–1279  | Sidebar + content; standard reading width                      |
| `lg` | 1280–1919 | Sidebar + content + optional secondary panel                   |
| `xl` | ≥ 1920    | Same as `lg`, just more breathing room (cap content max-width) |

Web is responsive end-to-end, including the player. The player on `xs`
goes full-bleed with the sidebar collapsing into a bottom sheet.

Every web screen brief below includes layouts at three reference widths:
**360 (xs), 1024 (md), 1440 (lg)**. Other breakpoints interpolate.

### 6.2 `cs-web-auth`

> Design CourseShelf's authentication screens.
>
> Screens:
>
> - **Sign in** (email + password). Single column, centered, max 380px
>   wide. "Sign in" primary button, "Forgot password?" tertiary link.
>   No marketing copy, no third-party auth providers (those are v2).
> - **Sign up** — only available when the instance has the
>   self-registration toggle on; otherwise shows a "Sign-up disabled —
>   ask your admin" empty state.
> - **First-run setup wizard** — only seen by the very first user. Three
>   steps: (1) create admin, (2) optionally register first library by
>   path, (3) confirm and go.
>
> Responsive: same layout at all widths; just adjust paddings.
> Dark mode primary; light mode visible.
>
> States to show: default, loading (button spinner), success (transient
> toast then redirect), error (inline form error, never modal),
> rate-limited (banner: "Too many attempts; try again in 12 minutes").

### 6.3 `cs-web-home`

> Design the **Home** screen — the first screen after login.
>
> Layout (desktop, 1440):
>
> - Top: greeting + role indicator.
> - "Continue watching" row: 5 wide cards visible, horizontal scroll
>   if more, with "next lesson" CTA on each. Empty: "Pick a course to
>   start watching."
> - "Recently added" row: poster cards, 6 visible.
> - "Recently completed" row: collapsed by default, expandable.
> - Right rail (lg+ only): a small "Your week" panel — minutes watched,
>   lessons completed. Hidden on md and below.
>
> Layout (md, 1024): drop the right rail; rows full width.
>
> Layout (xs, 360): bottom tab bar appears (Home / Browse / Search /
> Settings); each row scrolls horizontally; cards become single-column
> stacked compact rows below the first row's hero.
>
> States: default (populated), empty (no progress yet — show one big
> "Browse the library" card), loading skeleton, error.

### 6.4 `cs-web-browse-search`

> Design the **Browse** and **Search** screens.
>
> Browse:
>
> - Filters as a left sidebar at md+: status (not started / in-progress
>   / complete), library, duration buckets, instructor (if many).
> - At xs/sm: filters open in a bottom sheet from a floating "Filters"
>   button; active filter count is shown as a chip on the button.
> - Grid of CourseCards (poster variant). Default sort: recently
>   watched, with secondary "newest", "alphabetical", "duration"
>   options.
>
> Search:
>
> - Top search bar persistent across the layout (no separate page on
>   xs — search opens a full-screen overlay).
> - Results grouped by type: Courses, Lessons. Each result shows a
>   thumbnail, title, course context, and a "where matched" snippet.
> - Empty: "No results for 'term' — try a broader search or remove a
>   filter."
> - Loading: inline skeleton, not a spinner.

### 6.5 `cs-web-course-detail`

> Design the **Course Detail** screen.
>
> Layout (1440):
>
> - Hero: cover image left, title / instructor / overall progress /
>   description right. Primary action: "Resume" (or "Start" if
>   not-started); secondary: "Mark complete" / "Reset progress".
> - Below: section list with LessonRows. Sections collapsible. Current
>   lesson highlighted.
> - Right rail: course materials list (PDFs, MD), downloadable
>   individually.
>
> Layout (1024): hero stacks (cover above title); right rail moves below
> the section list.
>
> Layout (360): hero is a horizontal strip — cover thumbnail + title +
> resume button — then sections.
>
> States: default, in-progress, completed (with completion celebration
> banner — quiet, not festive), no-access (locked variant with a
> "Contact admin" hint).

### 6.6 `cs-web-lesson-player`

> Design the **Lesson Player** screen.
>
> Layout (1440):
>
> - Player on the left/center, takes ~70% width, max 16:9 aspect.
> - Right sidebar (~30%): tabs for "Sections", "Notes", "Bookmarks",
>   "Materials". Each tab loads its content inline.
> - Bottom: lesson title, instructor, "previous / next" lesson
>   affordances.
>
> Layout (1024): same with a slightly narrower sidebar.
>
> Layout (360): player full-width on top; tabs as a horizontal scroller
> below; tab contents scroll vertically. Player can go full-screen with
> the standard gesture, hiding the rest.
>
> Player chrome behavior: visible on entry; fades after 3s of no input;
> reappears on mouse move / tap. Subtitles toggled inline; speed picker
> as a popover.
>
> States: loading (skeleton player + skeleton sidebar), error
> (inline message inside the player area), end-of-lesson (auto-advance
> banner with countdown + "stay" affordance), no permission.

### 6.7 `cs-web-admin`

> Design the **Admin** section.
>
> Screens:
>
> - **Dashboard**: cards for library count + total size, user count,
>   last scan summary, error count over 24h. Recent scans table with
>   status pills.
> - **Libraries**: list of libraries; each shows name, root path
>   (truncated, with copy-on-click), last scan, course count. "Add
>   library" CTA. Detail page per library: scan history, manual
>   "Scan now" button, scan progress (uses the
>   `ScanProgressIndicator` from Phase 2).
> - **Users**: list with avatar / name / role / last active. Add /
>   edit / disable. Inline role chips that admins can change directly.
> - **Permissions**: a per-user view showing access grants — libraries
>   with READ / NONE per row; per-course overrides as a nested
>   accordion. "Add grant" opens a sheet with library/course picker
>   and level selector.
>
> Responsive: admin is desktop-first but must work down to 360. At xs,
> tables become row lists; primary actions stay visible.

### 6.8 `cs-web-settings`

> Design the **Settings** screen.
>
> Sections:
>
> - Profile (display name, avatar, change password).
> - Appearance (theme: dark / light / system; density).
> - Playback defaults (default speed, autoplay next lesson, completion
>   threshold).
> - Account (sign out, sign out all devices, delete account if allowed).
>
> Single column, max 720px wide on desktop. Inline saves with the
> "self-evident sync" indicator.

---

## 7. Phase 4 — Mobile screens (iOS + Android)

The mobile app is Flutter. Designs should be **platform-aware but not
platform-divergent** — visual language is shared, but respect each
platform's navigation idioms.

### 7.1 Platform considerations

- **iOS**: navigation via stack with back-swipe; bottom tab bar with
  ~5 tabs max; sheets slide up from the bottom; system blur on tab bar
  and overlays where appropriate.
- **Android**: same tab bar; back affordance on the top-left; sheets
  use Material 3 patterns; respect system navigation gestures.
- Both: respect dynamic type; minimum 44×44 hit areas; reduce-motion
  honored; safe areas always respected.

Tab bar tabs (mobile): **Home** · **Browse** · **Downloads** ·
**Search** · **Settings**.

Mobile screens below assume **375×812** (iPhone 13 mini) and
**428×926** (iPhone 14 Pro Max) reference widths, plus an Android
**412×915** check.

### 7.2 `cs-mobile-auth`

> Design the mobile **Sign in** flow.
>
> Single screen: logo, email field, password field, sign-in button,
> "forgot password" link. No marketing. Errors inline. Loading state on
> the button. Same look on iOS and Android with subtle platform-native
> field styling.

### 7.3 `cs-mobile-home`

> Design the mobile **Home** tab.
>
> Top: large title "Home" (iOS-style large title that collapses on
> scroll; Material parallax on Android).
>
> Sections:
>
> - Continue watching: horizontal carousel of wide CourseCards, with
>   resume time visible.
> - Recently added: horizontal carousel of poster CourseCards.
> - Quick links: "Downloads", "Library" buttons.
>
> Pull to refresh. Empty: friendly nudge to browse the library. Loading
> skeleton.

### 7.4 `cs-mobile-browse`

> Design the mobile **Browse** tab.
>
> A grid of poster CourseCards, 2 columns at narrow widths and 3 at
> tablet widths. Filter button in the top-right opens a bottom sheet
> with the same filters as web (status, library, duration, instructor).
> Sort affordance accessible from the same sheet.
>
> Empty, loading, error states required.

### 7.5 `cs-mobile-course-detail`

> Design the mobile **Course Detail** screen.
>
> Top: cover image as a hero (collapsing on scroll). Title, instructor,
> progress, primary "Resume / Start" CTA, secondary "Download course"
> CTA (with size estimate).
>
> Below: sections expanded by default with LessonRows. Each LessonRow
> shows download status (downloaded checkmark / downloading spinner
> with progress / cloud icon / failed). Tapping the download icon
> queues that lesson.
>
> States: default, in-progress, completed, no-access, mid-download,
> mostly-downloaded, all-downloaded.

### 7.6 `cs-mobile-lesson-player`

> Design the mobile **Lesson Player**.
>
> Two orientations:
>
> **Portrait**: player at the top in 16:9, tab strip below for
> Sections / Notes / Bookmarks / Materials, tab content fills the rest.
> Bottom safe area respected.
>
> **Landscape**: player full-screen with edge-revealed PlayerChrome.
> Double-tap left/right to skip 10s. Pinch the corners to dismiss to
> portrait.
>
> Offline indicator: small icon + "Watching offline" text under the
> title when the lesson source is the local file.
>
> Sleep timer affordance accessible from the player settings overlay.
>
> States: loading, playing, paused, buffering, end-of-lesson, error,
> watching-offline.

### 7.7 `cs-mobile-downloads`

> Design the mobile **Downloads** tab.
>
> Top: storage usage summary — total used by CourseShelf, available on
> device, with a thin proportional bar.
>
> Sections (collapsed by default per course, expandable):
>
> - **In progress**: queued + actively downloading lessons (uses
>   DownloadRow).
> - **Downloaded**: by course, with per-course "delete all" affordance.
> - **Failed**: with retry / clear.
>
> Empty: "Nothing downloaded yet — open a course and tap the download
> icon." Network-aware: when offline, show a banner that uploads /
> retries are paused.

### 7.8 `cs-mobile-search-settings`

> Design the mobile **Search** tab and **Settings** tab.
>
> Search: a search field at the top, results grouped (Courses /
> Lessons) below, with the same snippet-and-thumbnail treatment as
> web. Recent searches shown when the field is empty.
>
> Settings: same sections as web (Profile, Appearance, Playback,
> Account) styled as a native settings list. Sign-out at the bottom
> with destructive treatment.

---

## 8. Cross-cutting specifications

### 8.1 Required component states

Per **NFR-DS-02 / NFR-DS-03**, every reusable component design must
demonstrate every state that exists in code:

- `default`
- `hover` (web) / `pressed` (mobile)
- `focus` (keyboard)
- `active` / `selected`
- `disabled`
- `loading` (skeleton or spinner — pick the right one for the context;
  buttons spin, lists skeletonize)
- `error`
- `empty`

Domain components additionally show the domain states they encode (e.g.
CourseCard shows `not-started`, `in-progress`, `completed`, `locked`).

### 8.2 Accessibility

- WCAG 2.1 AA: contrast ≥ 4.5:1 for body, 3:1 for large text.
- Visible focus on every interactive element. The focus ring is part of
  the design system, not an afterthought.
- No information conveyed by color alone — pair color with a shape/icon
  cue.
- Hit areas ≥ 44×44 on mobile; ≥ 32×32 on web with adequate spacing.
- Motion respects `prefers-reduced-motion`. Show the reduced variant in
  the foundations canvas.
- Mobile respects platform dynamic-type / font-scale settings.

### 8.3 Iconography

Use one icon set throughout (Lucide is the recommended choice). 24px
default, 1.5px stroke. Only use a filled variant of an icon to convey
the active/selected state of an explicitly stateful control (e.g.
bookmark-on vs bookmark-off).

### 8.4 Motion language

- Transitions: 150–250ms, ease-out for entry, ease-in for exit.
- No bouncy springs anywhere.
- Page transitions on web: fade only; no slide.
- Mobile screen transitions: platform-default.
- Player chrome fade: 200ms after 3s idle.
- Skeletons pulse subtly (~1.4s cycle), not aggressively.

### 8.5 Copy & tone

- Sentence case for labels, buttons, and titles. No All-Caps Buttons.
- Prefer verbs over nouns ("Resume", "Download course", not "Resume
  Watching", "Course Download").
- Errors: tell the user what happened _and_ what to do next.
- Empty states: name the gap, propose an action.
- No exclamation marks. No emoji in the UI itself.

---

## 9. Handoff

For each Claude Design project that's accepted:

1. Export the **handoff bundle** from Claude Design.
2. Save it to `docs/design/<project-slug>/` in the repo. The slug
   matches the project name in this brief (e.g. `cs-web-home`).
3. Commit alongside the implementation PR. The PR description must
   link both the bundle path and the public Claude Design preview URL.
4. Tokens that change as a side effect of design work get re-exported
   from the design-system editor in Claude Design and dropped into
   `packages/design-tokens/tokens.json`. Run `pnpm gen:design-tokens`
   to regenerate `apps/web/assets/tokens.css` and
   `apps/mobile/lib/design/tokens.dart`.

Per **AGENTS.md §6.4**, no UI work merges without:

- A Storybook story per visual state for any web component touched.
- A Widgetbook use case per state for any Flutter widget touched.
- A link to the corresponding handoff bundle in the PR.

---

## 10. Open questions for the design phase

These should be answered during Phase 0–1 and pinned to this document.

- **Accent color final pick.** Phase 0 lists three directions; pick one
  and update `packages/design-tokens/tokens.json` accordingly.
- **Secondary type face.** Use one face throughout, or introduce a
  humanist face for course titles?
- **Density default.** Comfortable everywhere, or comfortable on web /
  compact on mobile lists?
- **Dashboard density.** Admin dashboard: information-dense (denser
  rows, smaller type) or comfortable like the rest?
- **Course completion celebration.** What does the "quiet
  celebration" look like? A subtle confetti is too much; perhaps just
  a temporary banner + a check on the cover.
