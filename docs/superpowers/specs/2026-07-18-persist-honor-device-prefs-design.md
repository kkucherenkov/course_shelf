# Persist + honor device preferences & recent searches — design

**Date:** 2026-07-18
**Status:** Approved (brainstorm)
**Scope:** `apps/mobile` only. No spec/codegen impact, no backend, no i18n strings.

## Context

Two follow-ups surfaced during the E18 Stage-B work (PR #181) and were parked
in `specs/tasks/active.md`:

1. **Persist** the Settings tab's device preferences and the Search tab's
   recent searches — both are in-memory only today, explicitly `TODO(E18)`.
2. **Honor** those preferences app-wide — the Settings toggles are currently
   display-only; changing them changes nothing outside the Settings screen.

Ground truth in the code today:

- `SettingsState` (`features/settings/presentation/bloc/settings_state.dart`)
  holds 7 prefs — `theme`, `textSize`, `reduceMotion`, `autoplayNextLesson`,
  `playbackSpeed`, `subtitles`, `wifiOnlyDownloads` — all in-memory, and its
  own doc comment says persistence + honoring are follow-ups.
- `SearchCubit` keeps `recentSearches` in-memory, capped at 8, `TODO(E18)`.
- `SettingsCubit`/`SearchCubit` are provided **per-tab** in `main_shell.dart`
  (lines 103–116), so `SettingsCubit` is invisible above `MaterialApp`.
- `main.dart`'s `App` hard-codes `themeMode: ThemeMode.system`.
- `PlayerBloc` already fetches and holds the full course outline in
  `state.sections` and already computes `PlayerStatus.endOfLesson`
  (`player_bloc.dart:219`); its `state.speed` defaults to `1`. There is **no**
  autoplay-next-lesson behavior yet.
- `pubspec.yaml` already has `drift`, `drift_flutter`, `path_provider`,
  `flutter_secure_storage`. It does **not** have `shared_preferences`.

## Decisions

- **Storage backend: `shared_preferences`** (not a Drift KV table). Prefs and
  recents are scalar / small-list key-value data with no relational queries;
  `shared_preferences` is the idiomatic tool and keeps settings persistence
  decoupled from the Drift schema E19 will actively migrate. One small new dep.
- **Honor scope: chrome + full player.** Honor `theme`, `textSize`,
  `reduceMotion` (centralized in `main.dart`), `playbackSpeed` (player opens at
  the saved speed), and `autoplayNextLesson` (new behavior in `PlayerBloc`).
- **`subtitles` and `wifiOnlyDownloads` are persisted but left inert** — there
  is no real subtitle track to select, and `wifiOnlyDownloads` is consumed by
  E19's `DownloadsBloc`, which does not exist yet. Both get explicit comments.

## Goals

- Settings and recents survive app restart.
- Theme, text size, reduce-motion, playback speed, and autoplay-next take
  effect app-wide (including pushed routes such as player and course detail).

## Non-goals

- Honoring `subtitles` or `wifiOnlyDownloads` (no consumer yet).
- Cloud/account-level sync of preferences (device-local only).
- Any UI/UX redesign of the Settings or Search screens.
- Any new user-visible strings (no i18n changes).

## Design

### 1. Storage layer — `apps/mobile/lib/shared/preferences/`

Infrastructure (under `lib/shared`), so any feature may depend on it without
crossing feature boundaries.

- A single `SharedPreferences` instance is obtained once in `main()` before
  `runApp` and registered in `get_it` as a singleton. `configureDependencies()`
  (or a new `await bootstrapPreferences()`) gains the `await`.
- **`SettingsPreferencesStore`**
  - `SettingsState load()` — reads every key, falling back to the current
    `SettingsState` defaults for any missing key.
  - one setter per field (e.g. `Future<void> saveTheme(AppThemePreference)`),
    each writing a single namespaced key (`pref.theme`, `pref.textSize`, …).
  - convenience reads `double get playbackSpeed` / `bool get autoplayNextLesson`
    for `PlayerBloc`.
  - enums are stored by `.name` and parsed back defensively (unknown value →
    default), so a renamed/removed enum case can never crash `load()`.
- **`RecentSearchesStore`**
  - `List<String> read()` / `Future<void> write(List<String>)` under
    `search.recents` (JSON-encoded string list).

Reads are synchronous after the one-time async load, so cubits can seed their
initial state in their constructors — no loading flicker.

### 2. Cubit wiring

- **`SettingsCubit(this._store)`** — `super(_store.load())`; every mutator
  (`toggleReduceMotion`, `cycleTheme`, …) persists the changed field after
  `emit`.
- **`SearchCubit(this._repository, this._recentsStore)`** — seed
  `recentSearches` from `_recentsStore.read()` on construction; `_withRecent`,
  `clearRecent`, `removeRecent` persist the new list after `emit`. Search stays
  a per-tab provider — only its cubit gains persistence.

### 3. App-wide honor — `main.dart`

- Replace the single `BlocProvider<AuthCubit>` with a `MultiBlocProvider`
  providing `AuthCubit` **and** `SettingsCubit`, both above the `MaterialApp`'s
  Navigator (same reasoning as the existing `AuthCubit`-placement comment:
  pushed routes are children of the Navigator, not of `home:`).
- `App` reads `SettingsCubit` via `BlocBuilder`:
  - `themeMode` ← mapped from `state.theme`.
  - `MaterialApp.builder` wraps the child in a `MediaQuery` override:
    - `textScaler: TextScaler.linear(scale)` where scale ∈ {small 0.9,
      default 1.0, large 1.2} from `state.textSize`.
    - `disableAnimations: state.reduceMotion` — the platform a11y flag Flutter
      and Material honor broadly. App-owned custom animations get gated
      individually as they appear (none in scope here).
  - `builder` wraps the Navigator, so the overrides reach pushed routes too.
- **`main_shell.dart`** — the Settings tab drops its own
  `BlocProvider<SettingsCubit>` (lines ~114–116) and consumes the global
  instance from context.

### 4. Player honor — `PlayerBloc`

`PlayerBloc` gains a `SettingsPreferencesStore` dependency (constructor
injected via `get_it`).

- **Playback speed** — in `_load`, after `_playback.open(source)`, read
  `store.playbackSpeed`, `await _playback.setSpeed(saved)`, and seed
  `state.speed = saved` in the emitted state. Applies on every lesson open,
  including autoplay-advanced ones.
- **Autoplay next** — in `_onTicked`'s existing `endOfLesson` branch, after the
  forced progress flush: if `store.autoplayNextLesson` is `true` and
  `_nextLessonId()` returns a non-null id, advance to it and play; otherwise
  fall through to today's end-banner behavior (unchanged).
  - `String? _nextLessonId()` flattens `state.sections` (ordered by section
    `position`, then lesson `position`), finds the current `_lessonId`, and
    returns the next entry whose state is **not** `locked` — or `null` if the
    current lesson is last / the next is locked.
  - Advancing sets `_lessonId = next`, emits a `loading` state for the new
    lesson (so the screen doesn't linger on the finished one), reuses the load
    path (`await _load(emit)`), then `await _playback.play()` +
    `emit(status: playing)`.
- Reading the prefs **live** at the lesson boundary (not snapshotting at load)
  means a mid-session toggle takes effect on the next boundary.
- **No player UI change** — the screen already renders whatever `state.lesson`
  / `state.sections` provide.

### 5. DI (`shared/di/injector.dart`)

- `registerSingleton<SharedPreferences>(instance)` (from the async bootstrap).
- `registerLazySingleton<SettingsPreferencesStore>` /
  `registerLazySingleton<RecentSearchesStore>`.
- `SettingsCubit`, `SearchCubit`, `PlayerBloc` registrations gain the new deps.

## File change map

New:
- `lib/shared/preferences/settings_preferences_store.dart`
- `lib/shared/preferences/recent_searches_store.dart`
- tests under `test/shared/preferences/` and feature test additions

Modified:
- `lib/main.dart` — async prefs bootstrap, `MultiBlocProvider`, reactive
  `themeMode` + `MaterialApp.builder` MediaQuery override.
- `lib/app/main_shell.dart` — Settings tab consumes the global cubit.
- `lib/shared/di/injector.dart` — register prefs instance + stores + new deps.
- `lib/features/settings/presentation/bloc/settings_cubit.dart` — inject store,
  seed + persist. Update the stale in-memory doc comment.
- `lib/features/search/presentation/bloc/search_cubit.dart` — inject recents
  store, seed + persist. Update the stale `TODO(E18)` doc comment.
- `lib/features/player/presentation/bloc/player_bloc.dart` — inject store,
  apply saved speed, autoplay-next.
- `pubspec.yaml` — add `shared_preferences`.

## Testing

- **Stores** — round-trip with `SharedPreferences.setMockInitialValues`,
  including missing-key defaults and unknown-enum-value fallback.
- **`SettingsCubit`** — seeds from a stubbed store; each mutator persists.
- **`SearchCubit`** — seeds recents; add/clear/remove persist.
- **`App` widget test** — `themeMode` and text-scale track the cubit's state.
- **`PlayerBloc` bloc_test** — opens at the saved speed; autoplays the next
  non-locked lesson on completion when the pref is on; stays on the end banner
  at the last lesson, when the next is locked, or when the pref is off.
- Full mobile suite must stay green.

## Risks / open questions

- **`disableAnimations` reach** — it suppresses many implicit Material
  animations but not arbitrary custom ones. Acceptable: there are no app-owned
  custom animations in scope, and this is the standard platform lever.
- **Autoplay + sleep timer / offline** — autoplay advancing while a sleep timer
  fires: the sleep timer pauses on tick (`_onSleepTimerTicked`), which happens
  independently; advancing only triggers on `endOfLesson`, so the two don't
  race. Documented, covered by leaving the sleep-timer path untouched.

## Tracking

- Task-stack entry pushed to `specs/tasks/active.md` on kickoff.
- Follow-up GitHub issue for visibility created at implementation/PR time
  (no natural roadmap `E##-F##-S##` slot — this is post-E18 polish).
