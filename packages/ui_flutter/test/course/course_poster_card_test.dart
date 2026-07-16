import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_ui/app_ui.dart';

const CourseCardData _course = CourseCardData(
  id: '1',
  title: 'Advanced Vue Patterns',
  instructor: 'Jane Doe',
  lessons: 12,
  completed: 4,
  accent: CourseAccent.teal,
);

Future<void> _pump(WidgetTester tester, Widget child) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: AppTheme.light(),
      home: Scaffold(
        body: Center(child: SizedBox(width: 180, child: child)),
      ),
    ),
  );
}

void main() {
  group('CoursePosterCard', () {
    testWidgets('renders the title and instructor', (tester) async {
      await _pump(tester, const CoursePosterCard(course: _course));
      expect(find.text('Advanced Vue Patterns'), findsOneWidget);
      expect(find.text('Jane Doe'), findsOneWidget);
    });

    testWidgets('omits the instructor line when empty', (tester) async {
      await _pump(
        tester,
        const CoursePosterCard(
          course: CourseCardData(
            id: '2',
            title: 'No Instructor Course',
            instructor: '',
            lessons: 10,
            completed: 0,
            accent: CourseAccent.amber,
          ),
        ),
      );
      expect(find.text('No Instructor Course'), findsOneWidget);
      expect(find.text(''), findsNothing);
    });

    testWidgets('renders initials from the title', (tester) async {
      await _pump(tester, const CoursePosterCard(course: _course));
      expect(find.text('AV'), findsOneWidget);
    });

    testWidgets('completed state shows the check badge, no progress strip', (
      tester,
    ) async {
      await _pump(
        tester,
        const CoursePosterCard(
          course: _course,
          state: CourseCardState.completed,
        ),
      );
      expect(find.byType(IconCS), findsOneWidget);
      expect(find.byType(CourseProgressStrip), findsNothing);
    });

    testWidgets('locked state shows a scrim + lock icon, no progress strip', (
      tester,
    ) async {
      await _pump(
        tester,
        const CoursePosterCard(course: _course, state: CourseCardState.locked),
      );
      final IconCS icon = tester.widget<IconCS>(find.byType(IconCS));
      expect(icon.name, IconName.lock);
      expect(find.byType(CourseProgressStrip), findsNothing);
    });

    testWidgets('not-started/in-progress states show the progress strip', (
      tester,
    ) async {
      await _pump(
        tester,
        const CoursePosterCard(
          course: _course,
          state: CourseCardState.inProgress,
        ),
      );
      expect(find.byType(CourseProgressStrip), findsOneWidget);
      expect(find.byType(IconCS), findsNothing);
    });

    testWidgets('loading renders skeletons instead of content', (tester) async {
      await _pump(
        tester,
        const CoursePosterCard(course: _course, loading: true),
      );
      expect(find.byType(AppSkeleton), findsWidgets);
      expect(find.text('Advanced Vue Patterns'), findsNothing);
    });

    testWidgets('interactive (default) fires onTap with the course on tap', (
      tester,
    ) async {
      CourseCardData? tapped;
      await _pump(
        tester,
        CoursePosterCard(course: _course, onTap: (c) => tapped = c),
      );
      await tester.tap(find.byType(CoursePosterCard));
      expect(tapped, _course);
    });

    testWidgets('interactive exposes button semantics with the title', (
      tester,
    ) async {
      await _pump(tester, CoursePosterCard(course: _course, onTap: (_) {}));
      final Semantics semantics = tester.widget<Semantics>(
        find.byWidgetPredicate(
          (Widget w) =>
              w is Semantics && w.properties.label == 'Advanced Vue Patterns',
        ),
      );
      expect(semantics.properties.button, isTrue);
    });

    testWidgets('interactive: false does not fire onTap and has no button', (
      tester,
    ) async {
      CourseCardData? tapped;
      await _pump(
        tester,
        CoursePosterCard(
          course: _course,
          interactive: false,
          onTap: (c) => tapped = c,
        ),
      );
      await tester.tap(find.byType(CoursePosterCard), warnIfMissed: false);
      expect(tapped, isNull);
      expect(find.byType(InkWell), findsNothing);
    });
  });
}
