import 'package:app_ui/src/theme/tokens.g.dart';

/// Shared size scale for labelled form fields — Flutter twin of the `sm |
/// md | lg` size prop on the web `AppInput` / `AppSelect` family.
///
/// [AppSwitch], [AppCheckbox], and [AppRadio] do not use this: none of their
/// web twins expose a `size` prop (checkbox/radio are fixed 18×18; switch has
/// its own independent track/thumb ramp — see `AppSwitchSize`).
enum AppFieldSize {
  sm,
  md,
  lg;

  /// Fixed control height. Locally-owned (web: `AppInput`/`AppSelect` hard-code
  /// 28 / 36 / 44px directly too — the spacing scale tops out at `space-9`
  /// (96px) so there is no token to express a control height with).
  double get height => switch (this) {
    AppFieldSize.sm => 28,
    AppFieldSize.md => 36,
    AppFieldSize.lg => 44,
  };

  /// Horizontal padding inside the control
  /// (web `AppInput`: space-3 / space-3 / space-4).
  double get horizontalPadding => switch (this) {
    AppFieldSize.sm => AppSpacing.s3,
    AppFieldSize.md => AppSpacing.s3,
    AppFieldSize.lg => AppSpacing.s4,
  };

  /// Control text size (web `AppInput`: text-sm / text-md / text-md — the
  /// source repeats `--text-md` for both md and lg, only padding/height grow
  /// at lg).
  double get fontSize => switch (this) {
    AppFieldSize.sm => AppFontSize.sm,
    AppFieldSize.md => AppFontSize.md,
    AppFieldSize.lg => AppFontSize.md,
  };

  /// Label text size (web `AppField` maps its own `size` onto `AppLabel`'s
  /// narrower `sm | md` range: `sm` stays `sm`, `md` and `lg` both fall back
  /// to `md` — label legibility doesn't scale with the control).
  double get labelFontSize => switch (this) {
    AppFieldSize.sm => AppFontSize.xs,
    AppFieldSize.md => AppFontSize.sm,
    AppFieldSize.lg => AppFontSize.sm,
  };
}
