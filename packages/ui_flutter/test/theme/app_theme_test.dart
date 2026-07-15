import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_ui/app_ui.dart';

import '../_support/fonts.dart';

void main() {
  group('AppTheme.light', () {
    final theme = AppTheme.light();

    test('uses the light brand accent as the primary colour', () {
      expect(theme.colorScheme.primary, AppColorsLight.brandAccent);
      expect(theme.colorScheme.onPrimary, AppColorsLight.brandAccentFg);
    });

    test('is a light Material 3 theme', () {
      expect(theme.brightness, Brightness.light);
      expect(theme.useMaterial3, isTrue);
    });

    test('names the packaged sans family', () {
      expect(theme.textTheme.bodyMedium?.fontFamily,
          'packages/app_ui/${AppFontFamily.sans}');
    });

    test('keeps the sans face in titleSmall', () {
      // titleSmall is the M3 default for TabBar labels, DataTable headings
      // and DatePicker — a mono face here renders every tab label in mono.
      // Assert POSITIVELY: `isNot(mono)` would only exclude the one spelling
      // we thought of, and would sail past `AppTextStyles.code`'s BARE mono
      // family — the exact form tokens.g.dart generates.
      expect(theme.textTheme.titleSmall?.fontFamily,
          'packages/app_ui/${AppFontFamily.sans}');
    });

    test('carries the semantic colour extension', () {
      final colors = theme.extension<AppSemanticColors>();
      expect(colors, isNotNull);
      expect(colors!.successFg, AppColorsLight.statusSuccessFg);
      expect(colors.accentScale.length, 11);
      expect(colors.accentScale.first, AppColorsLight.brandAccent50);
      expect(colors.accentScale.last, AppColorsLight.brandAccent950);
    });

    test('carries the shadow extension', () {
      expect(theme.extension<AppShadows>()?.md, AppShadowsLight.md);
    });
  });

  group('AppTheme.dark', () {
    final theme = AppTheme.dark();

    test('uses the dark brand accent as the primary colour', () {
      expect(theme.colorScheme.primary, AppColorsDark.brandAccent);
    });

    test('is a dark Material 3 theme', () {
      expect(theme.brightness, Brightness.dark);
    });

    test('carries dark semantic colours and shadows', () {
      expect(theme.extension<AppSemanticColors>()?.successFg,
          AppColorsDark.statusSuccessFg);
      expect(theme.extension<AppShadows>()?.md, AppShadowsDark.md);
    });
  });

  group('AppSemanticColors.lerp', () {
    test('interpolates towards the target', () {
      final light = AppSemanticColors.light();
      final dark = AppSemanticColors.dark();

      expect(light.lerp(dark, 0).successFg, light.successFg);
      expect(light.lerp(dark, 1).successFg, dark.successFg);
      expect(light.lerp(dark, 1).accentScale.last, dark.accentScale.last);
    });
  });

  // Asserting the family STRING proves nothing — an unresolved family falls
  // back silently and the string assertion still passes. Measure instead: a
  // fallback renders as Ahem, whose glyphs are all a uniform em square, so
  // proportional text measures exactly `chars * fontSize`.
  group('packaged fonts actually resolve', () {
    setUpAll(loadPackagedFonts);

    double widthOf(String family) {
      final painter = TextPainter(
        text: TextSpan(
          text: 'MMMMiiii',
          style: TextStyle(fontFamily: family, fontSize: 40),
        ),
        textDirection: TextDirection.ltr,
      )..layout();
      return painter.width;
    }

    test('sans renders the real face, not the Ahem fallback', () {
      // 8 chars * 40px = 320.0 exactly => Ahem fallback.
      expect(widthOf('packages/app_ui/${AppFontFamily.sans}'), isNot(320.0));
    });

    test('mono renders the real face, not the Ahem fallback', () {
      expect(widthOf('packages/app_ui/${AppFontFamily.mono}'), isNot(320.0));
    });

    test('the code accessor binds the packaged mono family', () {
      expect(AppTypography.code.fontFamily,
          'packages/app_ui/${AppFontFamily.mono}');
    });
  });
}
