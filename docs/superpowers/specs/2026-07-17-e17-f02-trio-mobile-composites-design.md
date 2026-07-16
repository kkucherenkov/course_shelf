# E17-F02 trio — mobile-only composite designs (S03 / S06 / S07)

**Date:** 2026-07-17
**Cards:** E17-F02-S03 (PlayerChrome), E17-F02-S06 (DownloadRow), E17-F02-S07 (NavigationShell)
**Status:** approved (user "lgtm", 2026-07-17)

## Why these three got a design gate

The other nine F02 cards are faithful ports of an existing web `packages/ui`
component — the `.vue` file is the design authority. These three each carry a
mobile interaction layer with **no web reference to port**:

- **S06 DownloadRow** — no web twin at all; only DESIGN_BRIEF §5.7 + §7.7 prose.
- **S03 PlayerChrome** — `AppPlayerChrome` exists, but the mobile-landscape
  edge-gestures / pinch-dismiss are net-new.
- **S07 NavigationShell** — `AppNavigationShell` exists, but the iOS
  large-title-collapse / Android M3 parallax chrome is net-new.

All three are presentational `app_ui` components: **controlled** (state in,
callbacks out), reusing E17-F01 primitives, token-driven, TDD with widget +
golden tests and a Widgetbook catalog entry.

## S06 · `AppDownloadRow` — `lib/src/downloads/`

- **Layout:** one row per lesson — leading state glyph (`IconCS`), lesson title
  + course title (two lines), trailing size + action button. A thin
  `AppProgressLinear` underline shows only in the `downloading` state.
- **States** (`AppDownloadState`): `queued` · `downloading` (with %) · `paused`
  · `ready` · `failed`.
- **Action** (trailing `AppIconButton`), state-driven: queued/downloading →
  cancel; paused → resume; failed → retry; ready → delete. Emits
  `onCancel/onPause/onResume/onRetry/onDelete`.
- **Tokens:** `failed` → `error`/`errorSoft`; `ready` → `successFg`; size text →
  `AppFontSize.sm` + `onSurfaceVariant`.
- **Approved decision:** include `paused` + resume (brief §7.7 mentions
  pausing) beyond the §5.7 short-list.

## S03 · `AppPlayerChrome` — `lib/src/player/` (mobile-landscape)

Base structure from `docs/design/cs-components/components.jsx §PlayerChrome`
(the `mobile-landscape` context). It is the **controls overlay** over a video
*slot* — the component does not decode video; the E18 player screen supplies the
surface.

- **Overlay:** top bar (section label + lesson title, settings button) ·
  custom-painted **scrubber** (buffered / played / thumb + chapter ticks +
  bookmark markers) · control row (play·pause, prev, next, volume,
  `mm:ss / mm:ss`, speed, subtitles, fullscreen). Minimal mode = only the thin
  scrubber peeks after idle.
- **States** (`AppPlayerChromeState`): `playing` · `paused` · `buffering`
  (spinner) · `error` (alert + retry) · `locked` (lock) · `end` (up-next
  banner: Stay / Play next).
- **Mobile interactions (net-new):** edge-revealed chrome (tap toggles
  overlay/minimal); double-tap left/right → skip 10s (edge hint "⟲10 / 10⟳");
  pinch-in → dismiss to portrait. Callbacks: `onPlayPause`, `onSeek(fraction)`,
  `onSkip(±10)`, `onDismissToPortrait`, `onNext`, `onSpeedTap`,
  `onSubtitlesTap`, `onSettingsTap`.
- **Approved decisions:** speed & subtitle controls are **buttons that emit
  callbacks**, not embedded pickers (the menus are the E18 player screen's job);
  PiP button omitted on mobile; sleep-timer / offline indicators are the E18
  screen's responsibility, not the chrome component.

## S07 · `AppNavigationShell` — `lib/src/navigation/`

Web `AppNavigationShell` exists; this adds the platform-adaptive title chrome it
lacks.

- **Layout:** a `Scaffold` shell — bottom tab bar with the **5 tabs**
  (Home · Browse · Downloads · Search · Settings), each an `IconCS` glyph;
  **active tab uses the filled glyph variant** where one exists. Body is an
  `IndexedStack` of tab slots (state preserved across switches).
- **Platform-adaptive top:** iOS → large title that collapses on scroll
  (`CupertinoSliverNavigationBar`-style); Android → Material 3 parallax
  `SliverAppBar`. Branch on `Theme.of(context).platform`.
- **Prop surface (controlled):** `tabs` (label + icon + optional filledIcon +
  body), `currentIndex`, `onTabChanged(i)`, `title`. Safe areas + 44px hit
  targets respected.
- **Approved decision:** shell owns tab-switching via `IndexedStack` (lazy first
  build); the large-title collapse is driven by the active tab's own scroll
  view, so the shell exposes a scrollable body slot rather than owning the
  scroll controller.

## Testing (all three)

Widget tests for every state + callback; golden matrices in light + dark
(`customPump` for any animation — spinner/collapse). Reuse
`test/_support/fonts.dart` + `AppTheme`. One new uniquely-named Widgetbook
catalog file per card; `directories.dart` wiring is the integrator's job.
