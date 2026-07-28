import 'package:equatable/equatable.dart';

/// Appearance theme preference. Drives `App.themeMode` in `main.dart`, where
/// the `SettingsCubit` sits above the `MaterialApp`.
enum AppThemePreference { system, light, dark }

/// Reading text-size preference. Applied app-wide as a `MediaQuery`
/// `textScaler` override, same place as [AppThemePreference].
enum TextSizePreference { small, defaultSize, large }

/// Subtitle-track preference. Display-only — there is no real subtitle-track
/// list to select from yet, so this is a two-value stand-in.
enum SubtitlesPreference { off, english }

/// Device-local Appearance/Playback preferences the Settings tab's toggles
/// and value rows expose.
///
/// Persisted device-local via `SettingsPreferencesStore`. `theme`, `textSize`,
/// `reduceMotion` are honoured app-wide in `App`; `playbackSpeed` and
/// `autoplayNextLesson` are honoured by `PlayerBloc`. `subtitles` (no real
/// subtitle track yet) and `wifiOnlyDownloads` (consumed by E19's
/// `DownloadsBloc`) are persisted but not yet honoured anywhere.
class SettingsState extends Equatable {
  const SettingsState({
    this.theme = AppThemePreference.system,
    this.textSize = TextSizePreference.defaultSize,
    this.reduceMotion = false,
    this.autoplayNextLesson = true,
    this.playbackSpeed = 1,
    this.subtitles = SubtitlesPreference.off,
    this.wifiOnlyDownloads = true,
  });

  final AppThemePreference theme;
  final TextSizePreference textSize;
  final bool reduceMotion;
  final bool autoplayNextLesson;
  final double playbackSpeed;
  final SubtitlesPreference subtitles;
  final bool wifiOnlyDownloads;

  SettingsState copyWith({
    AppThemePreference? theme,
    TextSizePreference? textSize,
    bool? reduceMotion,
    bool? autoplayNextLesson,
    double? playbackSpeed,
    SubtitlesPreference? subtitles,
    bool? wifiOnlyDownloads,
  }) {
    return SettingsState(
      theme: theme ?? this.theme,
      textSize: textSize ?? this.textSize,
      reduceMotion: reduceMotion ?? this.reduceMotion,
      autoplayNextLesson: autoplayNextLesson ?? this.autoplayNextLesson,
      playbackSpeed: playbackSpeed ?? this.playbackSpeed,
      subtitles: subtitles ?? this.subtitles,
      wifiOnlyDownloads: wifiOnlyDownloads ?? this.wifiOnlyDownloads,
    );
  }

  @override
  List<Object?> get props => <Object?>[
    theme,
    textSize,
    reduceMotion,
    autoplayNextLesson,
    playbackSpeed,
    subtitles,
    wifiOnlyDownloads,
  ];
}
