import 'package:dio/dio.dart';

import 'package:app_mobile/features/course_detail/domain/course_detail.dart';
import 'package:app_mobile/features/course_detail/domain/course_detail_repository.dart';

/// [CourseDetailRepository] backed by the catalog endpoints
/// (`/courses/{id}/outline`, `/courses/{id}/download-estimate`) over the
/// shared, interceptor-equipped [Dio].
///
/// Calls Dio directly rather than through the generated `app_api_client`,
/// same precedent as `HomeRepositoryImpl` (see that class's doc comment):
/// the generated package is currently unimportable (#168).
///
/// Paths use a leading slash and NO `/api/v1` prefix. `AppConfig.apiBaseUrl`
/// already ends in `/api/v1`, and Dio *string-concatenates* baseUrl + path,
/// so a path that re-prefixed `/api/v1` would resolve to
/// `/api/v1/api/v1/courses/...`.
class CourseDetailRepositoryImpl implements CourseDetailRepository {
  const CourseDetailRepositoryImpl(this._dio);

  final Dio _dio;

  @override
  Future<CourseDetailOutline> fetchOutline(String courseId) async {
    final String path = '/courses/$courseId/outline';
    final Response<Map<String, dynamic>> response;
    try {
      response = await _dio.get<Map<String, dynamic>>(path);
    } on DioException catch (error) {
      // Course access is course-level (a READ grant on its library) — a 403
      // here means the whole course is locked, not a single missing field.
      if (error.response?.statusCode == 403) {
        throw CourseAccessDeniedException(courseId);
      }
      rethrow;
    }

    final Map<String, dynamic> json = _require(response.data, path);
    final Object? course = json['course'];
    final Object? sections = json['sections'];
    if (course is! Map<String, dynamic> || sections is! List) {
      throw StateError('$path responded 2xx without course/sections');
    }

    return CourseDetailOutline(
      summary: _summaryFromJson(course),
      sections: sections
          .cast<Map<String, dynamic>>()
          .map(_sectionFromJson)
          .toList(),
    );
  }

  @override
  Future<CourseDownloadEstimate> fetchDownloadEstimate(String courseId) async {
    final String path = '/courses/$courseId/download-estimate';
    final Response<Map<String, dynamic>> response = await _dio
        .get<Map<String, dynamic>>(path);
    final Map<String, dynamic> json = _require(response.data, path);

    return CourseDownloadEstimate(
      courseId: json['courseId'] as String,
      totalBytes: (json['totalBytes'] as num).toInt(),
      lessonCount: (json['lessonCount'] as num).toInt(),
    );
  }

  Map<String, dynamic> _require(Map<String, dynamic>? data, String path) {
    if (data == null) {
      throw StateError('$path responded 2xx with an empty body');
    }
    return data;
  }

  // ── Wire → domain ─────────────────────────────────────────────────────────

  CourseDetailSummary _summaryFromJson(Map<String, dynamic> json) {
    final Object? progress = json['progress'];
    if (progress is! Map<String, dynamic>) {
      throw StateError('course outline summary missing progress');
    }
    return CourseDetailSummary(
      id: json['id'] as String,
      title: json['title'] as String,
      slug: json['slug'] as String?,
      description: json['description'] as String?,
      instructor: json['instructor'] as String?,
      librarySlug: json['librarySlug'] as String?,
      lessonsTotal: (json['lessonsTotal'] as num).toInt(),
      totalDurationSeconds: (json['totalDurationSeconds'] as num).toInt(),
      lessonsCompleted: (progress['lessonsCompleted'] as num).toInt(),
    );
  }

  CourseDetailSection _sectionFromJson(Map<String, dynamic> json) {
    final Object? lessons = json['lessons'];
    if (lessons is! List) {
      throw StateError('course outline section missing lessons');
    }
    return CourseDetailSection(
      id: json['id'] as String,
      position: (json['position'] as num).toInt(),
      title: json['title'] as String,
      totalDurationSeconds: (json['totalDurationSeconds'] as num).toInt(),
      lessons: lessons
          .cast<Map<String, dynamic>>()
          .map(_lessonFromJson)
          .toList(),
    );
  }

  CourseDetailLesson _lessonFromJson(Map<String, dynamic> json) {
    return CourseDetailLesson(
      id: json['id'] as String,
      position: (json['position'] as num).toInt(),
      title: json['title'] as String,
      durationSeconds: (json['durationSeconds'] as num).toInt(),
      hasMaterials: json['hasMaterials'] as bool,
      state: _lessonStateFrom(json['state'] as String?),
      progressPercent: (json['progressPercent'] as num).toInt(),
    );
  }

  /// The wire enum is kebab-case (`not-started`, `in-progress`).
  CourseDetailLessonState _lessonStateFrom(String? raw) => switch (raw) {
    'in-progress' => CourseDetailLessonState.inProgress,
    'completed' => CourseDetailLessonState.completed,
    'locked' => CourseDetailLessonState.locked,
    _ => CourseDetailLessonState.notStarted,
  };
}
