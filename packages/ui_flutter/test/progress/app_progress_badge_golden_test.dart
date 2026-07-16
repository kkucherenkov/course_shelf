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

Widget _row(List<Widget> children) => Row(
  crossAxisAlignment: CrossAxisAlignment.center,
  children: <Widget>[
    for (final child in children)
      Padding(padding: const EdgeInsets.only(right: 16), child: child),
  ],
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
                'ring',
                _row(<Widget>[
                  for (final state in AppProgressBadgeState.values)
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: <Widget>[
                        AppProgressBadge(
                          variant: AppProgressBadgeVariant.ring,
                          state: state,
                          completed: 4,
                          total: 12,
                        ),
                        const SizedBox(height: 4),
                        _label(state.name),
                      ],
                    ),
                ]),
              ),
              _section(
                'bar',
                SizedBox(
                  width: 280,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: <Widget>[
                      for (final state
                          in AppProgressBadgeState.values) ...<Widget>[
                        _label(state.name),
                        AppProgressBadge(
                          variant: AppProgressBadgeVariant.bar,
                          state: state,
                          completed: 4,
                          total: 12,
                        ),
                        const SizedBox(height: 10),
                      ],
                    ],
                  ),
                ),
              ),
              _section(
                'pill',
                _row(<Widget>[
                  for (final state in AppProgressBadgeState.values)
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: <Widget>[
                        AppProgressBadge(
                          variant: AppProgressBadgeVariant.pill,
                          state: state,
                          completed: 4,
                          total: 12,
                        ),
                        const SizedBox(height: 4),
                        _label(state.name),
                      ],
                    ),
                ]),
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

  testGoldens('progress badge matrix — light', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.light()),
      surfaceSize: const Size(620, 620),
    );
    await screenMatchesGolden(
      tester,
      'progress_badge_matrix_light',
      customPump: _pumpMatrix,
    );
  });

  testGoldens('progress badge matrix — dark', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.dark()),
      surfaceSize: const Size(620, 620),
    );
    await screenMatchesGolden(
      tester,
      'progress_badge_matrix_dark',
      customPump: _pumpMatrix,
    );
  });
}
