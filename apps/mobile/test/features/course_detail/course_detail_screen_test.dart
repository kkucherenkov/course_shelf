import 'dart:async';

import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:app_mobile/app/routes.dart';
import 'package:app_mobile/features/course_detail/domain/course_detail.dart';
import 'package:app_mobile/features/course_detail/domain/course_detail_repository.dart';
import 'package:app_mobile/features/course_detail/presentation/bloc/course_detail_cubit.dart';
import 'package:app_mobile/features/course_detail/presentation/course_detail_screen.dart';
import 'package:app_mobile/i18n/strings.g.dart';

class _MockCourseDetailRepository extends Mock
    implements CourseDetailRepository {}

const _lessonA = CourseDetailLesson(
  id: 'l1',
  position: 1,
  title: 'Intro',
  durationSeconds: 300,
  hasMaterials: false,
  state: CourseDetailLessonState.notStarted,
  progressPercent: 0,
);

const _lessonB = CourseDetailLesson(
  id: 'l2',
  position: 2,
  title: 'Deep dive',
  durationSeconds: 600,
  hasMaterials: true,
  state: CourseDetailLessonState.notStarted,
  progressPercent: 0,
);

const _sectionNotStarted = CourseDetailSection(
  id: 's1',
  position: 1,
  title: 'Foundations',
  totalDurationSeconds: 900,
  lessons: <CourseDetailLesson>[_lessonA, _lessonB],
);

const _summaryNotStarted = CourseDetailSummary(
  id: 'c1',
  title: 'Distributed Systems',
  instructor: 'Martin K',
  librarySlug: 'cs',
  lessonsTotal: 2,
  totalDurationSeconds: 900,
  lessonsCompleted: 0,
);

const _outlineNotStarted = CourseDetailOutline(
  summary: _summaryNotStarted,
  sections: <CourseDetailSection>[_sectionNotStarted],
);

const _sectionResume = CourseDetailSection(
  id: 's1',
  position: 1,
  title: 'Foundations',
  totalDurationSeconds: 900,
  lessons: <CourseDetailLesson>[
    CourseDetailLesson(
      id: 'l1',
      position: 1,
      title: 'Intro',
      durationSeconds: 300,
      hasMaterials: false,
      state: CourseDetailLessonState.completed,
      progressPercent: 0,
    ),
    CourseDetailLesson(
      id: 'l2',
      position: 2,
      title: 'Deep dive',
      durationSeconds: 600,
      hasMaterials: true,
      state: CourseDetailLessonState.inProgress,
      progressPercent: 42,
    ),
  ],
);

const _summaryResume = CourseDetailSummary(
  id: 'c1',
  title: 'Distributed Systems',
  instructor: 'Martin K',
  librarySlug: 'cs',
  lessonsTotal: 2,
  totalDurationSeconds: 900,
  lessonsCompleted: 1,
);

const _outlineResume = CourseDetailOutline(
  summary: _summaryResume,
  sections: <CourseDetailSection>[_sectionResume],
);

const _estimate = CourseDownloadEstimate(
  courseId: 'c1',
  totalBytes: 1288490188,
  lessonCount: 2,
);

const _sectionCompleted = CourseDetailSection(
  id: 's1',
  position: 1,
  title: 'Foundations',
  totalDurationSeconds: 900,
  lessons: <CourseDetailLesson>[
    CourseDetailLesson(
      id: 'l1',
      position: 1,
      title: 'Intro',
      durationSeconds: 300,
      hasMaterials: false,
      state: CourseDetailLessonState.completed,
      progressPercent: 0,
    ),
    CourseDetailLesson(
      id: 'l2',
      position: 2,
      title: 'Deep dive',
      durationSeconds: 600,
      hasMaterials: true,
      state: CourseDetailLessonState.completed,
      progressPercent: 0,
    ),
  ],
);

const _summaryCompleted = CourseDetailSummary(
  id: 'c1',
  title: 'Distributed Systems',
  instructor: 'Martin K',
  librarySlug: 'cs',
  lessonsTotal: 2,
  totalDurationSeconds: 900,
  lessonsCompleted: 2,
);

const _outlineCompleted = CourseDetailOutline(
  summary: _summaryCompleted,
  sections: <CourseDetailSection>[_sectionCompleted],
);

/// A minimal `onGenerateRoute` spy: maps `AppRoutes.lesson` to a Scaffold that
/// renders the pushed argument as text, so a test can assert both that the
/// push happened AND which lesson id it carried without standing up the real
/// `LessonPlayerScreen` (and its own DI graph).
Route<dynamic>? _spyRoute(RouteSettings settings) {
  if (settings.name == AppRoutes.lesson) {
    return MaterialPageRoute<void>(
      builder: (_) => Scaffold(body: Text('lesson:${settings.arguments}')),
      settings: settings,
    );
  }
  return null;
}

void main() {
  late _MockCourseDetailRepository repository;
  late CourseDetailCubit cubit;

  setUp(() {
    repository = _MockCourseDetailRepository();
    cubit = CourseDetailCubit(repository);
  });

  tearDown(() async => cubit.close());

  Future<void> pump(WidgetTester tester) async {
    await tester.binding.setSurfaceSize(const Size(800, 1400));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      TranslationProvider(
        child: MaterialApp(
          theme: AppTheme.dark(),
          onGenerateRoute: _spyRoute,
          home: BlocProvider<CourseDetailCubit>.value(
            value: cubit,
            child: const CourseDetailView(),
          ),
        ),
      ),
    );
  }

  group('loading', () {
    testWidgets('shows a spinner, no scaffold content yet', (tester) async {
      final completer = Completer<CourseDetailOutline>();
      when(
        () => repository.fetchOutline('c1'),
      ).thenAnswer((_) => completer.future);
      when(
        () => repository.fetchDownloadEstimate('c1'),
      ).thenAnswer((_) async => _estimate);

      unawaited(cubit.load('c1'));
      await pump(tester);
      await tester.pump();

      expect(find.byType(AppSpinner), findsOneWidget);
      expect(find.byType(AppErrorState), findsNothing);
      expect(find.byType(AppNoPermission), findsNothing);

      completer.complete(_outlineNotStarted);
      await tester.pumpAndSettle();
    });
  });

  group('loaded — not started (0%)', () {
    setUp(() {
      when(
        () => repository.fetchOutline('c1'),
      ).thenAnswer((_) async => _outlineNotStarted);
      // No estimate: the secondary CTA falls back to its no-size label.
      when(
        () => repository.fetchDownloadEstimate('c1'),
      ).thenThrow(Exception('no estimate'));
    });

    testWidgets(
      'renders the hero, "Start course", curriculum, and Download course',
      (tester) async {
        await cubit.load('c1');
        await pump(tester);
        await tester.pumpAndSettle();

        expect(find.text('Distributed Systems'), findsOneWidget);
        expect(find.text('Martin K'), findsOneWidget);
        expect(find.text('Start course'), findsOneWidget);
        expect(find.text('Download course'), findsOneWidget);
        expect(find.text('Intro'), findsOneWidget);
        expect(find.text('Deep dive'), findsOneWidget);
        expect(find.byType(AppLessonRow), findsNWidgets(2));
        // Nothing is "in progress" yet, so there is no resume note.
        expect(
          find.byKey(const ValueKey('courseDetailResumeNote')),
          findsNothing,
        );
      },
    );

    testWidgets(
      'tapping the primary CTA pushes the lesson route for the first lesson',
      (tester) async {
        await cubit.load('c1');
        await pump(tester);
        await tester.pumpAndSettle();

        await tester.tap(find.byKey(const ValueKey('courseDetailPrimaryCta')));
        await tester.pumpAndSettle();

        expect(find.text('lesson:l1'), findsOneWidget);
      },
    );

    testWidgets('collapsing a section hides its lesson rows', (tester) async {
      await cubit.load('c1');
      await pump(tester);
      await tester.pumpAndSettle();

      expect(find.byType(AppLessonRow), findsNWidgets(2));

      await tester.tap(find.byType(AppSectionHeader));
      await tester.pumpAndSettle();

      expect(find.byType(AppLessonRow), findsNothing);
    });

    testWidgets('the download CTA is a labelled seam, not a dead button', (
      tester,
    ) async {
      await cubit.load('c1');
      await pump(tester);
      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const ValueKey('courseDetailDownloadCta')));
      await tester.pump();

      expect(
        find.text('This part of CourseShelf is still being built.'),
        findsOneWidget,
      );
    });
  });

  group('loaded — resuming (50%)', () {
    setUp(() {
      when(
        () => repository.fetchOutline('c1'),
      ).thenAnswer((_) async => _outlineResume);
      when(
        () => repository.fetchDownloadEstimate('c1'),
      ).thenAnswer((_) async => _estimate);
    });

    testWidgets(
      'shows "Resume", the up-next note, and the real download size',
      (tester) async {
        await cubit.load('c1');
        await pump(tester);
        await tester.pumpAndSettle();

        expect(find.text('Resume'), findsOneWidget);
        expect(find.text('Download course · 1.2 GB'), findsOneWidget);
        expect(find.text('Up next · Foundations · Deep dive'), findsOneWidget);

        final currentRow = tester.widget<AppLessonRow>(
          find.byKey(const ValueKey('courseDetailLesson_l2')),
        );
        expect(currentRow.current, isTrue);
      },
    );

    testWidgets(
      'tapping the primary CTA pushes the lesson route for the in-progress lesson',
      (tester) async {
        await cubit.load('c1');
        await pump(tester);
        await tester.pumpAndSettle();

        await tester.tap(find.byKey(const ValueKey('courseDetailPrimaryCta')));
        await tester.pumpAndSettle();

        expect(find.text('lesson:l2'), findsOneWidget);
      },
    );
  });

  group('loaded — completed (100%)', () {
    setUp(() {
      when(
        () => repository.fetchOutline('c1'),
      ).thenAnswer((_) async => _outlineCompleted);
      when(
        () => repository.fetchDownloadEstimate('c1'),
      ).thenThrow(Exception('no estimate'));
    });

    testWidgets('shows "Watch again" and "Completed"', (tester) async {
      await cubit.load('c1');
      await pump(tester);
      await tester.pumpAndSettle();

      expect(find.text('Watch again'), findsOneWidget);
      expect(find.text('Completed'), findsOneWidget);
      expect(find.text('100%'), findsOneWidget);
    });
  });

  group('noAccess', () {
    testWidgets('shows the locked banner and a disabled Enroll seam', (
      tester,
    ) async {
      when(
        () => repository.fetchOutline('c1'),
      ).thenThrow(const CourseAccessDeniedException('c1'));
      when(
        () => repository.fetchDownloadEstimate('c1'),
      ).thenAnswer((_) async => _estimate);

      await cubit.load('c1');
      await pump(tester);
      await tester.pumpAndSettle();

      expect(find.byType(AppNoPermission), findsOneWidget);
      expect(find.text('This course is locked'), findsOneWidget);

      final enroll = tester.widget<AppButton>(
        find.byKey(const ValueKey('courseDetailEnrollSeam')),
      );
      expect(enroll.disabled, isTrue);
    });
  });

  group('failed', () {
    testWidgets('shows the error surface with a retry that re-fetches', (
      tester,
    ) async {
      when(() => repository.fetchOutline('c1')).thenThrow(Exception('boom'));
      when(
        () => repository.fetchDownloadEstimate('c1'),
      ).thenAnswer((_) async => _estimate);

      await cubit.load('c1');
      await pump(tester);
      await tester.pumpAndSettle();

      expect(find.byType(AppErrorState), findsOneWidget);
      expect(find.text('Could not load this course'), findsOneWidget);

      when(
        () => repository.fetchOutline('c1'),
      ).thenAnswer((_) async => _outlineNotStarted);
      await tester.tap(find.byKey(const ValueKey('courseDetailRetry')));
      await tester.pumpAndSettle();

      expect(find.byType(AppErrorState), findsNothing);
      expect(find.text('Distributed Systems'), findsOneWidget);
      verify(() => repository.fetchOutline('c1')).called(2);
    });
  });
}
