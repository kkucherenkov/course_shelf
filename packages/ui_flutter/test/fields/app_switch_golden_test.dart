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
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            for (final size in AppSwitchSize.values) ...<Widget>[
              Row(
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  AppSwitch(
                    value: false,
                    label: '${size.name} off',
                    size: size,
                  ),
                  const SizedBox(width: 24),
                  AppSwitch(value: true, label: '${size.name} on', size: size),
                ],
              ),
              const SizedBox(height: 12),
            ],
            for (final color in AppSwitchColor.values)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: AppSwitch(value: true, label: color.name, color: color),
              ),
            const AppSwitch(value: true, label: 'Disabled', disabled: true),
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

  testGoldens('switch matrix — light', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.light()),
      surfaceSize: const Size(360, 560),
    );
    await screenMatchesGolden(
      tester,
      'switch_matrix_light',
      customPump: _pumpMatrix,
    );
  });

  testGoldens('switch matrix — dark', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.dark()),
      surfaceSize: const Size(360, 560),
    );
    await screenMatchesGolden(
      tester,
      'switch_matrix_dark',
      customPump: _pumpMatrix,
    );
  });
}
