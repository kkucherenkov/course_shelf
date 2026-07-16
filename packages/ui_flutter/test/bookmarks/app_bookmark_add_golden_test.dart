import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golden_toolkit/golden_toolkit.dart';

import 'package:app_ui/app_ui.dart';

import '../_support/fonts.dart';

Widget _row(String label, Widget child) => Padding(
  padding: const EdgeInsets.only(bottom: 16),
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    mainAxisSize: MainAxisSize.min,
    children: <Widget>[Text(label), const SizedBox(height: 4), child],
  ),
);

Widget _matrix(ThemeData theme) {
  return MaterialApp(
    debugShowCheckedModeBanner: false,
    theme: theme,
    home: Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: SizedBox(
          width: 360,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              _row('default', const AppBookmarkAdd(time: 305)),
              _row(
                'submitting',
                const AppBookmarkAdd(time: 305, submitting: true),
              ),
              _row('hour-long', const AppBookmarkAdd(time: 3725)),
            ],
          ),
        ),
      ),
    ),
  );
}

// The "submitting" state renders AppButton's spinner, which animates
// indefinitely — the default `pumpAndSettle` never settles, so drive a
// single fixed-duration frame instead (mirrors the button matrix golden).
Future<void> _pumpMatrix(WidgetTester tester) =>
    tester.pump(const Duration(milliseconds: 32));

void main() {
  setUpAll(() async {
    await loadAppFonts();
    await loadPackagedFonts();
  });

  testGoldens('AppBookmarkAdd matrix — light', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.light()),
      surfaceSize: const Size(400, 320),
    );
    await screenMatchesGolden(
      tester,
      'app_bookmark_add_matrix_light',
      customPump: _pumpMatrix,
    );
  });

  testGoldens('AppBookmarkAdd matrix — dark', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.dark()),
      surfaceSize: const Size(400, 320),
    );
    await screenMatchesGolden(
      tester,
      'app_bookmark_add_matrix_dark',
      customPump: _pumpMatrix,
    );
  });
}
