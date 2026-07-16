import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golden_toolkit/golden_toolkit.dart';

import 'package:app_ui/app_ui.dart';

import '../_support/fonts.dart';

Widget _label(String text) => Padding(
  padding: const EdgeInsets.only(top: 8, bottom: 4),
  child: Text(text),
);

Widget _matrix(ThemeData theme) {
  return MaterialApp(
    debugShowCheckedModeBanner: false,
    theme: theme,
    home: Scaffold(
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            _label('AppCard — md'),
            const AppCard(
              title: 'System health',
              description: 'Realtime dependency status',
              child: Text('Ready to ship.'),
            ),
            _label('AppCard — lg + footer'),
            const AppCard(
              size: AppCardSize.lg,
              title: 'Large card',
              description: '24px padding, radius-lg corner.',
              footer: Text('Footer content'),
              child: Text('More breathing room.'),
            ),
            _label('AppCard — interactive'),
            AppCard(
              interactive: true,
              onTap: () {},
              title: 'Upcoming booking',
              description: 'Tap to view the full appointment',
              child: const Text('This whole card is a button.'),
            ),
            _label('AppRow — default / selected / compact'),
            const SizedBox(
              width: 320,
              child: Column(
                children: <Widget>[
                  AppRow(
                    leading: CircleAvatar(radius: 16),
                    body: Text('Design Fundamentals'),
                    trailing: Text('7h 12m'),
                  ),
                  SizedBox(height: 2),
                  AppRow(
                    selected: true,
                    leading: CircleAvatar(radius: 16),
                    body: Text('Vue 3 Masterclass'),
                    trailing: Text('3h 45m'),
                  ),
                  SizedBox(height: 2),
                  AppRow(
                    compact: true,
                    body: Text('Compact row'),
                    trailing: Text('42%'),
                  ),
                ],
              ),
            ),
            _label('AppTabs'),
            // Not `const`: the `assert(items.length > 0)` in [AppTabs]'s
            // constructor can't be constant-folded (`List.length` isn't a
            // permitted const expression), so a `const` invocation fails to
            // compile.
            AppTabs(
              items: const <AppTabItem>[
                AppTabItem(label: 'Overview'),
                AppTabItem(label: 'Curriculum'),
                AppTabItem(label: 'Reviews'),
              ],
              selectedIndex: 1,
              onChanged: _noopInt,
              label: 'Course sections',
            ),
            _label('AppSegmented'),
            AppSegmented(
              items: const <AppSegmentedItemData>[
                AppSegmentedItemData(label: 'List'),
                AppSegmentedItemData(label: 'Grid'),
                AppSegmentedItemData(label: 'Compact'),
              ],
              selectedIndex: 0,
              onChanged: _noopInt,
              label: 'View mode',
            ),
          ],
        ),
      ),
    ),
  );
}

void _noopInt(int _) {}

Future<void> _pumpMatrix(WidgetTester tester) =>
    tester.pump(const Duration(milliseconds: 32));

void main() {
  setUpAll(() async {
    await loadAppFonts();
    await loadPackagedFonts();
  });

  testGoldens('containers matrix — light', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.light()),
      surfaceSize: const Size(420, 1400),
    );
    await screenMatchesGolden(
      tester,
      'containers_matrix_light',
      customPump: _pumpMatrix,
    );
  });

  testGoldens('containers matrix — dark', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.dark()),
      surfaceSize: const Size(420, 1400),
    );
    await screenMatchesGolden(
      tester,
      'containers_matrix_dark',
      customPump: _pumpMatrix,
    );
  });
}
