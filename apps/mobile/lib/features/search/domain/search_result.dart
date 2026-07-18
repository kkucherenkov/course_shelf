import 'package:equatable/equatable.dart';

/// A course hit — the `SearchResultDto.courses[]` entries from GET `/search`.
class SearchCourseHit extends Equatable {
  const SearchCourseHit({
    required this.id,
    required this.libraryId,
    required this.title,
    required this.slug,
    required this.lessonsTotal,
  });

  final String id;
  final String libraryId;
  final String title;
  final String slug;
  final int lessonsTotal;

  @override
  List<Object?> get props => <Object?>[
    id,
    libraryId,
    title,
    slug,
    lessonsTotal,
  ];
}

/// A lesson hit — the `SearchResultDto.lessons[]` entries from GET `/search`.
///
/// Carries its parent course/section titles so the row can show breadcrumb
/// context ("Distributed Systems · Section 05") without a second round trip.
class SearchLessonHit extends Equatable {
  const SearchLessonHit({
    required this.id,
    required this.courseId,
    required this.courseTitle,
    required this.sectionTitle,
    required this.title,
    required this.position,
  });

  final String id;
  final String courseId;
  final String courseTitle;
  final String sectionTitle;
  final String title;
  final int position;

  @override
  List<Object?> get props => <Object?>[
    id,
    courseId,
    courseTitle,
    sectionTitle,
    title,
    position,
  ];
}

/// One `GET /search` response — two independently-capped result lists for a
/// single query.
class SearchResults extends Equatable {
  const SearchResults({
    required this.query,
    required this.courses,
    required this.lessons,
  });

  final String query;
  final List<SearchCourseHit> courses;
  final List<SearchLessonHit> lessons;

  /// True when neither list has a hit — drives the Search tab's no-results
  /// state.
  bool get isEmpty => courses.isEmpty && lessons.isEmpty;

  @override
  List<Object?> get props => <Object?>[query, courses, lessons];
}
