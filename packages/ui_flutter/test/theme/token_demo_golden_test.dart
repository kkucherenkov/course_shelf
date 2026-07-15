import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golden_toolkit/golden_toolkit.dart';

import 'package:app_ui/app_ui.dart';

import '../_support/fonts.dart';

Widget _wrap(ThemeData theme) => MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: theme,
      home: const TokenDemoScreen(),
    );

void main() {
  // `loadAppFonts` registers the BARE families; `loadPackagedFonts` registers
  // the `packages/app_ui/`-prefixed ones the theme actually asks for. Without
  // the second call the golden renders Ahem and still passes — see Task 3.
  setUpAll(() async {
    await loadAppFonts();
    await loadPackagedFonts();
  });

  testGoldens('token demo renders every populated group in light', (tester) async {
    await tester.pumpWidgetBuilder(
      _wrap(AppTheme.light()),
      surfaceSize: const Size(420, 1400),
    );
    await screenMatchesGolden(tester, 'token_demo_light');
  });

  testGoldens('token demo renders every populated group in dark', (tester) async {
    await tester.pumpWidgetBuilder(
      _wrap(AppTheme.dark()),
      surfaceSize: const Size(420, 1400),
    );
    await screenMatchesGolden(tester, 'token_demo_dark');
  });
}
