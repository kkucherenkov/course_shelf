import 'package:app_ui/app_ui.dart';
import 'package:drift/native.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:app_mobile/features/player/data/progress_outbox_recorder.dart';
import 'package:app_mobile/features/player/domain/lesson_playback.dart';
import 'package:app_mobile/features/player/domain/video_playback_port.dart';
import 'package:app_mobile/features/player/presentation/bloc/player_bloc.dart';
import 'package:app_mobile/features/player/presentation/bloc/player_event.dart';
import 'package:app_mobile/features/player/presentation/lesson_player_screen.dart';
import 'package:app_mobile/features/player/presentation/widgets/portrait_player_stage.dart';
import 'package:app_mobile/i18n/strings.g.dart';
import 'package:app_mobile/shared/db/app_database.dart';

import '../test/features/player/player_fakes.dart';

/// End-to-end through the real screen, the real BLoC and the real Drift
/// database — only the video engine and the HTTP repository are faked, because
/// neither a decoder nor a backend exists in this harness.
///
/// The card's own acceptance is the script: play a lesson, watch it tick, and
/// have the position land in `progress_outbox` for E20 to drain.
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  late AppDatabase db;
  late FakeLessonPlayerRepository repository;
  late FakeVideoPlaybackPort playback;
  late DateTime clock;
  late PlayerBloc bloc;

  setUp(() {
    db = AppDatabase(NativeDatabase.memory());
    repository = FakeLessonPlayerRepository();
    playback = FakeVideoPlaybackPort();
    clock = DateTime.utc(2026, 7, 17, 12);
    bloc = PlayerBloc(
      repository: repository,
      progressRecorder: ProgressOutboxRecorder(ProgressOutboxDao(db)),
      playback: playback,
      now: () => clock,
    );
  });

  tearDown(() async {
    await bloc.close();
    await db.close();
  });

  /// A buffering spinner animates forever — `pumpAndSettle` would time out.
  Future<void> settle(WidgetTester tester) async {
    for (int i = 0; i < 6; i++) {
      await tester.pump(const Duration(milliseconds: 32));
    }
  }

  Future<void> pumpPlayer(WidgetTester tester) async {
    bloc.add(const PlayerStarted('lesson-1'));
    await tester.pumpWidget(
      TranslationProvider(
        child: MaterialApp(
          theme: AppTheme.light(),
          home: BlocProvider<PlayerBloc>.value(
            value: bloc,
            child: const LessonPlayerView(),
          ),
        ),
      ),
    );
    await settle(tester);
  }

  testWidgets('playing a lesson writes its position to progress_outbox', (
    WidgetTester tester,
  ) async {
    await pumpPlayer(tester);

    await tester.tap(find.byKey(PortraitPlayerStage.playPauseKey));
    await settle(tester);

    // 12 seconds of playback, one tick per second, as the engine would report.
    for (int second = 1; second <= 12; second++) {
      clock = clock.add(const Duration(seconds: 1));
      playback.emit(
        VideoPlaybackSnapshot(
          position: Duration(seconds: second),
          duration: const Duration(minutes: 26, seconds: 18),
          isInitialized: true,
          isPlaying: true,
        ),
      );
      await settle(tester);
    }

    final List<ProgressOutboxEntry> pending = await ProgressOutboxDao(
      db,
    ).pending();

    // One write at the 10s boundary — not one per tick.
    expect(pending, hasLength(1));
    expect(pending.single.lessonId, 'lesson-1');
    expect(pending.single.positionSeconds, 10);
  });

  testWidgets('a downloaded lesson announces that it plays offline', (
    WidgetTester tester,
  ) async {
    repository.source = const LessonVideoSource.localFile(
      '/data/lessons/lesson-1.enc',
    );
    await pumpPlayer(tester);

    expect(find.text('Watching offline'), findsOneWidget);
  });

  testWidgets('reaching the end of the lesson flushes the final position', (
    WidgetTester tester,
  ) async {
    await pumpPlayer(tester);

    await tester.tap(find.byKey(PortraitPlayerStage.playPauseKey));
    await settle(tester);

    clock = clock.add(const Duration(seconds: 2));
    playback.emit(
      const VideoPlaybackSnapshot(
        position: Duration(minutes: 26, seconds: 18),
        duration: Duration(minutes: 26, seconds: 18),
        isInitialized: true,
        isCompleted: true,
      ),
    );
    await settle(tester);

    final List<ProgressOutboxEntry> pending = await ProgressOutboxDao(
      db,
    ).pending();

    // The completing position must survive the 10s throttle — it is the one
    // that decides whether the lesson reads as finished.
    expect(pending.single.positionSeconds, 1578);
  });
}
