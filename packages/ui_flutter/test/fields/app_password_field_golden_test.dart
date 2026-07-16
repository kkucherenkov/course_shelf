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
            AppPasswordField(label: 'Empty', value: ''),
            SizedBox(height: 16),
            AppPasswordField(label: 'Obscured', value: 'sup3r-secret!'),
            SizedBox(height: 16),
            AppPasswordField(
              label: 'Revealed',
              value: 'sup3r-secret!',
              initiallyVisible: true,
            ),
            SizedBox(height: 16),
            AppPasswordField(
              label: 'Error',
              value: 'short',
              error: 'Password must be at least 8 characters.',
            ),
            SizedBox(height: 16),
            AppPasswordField(
              label: 'Disabled',
              value: 'cannot-touch',
              disabled: true,
            ),
            SizedBox(height: 16),
            AppPasswordField(
              label: 'Meter — weak',
              value: 'abcdef',
              withMeter: true,
            ),
            SizedBox(height: 16),
            AppPasswordField(
              label: 'Meter — okay',
              value: 'abcdefghij',
              withMeter: true,
            ),
            SizedBox(height: 16),
            AppPasswordField(
              label: 'Meter — strong',
              value: 'abcdefghijkl1!',
              withMeter: true,
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

  testGoldens('password field matrix — light', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.light()),
      surfaceSize: const Size(360, 980),
    );
    await screenMatchesGolden(
      tester,
      'password_field_matrix_light',
      customPump: _pumpMatrix,
    );
  });

  testGoldens('password field matrix — dark', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.dark()),
      surfaceSize: const Size(360, 980),
    );
    await screenMatchesGolden(
      tester,
      'password_field_matrix_dark',
      customPump: _pumpMatrix,
    );
  });
}
