import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golden_toolkit/golden_toolkit.dart';

import 'package:app_ui/app_ui.dart';

import '../_support/fonts.dart';

const CourseCardData _course = CourseCardData(
  id: '1',
  title: 'Advanced Vue Patterns',
  instructor: 'Jane Doe',
  lessons: 12,
  completed: 4,
  accent: CourseAccent.teal,
);

const CourseCardData _completeCourse = CourseCardData(
  id: '2',
  title: 'System Design Interviews',
  instructor: 'Ada Lovelace',
  lessons: 8,
  completed: 8,
  accent: CourseAccent.coral,
);

Widget _label(String text) => Padding(
  padding: const EdgeInsets.only(top: 8, bottom: 4),
  child: Text(text),
);

Widget _matrix(ThemeData theme) {
  return MaterialApp(
    debugShowCheckedModeBanner: false,
    theme: theme,
    home: Scaffold(
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            _label(
              'CoursePosterCard — not-started / in-progress / completed / locked',
            ),
            const Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                SizedBox(
                  width: 140,
                  child: CoursePosterCard(
                    course: _course,
                    state: CourseCardState.notStarted,
                  ),
                ),
                SizedBox(width: 12),
                SizedBox(
                  width: 140,
                  child: CoursePosterCard(
                    course: _course,
                    state: CourseCardState.inProgress,
                  ),
                ),
                SizedBox(width: 12),
                SizedBox(
                  width: 140,
                  child: CoursePosterCard(
                    course: _completeCourse,
                    state: CourseCardState.completed,
                  ),
                ),
                SizedBox(width: 12),
                SizedBox(
                  width: 140,
                  child: CoursePosterCard(
                    course: _course,
                    state: CourseCardState.locked,
                  ),
                ),
                SizedBox(width: 12),
                SizedBox(
                  width: 140,
                  child: CoursePosterCard(course: _course, loading: true),
                ),
              ],
            ),
            _label(
              'CourseWideCard — resumeLabel fallback / explicit / loading',
            ),
            const SizedBox(
              width: 420,
              child: Column(
                children: <Widget>[
                  CourseWideCard(course: _course),
                  SizedBox(height: 8),
                  CourseWideCard(course: _course, resumeLabel: 'Resume 2:05'),
                  SizedBox(height: 8),
                  CourseWideCard(
                    course: _completeCourse,
                    state: CourseCardState.completed,
                  ),
                  SizedBox(height: 8),
                  CourseWideCard(course: _course, loading: true),
                ],
              ),
            ),
            _label('CourseCompactRow — states + loading'),
            const SizedBox(
              width: 360,
              child: Column(
                children: <Widget>[
                  CourseCompactRow(course: _course),
                  SizedBox(height: 2),
                  CourseCompactRow(
                    course: _completeCourse,
                    state: CourseCardState.completed,
                  ),
                  SizedBox(height: 2),
                  CourseCompactRow(
                    course: _course,
                    state: CourseCardState.locked,
                  ),
                  SizedBox(height: 2),
                  CourseCompactRow(course: _course, loading: true),
                ],
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

Future<void> _pumpMatrix(WidgetTester tester) =>
    tester.pump(const Duration(milliseconds: 32));

void main() {
  setUpAll(() async {
    await loadAppFonts();
    await loadPackagedFonts();
  });

  testGoldens('course card matrix — light', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.light()),
      surfaceSize: const Size(820, 1000),
    );
    await screenMatchesGolden(
      tester,
      'course_card_matrix_light',
      customPump: _pumpMatrix,
    );
  });

  testGoldens('course card matrix — dark', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.dark()),
      surfaceSize: const Size(820, 1000),
    );
    await screenMatchesGolden(
      tester,
      'course_card_matrix_dark',
      customPump: _pumpMatrix,
    );
  });
}
