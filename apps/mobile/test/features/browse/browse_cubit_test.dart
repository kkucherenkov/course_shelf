import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:app_mobile/features/browse/domain/browse_course.dart';
import 'package:app_mobile/features/browse/domain/browse_filter.dart';
import 'package:app_mobile/features/browse/domain/browse_repository.dart';
import 'package:app_mobile/features/browse/presentation/bloc/browse_cubit.dart';
import 'package:app_mobile/features/browse/presentation/bloc/browse_state.dart';

class _MockBrowseRepository extends Mock implements BrowseRepository {}

class _FakeBrowseFilter extends Fake implements BrowseFilter {}

const _courseA = BrowseCourse(
  id: 'c1',
  title: 'Distributed Systems',
  instructor: 'Martin Kleppmann',
  lessonsCompleted: 3,
  lessonsTotal: 12,
);

const _courseB = BrowseCourse(
  id: 'c2',
  title: 'Rust in anger',
  instructor: '',
  lessonsCompleted: 0,
  lessonsTotal: 8,
);

const _libraries = <BrowseLibrary>[
  BrowseLibrary(id: 'lib1', name: 'Backend'),
  BrowseLibrary(id: 'lib2', name: 'Databases'),
];

void main() {
  setUpAll(() => registerFallbackValue(_FakeBrowseFilter()));

  late _MockBrowseRepository repository;

  setUp(() => repository = _MockBrowseRepository());

  test('starts Loading, empty everything, default filter', () {
    final cubit = BrowseCubit(repository);
    expect(cubit.state, const BrowseState());
    expect(cubit.state.status, BrowseStatus.loading);
    expect(cubit.state.filter, const BrowseFilter());
  });

  group('load', () {
    blocTest<BrowseCubit, BrowseState>(
      'fetches libraries + courses together and emits Loading then Loaded',
      setUp: () {
        when(
          () => repository.fetchCourses(any()),
        ).thenAnswer((_) async => <BrowseCourse>[_courseA, _courseB]);
        when(repository.fetchLibraries).thenAnswer((_) async => _libraries);
      },
      build: () => BrowseCubit(repository),
      act: (cubit) => cubit.load(),
      expect: () => <BrowseState>[
        const BrowseState(),
        const BrowseState(
          status: BrowseStatus.loaded,
          courses: <BrowseCourse>[_courseA, _courseB],
          libraries: _libraries,
        ),
      ],
    );

    blocTest<BrowseCubit, BrowseState>(
      'emits Empty — not Loaded — when the course list comes back blank',
      setUp: () {
        when(
          () => repository.fetchCourses(any()),
        ).thenAnswer((_) async => <BrowseCourse>[]);
        when(repository.fetchLibraries).thenAnswer((_) async => _libraries);
      },
      build: () => BrowseCubit(repository),
      act: (cubit) => cubit.load(),
      expect: () => <BrowseState>[
        const BrowseState(),
        const BrowseState(status: BrowseStatus.empty, libraries: _libraries),
      ],
    );

    blocTest<BrowseCubit, BrowseState>(
      'emits Failed when the repository throws',
      setUp: () {
        when(
          () => repository.fetchCourses(any()),
        ).thenThrow(Exception('network down'));
        when(repository.fetchLibraries).thenAnswer((_) async => _libraries);
      },
      build: () => BrowseCubit(repository),
      act: (cubit) => cubit.load(),
      expect: () => <BrowseState>[
        const BrowseState(),
        const BrowseState(status: BrowseStatus.failed),
      ],
    );
  });

  group('filter setters', () {
    setUp(() {
      when(repository.fetchLibraries).thenAnswer((_) async => _libraries);
    });

    blocTest<BrowseCubit, BrowseState>(
      'setStatus refetches with the new status and re-emits',
      setUp: () => when(
        () => repository.fetchCourses(any()),
      ).thenAnswer((_) async => <BrowseCourse>[_courseA]),
      build: () => BrowseCubit(repository),
      act: (cubit) async {
        await cubit.load();
        await cubit.setStatus(BrowseStatusFilter.inProgress);
      },
      skip: 2,
      expect: () => <BrowseState>[
        const BrowseState(
          status: BrowseStatus.loading,
          courses: <BrowseCourse>[_courseA],
          libraries: _libraries,
          filter: BrowseFilter(status: BrowseStatusFilter.inProgress),
        ),
        const BrowseState(
          status: BrowseStatus.loaded,
          courses: <BrowseCourse>[_courseA],
          libraries: _libraries,
          filter: BrowseFilter(status: BrowseStatusFilter.inProgress),
        ),
      ],
      verify: (_) {
        verify(
          () => repository.fetchCourses(
            const BrowseFilter(status: BrowseStatusFilter.inProgress),
          ),
        ).called(1);
      },
    );

    blocTest<BrowseCubit, BrowseState>(
      'setLibrary(null) clears the library filter back to "every library"',
      setUp: () => when(
        () => repository.fetchCourses(any()),
      ).thenAnswer((_) async => <BrowseCourse>[_courseA]),
      build: () => BrowseCubit(repository),
      act: (cubit) async {
        await cubit.load();
        await cubit.setLibrary('lib2');
        await cubit.setLibrary(null);
      },
      skip: 4,
      verify: (cubit) {
        expect(cubit.state.filter.libraryId, isNull);
        expect(cubit.state.filter.activeCount, 0);
      },
    );

    blocTest<BrowseCubit, BrowseState>(
      'setSort refetches with the new sort',
      setUp: () => when(
        () => repository.fetchCourses(any()),
      ).thenAnswer((_) async => <BrowseCourse>[_courseA]),
      build: () => BrowseCubit(repository),
      act: (cubit) async {
        await cubit.load();
        await cubit.setSort(BrowseSort.newest);
      },
      skip: 2,
      verify: (_) {
        verify(
          () => repository.fetchCourses(
            const BrowseFilter(sort: BrowseSort.newest),
          ),
        ).called(1);
      },
    );

    blocTest<BrowseCubit, BrowseState>(
      'clearFilters resets to the default filter and refetches',
      setUp: () => when(
        () => repository.fetchCourses(any()),
      ).thenAnswer((_) async => <BrowseCourse>[_courseA]),
      build: () => BrowseCubit(repository),
      act: (cubit) async {
        await cubit.load();
        await cubit.setStatus(BrowseStatusFilter.completed);
        await cubit.setLibrary('lib1');
        await cubit.clearFilters();
      },
      skip: 6,
      verify: (cubit) {
        expect(cubit.state.filter, const BrowseFilter());
        verify(
          () => repository.fetchCourses(const BrowseFilter()),
        ).called(2); // once on load(), once on clearFilters()
      },
    );
  });

  group('retry', () {
    blocTest<BrowseCubit, BrowseState>(
      're-runs the full load when libraries never landed',
      setUp: () {
        when(() => repository.fetchCourses(any())).thenThrow(Exception('boom'));
      },
      build: () => BrowseCubit(repository),
      act: (cubit) async {
        await cubit.load();
        when(
          () => repository.fetchCourses(any()),
        ).thenAnswer((_) async => <BrowseCourse>[_courseA]);
        when(repository.fetchLibraries).thenAnswer((_) async => _libraries);
        await cubit.retry();
      },
      expect: () => <BrowseState>[
        const BrowseState(),
        const BrowseState(status: BrowseStatus.failed),
        const BrowseState(status: BrowseStatus.loading),
        const BrowseState(
          status: BrowseStatus.loaded,
          courses: <BrowseCourse>[_courseA],
          libraries: _libraries,
        ),
      ],
    );

    blocTest<BrowseCubit, BrowseState>(
      're-runs only the courses fetch once libraries are cached',
      setUp: () => when(
        () => repository.fetchCourses(any()),
      ).thenAnswer((_) async => <BrowseCourse>[_courseA]),
      build: () => BrowseCubit(repository),
      act: (cubit) async {
        when(repository.fetchLibraries).thenAnswer((_) async => _libraries);
        await cubit.load();
        when(() => repository.fetchCourses(any())).thenThrow(Exception('boom'));
        await cubit.setStatus(BrowseStatusFilter.completed);
        when(
          () => repository.fetchCourses(any()),
        ).thenAnswer((_) async => <BrowseCourse>[_courseA]);
        await cubit.retry();
      },
      verify: (_) {
        // load() + setStatus (failed) + setStatus (retry didn't re-trigger
        // setStatus, retry() replays state.filter) = fetchLibraries called once.
        verify(repository.fetchLibraries).called(1);
      },
    );
  });
}
