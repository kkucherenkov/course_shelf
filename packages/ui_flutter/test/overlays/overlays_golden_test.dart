import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golden_toolkit/golden_toolkit.dart';

import 'package:app_ui/app_ui.dart';

import '../_support/fonts.dart';

Widget _label(String text) => Padding(
  padding: const EdgeInsets.only(top: 8, bottom: 4),
  child: Text(text),
);

Widget _matrix(ThemeData theme) {
  return MaterialApp(
    debugShowCheckedModeBanner: false,
    theme: theme,
    home: Scaffold(
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            _label('AppDialog — sm'),
            AppDialog(
              size: AppDialogSize.sm,
              title: 'Small dialog',
              onDismiss: () {},
              child: const Text('Compact dialog content.'),
            ),
            _label('AppDialog — md + description + footer'),
            AppDialog(
              title: 'Dialog title',
              description: 'Supporting copy that gives context.',
              onDismiss: () {},
              actions: <Widget>[
                AppButton(
                  variant: AppButtonVariant.secondary,
                  label: 'Cancel',
                  onPressed: () {},
                ),
                AppButton(label: 'Confirm', onPressed: () {}),
              ],
              child: const Text('Are you sure you want to proceed?'),
            ),
            _label('AppDialog — non-dismissible'),
            AppDialog(
              title: 'Mandatory action',
              dismissible: false,
              actions: <Widget>[AppButton(label: 'I accept', onPressed: () {})],
              child: const Text(
                'This dialog cannot be dismissed with a close button.',
              ),
            ),
            _label('AppBottomSheet — handle + footer'),
            AppBottomSheet(
              title: 'Sheet title',
              onDismiss: () {},
              actions: <Widget>[
                AppButton(
                  variant: AppButtonVariant.secondary,
                  label: 'Cancel',
                  onPressed: () {},
                ),
                AppButton(label: 'Confirm', onPressed: () {}),
              ],
              child: const Text('Sheet body content goes here.'),
            ),
            _label('AppBottomSheet — no handle, no title'),
            const AppBottomSheet(
              showHandle: false,
              dismissible: false,
              child: Text('Minimal sheet body only.'),
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

  testGoldens('overlays matrix — light', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.light()),
      surfaceSize: const Size(420, 1900),
    );
    await screenMatchesGolden(
      tester,
      'overlays_matrix_light',
      customPump: _pumpMatrix,
    );
  });

  testGoldens('overlays matrix — dark', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.dark()),
      surfaceSize: const Size(420, 1900),
    );
    await screenMatchesGolden(
      tester,
      'overlays_matrix_dark',
      customPump: _pumpMatrix,
    );
  });
}
