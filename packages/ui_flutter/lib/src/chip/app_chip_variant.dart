import 'package:app_ui/src/theme/tokens.g.dart';

/// Visual weight of an [AppChip]. Mirrors the web `AppChip` variant union
/// (`default | primary | success | warning | error | info`).
///
/// The web `'default'` variant is named [neutral] here — `default` is a
/// reserved word in Dart and cannot be used as an enum member.
enum AppChipVariant { neutral, primary, success, warning, error, info }

/// Chip control size. Heights are a locally-owned scale (web: `18 / 22 / 28`
/// px, hard-coded per `.app-chip--sm/md/lg` rather than routed through a
/// spacing token); every other metric comes from `Tokens.*`.
enum AppChipSize {
  sm,
  md,
  lg;

  /// Fixed chip height in logical pixels (web: 18 / 22 / 28).
  double get height => switch (this) {
    AppChipSize.sm => 18,
    AppChipSize.md => 22,
    AppChipSize.lg => 28,
  };

  /// Horizontal padding from spacing tokens (web: space-1 / space-2 / space-3).
  double get horizontalPadding => switch (this) {
    AppChipSize.sm => AppSpacing.s1,
    AppChipSize.md => AppSpacing.s2,
    AppChipSize.lg => AppSpacing.s3,
  };

  /// Label font size (web: `--text-xs` (11) / a literal `12px` / `--text-md`
  /// (14) — the `md` step is a bare literal in the web SCSS rather than a
  /// named token, but it numerically coincides with [AppFontSize.sm]).
  double get fontSize => switch (this) {
    AppChipSize.sm => AppFontSize.xs,
    AppChipSize.md => AppFontSize.sm,
    AppChipSize.lg => AppFontSize.md,
  };

  /// Leading/remove icon glyph size — one step below the chip's own size so
  /// the glyph doesn't crowd the label (mirrors the web `iconPx` computed
  /// property literally: 10 / 12 / 14). Locally-owned; no spacing or font
  /// token lands on this exact ramp.
  double get iconSize => switch (this) {
    AppChipSize.sm => 10,
    AppChipSize.md => 12,
    AppChipSize.lg => 14,
  };
}
