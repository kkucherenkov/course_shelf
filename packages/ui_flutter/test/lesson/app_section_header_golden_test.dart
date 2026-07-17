import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golden_toolkit/golden_toolkit.dart';

import 'package:app_ui/app_ui.dart';

import '../_support/fonts.dart';

Widget _label(String text) => Padding(
  padding: const EdgeInsets.only(top: 12, bottom: 4),
  child: Text(text, style: const TextStyle(fontSize: 10)),
);

Widget _matrix(ThemeData theme) {
  return MaterialApp(
    debugShowCheckedModeBanner: false,
    theme: theme,
    home: Scaffold(
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: SizedBox(
          width: 380,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              _label('Open'),
              const AppSectionHeader(
                idx: 1,
                title: 'TypeScript foundations',
                count: 6,
                duration: Duration(seconds: 3300),
              ),
              _label('Closed (chevron rotated -90°)'),
              const AppSectionHeader(
                idx: 2,
                title: 'Type narrowing',
                count: 4,
                duration: Duration(seconds: 2200),
                open: false,
              ),
              _label('Singular lesson + sub-hour duration'),
              const AppSectionHeader(
                idx: 3,
                title: 'Bonus material',
                count: 1,
                duration: Duration(seconds: 540),
              ),
              _label('Whole hours (no minutes segment)'),
              const AppSectionHeader(
                idx: 4,
                title: 'Conditional types, end to end',
                count: 12,
                duration: Duration(seconds: 3600),
              ),
              _label('Long title — single line, ellipsized'),
              const AppSectionHeader(
                idx: 10,
                title:
                    'Advanced generics, variance, and the structural type '
                    'system explained from first principles',
                count: 9,
                duration: Duration(seconds: 7245),
              ),
              _label('Open section followed by its lessons'),
              const AppSectionHeader(
                idx: 5,
                title: 'Putting it together',
                count: 2,
                duration: Duration(seconds: 720),
              ),
              const AppLessonRow(
                num: 1,
                title: 'Setting up your editor',
                duration: Duration(seconds: 180),
                state: LessonRowState.completed,
              ),
              const AppLessonRow(
                num: 2,
                title: 'Discriminated unions in practice',
                duration: Duration(seconds: 540),
                current: true,
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

// The chevron rotation is an implicit animation — pumpAndSettle would hang on
// the shimmering/infinite animations that neighbouring widgets run, so settle
// the rotation with a fixed pump past AppDuration.fast instead.
Future<void> _pumpMatrix(WidgetTester tester) =>
    tester.pump(const Duration(milliseconds: 32));

void main() {
  setUpAll(() async {
    await loadAppFonts();
    await loadPackagedFonts();
  });

  testGoldens('AppSectionHeader matrix — light', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.light()),
      surfaceSize: const Size(420, 720),
    );
    await screenMatchesGolden(
      tester,
      'app_section_header_matrix_light',
      customPump: _pumpMatrix,
    );
  });

  testGoldens('AppSectionHeader matrix — dark', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.dark()),
      surfaceSize: const Size(420, 720),
    );
    await screenMatchesGolden(
      tester,
      'app_section_header_matrix_dark',
      customPump: _pumpMatrix,
    );
  });
}
