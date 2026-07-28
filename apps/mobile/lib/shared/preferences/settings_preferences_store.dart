import 'package:shared_preferences/shared_preferences.dart';

import 'package:app_mobile/features/settings/presentation/bloc/settings_state.dart';
import 'package:app_mobile/shared/preferences/playback_preferences.dart';

/// Device-local persistence for the Settings tab's preferences.
///
/// Scalar key-value data with no relational shape, so `shared_preferences`
/// rather than the Drift schema E19 migrates. Enums are stored by `.name` and
/// parsed back defensively: an unknown/renamed value falls back to the
/// [SettingsState] default rather than throwing out of [load].
class SettingsPreferencesStore implements PlaybackPreferences {
  SettingsPreferencesStore(this._prefs);

  final SharedPreferences _prefs;

  static const String _themeKey = 'pref.theme';
  static const String _textSizeKey = 'pref.textSize';
  static const String _reduceMotionKey = 'pref.reduceMotion';
  static const String _autoplayKey = 'pref.autoplayNextLesson';
  static const String _speedKey = 'pref.playbackSpeed';
  static const String _subtitlesKey = 'pref.subtitles';
  static const String _wifiOnlyKey = 'pref.wifiOnlyDownloads';

  SettingsState load() {
    const defaults = SettingsState();
    return SettingsState(
      theme: _enum(
        AppThemePreference.values,
        _prefs.getString(_themeKey),
        defaults.theme,
      ),
      textSize: _enum(
        TextSizePreference.values,
        _prefs.getString(_textSizeKey),
        defaults.textSize,
      ),
      reduceMotion: _prefs.getBool(_reduceMotionKey) ?? defaults.reduceMotion,
      autoplayNextLesson:
          _prefs.getBool(_autoplayKey) ?? defaults.autoplayNextLesson,
      playbackSpeed: _prefs.getDouble(_speedKey) ?? defaults.playbackSpeed,
      subtitles: _enum(
        SubtitlesPreference.values,
        _prefs.getString(_subtitlesKey),
        defaults.subtitles,
      ),
      wifiOnlyDownloads:
          _prefs.getBool(_wifiOnlyKey) ?? defaults.wifiOnlyDownloads,
    );
  }

  Future<void> save(SettingsState state) async {
    await _prefs.setString(_themeKey, state.theme.name);
    await _prefs.setString(_textSizeKey, state.textSize.name);
    await _prefs.setBool(_reduceMotionKey, state.reduceMotion);
    await _prefs.setBool(_autoplayKey, state.autoplayNextLesson);
    await _prefs.setDouble(_speedKey, state.playbackSpeed);
    await _prefs.setString(_subtitlesKey, state.subtitles.name);
    await _prefs.setBool(_wifiOnlyKey, state.wifiOnlyDownloads);
  }

  @override
  double get playbackSpeed =>
      _prefs.getDouble(_speedKey) ?? const SettingsState().playbackSpeed;

  @override
  bool get autoplayNextLesson =>
      _prefs.getBool(_autoplayKey) ?? const SettingsState().autoplayNextLesson;

  /// Parses [name] against [values] by `.name`, falling back to [fallback] for
  /// null or any value not in the enum.
  static T _enum<T extends Enum>(List<T> values, String? name, T fallback) {
    if (name == null) return fallback;
    for (final value in values) {
      if (value.name == name) return value;
    }
    return fallback;
  }
}
