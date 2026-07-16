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
            AppTextField(
              label: 'Default',
              value: '',
              placeholder: 'you@example.com',
            ),
            SizedBox(height: 16),
            AppTextField(label: 'With value', value: 'ada@example.com'),
            SizedBox(height: 16),
            AppTextField(label: 'Focused', value: '', autofocus: true),
            SizedBox(height: 16),
            AppTextField(
              label: 'Error',
              value: '',
              error: 'This field is required.',
            ),
            SizedBox(height: 16),
            AppTextField(label: 'Disabled', value: 'Locked', disabled: true),
            SizedBox(height: 16),
            AppTextField(
              label: 'Password',
              value: 'secret',
              type: AppTextFieldType.password,
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

  testGoldens('text field matrix — light', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.light()),
      surfaceSize: const Size(360, 720),
    );
    await screenMatchesGolden(
      tester,
      'text_field_matrix_light',
      customPump: _pumpMatrix,
    );
  });

  testGoldens('text field matrix — dark', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.dark()),
      surfaceSize: const Size(360, 720),
    );
    await screenMatchesGolden(
      tester,
      'text_field_matrix_dark',
      customPump: _pumpMatrix,
    );
  });
}
