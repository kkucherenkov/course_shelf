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
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            AppCheckbox(value: false, label: 'Unchecked'),
            SizedBox(height: 12),
            AppCheckbox(value: true, label: 'Checked'),
            SizedBox(height: 12),
            AppCheckbox(
              value: false,
              indeterminate: true,
              label: 'Indeterminate',
            ),
            SizedBox(height: 12),
            AppCheckbox(value: true, label: 'Required', required: true),
            SizedBox(height: 12),
            AppCheckbox(value: true, label: 'Disabled', disabled: true),
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

  testGoldens('checkbox matrix — light', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.light()),
      surfaceSize: const Size(320, 320),
    );
    await screenMatchesGolden(
      tester,
      'checkbox_matrix_light',
      customPump: _pumpMatrix,
    );
  });

  testGoldens('checkbox matrix — dark', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.dark()),
      surfaceSize: const Size(320, 320),
    );
    await screenMatchesGolden(
      tester,
      'checkbox_matrix_dark',
      customPump: _pumpMatrix,
    );
  });
}
