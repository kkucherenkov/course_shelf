import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golden_toolkit/golden_toolkit.dart';

import 'package:app_ui/app_ui.dart';

import '../_support/fonts.dart';

List<AppNavigationTab> _tabs() => const <AppNavigationTab>[
  AppNavigationTab(
    label: 'Home',
    icon: IconName.home,
    body: Padding(
      padding: EdgeInsets.all(16),
      child: Text('Continue watching…'),
    ),
  ),
  AppNavigationTab(
    label: 'Browse',
    icon: IconName.library,
    body: SizedBox.shrink(),
  ),
  AppNavigationTab(
    label: 'Downloads',
    icon: IconName.download,
    body: SizedBox.shrink(),
  ),
  AppNavigationTab(
    label: 'Search',
    icon: IconName.search,
    body: SizedBox.shrink(),
  ),
  AppNavigationTab(
    label: 'Settings',
    icon: IconName.settings,
    body: SizedBox.shrink(),
  ),
];

Widget _shell(ThemeData theme) {
  return MaterialApp(
    debugShowCheckedModeBanner: false,
    theme: theme,
    home: AppNavigationShell(
      tabs: _tabs(),
      currentIndex: 0,
      onTabChanged: (_) {},
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

  tearDown(() {
    debugDefaultTargetPlatformOverride = null;
  });

  testGoldens('navigation shell — iOS chrome, light', (tester) async {
    debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
    await tester.pumpWidgetBuilder(
      _shell(AppTheme.light()),
      surfaceSize: const Size(390, 700),
    );
    await screenMatchesGolden(
      tester,
      'navigation_shell_ios_light',
      customPump: _pumpMatrix,
    );
    debugDefaultTargetPlatformOverride = null;
  });

  testGoldens('navigation shell — iOS chrome, dark', (tester) async {
    debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
    await tester.pumpWidgetBuilder(
      _shell(AppTheme.dark()),
      surfaceSize: const Size(390, 700),
    );
    await screenMatchesGolden(
      tester,
      'navigation_shell_ios_dark',
      customPump: _pumpMatrix,
    );
    debugDefaultTargetPlatformOverride = null;
  });

  testGoldens('navigation shell — Android chrome, light', (tester) async {
    debugDefaultTargetPlatformOverride = TargetPlatform.android;
    await tester.pumpWidgetBuilder(
      _shell(AppTheme.light()),
      surfaceSize: const Size(390, 700),
    );
    await screenMatchesGolden(
      tester,
      'navigation_shell_android_light',
      customPump: _pumpMatrix,
    );
    debugDefaultTargetPlatformOverride = null;
  });

  testGoldens('navigation shell — Android chrome, dark', (tester) async {
    debugDefaultTargetPlatformOverride = TargetPlatform.android;
    await tester.pumpWidgetBuilder(
      _shell(AppTheme.dark()),
      surfaceSize: const Size(390, 700),
    );
    await screenMatchesGolden(
      tester,
      'navigation_shell_android_dark',
      customPump: _pumpMatrix,
    );
    debugDefaultTargetPlatformOverride = null;
  });
}
