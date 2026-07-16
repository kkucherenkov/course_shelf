# E17-F01-S01 — IconCS Flutter widget (port the 66 icons)

**Date:** 2026-07-16
**Card:** [E17-F01-S01](../../roadmap/tasks/E17-F01-S01.md)
**Epic:** E17 — Mobile widget catalog · **Feature:** F01 — Mobile primitives
**Depends on:** E16-F01-S01 (Widgetbook bootstrap)

## Goal

The same 66 named glyphs the web ships as `<IconCS>` (`packages/ui/src/components/IconCS/IconCS.vue`), available in Flutter as a single `IconCS` widget in `app_ui` (`packages/ui_flutter`). Parity target is the **web component**, not the raw `docs/design/shared/icons.jsx`.

## Decisions

1. **Rendering: `flutter_svg`.** Render the literal SVG markup with `SvgPicture.string`, recoloured to the ambient icon colour. The card suggested a custom `Painter` / "small SVG rasterizer"; the user overrode that in favour of `flutter_svg`. Rationale: rendering the *verbatim* SVG source (copied cell-for-cell from `IconCS.vue`) is the lowest-risk path to parity — no hand-transcription of paths, no manual SVG-arc→bézier maths. `flutter_svg` becomes a **regular** dependency of `app_ui` (used at runtime from `lib/`).

2. **currentColor via `ColorFilter.mode(color, srcIn)`.** Every glyph paints in `currentColor` (stroke, plus a few `fill="currentColor"` dots/rects). `ColorFilter.mode(resolved, BlendMode.srcIn)` recolours all painted pixels to the resolved colour while leaving `fill="none"` interiors hollow and preserving anti-aliasing. This is version-robust across `flutter_svg` 2.x (no reliance on `SvgTheme.currentColor` resolution). Resolved colour = `color ?? IconTheme.of(context).color ?? Theme.of(context).colorScheme.onSurface` — the Flutter analogue of CSS `currentColor`.

3. **`fill` prop templates geometry, not colour.** Only `play` and `bookmark` are fillable. Their markup carries a `__FILL__` sentinel replaced with `currentColor` (filled) or `none` (outline). Every other glyph ignores `fill`.

4. **Goldens: per-size grid sheets.** Three sheets `icon_grid_{16,20,24}` each render all 66 glyphs in a grid (light theme), plus `icon_grid_dark_24` to prove `currentColor` follows the theme, plus filled `play`/`bookmark` cells. This honours the card's "golden per icon at 16/20/24" intent (all icons, all three sizes) without 198 individual PNGs. Reuses the existing `golden_toolkit` + `loadAppFonts`/`loadPackagedFonts` + `AppTheme` harness.

## Files (all new unless noted)

- `packages/ui_flutter/pubspec.yaml` (edit) — add `flutter_svg` to `dependencies`.
- `lib/src/icons/icon_name.dart` — `enum IconName { play … banner }` (66) + `token` getter (camelCase→kebab via regex, e.g. `checkCircle → "check-circle"`) for lookup + golden labels.
- `lib/src/icons/icon_glyphs.dart` — `const Map<IconName, String> kIconMarkup` of verbatim inner SVG per glyph; `const Set<IconName> kFillableIcons = {play, bookmark}`; `String buildIconSvg(IconName, {bool fill})` wrapping the shared `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">…</svg>` envelope and substituting `__FILL__`.
- `lib/src/icons/icon_cs.dart` — the `IconCS` widget.
- `lib/app_ui.dart` (edit) — export the three new files.
- `apps/mobile/lib/widgetbook/icon_cs_catalog.dart` + register in `directories.dart` — Widgetbook use cases (gallery / sizes / fill).
- `packages/ui_flutter/test/icons/icon_cs_test.dart` — unit tests.
- `packages/ui_flutter/test/icons/icon_cs_golden_test.dart` + `goldens/` — grid goldens.

## Widget API

```dart
class IconCS extends StatelessWidget {
  const IconCS({
    required this.name,
    this.size = 20,
    this.fill = false,
    this.color,          // overrides currentColor
    this.semanticLabel,  // null => decorative (ExcludeSemantics)
    super.key,
  });
  final IconName name;
  final double size;
  final bool fill;
  final Color? color;
  final String? semanticLabel;
}
```

Matches the card acceptance `IconCS(name: IconName.play, size: 16, fill: true)` and the web props (`name`, `size=20`, `fill=false`, `title`→`semanticLabel`).

- Renders `SvgPicture.string(buildIconSvg(name, fill: fill), width: size, height: size, colorFilter: ColorFilter.mode(resolved, BlendMode.srcIn))`.
- `semanticLabel != null` → `Semantics(image: true, label: semanticLabel, child: …)`; else `ExcludeSemantics(child: …)` (decorative-by-default, mirrors web `aria-hidden="true"`).

## Tests (TDD)

**Unit** (`icon_cs_test.dart`):
- `IconName.values.length == 66`.
- every `IconName` has a `kIconMarkup` entry (no missing glyph).
- `buildIconSvg(play, fill: true)` contains `fill="currentColor"`; `fill: false` contains `fill="none"`; same for `bookmark`; a non-fillable glyph (`check`) contains no `__FILL__`.
- `token` round-trips the multi-word names (`checkCircle→check-circle`, `moreH→more-h`, `cornerDownRight→corner-down-right`).
- widget: `IconCS(name: play)` pumps a `SvgPicture` sized `size`; default is decorative (`ExcludeSemantics` present, no `Semantics` label); `semanticLabel` supplied → a `Semantics` node with that label.

**Golden** (`icon_cs_golden_test.dart`): `icon_grid_16`, `icon_grid_20`, `icon_grid_24` (all 66, light) + `icon_grid_dark_24`, generated via `--update-goldens`.

**Widgetbook**: `IconCS` component registered in the mobile catalog (gallery, size matrix, fill toggle).

## Known risks

- **`pdf` `<text>PDF</text>`** — `flutter_svg` has weak `<text>` support and may drop it. Goldens are Flutter-vs-Flutter regression (not web pixel-diff), so a degraded `pdf` still yields a *stable* golden. Verify at GREEN; if it renders nothing, replace the `<text>` with a small vector "PDF" to preserve intent.

## Out of scope

- E17-F01-S02+ components; removing the E16 `CanaryButton` (retired when `AppButton` lands in S02).
- Spec / codegen (none — `Spec diff: none`, `Codegen impact: no`).
