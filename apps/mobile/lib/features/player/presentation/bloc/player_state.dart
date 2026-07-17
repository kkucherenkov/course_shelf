import 'package:equatable/equatable.dart';

import 'package:app_mobile/features/player/domain/lesson_playback.dart';

/// The player's mutually-exclusive lifecycle.
///
/// Mirrors the web `playerState` union in
/// `apps/web/app/composables/useLessonPlayer.ts`
/// (`idle | playing | paused | buffering | error | end`), with two deliberate
/// differences:
///
/// - web's `idle` is named [loading] here, matching the card's vocabulary;
///   both mean "no lesson resolved yet".
/// - `watching-offline` is **not** a member. The card and DESIGN_BRIEF §7.6
///   both list it alongside the others, but §7.6 also specifies it as an
///   *indicator* — "small icon + 'Watching offline' text under the title when
///   the lesson source is the local file" — and the `cs-mobile-lesson-player`
///   mockup renders that row while the player is `state="playing"`. Offline is
///   therefore concurrent with playback, not exclusive of it: as an enum member
///   it would make "paused, offline" and "buffering, offline" unrepresentable.
///   It lives on [PlayerState.watchingOffline] instead.
enum PlayerStatus { loading, playing, paused, buffering, endOfLesson, error }

/// Which portrait tab is showing (mockup order).
enum PlayerTab { sections, notes, bookmarks, materials }

/// Speed presets, mirroring web's `SPEEDS` in `useLessonPlayer.ts`.
const List<double> kPlaybackSpeeds = <double>[0.5, 1, 1.25, 1.5, 1.75, 2];

/// Sleep-timer presets offered in the settings overlay (DESIGN_BRIEF §7.6).
const List<Duration> kSleepTimerOptions = <Duration>[
  Duration(minutes: 15),
  Duration(minutes: 30),
  Duration(minutes: 60),
];

class PlayerState extends Equatable {
  const PlayerState({
    this.status = PlayerStatus.loading,
    this.lesson,
    this.sections = const <LessonOutlineSection>[],
    this.bookmarks = const <LessonBookmark>[],
    this.note = '',
    this.position = Duration.zero,
    this.duration = Duration.zero,
    this.buffered = Duration.zero,
    this.watchingOffline = false,
    this.isMuted = false,
    this.speed = 1,
    this.tab = PlayerTab.sections,
    this.addingBookmark = false,
    this.sleepTimer,
    this.errorMessage,
  });

  final PlayerStatus status;

  /// Null until `GET /lessons/{id}` resolves.
  final LessonPlayback? lesson;

  final List<LessonOutlineSection> sections;
  final List<LessonBookmark> bookmarks;
  final String note;

  final Duration position;
  final Duration duration;
  final Duration buffered;

  /// True when the resolved source is a local file — raises the "Watching
  /// offline" indicator. Orthogonal to [status]; see [PlayerStatus].
  final bool watchingOffline;

  final bool isMuted;
  final double speed;

  final PlayerTab tab;

  /// The Bookmarks tab's inline add row is open.
  final bool addingBookmark;

  /// Remaining sleep-timer duration; null when no timer is armed.
  final Duration? sleepTimer;

  final String? errorMessage;

  /// True once playback is live enough to show controls rather than a skeleton.
  bool get isReady => status != PlayerStatus.loading && lesson != null;

  /// 0..1 of [duration] buffered — `AppPlayerChrome.bufferedFraction`.
  double get bufferedFraction => _fractionOf(buffered);

  double _fractionOf(Duration part) {
    final int total = duration.inMilliseconds;
    if (total <= 0) return 0;
    return (part.inMilliseconds / total).clamp(0.0, 1.0);
  }

  /// Bookmark positions as 0..1 fractions — `AppPlayerChrome.bookmarkFractions`.
  List<double> get bookmarkFractions =>
      bookmarks.map((LessonBookmark b) => _fractionOf(b.position)).toList();

  PlayerState copyWith({
    PlayerStatus? status,
    LessonPlayback? lesson,
    List<LessonOutlineSection>? sections,
    List<LessonBookmark>? bookmarks,
    String? note,
    Duration? position,
    Duration? duration,
    Duration? buffered,
    bool? watchingOffline,
    bool? isMuted,
    double? speed,
    PlayerTab? tab,
    bool? addingBookmark,
    Duration? sleepTimer,
    bool clearSleepTimer = false,
    String? errorMessage,
    bool clearError = false,
  }) {
    return PlayerState(
      status: status ?? this.status,
      lesson: lesson ?? this.lesson,
      sections: sections ?? this.sections,
      bookmarks: bookmarks ?? this.bookmarks,
      note: note ?? this.note,
      position: position ?? this.position,
      duration: duration ?? this.duration,
      buffered: buffered ?? this.buffered,
      watchingOffline: watchingOffline ?? this.watchingOffline,
      isMuted: isMuted ?? this.isMuted,
      speed: speed ?? this.speed,
      tab: tab ?? this.tab,
      addingBookmark: addingBookmark ?? this.addingBookmark,
      sleepTimer: clearSleepTimer ? null : (sleepTimer ?? this.sleepTimer),
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }

  @override
  List<Object?> get props => <Object?>[
    status,
    lesson,
    sections,
    bookmarks,
    note,
    position,
    duration,
    buffered,
    watchingOffline,
    isMuted,
    speed,
    tab,
    addingBookmark,
    sleepTimer,
    errorMessage,
  ];
}
