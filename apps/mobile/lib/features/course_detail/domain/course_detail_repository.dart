import 'package:app_mobile/features/course_detail/domain/course_detail.dart';

/// Port — everything the Course-detail screen reads. Implementations live in
/// `data/`.
abstract class CourseDetailRepository {
  /// Loads the course summary + full curriculum in one round-trip
  /// (`GET /courses/{id}/outline`).
  ///
  /// Throws [CourseAccessDeniedException] on a 403 (no READ grant on the
  /// course's library) so the cubit can show the no-access variant instead of
  /// the generic failed one. Throws for any other failure (network, 404,
  /// malformed payload).
  Future<CourseDetailOutline> fetchOutline(String courseId);

  /// Loads the real download size (`GET /courses/{id}/download-estimate`).
  ///
  /// Independent of [fetchOutline] — the cubit fetches both in parallel and
  /// lets this one fail soft, since the byte total is a nice-to-have on the
  /// secondary CTA, not a screen-blocking dependency.
  Future<CourseDownloadEstimate> fetchDownloadEstimate(String courseId);
}

/// Sentinel for a 403 on [CourseDetailRepository.fetchOutline].
///
/// Access to a course is course-level (a READ grant on its library, mirroring
/// `getCourse`), so a 403 here means the whole course is locked, not a single
/// missing field — the cubit maps this to `CourseDetailStatus.noAccess`
/// rather than the generic `CourseDetailStatus.failed`.
class CourseAccessDeniedException implements Exception {
  const CourseAccessDeniedException(this.courseId);

  final String courseId;

  @override
  String toString() => 'CourseAccessDeniedException($courseId)';
}
