import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/features/settings/presentation/bloc/settings_state.dart';

/// Owns the Settings tab's local Appearance/Playback preferences. See
/// [SettingsState]'s doc comment for the in-memory-only caveat.
class SettingsCubit extends Cubit<SettingsState> {
  SettingsCubit() : super(const SettingsState());

  /// Cycle stops for [cyclePlaybackSpeed] — mirrors the player's own speed
  /// picker range.
  static const List<double> speeds = <double>[0.75, 1, 1.25, 1.5, 2];

  void toggleReduceMotion() =>
      emit(state.copyWith(reduceMotion: !state.reduceMotion));

  void toggleAutoplayNextLesson() =>
      emit(state.copyWith(autoplayNextLesson: !state.autoplayNextLesson));

  void toggleWifiOnlyDownloads() =>
      emit(state.copyWith(wifiOnlyDownloads: !state.wifiOnlyDownloads));

  void cycleTheme() {
    const values = AppThemePreference.values;
    emit(
      state.copyWith(theme: values[(state.theme.index + 1) % values.length]),
    );
  }

  void cycleTextSize() {
    const values = TextSizePreference.values;
    emit(
      state.copyWith(
        textSize: values[(state.textSize.index + 1) % values.length],
      ),
    );
  }

  void cycleSubtitles() {
    const values = SubtitlesPreference.values;
    emit(
      state.copyWith(
        subtitles: values[(state.subtitles.index + 1) % values.length],
      ),
    );
  }

  void cyclePlaybackSpeed() {
    final index = speeds.indexOf(state.playbackSpeed);
    emit(state.copyWith(playbackSpeed: speeds[(index + 1) % speeds.length]));
  }
}
