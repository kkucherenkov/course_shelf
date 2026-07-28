/// The narrow slice of device preferences the player reads.
///
/// `PlayerBloc` depends on this — not on the whole [SettingsPreferencesStore] —
/// so the player is coupled only to the two values it actually consumes
/// (interface-segregation), and its test fake implements just these getters.
abstract interface class PlaybackPreferences {
  /// The saved playback rate a lesson opens at (defaults to `1.0`).
  double get playbackSpeed;

  /// Whether finishing a lesson auto-advances to the next one (defaults `true`).
  bool get autoplayNextLesson;
}
