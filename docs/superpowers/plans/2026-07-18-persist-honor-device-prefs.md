# Persist + Honor Device Preferences & Recent Searches — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist the Settings tab's device preferences and Search's recent searches, and honor theme / text size / reduce-motion / playback speed / autoplay-next app-wide.

**Architecture:** Add `shared_preferences`, wrap it in two thin typed stores under `lib/shared/preferences/`. Seed `SettingsCubit`/`SearchCubit` from the stores and persist on change. Lift `SettingsCubit` above `MaterialApp` so `App` drives `themeMode` + a `MediaQuery` override reactively. `PlayerBloc` reads a narrow `PlaybackPreferences` port to open at the saved speed and auto-advance to the next lesson on `endOfLesson`.

**Tech Stack:** Flutter 3.44, flutter_bloc, get_it, shared_preferences, bloc_test, mocktail, flutter_test.

## Global Constraints

- `apps/mobile` only. No `packages/specs` / OpenAPI change, no codegen, no backend.
- No new user-visible strings — **no i18n changes** (no `AppLocalizations`/slang keys added).
- Feature-first layering; state = `Equatable`; cubits guard async emits with `if (isClosed) return;`.
- DI via `get_it`; widgets resolve blocs through `BlocProvider(create: (_) => getIt<T>())` and **never** call `getIt<T>()` inside `build()`.
- Conventional Commits; **commit scope is `mobile`**. End every commit message with:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- Run all tests from `apps/mobile`: `cd apps/mobile && flutter test <path>`.
- Format/lint gate for Dart: `cd apps/mobile && dart format . && flutter analyze` (not pnpm/prettier — that's the TS toolchain).
- `shared_preferences` version: add `shared_preferences: ^2.3.2` to `apps/mobile/pubspec.yaml`.

## File Structure

New:
- `apps/mobile/lib/shared/preferences/playback_preferences.dart` — narrow read port `{ double playbackSpeed; bool autoplayNextLesson; }` the player depends on.
- `apps/mobile/lib/shared/preferences/settings_preferences_store.dart` — `SettingsPreferencesStore implements PlaybackPreferences`; `load()/save()` for all 7 prefs.
- `apps/mobile/lib/shared/preferences/recent_searches_store.dart` — `read()/write(List<String>)`.
- `apps/mobile/lib/app/theme_preferences.dart` — pure mappers `themeModeFrom`, `textScaleFrom`.
- Tests colocated under `apps/mobile/test/shared/preferences/` and `apps/mobile/test/app/`.

Modified:
- `pubspec.yaml`, `lib/main.dart`, `lib/app/main_shell.dart`, `lib/shared/di/injector.dart`,
  `lib/features/settings/presentation/bloc/settings_cubit.dart` (+ `settings_state.dart` doc comment),
  `lib/features/search/presentation/bloc/search_cubit.dart`,
  `lib/features/player/presentation/bloc/player_bloc.dart`,
  and the tests named in each task.

---

## Task 0: Kickoff — task-stack entry

- [ ] **Step 1: Push a task-stack entry** to `specs/tasks/active.md` (template in `specs/tasks/README.md`). Replace the "No active tasks" note with an entry `T-2026-07-18-004 — Persist + honor device prefs & recents`, listing the 5 implementation tasks as unchecked boxes and linking the spec `docs/superpowers/specs/2026-07-18-persist-honor-device-prefs-design.md`.

- [ ] **Step 2: Commit**

```bash
git add -f specs/tasks/active.md
git commit -m "chore(tasks): track persist+honor device prefs on the active stack

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 1: Storage layer — `shared_preferences` + two stores

**Files:**
- Modify: `apps/mobile/pubspec.yaml` (add dependency)
- Create: `apps/mobile/lib/shared/preferences/playback_preferences.dart`
- Create: `apps/mobile/lib/shared/preferences/settings_preferences_store.dart`
- Create: `apps/mobile/lib/shared/preferences/recent_searches_store.dart`
- Test: `apps/mobile/test/shared/preferences/settings_preferences_store_test.dart`
- Test: `apps/mobile/test/shared/preferences/recent_searches_store_test.dart`

**Interfaces:**
- Produces:
  - `abstract interface class PlaybackPreferences { double get playbackSpeed; bool get autoplayNextLesson; }`
  - `class SettingsPreferencesStore implements PlaybackPreferences` with `SettingsPreferencesStore(SharedPreferences prefs)`, `SettingsState load()`, `Future<void> save(SettingsState state)`.
  - `class RecentSearchesStore` with `RecentSearchesStore(SharedPreferences prefs)`, `List<String> read()`, `Future<void> write(List<String> terms)`.

- [ ] **Step 1: Add the dependency**

In `apps/mobile/pubspec.yaml`, under `dependencies:` (next to `path_provider: ^2.1.6`), add:

```yaml
  shared_preferences: ^2.3.2
```

Then:

```bash
cd apps/mobile && flutter pub get
```

Expected: resolves, no version conflict.

- [ ] **Step 2: Write the failing store tests**

Create `apps/mobile/test/shared/preferences/settings_preferences_store_test.dart`:

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:app_mobile/features/settings/presentation/bloc/settings_state.dart';
import 'package:app_mobile/shared/preferences/settings_preferences_store.dart';

Future<SettingsPreferencesStore> storeWith(Map<String, Object> seed) async {
  SharedPreferences.setMockInitialValues(seed);
  return SettingsPreferencesStore(await SharedPreferences.getInstance());
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('load() returns SettingsState defaults when nothing is stored', () async {
    final store = await storeWith(<String, Object>{});
    expect(store.load(), const SettingsState());
  });

  test('save() then load() round-trips every field', () async {
    final store = await storeWith(<String, Object>{});
    const saved = SettingsState(
      theme: AppThemePreference.dark,
      textSize: TextSizePreference.large,
      reduceMotion: true,
      autoplayNextLesson: false,
      playbackSpeed: 1.5,
      subtitles: SubtitlesPreference.english,
      wifiOnlyDownloads: false,
    );
    await store.save(saved);
    expect(store.load(), saved);
  });

  test('load() falls back to defaults for an unknown enum value', () async {
    final store = await storeWith(<String, Object>{'pref.theme': 'ultraviolet'});
    expect(store.load().theme, AppThemePreference.system);
  });

  test('PlaybackPreferences getters read the stored playback fields', () async {
    final store = await storeWith(<String, Object>{
      'pref.playbackSpeed': 1.25,
      'pref.autoplayNextLesson': false,
    });
    expect(store.playbackSpeed, 1.25);
    expect(store.autoplayNextLesson, isFalse);
  });

  test('PlaybackPreferences getters use defaults when unset', () async {
    final store = await storeWith(<String, Object>{});
    expect(store.playbackSpeed, 1.0);
    expect(store.autoplayNextLesson, isTrue);
  });
}
```

Create `apps/mobile/test/shared/preferences/recent_searches_store_test.dart`:

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:app_mobile/shared/preferences/recent_searches_store.dart';

Future<RecentSearchesStore> storeWith(Map<String, Object> seed) async {
  SharedPreferences.setMockInitialValues(seed);
  return RecentSearchesStore(await SharedPreferences.getInstance());
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('read() is empty when nothing is stored', () async {
    final store = await storeWith(<String, Object>{});
    expect(store.read(), isEmpty);
  });

  test('write() then read() round-trips, preserving order', () async {
    final store = await storeWith(<String, Object>{});
    await store.write(<String>['replication', 'raft', 'paxos']);
    expect(store.read(), <String>['replication', 'raft', 'paxos']);
  });
}
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `cd apps/mobile && flutter test test/shared/preferences/`
Expected: FAIL — `Target of URI doesn't exist` (stores not created yet).

- [ ] **Step 4: Create the playback port**

Create `apps/mobile/lib/shared/preferences/playback_preferences.dart`:

```dart
/// The narrow slice of device preferences the player reads.
///
/// `PlayerBloc` depends on this — not on the whole [SettingsPreferencesStore] —
/// so the player is coupled only to the two values it actually consumes
/// (interface-segregation), and its test fake implements just these getters.
abstract interface class PlaybackPreferences {
  /// The saved playback rate a lesson opens at (defaults to `1.0`).
  double get playbackSpeed;

  /// Whether finishing a lesson auto-advances to the next one (defaults `true`).
  bool get autoplayNextLesson;
}
```

- [ ] **Step 5: Create the settings store**

Create `apps/mobile/lib/shared/preferences/settings_preferences_store.dart`:

```dart
import 'package:shared_preferences/shared_preferences.dart';

import 'package:app_mobile/features/settings/presentation/bloc/settings_state.dart';
import 'package:app_mobile/shared/preferences/playback_preferences.dart';

/// Device-local persistence for the Settings tab's preferences.
///
/// Scalar key-value data with no relational shape, so `shared_preferences`
/// rather than the Drift schema E19 migrates. Enums are stored by `.name` and
/// parsed back defensively: an unknown/renamed value falls back to the
/// [SettingsState] default rather than throwing out of [load].
class SettingsPreferencesStore implements PlaybackPreferences {
  SettingsPreferencesStore(this._prefs);

  final SharedPreferences _prefs;

  static const String _themeKey = 'pref.theme';
  static const String _textSizeKey = 'pref.textSize';
  static const String _reduceMotionKey = 'pref.reduceMotion';
  static const String _autoplayKey = 'pref.autoplayNextLesson';
  static const String _speedKey = 'pref.playbackSpeed';
  static const String _subtitlesKey = 'pref.subtitles';
  static const String _wifiOnlyKey = 'pref.wifiOnlyDownloads';

  SettingsState load() {
    const defaults = SettingsState();
    return SettingsState(
      theme: _enum(AppThemePreference.values, _prefs.getString(_themeKey), defaults.theme),
      textSize: _enum(TextSizePreference.values, _prefs.getString(_textSizeKey), defaults.textSize),
      reduceMotion: _prefs.getBool(_reduceMotionKey) ?? defaults.reduceMotion,
      autoplayNextLesson: _prefs.getBool(_autoplayKey) ?? defaults.autoplayNextLesson,
      playbackSpeed: _prefs.getDouble(_speedKey) ?? defaults.playbackSpeed,
      subtitles: _enum(SubtitlesPreference.values, _prefs.getString(_subtitlesKey), defaults.subtitles),
      wifiOnlyDownloads: _prefs.getBool(_wifiOnlyKey) ?? defaults.wifiOnlyDownloads,
    );
  }

  Future<void> save(SettingsState state) async {
    await _prefs.setString(_themeKey, state.theme.name);
    await _prefs.setString(_textSizeKey, state.textSize.name);
    await _prefs.setBool(_reduceMotionKey, state.reduceMotion);
    await _prefs.setBool(_autoplayKey, state.autoplayNextLesson);
    await _prefs.setDouble(_speedKey, state.playbackSpeed);
    await _prefs.setString(_subtitlesKey, state.subtitles.name);
    await _prefs.setBool(_wifiOnlyKey, state.wifiOnlyDownloads);
  }

  @override
  double get playbackSpeed =>
      _prefs.getDouble(_speedKey) ?? const SettingsState().playbackSpeed;

  @override
  bool get autoplayNextLesson =>
      _prefs.getBool(_autoplayKey) ?? const SettingsState().autoplayNextLesson;

  /// Parses [name] against [values] by `.name`, falling back to [fallback] for
  /// null or any value not in the enum.
  static T _enum<T extends Enum>(List<T> values, String? name, T fallback) {
    if (name == null) return fallback;
    for (final value in values) {
      if (value.name == name) return value;
    }
    return fallback;
  }
}
```

- [ ] **Step 6: Create the recents store**

Create `apps/mobile/lib/shared/preferences/recent_searches_store.dart`:

```dart
import 'package:shared_preferences/shared_preferences.dart';

/// Device-local persistence for the Search tab's recent-search terms.
///
/// A plain ordered string list (most-recent-first is the caller's concern), so
/// `getStringList`/`setStringList` — no JSON.
class RecentSearchesStore {
  RecentSearchesStore(this._prefs);

  final SharedPreferences _prefs;

  static const String _key = 'search.recents';

  List<String> read() => _prefs.getStringList(_key) ?? const <String>[];

  Future<void> write(List<String> terms) => _prefs.setStringList(_key, terms);
}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `cd apps/mobile && flutter test test/shared/preferences/`
Expected: PASS (7 tests).

- [ ] **Step 8: Commit**

```bash
git add apps/mobile/pubspec.yaml apps/mobile/pubspec.lock \
  apps/mobile/lib/shared/preferences/ apps/mobile/test/shared/preferences/
git commit -m "feat(mobile): shared_preferences stores for device prefs + recents

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Persist `SettingsCubit`

**Files:**
- Modify: `apps/mobile/lib/features/settings/presentation/bloc/settings_cubit.dart`
- Modify: `apps/mobile/lib/features/settings/presentation/bloc/settings_state.dart:19-25` (doc comment only)
- Test: `apps/mobile/test/features/settings/settings_cubit_test.dart`

**Interfaces:**
- Consumes: `SettingsPreferencesStore` (Task 1).
- Produces: `SettingsCubit(SettingsPreferencesStore store)` — seeds from `store.load()`, persists every change via `onChange`.

- [ ] **Step 1: Rewrite the failing test**

Replace `apps/mobile/test/features/settings/settings_cubit_test.dart` entirely:

```dart
import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:app_mobile/features/settings/presentation/bloc/settings_cubit.dart';
import 'package:app_mobile/features/settings/presentation/bloc/settings_state.dart';
import 'package:app_mobile/shared/preferences/settings_preferences_store.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late SettingsPreferencesStore store;

  Future<void> seed(Map<String, Object> values) async {
    SharedPreferences.setMockInitialValues(values);
    store = SettingsPreferencesStore(await SharedPreferences.getInstance());
  }

  setUp(() => seed(<String, Object>{}));

  SettingsCubit build() => SettingsCubit(store);

  test('starts from the store — defaults when empty', () async {
    expect(build().state, const SettingsState());
  });

  test('seeds initial state from previously persisted values', () async {
    await seed(<String, Object>{'pref.theme': 'dark', 'pref.reduceMotion': true});
    final cubit = build();
    expect(cubit.state.theme, AppThemePreference.dark);
    expect(cubit.state.reduceMotion, isTrue);
  });

  test('a mutation is written back to the store', () async {
    final cubit = build();
    cubit.cycleTheme(); // system -> light
    await Future<void>.delayed(Duration.zero); // let the async save settle
    expect(store.load().theme, AppThemePreference.light);
  });

  group('toggles flip in place and leave everything else untouched', () {
    blocTest<SettingsCubit, SettingsState>(
      'toggleReduceMotion',
      build: build,
      act: (cubit) => cubit.toggleReduceMotion(),
      expect: () => <SettingsState>[const SettingsState(reduceMotion: true)],
    );

    blocTest<SettingsCubit, SettingsState>(
      'toggleAutoplayNextLesson',
      build: build,
      act: (cubit) => cubit.toggleAutoplayNextLesson(),
      expect: () => <SettingsState>[const SettingsState(autoplayNextLesson: false)],
    );

    blocTest<SettingsCubit, SettingsState>(
      'toggleWifiOnlyDownloads',
      build: build,
      act: (cubit) => cubit.toggleWifiOnlyDownloads(),
      expect: () => <SettingsState>[const SettingsState(wifiOnlyDownloads: false)],
    );
  });

  group('value rows cycle through their allowed values', () {
    blocTest<SettingsCubit, SettingsState>(
      'cycleTheme walks system -> light -> dark -> system',
      build: build,
      act: (cubit) {
        cubit.cycleTheme();
        cubit.cycleTheme();
        cubit.cycleTheme();
      },
      expect: () => <SettingsState>[
        const SettingsState(theme: AppThemePreference.light),
        const SettingsState(theme: AppThemePreference.dark),
        const SettingsState(),
      ],
    );

    blocTest<SettingsCubit, SettingsState>(
      'cyclePlaybackSpeed walks the player speed ramp and wraps around',
      build: build,
      act: (cubit) {
        for (var i = 0; i < SettingsCubit.speeds.length; i++) {
          cubit.cyclePlaybackSpeed();
        }
      },
      expect: () => <SettingsState>[
        const SettingsState(playbackSpeed: 1.25),
        const SettingsState(playbackSpeed: 1.5),
        const SettingsState(playbackSpeed: 2),
        const SettingsState(playbackSpeed: 0.75),
        const SettingsState(),
      ],
    );
  });
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/mobile && flutter test test/features/settings/settings_cubit_test.dart`
Expected: FAIL — `SettingsCubit` has no positional-arg constructor.

- [ ] **Step 3: Wire the store into the cubit**

In `apps/mobile/lib/features/settings/presentation/bloc/settings_cubit.dart`, replace the imports/constructor region:

```dart
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/features/settings/presentation/bloc/settings_state.dart';
import 'package:app_mobile/shared/preferences/settings_preferences_store.dart';

/// Owns the Settings tab's device Appearance/Playback preferences, seeded from
/// and persisted to [SettingsPreferencesStore]. Every state change is written
/// back through [onChange], so individual mutators stay one-liners.
class SettingsCubit extends Cubit<SettingsState> {
  SettingsCubit(this._store) : super(_store.load());

  final SettingsPreferencesStore _store;

  @override
  void onChange(Change<SettingsState> change) {
    super.onChange(change);
    // Best-effort, fire-and-forget: a failed disk write must never break a
    // toggle. onChange does not fire for the seeded initial state.
    _store.save(change.nextState);
  }

  /// Cycle stops for [cyclePlaybackSpeed] — mirrors the player's own speed
  /// picker range.
  static const List<double> speeds = <double>[0.75, 1, 1.25, 1.5, 2];
```

Leave every mutator method (`toggleReduceMotion`, `cycleTheme`, …) exactly as-is.

- [ ] **Step 4: Update the stale state doc comment**

In `apps/mobile/lib/features/settings/presentation/bloc/settings_state.dart`, replace lines 19-25 (the "In-memory only … TODO(E18): persist …" block) with:

```dart
/// Persisted device-local via `SettingsPreferencesStore`. `theme`, `textSize`,
/// `reduceMotion` are honoured app-wide in `App`; `playbackSpeed` and
/// `autoplayNextLesson` are honoured by `PlayerBloc`. `subtitles` (no real
/// subtitle track yet) and `wifiOnlyDownloads` (consumed by E19's
/// `DownloadsBloc`) are persisted but not yet honoured anywhere.
```

Also update the two per-field caveats above (`AppThemePreference` "honouring this value app-wide is a follow-up." and `TextSizePreference` "Display-only, same caveat") — drop the "follow-up"/"Display-only" wording since they are now honoured.

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd apps/mobile && flutter test test/features/settings/settings_cubit_test.dart`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/lib/features/settings/ apps/mobile/test/features/settings/settings_cubit_test.dart
git commit -m "feat(mobile): persist Settings device prefs via the store

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Persist `SearchCubit` recents

**Files:**
- Modify: `apps/mobile/lib/features/search/presentation/bloc/search_cubit.dart`
- Test: `apps/mobile/test/features/search/search_cubit_test.dart`

**Interfaces:**
- Consumes: `RecentSearchesStore` (Task 1), existing `SearchRepository`.
- Produces: `SearchCubit(SearchRepository repository, RecentSearchesStore recentsStore)` — seeds recents from the store, persists when the recents list changes.

- [ ] **Step 1: Add failing tests for seed + persist**

In `apps/mobile/test/features/search/search_cubit_test.dart`, update the mock/harness. The existing file constructs `SearchCubit(repository)`; every construction site must pass a recents store. Add near the top mocks:

```dart
import 'package:shared_preferences/shared_preferences.dart';
import 'package:app_mobile/shared/preferences/recent_searches_store.dart';
```

In `main()`, add before the existing groups:

```dart
  TestWidgetsFlutterBinding.ensureInitialized();

  late RecentSearchesStore recentsStore;

  Future<void> seedRecents(List<String> terms) async {
    SharedPreferences.setMockInitialValues(<String, Object>{
      if (terms.isNotEmpty) 'search.recents': terms,
    });
    recentsStore = RecentSearchesStore(await SharedPreferences.getInstance());
  }
```

Ensure the `setUp` seeds an empty store: add `setUp(() => seedRecents(<String>[]));` (keep any existing setUp body). Change every `SearchCubit(<repo>)` construction in this file to `SearchCubit(<repo>, recentsStore)` — including inside `build:` callbacks of `blocTest`.

Add these two tests inside `main()`:

```dart
  test('seeds recentSearches from the store on construction', () async {
    final repository = _MockSearchRepository();
    await seedRecents(<String>['replication', 'raft']);
    final cubit = SearchCubit(repository, recentsStore);
    expect(cubit.state.recentSearches, <String>['replication', 'raft']);
  });

  test('a successful search persists the new recents list', () async {
    final repository = _MockSearchRepository();
    when(() => repository.search('raft', limit: 20))
        .thenAnswer((_) async => _populated);
    final cubit = SearchCubit(repository, recentsStore);

    await cubit.searchRecent('raft');
    await Future<void>.delayed(Duration.zero); // let the async write settle

    expect(recentsStore.read(), contains('raft'));
  });
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd apps/mobile && flutter test test/features/search/search_cubit_test.dart`
Expected: FAIL — `SearchCubit` takes one positional arg.

- [ ] **Step 3: Wire the recents store into the cubit**

In `apps/mobile/lib/features/search/presentation/bloc/search_cubit.dart`:

Replace the imports + constructor + fields region:

```dart
import 'dart:async';

import 'package:flutter/foundation.dart' show listEquals;
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/features/search/domain/search_repository.dart';
import 'package:app_mobile/features/search/presentation/bloc/search_state.dart';
import 'package:app_mobile/shared/preferences/recent_searches_store.dart';

/// Drives the Search tab through Recent | Loading | Results | Empty | Failed.
///
/// Recent searches are seeded from and persisted to [RecentSearchesStore]
/// (device-local). They change on a successful search and on explicit
/// clear/remove.
class SearchCubit extends Cubit<SearchState> {
  SearchCubit(this._repository, RecentSearchesStore recentsStore)
    : _recentsStore = recentsStore,
      super(SearchState(recentSearches: recentsStore.read()));

  final SearchRepository _repository;
  final RecentSearchesStore _recentsStore;

  @override
  void onChange(Change<SearchState> change) {
    super.onChange(change);
    // Persist only when the recents list actually changed — not on every
    // keystroke-driven status/query emit.
    final List<String> next = change.nextState.recentSearches;
    if (!listEquals(next, change.currentState.recentSearches)) {
      _recentsStore.write(next);
    }
  }
```

Leave `_minQueryLength`, `_maxRecents`, `_debounce`, and every method below unchanged.

- [ ] **Step 4: Run to verify it passes**

Run: `cd apps/mobile && flutter test test/features/search/search_cubit_test.dart`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/lib/features/search/ apps/mobile/test/features/search/search_cubit_test.dart
git commit -m "feat(mobile): persist recent searches via the store

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: DI bootstrap + lift Settings above `MaterialApp` + honor chrome prefs

**Files:**
- Create: `apps/mobile/lib/app/theme_preferences.dart`
- Modify: `apps/mobile/lib/shared/di/injector.dart`
- Modify: `apps/mobile/lib/main.dart`
- Modify: `apps/mobile/lib/app/main_shell.dart`
- Modify: `apps/mobile/test/app/main_shell_test.dart`
- Test: `apps/mobile/test/app/theme_preferences_test.dart`
- Test: `apps/mobile/test/app/app_theme_test.dart`

**Interfaces:**
- Consumes: `SettingsPreferencesStore`, `RecentSearchesStore` (Task 1); `SettingsCubit(store)` (Task 2); `SearchCubit(repo, store)` (Task 3).
- Produces:
  - `ThemeMode themeModeFrom(AppThemePreference)`; `double textScaleFrom(TextSizePreference)`.
  - `Future<void> bootstrapPreferences()` in `injector.dart` — registers `SharedPreferences`, `SettingsPreferencesStore`, `PlaybackPreferences`, `RecentSearchesStore`.
  - `App` provides `SettingsCubit` above `MaterialApp` and drives `themeMode` + a `MediaQuery` override.

- [ ] **Step 1: Write the failing pure-mapper test**

Create `apps/mobile/test/app/theme_preferences_test.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/app/theme_preferences.dart';
import 'package:app_mobile/features/settings/presentation/bloc/settings_state.dart';

void main() {
  test('themeModeFrom maps each preference', () {
    expect(themeModeFrom(AppThemePreference.system), ThemeMode.system);
    expect(themeModeFrom(AppThemePreference.light), ThemeMode.light);
    expect(themeModeFrom(AppThemePreference.dark), ThemeMode.dark);
  });

  test('textScaleFrom maps each preference', () {
    expect(textScaleFrom(TextSizePreference.small), 0.9);
    expect(textScaleFrom(TextSizePreference.defaultSize), 1.0);
    expect(textScaleFrom(TextSizePreference.large), 1.2);
  });
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd apps/mobile && flutter test test/app/theme_preferences_test.dart`
Expected: FAIL — URI does not exist.

- [ ] **Step 3: Create the pure mappers**

Create `apps/mobile/lib/app/theme_preferences.dart`:

```dart
import 'package:flutter/material.dart';

import 'package:app_mobile/features/settings/presentation/bloc/settings_state.dart';

/// Maps the stored appearance preference to Flutter's [ThemeMode].
ThemeMode themeModeFrom(AppThemePreference pref) => switch (pref) {
  AppThemePreference.system => ThemeMode.system,
  AppThemePreference.light => ThemeMode.light,
  AppThemePreference.dark => ThemeMode.dark,
};

/// Text-scale factor for [TextSizePreference]; `1.0` is the platform default.
double textScaleFrom(TextSizePreference pref) => switch (pref) {
  TextSizePreference.small => 0.9,
  TextSizePreference.defaultSize => 1.0,
  TextSizePreference.large => 1.2,
};
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd apps/mobile && flutter test test/app/theme_preferences_test.dart`
Expected: PASS.

- [ ] **Step 5: Add the prefs bootstrap + update factories in the injector**

In `apps/mobile/lib/shared/di/injector.dart`:

Add imports (with the other `package:app_mobile/...` imports, and `shared_preferences`):

```dart
import 'package:shared_preferences/shared_preferences.dart';

import 'package:app_mobile/shared/preferences/playback_preferences.dart';
import 'package:app_mobile/shared/preferences/recent_searches_store.dart';
import 'package:app_mobile/shared/preferences/settings_preferences_store.dart';
```

Change the `SettingsCubit`, `SearchCubit`, and `PlayerBloc` factory registrations to:

```dart
    ..registerFactory<SearchCubit>(
      () => SearchCubit(getIt<SearchRepository>(), getIt<RecentSearchesStore>()),
    )
    ..registerFactory<SettingsCubit>(
      () => SettingsCubit(getIt<SettingsPreferencesStore>()),
    )
    // A factory, and a fresh VideoPlayerAdapter per instance: the adapter owns
    // a platform controller that PlayerBloc.close() disposes, so a shared
    // singleton would hand the next lesson a disposed engine.
    ..registerFactory<PlayerBloc>(
      () => PlayerBloc(
        repository: getIt<LessonPlayerRepository>(),
        progressRecorder: getIt<LessonProgressRecorder>(),
        playback: VideoPlayerAdapter(),
        playbackPreferences: getIt<PlaybackPreferences>(),
      ),
    );
```

Add a new top-level function after `configureDependencies()` (before `resetInjector`):

```dart
/// Registers `shared_preferences` and its stores. Async because
/// `SharedPreferences.getInstance()` is — call with `await` after
/// [configureDependencies] and before `runApp`.
Future<void> bootstrapPreferences() async {
  if (getIt.isRegistered<SharedPreferences>()) return;
  final SharedPreferences prefs = await SharedPreferences.getInstance();
  getIt
    ..registerSingleton<SharedPreferences>(prefs)
    ..registerLazySingleton<SettingsPreferencesStore>(
      () => SettingsPreferencesStore(getIt<SharedPreferences>()),
    )
    ..registerLazySingleton<PlaybackPreferences>(
      () => getIt<SettingsPreferencesStore>(),
    )
    ..registerLazySingleton<RecentSearchesStore>(
      () => RecentSearchesStore(getIt<SharedPreferences>()),
    );
}
```

- [ ] **Step 6: Await the bootstrap in `main()`**

In `apps/mobile/lib/main.dart`, in `main()`, change the DI line:

```dart
  configureDependencies();
```

to:

```dart
  configureDependencies();
  await bootstrapPreferences();
```

- [ ] **Step 7: Lift `SettingsCubit` above `MaterialApp` and honor chrome prefs**

In `apps/mobile/lib/main.dart`, add imports:

```dart
import 'package:app_mobile/app/theme_preferences.dart';
import 'package:app_mobile/features/settings/presentation/bloc/settings_cubit.dart';
import 'package:app_mobile/features/settings/presentation/bloc/settings_state.dart';
```

Replace the `App.build` body (the `return BlocProvider<AuthCubit>( … );` block) with:

```dart
    // AuthCubit and SettingsCubit are provided ABOVE the MaterialApp on
    // purpose: pushed routes are children of the MaterialApp's Navigator, not
    // of `home:`, so a provider inside AuthGate would be invisible to
    // /sign-up — and the SettingsCubit that drives themeMode / text scale must
    // be the same instance the Settings tab mutates.
    return MultiBlocProvider(
      providers: <BlocProvider<dynamic>>[
        BlocProvider<AuthCubit>(
          create: (_) => getIt<AuthCubit>()..checkSession(),
        ),
        BlocProvider<SettingsCubit>(create: (_) => getIt<SettingsCubit>()),
      ],
      child: BlocBuilder<SettingsCubit, SettingsState>(
        builder: (context, settings) => MaterialApp(
          onGenerateTitle: (context) => context.t.common.appTitle,
          theme: AppTheme.light(),
          darkTheme: AppTheme.dark(),
          themeMode: themeModeFrom(settings.theme),
          locale: TranslationProvider.of(context).flutterLocale,
          supportedLocales: AppLocaleUtils.supportedLocales,
          localizationsDelegates: GlobalMaterialLocalizations.delegates,
          // Wraps the Navigator, so text scale + reduce-motion reach pushed
          // routes (player, course detail) too — not just `home:`.
          builder: (context, child) => MediaQuery(
            data: MediaQuery.of(context).copyWith(
              textScaler: TextScaler.linear(textScaleFrom(settings.textSize)),
              disableAnimations: settings.reduceMotion,
            ),
            child: child!,
          ),
          home: const AuthGate(),
          onGenerateRoute: onGenerateRoute,
        ),
      ),
    );
```

- [ ] **Step 8: Consume the global cubit in `main_shell`**

In `apps/mobile/lib/app/main_shell.dart`:
- Remove the `import '...settings/presentation/bloc/settings_cubit.dart';` line (no longer referenced here).
- Replace the Settings tab body (the `BlocProvider<SettingsCubit>( … )` wrapper, ~lines 115-118) with:

```dart
          // SettingsCubit is provided once, above MaterialApp in `App`, because
          // it also drives themeMode / text scale; the tab reads that same
          // ambient instance.
          body: const SettingsTabBody(),
```

- [ ] **Step 9: Update `main_shell_test` for the lifted cubit**

In `apps/mobile/test/app/main_shell_test.dart`:

Add imports:

```dart
import 'package:shared_preferences/shared_preferences.dart';
import 'package:app_mobile/shared/preferences/recent_searches_store.dart';
import 'package:app_mobile/shared/preferences/settings_preferences_store.dart';
```

In the `setUp(() async { … })`, immediately after `await resetInjector();` add:

```dart
    SharedPreferences.setMockInitialValues(<String, Object>{});
    final prefs = await SharedPreferences.getInstance();
```

Change the `getIt` registration block: register the prefs stores and update the `SettingsCubit`/`SearchCubit` factories:

```dart
    getIt
      ..registerSingleton<SharedPreferences>(prefs)
      ..registerLazySingleton<SettingsPreferencesStore>(
        () => SettingsPreferencesStore(getIt<SharedPreferences>()),
      )
      ..registerLazySingleton<RecentSearchesStore>(
        () => RecentSearchesStore(getIt<SharedPreferences>()),
      )
      ..registerFactory<AuthCubit>(() => AuthCubit(repository))
      ..registerLazySingleton<InstanceRepository>(() => instanceRepository)
      ..registerFactory<HomeCubit>(() => HomeCubit(homeRepository))
      ..registerFactory<SearchCubit>(
        () => SearchCubit(_MockSearchRepository(), getIt<RecentSearchesStore>()),
      )
      ..registerFactory<BrowseCubit>(() => BrowseCubit(browseRepository))
      ..registerFactory<SettingsCubit>(
        () => SettingsCubit(getIt<SettingsPreferencesStore>()),
      );
```

- [ ] **Step 10: Write the App-honors-prefs widget test**

Create `apps/mobile/test/app/app_theme_test.dart`:

```dart
import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:app_mobile/features/auth/domain/auth_repository.dart';
import 'package:app_mobile/features/auth/domain/auth_user.dart';
import 'package:app_mobile/features/auth/domain/instance_config.dart';
import 'package:app_mobile/features/auth/domain/instance_repository.dart';
import 'package:app_mobile/features/auth/presentation/bloc/auth_cubit.dart';
import 'package:app_mobile/features/auth/presentation/sign_in_screen.dart';
import 'package:app_mobile/features/settings/presentation/bloc/settings_cubit.dart';
import 'package:app_mobile/main.dart';
import 'package:app_mobile/shared/di/injector.dart';
import 'package:app_mobile/shared/preferences/settings_preferences_store.dart';

class _MockAuthRepository extends Mock implements AuthRepository {}

class _MockInstanceRepository extends Mock implements InstanceRepository {}

Widget _harness() => TranslationProvider(child: const App());

void main() {
  setUp(() async {
    await resetInjector();

    final auth = _MockAuthRepository();
    when(() => auth.getSession()).thenAnswer((_) async => null); // stay on sign-in

    final instance = _MockInstanceRepository();
    when(() => instance.getInstanceConfig())
        .thenAnswer((_) async => InstanceConfig.defaults);
    when(() => instance.hasUsers()).thenAnswer((_) async => true);

    SharedPreferences.setMockInitialValues(<String, Object>{
      'pref.theme': 'dark',
      'pref.textSize': 'large',
      'pref.reduceMotion': true,
    });
    final prefs = await SharedPreferences.getInstance();

    getIt
      ..registerSingleton<SharedPreferences>(prefs)
      ..registerLazySingleton<SettingsPreferencesStore>(
        () => SettingsPreferencesStore(getIt<SharedPreferences>()),
      )
      ..registerFactory<AuthCubit>(() => AuthCubit(auth))
      ..registerLazySingleton<InstanceRepository>(() => instance)
      ..registerFactory<SettingsCubit>(
        () => SettingsCubit(getIt<SettingsPreferencesStore>()),
      );
  });

  tearDown(resetInjector);

  testWidgets('App honours persisted theme, text scale, and reduce-motion', (
    tester,
  ) async {
    await tester.pumpWidget(_harness());
    await tester.pumpAndSettle();

    // Lands on sign-in (unauthenticated), and the MaterialApp reflects the
    // persisted dark theme.
    expect(find.byType(SignInScreen), findsOneWidget);
    expect(
      tester.widget<MaterialApp>(find.byType(MaterialApp)).themeMode,
      ThemeMode.dark,
    );

    // The builder's MediaQuery override reaches the route: large = 1.2x,
    // reduce-motion true.
    final ctx = tester.element(find.byType(SignInScreen));
    expect(MediaQuery.textScalerOf(ctx).scale(10), 12); // 10 * 1.2
    expect(MediaQuery.of(ctx).disableAnimations, isTrue);
  });
}
```

- [ ] **Step 11: Run the affected tests**

Run: `cd apps/mobile && flutter test test/app/ test/app/main_shell_test.dart`
Expected: PASS (theme_preferences, app_theme, main_shell all green).

- [ ] **Step 12: Commit**

```bash
git add apps/mobile/lib/main.dart apps/mobile/lib/app/ apps/mobile/lib/shared/di/injector.dart \
  apps/mobile/test/app/
git commit -m "feat(mobile): honor theme, text size, reduce-motion app-wide

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Player honors playback speed + autoplay-next

**Files:**
- Modify: `apps/mobile/lib/features/player/presentation/bloc/player_bloc.dart`
- Modify: `apps/mobile/test/features/player/player_fakes.dart`
- Modify: `apps/mobile/test/features/player/player_bloc_test.dart`
- Modify: `apps/mobile/test/features/player/lesson_player_screen_test.dart`

**Interfaces:**
- Consumes: `PlaybackPreferences` (Task 1), registered in DI (Task 4).
- Produces: `PlayerBloc` gains a required `PlaybackPreferences playbackPreferences` constructor param; opens each lesson at `playbackPreferences.playbackSpeed`; on `endOfLesson`, if `playbackPreferences.autoplayNextLesson`, auto-advances to the next non-locked lesson.

- [ ] **Step 1: Add the fake + per-id lessons to `player_fakes.dart`**

In `apps/mobile/test/features/player/player_fakes.dart`:

Add the import:

```dart
import 'package:app_mobile/shared/preferences/playback_preferences.dart';
```

Add a fake class (after `FakeVideoPlaybackPort`):

```dart
/// A settable [PlaybackPreferences] for player tests.
class FakePlaybackPreferences implements PlaybackPreferences {
  FakePlaybackPreferences({this.playbackSpeed = 1, this.autoplayNextLesson = false});

  @override
  double playbackSpeed;

  @override
  bool autoplayNextLesson;
}
```

Extend `FakeLessonPlayerRepository` to serve different lessons per id. Add a field and change `fetchLesson`:

```dart
  /// When set, [fetchLesson] returns the mapped lesson for a given id (falling
  /// back to [lesson]); lets an autoplay test hand out distinct next lessons.
  Map<String, LessonPlayback>? lessonsById;
```

```dart
  @override
  Future<LessonPlayback> fetchLesson(String lessonId) async {
    if (lessonError != null) throw lessonError!;
    return lessonsById?[lessonId] ?? lesson;
  }
```

- [ ] **Step 2: Update both player tests' bloc builders + add the failing behavior tests**

In `apps/mobile/test/features/player/player_bloc_test.dart`:

Add imports:

```dart
import 'package:app_mobile/features/player/domain/lesson_playback.dart' show LessonOutlineEntry, LessonOutlineEntryState, LessonOutlineSection;
```
(The file already imports `lesson_playback.dart`; if so, skip the duplicate — you only need `LessonOutlineEntry`, `LessonOutlineEntryState`, `LessonOutlineSection` visible.)

Add a `prefs` fixture and thread it through `build()`:

```dart
  late FakePlaybackPreferences prefs;
```

In `setUp`, add: `prefs = FakePlaybackPreferences();`

Change `build()`:

```dart
  PlayerBloc build() => PlayerBloc(
    repository: repository,
    progressRecorder: recorder,
    playback: playback,
    playbackPreferences: prefs,
    now: () => clock,
  );
```

Add a new group at the end of `main()`:

```dart
  group('device preferences', () {
    blocTest<PlayerBloc, PlayerState>(
      'opens the lesson at the saved playback speed',
      build: build,
      setUp: () => prefs.playbackSpeed = 1.5,
      act: (bloc) => bloc.add(const PlayerStarted('lesson-1')),
      verify: (bloc) {
        expect(bloc.state.speed, 1.5);
        expect(playback.calls, contains('setSpeed:1.5'));
      },
    );

    // A two-lesson course so there is a next lesson to advance to.
    void seedTwoLessons() {
      repository.lessonsById = <String, LessonPlayback>{
        'lesson-1': fakeLesson,
        'lesson-2': const LessonPlayback(
          id: 'lesson-2',
          courseId: 'course-1',
          sectionId: 'section-1',
          title: 'Quorum reads',
          duration: Duration(minutes: 12),
          resumeAt: Duration.zero,
        ),
      };
      repository.sections = const <LessonOutlineSection>[
        LessonOutlineSection(
          id: 'section-1',
          position: 0,
          title: 'Replication',
          totalDuration: Duration(minutes: 38),
          lessons: <LessonOutlineEntry>[
            LessonOutlineEntry(
              id: 'lesson-1',
              position: 0,
              title: 'Leaderless replication',
              duration: Duration(minutes: 26),
              state: LessonOutlineEntryState.inProgress,
            ),
            LessonOutlineEntry(
              id: 'lesson-2',
              position: 1,
              title: 'Quorum reads',
              duration: Duration(minutes: 12),
              state: LessonOutlineEntryState.notStarted,
            ),
          ],
        ),
      ];
    }

    blocTest<PlayerBloc, PlayerState>(
      'auto-advances to the next lesson on completion when the pref is on',
      build: build,
      setUp: () {
        prefs.autoplayNextLesson = true;
        seedTwoLessons();
      },
      act: (bloc) async {
        bloc.add(const PlayerStarted('lesson-1'));
        await Future<void>.delayed(Duration.zero);
        playback.emit(playing(isCompleted: true));
        await Future<void>.delayed(Duration.zero);
      },
      verify: (bloc) {
        expect(bloc.state.lesson?.id, 'lesson-2');
        expect(bloc.state.status, PlayerStatus.playing);
        expect(playback.opened.length, 2);
      },
    );

    blocTest<PlayerBloc, PlayerState>(
      'does not advance when the autoplay pref is off',
      build: build,
      setUp: () {
        prefs.autoplayNextLesson = false;
        seedTwoLessons();
      },
      act: (bloc) async {
        bloc.add(const PlayerStarted('lesson-1'));
        await Future<void>.delayed(Duration.zero);
        playback.emit(playing(isCompleted: true));
        await Future<void>.delayed(Duration.zero);
      },
      verify: (bloc) {
        expect(bloc.state.lesson?.id, 'lesson-1');
        expect(bloc.state.status, PlayerStatus.endOfLesson);
        expect(playback.opened.length, 1);
      },
    );

    blocTest<PlayerBloc, PlayerState>(
      'stays on the end banner at the last lesson',
      build: build,
      setUp: () {
        prefs.autoplayNextLesson = true;
        // Only lesson-1 in the outline — nothing to advance to.
        repository.sections = const <LessonOutlineSection>[
          LessonOutlineSection(
            id: 'section-1',
            position: 0,
            title: 'Replication',
            totalDuration: Duration(minutes: 26),
            lessons: <LessonOutlineEntry>[
              LessonOutlineEntry(
                id: 'lesson-1',
                position: 0,
                title: 'Leaderless replication',
                duration: Duration(minutes: 26),
                state: LessonOutlineEntryState.inProgress,
              ),
            ],
          ),
        ];
      },
      act: (bloc) async {
        bloc.add(const PlayerStarted('lesson-1'));
        await Future<void>.delayed(Duration.zero);
        playback.emit(playing(isCompleted: true));
        await Future<void>.delayed(Duration.zero);
      },
      verify: (bloc) {
        expect(bloc.state.status, PlayerStatus.endOfLesson);
        expect(playback.opened.length, 1);
      },
    );
  });
```

In `apps/mobile/test/features/player/lesson_player_screen_test.dart`, update `buildBloc()` to pass a fake:

```dart
  PlayerBloc buildBloc() => PlayerBloc(
    repository: repository,
    progressRecorder: recorder,
    playback: playback,
    playbackPreferences: FakePlaybackPreferences(),
  );
```

- [ ] **Step 3: Run to verify the new tests fail**

Run: `cd apps/mobile && flutter test test/features/player/`
Expected: FAIL — `PlayerBloc` has no `playbackPreferences` param (compile error), and the new behavior tests fail once it compiles.

- [ ] **Step 4: Wire preferences into `PlayerBloc`**

In `apps/mobile/lib/features/player/presentation/bloc/player_bloc.dart`:

Add the import:

```dart
import 'package:app_mobile/shared/preferences/playback_preferences.dart';
```

Add the constructor param + field. In the constructor signature add `required PlaybackPreferences playbackPreferences,` and in the initializer list add `_prefs = playbackPreferences,`. Add the field near the other finals:

```dart
  final PlaybackPreferences _prefs;
```

In `_load`, after `await _playback.open(source);` and before the `if (lesson.resumeAt > Duration.zero)` block, apply the saved speed:

```dart
      // Open at the user's saved playback rate (device preference).
      final double savedSpeed = _prefs.playbackSpeed;
      await _playback.setSpeed(savedSpeed);
```

In the emitted `state.copyWith(...)` at the end of `_load`, add `speed: savedSpeed,` to the argument list (so the ready state reflects it).

In `_onTicked`, replace the existing `endOfLesson` branch:

```dart
    if (status == PlayerStatus.endOfLesson) {
      // Web lets the tail position die with the page unless `beforeunload`
      // fires. Flushing on `ended` is a deliberate improvement: it is the one
      // position that decides whether the lesson reads as completed.
      await _writeProgress(force: true);
      return;
    }
```

with:

```dart
    if (status == PlayerStatus.endOfLesson) {
      // Flush on `ended`: it is the one position that decides whether the
      // lesson reads as completed.
      await _writeProgress(force: true);
      // Honour the autoplay preference, read live so a mid-session toggle
      // takes effect at the very next lesson boundary.
      if (_prefs.autoplayNextLesson) {
        final String? next = _nextLessonId();
        if (next != null) await _advanceTo(next, emit);
      }
      return;
    }
```

Add these private helpers (e.g. just before `_statusFrom`):

```dart
  /// The next lesson to play after the current one, flattening the outline by
  /// section then lesson position. Null when the current lesson is last or the
  /// next one is locked.
  String? _nextLessonId() {
    final String? current = _lessonId;
    if (current == null) return null;

    final List<LessonOutlineSection> sections =
        <LessonOutlineSection>[...state.sections]
          ..sort((a, b) => a.position.compareTo(b.position));
    final List<LessonOutlineEntry> ordered = <LessonOutlineEntry>[
      for (final LessonOutlineSection s in sections)
        ...(<LessonOutlineEntry>[...s.lessons]
          ..sort((a, b) => a.position.compareTo(b.position))),
    ];

    final int index = ordered.indexWhere((e) => e.id == current);
    if (index == -1 || index + 1 >= ordered.length) return null;
    final LessonOutlineEntry next = ordered[index + 1];
    if (next.state == LessonOutlineEntryState.locked) return null;
    return next.id;
  }

  /// Loads [lessonId] fresh and plays it — the autoplay transition.
  Future<void> _advanceTo(String lessonId, Emitter<PlayerState> emit) async {
    _lessonId = lessonId;
    emit(const PlayerState()); // loading for the new lesson
    await _load(emit);
    if (state.status == PlayerStatus.paused) {
      _lastProgressWriteAt = _now();
      await _playback.play();
      emit(state.copyWith(status: PlayerStatus.playing));
    }
  }
```

Note: `LessonOutlineSection`, `LessonOutlineEntry`, `LessonOutlineEntryState` are already imported via `lesson_playback.dart` (used by `PlayerState`). If the analyzer reports them unresolved, add `import 'package:app_mobile/features/player/domain/lesson_playback.dart';` — but `player_bloc.dart` already imports it.

- [ ] **Step 5: Run the player tests to verify they pass**

Run: `cd apps/mobile && flutter test test/features/player/`
Expected: PASS (existing + 4 new behavior tests).

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/lib/features/player/ apps/mobile/test/features/player/
git commit -m "feat(mobile): player honors saved speed + autoplays next lesson

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Full-suite gate + format + archive the task

**Files:**
- Modify: `specs/tasks/active.md`, `specs/tasks/done.md`

- [ ] **Step 1: Format + analyze**

```bash
cd apps/mobile && dart format . && flutter analyze
```
Expected: `dart format` reports the files it touched; `flutter analyze` → `No issues found!`. Fix any analyzer issue (e.g. an unused import left in `main_shell.dart`).

- [ ] **Step 2: Run the whole mobile suite**

```bash
cd apps/mobile && flutter test
```
Expected: all tests PASS (the E18 baseline 247 plus the ~13 added here).

- [ ] **Step 3: Move the task-stack entry to done**

Move the `T-2026-07-18-004` entry from `specs/tasks/active.md` to the top of `specs/tasks/done.md` with all boxes checked, restore the "No active tasks" note (keep the remaining follow-ups note) in `active.md`, and add a `- Result: <PR link>` line once the PR is opened.

- [ ] **Step 4: Commit**

```bash
git add -f specs/tasks/active.md specs/tasks/done.md
git add -u apps/mobile
git commit -m "chore(tasks): archive persist+honor device prefs task

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 5: Open the PR** (branch `feat/mobile-persist-honor-prefs` → `main`). Body summarizes the feature and links the spec. Create a follow-up GitHub issue for visibility (no roadmap `E##` slot — post-E18 polish) and reference it in the PR body. `subtitles` + `wifiOnlyDownloads` remain persisted-but-inert (call this out in the PR body so it isn't read as a gap).

---

## Self-Review

**Spec coverage:**
- Storage layer (`shared_preferences`, two stores) → Task 1. ✅
- Persist settings → Task 2; persist recents → Task 3. ✅
- Lift `SettingsCubit` above `MaterialApp` + `themeMode`/`textScaler`/`disableAnimations` → Task 4. ✅
- Player saved speed + autoplay-next (with `_nextLessonId` flatten, locked/last stop) → Task 5. ✅
- `subtitles`/`wifiOnlyDownloads` persisted-but-inert (doc comment) → Task 2 Step 4; called out in PR (Task 6). ✅
- DI registration → Task 4 Step 5. ✅
- Tests: store round-trips, cubit seed+persist, App widget test, player bloc_tests → Tasks 1–5. ✅
- No i18n / no spec change (Global Constraints). ✅

**Placeholder scan:** No TBD/TODO-implement-later; every code step shows the code. ✅

**Type consistency:** `PlaybackPreferences.playbackSpeed`/`autoplayNextLesson` used identically in the store, the fake, the injector, and `PlayerBloc`. `SettingsPreferencesStore(SharedPreferences)`, `RecentSearchesStore(SharedPreferences)`, `SettingsCubit(store)`, `SearchCubit(repo, store)`, `PlayerBloc(..., playbackPreferences:)` match across tasks and their tests. `themeModeFrom`/`textScaleFrom` names consistent. ✅
