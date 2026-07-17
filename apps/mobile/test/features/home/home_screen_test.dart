import 'dart:async';

import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:app_mobile/features/home/domain/home_repository.dart';
import 'package:app_mobile/features/home/domain/home_summary.dart';
import 'package:app_mobile/features/home/presentation/bloc/home_cubit.dart';
import 'package:app_mobile/features/home/presentation/home_screen.dart';
import 'package:app_mobile/i18n/strings.g.dart';

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

void main() {
  late _MockHomeRepository repository;
  late HomeCubit cubit;
  var downloadsTapped = 0;
  var libraryTapped = 0;

  setUp(() {
    repository = _MockHomeRepository();
    cubit = HomeCubit(repository);
    downloadsTapped = 0;
    libraryTapped = 0;
  });

  tearDown(() async {
    await cubit.close();
  });

  Future<void> pump(WidgetTester tester) async {
    await tester.binding.setSurfaceSize(const Size(800, 1400));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      TranslationProvider(
        child: MaterialApp(
          theme: AppTheme.dark(),
          home: Scaffold(
            body: BlocProvider<HomeCubit>.value(
              value: cubit,
              // The shell owns the vertical scrollable in production; a
              // SingleChildScrollView stands in for it so the intrinsically
              // sized body has an unbounded slot, exactly as it does live.
              child: HomeQuickLinks(
                openDownloads: () => downloadsTapped++,
                openLibrary: () => libraryTapped++,
                child: const SingleChildScrollView(child: HomeTabBody()),
              ),
            ),
          ),
        ),
      ),
    );
  }

  group('loading', () {
    testWidgets('shows skeleton cards, no error/empty surface', (tester) async {
      final completer = Completer<HomeSummary>();
      when(repository.fetchSummary).thenAnswer((_) => completer.future);

      unawaited(cubit.load());
      await pump(tester);
      await tester.pump(); // one frame; fetch still pending

      // Loading cards render AppSkeletons; the resolved states never do.
      expect(find.byType(AppSkeleton), findsWidgets);
      expect(find.byType(AppEmptyState), findsNothing);
      expect(find.byType(AppErrorState), findsNothing);

      completer.complete(_populated);
      await tester.pumpAndSettle();
    });
  });

  group('loaded', () {
    setUp(() => when(repository.fetchSummary).thenAnswer((_) async => _populated));

    testWidgets('renders both carousels and the row headings', (tester) async {
      await cubit.load();
      await pump(tester);
      await tester.pumpAndSettle();

      expect(find.text('Continue watching'), findsOneWidget);
      expect(find.text('Recently added'), findsOneWidget);
      expect(find.text('Rust in anger'), findsOneWidget);
      expect(find.text('Postgres internals'), findsOneWidget);
      expect(find.byType(CourseWideCard), findsOneWidget);
      expect(find.byType(CoursePosterCard), findsOneWidget);
      expect(find.byType(AppEmptyState), findsNothing);
    });

    testWidgets('drops a whole row (header included) when it is empty',
        (tester) async {
      when(repository.fetchSummary).thenAnswer(
        (_) async => const HomeSummary(
          continueWatching: <ContinueWatchingCourse>[],
          recentlyAdded: <RecentlyAddedCourse>[_added],
          libraryCount: 1,
        ),
      );
      await cubit.load();
      await pump(tester);
      await tester.pumpAndSettle();

      // Continue-watching is empty, so neither its heading nor a card shows;
      // Recently-added still does. (Both empty would be the Empty state.)
      expect(find.text('Continue watching'), findsNothing);
      expect(find.byType(CourseWideCard), findsNothing);
      expect(find.text('Recently added'), findsOneWidget);
      expect(find.byType(CoursePosterCard), findsOneWidget);
    });

    testWidgets('quick links tap through to the shell callbacks',
        (tester) async {
      await cubit.load();
      await pump(tester);
      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const ValueKey('homeQuickDownloads')));
      await tester.tap(find.byKey(const ValueKey('homeQuickLibrary')));
      await tester.pump();

      expect(downloadsTapped, 1);
      expect(libraryTapped, 1);
    });
  });

  group('empty', () {
    testWidgets('shows the empty surface but keeps the quick links',
        (tester) async {
      when(repository.fetchSummary).thenAnswer(
        (_) async => const HomeSummary(
          continueWatching: <ContinueWatchingCourse>[],
          recentlyAdded: <RecentlyAddedCourse>[],
          libraryCount: 1,
        ),
      );
      await cubit.load();
      await pump(tester);
      await tester.pumpAndSettle();

      expect(find.byType(AppEmptyState), findsOneWidget);
      expect(find.text('Nothing here yet'), findsOneWidget);
      expect(find.byType(CourseWideCard), findsNothing);
      // Quick links persist across states.
      expect(find.byKey(const ValueKey('homeQuickDownloads')), findsOneWidget);
      expect(find.byKey(const ValueKey('homeQuickLibrary')), findsOneWidget);
    });

    testWidgets('Library quick link is disabled when there are no libraries',
        (tester) async {
      when(repository.fetchSummary).thenAnswer(
        (_) async => const HomeSummary(
          continueWatching: <ContinueWatchingCourse>[],
          recentlyAdded: <RecentlyAddedCourse>[],
          libraryCount: 0,
        ),
      );
      await cubit.load();
      await pump(tester);
      await tester.pumpAndSettle();

      final library = tester.widget<AppButton>(
        find.byKey(const ValueKey('homeQuickLibrary')),
      );
      expect(library.disabled, isTrue);

      // And it is disabled at the interaction layer, not just visually: a tap
      // must not reach the callback. (AppButton nulls onPressed when disabled,
      // so the semantics node reports enabled:false and no tap action too.)
      await tester.tap(find.byKey(const ValueKey('homeQuickLibrary')));
      await tester.pump();
      expect(libraryTapped, 0);

      // Downloads is local and always reachable.
      final downloads = tester.widget<AppButton>(
        find.byKey(const ValueKey('homeQuickDownloads')),
      );
      expect(downloads.disabled, isFalse);
    });
  });

  group('failed', () {
    testWidgets('shows the error surface with a retry that re-fetches',
        (tester) async {
      when(repository.fetchSummary).thenThrow(Exception('boom'));
      await cubit.load();
      await pump(tester);
      await tester.pumpAndSettle();

      expect(find.byType(AppErrorState), findsOneWidget);
      expect(find.text('Could not load your home'), findsOneWidget);

      // The retry recovers to Loaded.
      when(repository.fetchSummary).thenAnswer((_) async => _populated);
      await tester.tap(find.byKey(const ValueKey('homeRetry')));
      await tester.pumpAndSettle();

      expect(find.byType(AppErrorState), findsNothing);
      expect(find.text('Rust in anger'), findsOneWidget);
      verify(repository.fetchSummary).called(2);
    });
  });
}
