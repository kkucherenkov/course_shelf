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
            for (final variant in AppButtonVariant.values) ...<Widget>[
              Padding(
                padding: const EdgeInsets.only(top: 8, bottom: 2),
                child: Text(variant.name),
              ),
              _row(<Widget>[
                for (final size in AppButtonSize.values)
                  AppButton(
                    label: size.name,
                    variant: variant,
                    size: size,
                    iconLeading: IconName.play,
                    onPressed: () {},
                  ),
              ]),
            ],
            const Padding(
              padding: EdgeInsets.only(top: 8, bottom: 2),
              child: Text('states'),
            ),
            _row(<Widget>[
              AppButton(label: 'disabled', disabled: true, onPressed: () {}),
              AppButton(label: 'loading', loading: true, onPressed: () {}),
            ]),
            _row(<Widget>[
              for (final variant in AppButtonVariant.values)
                AppIconButton(
                  name: IconName.play,
                  semanticLabel: variant.name,
                  variant: variant,
                ),
              const AppIconButton(
                name: IconName.play,
                semanticLabel: 'disabled',
                disabled: true,
              ),
              const AppIconButton(
                name: IconName.play,
                semanticLabel: 'loading',
                loading: true,
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

  testGoldens('button matrix — light', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.light()),
      surfaceSize: const Size(520, 640),
    );
    await screenMatchesGolden(
      tester,
      'button_matrix_light',
      customPump: _pumpMatrix,
    );
  });

  testGoldens('button matrix — dark', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.dark()),
      surfaceSize: const Size(520, 640),
    );
    await screenMatchesGolden(
      tester,
      'button_matrix_dark',
      customPump: _pumpMatrix,
    );
  });
}
