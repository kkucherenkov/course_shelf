import 'dart:async';

import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:app_mobile/features/home/domain/home_repository.dart';
import 'package:app_mobile/features/home/domain/home_summary.dart';
import 'package:app_mobile/features/home/presentation/bloc/home_cubit.dart';
import 'package:app_mobile/features/home/presentation/bloc/home_state.dart';

class _MockHomeRepository extends Mock implements HomeRepository {}

const _continue = ContinueWatchingCourse(
  courseId: 'c1',
  courseTitle: 'Rust in anger',
  lessonsCompleted: 3,
  lessonsTotal: 10,
  lastSeenLessonId: 'l7',
);

const _added = RecentlyAddedCourse(
  courseId: 'c2',
  courseTitle: 'Postgres internals',
  lessonCount: 12,
);

const _populated = HomeSummary(
  continueWatching: <ContinueWatchingCourse>[_continue],
  recentlyAdded: <RecentlyAddedCourse>[_added],
  libraryCount: 2,
);

const _blank = HomeSummary(
  continueWatching: <ContinueWatchingCourse>[],
  recentlyAdded: <RecentlyAddedCourse>[],
  libraryCount: 0,
);

void main() {
  late _MockHomeRepository repository;

  setUp(() => repository = _MockHomeRepository());

  test('starts loading — the tab renders a skeleton before any await', () {
    expect(HomeCubit(repository).state, const HomeState());
    expect(HomeCubit(repository).state.status, HomeStatus.loading);
  });

  group('load', () {
    blocTest<HomeCubit, HomeState>(
      'emits Loading then Loaded when either row has content',
      setUp: () => when(repository.fetchSummary).thenAnswer(
        (_) async => _populated,
      ),
      build: () => HomeCubit(repository),
      act: (cubit) => cubit.load(),
      expect: () => <HomeState>[
        const HomeState(),
        const HomeState(status: HomeStatus.loaded, summary: _populated),
      ],
    );

    blocTest<HomeCubit, HomeState>(
      'emits Empty — not Loaded — when both rows come back empty',
      setUp: () => when(repository.fetchSummary).thenAnswer((_) async => _blank),
      build: () => HomeCubit(repository),
      act: (cubit) => cubit.load(),
      expect: () => <HomeState>[
        const HomeState(),
        const HomeState(status: HomeStatus.empty, summary: _blank),
      ],
    );

    blocTest<HomeCubit, HomeState>(
      'keeps the summary on Empty so the quick links still know libraryCount',
      setUp: () => when(repository.fetchSummary).thenAnswer(
        (_) async => const HomeSummary(
          continueWatching: <ContinueWatchingCourse>[],
          recentlyAdded: <RecentlyAddedCourse>[],
          libraryCount: 4,
        ),
      ),
      build: () => HomeCubit(repository),
      act: (cubit) => cubit.load(),
      verify: (cubit) {
        expect(cubit.state.status, HomeStatus.empty);
        expect(cubit.state.summary?.libraryCount, 4);
      },
    );

    blocTest<HomeCubit, HomeState>(
      'emits Failed when the repository throws',
      setUp: () => when(repository.fetchSummary).thenThrow(Exception('boom')),
      build: () => HomeCubit(repository),
      act: (cubit) => cubit.load(),
      expect: () => <HomeState>[
        const HomeState(),
        const HomeState(status: HomeStatus.failed),
      ],
    );

    blocTest<HomeCubit, HomeState>(
      'drops a stale summary on failure rather than showing it under an error',
      setUp: () => when(repository.fetchSummary).thenAnswer(
        (_) async => _populated,
      ),
      build: () => HomeCubit(repository),
      act: (cubit) async {
        await cubit.load();
        when(repository.fetchSummary).thenThrow(Exception('boom'));
        await cubit.refresh();
      },
      verify: (cubit) {
        expect(cubit.state.status, HomeStatus.failed);
        expect(cubit.state.summary, isNull);
      },
    );
  });

  group('refresh', () {
    blocTest<HomeCubit, HomeState>(
      're-reads the repository and reports the new content',
      setUp: () => when(repository.fetchSummary).thenAnswer((_) async => _blank),
      build: () => HomeCubit(repository),
      act: (cubit) async {
        await cubit.load();
        when(repository.fetchSummary).thenAnswer((_) async => _populated);
        await cubit.refresh();
      },
      expect: () => <HomeState>[
        const HomeState(),
        const HomeState(status: HomeStatus.empty, summary: _blank),
        const HomeState(status: HomeStatus.loaded, summary: _populated),
      ],
      verify: (_) => verify(repository.fetchSummary).called(2),
    );

    blocTest<HomeCubit, HomeState>(
      'does not flash a skeleton over content already on screen',
      setUp: () => when(repository.fetchSummary).thenAnswer(
        (_) async => _populated,
      ),
      build: () => HomeCubit(repository),
      act: (cubit) async {
        await cubit.load();
        await cubit.refresh();
      },
      // The shell's pull-to-refresh spinner already signals the reload. A
      // Loading emission here would tear the rows down under the user's finger.
      expect: () => <HomeState>[
        const HomeState(),
        const HomeState(status: HomeStatus.loaded, summary: _populated),
      ],
    );

    blocTest<HomeCubit, HomeState>(
      'recovers from Failed back to Loaded',
      setUp: () => when(repository.fetchSummary).thenThrow(Exception('boom')),
      build: () => HomeCubit(repository),
      act: (cubit) async {
        await cubit.load();
        when(repository.fetchSummary).thenAnswer((_) async => _populated);
        await cubit.refresh();
      },
      expect: () => <HomeState>[
        const HomeState(),
        const HomeState(status: HomeStatus.failed),
        const HomeState(status: HomeStatus.loading),
        const HomeState(status: HomeStatus.loaded, summary: _populated),
      ],
    );

    test('returns a future that only completes once the reload is done', () async {
      final completer = Completer<HomeSummary>();
      when(repository.fetchSummary).thenAnswer((_) => completer.future);
      final cubit = HomeCubit(repository);

      var done = false;
      // The shell keeps its RefreshIndicator spinning for exactly as long as
      // this future is pending, so it must not complete early.
      unawaited(cubit.refresh().then((_) => done = true));
      await Future<void>.delayed(Duration.zero);
      expect(done, isFalse, reason: 'refresh resolved before the fetch did');

      completer.complete(_populated);
      await Future<void>.delayed(Duration.zero);
      expect(done, isTrue);

      await cubit.close();
    });
  });
}
