import 'dart:async';

import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:app_mobile/app/routes.dart';
import 'package:app_mobile/features/browse/domain/browse_course.dart';
import 'package:app_mobile/features/browse/domain/browse_filter.dart';
import 'package:app_mobile/features/browse/domain/browse_repository.dart';
import 'package:app_mobile/features/browse/presentation/bloc/browse_cubit.dart';
import 'package:app_mobile/features/browse/presentation/browse_screen.dart';
import 'package:app_mobile/i18n/strings.g.dart';

class _MockBrowseRepository extends Mock implements BrowseRepository {}

class _FakeBrowseFilter extends Fake implements BrowseFilter {}

class _RecordingNavigatorObserver extends NavigatorObserver {
  final List<RouteSettings> pushed = <RouteSettings>[];

  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) {
    pushed.add(route.settings);
    super.didPush(route, previousRoute);
  }
}

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
  late BrowseCubit cubit;
  late _RecordingNavigatorObserver observer;

  setUp(() {
    repository = _MockBrowseRepository();
    cubit = BrowseCubit(repository);
    observer = _RecordingNavigatorObserver();
    when(repository.fetchLibraries).thenAnswer((_) async => _libraries);
  });

  tearDown(() async => cubit.close());

  Future<void> pump(
    WidgetTester tester, {
    Size size = const Size(400, 1200),
  }) async {
    await tester.binding.setSurfaceSize(size);
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      TranslationProvider(
        child: MaterialApp(
          theme: AppTheme.dark(),
          navigatorObservers: <NavigatorObserver>[observer],
          onGenerateRoute: (RouteSettings settings) => MaterialPageRoute<void>(
            builder: (_) => const SizedBox.shrink(),
            settings: settings,
          ),
          home: Scaffold(
            body: BlocProvider<BrowseCubit>.value(
              value: cubit,
              child: const SingleChildScrollView(child: BrowseTabBody()),
            ),
          ),
        ),
      ),
    );
  }

  group('loading', () {
    testWidgets('fills the grid with skeleton posters', (tester) async {
      final completer = Completer<List<BrowseCourse>>();
      when(
        () => repository.fetchCourses(any()),
      ).thenAnswer((_) => completer.future);

      unawaited(cubit.load());
      await pump(tester);
      await tester.pump();

      expect(find.byType(AppSkeleton), findsWidgets);
      expect(find.byType(AppEmptyState), findsNothing);
      expect(find.byType(AppErrorState), findsNothing);

      completer.complete(<BrowseCourse>[]);
      await tester.pumpAndSettle();
    });
  });

  group('loaded', () {
    setUp(
      () => when(
        () => repository.fetchCourses(any()),
      ).thenAnswer((_) async => <BrowseCourse>[_courseA, _courseB]),
    );

    testWidgets('renders one poster per course', (tester) async {
      await cubit.load();
      await pump(tester);
      await tester.pumpAndSettle();

      expect(find.byType(CoursePosterCard), findsNWidgets(2));
      expect(find.text('Distributed Systems'), findsOneWidget);
      expect(find.text('Rust in anger'), findsOneWidget);
    });

    testWidgets('tapping a poster pushes AppRoutes.course with its id', (
      tester,
    ) async {
      await cubit.load();
      await pump(tester);
      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const ValueKey<String>('browseCourse_c1')));
      await tester.pumpAndSettle();

      final pushed = observer.pushed.last;
      expect(pushed.name, AppRoutes.course);
      expect(pushed.arguments, 'c1');
    });

    testWidgets('the grid is 2 columns on a phone-width screen', (
      tester,
    ) async {
      await cubit.load();
      await pump(tester, size: const Size(400, 1200));
      await tester.pumpAndSettle();

      final delegate =
          tester.widget<GridView>(find.byType(GridView)).gridDelegate
              as SliverGridDelegateWithFixedCrossAxisCount;
      expect(delegate.crossAxisCount, 2);
    });

    testWidgets('the grid is 3 columns at tablet width', (tester) async {
      await cubit.load();
      await pump(tester, size: const Size(800, 1200));
      await tester.pumpAndSettle();

      final delegate =
          tester.widget<GridView>(find.byType(GridView)).gridDelegate
              as SliverGridDelegateWithFixedCrossAxisCount;
      expect(delegate.crossAxisCount, 3);
    });

    testWidgets('opening the filter sheet shows Sort, Status and Library', (
      tester,
    ) async {
      await cubit.load();
      await pump(tester);
      await tester.pumpAndSettle();

      await tester.tap(
        find.byKey(const ValueKey<String>('browseFiltersButton')),
      );
      await tester.pumpAndSettle();

      expect(
        find.byKey(const ValueKey<String>('browseSheetSort')),
        findsOneWidget,
      );
      expect(
        find.byKey(const ValueKey<String>('browseSheetStatus')),
        findsOneWidget,
      );
      expect(
        find.byKey(const ValueKey<String>('browseSheetLibrary')),
        findsOneWidget,
      );
      expect(find.text('Backend'), findsOneWidget);
      expect(find.text('Databases'), findsOneWidget);
    });

    testWidgets('applying a status in the sheet refetches and shows a chip', (
      tester,
    ) async {
      await cubit.load();
      await pump(tester);
      await tester.pumpAndSettle();

      when(
        () => repository.fetchCourses(
          const BrowseFilter(status: BrowseStatusFilter.completed),
        ),
      ).thenAnswer((_) async => <BrowseCourse>[_courseA]);

      await tester.tap(
        find.byKey(const ValueKey<String>('browseFiltersButton')),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.text('Completed'));
      await tester.tap(find.byKey(const ValueKey<String>('browseSheetApply')));
      await tester.pumpAndSettle();

      expect(cubit.state.filter.status, BrowseStatusFilter.completed);
      expect(
        find.byKey(const ValueKey<String>('browseChipStatus')),
        findsOneWidget,
      );

      // Removing the chip clears the status filter again.
      when(
        () => repository.fetchCourses(const BrowseFilter()),
      ).thenAnswer((_) async => <BrowseCourse>[_courseA, _courseB]);
      await tester.tap(
        find
            .descendant(
              of: find.byKey(const ValueKey<String>('browseChipStatus')),
              matching: find.byType(GestureDetector),
            )
            .last,
      );
      await tester.pumpAndSettle();

      expect(cubit.state.filter.status, BrowseStatusFilter.all);
    });
  });

  group('empty', () {
    testWidgets('shows the empty surface without a clear-all when unfiltered', (
      tester,
    ) async {
      when(
        () => repository.fetchCourses(any()),
      ).thenAnswer((_) async => <BrowseCourse>[]);
      await cubit.load();
      await pump(tester);
      await tester.pumpAndSettle();

      expect(find.byType(AppEmptyState), findsOneWidget);
      expect(find.text('No courses match'), findsOneWidget);
      expect(
        find.byKey(const ValueKey<String>('browseEmptyClearAll')),
        findsNothing,
      );
    });

    testWidgets('shows Clear all filters when the empty result is filtered', (
      tester,
    ) async {
      when(
        () => repository.fetchCourses(any()),
      ).thenAnswer((_) async => <BrowseCourse>[_courseA]);
      await cubit.load();
      when(
        () => repository.fetchCourses(
          const BrowseFilter(status: BrowseStatusFilter.completed),
        ),
      ).thenAnswer((_) async => <BrowseCourse>[]);
      await cubit.setStatus(BrowseStatusFilter.completed);

      await pump(tester);
      await tester.pumpAndSettle();

      expect(find.byType(AppEmptyState), findsOneWidget);
      final clearAll = find.byKey(
        const ValueKey<String>('browseEmptyClearAll'),
      );
      expect(clearAll, findsOneWidget);

      when(
        () => repository.fetchCourses(const BrowseFilter()),
      ).thenAnswer((_) async => <BrowseCourse>[_courseA, _courseB]);
      await tester.tap(clearAll);
      await tester.pumpAndSettle();

      expect(cubit.state.filter, const BrowseFilter());
      expect(find.byType(CoursePosterCard), findsNWidgets(2));
    });
  });

  group('failed', () {
    testWidgets('shows the error surface with a retry that re-fetches', (
      tester,
    ) async {
      when(() => repository.fetchCourses(any())).thenThrow(Exception('boom'));
      await cubit.load();
      await pump(tester);
      await tester.pumpAndSettle();

      expect(find.byType(AppErrorState), findsOneWidget);
      expect(find.text('Couldn’t load courses'), findsOneWidget);

      when(
        () => repository.fetchCourses(any()),
      ).thenAnswer((_) async => <BrowseCourse>[_courseA]);
      await tester.tap(find.byKey(const ValueKey<String>('browseRetry')));
      await tester.pumpAndSettle();

      expect(find.byType(AppErrorState), findsNothing);
      expect(find.text('Distributed Systems'), findsOneWidget);
    });
  });
}
