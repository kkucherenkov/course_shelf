import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/features/player/data/progress_outbox_recorder.dart';
import 'package:app_mobile/shared/db/app_database.dart';

/// The recorder against the real Drift schema — the fake in `player_fakes.dart`
/// proves the BLoC's throttle, this proves the row that actually lands.
void main() {
  late AppDatabase db;
  late ProgressOutboxRecorder recorder;

  setUp(() {
    db = AppDatabase(NativeDatabase.memory());
    recorder = ProgressOutboxRecorder(ProgressOutboxDao(db));
  });

  tearDown(() => db.close());

  test('writes the columns /progress/batch requires', () async {
    final DateTime updatedAt = DateTime.utc(2026, 7, 17, 12, 30);

    await recorder.enqueue(
      lessonId: 'lesson-1',
      position: const Duration(minutes: 4, seconds: 30),
      duration: const Duration(minutes: 26, seconds: 18),
      clientUpdatedAt: updatedAt,
    );

    final List<ProgressOutboxEntry> pending = await ProgressOutboxDao(
      db,
    ).pending();

    expect(pending, hasLength(1));
    expect(pending.single.lessonId, 'lesson-1');
    expect(pending.single.positionSeconds, 270);
    expect(pending.single.durationSeconds, 1578);
    expect(pending.single.clientUpdatedAt, updatedAt);
  });

  test('coalesces to one row per lesson, keeping the newest position', () async {
    for (int minute = 1; minute <= 6; minute++) {
      await recorder.enqueue(
        lessonId: 'lesson-1',
        position: Duration(minutes: minute),
        duration: const Duration(minutes: 26),
        clientUpdatedAt: DateTime.utc(2026, 7, 17, 12, minute),
      );
    }

    final List<ProgressOutboxEntry> pending = await ProgressOutboxDao(
      db,
    ).pending();

    // The table is keyed by lessonId precisely so an hour of 10s writes cannot
    // overflow `/progress/batch`'s maxItems: 200.
    expect(pending, hasLength(1));
    expect(pending.single.positionSeconds, const Duration(minutes: 6).inSeconds);
  });
}
