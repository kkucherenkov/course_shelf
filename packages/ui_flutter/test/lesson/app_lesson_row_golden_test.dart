import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golden_toolkit/golden_toolkit.dart';

import 'package:app_ui/app_ui.dart';

import '../_support/fonts.dart';

Widget _label(String text) => Padding(
  padding: const EdgeInsets.only(top: 8, bottom: 4),
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
              _label('Not started'),
              const AppLessonRow(
                num: 1,
                title: 'Setting up your editor',
                duration: Duration(seconds: 180),
              ),
              _label('In progress'),
              const AppLessonRow(
                num: 2,
                title: 'The TypeScript type system, top-down',
                duration: Duration(seconds: 540),
                state: LessonRowState.inProgress,
                progress: 35,
              ),
              _label('Current (accent-soft + play icon)'),
              const AppLessonRow(
                num: 3,
                title: 'Discriminated unions in practice',
                duration: Duration(seconds: 425),
                current: true,
              ),
              _label('Completed + materials'),
              const AppLessonRow(
                num: 4,
                title: 'Conditional types and infer',
                duration: Duration(seconds: 612),
                state: LessonRowState.completed,
                materials: true,
              ),
              _label('Locked'),
              const AppLessonRow(
                num: 5,
                title: 'Module augmentation (premium)',
                duration: Duration(seconds: 338),
                state: LessonRowState.locked,
              ),
              _label('Loading skeleton'),
              const AppLessonRow(
                num: 6,
                title: 'unused while loading',
                duration: Duration.zero,
                loading: true,
              ),
              _label(
                'Download — available / downloading / downloaded / failed',
              ),
              const AppLessonRow(
                num: 7,
                title: 'Download available',
                duration: Duration(seconds: 300),
                downloadState: LessonDownloadState.available,
              ),
              const AppLessonRow(
                num: 8,
                title: 'Download in progress',
                duration: Duration(seconds: 300),
                downloadState: LessonDownloadState.downloading,
              ),
              const AppLessonRow(
                num: 9,
                title: 'Download complete',
                duration: Duration(seconds: 300),
                downloadState: LessonDownloadState.downloaded,
              ),
              const AppLessonRow(
                num: 10,
                title: 'Download failed',
                duration: Duration(seconds: 300),
                downloadState: LessonDownloadState.failed,
              ),
            ],
          ),
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

  testGoldens('AppLessonRow matrix — light', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.light()),
      surfaceSize: const Size(420, 1500),
    );
    await screenMatchesGolden(
      tester,
      'app_lesson_row_matrix_light',
      customPump: _pumpMatrix,
    );
  });

  testGoldens('AppLessonRow matrix — dark', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.dark()),
      surfaceSize: const Size(420, 1500),
    );
    await screenMatchesGolden(
      tester,
      'app_lesson_row_matrix_dark',
      customPump: _pumpMatrix,
    );
  });
}
