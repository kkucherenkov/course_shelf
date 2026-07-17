import 'package:equatable/equatable.dart';

/// One row of the Browse catalog grid — the `CourseDto` entries from
/// `GET /courses`, trimmed to what [CoursePosterCard] (`app_ui`) needs.
class BrowseCourse extends Equatable {
  const BrowseCourse({
    required this.id,
    required this.title,
    required this.instructor,
    required this.lessonsCompleted,
    required this.lessonsTotal,
  });

  final String id;
  final String title;

  /// Comma-joined `instructors[].displayName` (mirrors web Browse's
  /// `toCourse`). Empty when the course carries no linked instructors — the
  /// card then omits the instructor line entirely rather than rendering a
  /// blank one.
  final String instructor;
  final int lessonsCompleted;
  final int lessonsTotal;

  @override
  List<Object?> get props => <Object?>[
    id,
    title,
    instructor,
    lessonsCompleted,
    lessonsTotal,
  ];
}

/// A library — the Browse filter sheet's Library options, from
/// `GET /libraries`.
class BrowseLibrary extends Equatable {
  const BrowseLibrary({required this.id, required this.name});

  final String id;
  final String name;

  @override
  List<Object?> get props => <Object?>[id, name];
}
