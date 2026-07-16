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
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            AppNumberField(label: 'Default', value: 3),
            SizedBox(height: 16),
            AppNumberField(
              label: 'At min (decrement disabled)',
              value: 0,
              min: 0,
              max: 10,
            ),
            SizedBox(height: 16),
            AppNumberField(
              label: 'At max (increment disabled)',
              value: 10,
              min: 0,
              max: 10,
            ),
            SizedBox(height: 16),
            AppNumberField(
              label: 'Error',
              value: null,
              error: 'Enter a quantity.',
            ),
            SizedBox(height: 16),
            AppNumberField(label: 'Disabled', value: 5, disabled: true),
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

  testGoldens('number field matrix — light', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.light()),
      surfaceSize: const Size(360, 640),
    );
    await screenMatchesGolden(
      tester,
      'number_field_matrix_light',
      customPump: _pumpMatrix,
    );
  });

  testGoldens('number field matrix — dark', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.dark()),
      surfaceSize: const Size(360, 640),
    );
    await screenMatchesGolden(
      tester,
      'number_field_matrix_dark',
      customPump: _pumpMatrix,
    );
  });
}
