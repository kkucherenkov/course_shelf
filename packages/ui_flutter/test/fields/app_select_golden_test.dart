import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golden_toolkit/golden_toolkit.dart';

import 'package:app_ui/app_ui.dart';

import '../_support/fonts.dart';

const _fruits = <AppSelectOption>[
  AppSelectOption(id: 'apple', label: 'Apple'),
  AppSelectOption(id: 'banana', label: 'Banana'),
  AppSelectOption(id: 'cherry', label: 'Cherry (seasonal)', disabled: true),
];

Widget _labelled(String label, Widget child) => Column(
  crossAxisAlignment: CrossAxisAlignment.start,
  mainAxisSize: MainAxisSize.min,
  children: <Widget>[Text(label), const SizedBox(height: 4), child],
);

Widget _matrix(ThemeData theme) {
  return MaterialApp(
    debugShowCheckedModeBanner: false,
    theme: theme,
    home: Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            _labelled(
              'Placeholder',
              const AppSelect(options: _fruits, placeholder: 'Pick a fruit…'),
            ),
            const SizedBox(height: 16),
            _labelled(
              'With value',
              const AppSelect(options: _fruits, value: 'banana'),
            ),
            const SizedBox(height: 16),
            _labelled(
              'Invalid',
              const AppSelect(
                options: _fruits,
                placeholder: 'Pick a fruit…',
                invalid: true,
              ),
            ),
            const SizedBox(height: 16),
            _labelled(
              'Disabled',
              const AppSelect(options: _fruits, value: 'apple', disabled: true),
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

  testGoldens('select matrix — light', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.light()),
      surfaceSize: const Size(360, 480),
    );
    await screenMatchesGolden(
      tester,
      'select_matrix_light',
      customPump: _pumpMatrix,
    );
  });

  testGoldens('select matrix — dark', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.dark()),
      surfaceSize: const Size(360, 480),
    );
    await screenMatchesGolden(
      tester,
      'select_matrix_dark',
      customPump: _pumpMatrix,
    );
  });
}
