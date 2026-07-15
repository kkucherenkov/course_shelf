# E15 mobile-foundations close-out — design

**Date:** 2026-07-15
**Scope:** Close out epic E15 (Mobile foundations). Three stories, three PRs.
**Not in scope:** E16–E20. Each gets its own brainstorm → spec → plan cycle.

## Why this slice

The mobile track (GitHub issues #3–135, epics E15→E20) is ~35 stories. Too
large for one spec. The dependency chain is near-linear:

```
E15 foundations → E16 Widgetbook → E17 widget catalog → E18 features → E19 offline → E20 sync
```

E15 is the root and is already partly shipped. Everything visual downstream
needs the theme; E18/E19 need Drift. So E15 goes first, alone.

## Ground truth (verified 2026-07-15, not assumed)

The roadmap cards predate the code. Several references are stale. Verified
current reality:

| Concern | Card / brief says | Reality |
| --- | --- | --- |
| Token source | `packages/design-tokens/tokens.json` | `docs/design/shared/tokens.json` |
| Token build | `pnpm gen:design-tokens` | `pnpm design:build` (`packages/design-tokens/src/build.ts:39`) |
| Token output | `apps/mobile/lib/design/tokens.dart` | `packages/ui_flutter/lib/src/theme/tokens.g.dart` |
| Flutter widgets | `apps/mobile/lib/widgets/` | `packages/ui_flutter/lib/src/` |
| Dio factory | `core/api/dio_factory.dart` | `shared/network/api_client.dart` |
| Theme API | `ThemeData.fromTokens()` | scaffolding comment in `main.dart` says `AppTheme.light()` |
| Issue sync | `pnpm issues:sync` | dead — `scripts/seed-forgejo-issues.ts` targets `http://code.homelab.local`; Forgejo dropped 2026-07-14 |

`docs/design/DESIGN_BRIEF.md` is stale on **every** token path, yet every E15
card lists it as the design reference.

**Consequence for orchestration:** subagent prompts MUST pin real paths
explicitly and must NOT delegate path decisions to DESIGN_BRIEF.md. A
`flutter-engineer` following the brief would hand-write
`apps/mobile/lib/design/tokens.dart`, shadowing the generated file — exactly
the drift the "never edit generated artefacts" rule exists to prevent.

Fixing the brief and porting the sync script are real work but **out of scope
here** — they get their own cards.

### Auth: what actually exists

`emailOTP` exists nowhere in the stack. Verified:

| | email + password | phone OTP (SMS) | email OTP |
| --- | --- | --- | --- |
| backend | ✅ `emailAndPassword: {enabled: true, autoSignIn: true}` | ✅ `phoneNumber()` + `sms.sendOtp` | ❌ no `emailOTP()` plugin |
| mail transport | — | — | ❌ none in `apps/backend` |
| web | ✅ `auth.signIn.email(email, password)` | ❌ | ❌ `verifyEmail()` is a `console.warn` stub |
| mobile | ✅ shipped | ✅ in port | ❌ |

`useOtpInput` on web is a headless 6-cell input model that owns no DOM and
calls no API. It makes the codebase *look* like it does email OTP; it does
not. Real email OTP would need a backend `emailOTP()` plugin plus a mail
transport — a backend story, not a mobile one.

**Decision:** mobile mirrors web's real flow — **email + password is the
primary sign-in path; phone OTP is secondary.** This reverses the
E15-F01-S03 card, which declares phone-OTP primary. The card gets corrected
as part of PR 3.

## Rule of thumb: web is the tiebreaker

When a card/PRD conflicts with reality or is ambiguous, **mirror what
`apps/web` actually implements** and file the difference against the
card/PRD as a follow-up card. Cards predate the code; web is the
furthest-along surface and is the de-facto contract. Mobile "improving on"
web makes the platforms diverge — the exact failure a shared token pipeline
exists to prevent.

Check web *runs* the thing, not just that it names it. Both live traps in
this epic were of that shape: `useOtpInput` looks like email OTP but calls no
API; `--font-sans: 'IBM Plex Sans', …` names a font web never loads.

## Typography: fonts are aspirational on both platforms

`AppFontFamily.sans = "IBM Plex Sans"` (tokens.g.dart:155) reads like a
decision. It is not honoured anywhere:

- **No IBM Plex font files exist in the repo.** No `@font-face`, no
  `@fontsource` dependency, no Google Fonts link in `apps/web`. Web renders
  the stack's fallback, `system-ui`.
- The Dart emitter flattens web's stack to its first family, dropping the
  fallbacks. Flutter given `fontFamily: "IBM Plex Sans"` with no bundled font
  **silently** falls back — no error.

**Decision:** bundle on **both** platforms so the token stops lying and both
render the real brand font. Bundling on mobile alone was rejected: it would
make mobile render true IBM Plex while web renders system-ui.

This widens PR 1 into `apps/web` — accepted deliberately. Fonts are IBM Plex
(SIL OFL 1.1; redistribution permitted, license text must ship alongside).
Weights are driven by `AppFontWeight`: Sans 400/500/600/700, Mono 400.

Getting this right in S01 is load-bearing: E17 ports 25+ widgets onto
`AppTheme`, each with its own golden. Wrong typography at the root bakes into
every downstream golden and forces a full regeneration later.

## Issue map

Epic #3.

| Story | Issue | Tasks | Card status | Real status |
| --- | --- | --- | --- | --- |
| E15-F01-S01 theme from tokens | #4 | #5 #6 #7 | 🔄 | #5 #6 done; theme not wired |
| E15-F01-S02 Dio + bearer | #8 | #9 #10 #11 | ✅ | shipped; issues still open |
| E15-F01-S03 AuthCubit | #12 | #13 #14 #15 #16 | 🔄 | mostly shipped; test gaps |
| E15-F02-S01 Drift + DAOs | #17 | #18 #19 #20 | ⬜ | not started |

## Per-story loop (repeatable for every later story)

1. Push entry to `specs/tasks/active.md`.
2. Dispatch `flutter-engineer` with the card + acceptance + **pinned real paths**.
3. Gate: `/code-review high` on the working diff; fix findings.
4. Verify: `flutter analyze` + `flutter test` clean. Evidence before claims.
5. Tick card sub-steps; set Status ✅ + `Completed:` / `Result:`; flip `TODO.md` row.
6. Branch → PR with `Closes #<story> #<task>…` → move entry to `done.md`.

`spec-reviewer` is not used: it reviews `packages/specs`, and all four E15
cards are `Spec diff: none` / `Codegen impact: no`. The OpenAPI spec-first
loop is a genuine no-op for E15 and re-enters at E18-F01-S03. `/code-review`
substitutes as the review gate for Dart diffs.

## PR 1 — E15-F01-S01, theme from tokens

Closes #4 #5 #6 #7, plus bookkeeping #8 #9 #10 #11 (S02 shipped; evidence in
its card Notes).

`tokens.g.dart` is fully populated (292 lines, 18 groups: `AppColorsLight`,
`AppColorsDark`, `AppVerticalColors`, `AppSpacing`, `AppRadius`,
`AppFontSize`, `AppFontWeight`, `AppFontFamily`, `AppLeading`, `AppTracking`,
`AppTextStyles`, `AppDuration`, `AppEasing`, `AppLift`, `AppOpacity`,
`AppZIndex`, `AppShadowsLight`, `AppShadowsDark`). But `app_ui.dart` exports
**nothing** — the tokens are unreachable from consumers. That is the root
blocker.

```
packages/ui_flutter/
  lib/app_ui.dart                      # + export theme & tokens (today: exports nothing)
  lib/src/theme/
    tokens.g.dart                      # generated — untouched
    app_theme.dart                     # NEW  AppTheme.light() / AppTheme.dark()
  fonts/                               # NEW  5 TTFs + OFL LICENSE.txt
  example/
    token_demo_screen.dart             # NEW  renders every populated token group
  test/theme/
    token_demo_golden_test.dart        # NEW
    goldens/token_demo_{light,dark}.png
  analysis_options.yaml                # NEW — package currently has none
  pubspec.yaml                         # + fonts: declaration

apps/mobile/lib/main.dart              # drop ColorScheme.fromSeed → AppTheme.light()/dark()

apps/web/
  package.json                         # + @fontsource/ibm-plex-{sans,mono}
  app/assets/css/main.css              # + @fontsource imports (hand-written file;
                                       #   tokens.generated.css is generated — do not edit)
```

`AppVerticalColors` (tokens.g.dart:105) is emitted but **empty** — the demo
screen renders the 17 populated groups and skips it. Noted so nobody hunts
for missing constants.

`packages/ui_flutter` has **no `analysis_options.yaml`**, so `flutter analyze`
there runs without `flutter_lints` or strict casts — weaker than
`apps/mobile`. S01 is the first real code in the package, so it adds one
mirroring `apps/mobile/analysis_options.yaml`.

The demo screen mirrors the token sections of
`apps/web/app/pages/dev/foundations.vue` (web's equivalent showcase) — colors,
spacing, radius, typography, shadows. It does **not** mirror that page's
component sections; E17 has not ported those widgets yet.

- `AppTheme` maps tokens onto `ThemeData`: `ColorScheme` from
  `AppColorsLight`/`AppColorsDark`, `TextTheme` from `AppTextStyles`, shapes
  from `AppRadius`. Tokens with no Material slot (`AppLift`, `AppDuration`,
  `AppEasing`, shadows) go on `ThemeExtension`s so E17 widgets can read them
  off `Theme.of(context)` rather than importing token constants directly.
- Naming: `AppTheme.light()` / `AppTheme.dark()`, per the existing `main.dart`
  scaffolding comment — not the card's aspirational `ThemeData.fromTokens()`.
- Placement: design system owns its own theme and showcase. `apps/mobile`
  changes by ~3 lines. E16 Widgetbook later absorbs the demo screen.
- Goldens use `golden_toolkit` (already a `ui_flutter` dev dep) for
  `loadAppFonts()` — custom `AppFontFamily` needs it or goldens render Ahem.

**Acceptance:** `flutter analyze` clean; golden passes light + dark; demo
screen renders every token group.

This story lays the first golden rails for the whole mobile track —
`ui_flutter` currently has zero tests.

## PR 2 — E15-F02-S01, Drift + DAOs

Closes #17 #18 #19 #20.

- Add `drift` + `drift_dev`; `build_runner` already present.
- 7 tables: `cached_courses`, `cached_sections`, `cached_lessons`,
  `progress_outbox`, `bookmarks_outbox`, `notes_outbox`,
  `downloaded_lessons`.
- DAO per table + a migration helper for future schema versions.
- Registered in `shared/di/injector.dart` as a lazy singleton alongside
  `AppConfig` / `TokenStorage` / `Dio`.

**Acceptance:** migrations run clean on cold start; DAOs cover the queries
BLoCs need; **no widget code touches Drift** (card acceptance — enforced at
review).

**Tests:** DAO tests against `NativeDatabase.memory()` — round-trip per table
plus the specific queries each future BLoC needs. Schema test asserting
`schemaVersion == 1` and that the `MigrationStrategy` is wired with a working
`onCreate`, so a cold start provably builds all 7 tables. No v1 → v2
migration test yet — there is no v2; the helper exists so E19 can add one
without restructuring.

## PR 3 — E15-F01-S03, email+password primary

Closes #12 #13 #14 #15 #16.

Already shipped: `AuthCubit` (`checkSession`, `signIn`, `signUp`, `signOut`,
`requestOtp`, `verifyOtp`, `resetToPhoneStep`), `SecureTokenStorage`, root
`BlocProvider`, sign-in/sign-up/welcome screens. `AuthStatus` already matches
the card's corrected set exactly: `unauthenticated`, `authenticating`,
`authenticated`, `otpSent`, `error`.

Remaining, honestly:

1. **Correct the card.** Goal + acceptance currently declare phone-OTP
   primary. Rewrite: email+password primary (mirrors web), phone OTP
   secondary. Record the reversal and its reason in Notes.
2. **Close test gaps.** `auth_cubit_test.dart` covers `checkSession` (3),
   `signIn` (2), `signOut` (1). Missing: `signUp`, `requestOtp`, `verifyOtp`.
3. **Login widget test** — the card requires one; none exists.

**Acceptance:** state set as above; token persists across restarts (test via
`SecureTokenStorage` round-trip); `bloc_test` covers every cubit method;
widget test on the login screen.

**Deliberately not done:** removing `AuthState.devCode`. It is dead
(documented "always empty since OTP is now handled server-side") but removing
it is unrelated churn in an auth PR. Note it for a later cleanup card.

## Error handling

- `AuthRepository` throws `OtpError(OtpErrorKind)` — cubit maps to
  `AuthStatus.error` + `errorMessage`. Preserve; do not swallow.
- Dio 401 already clears the token in the interceptor
  (`shared/network/api_client.dart`); re-auth stays deferred to presentation,
  as recorded in the E15-F01-S02 card Notes.
- Drift failures surface to the calling BLoC. No silent catch — a failed
  cache read must be distinguishable from an empty cache, or E19's
  offline-first resolution will read corruption as "not downloaded".

## Testing

| Story | Tests |
| --- | --- |
| S01 | golden of token demo, light + dark, via `golden_toolkit` + `loadAppFonts()` |
| S02 | DAO tests on `NativeDatabase.memory()`; migration-helper test |
| S03 | `bloc_test` per cubit method; login-screen widget test; token-persistence round-trip |

Every PR must show `flutter analyze` + `flutter test` clean before the
"done" claim.

## Out of scope — follow-up cards to file

1. **Port the issue-sync script to GitHub.** `scripts/seed-forgejo-issues.ts`
   targets a dead Forgejo host. Until ported, `pnpm issues:sync` / `:map` /
   `:lookup` are broken and CLAUDE.md documents them as working.
2. **Refresh `docs/design/DESIGN_BRIEF.md`.** Stale on every token path;
   actively misleads subagents.
3. **Remove `AuthState.devCode`.** Dead field kept "for schema stability".
4. **Dart token emitter drops font fallbacks.** `packages/design-tokens`
   flattens `'IBM Plex Sans', system-ui, …` to `"IBM Plex Sans"`. Harmless
   once fonts are bundled (PR 1), but the emitter still loses information the
   source token carries.
5. **Email OTP does not exist.** No backend `emailOTP()` plugin, no mail
   transport. `verifyEmail()` / `forgotPassword()` in `apps/web`'s auth store
   are `console.warn` stubs, and `useOtpInput` drives a sign-up verification
   flow whose endpoint was never built. Decide: build it (backend story) or
   remove the dead UI.
6. **Card/PRD drift is systemic.** E15-F01-S03 declared phone-OTP primary
   against a web that does email+password; DESIGN_BRIEF points at token paths
   that moved. Cards were generated once and the generator is never re-run.
   Worth a pass over the mobile cards before E17 scales the work up.
