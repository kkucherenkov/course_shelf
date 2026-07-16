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
        Padding(padding: const EdgeInsets.only(right: 8), child: child),
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
            for (final variant in AppBadgeVariant.values) ...<Widget>[
              Padding(
                padding: const EdgeInsets.only(top: 8, bottom: 2),
                child: Text(variant.name),
              ),
              _row(<Widget>[
                for (final color in AppBadgeColor.values)
                  AppBadge(label: color.name, color: color, variant: variant),
              ]),
            ],
            const Padding(
              padding: EdgeInsets.only(top: 8, bottom: 2),
              child: Text('sizes'),
            ),
            _row(<Widget>[
              for (final size in AppBadgeSize.values)
                AppBadge(
                  label: size.name,
                  size: size,
                  icon: IconName.check,
                  color: AppBadgeColor.success,
                ),
            ]),
            const Padding(
              padding: EdgeInsets.only(top: 8, bottom: 2),
              child: Text('uppercase'),
            ),
            _row(<Widget>[
              const AppBadge(
                label: 'beta',
                color: AppBadgeColor.warning,
                uppercase: true,
              ),
            ]),
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

  testGoldens('badge matrix — light', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.light()),
      surfaceSize: const Size(640, 620),
    );
    await screenMatchesGolden(
      tester,
      'badge_matrix_light',
      customPump: _pumpMatrix,
    );
  });

  testGoldens('badge matrix — dark', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.dark()),
      surfaceSize: const Size(640, 620),
    );
    await screenMatchesGolden(
      tester,
      'badge_matrix_dark',
      customPump: _pumpMatrix,
    );
  });
}
