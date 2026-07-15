import 'package:flutter/material.dart';

import 'package:app_ui/src/theme/tokens.g.dart';

/// Font families resolve under a `packages/<name>/` prefix because the TTFs
/// ship inside this package rather than the host app.
const String _fontPackage = 'app_ui';
const String _sans = 'packages/$_fontPackage/${AppFontFamily.sans}';
const String _mono = 'packages/$_fontPackage/${AppFontFamily.mono}';

/// Brightness-dependent colours that Material's [ColorScheme] has no slot for.
///
/// Brightness-*independent* tokens ([AppSpacing], [AppRadius], [AppDuration],
/// [AppEasing], [AppOpacity], [AppLift]) are plain constants — import them
/// directly instead of routing them through the theme.
@immutable
class AppSemanticColors extends ThemeExtension<AppSemanticColors> {
  const AppSemanticColors({
    required this.accentHover,
    required this.accentActive,
    required this.accentSoft,
    required this.accentScale,
    required this.pageBackground,
    required this.raised,
    required this.skeletonBase,
    required this.skeletonShine,
    required this.borderFocus,
    required this.textLoud,
    required this.textTertiary,
    required this.textDisabled,
    required this.textLink,
    required this.successFg,
    required this.successSubtle,
    required this.successSoft,
    required this.warningFg,
    required this.warningSubtle,
    required this.warningSoft,
    required this.errorSoft,
    required this.infoFg,
    required this.infoSubtle,
    required this.infoSoft,
  });

  factory AppSemanticColors.light() => const AppSemanticColors(
        accentHover: AppColorsLight.brandAccentHover,
        accentActive: AppColorsLight.brandAccentActive,
        accentSoft: AppColorsLight.brandAccentSoft,
        accentScale: <Color>[
          AppColorsLight.brandAccent50,
          AppColorsLight.brandAccent100,
          AppColorsLight.brandAccent200,
          AppColorsLight.brandAccent300,
          AppColorsLight.brandAccent400,
          AppColorsLight.brandAccent500,
          AppColorsLight.brandAccent600,
          AppColorsLight.brandAccent700,
          AppColorsLight.brandAccent800,
          AppColorsLight.brandAccent900,
          AppColorsLight.brandAccent950,
        ],
        pageBackground: AppColorsLight.surfacePage,
        raised: AppColorsLight.surfaceRaised,
        skeletonBase: AppColorsLight.surfaceSkeletonBase,
        skeletonShine: AppColorsLight.surfaceSkeletonShine,
        borderFocus: AppColorsLight.borderFocus,
        textLoud: AppColorsLight.textLoud,
        textTertiary: AppColorsLight.textTertiary,
        textDisabled: AppColorsLight.textDisabled,
        textLink: AppColorsLight.textLink,
        successFg: AppColorsLight.statusSuccessFg,
        successSubtle: AppColorsLight.statusSuccessSubtle,
        successSoft: AppColorsLight.statusSuccessSoft,
        warningFg: AppColorsLight.statusWarningFg,
        warningSubtle: AppColorsLight.statusWarningSubtle,
        warningSoft: AppColorsLight.statusWarningSoft,
        errorSoft: AppColorsLight.statusErrorSoft,
        infoFg: AppColorsLight.statusInfoFg,
        infoSubtle: AppColorsLight.statusInfoSubtle,
        infoSoft: AppColorsLight.statusInfoSoft,
      );

  factory AppSemanticColors.dark() => const AppSemanticColors(
        accentHover: AppColorsDark.brandAccentHover,
        accentActive: AppColorsDark.brandAccentActive,
        accentSoft: AppColorsDark.brandAccentSoft,
        accentScale: <Color>[
          AppColorsDark.brandAccent50,
          AppColorsDark.brandAccent100,
          AppColorsDark.brandAccent200,
          AppColorsDark.brandAccent300,
          AppColorsDark.brandAccent400,
          AppColorsDark.brandAccent500,
          AppColorsDark.brandAccent600,
          AppColorsDark.brandAccent700,
          AppColorsDark.brandAccent800,
          AppColorsDark.brandAccent900,
          AppColorsDark.brandAccent950,
        ],
        pageBackground: AppColorsDark.surfacePage,
        raised: AppColorsDark.surfaceRaised,
        skeletonBase: AppColorsDark.surfaceSkeletonBase,
        skeletonShine: AppColorsDark.surfaceSkeletonShine,
        borderFocus: AppColorsDark.borderFocus,
        textLoud: AppColorsDark.textLoud,
        textTertiary: AppColorsDark.textTertiary,
        textDisabled: AppColorsDark.textDisabled,
        textLink: AppColorsDark.textLink,
        successFg: AppColorsDark.statusSuccessFg,
        successSubtle: AppColorsDark.statusSuccessSubtle,
        successSoft: AppColorsDark.statusSuccessSoft,
        warningFg: AppColorsDark.statusWarningFg,
        warningSubtle: AppColorsDark.statusWarningSubtle,
        warningSoft: AppColorsDark.statusWarningSoft,
        errorSoft: AppColorsDark.statusErrorSoft,
        infoFg: AppColorsDark.statusInfoFg,
        infoSubtle: AppColorsDark.statusInfoSubtle,
        infoSoft: AppColorsDark.statusInfoSoft,
      );

  final Color accentHover;
  final Color accentActive;
  final Color accentSoft;

  /// Brand accent ramp, 50 → 950. Always 11 entries.
  final List<Color> accentScale;

  final Color pageBackground;
  final Color raised;
  final Color skeletonBase;
  final Color skeletonShine;
  final Color borderFocus;
  final Color textLoud;
  final Color textTertiary;
  final Color textDisabled;
  final Color textLink;
  final Color successFg;
  final Color successSubtle;
  final Color successSoft;
  final Color warningFg;
  final Color warningSubtle;
  final Color warningSoft;
  final Color errorSoft;
  final Color infoFg;
  final Color infoSubtle;
  final Color infoSoft;

  @override
  AppSemanticColors copyWith({
    Color? accentHover,
    Color? accentActive,
    Color? accentSoft,
    List<Color>? accentScale,
    Color? pageBackground,
    Color? raised,
    Color? skeletonBase,
    Color? skeletonShine,
    Color? borderFocus,
    Color? textLoud,
    Color? textTertiary,
    Color? textDisabled,
    Color? textLink,
    Color? successFg,
    Color? successSubtle,
    Color? successSoft,
    Color? warningFg,
    Color? warningSubtle,
    Color? warningSoft,
    Color? errorSoft,
    Color? infoFg,
    Color? infoSubtle,
    Color? infoSoft,
  }) {
    return AppSemanticColors(
      accentHover: accentHover ?? this.accentHover,
      accentActive: accentActive ?? this.accentActive,
      accentSoft: accentSoft ?? this.accentSoft,
      accentScale: accentScale ?? this.accentScale,
      pageBackground: pageBackground ?? this.pageBackground,
      raised: raised ?? this.raised,
      skeletonBase: skeletonBase ?? this.skeletonBase,
      skeletonShine: skeletonShine ?? this.skeletonShine,
      borderFocus: borderFocus ?? this.borderFocus,
      textLoud: textLoud ?? this.textLoud,
      textTertiary: textTertiary ?? this.textTertiary,
      textDisabled: textDisabled ?? this.textDisabled,
      textLink: textLink ?? this.textLink,
      successFg: successFg ?? this.successFg,
      successSubtle: successSubtle ?? this.successSubtle,
      successSoft: successSoft ?? this.successSoft,
      warningFg: warningFg ?? this.warningFg,
      warningSubtle: warningSubtle ?? this.warningSubtle,
      warningSoft: warningSoft ?? this.warningSoft,
      errorSoft: errorSoft ?? this.errorSoft,
      infoFg: infoFg ?? this.infoFg,
      infoSubtle: infoSubtle ?? this.infoSubtle,
      infoSoft: infoSoft ?? this.infoSoft,
    );
  }

  @override
  AppSemanticColors lerp(covariant AppSemanticColors? other, double t) {
    if (other == null) {
      return this;
    }
    return AppSemanticColors(
      accentHover: Color.lerp(accentHover, other.accentHover, t)!,
      accentActive: Color.lerp(accentActive, other.accentActive, t)!,
      accentSoft: Color.lerp(accentSoft, other.accentSoft, t)!,
      accentScale: <Color>[
        for (int i = 0; i < accentScale.length; i++)
          Color.lerp(accentScale[i], other.accentScale[i], t)!,
      ],
      pageBackground: Color.lerp(pageBackground, other.pageBackground, t)!,
      raised: Color.lerp(raised, other.raised, t)!,
      skeletonBase: Color.lerp(skeletonBase, other.skeletonBase, t)!,
      skeletonShine: Color.lerp(skeletonShine, other.skeletonShine, t)!,
      borderFocus: Color.lerp(borderFocus, other.borderFocus, t)!,
      textLoud: Color.lerp(textLoud, other.textLoud, t)!,
      textTertiary: Color.lerp(textTertiary, other.textTertiary, t)!,
      textDisabled: Color.lerp(textDisabled, other.textDisabled, t)!,
      textLink: Color.lerp(textLink, other.textLink, t)!,
      successFg: Color.lerp(successFg, other.successFg, t)!,
      successSubtle: Color.lerp(successSubtle, other.successSubtle, t)!,
      successSoft: Color.lerp(successSoft, other.successSoft, t)!,
      warningFg: Color.lerp(warningFg, other.warningFg, t)!,
      warningSubtle: Color.lerp(warningSubtle, other.warningSubtle, t)!,
      warningSoft: Color.lerp(warningSoft, other.warningSoft, t)!,
      errorSoft: Color.lerp(errorSoft, other.errorSoft, t)!,
      infoFg: Color.lerp(infoFg, other.infoFg, t)!,
      infoSubtle: Color.lerp(infoSubtle, other.infoSubtle, t)!,
      infoSoft: Color.lerp(infoSoft, other.infoSoft, t)!,
    );
  }
}

/// Brightness-dependent elevation shadows.
@immutable
class AppShadows extends ThemeExtension<AppShadows> {
  const AppShadows({
    required this.xs,
    required this.sm,
    required this.md,
    required this.lg,
    required this.focus,
  });

  factory AppShadows.light() => const AppShadows(
        xs: AppShadowsLight.xs,
        sm: AppShadowsLight.sm,
        md: AppShadowsLight.md,
        lg: AppShadowsLight.lg,
        focus: AppShadowsLight.focus,
      );

  factory AppShadows.dark() => const AppShadows(
        xs: AppShadowsDark.xs,
        sm: AppShadowsDark.sm,
        md: AppShadowsDark.md,
        lg: AppShadowsDark.lg,
        focus: AppShadowsDark.focus,
      );

  final List<BoxShadow> xs;
  final List<BoxShadow> sm;
  final List<BoxShadow> md;
  final List<BoxShadow> lg;
  final List<BoxShadow> focus;

  @override
  AppShadows copyWith({
    List<BoxShadow>? xs,
    List<BoxShadow>? sm,
    List<BoxShadow>? md,
    List<BoxShadow>? lg,
    List<BoxShadow>? focus,
  }) {
    return AppShadows(
      xs: xs ?? this.xs,
      sm: sm ?? this.sm,
      md: md ?? this.md,
      lg: lg ?? this.lg,
      focus: focus ?? this.focus,
    );
  }

  @override
  AppShadows lerp(covariant AppShadows? other, double t) {
    if (other == null) {
      return this;
    }
    return AppShadows(
      xs: BoxShadow.lerpList(xs, other.xs, t)!,
      sm: BoxShadow.lerpList(sm, other.sm, t)!,
      md: BoxShadow.lerpList(md, other.md, t)!,
      lg: BoxShadow.lerpList(lg, other.lg, t)!,
      focus: BoxShadow.lerpList(focus, other.focus, t)!,
    );
  }
}

/// Convenience accessors so widgets read `context.semanticColors.successFg`
/// rather than the noisier `Theme.of(context).extension<...>()!`.
extension AppThemeContext on BuildContext {
  AppSemanticColors get semanticColors =>
      Theme.of(this).extension<AppSemanticColors>()!;

  AppShadows get shadows => Theme.of(this).extension<AppShadows>()!;
}

/// Builds [ThemeData] from the generated design tokens.
abstract final class AppTheme {
  static ThemeData light() => _build(
        brightness: Brightness.light,
        colorScheme: const ColorScheme.light(
          primary: AppColorsLight.brandAccent,
          onPrimary: AppColorsLight.brandAccentFg,
          primaryContainer: AppColorsLight.brandAccentSubtle,
          onPrimaryContainer: AppColorsLight.textFg,
          secondary: AppColorsLight.brandAccent600,
          onSecondary: AppColorsLight.brandAccentFg,
          surface: AppColorsLight.surfaceSurface,
          onSurface: AppColorsLight.textFg,
          onSurfaceVariant: AppColorsLight.textSecondary,
          surfaceContainerLowest: AppColorsLight.surfacePage,
          surfaceContainerLow: AppColorsLight.surfaceRaised,
          surfaceContainerHighest: AppColorsLight.surfaceOverlay,
          error: AppColorsLight.statusErrorFg,
          onError: AppColorsLight.textInverse,
          errorContainer: AppColorsLight.statusErrorSubtle,
          onErrorContainer: AppColorsLight.textFg,
          outline: AppColorsLight.borderDefault,
          outlineVariant: AppColorsLight.borderStrong,
          inverseSurface: AppColorsLight.textFg,
          onInverseSurface: AppColorsLight.textInverse,
        ),
        semanticColors: AppSemanticColors.light(),
        shadows: AppShadows.light(),
        scaffoldBackground: AppColorsLight.surfacePage,
        textColor: AppColorsLight.textFg,
      );

  static ThemeData dark() => _build(
        brightness: Brightness.dark,
        colorScheme: const ColorScheme.dark(
          primary: AppColorsDark.brandAccent,
          onPrimary: AppColorsDark.brandAccentFg,
          primaryContainer: AppColorsDark.brandAccentSubtle,
          onPrimaryContainer: AppColorsDark.textFg,
          secondary: AppColorsDark.brandAccent400,
          onSecondary: AppColorsDark.brandAccentFg,
          surface: AppColorsDark.surfaceSurface,
          onSurface: AppColorsDark.textFg,
          onSurfaceVariant: AppColorsDark.textSecondary,
          surfaceContainerLowest: AppColorsDark.surfacePage,
          surfaceContainerLow: AppColorsDark.surfaceRaised,
          surfaceContainerHighest: AppColorsDark.surfaceOverlay,
          error: AppColorsDark.statusErrorFg,
          onError: AppColorsDark.textInverse,
          errorContainer: AppColorsDark.statusErrorSubtle,
          onErrorContainer: AppColorsDark.textFg,
          outline: AppColorsDark.borderDefault,
          outlineVariant: AppColorsDark.borderStrong,
          inverseSurface: AppColorsDark.textFg,
          onInverseSurface: AppColorsDark.textInverse,
        ),
        semanticColors: AppSemanticColors.dark(),
        shadows: AppShadows.dark(),
        scaffoldBackground: AppColorsDark.surfacePage,
        textColor: AppColorsDark.textFg,
      );

  static ThemeData _build({
    required Brightness brightness,
    required ColorScheme colorScheme,
    required AppSemanticColors semanticColors,
    required AppShadows shadows,
    required Color scaffoldBackground,
    required Color textColor,
  }) {
    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: colorScheme,
      fontFamily: _sans,
      scaffoldBackgroundColor: scaffoldBackground,
      textTheme: _textTheme(textColor),
      extensions: <ThemeExtension<dynamic>>[semanticColors, shadows],
      cardTheme: CardThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
        ),
      ),
      // `InputDecorationThemeData`, not the legacy `InputDecorationTheme`
      // (now an InheritedTheme widget). ThemeData's ctor param is typed
      // `Object?` during the migration, so the wrong type compiles and only
      // misbehaves at runtime — pick the type the field actually declares.
      inputDecorationTheme: InputDecorationThemeData(
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
        ),
      ),
    );
  }

  /// Maps the token type scale onto Material's slots. `AppTextStyles.code`
  /// carries the *bare* mono family, which does not resolve for a packaged
  /// font — rewrite it with the prefixed name.
  static TextTheme _textTheme(Color color) {
    TextStyle sans(TextStyle style) =>
        style.copyWith(fontFamily: _sans, color: color);

    return TextTheme(
      displayLarge: sans(AppTextStyles.display),
      headlineLarge: sans(AppTextStyles.h1),
      headlineMedium: sans(AppTextStyles.h2),
      headlineSmall: sans(AppTextStyles.h3),
      titleLarge: sans(AppTextStyles.h4),
      bodyLarge: sans(AppTextStyles.body),
      bodyMedium: sans(AppTextStyles.body),
      bodySmall: sans(AppTextStyles.small),
      labelLarge: sans(AppTextStyles.label),
      labelSmall: sans(AppTextStyles.meta),
      titleSmall: AppTextStyles.code.copyWith(fontFamily: _mono, color: color),
    );
  }
}
