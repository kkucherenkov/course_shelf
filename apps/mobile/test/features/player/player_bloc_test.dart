import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/features/player/domain/lesson_playback.dart';
import 'package:app_mobile/features/player/domain/video_playback_port.dart';
import 'package:app_mobile/features/player/presentation/bloc/player_bloc.dart';
import 'package:app_mobile/features/player/presentation/bloc/player_event.dart';
import 'package:app_mobile/features/player/presentation/bloc/player_state.dart';

import 'player_fakes.dart';

void main() {
  late FakeLessonPlayerRepository repository;
  late FakeProgressRecorder recorder;
  late FakeVideoPlaybackPort playback;
  late DateTime clock;

  setUp(() {
    repository = FakeLessonPlayerRepository();
    recorder = FakeProgressRecorder();
    playback = FakeVideoPlaybackPort();
    clock = DateTime.utc(2026, 7, 17, 12);
  });

  PlayerBloc build() => PlayerBloc(
    repository: repository,
    progressRecorder: recorder,
    playback: playback,
    now: () => clock,
  );

  /// A snapshot as the platform would report it mid-playback.
  VideoPlaybackSnapshot playing({
    Duration position = Duration.zero,
    Duration duration = const Duration(minutes: 26, seconds: 18),
    bool isBuffering = false,
    bool isCompleted = false,
    String? errorMessage,
  }) => VideoPlaybackSnapshot(
    position: position,
    duration: duration,
    isInitialized: true,
    isPlaying: !isCompleted && errorMessage == null,
    isBuffering: isBuffering,
    isCompleted: isCompleted,
    errorMessage: errorMessage,
  );

  group('load', () {
    blocTest<PlayerBloc, PlayerState>(
      'resolves the lesson and lands paused, ready to play',
      build: build,
      act: (PlayerBloc bloc) => bloc.add(const PlayerStarted('lesson-1')),
      verify: (PlayerBloc bloc) {
        expect(bloc.state.status, PlayerStatus.paused);
        expect(bloc.state.lesson?.title, 'Leaderless replication');
        expect(playback.opened.single.uri, 'https://cdn.test/a.mp4');
      },
    );

    blocTest<PlayerBloc, PlayerState>(
      'seeks to the resume position, mirroring the web loadedmetadata seek',
      build: build,
      seed: () => const PlayerState(),
      setUp: () {
        repository.lesson = const LessonPlayback(
          id: 'lesson-1',
          courseId: 'course-1',
          sectionId: 'section-1',
          title: 'Leaderless replication',
          duration: Duration(minutes: 26),
          resumeAt: Duration(minutes: 4, seconds: 30),
        );
      },
      act: (PlayerBloc bloc) => bloc.add(const PlayerStarted('lesson-1')),
      verify: (_) {
        expect(playback.seeks, <Duration>[const Duration(minutes: 4, seconds: 30)]);
      },
    );

    blocTest<PlayerBloc, PlayerState>(
      'surfaces an error when the lesson cannot be fetched',
      build: build,
      setUp: () => repository.lessonError = Exception('boom'),
      act: (PlayerBloc bloc) => bloc.add(const PlayerStarted('lesson-1')),
      verify: (PlayerBloc bloc) {
        expect(bloc.state.status, PlayerStatus.error);
        expect(bloc.state.errorMessage, isNotNull);
      },
    );

    blocTest<PlayerBloc, PlayerState>(
      'raises Watching offline only when the source is a local file',
      build: build,
      setUp: () => repository.source = const LessonVideoSource.localFile(
        '/data/lessons/lesson-1.enc',
      ),
      act: (PlayerBloc bloc) => bloc.add(const PlayerStarted('lesson-1')),
      verify: (PlayerBloc bloc) {
        expect(bloc.state.watchingOffline, isTrue);
        // Offline is concurrent with playback, never a status of its own.
        expect(bloc.state.status, PlayerStatus.paused);
      },
    );

    blocTest<PlayerBloc, PlayerState>(
      'a network source does not raise Watching offline',
      build: build,
      act: (PlayerBloc bloc) => bloc.add(const PlayerStarted('lesson-1')),
      verify: (PlayerBloc bloc) => expect(bloc.state.watchingOffline, isFalse),
    );

    blocTest<PlayerBloc, PlayerState>(
      'retry re-resolves the source after a stream failure',
      build: build,
      setUp: () => repository.sourceError = Exception('stream 500'),
      act: (PlayerBloc bloc) async {
        bloc.add(const PlayerStarted('lesson-1'));
        await Future<void>.delayed(Duration.zero);
        expect(bloc.state.status, PlayerStatus.error);
        repository.sourceError = null;
        bloc.add(const PlayerRetryRequested());
      },
      verify: (PlayerBloc bloc) {
        expect(repository.resolveSourceCount, 2);
        expect(bloc.state.status, PlayerStatus.paused);
        expect(bloc.state.errorMessage, isNull);
      },
    );
  });

  group('playback status', () {
    blocTest<PlayerBloc, PlayerState>(
      'a platform tick drives playing / buffering / end-of-lesson',
      build: build,
      act: (PlayerBloc bloc) async {
        bloc.add(const PlayerStarted('lesson-1'));
        await Future<void>.delayed(Duration.zero);
        bloc.add(PlayerTicked(playing(position: const Duration(seconds: 3))));
        await Future<void>.delayed(Duration.zero);
        expect(bloc.state.status, PlayerStatus.playing);

        bloc.add(PlayerTicked(playing(isBuffering: true)));
        await Future<void>.delayed(Duration.zero);
        expect(bloc.state.status, PlayerStatus.buffering);

        bloc.add(PlayerTicked(playing(isCompleted: true)));
      },
      verify: (PlayerBloc bloc) =>
          expect(bloc.state.status, PlayerStatus.endOfLesson),
    );

    blocTest<PlayerBloc, PlayerState>(
      'end-of-lesson wins over a simultaneous platform error, like web',
      build: build,
      act: (PlayerBloc bloc) async {
        bloc.add(const PlayerStarted('lesson-1'));
        await Future<void>.delayed(Duration.zero);
        bloc.add(
          PlayerTicked(playing(isCompleted: true, errorMessage: 'decode fail')),
        );
      },
      verify: (PlayerBloc bloc) =>
          expect(bloc.state.status, PlayerStatus.endOfLesson),
    );

    blocTest<PlayerBloc, PlayerState>(
      'play/pause drives the engine, not just the state',
      build: build,
      act: (PlayerBloc bloc) async {
        bloc.add(const PlayerStarted('lesson-1'));
        await Future<void>.delayed(Duration.zero);
        bloc.add(const PlayerPlayPausePressed());
        await Future<void>.delayed(Duration.zero);
        bloc.add(PlayerTicked(playing()));
        await Future<void>.delayed(Duration.zero);
        bloc.add(const PlayerPlayPausePressed());
      },
      verify: (_) {
        expect(playback.calls, containsAllInOrder(<String>['play', 'pause']));
      },
    );

    blocTest<PlayerBloc, PlayerState>(
      'skip seeks relative to the current position and clamps at zero',
      build: build,
      act: (PlayerBloc bloc) async {
        bloc.add(const PlayerStarted('lesson-1'));
        await Future<void>.delayed(Duration.zero);
        bloc.add(PlayerTicked(playing(position: const Duration(seconds: 4))));
        await Future<void>.delayed(Duration.zero);
        bloc.add(const PlayerSkipRequested(-10));
        await Future<void>.delayed(Duration.zero);
        bloc.add(const PlayerSkipRequested(10));
      },
      verify: (_) {
        // -10 from 4s clamps to 0; the following +10 is relative to that new
        // position, so it lands on 10s rather than back at 14s.
        expect(
          playback.seeks,
          <Duration>[Duration.zero, const Duration(seconds: 10)],
        );
      },
    );

    blocTest<PlayerBloc, PlayerState>(
      'speed cycles through the presets web uses',
      build: build,
      act: (PlayerBloc bloc) async {
        bloc.add(const PlayerStarted('lesson-1'));
        await Future<void>.delayed(Duration.zero);
        bloc.add(const PlayerSpeedChanged());
      },
      verify: (PlayerBloc bloc) {
        expect(bloc.state.speed, 1.25);
        expect(playback.calls, contains('setSpeed:1.25'));
      },
    );
  });

  group('progress_outbox throttle', () {
    blocTest<PlayerBloc, PlayerState>(
      'writes at most once per 10s of playback, not on every tick',
      build: build,
      act: (PlayerBloc bloc) async {
        bloc.add(const PlayerStarted('lesson-1'));
        await Future<void>.delayed(Duration.zero);
        bloc.add(const PlayerPlayPausePressed());
        await Future<void>.delayed(Duration.zero);

        // 30 ticks one second apart: the engine reports ~4x/s in reality, so a
        // per-tick write would be a write storm.
        for (int second = 1; second <= 30; second++) {
          clock = clock.add(const Duration(seconds: 1));
          bloc.add(PlayerTicked(playing(position: Duration(seconds: second))));
          await Future<void>.delayed(Duration.zero);
        }
      },
      verify: (_) {
        // Ticks at t=10s, 20s, 30s — exactly three, and no more.
        expect(recorder.writes.length, 3);
        expect(
          recorder.writes.map((RecordedProgress w) => w.position).toList(),
          <Duration>[
            const Duration(seconds: 10),
            const Duration(seconds: 20),
            const Duration(seconds: 30),
          ],
        );
      },
    );

    blocTest<PlayerBloc, PlayerState>(
      'does not write before the first 10s have elapsed',
      build: build,
      act: (PlayerBloc bloc) async {
        bloc.add(const PlayerStarted('lesson-1'));
        await Future<void>.delayed(Duration.zero);
        bloc.add(const PlayerPlayPausePressed());
        await Future<void>.delayed(Duration.zero);
        for (int second = 1; second <= 9; second++) {
          clock = clock.add(const Duration(seconds: 1));
          bloc.add(PlayerTicked(playing(position: Duration(seconds: second))));
          await Future<void>.delayed(Duration.zero);
        }
      },
      verify: (_) => expect(recorder.writes, isEmpty),
    );

    blocTest<PlayerBloc, PlayerState>(
      'does not write while paused',
      build: build,
      act: (PlayerBloc bloc) async {
        bloc.add(const PlayerStarted('lesson-1'));
        await Future<void>.delayed(Duration.zero);
        clock = clock.add(const Duration(minutes: 5));
        bloc.add(
          const PlayerTicked(
            VideoPlaybackSnapshot(
              position: Duration(seconds: 12),
              duration: Duration(minutes: 26),
              isInitialized: true,
            ),
          ),
        );
      },
      verify: (_) => expect(recorder.writes, isEmpty),
    );

    blocTest<PlayerBloc, PlayerState>(
      'flush writes the tail position regardless of the throttle',
      build: build,
      act: (PlayerBloc bloc) async {
        bloc.add(const PlayerStarted('lesson-1'));
        await Future<void>.delayed(Duration.zero);
        bloc.add(const PlayerPlayPausePressed());
        await Future<void>.delayed(Duration.zero);
        clock = clock.add(const Duration(seconds: 3));
        bloc.add(PlayerTicked(playing(position: const Duration(seconds: 3))));
        await Future<void>.delayed(Duration.zero);
        bloc.add(const PlayerProgressFlushed());
      },
      verify: (_) {
        expect(recorder.writes.length, 1);
        expect(recorder.writes.single.position, const Duration(seconds: 3));
        expect(recorder.writes.single.lessonId, 'lesson-1');
      },
    );

    blocTest<PlayerBloc, PlayerState>(
      'flushes the final position when the lesson ends',
      build: build,
      act: (PlayerBloc bloc) async {
        bloc.add(const PlayerStarted('lesson-1'));
        await Future<void>.delayed(Duration.zero);
        bloc.add(const PlayerPlayPausePressed());
        await Future<void>.delayed(Duration.zero);
        clock = clock.add(const Duration(seconds: 2));
        bloc.add(
          PlayerTicked(
            playing(
              position: const Duration(minutes: 26, seconds: 18),
              isCompleted: true,
            ),
          ),
        );
      },
      verify: (_) {
        expect(
          recorder.writes.single.position,
          const Duration(minutes: 26, seconds: 18),
        );
      },
    );

    blocTest<PlayerBloc, PlayerState>(
      'never writes for a lesson whose duration is still unknown',
      build: build,
      // `durationSeconds` is nullable on the wire, and the engine reports 0
      // until metadata lands. `POST /progress` requires durationSeconds, and
      // web's reporter bails on `dur === 0` — so neither may be sent.
      setUp: () => repository.lesson = const LessonPlayback(
        id: 'lesson-1',
        courseId: 'course-1',
        sectionId: 'section-1',
        title: 'Leaderless replication',
        duration: Duration.zero,
        resumeAt: Duration.zero,
      ),
      act: (PlayerBloc bloc) async {
        bloc.add(const PlayerStarted('lesson-1'));
        await Future<void>.delayed(Duration.zero);
        bloc.add(const PlayerPlayPausePressed());
        await Future<void>.delayed(Duration.zero);
        clock = clock.add(const Duration(seconds: 30));
        bloc.add(PlayerTicked(playing(duration: Duration.zero)));
      },
      verify: (_) => expect(recorder.writes, isEmpty),
    );
  });

  group('bookmarks and notes', () {
    blocTest<PlayerBloc, PlayerState>(
      'adding a bookmark appends it and closes the add row',
      build: build,
      act: (PlayerBloc bloc) async {
        bloc.add(const PlayerStarted('lesson-1'));
        await Future<void>.delayed(Duration.zero);
        bloc.add(const PlayerBookmarkAddToggled(adding: true));
        await Future<void>.delayed(Duration.zero);
        bloc.add(
          const PlayerBookmarkAdded(
            position: Duration(minutes: 2, seconds: 14),
            label: 'Definition of N, R, W',
          ),
        );
      },
      verify: (PlayerBloc bloc) {
        expect(bloc.state.bookmarks.single.label, 'Definition of N, R, W');
        expect(bloc.state.addingBookmark, isFalse);
      },
    );

    blocTest<PlayerBloc, PlayerState>(
      'deleting a bookmark drops it from the list',
      build: build,
      setUp: () => repository.bookmarks = const <LessonBookmark>[
        LessonBookmark(id: 'bm-1', position: Duration(seconds: 30)),
      ],
      act: (PlayerBloc bloc) async {
        bloc.add(const PlayerStarted('lesson-1'));
        await Future<void>.delayed(Duration.zero);
        bloc.add(const PlayerBookmarkDeleted('bm-1'));
      },
      verify: (PlayerBloc bloc) {
        expect(repository.deletedBookmarks, <String>['bm-1']);
        expect(bloc.state.bookmarks, isEmpty);
      },
    );

    blocTest<PlayerBloc, PlayerState>(
      'saving a note persists the body',
      build: build,
      act: (PlayerBloc bloc) async {
        bloc.add(const PlayerStarted('lesson-1'));
        await Future<void>.delayed(Duration.zero);
        bloc.add(const PlayerNoteSaved('Quorum: R + W > N'));
      },
      verify: (PlayerBloc bloc) {
        expect(repository.savedNotes, <String>['Quorum: R + W > N']);
        expect(bloc.state.note, 'Quorum: R + W > N');
      },
    );
  });

  group('sleep timer', () {
    blocTest<PlayerBloc, PlayerState>(
      'arming the timer records the remaining duration',
      build: build,
      act: (PlayerBloc bloc) async {
        bloc.add(const PlayerStarted('lesson-1'));
        await Future<void>.delayed(Duration.zero);
        bloc.add(const PlayerSleepTimerSet(Duration(minutes: 15)));
      },
      verify: (PlayerBloc bloc) =>
          expect(bloc.state.sleepTimer, const Duration(minutes: 15)),
    );

    blocTest<PlayerBloc, PlayerState>(
      'the timer pauses playback when it runs out',
      build: build,
      act: (PlayerBloc bloc) async {
        bloc.add(const PlayerStarted('lesson-1'));
        await Future<void>.delayed(Duration.zero);
        bloc.add(const PlayerSleepTimerSet(Duration(seconds: 2)));
        await Future<void>.delayed(Duration.zero);
        bloc.add(const PlayerSleepTimerTicked());
        await Future<void>.delayed(Duration.zero);
        bloc.add(const PlayerSleepTimerTicked());
        await Future<void>.delayed(Duration.zero);
      },
      verify: (PlayerBloc bloc) {
        expect(bloc.state.sleepTimer, isNull);
        expect(playback.calls, contains('pause'));
      },
    );

    blocTest<PlayerBloc, PlayerState>(
      'cancelling the timer disarms it without pausing',
      build: build,
      act: (PlayerBloc bloc) async {
        bloc.add(const PlayerStarted('lesson-1'));
        await Future<void>.delayed(Duration.zero);
        bloc.add(const PlayerSleepTimerSet(Duration(minutes: 15)));
        await Future<void>.delayed(Duration.zero);
        bloc.add(const PlayerSleepTimerSet(null));
      },
      verify: (PlayerBloc bloc) {
        expect(bloc.state.sleepTimer, isNull);
        expect(playback.calls, isNot(contains('pause')));
      },
    );
  });
}
