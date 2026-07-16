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
            AppRadio<String>(value: 'a', groupValue: 'a', label: 'Selected'),
            SizedBox(height: 12),
            AppRadio<String>(value: 'a', groupValue: 'b', label: 'Unselected'),
            SizedBox(height: 12),
            AppRadio<String>(
              value: 'a',
              groupValue: 'a',
              label: 'Disabled, selected',
              disabled: true,
            ),
            SizedBox(height: 12),
            AppRadio<String>(
              value: 'a',
              groupValue: 'b',
              label: 'Disabled, unselected',
              disabled: true,
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

  testGoldens('radio matrix — light', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.light()),
      surfaceSize: const Size(320, 260),
    );
    await screenMatchesGolden(
      tester,
      'radio_matrix_light',
      customPump: _pumpMatrix,
    );
  });

  testGoldens('radio matrix — dark', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.dark()),
      surfaceSize: const Size(320, 260),
    );
    await screenMatchesGolden(
      tester,
      'radio_matrix_dark',
      customPump: _pumpMatrix,
    );
  });
}
