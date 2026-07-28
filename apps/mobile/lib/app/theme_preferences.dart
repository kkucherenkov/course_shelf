import 'package:flutter/material.dart';

import 'package:app_mobile/features/settings/presentation/bloc/settings_state.dart';

/// Maps the stored appearance preference to Flutter's [ThemeMode].
ThemeMode themeModeFrom(AppThemePreference pref) => switch (pref) {
  AppThemePreference.system => ThemeMode.system,
  AppThemePreference.light => ThemeMode.light,
  AppThemePreference.dark => ThemeMode.dark,
};

/// Text-scale factor for [TextSizePreference]; `1.0` is the platform default.
double textScaleFrom(TextSizePreference pref) => switch (pref) {
  TextSizePreference.small => 0.9,
  TextSizePreference.defaultSize => 1.0,
  TextSizePreference.large => 1.2,
};
