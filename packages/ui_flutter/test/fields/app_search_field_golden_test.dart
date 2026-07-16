import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golden_toolkit/golden_toolkit.dart';

import 'package:app_ui/app_ui.dart';

import '../_support/fonts.dart';

Widget _matrix(ThemeData theme) {
  return MaterialApp(
    debugShowCheckedModeBanner: false,
    theme: theme,
    home: const Scaffold(
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            AppSearchField(
              label: 'Default',
              value: '',
              placeholder: 'Search courses…',
            ),
            SizedBox(height: 16),
            AppSearchField(label: 'With value', value: 'flutter'),
            SizedBox(height: 16),
            AppSearchField(
              label: 'Error',
              value: '',
              error: 'No results match that search.',
            ),
            SizedBox(height: 16),
            AppSearchField(label: 'Disabled', value: 'flutter', disabled: true),
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

  testGoldens('search field matrix — light', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.light()),
      surfaceSize: const Size(360, 560),
    );
    await screenMatchesGolden(
      tester,
      'search_field_matrix_light',
      customPump: _pumpMatrix,
    );
  });

  testGoldens('search field matrix — dark', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.dark()),
      surfaceSize: const Size(360, 560),
    );
    await screenMatchesGolden(
      tester,
      'search_field_matrix_dark',
      customPump: _pumpMatrix,
    );
  });
}
