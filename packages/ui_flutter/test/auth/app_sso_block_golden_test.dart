import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golden_toolkit/golden_toolkit.dart';

import 'package:app_ui/app_ui.dart';

import '../_support/fonts.dart';

const _allProviders = <SsoProvider>[
  SsoProvider(
    id: 'google',
    label: 'Continue with Google',
    iconName: IconName.mail,
  ),
  SsoProvider(
    id: 'github',
    label: 'Continue with GitHub',
    iconName: IconName.github,
  ),
  SsoProvider(id: 'sso', label: 'Single sign-on', iconName: IconName.key),
];

Widget _matrix(ThemeData theme) => MaterialApp(
  debugShowCheckedModeBanner: false,
  theme: theme,
  home: Scaffold(
    body: Padding(
      padding: const EdgeInsets.all(16),
      child: AppSsoBlock(providers: _allProviders, onSelect: (_) {}),
    ),
  ),
);

Future<void> _pumpMatrix(WidgetTester tester) =>
    tester.pump(const Duration(milliseconds: 32));

void main() {
  setUpAll(() async {
    await loadAppFonts();
    await loadPackagedFonts();
  });

  testGoldens('sso block matrix — light', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.light()),
      surfaceSize: const Size(360, 260),
    );
    await screenMatchesGolden(
      tester,
      'sso_block_matrix_light',
      customPump: _pumpMatrix,
    );
  });

  testGoldens('sso block matrix — dark', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.dark()),
      surfaceSize: const Size(360, 260),
    );
    await screenMatchesGolden(
      tester,
      'sso_block_matrix_dark',
      customPump: _pumpMatrix,
    );
  });
}
