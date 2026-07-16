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
          const AppNoPermission(
            title: 'Access restricted',
            message: 'You do not have permission to view this content.',
          ),
          const Divider(height: 1),
          AppNoPermission(
            icon: IconName.shield,
            title: 'Premium content',
            message: 'Upgrade your plan to access this course.',
            action: AppButton(label: 'Log in', onPressed: () {}),
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

  testGoldens('no-permission matrix — light', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.light()),
      surfaceSize: const Size(400, 640),
    );
    await screenMatchesGolden(
      tester,
      'no_permission_matrix_light',
      customPump: _pumpMatrix,
    );
  });

  testGoldens('no-permission matrix — dark', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.dark()),
      surfaceSize: const Size(400, 640),
    );
    await screenMatchesGolden(
      tester,
      'no_permission_matrix_dark',
      customPump: _pumpMatrix,
    );
  });
}
