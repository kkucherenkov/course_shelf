import 'package:equatable/equatable.dart';
import 'package:flutter/widgets.dart' show Widget;

import 'package:app_mobile/features/player/domain/lesson_playback.dart';

/// An immutable read of the platform player, mirroring the fields web reads off
/// `HTMLVideoElement` in `apps/web/app/composables/useLessonPlayer.ts`
/// (`timeupdate`, `durationchange`, `progress`, `waiting`, `ended`, `error`).
class VideoPlaybackSnapshot extends Equatable {
  const VideoPlaybackSnapshot({
    this.position = Duration.zero,
    this.duration = Duration.zero,
    this.buffered = Duration.zero,
    this.isInitialized = false,
    this.isPlaying = false,
    this.isBuffering = false,
    this.isCompleted = false,
    this.errorMessage,
  });

  final Duration position;
  final Duration duration;
  final Duration buffered;

  /// False until the platform reports metadata; the resume seek waits on this
  /// (web's `loadedmetadata`).
  final bool isInitialized;

  final bool isPlaying;
  final bool isBuffering;

  /// The platform reported end-of-media (web's `ended`).
  final bool isCompleted;

  /// Non-null once the platform reports a decode/network failure.
  final String? errorMessage;

  @override
  List<Object?> get props => <Object?>[
    position,
    duration,
    buffered,
    isInitialized,
    isPlaying,
    isBuffering,
    isCompleted,
    errorMessage,
  ];
}

/// The player BLoC's port onto a video engine.
///
/// **Why this exists.** `video_player` has no decoder under `flutter test` —
/// there is no platform to answer its method channel — so a BLoC holding a
/// `VideoPlayerController` directly would be untestable. The BLoC depends on
/// this interface only; `data/video_player_adapter.dart` implements it against
/// the real plugin, and tests supply a fake. This is the same
/// interface-in-domain / implementation-in-data split the repositories use.
///
/// [buildSurface] is the one deliberate wart: it returns a [Widget], so this
/// domain file imports `package:flutter/widgets.dart` for that single type. A
/// decoded video frame has no representation *other* than a platform texture
/// widget — `video_player` exposes it only as `VideoPlayer(controller)` — so
/// hiding it behind a non-Widget type would mean re-implementing the texture
/// plumbing for no gain. Everything else here is plain Dart.
abstract interface class VideoPlaybackPort {
  /// Snapshots for every platform notification. Replays [snapshot] on listen
  /// so a late subscriber is never stuck on stale state.
  Stream<VideoPlaybackSnapshot> get snapshots;

  /// The latest snapshot, readable synchronously.
  VideoPlaybackSnapshot get snapshot;

  /// Opens [source] and reports readiness through [snapshots]. Replaces any
  /// previously opened source.
  Future<void> open(LessonVideoSource source);

  Future<void> play();
  Future<void> pause();
  Future<void> seek(Duration position);
  Future<void> setSpeed(double speed);
  Future<void> setMuted(bool muted);

  /// The platform texture. Valid only after [open]; renders into
  /// `AppPlayerChrome.videoSlot`.
  Widget buildSurface();

  Future<void> dispose();
}
