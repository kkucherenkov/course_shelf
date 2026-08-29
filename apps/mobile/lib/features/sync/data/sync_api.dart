import 'package:dio/dio.dart';

/// Per-item verdict from `POST /api/v1/progress/batch`.
///
/// Mirrors the spec's `BatchProgressItemResult` discriminator exactly. All
/// three are terminal for the queued row — none is a reason to retry — but they
/// are kept distinct because they mean different things upstream: `stale`
/// carries the server's state, `forbidden` means the row can never succeed.
enum BatchItemStatus { accepted, stale, forbidden }

/// One entry of the batch response, paired back to its request by index.
class BatchItemResult {
  const BatchItemResult({required this.status, this.state});

  final BatchItemStatus status;

  /// The server's `LessonProgressDto`. Present for `accepted` and `stale`,
  /// absent for `forbidden` (which carries only the echoed `lessonId`).
  final Map<String, dynamic>? state;
}

/// The wire calls the drain makes.
///
/// Separate from `LessonPlayerApi` on purpose. That class is the player's
/// repository implementation and, after this card, enqueues writes rather than
/// sending them — if the drain went through it, draining would re-enqueue.
/// This one only ever talks to the network.
///
/// Paths carry no `/api/v1` prefix: `AppConfig.apiBaseUrl` already ends in it
/// and Dio concatenates rather than resolving. See
/// `test/shared/network/api_path_resolution_test.dart`.
class SyncApi {
  const SyncApi(this._dio);

  final Dio _dio;

  /// `POST /progress/batch`. Per-item failures do not abort the batch, so the
  /// response is the same length and order as [items].
  ///
  /// The caller must respect the endpoint's `maxItems: 200`; `ProgressOutboxDao
  /// .pending()` already defaults to that limit.
  Future<List<BatchItemResult>> sendProgressBatch(
    List<Map<String, dynamic>> items,
  ) async {
    final Response<Map<String, dynamic>> response = await _dio
        .post<Map<String, dynamic>>(
          '/progress/batch',
          data: <String, dynamic>{'items': items},
        );
    final List<dynamic> results =
        response.data?['results'] as List<dynamic>? ?? const <dynamic>[];
    return results
        .cast<Map<String, dynamic>>()
        .map(
          (Map<String, dynamic> raw) => BatchItemResult(
            status: _statusFrom(raw['status'] as String?),
            state: raw['state'] as Map<String, dynamic>?,
          ),
        )
        .toList();
  }

  /// `PUT /notes` — upsert. The spec requires `body` to be non-empty
  /// (`minLength: 1`); an emptied note is a delete, not a PUT of `""`, and the
  /// drain routes it accordingly.
  Future<void> upsertNote({required String lessonId, required String body}) =>
      _dio.put<void>(
        '/notes',
        data: <String, dynamic>{'lessonId': lessonId, 'body': body},
      );

  /// `DELETE /notes/{lessonId}`.
  Future<void> deleteNote(String lessonId) =>
      _dio.delete<void>('/notes/$lessonId');

  /// `POST /lessons/{lessonId}/bookmarks`. Returns the server-assigned id.
  ///
  /// `label` is omitted when null or empty — the spec gives it `minLength: 1`,
  /// so sending `""` is a 400 rather than "no label".
  Future<String> createBookmark({
    required String lessonId,
    required int positionSeconds,
    String? label,
  }) async {
    final Response<Map<String, dynamic>> response = await _dio
        .post<Map<String, dynamic>>(
          '/lessons/$lessonId/bookmarks',
          data: <String, dynamic>{
            'positionSeconds': positionSeconds,
            if (label != null && label.isNotEmpty) 'label': label,
          },
        );
    final String? id = response.data?['id'] as String?;
    if (id == null) {
      throw const FormatException('Bookmark create returned no id');
    }
    return id;
  }

  /// `PATCH /bookmarks/{id}`.
  ///
  /// Always sends `positionSeconds`: the spec rejects an empty patch with 400,
  /// and an outbox update row carries the bookmark's full desired state anyway.
  /// `label` is sent unconditionally — including as an explicit `null`, which
  /// is how the spec says to clear it.
  Future<void> updateBookmark({
    required String id,
    required int positionSeconds,
    required String? label,
  }) => _dio.patch<void>(
    '/bookmarks/$id',
    data: <String, dynamic>{'positionSeconds': positionSeconds, 'label': label},
  );

  /// `DELETE /bookmarks/{id}`.
  Future<void> deleteBookmark(String id) => _dio.delete<void>('/bookmarks/$id');

  static BatchItemStatus _statusFrom(String? raw) => switch (raw) {
    'accepted' => BatchItemStatus.accepted,
    'stale' => BatchItemStatus.stale,
    'forbidden' => BatchItemStatus.forbidden,
    // An unknown discriminator is a spec/client skew. Treating it as
    // `forbidden` drops the row rather than retrying it forever against a
    // server that will keep answering the same way.
    _ => BatchItemStatus.forbidden,
  };
}
