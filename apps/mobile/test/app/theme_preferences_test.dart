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
