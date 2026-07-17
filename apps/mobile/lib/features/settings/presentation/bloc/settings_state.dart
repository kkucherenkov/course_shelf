import 'package:equatable/equatable.dart';

/// Appearance theme preference. Display-only for this card — the app's real
/// `ThemeMode` wiring (`App.themeMode` in `main.dart`) stays `ThemeMode.system`
/// regardless; honouring this value app-wide is a follow-up.
enum AppThemePreference { system, light, dark }

/// Reading text-size preference. Display-only, same caveat as
/// [AppThemePreference].
enum TextSizePreference { small, defaultSize, large }

/// Subtitle-track preference. Display-only — there is no real subtitle-track
/// list to select from yet, so this is a two-value stand-in.
enum SubtitlesPreference { off, english }

/// Device-local Appearance/Playback preferences the Settings tab's toggles
/// and value rows expose.
///
/// In-memory only for this card: there is no `shared_preferences` (or
/// similar) dependency in `pubspec.yaml` yet.
/// TODO(E18): persist device preferences (needs shared_preferences).
///
/// Consuming these preferences elsewhere — actually honouring reduce-motion,
/// autoplay, Wi-Fi-only downloads, etc. app-wide — is explicitly out of scope
/// for this card.
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
