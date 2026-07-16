import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golden_toolkit/golden_toolkit.dart';

import 'package:app_ui/app_ui.dart';

import '../_support/fonts.dart';

Widget _matrix(ThemeData theme) {
  return MaterialApp(
    debugShowCheckedModeBanner: false,
    theme: theme,
    home: const Scaffold(
      body: Padding(
        padding: EdgeInsets.all(16),
        child: SizedBox(
          width: 360,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              AppDownloadRow(
                lessonTitle: '01 — Kickoff',
                courseTitle: 'Design Fundamentals',
                sizeText: '64 MB',
                state: AppDownloadState.queued,
              ),
              SizedBox(height: 4),
              AppDownloadRow(
                lessonTitle: '12 — Quorum reads',
                courseTitle: 'Distributed Systems',
                sizeText: '128 MB',
                state: AppDownloadState.downloading,
                progress: 0.42,
              ),
              SizedBox(height: 4),
              AppDownloadRow(
                lessonTitle: '04 — Consensus intro',
                courseTitle: 'Distributed Systems',
                sizeText: '96 MB',
                state: AppDownloadState.paused,
                progress: 0.6,
              ),
              SizedBox(height: 4),
              AppDownloadRow(
                lessonTitle: '02 — Composables',
                courseTitle: 'Vue 3 Masterclass',
                sizeText: '210 MB',
                state: AppDownloadState.ready,
              ),
              SizedBox(height: 4),
              AppDownloadRow(
                lessonTitle: '07 — Suspense & islands',
                courseTitle: 'Vue 3 Masterclass',
                sizeText: '88 MB',
                state: AppDownloadState.failed,
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

  testGoldens('download row matrix — light', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.light()),
      surfaceSize: const Size(420, 460),
    );
    await screenMatchesGolden(
      tester,
      'download_row_matrix_light',
      customPump: _pumpMatrix,
    );
  });

  testGoldens('download row matrix — dark', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.dark()),
      surfaceSize: const Size(420, 460),
    );
    await screenMatchesGolden(
      tester,
      'download_row_matrix_dark',
      customPump: _pumpMatrix,
    );
  });
}
