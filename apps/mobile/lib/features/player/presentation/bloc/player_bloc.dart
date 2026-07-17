import 'dart:async';

import 'package:flutter/widgets.dart' show Widget;
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/features/player/domain/lesson_playback.dart';
import 'package:app_mobile/features/player/domain/lesson_player_repository.dart';
import 'package:app_mobile/features/player/domain/video_playback_port.dart';
import 'package:app_mobile/features/player/presentation/bloc/player_event.dart';
import 'package:app_mobile/features/player/presentation/bloc/player_state.dart';

/// How often a playing lesson's position reaches `progress_outbox`.
///
/// Matches web's `useProgressReporter.INTERVAL_MS` (10_000) so both clients
/// report at the same cadence, and matches the cap reasoning in
/// `shared/db/tables/progress_outbox.dart` ("The web player reports every 10s").
const Duration kProgressWriteInterval = Duration(seconds: 10);

/// Drives lesson playback: resolves the lesson and its source, translates
/// platform snapshots into [PlayerStatus], and write-throughs progress to the
/// local outbox.
///
/// A BLoC rather than a Cubit because the card specifies events + states, and
/// because playback genuinely is event-driven — [PlayerTicked] arrives from the
/// engine, not from a user gesture.
///
/// Never touches `video_player` directly: everything goes through
/// [VideoPlaybackPort], which is what makes this class testable at all (there
/// is no decoder under `flutter test`).
class PlayerBloc extends Bloc<PlayerEvent, PlayerState> {
  PlayerBloc({
    required LessonPlayerRepository repository,
    required LessonProgressRecorder progressRecorder,
    required VideoPlaybackPort playback,
    DateTime Function()? now,
  }) : _repository = repository,
       _recorder = progressRecorder,
       _playback = playback,
       _now = now ?? DateTime.now,
       super(const PlayerState()) {
    on<PlayerStarted>(_onStarted);
    on<PlayerRetryRequested>(_onRetry);
    on<PlayerTicked>(_onTicked);
    on<PlayerPlayPausePressed>(_onPlayPause);
    on<PlayerSeekRequested>(_onSeek);
    on<PlayerSkipRequested>(_onSkip);
    on<PlayerSpeedChanged>(_onSpeed);
    on<PlayerMuteToggled>(_onMute);
    on<PlayerTabChanged>(_onTabChanged);
    on<PlayerBookmarkAddToggled>(_onBookmarkAddToggled);
    on<PlayerBookmarkAdded>(_onBookmarkAdded);
    on<PlayerBookmarkDeleted>(_onBookmarkDeleted);
    on<PlayerNoteSaved>(_onNoteSaved);
    on<PlayerSleepTimerSet>(_onSleepTimerSet);
    on<PlayerSleepTimerTicked>(_onSleepTimerTicked);
    on<PlayerProgressFlushed>(_onProgressFlushed);

    _snapshotSub = _playback.snapshots.listen(
      (VideoPlaybackSnapshot s) => add(PlayerTicked(s)),
    );
  }

  final LessonPlayerRepository _repository;
  final LessonProgressRecorder _recorder;
  final VideoPlaybackPort _playback;
  final DateTime Function() _now;

  late final StreamSubscription<VideoPlaybackSnapshot> _snapshotSub;
  Timer? _sleepTicker;

  String? _lessonId;

  /// When the last outbox write happened. Seeded at the moment playback starts
  /// so the first write lands a full interval in — the same shape as web's
  /// `setInterval`, which is armed on play and fires only after 10s.
  DateTime? _lastProgressWriteAt;

  @override
  Future<void> close() async {
    await _snapshotSub.cancel();
    _sleepTicker?.cancel();
    await _playback.dispose();
    return super.close();
  }

  /// The engine's texture, for `AppPlayerChrome.videoSlot`.
  ///
  /// A plain pass-through rather than an event: a decoded video surface is not
  /// state a BLoC can hold or compare — it is a live platform texture owned by
  /// the engine. Routing it through [PlayerState] would mean putting a Widget
  /// in an Equatable value and rebuilding the texture on every tick.
  Widget buildVideoSurface() => _playback.buildSurface();

  /// Issues a signed material download URL, returning false when it fails.
  ///
  /// A command with a one-shot result rather than an event: nothing in
  /// [PlayerState] depends on it, and E19 owns actually fetching the bytes.
  /// Modelling it as state would add a status field the screen would then have
  /// to reset by hand.
  Future<bool> issueMaterialUrl(String materialId) async {
    final String? lessonId = _lessonId;
    if (lessonId == null) return false;
    try {
      await _repository.issueMaterialDownloadUrl(
        lessonId: lessonId,
        materialId: materialId,
      );
      return true;
    } on Object {
      return false;
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  Future<void> _onStarted(PlayerStarted event, Emitter<PlayerState> emit) async {
    _lessonId = event.lessonId;
    emit(const PlayerState());
    await _load(emit);
  }

  Future<void> _onRetry(
    PlayerRetryRequested event,
    Emitter<PlayerState> emit,
  ) async {
    emit(state.copyWith(status: PlayerStatus.loading, clearError: true));
    await _load(emit);
  }

  Future<void> _load(Emitter<PlayerState> emit) async {
    final String? lessonId = _lessonId;
    if (lessonId == null) return;

    try {
      final LessonPlayback lesson = await _repository.fetchLesson(lessonId);

      // The outline and the side panels are supporting content: a failure there
      // must not cost the user playback, so they degrade to empty rather than
      // taking the whole screen to `error`.
      final List<LessonOutlineSection> sections = await _safe(
        () => _repository.fetchCourseOutline(lesson.courseId),
        const <LessonOutlineSection>[],
      );
      final List<LessonBookmark> bookmarks = await _safe(
        () => _repository.fetchBookmarks(lessonId),
        const <LessonBookmark>[],
      );
      final String note =
          await _safe(() => _repository.fetchNote(lessonId), null) ?? '';

      final LessonVideoSource source = await _repository.resolveVideoSource(
        lessonId,
      );
      await _playback.open(source);

      if (lesson.resumeAt > Duration.zero) {
        await _playback.seek(lesson.resumeAt);
      }

      emit(
        state.copyWith(
          status: PlayerStatus.paused,
          lesson: lesson,
          sections: sections,
          bookmarks: bookmarks,
          note: note,
          position: lesson.resumeAt,
          duration: lesson.duration,
          watchingOffline: source.isOffline,
          clearError: true,
        ),
      );
    } on Object catch (error) {
      emit(
        state.copyWith(
          status: PlayerStatus.error,
          errorMessage: error.toString(),
        ),
      );
    }
  }

  Future<T> _safe<T>(Future<T> Function() op, T fallback) async {
    try {
      return await op();
    } on Object {
      return fallback;
    }
  }

  // ── Platform ticks ────────────────────────────────────────────────────────

  Future<void> _onTicked(PlayerTicked event, Emitter<PlayerState> emit) async {
    final VideoPlaybackSnapshot s = event.snapshot;

    // A tick that arrives before the lesson resolves (or after a load failure)
    // must not resurrect the screen out of `loading`/`error`.
    if (state.lesson == null || state.status == PlayerStatus.error) return;

    final PlayerStatus status = _statusFrom(s);

    // The engine reports `duration: 0` until metadata lands; keep the wire
    // duration we already have rather than flapping the scrubber to zero.
    final Duration duration = s.duration > Duration.zero
        ? s.duration
        : state.duration;

    emit(
      state.copyWith(
        status: status,
        position: s.position,
        duration: duration,
        buffered: s.buffered,
        errorMessage: status == PlayerStatus.error ? s.errorMessage : null,
        clearError: status != PlayerStatus.error,
      ),
    );

    if (status == PlayerStatus.endOfLesson) {
      // Web lets the tail position die with the page unless `beforeunload`
      // fires. Flushing on `ended` is a deliberate improvement: it is the one
      // position that decides whether the lesson reads as completed.
      await _writeProgress(force: true);
      return;
    }

    if (status == PlayerStatus.playing) {
      await _writeProgress();
    }
  }

  /// Mirrors `useLessonPlayer`'s handler precedence.
  ///
  /// `ended` outranks `error`: the web page comments that a video firing both
  /// should show the end banner, not the error overlay.
  PlayerStatus _statusFrom(VideoPlaybackSnapshot s) {
    if (s.isCompleted) return PlayerStatus.endOfLesson;
    if (s.errorMessage != null) return PlayerStatus.error;
    if (s.isBuffering) return PlayerStatus.buffering;
    return s.isPlaying ? PlayerStatus.playing : PlayerStatus.paused;
  }

  // ── Progress write-through ────────────────────────────────────────────────

  /// Enqueues into `progress_outbox` when the throttle allows, or always when
  /// [force]. E20 drains it; this card only writes.
  Future<void> _writeProgress({bool force = false}) async {
    final String? lessonId = _lessonId;
    final Duration duration = state.duration;

    // Web's `send()` bails on `!id || dur === 0` — an un-initialised lesson has
    // no meaningful percentage, and `durationSeconds` is required on the wire.
    if (lessonId == null || duration <= Duration.zero) return;

    final DateTime now = _now();
    if (!force) {
      final DateTime? last = _lastProgressWriteAt;
      if (last == null || now.difference(last) < kProgressWriteInterval) {
        return;
      }
    }

    _lastProgressWriteAt = now;
    try {
      await _recorder.enqueue(
        lessonId: lessonId,
        position: state.position,
        duration: duration,
        clientUpdatedAt: now,
      );
    } on Object {
      // Best-effort, exactly like web's swallowed network error: a failed
      // local write must never interrupt playback.
    }
  }

  Future<void> _onProgressFlushed(
    PlayerProgressFlushed event,
    Emitter<PlayerState> emit,
  ) => _writeProgress(force: true);

  // ── Transport ─────────────────────────────────────────────────────────────

  Future<void> _onPlayPause(
    PlayerPlayPausePressed event,
    Emitter<PlayerState> emit,
  ) async {
    if (!state.isReady) return;

    if (state.status == PlayerStatus.playing) {
      await _playback.pause();
      // Web keeps the tail only via `beforeunload`; on mobile a pause is the
      // natural checkpoint, and losing up to 10s here would be visible as a
      // resume position that lags what the user actually watched.
      await _writeProgress(force: true);
      emit(state.copyWith(status: PlayerStatus.paused));
      return;
    }

    // Replaying from the end restarts, mirroring a <video> element.
    if (state.status == PlayerStatus.endOfLesson) {
      await _playback.seek(Duration.zero);
    }

    // Arm the throttle window at the moment playback starts, so the first
    // write lands a full interval later rather than on the next tick.
    _lastProgressWriteAt = _now();
    await _playback.play();
    emit(state.copyWith(status: PlayerStatus.playing));
  }

  Future<void> _onSeek(PlayerSeekRequested event, Emitter<PlayerState> emit) async {
    if (!state.isReady) return;
    final Duration target = _clamp(event.position);
    await _playback.seek(target);
    emit(state.copyWith(position: target));
  }

  Future<void> _onSkip(PlayerSkipRequested event, Emitter<PlayerState> emit) async {
    if (!state.isReady) return;
    final Duration target = _clamp(
      state.position + Duration(seconds: event.seconds),
    );
    await _playback.seek(target);
    emit(state.copyWith(position: target));
  }

  Duration _clamp(Duration position) {
    if (position < Duration.zero) return Duration.zero;
    final Duration duration = state.duration;
    if (duration > Duration.zero && position > duration) return duration;
    return position;
  }

  Future<void> _onSpeed(PlayerSpeedChanged event, Emitter<PlayerState> emit) async {
    // Null means "advance to the next preset" — web's `chromeSpeed` cycles when
    // the control is tapped with the speed it already has.
    final double next = event.speed ?? _nextSpeed(state.speed);
    await _playback.setSpeed(next);
    emit(state.copyWith(speed: next));
  }

  double _nextSpeed(double current) {
    final int index = kPlaybackSpeeds.indexOf(current);
    if (index == -1) return 1;
    return kPlaybackSpeeds[(index + 1) % kPlaybackSpeeds.length];
  }

  Future<void> _onMute(PlayerMuteToggled event, Emitter<PlayerState> emit) async {
    final bool muted = !state.isMuted;
    await _playback.setMuted(muted);
    emit(state.copyWith(isMuted: muted));
  }

  // ── Panels ────────────────────────────────────────────────────────────────

  void _onTabChanged(PlayerTabChanged event, Emitter<PlayerState> emit) =>
      emit(state.copyWith(tab: event.tab));

  void _onBookmarkAddToggled(
    PlayerBookmarkAddToggled event,
    Emitter<PlayerState> emit,
  ) => emit(state.copyWith(addingBookmark: event.adding));

  Future<void> _onBookmarkAdded(
    PlayerBookmarkAdded event,
    Emitter<PlayerState> emit,
  ) async {
    final String? lessonId = _lessonId;
    if (lessonId == null) return;
    try {
      final LessonBookmark created = await _repository.createBookmark(
        lessonId: lessonId,
        position: event.position,
        label: event.label.isEmpty ? null : event.label,
      );
      final List<LessonBookmark> next = <LessonBookmark>[
        ...state.bookmarks,
        created,
      ]..sort((LessonBookmark a, LessonBookmark b) => a.position.compareTo(b.position));
      emit(state.copyWith(bookmarks: next, addingBookmark: false));
    } on Object {
      emit(state.copyWith(addingBookmark: false));
    }
  }

  Future<void> _onBookmarkDeleted(
    PlayerBookmarkDeleted event,
    Emitter<PlayerState> emit,
  ) async {
    try {
      await _repository.deleteBookmark(event.bookmarkId);
      emit(
        state.copyWith(
          bookmarks: state.bookmarks
              .where((LessonBookmark b) => b.id != event.bookmarkId)
              .toList(),
        ),
      );
    } on Object {
      // Leave the row in place — a delete that failed server-side must not
      // look like it succeeded.
    }
  }

  Future<void> _onNoteSaved(
    PlayerNoteSaved event,
    Emitter<PlayerState> emit,
  ) async {
    final String? lessonId = _lessonId;
    if (lessonId == null) return;
    emit(state.copyWith(note: event.body));
    try {
      await _repository.saveNote(lessonId: lessonId, body: event.body);
    } on Object {
      // AppNoteEditor owns the retry affordance via its own sync state.
    }
  }

  // ── Sleep timer ───────────────────────────────────────────────────────────

  void _onSleepTimerSet(PlayerSleepTimerSet event, Emitter<PlayerState> emit) {
    _sleepTicker?.cancel();
    final Duration? duration = event.duration;

    if (duration == null) {
      emit(state.copyWith(clearSleepTimer: true));
      return;
    }

    _sleepTicker = Timer.periodic(
      const Duration(seconds: 1),
      (_) => add(const PlayerSleepTimerTicked()),
    );
    emit(state.copyWith(sleepTimer: duration));
  }

  Future<void> _onSleepTimerTicked(
    PlayerSleepTimerTicked event,
    Emitter<PlayerState> emit,
  ) async {
    final Duration? remaining = state.sleepTimer;
    if (remaining == null) return;

    final Duration next = remaining - const Duration(seconds: 1);
    if (next > Duration.zero) {
      emit(state.copyWith(sleepTimer: next));
      return;
    }

    _sleepTicker?.cancel();
    _sleepTicker = null;
    await _playback.pause();
    await _writeProgress(force: true);
    emit(state.copyWith(status: PlayerStatus.paused, clearSleepTimer: true));
  }
}
