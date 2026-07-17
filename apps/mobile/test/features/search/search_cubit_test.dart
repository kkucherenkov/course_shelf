import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:app_mobile/features/search/domain/search_repository.dart';
import 'package:app_mobile/features/search/domain/search_result.dart';
import 'package:app_mobile/features/search/presentation/bloc/search_cubit.dart';
import 'package:app_mobile/features/search/presentation/bloc/search_state.dart';

class _MockSearchRepository extends Mock implements SearchRepository {}

const _course = SearchCourseHit(
  id: 'c1',
  libraryId: 'lib1',
  title: 'Distributed Systems',
  slug: 'distributed-systems',
  lessonsTotal: 12,
);

const _lesson = SearchLessonHit(
  id: 'l1',
  courseId: 'c1',
  courseTitle: 'Distributed Systems',
  sectionTitle: 'Replication',
  title: 'Single-leader replication',
  position: 3,
);

const _populated = SearchResults(
  query: 'replication',
  courses: <SearchCourseHit>[_course],
  lessons: <SearchLessonHit>[_lesson],
);

const _blank = SearchResults(
  query: 'kubernetes',
  courses: <SearchCourseHit>[],
  lessons: <SearchLessonHit>[],
);

/// Longer than the cubit's 300ms debounce — leaves headroom so the timer has
/// always fired by the time each `act` inspects state.
const _pastDebounce = Duration(milliseconds: 350);

void main() {
  late _MockSearchRepository repository;

  setUp(() => repository = _MockSearchRepository());

  test('starts in Recent with no query and no recents', () {
    final cubit = SearchCubit(repository);
    expect(cubit.state, const SearchState());
    expect(cubit.state.status, SearchStatus.recent);
  });

  group('queryChanged', () {
    blocTest<SearchCubit, SearchState>(
      'a query under 2 trimmed chars stays Recent and never hits the network',
      build: () => SearchCubit(repository),
      act: (cubit) => cubit.queryChanged('a'),
      expect: () => <SearchState>[
        const SearchState(status: SearchStatus.recent, query: 'a'),
      ],
      verify: (_) => verifyNever(
        () => repository.search(any(), limit: any(named: 'limit')),
      ),
    );

    blocTest<SearchCubit, SearchState>(
      'whitespace-only input (trims to 0 chars) stays Recent too',
      build: () => SearchCubit(repository),
      act: (cubit) => cubit.queryChanged('  '),
      expect: () => <SearchState>[
        const SearchState(status: SearchStatus.recent, query: '  '),
      ],
    );

    blocTest<SearchCubit, SearchState>(
      'a valid query debounces, then emits Loading then Results',
      setUp: () => when(
        () => repository.search('flutter', limit: 20),
      ).thenAnswer((_) async => _populated),
      build: () => SearchCubit(repository),
      act: (cubit) async {
        cubit.queryChanged('flutter');
        await Future<void>.delayed(_pastDebounce);
      },
      expect: () => <SearchState>[
        const SearchState(status: SearchStatus.loading, query: 'flutter'),
        const SearchState(
          status: SearchStatus.results,
          query: 'flutter',
          results: _populated,
          recentSearches: <String>['flutter'],
        ),
      ],
    );

    blocTest<SearchCubit, SearchState>(
      're-typing during the debounce window only searches the latest value',
      setUp: () => when(
        () => repository.search('flutter', limit: 20),
      ).thenAnswer((_) async => _populated),
      build: () => SearchCubit(repository),
      act: (cubit) async {
        cubit.queryChanged('flu');
        cubit.queryChanged('flutt');
        cubit.queryChanged('flutter');
        await Future<void>.delayed(_pastDebounce);
      },
      expect: () => <SearchState>[
        const SearchState(status: SearchStatus.loading, query: 'flutter'),
        const SearchState(
          status: SearchStatus.results,
          query: 'flutter',
          results: _populated,
          recentSearches: <String>['flutter'],
        ),
      ],
      verify: (_) {
        verify(() => repository.search('flutter', limit: 20)).called(1);
        verifyNever(() => repository.search('flu', limit: any(named: 'limit')));
      },
    );

    blocTest<SearchCubit, SearchState>(
      'a query with no hits emits Loading then Empty',
      setUp: () => when(
        () => repository.search('kubernetes', limit: 20),
      ).thenAnswer((_) async => _blank),
      build: () => SearchCubit(repository),
      act: (cubit) async {
        cubit.queryChanged('kubernetes');
        await Future<void>.delayed(_pastDebounce);
      },
      expect: () => <SearchState>[
        const SearchState(status: SearchStatus.loading, query: 'kubernetes'),
        const SearchState(
          status: SearchStatus.empty,
          query: 'kubernetes',
          results: _blank,
          recentSearches: <String>['kubernetes'],
        ),
      ],
    );

    blocTest<SearchCubit, SearchState>(
      'a repository failure emits Loading then Failed',
      setUp: () => when(
        () => repository.search('boom', limit: 20),
      ).thenThrow(Exception('network down')),
      build: () => SearchCubit(repository),
      act: (cubit) async {
        cubit.queryChanged('boom');
        await Future<void>.delayed(_pastDebounce);
      },
      expect: () => <SearchState>[
        const SearchState(status: SearchStatus.loading, query: 'boom'),
        const SearchState(status: SearchStatus.failed, query: 'boom'),
      ],
    );

    blocTest<SearchCubit, SearchState>(
      'clearing the field back to under 2 chars returns to Recent and cancels '
      'the pending debounce',
      setUp: () => when(
        () => repository.search('flutter', limit: 20),
      ).thenAnswer((_) async => _populated),
      build: () => SearchCubit(repository),
      act: (cubit) async {
        cubit.queryChanged('flutter');
        cubit.queryChanged('f');
        await Future<void>.delayed(_pastDebounce);
      },
      expect: () => <SearchState>[
        const SearchState(status: SearchStatus.recent, query: 'f'),
      ],
      verify: (_) => verifyNever(
        () => repository.search(any(), limit: any(named: 'limit')),
      ),
    );
  });

  group('clearQuery', () {
    blocTest<SearchCubit, SearchState>(
      'resets to Recent with an empty query and drops any results',
      setUp: () => when(
        () => repository.search('flutter', limit: 20),
      ).thenAnswer((_) async => _populated),
      build: () => SearchCubit(repository),
      act: (cubit) async {
        cubit.queryChanged('flutter');
        await Future<void>.delayed(_pastDebounce);
        cubit.clearQuery();
      },
      skip: 2,
      expect: () => <SearchState>[
        const SearchState(
          status: SearchStatus.recent,
          recentSearches: <String>['flutter'],
        ),
      ],
    );
  });

  group('searchRecent', () {
    blocTest<SearchCubit, SearchState>(
      'runs immediately, skipping the debounce',
      setUp: () => when(
        () => repository.search('flutter', limit: 20),
      ).thenAnswer((_) async => _populated),
      build: () => SearchCubit(repository),
      act: (cubit) => cubit.searchRecent('flutter'),
      expect: () => <SearchState>[
        const SearchState(status: SearchStatus.loading, query: 'flutter'),
        const SearchState(
          status: SearchStatus.results,
          query: 'flutter',
          results: _populated,
          recentSearches: <String>['flutter'],
        ),
      ],
    );
  });

  group('recent-searches bookkeeping', () {
    blocTest<SearchCubit, SearchState>(
      'dedupes and moves a re-searched term back to the front',
      setUp: () => when(() => repository.search(any(), limit: 20)).thenAnswer(
        (invocation) async => SearchResults(
          query: invocation.positionalArguments.first as String,
          courses: const <SearchCourseHit>[_course],
          lessons: const <SearchLessonHit>[],
        ),
      ),
      build: () => SearchCubit(repository),
      act: (cubit) async {
        await cubit.searchRecent('alpha');
        await cubit.searchRecent('beta');
        await cubit.searchRecent('alpha');
      },
      verify: (cubit) {
        expect(cubit.state.recentSearches, <String>['alpha', 'beta']);
      },
    );

    blocTest<SearchCubit, SearchState>(
      'removeRecent drops a single term without touching the network',
      build: () => SearchCubit(repository),
      seed: () => const SearchState(recentSearches: <String>['alpha', 'beta']),
      act: (cubit) => cubit.removeRecent('alpha'),
      expect: () => <SearchState>[
        const SearchState(recentSearches: <String>['beta']),
      ],
    );

    blocTest<SearchCubit, SearchState>(
      'clearRecent empties the whole list',
      build: () => SearchCubit(repository),
      seed: () => const SearchState(recentSearches: <String>['alpha', 'beta']),
      act: (cubit) => cubit.clearRecent(),
      expect: () => <SearchState>[const SearchState()],
    );
  });

  group('retry', () {
    blocTest<SearchCubit, SearchState>(
      're-runs the last query that actually reached the network',
      setUp: () => when(
        () => repository.search('flutter', limit: 20),
      ).thenThrow(Exception('boom')),
      build: () => SearchCubit(repository),
      act: (cubit) async {
        cubit.queryChanged('flutter');
        await Future<void>.delayed(_pastDebounce);
        when(
          () => repository.search('flutter', limit: 20),
        ).thenAnswer((_) async => _populated);
        await cubit.retry();
      },
      expect: () => <SearchState>[
        const SearchState(status: SearchStatus.loading, query: 'flutter'),
        const SearchState(status: SearchStatus.failed, query: 'flutter'),
        const SearchState(status: SearchStatus.loading, query: 'flutter'),
        const SearchState(
          status: SearchStatus.results,
          query: 'flutter',
          results: _populated,
          recentSearches: <String>['flutter'],
        ),
      ],
    );

    test('does nothing before any query has reached the network', () async {
      final cubit = SearchCubit(repository);
      await cubit.retry();
      expect(cubit.state, const SearchState());
      verifyNever(() => repository.search(any(), limit: any(named: 'limit')));
      await cubit.close();
    });
  });
}
