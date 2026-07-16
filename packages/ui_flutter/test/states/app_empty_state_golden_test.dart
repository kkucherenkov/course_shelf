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
      body: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          const AppEmptyState(
            title: 'No courses yet',
            message: 'Add your first course to get started.',
          ),
          const Divider(height: 1),
          AppEmptyState(
            icon: IconName.bookmark,
            title: 'Empty library',
            action: AppButton(label: 'Add course', onPressed: () {}),
          ),
        ],
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

  testGoldens('empty-state matrix — light', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.light()),
      surfaceSize: const Size(400, 640),
    );
    await screenMatchesGolden(
      tester,
      'empty_state_matrix_light',
      customPump: _pumpMatrix,
    );
  });

  testGoldens('empty-state matrix — dark', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.dark()),
      surfaceSize: const Size(400, 640),
    );
    await screenMatchesGolden(
      tester,
      'empty_state_matrix_dark',
      customPump: _pumpMatrix,
    );
  });
}
