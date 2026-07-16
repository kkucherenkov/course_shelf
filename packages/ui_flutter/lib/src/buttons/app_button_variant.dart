import 'package:app_ui/src/theme/tokens.g.dart';

/// Visual weight of a button, sharing one palette across [AppButton] and
/// [AppIconButton]. Mirrors the web `AppButton` variant union.
enum AppButtonVariant { primary, secondary, ghost, destructive }

/// Control size. Heights are a locally-owned scale (as the web owns its
/// `$btn-h-*` SCSS vars); every other metric comes from `Tokens.*`.
enum AppButtonSize {
  sm,
  md,
  lg;

  /// Fixed control height in logical pixels (web: 28 / 36 / 44).
  double get height => switch (this) {
    AppButtonSize.sm => 28,
    AppButtonSize.md => 36,
    AppButtonSize.lg => 44,
  };

  /// Icon glyph size, matching the web size ramp (16 / 20 / 24).
  double get iconSize => switch (this) {
    AppButtonSize.sm => 16,
    AppButtonSize.md => 20,
    AppButtonSize.lg => 24,
  };

  /// Horizontal padding from spacing tokens (web: space-3 / space-5 / space-6).
  double get horizontalPadding => switch (this) {
    AppButtonSize.sm => AppSpacing.s3,
    AppButtonSize.md => AppSpacing.s5,
    AppButtonSize.lg => AppSpacing.s6,
  };

  /// Gap between an icon and the label (web: space-1 / space-2 / space-2).
  double get gap => switch (this) {
    AppButtonSize.sm => AppSpacing.s1,
    AppButtonSize.md => AppSpacing.s2,
    AppButtonSize.lg => AppSpacing.s2,
  };

  /// Label font size from the type scale (web: text-sm / base / lg). The family
  /// and weight are bound in [resolveAppButtonStyle] off the theme, so the label
  /// inherits the packaged sans face rather than the bare (degrading) token
  /// family.
  double get fontSize => switch (this) {
    AppButtonSize.sm => AppFontSize.sm,
    AppButtonSize.md => AppFontSize.base,
    AppButtonSize.lg => AppFontSize.lg,
  };
}
