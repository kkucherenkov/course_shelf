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
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              AppBookmark(time: 42, label: 'Definition of consensus'),
              AppBookmark(time: 305, label: 'Quorum reads worked example'),
              AppBookmark(time: 3725, label: 'Diagram redraw'),
              AppBookmark(time: 930),
              AppBookmark(
                time: 612,
                label: 'Read-only, no actions',
                editable: false,
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

void main() {
  setUpAll(() async {
    await loadAppFonts();
    await loadPackagedFonts();
  });

  testGoldens('AppBookmark matrix — light', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.light()),
      surfaceSize: const Size(400, 400),
    );
    await screenMatchesGolden(tester, 'app_bookmark_matrix_light');
  });

  testGoldens('AppBookmark matrix — dark', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.dark()),
      surfaceSize: const Size(400, 400),
    );
    await screenMatchesGolden(tester, 'app_bookmark_matrix_dark');
  });
}
