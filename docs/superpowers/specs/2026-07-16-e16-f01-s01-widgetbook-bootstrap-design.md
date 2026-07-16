# E16-F01-S01 — Widgetbook bootstrap (design)

**Card:** [E16-F01-S01](../../roadmap/tasks/E16-F01-S01.md) — `widgetbook/main.dart` + canary use case
**Date:** 2026-07-16
**Author:** claude

## Goal

A separately-runnable Widgetbook entrypoint that catalogs mobile widgets, with
one canary widget exercised across its states. This is the Flutter analogue of
`packages/ui`'s Storybook. E17 fills the catalog with the real `app_ui`
components; this card only stands up the harness + a canary.

## Decisions

### 1. Entrypoint lives in `apps/mobile` (not `packages/ui_flutter`)

`apps/mobile` is the only runnable Flutter *app* — it owns the (generated)
platform runners, so `flutter run -t widgetbook/main.dart` works with no extra
scaffolding. `packages/ui_flutter` is a pure library package with no runners.
The catalog still documents `app_ui` components by importing
`package:app_ui/app_ui.dart`, so it keeps Storybook-parity of *content* even
though the runnable entrypoint sits in the app (the idiomatic Widgetbook
"alternate `-t` target" pattern).

> Drift note: the card sub-step text and `ui_flutter`'s pubspec
> (`widgetbook`/`golden_toolkit` dev-deps, "colocated with a Widgetbook
> sandbox" description) point at `ui_flutter`. We follow the runnable-app
> reality instead and record the divergence here. If a device-independent,
> library-colocated catalog is wanted later, that is a follow-up card.

### 2. Layout forced by `always_use_package_imports`

`apps/mobile/analysis_options.yaml` enforces `always_use_package_imports`.
`package:app_mobile/...` only resolves files under `lib/`, so a conventional
top-level `widgetbook/` folder full of siblings would require lint-violating
relative imports. Resolution:

```
apps/mobile/
  widgetbook/main.dart              # thin entrypoint — ONE package import, runApp
  lib/widgetbook/
    widgetbook_app.dart             # WidgetbookApp: Widgetbook.material(directories, addons)
    directories.dart                # List<WidgetbookNode> buildWidgetbookDirectories()
    canary_button.dart              # CanaryButton placeholder widget
  test/widgetbook/
    canary_button_test.dart
    directories_test.dart
```

Everything under `lib/widgetbook/` is reachable only from `widgetbook/main.dart`,
never from `lib/main.dart`, so it is tree-shaken out of the shipped app.

### 3. Canary is `CanaryButton` (app-local), not a placeholder `AppButton`

E17-F01-S02 builds the real `AppButton` in `app_ui`. To avoid a future name
collision, the bootstrap canary is `CanaryButton`, defined app-locally under
`lib/widgetbook/`. It is a thin `FilledButton` wrapper (`label`, `onPressed`)
so it visibly picks up the app theme (`colorScheme.primary`,
`filledButtonTheme`). Use cases per state: **Enabled** and **Disabled**
(`onPressed: null`). E17 registers the real `app_ui` components alongside/instead
and the canary can be removed.

### 4. Manual (no-codegen) Widgetbook wiring

Use the manual API — `Widgetbook.material(directories: [...])` with hand-built
`WidgetbookComponent`/`WidgetbookUseCase` — not `@widgetbook.App` +
`build_runner`. Keeps the bootstrap free of extra codegen and makes
`buildWidgetbookDirectories()` a plain, testable value.

Addons mirror the real app: `MaterialThemeAddon` with
`WidgetbookTheme('Light', AppTheme.light())` / `('Dark', AppTheme.dark())`, plus
`TextScaleAddon()`.

### 5. `pnpm dev:widgetbook`

`apps/mobile` is not a pnpm workspace package, so the root script is a raw shell
wrapper:

```json
"dev:widgetbook": "cd apps/mobile && flutter run -t widgetbook/main.dart"
```

Running it needs a target device/emulator and generated platform runners — a
pre-existing repo condition (the app itself has no committed platform folders;
they are generated on demand). Out of scope for this bootstrap.

## Tests (TDD, run without platform runners)

- `canary_button_test.dart`: renders its label; is disabled when `onPressed` is
  null (`FilledButton.onPressed == null`).
- `directories_test.dart`: `buildWidgetbookDirectories()` registers a
  `WidgetbookComponent` named `CanaryButton` whose use-case names are
  exactly `{Enabled, Disabled}`.

Acceptance (`flutter run -t widgetbook/main.dart` shows the catalog) is verified
manually on a device; the automated gate is `flutter analyze` + the two widget
tests.

## Out of scope

- Real `app_ui` components in the catalog (E17-F01-*).
- Golden tests / `golden_toolkit` wiring.
- Committed platform runners for `apps/mobile`.
- A library-colocated (device-independent) catalog in `ui_flutter`.
