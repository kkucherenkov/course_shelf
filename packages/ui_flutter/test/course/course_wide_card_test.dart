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
        body: Center(child: SizedBox(width: 480, child: child)),
      ),
    ),
  );
}

void main() {
  group('CourseWideCard', () {
    testWidgets('renders title, instructor and completed/lessons count', (
      tester,
    ) async {
      await _pump(tester, const CourseWideCard(course: _course));
      expect(find.text('Advanced Vue Patterns'), findsOneWidget);
      expect(find.text('Jane Doe'), findsOneWidget);
      expect(find.text('4/12'), findsOneWidget);
    });

    testWidgets('omits the instructor line when empty', (tester) async {
      await _pump(
        tester,
        const CourseWideCard(
          course: CourseCardData(
            id: '2',
            title: 'No Instructor Course',
            instructor: '',
            lessons: 10,
            completed: 5,
            accent: CourseAccent.indigo,
          ),
        ),
      );
      expect(find.text('No Instructor Course'), findsOneWidget);
    });

    testWidgets('falls back to the completion percentage without a '
        'resumeLabel', (tester) async {
      await _pump(tester, const CourseWideCard(course: _course));
      // completed=4, lessons=12 -> round(33.33) = 33%.
      expect(find.text('33%'), findsOneWidget);
    });

    testWidgets('prefers resumeLabel over the percentage', (tester) async {
      await _pump(
        tester,
        const CourseWideCard(course: _course, resumeLabel: 'Resume 2:05'),
      );
      expect(find.text('Resume 2:05'), findsOneWidget);
      expect(find.text('33%'), findsNothing);
    });

    testWidgets('always renders the progress strip regardless of state', (
      tester,
    ) async {
      for (final state in CourseCardState.values) {
        await _pump(tester, CourseWideCard(course: _course, state: state));
        expect(
          find.byType(CourseProgressStrip),
          findsOneWidget,
          reason: 'state: $state',
        );
      }
    });

    testWidgets('loading renders skeletons instead of content', (tester) async {
      await _pump(tester, const CourseWideCard(course: _course, loading: true));
      expect(find.byType(AppSkeleton), findsWidgets);
      expect(find.text('Advanced Vue Patterns'), findsNothing);
    });

    testWidgets('interactive (default) fires onTap with the course on tap', (
      tester,
    ) async {
      CourseCardData? tapped;
      await _pump(
        tester,
        CourseWideCard(course: _course, onTap: (c) => tapped = c),
      );
      await tester.tap(find.byType(CourseWideCard));
      expect(tapped, _course);
    });

    testWidgets('interactive: false does not fire onTap and has no InkWell', (
      tester,
    ) async {
      CourseCardData? tapped;
      await _pump(
        tester,
        CourseWideCard(
          course: _course,
          interactive: false,
          onTap: (c) => tapped = c,
        ),
      );
      await tester.tap(find.byType(CourseWideCard), warnIfMissed: false);
      expect(tapped, isNull);
      expect(find.byType(InkWell), findsNothing);
    });
  });
}
