import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:app_mobile/features/settings/presentation/bloc/settings_state.dart';
import 'package:app_mobile/shared/preferences/settings_preferences_store.dart';

Future<SettingsPreferencesStore> storeWith(Map<String, Object> seed) async {
  SharedPreferences.setMockInitialValues(seed);
  return SettingsPreferencesStore(await SharedPreferences.getInstance());
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test(
    'load() returns SettingsState defaults when nothing is stored',
    () async {
      final store = await storeWith(<String, Object>{});
      expect(store.load(), const SettingsState());
    },
  );

  test('save() then load() round-trips every field', () async {
    final store = await storeWith(<String, Object>{});
    const saved = SettingsState(
      theme: AppThemePreference.dark,
      textSize: TextSizePreference.large,
      reduceMotion: true,
      autoplayNextLesson: false,
      playbackSpeed: 1.5,
      subtitles: SubtitlesPreference.english,
      wifiOnlyDownloads: false,
    );
    await store.save(saved);
    expect(store.load(), saved);
  });

  test('load() falls back to defaults for an unknown enum value', () async {
    final store = await storeWith(<String, Object>{
      'pref.theme': 'ultraviolet',
    });
    expect(store.load().theme, AppThemePreference.system);
  });

  test('PlaybackPreferences getters read the stored playback fields', () async {
    final store = await storeWith(<String, Object>{
      'pref.playbackSpeed': 1.25,
      'pref.autoplayNextLesson': false,
    });
    expect(store.playbackSpeed, 1.25);
    expect(store.autoplayNextLesson, isFalse);
  });

  test('PlaybackPreferences getters use defaults when unset', () async {
    final store = await storeWith(<String, Object>{});
    expect(store.playbackSpeed, 1.0);
    expect(store.autoplayNextLesson, isTrue);
  });
}
