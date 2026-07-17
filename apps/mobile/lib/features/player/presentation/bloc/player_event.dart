import 'package:equatable/equatable.dart';

import 'package:app_mobile/features/player/domain/video_playback_port.dart';
import 'package:app_mobile/features/player/presentation/bloc/player_state.dart';

sealed class PlayerEvent extends Equatable {
  const PlayerEvent();

  @override
  List<Object?> get props => <Object?>[];
}

/// Screen mounted — load the lesson, outline, bookmarks, note, and source.
class PlayerStarted extends PlayerEvent {
  const PlayerStarted(this.lessonId);

  final String lessonId;

  @override
  List<Object?> get props => <Object?>[lessonId];
}

/// The play/pause control was hit.
class PlayerPlayPausePressed extends PlayerEvent {
  const PlayerPlayPausePressed();
}

class PlayerSeekRequested extends PlayerEvent {
  const PlayerSeekRequested(this.position);

  final Duration position;

  @override
  List<Object?> get props => <Object?>[position];
}

/// Relative skip — `AppPlayerChrome.onSkip` fires ±10 on a double-tap.
class PlayerSkipRequested extends PlayerEvent {
  const PlayerSkipRequested(this.seconds);

  final int seconds;

  @override
  List<Object?> get props => <Object?>[seconds];
}

/// Advances to the next preset when [speed] is null (web's `chromeSpeed`
/// cycles), else sets it directly from the settings overlay.
class PlayerSpeedChanged extends PlayerEvent {
  const PlayerSpeedChanged([this.speed]);

  final double? speed;

  @override
  List<Object?> get props => <Object?>[speed];
}

class PlayerMuteToggled extends PlayerEvent {
  const PlayerMuteToggled();
}

/// Retry after an error — re-resolves the source (web's `onRetry`).
class PlayerRetryRequested extends PlayerEvent {
  const PlayerRetryRequested();
}

/// A snapshot from [VideoPlaybackPort.snapshots]. Internal: the screen never
/// adds this.
class PlayerTicked extends PlayerEvent {
  const PlayerTicked(this.snapshot);

  final VideoPlaybackSnapshot snapshot;

  @override
  List<Object?> get props => <Object?>[snapshot];
}

class PlayerTabChanged extends PlayerEvent {
  const PlayerTabChanged(this.tab);

  final PlayerTab tab;

  @override
  List<Object?> get props => <Object?>[tab];
}

/// Opens/closes the Bookmarks tab's inline add row.
class PlayerBookmarkAddToggled extends PlayerEvent {
  const PlayerBookmarkAddToggled({required this.adding});

  final bool adding;

  @override
  List<Object?> get props => <Object?>[adding];
}

class PlayerBookmarkAdded extends PlayerEvent {
  const PlayerBookmarkAdded({required this.position, this.label = ''});

  final Duration position;
  final String label;

  @override
  List<Object?> get props => <Object?>[position, label];
}

class PlayerBookmarkDeleted extends PlayerEvent {
  const PlayerBookmarkDeleted(this.bookmarkId);

  final String bookmarkId;

  @override
  List<Object?> get props => <Object?>[bookmarkId];
}

class PlayerNoteSaved extends PlayerEvent {
  const PlayerNoteSaved(this.body);

  final String body;

  @override
  List<Object?> get props => <Object?>[body];
}

/// Arms ([duration] non-null) or cancels the sleep timer.
class PlayerSleepTimerSet extends PlayerEvent {
  const PlayerSleepTimerSet(this.duration);

  final Duration? duration;

  @override
  List<Object?> get props => <Object?>[duration];
}

/// One second of armed sleep-timer countdown elapsed. Internal.
class PlayerSleepTimerTicked extends PlayerEvent {
  const PlayerSleepTimerTicked();
}

/// Write the current position to `progress_outbox` regardless of the 10s
/// throttle — app backgrounded, or the screen popped. Mirrors web's flush on
/// `visibilitychange` / `beforeunload`.
class PlayerProgressFlushed extends PlayerEvent {
  const PlayerProgressFlushed();
}
