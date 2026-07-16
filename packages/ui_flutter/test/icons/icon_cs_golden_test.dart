import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golden_toolkit/golden_toolkit.dart';

import 'package:app_ui/app_ui.dart';

import '../_support/fonts.dart';

/// Renders all 66 glyphs (plus the two filled variants) in a fixed grid so a
/// single golden per size catches any regression across the whole family.
Widget _grid(double size, {required ThemeData theme}) {
  final cells = <Widget>[
    for (final name in IconName.values) IconCS(name: name, size: size),
    IconCS(name: IconName.play, size: size, fill: true),
    IconCS(name: IconName.bookmark, size: size, fill: true),
  ];
  return MaterialApp(
    debugShowCheckedModeBanner: false,
    theme: theme,
    home: Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            for (final cell in cells)
              SizedBox(width: 32, height: 32, child: Center(child: cell)),
          ],
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

  for (final size in const [16.0, 20.0, 24.0]) {
    testGoldens('icon grid renders all glyphs at ${size.toInt()}px (light)', (
      tester,
    ) async {
      await tester.pumpWidgetBuilder(
        _grid(size, theme: AppTheme.light()),
        surfaceSize: const Size(400, 480),
      );
      await tester.pumpAndSettle();
      await screenMatchesGolden(tester, 'icon_grid_${size.toInt()}');
    });
  }

  testGoldens('icon grid follows the theme colour in dark', (tester) async {
    await tester.pumpWidgetBuilder(
      _grid(24, theme: AppTheme.dark()),
      surfaceSize: const Size(400, 480),
    );
    await tester.pumpAndSettle();
    await screenMatchesGolden(tester, 'icon_grid_dark_24');
  });
}
