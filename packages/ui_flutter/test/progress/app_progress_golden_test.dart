import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golden_toolkit/golden_toolkit.dart';

import 'package:app_ui/app_ui.dart';

import '../_support/fonts.dart';

Widget _label(String text) => Padding(
  padding: const EdgeInsets.only(bottom: 4),
  child: Text(text, style: const TextStyle(fontSize: 10)),
);

Widget _section(String title, Widget child) => Padding(
  padding: const EdgeInsets.only(bottom: 16),
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    mainAxisSize: MainAxisSize.min,
    children: <Widget>[
      Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
        ),
      ),
      child,
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
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              _section(
                'AppProgressLinear',
                SizedBox(
                  width: 280,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: <Widget>[
                      _label('0%'),
                      const AppProgressLinear(value: 0),
                      const SizedBox(height: 10),
                      _label('42%'),
                      const AppProgressLinear(value: 42),
                      const SizedBox(height: 10),
                      _label('100%'),
                      const AppProgressLinear(value: 100),
                      const SizedBox(height: 10),
                      _label('thin 60%'),
                      const AppProgressLinear(value: 60, thin: true),
                      const SizedBox(height: 10),
                      _label('indeterminate'),
                      const AppProgressLinear(),
                    ],
                  ),
                ),
              ),
              _section(
                'AppProgressCircle',
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: <Widget>[
                    for (final v in <double>[0, 25, 50, 100])
                      Padding(
                        padding: const EdgeInsets.only(right: 16),
                        child: AppProgressCircle(value: v, label: '$v%'),
                      ),
                    const Padding(
                      padding: EdgeInsets.only(right: 16),
                      child: AppProgressCircle(value: 65, size: 48, stroke: 4),
                    ),
                    const AppProgressCircle(label: 'indeterminate'),
                  ],
                ),
              ),
              _section(
                'AppSpinner',
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: <Widget>[
                    for (final size in AppSpinnerSize.values)
                      Padding(
                        padding: const EdgeInsets.only(right: 16),
                        child: AppSpinner(size: size),
                      ),
                    DefaultTextStyle(
                      style: TextStyle(color: theme.colorScheme.error),
                      child: const Padding(
                        padding: EdgeInsets.only(right: 16),
                        child: AppSpinner(),
                      ),
                    ),
                    const DefaultTextStyle(
                      style: TextStyle(color: Colors.green),
                      child: AppSpinner(),
                    ),
                  ],
                ),
              ),
              _section(
                'AppSkeleton',
                const SizedBox(
                  width: 280,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: <Widget>[
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: <Widget>[
                          AppSkeleton(
                            width: 40,
                            height: 40,
                            radius: AppSkeletonRadius.md,
                          ),
                          SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: <Widget>[
                                AppSkeleton(width: 160, height: 14),
                                SizedBox(height: 8),
                                AppSkeleton(width: 100, height: 12),
                              ],
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: 12),
                      AppSkeleton(height: 12, radius: AppSkeletonRadius.pill),
                    ],
                  ),
                ),
              ),
            ],
          ),
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

  testGoldens('progress matrix — light', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.light()),
      surfaceSize: const Size(520, 980),
    );
    await screenMatchesGolden(
      tester,
      'progress_matrix_light',
      customPump: _pumpMatrix,
    );
  });

  testGoldens('progress matrix — dark', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.dark()),
      surfaceSize: const Size(520, 980),
    );
    await screenMatchesGolden(
      tester,
      'progress_matrix_dark',
      customPump: _pumpMatrix,
    );
  });
}
