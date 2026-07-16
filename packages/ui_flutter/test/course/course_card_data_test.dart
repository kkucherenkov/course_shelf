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

void main() {
  group('courseAccentColor', () {
    test('resolves every accent to a distinct swatch', () {
      final Set<Color> colors = CourseAccent.values
          .map(courseAccentColor)
          .toSet();
      expect(colors, hasLength(CourseAccent.values.length));
    });

    test('mirrors the web COVER map hex values', () {
      expect(courseAccentColor(CourseAccent.teal), const Color(0xFF3F8C84));
      expect(courseAccentColor(CourseAccent.amber), const Color(0xFFC8821C));
      expect(courseAccentColor(CourseAccent.indigo), const Color(0xFF6B72B8));
      expect(courseAccentColor(CourseAccent.warm), const Color(0xFF5C5644));
      expect(courseAccentColor(CourseAccent.coral), const Color(0xFFD26B5C));
      expect(courseAccentColor(CourseAccent.neutral), const Color(0xFF454952));
    });
  });

  group('courseCardInitials', () {
    test('takes the first letter of up to the first two words > 2 chars', () {
      expect(courseCardInitials('Advanced Vue Patterns'), 'AV');
    });

    test('skips short words (<=2 chars)', () {
      // "Go" and "To" are both <=2 chars, so only "Production" qualifies —
      // matches the web `initials()` filter exactly.
      expect(courseCardInitials('Go To Production'), 'P');
    });

    test('is empty when every word is <=2 chars', () {
      expect(courseCardInitials('Go Up'), '');
    });

    test('uppercases the result', () {
      expect(courseCardInitials('advanced vue'), 'AV');
    });
  });

  group('courseCardPercent', () {
    test('completed state always reports 100', () {
      expect(courseCardPercent(_course, CourseCardState.completed), 100);
    });

    test('not-started state always reports 0', () {
      expect(courseCardPercent(_course, CourseCardState.notStarted), 0);
    });

    test('locked state always reports 0', () {
      expect(courseCardPercent(_course, CourseCardState.locked), 0);
    });

    test('auto/in-progress compute completed/lessons rounded', () {
      expect(courseCardPercent(_course, CourseCardState.auto), 33);
      expect(courseCardPercent(_course, CourseCardState.inProgress), 33);
    });

    test('clamps to 0 when lessons is zero', () {
      const CourseCardData zeroLessons = CourseCardData(
        id: '2',
        title: 'Empty Course',
        instructor: '',
        lessons: 0,
        completed: 0,
        accent: CourseAccent.neutral,
      );
      expect(courseCardPercent(zeroLessons, CourseCardState.auto), 0);
    });

    test('clamps to 100 when completed exceeds lessons', () {
      const CourseCardData over = CourseCardData(
        id: '3',
        title: 'Over Course',
        instructor: '',
        lessons: 10,
        completed: 20,
        accent: CourseAccent.neutral,
      );
      expect(courseCardPercent(over, CourseCardState.auto), 100);
    });
  });

  group('courseCardRealState', () {
    test('pins non-auto states straight through', () {
      expect(
        courseCardRealState(_course, CourseCardState.notStarted),
        CourseCardRealState.notStarted,
      );
      expect(
        courseCardRealState(_course, CourseCardState.inProgress),
        CourseCardRealState.inProgress,
      );
      expect(
        courseCardRealState(_course, CourseCardState.completed),
        CourseCardRealState.completed,
      );
      expect(
        courseCardRealState(_course, CourseCardState.locked),
        CourseCardRealState.locked,
      );
    });

    test('auto resolves to not-started when completed is 0', () {
      const CourseCardData fresh = CourseCardData(
        id: '4',
        title: 'Fresh Course',
        instructor: '',
        lessons: 12,
        completed: 0,
        accent: CourseAccent.teal,
      );
      expect(
        courseCardRealState(fresh, CourseCardState.auto),
        CourseCardRealState.notStarted,
      );
    });

    test('auto resolves to in-progress when 0 < pct < 100', () {
      expect(
        courseCardRealState(_course, CourseCardState.auto),
        CourseCardRealState.inProgress,
      );
    });

    test('auto resolves to completed when pct is 100', () {
      const CourseCardData done = CourseCardData(
        id: '5',
        title: 'Done Course',
        instructor: '',
        lessons: 12,
        completed: 12,
        accent: CourseAccent.teal,
      );
      expect(
        courseCardRealState(done, CourseCardState.auto),
        CourseCardRealState.completed,
      );
    });
  });
}
