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
          width: 320,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              _row(
                'default',
                const AppTextarea(value: '', placeholder: 'Write notes…'),
              ),
              _row(
                'with value',
                const AppTextarea(value: 'Some notes already typed here.'),
              ),
              _row(
                'error',
                const AppTextarea(
                  value: 'short',
                  error: 'Notes must be at least 20 characters',
                ),
              ),
              _row(
                'disabled',
                const AppTextarea(value: 'Locked content', disabled: true),
              ),
              _row(
                'with counter',
                const AppTextarea(value: 'Some notes', maxLength: 40),
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

  testGoldens('AppTextarea matrix — light', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.light()),
      surfaceSize: const Size(400, 760),
    );
    await screenMatchesGolden(tester, 'app_textarea_matrix_light');
  });

  testGoldens('AppTextarea matrix — dark', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.dark()),
      surfaceSize: const Size(400, 760),
    );
    await screenMatchesGolden(tester, 'app_textarea_matrix_dark');
  });
}
