import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golden_toolkit/golden_toolkit.dart';

import 'package:app_ui/app_ui.dart';

import '../_support/fonts.dart';

Widget _row(List<Widget> children) => Padding(
  padding: const EdgeInsets.symmetric(vertical: 6),
  child: Row(
    mainAxisSize: MainAxisSize.min,
    crossAxisAlignment: CrossAxisAlignment.center,
    children: <Widget>[
      for (final child in children)
        Padding(padding: const EdgeInsets.only(right: 12), child: child),
    ],
  ),
);

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
            for (final variant in AppChipVariant.values) ...<Widget>[
              Padding(
                padding: const EdgeInsets.only(top: 8, bottom: 2),
                child: Text(variant.name),
              ),
              _row(<Widget>[
                AppChip(label: variant.name, variant: variant),
                AppChip(
                  label: variant.name,
                  variant: variant,
                  removable: true,
                  onRemove: () {},
                ),
              ]),
            ],
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

  testGoldens('chip matrix — light', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.light()),
      surfaceSize: const Size(360, 620),
    );
    await screenMatchesGolden(
      tester,
      'chip_matrix_light',
      customPump: _pumpMatrix,
    );
  });

  testGoldens('chip matrix — dark', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.dark()),
      surfaceSize: const Size(360, 620),
    );
    await screenMatchesGolden(
      tester,
      'chip_matrix_dark',
      customPump: _pumpMatrix,
    );
  });
}
