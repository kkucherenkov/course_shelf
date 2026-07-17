import 'package:dio/dio.dart';

import 'package:app_mobile/features/player/domain/lesson_playback.dart';
import 'package:app_mobile/features/player/domain/lesson_player_repository.dart';
import 'package:app_mobile/shared/db/app_database.dart';
import 'package:app_mobile/shared/db/tables/downloaded_lessons.dart';

/// [LessonPlayerRepository] over the versioned REST API.
///
/// **Why Dio by hand and not the generated `app_api_client`.** The generated
/// package cannot currently be imported at all: `pnpm spec:codegen` points
/// `openapi-generator` at `packages/api-client-dart/lib/generated`, so it emits
/// a *complete nested package* (its own `pubspec.yaml` + `lib/src/...`) inside
/// the outer package's `lib/`. Every generated file then self-imports
/// `package:app_api_client/src/...`, which resolves against the OUTER pubspec
/// to `packages/api-client-dart/lib/src/` — a directory that does not exist.
/// The barrel therefore exports nothing and `StreamingApi` is an undefined
/// name. `apps/mobile` has declared the dependency since E15 but nothing had
/// ever imported it, so this was invisible until now. Fixing it means changing
/// the codegen output path to the package root and regenerating — its own
/// commit, per the spec-first loop, and its own card.
///
/// Until then this mirrors the established `features/auth/data/auth_api.dart`
/// precedent: Dio directly against the documented paths, with the shared
/// interceptor supplying the bearer token. Every route below already exists in
/// `packages/specs/openapi/openapi.yaml` — this card's `Spec diff` is `none`.
class LessonPlayerApi implements LessonPlayerRepository {
  LessonPlayerApi({required Dio dio, required DownloadsDao downloadsDao})
    : _dio = dio,
      _downloadsDao = downloadsDao;

  final Dio _dio;
  final DownloadsDao _downloadsDao;

  @override
  Future<LessonPlayback> fetchLesson(String lessonId) async {
    final Response<Map<String, dynamic>> response = await _dio
        .get<Map<String, dynamic>>('/api/v1/lessons/$lessonId');
    final Map<String, dynamic> json = _require(response.data);
    return _lessonFromJson(json);
  }

  @override
  Future<List<LessonOutlineSection>> fetchCourseOutline(String courseId) async {
    final Response<Map<String, dynamic>> response = await _dio
        .get<Map<String, dynamic>>('/api/v1/courses/$courseId/outline');
    final Map<String, dynamic> json = _require(response.data);
    final List<dynamic> sections = json['sections'] as List<dynamic>? ?? const <dynamic>[];
    return sections
        .cast<Map<String, dynamic>>()
        .map(_sectionFromJson)
        .toList();
  }

  @override
  Future<LessonVideoSource> resolveVideoSource(String lessonId) async {
    // A completed download wins over the network — that is what raises the
    // "Watching offline" indicator (DESIGN_BRIEF §7.6).
    final DownloadedLesson? download = await _downloadsDao.byLessonId(lessonId);
    if (download != null && download.state == DownloadState.ready) {
      return LessonVideoSource.localFile(download.filePath);
    }

    final Response<Map<String, dynamic>> response = await _dio
        .post<Map<String, dynamic>>('/api/v1/lessons/$lessonId/stream-url');
    final Map<String, dynamic> json = _require(response.data);
    return LessonVideoSource.network(_resolveUrl(json['url'] as String));
  }

  /// The backend returns a same-origin relative path so it never has to know
  /// its own public hostname — web resolves it against `apiBaseUrl` in
  /// `useStreamUrl.ts`, and Dio's `baseUrl` is that same origin.
  String _resolveUrl(String raw) {
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    final String base = _dio.options.baseUrl;
    if (base.isEmpty) return raw;
    return Uri.parse(base).resolve(raw).toString();
  }

  @override
  Future<List<LessonBookmark>> fetchBookmarks(String lessonId) async {
    final Response<Map<String, dynamic>> response = await _dio
        .get<Map<String, dynamic>>('/api/v1/lessons/$lessonId/bookmarks');
    final Map<String, dynamic> json = _require(response.data);
    final List<dynamic> items = json['items'] as List<dynamic>? ?? const <dynamic>[];
    return items
        .cast<Map<String, dynamic>>()
        .map(_bookmarkFromJson)
        .toList();
  }

  @override
  Future<LessonBookmark> createBookmark({
    required String lessonId,
    required Duration position,
    String? label,
  }) async {
    final Response<Map<String, dynamic>> response = await _dio
        .post<Map<String, dynamic>>(
          '/api/v1/lessons/$lessonId/bookmarks',
          data: <String, dynamic>{
            'positionSeconds': position.inSeconds,
            'label': ?label,
          },
        );
    return _bookmarkFromJson(_require(response.data));
  }

  @override
  Future<void> deleteBookmark(String bookmarkId) =>
      _dio.delete<void>('/api/v1/bookmarks/$bookmarkId');

  @override
  Future<String?> fetchNote(String lessonId) async {
    try {
      final Response<Map<String, dynamic>> response = await _dio
          .get<Map<String, dynamic>>('/api/v1/notes/$lessonId');
      return response.data?['body'] as String?;
    } on DioException catch (error) {
      // A lesson with no note yet is the normal case, not a failure.
      if (error.response?.statusCode == 404) return null;
      rethrow;
    }
  }

  @override
  Future<void> saveNote({required String lessonId, required String body}) =>
      _dio.put<void>(
        '/api/v1/notes',
        data: <String, dynamic>{'lessonId': lessonId, 'body': body},
      );

  @override
  Future<String> issueMaterialDownloadUrl({
    required String lessonId,
    required String materialId,
  }) async {
    final Response<Map<String, dynamic>> response = await _dio
        .post<Map<String, dynamic>>(
          '/api/v1/lessons/$lessonId/materials/$materialId/download-url',
        );
    return _resolveUrl(_require(response.data)['url'] as String);
  }

  Map<String, dynamic> _require(Map<String, dynamic>? data) {
    if (data == null) throw const FormatException('Empty response body');
    return data;
  }

  // ── Wire → domain ─────────────────────────────────────────────────────────

  LessonPlayback _lessonFromJson(Map<String, dynamic> json) {
    final Map<String, dynamic>? progress =
        json['progress'] as Map<String, dynamic>?;
    final List<dynamic> materials =
        json['materials'] as List<dynamic>? ?? const <dynamic>[];

    return LessonPlayback(
      id: json['id'] as String,
      courseId: json['courseId'] as String,
      sectionId: json['sectionId'] as String,
      title: json['title'] as String,
      // `durationSeconds` is nullable on the wire.
      duration: Duration(seconds: (json['durationSeconds'] as int?) ?? 0),
      resumeAt: Duration(
        seconds: (progress?['lastSeenAtSeconds'] as int?) ?? 0,
      ),
      materials: materials
          .cast<Map<String, dynamic>>()
          .map(_materialFromJson)
          .toList(),
    );
  }

  LessonMaterial _materialFromJson(Map<String, dynamic> json) => LessonMaterial(
    id: json['id'] as String,
    kind: json['kind'] as String? ?? 'file',
    label: json['label'] as String? ?? '',
    sizeBytes: (json['sizeBytes'] as int?) ?? 0,
  );

  LessonOutlineSection _sectionFromJson(Map<String, dynamic> json) {
    final List<dynamic> lessons =
        json['lessons'] as List<dynamic>? ?? const <dynamic>[];
    return LessonOutlineSection(
      id: json['id'] as String,
      position: (json['position'] as int?) ?? 0,
      title: json['title'] as String? ?? '',
      totalDuration: Duration(
        seconds: (json['totalDurationSeconds'] as int?) ?? 0,
      ),
      lessons: lessons
          .cast<Map<String, dynamic>>()
          .map(_outlineEntryFromJson)
          .toList(),
    );
  }

  LessonOutlineEntry _outlineEntryFromJson(Map<String, dynamic> json) =>
      LessonOutlineEntry(
        id: json['id'] as String,
        position: (json['position'] as int?) ?? 0,
        title: json['title'] as String? ?? '',
        duration: Duration(seconds: (json['durationSeconds'] as int?) ?? 0),
        state: _outlineStateFrom(json['state'] as String?),
        progressPercent: (json['progressPercent'] as int?) ?? 0,
        hasMaterials: (json['hasMaterials'] as bool?) ?? false,
      );

  /// The wire enum is kebab/snake-free (`not-started`, `in-progress`).
  LessonOutlineEntryState _outlineStateFrom(String? raw) => switch (raw) {
    'in-progress' => LessonOutlineEntryState.inProgress,
    'completed' => LessonOutlineEntryState.completed,
    'locked' => LessonOutlineEntryState.locked,
    _ => LessonOutlineEntryState.notStarted,
  };

  LessonBookmark _bookmarkFromJson(Map<String, dynamic> json) => LessonBookmark(
    id: json['id'] as String,
    position: Duration(seconds: (json['positionSeconds'] as int?) ?? 0),
    label: json['label'] as String? ?? '',
  );
}
