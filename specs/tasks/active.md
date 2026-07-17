# Active tasks

## T-2026-07-17-007 — E18 wave 1: mobile tab shell + the three Stage A cards

- Created: 2026-07-17
- Owner: claude
- Spec: [E18-F01-S01](../../docs/roadmap/tasks/E18-F01-S01.md), [E18-F02-S01](../../docs/roadmap/tasks/E18-F02-S01.md), [E18-F03-S01](../../docs/roadmap/tasks/E18-F03-S01.md)
- Goal: the mobile app becomes navigable — a real 5-tab shell hosting a real Home, with the auth surfaces designed and the lesson player playing video.
- Acceptance:
  - Signing in lands on the 5-tab bottom bar (Home · Browse · Downloads · Search · Settings), not the `Home — replace me` placeholder
  - Home shows Continue-watching + Recently-added carousels and quick links, and pulls to refresh
  - Sign-in / sign-up / forgot render the brand design (AppBrand, PasswordField, SsoBlock, AppBanner) rather than raw Material
  - A lesson plays video in portrait, and rotates to an immersive landscape PlayerChrome
- Spec diff: none — all three cards are `Spec diff: none`; every endpoint already exists
- Codegen impact: no
- Design impact: `AppNavigationTab` gains an optional `onRefresh` (ui_flutter). No new tokens, no new components — the three mockups consume the existing catalog.
- Tests: bloc_test per Cubit/BLoC; widget tests for the shell; ui_flutter widget tests for the refresh affordance
- Sub-steps:
  - [ ] **Shell foundation (serial — blocks Home)**: `onRefresh` on `AppNavigationTab` + adaptive refresh in `AppNavigationShell`; `MainShell` in `apps/mobile`; `AuthGate._HomeScreen` → `MainShell`; pre-wire the `/forgot` + lesson routes so the parallel agents never both edit `routes.dart`
  - [ ] E18-F01-S01 — `HomeCubit` (Loading | Loaded | Empty | Failed) + Home tab body
  - [ ] E18-F03-S01 — rework the placeholder auth screens; add `forgot_screen`; `SignUpCubit` + `ForgotCubit` 3-step machines
  - [ ] E18-F02-S01 — `video_player` dependency; player BLoC; portrait tabs + landscape chrome; throttled 10s `progress_outbox` write
- Status: in-progress
- Blockers: —

### What the roadmap got wrong about E18

Verified against the tree before starting:

- **The bottom tab bar was never wired.** `AppNavigationShell` (E17-F02-S07, ✅ Done) had zero consumers outside its own Widgetbook catalog, and `routes.dart` is a flat named-route map with no shell. Every F01/F03 card builds a _tab_ into a host that did not exist. Hence the serial foundation step.
- **Pull-to-refresh was unbuildable.** The shell owns a `CustomScrollView` per tab and wraps each body in a `SliverToBoxAdapter`, so a tab body cannot wrap its own scrollable in a `RefreshIndicator`. E18-F01-S01 requires pull-to-refresh, so the shell has to own it — the catalog component meeting its first real consumer.
- **E18-F03-S01 is a rework, not greenfield.** `sign_in_screen.dart` / `sign_up_screen.dart` already exist from E15-F01-S03 as deliberate placeholders: real `AuthCubit` plumbing and web-mirrored validation behind raw Material widgets. `sign_in_screen.dart` says so itself — _"the final visual design lands in E18-F03-S01"_.
- **The player needs an engine neither stack has.** Web plays video with a raw `<video>` element (`useLessonPlayer.ts`) — no library. Mobile has no playback dependency at all. `video_player` chosen: it wraps ExoPlayer/AVPlayer, the same delegate-to-the-platform stance as `<video>`, so both stacks accept the same formats.

Open question, deliberately not answered this wave: **`phone_auth_screen.dart` is on no card.** A phone-OTP path exists in the app and in `AuthState` (`otpSent`) but appears in no E18 card and in no `cs-mobile-auth` mockup. Left alone rather than deleted.

Not in this wave, and why: **E18-F01-S02** (Browse) needs a design pre-step — its bundle has `index.html` + `styles.css` but no `app.jsx`, though `cs-mobile-home/app.jsx` does carry a BROWSE reference screen, so it is closer than the card implies. **E18-F01-S03** (Course detail) and **E18-F03-S02** (Search/Settings) are 🚫 Blocked with no bundle at all; F01-S03 additionally needs `GET /courses/{id}/download-estimate` **and** a per-course size field on `CourseDto` that does not exist.
