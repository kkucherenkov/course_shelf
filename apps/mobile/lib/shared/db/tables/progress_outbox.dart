import 'package:drift/drift.dart';

/// Pending progress writes, drained by E20 into `POST /api/v1/progress/batch`.
///
/// COALESCED, one row per lesson. The server is last-write-wins on
/// `clientUpdatedAt`, so only the newest write per lesson matters. The web
/// player reports every 10s (`useProgressReporter`), so an append-only table
/// would store 6 rows/min — an hour offline on one lesson is 360 rows, 359 of
/// which the server discards as stale, and `/progress/batch` caps at
/// `maxItems: 200`. Coalescing makes that overflow structurally impossible.
///
/// Columns are exactly `RecordProgressRequest`'s required set, so the drain
/// maps a row to a request field-for-field.
@DataClassName('ProgressOutboxEntry')
class ProgressOutbox extends Table {
  @override
  String get tableName => 'progress_outbox';

  /// Doubles as the coalescing key — the upsert target.
  TextColumn get lessonId => text()();

  IntColumn get positionSeconds => integer()();
  IntColumn get durationSeconds => integer()();

  /// The USER-ACTION instant. The server compares this against its own
  /// `lastSeenAt` to detect staleness — it is not the enqueue time.
  DateTimeColumn get clientUpdatedAt => dateTime()();

  /// The ENQUEUE instant, for E20's chronological drain ordering. Distinct
  /// from [clientUpdatedAt]: only that one carries wire meaning.
  DateTimeColumn get queuedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {lessonId};
}
