import 'package:drift/drift.dart' show Value;

import 'package:app_mobile/features/player/domain/lesson_player_repository.dart';
import 'package:app_mobile/shared/db/app_database.dart';

/// Write-through of playback position into the shared `progress_outbox`.
///
/// Uses the existing [ProgressOutboxDao] (E15-F02-S01) rather than any storage
/// of its own. The DAO upserts on `lessonId`, so the table stays one row per
/// lesson no matter how long the player runs — the coalescing the table was
/// designed for.
///
/// Enqueue only. `POST /api/v1/progress/batch` is E20's to call.
class ProgressOutboxRecorder implements LessonProgressRecorder {
  ProgressOutboxRecorder(this._dao);

  final ProgressOutboxDao _dao;

  @override
  Future<void> enqueue({
    required String lessonId,
    required Duration position,
    required Duration duration,
    required DateTime clientUpdatedAt,
  }) {
    return _dao.enqueue(
      ProgressOutboxCompanion(
        lessonId: Value<String>(lessonId),
        positionSeconds: Value<int>(position.inSeconds),
        durationSeconds: Value<int>(duration.inSeconds),
        // The user-action instant — the server compares it against its own
        // `lastSeenAt` to reject a stale write.
        clientUpdatedAt: Value<DateTime>(clientUpdatedAt),
        // The enqueue instant, for E20's chronological drain.
        queuedAt: Value<DateTime>(DateTime.now()),
      ),
    );
  }
}
