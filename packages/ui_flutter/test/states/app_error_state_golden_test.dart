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
          const AppErrorState(
            title: 'Failed to load',
            message: 'Please try again later.',
          ),
          const Divider(height: 1),
          AppErrorState(
            icon: IconName.wifiOff,
            title: 'Connection lost',
            action: AppButton(label: 'Retry', onPressed: () {}),
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

  testGoldens('error-state matrix — light', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.light()),
      surfaceSize: const Size(400, 640),
    );
    await screenMatchesGolden(
      tester,
      'error_state_matrix_light',
      customPump: _pumpMatrix,
    );
  });

  testGoldens('error-state matrix — dark', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.dark()),
      surfaceSize: const Size(400, 640),
    );
    await screenMatchesGolden(
      tester,
      'error_state_matrix_dark',
      customPump: _pumpMatrix,
    );
  });
}
