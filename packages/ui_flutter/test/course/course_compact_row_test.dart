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
        body: Center(child: SizedBox(width: 400, child: child)),
      ),
    ),
  );
}

void main() {
  group('CourseCompactRow', () {
    testWidgets('renders the title and percentage label', (tester) async {
      await _pump(tester, const CourseCompactRow(course: _course));
      expect(find.text('Advanced Vue Patterns'), findsOneWidget);
      // completed=4, lessons=12 -> round(33.33) = 33%.
      expect(find.text('33%'), findsOneWidget);
    });

    testWidgets('renders no glyph — only IconCS-free thumb + bar', (
      tester,
    ) async {
      await _pump(tester, const CourseCompactRow(course: _course));
      expect(find.byType(IconCS), findsNothing);
      expect(find.byType(AppProgressLinear), findsOneWidget);
    });

    testWidgets('completed state reports 100%', (tester) async {
      await _pump(
        tester,
        const CourseCompactRow(
          course: _course,
          state: CourseCardState.completed,
        ),
      );
      expect(find.text('100%'), findsOneWidget);
    });

    testWidgets('not-started/locked states report 0%', (tester) async {
      await _pump(
        tester,
        const CourseCompactRow(
          course: _course,
          state: CourseCardState.notStarted,
        ),
      );
      expect(find.text('0%'), findsOneWidget);

      await _pump(
        tester,
        const CourseCompactRow(course: _course, state: CourseCardState.locked),
      );
      expect(find.text('0%'), findsOneWidget);
    });

    testWidgets('loading renders skeletons instead of content', (tester) async {
      await _pump(
        tester,
        const CourseCompactRow(course: _course, loading: true),
      );
      expect(find.byType(AppSkeleton), findsWidgets);
      expect(find.text('Advanced Vue Patterns'), findsNothing);
    });

    testWidgets('fires onTap with the course on tap', (tester) async {
      CourseCardData? tapped;
      await _pump(
        tester,
        CourseCompactRow(course: _course, onTap: (c) => tapped = c),
      );
      await tester.tap(find.byType(CourseCompactRow));
      expect(tapped, _course);
    });

    testWidgets('exposes button semantics with the title', (tester) async {
      await _pump(tester, CourseCompactRow(course: _course, onTap: (_) {}));
      final Semantics semantics = tester.widget<Semantics>(
        find.byWidgetPredicate(
          (Widget w) =>
              w is Semantics && w.properties.label == 'Advanced Vue Patterns',
        ),
      );
      expect(semantics.properties.button, isTrue);
    });
  });
}
