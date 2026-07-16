import 'package:app_ui/src/theme/tokens.g.dart';

/// Visual weight of [AppBadge], mirroring the web `AppBadge`'s `variant`
/// union (`solid | outline | soft | subtle`), itself forwarded onto Nuxt UI's
/// `UBadge`.
///
/// See `resolveAppBadgeColors` for exactly how each variant resolves its
/// background / foreground / border per [AppBadgeColor].
enum AppBadgeVariant { solid, outline, soft, subtle }

/// Badge control size. Only `sm | md | lg` — matching the web `AppBadge`'s
/// `Size` union (Nuxt UI's `UBadge` additionally has `xs`/`xl`, which the web
/// component does not expose).
///
/// Every metric here is drawn from `Tokens.*` (`AppSpacing`, `AppFontSize`,
/// `AppRadius`); [iconSize] is the sole locally-owned scale — mirroring
/// [AppButtonSize.iconSize], it approximates the web's `leadingIcon` Tailwind
/// `size-*` utilities (`size-3` / `size-3` / `size-4`), which have no token
/// equivalent.
enum AppBadgeSize {
  sm,
  md,
  lg;

  /// Horizontal padding (web: `px-1.5` / `px-2` / `px-2`, rounded to the
  /// nearest token).
  double get horizontalPadding => switch (this) {
    AppBadgeSize.sm => AppSpacing.s1,
    AppBadgeSize.md => AppSpacing.s2,
    AppBadgeSize.lg => AppSpacing.s2,
  };

  /// Vertical padding — constant across sizes, matching the web's uniform
  /// `py-1`.
  double get verticalPadding => AppSpacing.s1;

  /// Gap between the leading icon and the label (web: `gap-1` / `gap-1` /
  /// `gap-1.5`).
  double get gap => switch (this) {
    AppBadgeSize.sm => AppSpacing.s1,
    AppBadgeSize.md => AppSpacing.s1,
    AppBadgeSize.lg => AppSpacing.s2,
  };

  /// Corner radius (web: `rounded-sm` / `rounded-md` / `rounded-md`).
  double get radius => switch (this) {
    AppBadgeSize.sm => AppRadius.xs,
    AppBadgeSize.md => AppRadius.sm,
    AppBadgeSize.lg => AppRadius.sm,
  };

  /// Label font size (web: `text-[10px]` / `text-xs` / `text-sm`).
  double get fontSize => switch (this) {
    AppBadgeSize.sm => AppFontSize.xs,
    AppBadgeSize.md => AppFontSize.sm,
    AppBadgeSize.lg => AppFontSize.md,
  };

  /// Leading icon glyph size — locally owned (web: `size-3` / `size-3` /
  /// `size-4`, i.e. 12px / 12px / 16px); no `Tokens.*` entry maps onto these.
  double get iconSize => switch (this) {
    AppBadgeSize.sm => 12,
    AppBadgeSize.md => 12,
    AppBadgeSize.lg => 16,
  };
}
