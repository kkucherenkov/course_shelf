import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/features/settings/presentation/bloc/settings_cubit.dart';
import 'package:app_mobile/features/settings/presentation/bloc/settings_state.dart';

void main() {
  test('starts with the documented defaults', () {
    expect(SettingsCubit().state, const SettingsState());
    const defaults = SettingsState();
    expect(defaults.theme, AppThemePreference.system);
    expect(defaults.textSize, TextSizePreference.defaultSize);
    expect(defaults.reduceMotion, isFalse);
    expect(defaults.autoplayNextLesson, isTrue);
    expect(defaults.playbackSpeed, 1);
    expect(defaults.subtitles, SubtitlesPreference.off);
    expect(defaults.wifiOnlyDownloads, isTrue);
  });

  group('toggles flip in place and leave everything else untouched', () {
    blocTest<SettingsCubit, SettingsState>(
      'toggleReduceMotion',
      build: SettingsCubit.new,
      act: (cubit) => cubit.toggleReduceMotion(),
      expect: () => <SettingsState>[const SettingsState(reduceMotion: true)],
    );

    blocTest<SettingsCubit, SettingsState>(
      'toggleReduceMotion twice returns to false',
      build: SettingsCubit.new,
      act: (cubit) {
        cubit.toggleReduceMotion();
        cubit.toggleReduceMotion();
      },
      expect: () => <SettingsState>[
        const SettingsState(reduceMotion: true),
        const SettingsState(),
      ],
    );

    blocTest<SettingsCubit, SettingsState>(
      'toggleAutoplayNextLesson',
      build: SettingsCubit.new,
      act: (cubit) => cubit.toggleAutoplayNextLesson(),
      expect: () => <SettingsState>[
        const SettingsState(autoplayNextLesson: false),
      ],
    );

    blocTest<SettingsCubit, SettingsState>(
      'toggleWifiOnlyDownloads',
      build: SettingsCubit.new,
      act: (cubit) => cubit.toggleWifiOnlyDownloads(),
      expect: () => <SettingsState>[
        const SettingsState(wifiOnlyDownloads: false),
      ],
    );
  });

  group('value rows cycle through their allowed values', () {
    blocTest<SettingsCubit, SettingsState>(
      'cycleTheme walks system -> light -> dark -> system',
      build: SettingsCubit.new,
      act: (cubit) {
        cubit.cycleTheme();
        cubit.cycleTheme();
        cubit.cycleTheme();
      },
      expect: () => <SettingsState>[
        const SettingsState(theme: AppThemePreference.light),
        const SettingsState(theme: AppThemePreference.dark),
        const SettingsState(),
      ],
    );

    blocTest<SettingsCubit, SettingsState>(
      'cycleTextSize walks default -> large -> small -> default',
      build: SettingsCubit.new,
      act: (cubit) {
        cubit.cycleTextSize();
        cubit.cycleTextSize();
        cubit.cycleTextSize();
      },
      expect: () => <SettingsState>[
        const SettingsState(textSize: TextSizePreference.large),
        const SettingsState(textSize: TextSizePreference.small),
        const SettingsState(),
      ],
    );

    blocTest<SettingsCubit, SettingsState>(
      'cycleSubtitles toggles off <-> english',
      build: SettingsCubit.new,
      act: (cubit) {
        cubit.cycleSubtitles();
        cubit.cycleSubtitles();
      },
      expect: () => <SettingsState>[
        const SettingsState(subtitles: SubtitlesPreference.english),
        const SettingsState(),
      ],
    );

    blocTest<SettingsCubit, SettingsState>(
      'cyclePlaybackSpeed walks the player speed ramp and wraps around',
      build: SettingsCubit.new,
      act: (cubit) {
        // Default is 1.0 — index 1 of [0.75, 1, 1.25, 1.5, 2] — so a full
        // walk starts at 1.25, not 0.75.
        for (var i = 0; i < SettingsCubit.speeds.length; i++) {
          cubit.cyclePlaybackSpeed();
        }
      },
      expect: () => <SettingsState>[
        const SettingsState(playbackSpeed: 1.25),
        const SettingsState(playbackSpeed: 1.5),
        const SettingsState(playbackSpeed: 2),
        const SettingsState(playbackSpeed: 0.75),
        const SettingsState(), // back to the 1.0 default
      ],
    );
  });
}
