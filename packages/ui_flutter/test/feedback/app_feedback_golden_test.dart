import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golden_toolkit/golden_toolkit.dart';

import 'package:app_ui/app_ui.dart';

import '../_support/fonts.dart';

Widget _matrix(ThemeData theme) {
  return MaterialApp(
    debugShowCheckedModeBanner: false,
    theme: theme,
    home: Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            const Text('AppAlert'),
            const SizedBox(height: 8),
            for (final variant in AppFeedbackVariant.values)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: AppAlert(
                  variant: variant,
                  message: '${variant.name} — This field is required.',
                ),
              ),
            const SizedBox(height: 16),
            const Text('AppBanner'),
            const SizedBox(height: 8),
            for (final variant in AppFeedbackVariant.values)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: AppBanner(
                  variant: variant,
                  title: 'Heads up',
                  body: '${variant.name} — this is a notification message.',
                  dismissible: true,
                ),
              ),
            const SizedBox(height: 16),
            const Text('AppToast'),
            const SizedBox(height: 8),
            for (final variant in AppToastVariant.values)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: AppToast(
                  variant: variant,
                  message: '${variant.name} — changes saved successfully.',
                  dismissible: true,
                ),
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

  testGoldens('feedback matrix — light', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.light()),
      surfaceSize: const Size(420, 760),
    );
    await screenMatchesGolden(
      tester,
      'feedback_matrix_light',
      customPump: _pumpMatrix,
    );
  });

  testGoldens('feedback matrix — dark', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.dark()),
      surfaceSize: const Size(420, 760),
    );
    await screenMatchesGolden(
      tester,
      'feedback_matrix_dark',
      customPump: _pumpMatrix,
    );
  });
}
