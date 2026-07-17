import 'package:app_mobile/features/player/domain/lesson_playback.dart';

/// Everything the player screen reads or writes over the wire.
///
/// Every route here already exists in `packages/specs/openapi/openapi.yaml`
/// (card E18-F02-S01: *Spec diff: none*).
abstract interface class LessonPlayerRepository {
  /// `GET /api/v1/lessons/{id}`.
  Future<LessonPlayback> fetchLesson(String lessonId);

  /// `GET /api/v1/courses/{id}/outline` — the Sections tab.
  Future<List<LessonOutlineSection>> fetchCourseOutline(String courseId);

  /// A ready local download when one exists, else `POST /lessons/{id}/stream-url`.
  Future<LessonVideoSource> resolveVideoSource(String lessonId);

  /// `GET /api/v1/lessons/{lessonId}/bookmarks`.
  Future<List<LessonBookmark>> fetchBookmarks(String lessonId);

  /// `POST /api/v1/lessons/{lessonId}/bookmarks`.
  Future<LessonBookmark> createBookmark({
    required String lessonId,
    required Duration position,
    String? label,
  });

  /// `DELETE /api/v1/bookmarks/{id}`.
  Future<void> deleteBookmark(String bookmarkId);

  /// `GET /api/v1/notes/{lessonId}` — null when the lesson has no note yet.
  Future<String?> fetchNote(String lessonId);

  /// `PUT /api/v1/notes`.
  Future<void> saveNote({required String lessonId, required String body});

  /// `POST /api/v1/lessons/{lessonId}/materials/{materialId}/download-url`.
  ///
  /// Mobile is this endpoint's first real consumer — web still renders
  /// "coming soon" for materials (card note).
  Future<String> issueMaterialDownloadUrl({
    required String lessonId,
    required String materialId,
  });
}

/// Write-through of playback progress into the local `progress_outbox`.
///
/// Deliberately separate from [LessonPlayerRepository]: this card *only*
/// enqueues. Draining the outbox into `POST /api/v1/progress/batch` is E20's
/// job, and keeping the port this narrow is what stops the player from
/// growing a sync path it does not own.
abstract interface class LessonProgressRecorder {
  Future<void> enqueue({
    required String lessonId,
    required Duration position,
    required Duration duration,
    required DateTime clientUpdatedAt,
  });
}
