import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:app_mobile/features/search/domain/search_repository.dart';
import 'package:app_mobile/features/search/domain/search_result.dart';
import 'package:app_mobile/features/search/presentation/bloc/search_cubit.dart';
import 'package:app_mobile/features/search/presentation/search_screen.dart';
import 'package:app_mobile/i18n/strings.g.dart';

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

SearchResults _emptyFor(String query) => SearchResults(
  query: query,
  courses: const <SearchCourseHit>[],
  lessons: const <SearchLessonHit>[],
);

void main() {
  late _MockSearchRepository repository;
  late SearchCubit cubit;

  setUp(() {
    repository = _MockSearchRepository();
    cubit = SearchCubit(repository);
  });

  tearDown(() async => cubit.close());

  Future<void> pump(WidgetTester tester, {VoidCallback? openBrowse}) async {
    await tester.binding.setSurfaceSize(const Size(400, 1200));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    Widget body = BlocProvider<SearchCubit>.value(
      value: cubit,
      child: const SingleChildScrollView(child: SearchTabBody()),
    );
    if (openBrowse != null) {
      body = SearchQuickLinks(openBrowse: openBrowse, child: body);
    }

    await tester.pumpWidget(
      TranslationProvider(
        child: MaterialApp(
          theme: AppTheme.dark(),
          home: Scaffold(body: body),
        ),
      ),
    );
  }

  group('recent', () {
    testWidgets('shows a hint when there are no recent searches yet', (
      tester,
    ) async {
      await pump(tester);
      await tester.pumpAndSettle();

      expect(
        find.text('Your recent searches will show up here.'),
        findsOneWidget,
      );
      expect(
        find.byKey(const ValueKey<String>('searchClearRecent')),
        findsNothing,
      );
    });

    testWidgets('renders past terms and lets Clear empty the list', (
      tester,
    ) async {
      when(() => repository.search(any(), limit: 20)).thenAnswer(
        (invocation) async =>
            _emptyFor(invocation.positionalArguments.first as String),
      );
      await cubit.searchRecent('distributed systems');
      await cubit.searchRecent('postgres');
      cubit.clearQuery();

      await pump(tester);
      await tester.pumpAndSettle();

      expect(find.text('distributed systems'), findsOneWidget);
      expect(find.text('postgres'), findsOneWidget);

      await tester.tap(find.byKey(const ValueKey<String>('searchClearRecent')));
      await tester.pump();

      expect(cubit.state.recentSearches, isEmpty);
    });

    testWidgets('typing debounces into a network search', (tester) async {
      when(() => repository.search('flutter', limit: 20)).thenAnswer(
        (_) async => const SearchResults(
          query: 'flutter',
          courses: <SearchCourseHit>[_course],
          lessons: <SearchLessonHit>[],
        ),
      );

      await pump(tester);
      await tester.enterText(
        find.byKey(const ValueKey<String>('searchField')),
        'flutter',
      );
      await tester.pump(const Duration(milliseconds: 350));
      await tester.pumpAndSettle();

      expect(find.text('Distributed Systems'), findsOneWidget);
      verify(() => repository.search('flutter', limit: 20)).called(1);
    });
  });

  group('results', () {
    testWidgets('groups courses and lessons under counted headings', (
      tester,
    ) async {
      when(() => repository.search('replication', limit: 20)).thenAnswer(
        (_) async => const SearchResults(
          query: 'replication',
          courses: <SearchCourseHit>[_course],
          lessons: <SearchLessonHit>[_lesson],
        ),
      );
      await cubit.searchRecent('replication');

      await pump(tester);
      await tester.pumpAndSettle();

      expect(find.text('Courses'), findsOneWidget);
      expect(find.text('Lessons'), findsOneWidget);
      expect(find.text('1'), findsNWidgets(2));
      expect(find.text('Distributed Systems'), findsOneWidget);
      // The lesson title contains the query ("replication"), so it renders
      // through the highlighter's RichText path rather than a plain Text.
      expect(
        find.text('Single-leader replication', findRichText: true),
        findsOneWidget,
      );
      expect(
        find.textContaining('Distributed Systems · Replication'),
        findsOneWidget,
      );
    });
  });

  group('no results', () {
    testWidgets('shows the empty-state copy for the query', (tester) async {
      when(
        () => repository.search('kubernetes', limit: 20),
      ).thenAnswer((_) async => _emptyFor('kubernetes'));
      await cubit.searchRecent('kubernetes');

      await pump(tester);
      await tester.pumpAndSettle();

      expect(find.text('No results for “kubernetes”'), findsOneWidget);
      expect(
        find.byKey(const ValueKey<String>('searchBrowseLibrary')),
        findsNothing,
      );
    });

    testWidgets('offers Browse library only when the shell wires the seam', (
      tester,
    ) async {
      when(
        () => repository.search('kubernetes', limit: 20),
      ).thenAnswer((_) async => _emptyFor('kubernetes'));
      await cubit.searchRecent('kubernetes');

      var browsed = 0;
      await pump(tester, openBrowse: () => browsed++);
      await tester.pumpAndSettle();

      final browseButton = find.byKey(
        const ValueKey<String>('searchBrowseLibrary'),
      );
      expect(browseButton, findsOneWidget);
      await tester.tap(browseButton);
      await tester.pump();
      expect(browsed, 1);
    });
  });

  group('failed', () {
    testWidgets('shows a retry action that re-runs the search', (tester) async {
      when(
        () => repository.search('flutter', limit: 20),
      ).thenThrow(Exception('boom'));
      await cubit.searchRecent('flutter');

      await pump(tester);
      await tester.pumpAndSettle();

      expect(find.byKey(const ValueKey<String>('searchRetry')), findsOneWidget);

      when(
        () => repository.search('flutter', limit: 20),
      ).thenAnswer((_) async => _emptyFor('flutter'));
      await tester.tap(find.byKey(const ValueKey<String>('searchRetry')));
      await tester.pumpAndSettle();

      expect(find.text('No results for “flutter”'), findsOneWidget);
    });
  });
}
