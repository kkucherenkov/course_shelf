import 'package:equatable/equatable.dart';

/// A course the user is part-way through — the Home "Continue watching" row.
///
/// Deliberately narrower than the wire `ContinueWatchingItem`: the row renders
/// a card and resumes a lesson, so it needs a title, a progress ratio and a
/// lesson to jump to. `percent` is dropped on purpose — the card family derives
/// its own percentage from [lessonsCompleted] / [lessonsTotal]
/// (`courseCardPercent`), exactly as web Home does, so carrying the server's
/// copy as well would give two sources of truth for one number.
class ContinueWatchingCourse extends Equatable {
  const ContinueWatchingCourse({
    required this.courseId,
    required this.courseTitle,
    required this.lessonsCompleted,
    required this.lessonsTotal,
    required this.lastSeenLessonId,
  });

  final String courseId;
  final String courseTitle;
  final int lessonsCompleted;
  final int lessonsTotal;

  /// The lesson the player opens when the card is tapped.
  final String lastSeenLessonId;

  @override
  List<Object?> get props => <Object?>[
        courseId,
        courseTitle,
        lessonsCompleted,
        lessonsTotal,
        lastSeenLessonId,
      ];
}

/// A newly-added course — the Home "Recently added" row.
class RecentlyAddedCourse extends Equatable {
  const RecentlyAddedCourse({
    required this.courseId,
    required this.courseTitle,
    required this.lessonCount,
  });

  final String courseId;
  final String courseTitle;
  final int lessonCount;

  @override
  List<Object?> get props => <Object?>[courseId, courseTitle, lessonCount];
}

/// Everything one Home render needs, fetched as a unit.
///
/// The three backing endpoints are independent, but Home presents a single
/// screen-level state (Loading | Loaded | Empty | Failed — E18-F01-S01), so
/// they are loaded and reported together rather than per-row as web Home does.
class HomeSummary extends Equatable {
  const HomeSummary({
    required this.continueWatching,
    required this.recentlyAdded,
    required this.libraryCount,
  });

  final List<ContinueWatchingCourse> continueWatching;
  final List<RecentlyAddedCourse> recentlyAdded;

  /// How many libraries are registered — gates the "Library" quick link, which
  /// has nothing to open at zero.
  final int libraryCount;

  /// True when neither row has anything to show. The quick links are static
  /// navigation and deliberately do not count towards this: a Home with no
  /// courses is still Empty, not Loaded-with-two-buttons.
  bool get isEmpty => continueWatching.isEmpty && recentlyAdded.isEmpty;

  @override
  List<Object?> get props =>
      <Object?>[continueWatching, recentlyAdded, libraryCount];
}
