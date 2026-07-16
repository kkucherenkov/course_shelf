# E17-F01-S02 — AppButton + AppIconButton (Flutter)

**Date:** 2026-07-16
**Card:** [E17-F01-S02](../../roadmap/tasks/E17-F01-S02.md)
**Epic:** E17 — Mobile widget catalog · **Feature:** F01 — Mobile primitives
**Depends on:** E16-F01-S01 (Widgetbook), E17-F01-S01 (IconCS)

## Goal

Flutter equivalents of the web `AppButton` and `AppIconButton`
(`packages/ui/src/components/AppButton`, `.../AppIconButton`) in `app_ui`:
the same 4 variants × 3 sizes × states, driven entirely by design tokens.
This is the **shared recipe** the rest of the E17-F01 component wave reuses,
so its structure (variant/size enums, token→colour mapping, TDD + golden +
Widgetbook pattern) is deliberately reusable.

## Decisions

1. **Build on Material `ButtonStyleButton` + `WidgetStateProperty`, ripple
   suppressed.** A `TextButton` with a fully-specified `ButtonStyle` gives
   focus, keyboard, semantics, disabled handling and per-state resolution for
   free while rendering the web's *flat* look. `overlayColor` resolves to
   transparent so there is no Material ink ripple; hover/press colours are baked
   into `backgroundColor`. Preferred over a from-scratch `StatefulWidget`, which
   would re-implement all of the above.

2. **Flat token colour-swap for interaction, not a ripple.** Mirrors the web
   design and uses the `accentActive` token the set already ships for the
   pressed state. primary: pressed → `accentActive`, hovered (desktop) →
   `accentHover`. Destructive pressed darkens the token via `Color.alphaBlend`
   (state transform of a token, analogous to web's `brightness(1.05)`), not a
   hard-coded hex.

3. **Heights are a locally-owned scale** (sm 28 / md 36 / lg 44), exactly as the
   web owns its `$btn-h-*` SCSS vars — these are not in the global token set.
   Everything else (padding, gap, radius, font, colours) comes from `Tokens.*`.

## Token mapping

| Variant | background | foreground | border | pressed | hovered |
| --- | --- | --- | --- | --- | --- |
| primary | `cs.primary` | `cs.onPrimary` | — | `sem.accentActive` | `sem.accentHover` |
| secondary | `sem.raised` | `cs.onSurface` | `cs.outline` | `cs.surface` | `cs.surface` + `cs.outlineVariant` |
| ghost | transparent | `cs.onSurface` | — | `sem.raised` | `sem.raised` |
| destructive | `cs.error` | `cs.onError` | — | alphaBlend(black 8%, `cs.error`) | alphaBlend(black 5%, `cs.error`) |

`cs` = `Theme.of(context).colorScheme`, `sem` = `context.semanticColors`.

Per-size metrics: height `[28,36,44]`, icon `[16,20,24]`, horizontal padding
`AppSpacing.s3/s5/s6`, gap `AppSpacing.s1/s2/s2`, text `text-sm/base/lg`,
radius `AppRadius.md`.

## Files (all new unless noted)

- `lib/src/buttons/app_button_variant.dart` — `AppButtonVariant`,
  `AppButtonSize` enums + per-size metric getters.
- `lib/src/buttons/app_button_style.dart` —
  `ButtonStyle resolveAppButtonStyle(BuildContext, AppButtonVariant, AppButtonSize, {bool square})`.
- `lib/src/buttons/app_button.dart` — `AppButton`.
- `lib/src/buttons/app_icon_button.dart` — `AppIconButton`.
- `lib/app_ui.dart` (edit) — export the four.
- `apps/mobile/lib/widgetbook/app_button_catalog.dart` (new) + `directories.dart`
  (edit) — register `AppButton` + `AppIconButton`.
- **Delete** `apps/mobile/lib/widgetbook/canary_button.dart` +
  `apps/mobile/test/widgetbook/canary_button_test.dart`; drop the CanaryButton
  registration + its `directories_test` assertion.
- `packages/ui_flutter/test/buttons/app_button_test.dart`,
  `app_icon_button_test.dart`, `app_button_golden_test.dart` + `goldens/`.

## API

```dart
AppButton({
  String? label, Widget? child,
  AppButtonVariant variant = AppButtonVariant.primary,
  AppButtonSize size = AppButtonSize.md,
  bool loading = false, bool disabled = false, bool block = false,
  IconName? iconLeading, IconName? iconTrailing,
  VoidCallback? onPressed,
});

AppIconButton({
  required IconName name, required String semanticLabel,
  AppButtonVariant variant = AppButtonVariant.primary,
  AppButtonSize size = AppButtonSize.md,
  bool loading = false, bool disabled = false,
  VoidCallback? onPressed,
});
```

Web-only `to`/`type` are dropped (navigation is the caller's `onPressed`).

- **disabled** → `onPressed: null` + `Opacity(0.45)` (web's whole-element fade).
- **loading** → child swaps to a `CircularProgressIndicator` sized to the
  label; taps guarded with `IgnorePointer` while the variant fill stays full
  (web keeps colour during load).
- Icons: `IconCS` inside inherits the button's resolved foreground via the
  `IconTheme` Material wraps the child in, so glyphs recolour per state for free.

## Tests (TDD)

**Widget** (`app_button_test.dart`): label renders; `onPressed` fires on tap;
disabled → callback not fired, `onPressed == null`, `Opacity(0.45)` present;
loading → `CircularProgressIndicator` shown, label hidden, tap guarded; leading
/ trailing `IconCS` present at the size's icon px; `block` → full width; each
variant's resolved default `backgroundColor` equals the expected token; each
size → expected height.

**Widget** (`app_icon_button_test.dart`): renders one `IconCS`; square (w == h ==
size height); `semanticLabel` exposed; disabled/loading behave as the button.

**Golden**: `button_matrix_{light,dark}` — 4 variants × 3 sizes across
default / disabled / loading, plus an icon-button row.

**Mobile** (`directories_test.dart`): `AppButton` + `AppIconButton` registered
with their use cases; `CanaryButton` gone.

## Out of scope

- E17-F01-S03+ components and the parallel fan-out wave (next step).
- Spec / codegen (none — `Spec diff: none`, `Codegen impact: no`).
