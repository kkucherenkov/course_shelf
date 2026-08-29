import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:drift/drift.dart' show Value;

import 'package:app_mobile/features/course_detail/domain/course_detail.dart';
import 'package:app_mobile/features/course_detail/domain/course_detail_repository.dart';
import 'package:app_mobile/shared/db/app_database.dart';

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
/// **Offline reads.** A successful outline fetch is written through to
/// `cached_courses` / `cached_sections` / `cached_lessons`; a fetch that fails
/// for a network reason falls back to those tables. This is the read half of
/// the pair E20 completed on the write side — before it, a downloaded lesson
/// played offline but the screen that lists it could not draw without a round
/// trip.
///
/// The cache stores the DTO JSON verbatim in `payload` and replays it through
/// the same parsers the network path uses, so there is exactly one wire→domain
/// mapping and a schema change cannot make the two disagree.
///
/// [_cache] is optional so a caller with no database — a test, a widgetbook
/// story — gets the plain network behaviour.
class CourseDetailRepositoryImpl implements CourseDetailRepository {
  const CourseDetailRepositoryImpl(this._dio, {CachedCatalogDao? cache})
    : _cache = cache;

  final Dio _dio;
  final CachedCatalogDao? _cache;

  @override
  Future<CourseDetailOutline> fetchOutline(String courseId) async {
    final String path = '/courses/$courseId/outline';
    final Response<Map<String, dynamic>> response;
    try {
      response = await _dio.get<Map<String, dynamic>>(path);
    } on DioException catch (error) {
      // Course access is course-level (a READ grant on its library) — a 403
      // here means the whole course is locked, not a single missing field.
      //
      // Deliberately NOT served from cache: a revoked grant must lock the
      // screen immediately. Falling back here would let a stale row keep a
      // course readable after access was taken away.
      if (error.response?.statusCode == 403) {
        throw CourseAccessDeniedException(courseId);
      }
      final CourseDetailOutline? cached = await _readCached(courseId);
      if (cached != null) return cached;
      rethrow;
    }

    final Map<String, dynamic> json = _require(response.data, path);
    final Object? course = json['course'];
    final Object? sections = json['sections'];
    if (course is! Map<String, dynamic> || sections is! List) {
      throw StateError('$path responded 2xx without course/sections');
    }

    final CourseDetailOutline outline = CourseDetailOutline(
      summary: _summaryFromJson(course),
      sections: sections
          .cast<Map<String, dynamic>>()
          .map(_sectionFromJson)
          .toList(),
    );
    await _writeCached(courseId, course, sections.cast<Map<String, dynamic>>());
    return outline;
  }

  // ── Cache ─────────────────────────────────────────────────────────────────

  /// Write-through, after the response has parsed.
  ///
  /// Parsing first matters: a body that cannot be turned into a domain object
  /// must not be cached, or every later offline read replays the same failure.
  ///
  /// Lessons are stored as their own rows rather than left inside the section
  /// payload, so `lessonsForCourse` answers "every lesson in this course" with
  /// one indexed read — the query the downloads queue wanted and had to
  /// denormalise around when nothing populated these tables.
  Future<void> _writeCached(
    String courseId,
    Map<String, dynamic> course,
    List<Map<String, dynamic>> sections,
  ) async {
    final CachedCatalogDao? cache = _cache;
    if (cache == null) return;
    final DateTime now = DateTime.now().toUtc();
    try {
      await cache.upsertCourse(
        CachedCoursesCompanion(
          id: Value<String>(courseId),
          libraryId: Value<String>(course['libraryId'] as String? ?? ''),
          slug: Value<String>(course['slug'] as String? ?? ''),
          title: Value<String>(course['title'] as String? ?? ''),
          updatedAt: Value<DateTime>(
            DateTime.tryParse(course['updatedAt'] as String? ?? '')?.toUtc() ??
                now,
          ),
          cachedAt: Value<DateTime>(now),
          payload: Value<String>(jsonEncode(course)),
        ),
      );
      await cache.replaceOutline(
        courseId: courseId,
        sections: <CachedSectionsCompanion>[
          for (final Map<String, dynamic> s in sections)
            CachedSectionsCompanion(
              id: Value<String>(s['id'] as String),
              courseId: Value<String>(courseId),
              position: Value<int>((s['position'] as num?)?.toInt() ?? 0),
              cachedAt: Value<DateTime>(now),
              payload: Value<String>(jsonEncode(s)),
            ),
        ],
        lessons: <CachedLessonsCompanion>[
          for (final Map<String, dynamic> s in sections)
            for (final Map<String, dynamic> l
                in (s['lessons'] as List<dynamic>? ?? const <dynamic>[])
                    .cast<Map<String, dynamic>>())
              CachedLessonsCompanion(
                id: Value<String>(l['id'] as String),
                sectionId: Value<String>(s['id'] as String),
                courseId: Value<String>(courseId),
                position: Value<int>((l['position'] as num?)?.toInt() ?? 0),
                cachedAt: Value<DateTime>(now),
                payload: Value<String>(jsonEncode(l)),
              ),
        ],
      );
    } on Object {
      // A cache write must never fail a fetch that already succeeded — the
      // caller has its data.
    }
  }

  /// Read-back, replayed through the same parsers as the network path.
  ///
  /// Returns null when nothing is cached, when the course row is missing (so
  /// there is no summary to build), or when the stored JSON no longer parses —
  /// a rethrow of the original network error is more honest than a partial
  /// screen.
  Future<CourseDetailOutline?> _readCached(String courseId) async {
    final CachedCatalogDao? cache = _cache;
    if (cache == null) return null;
    try {
      final CachedCourse? course = await cache.courseById(courseId);
      if (course == null) return null;
      final List<CachedSection> sections = await cache.sectionsForCourse(
        courseId,
      );
      if (sections.isEmpty) return null;
      final List<CachedLesson> lessons = await cache.lessonsForCourse(courseId);

      final Map<String, List<Map<String, dynamic>>> bySection =
          <String, List<Map<String, dynamic>>>{};
      for (final CachedLesson l in lessons) {
        (bySection[l.sectionId] ??= <Map<String, dynamic>>[]).add(
          jsonDecode(l.payload) as Map<String, dynamic>,
        );
      }

      return CourseDetailOutline(
        summary: _summaryFromJson(
          jsonDecode(course.payload) as Map<String, dynamic>,
        ),
        sections: <CourseDetailSection>[
          for (final CachedSection s in sections)
            _sectionFromJson(<String, dynamic>{
              ...jsonDecode(s.payload) as Map<String, dynamic>,
              // Rebuilt from the lesson rows rather than trusted from the
              // section payload, so the two never drift.
              'lessons': bySection[s.id] ?? const <Map<String, dynamic>>[],
            }),
        ],
      );
    } on Object {
      return null;
    }
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
