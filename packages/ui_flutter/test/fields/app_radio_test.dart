import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_ui/app_ui.dart';

Future<void> _pump(WidgetTester tester, Widget child) => tester.pumpWidget(
  MaterialApp(
    theme: AppTheme.light(),
    home: Scaffold(body: Center(child: child)),
  ),
);

void main() {
  group('AppRadio', () {
    testWidgets('renders its label', (tester) async {
      await _pump(
        tester,
        const AppRadio<String>(value: 'a', groupValue: 'a', label: 'Option A'),
      );
      expect(find.text('Option A'), findsOneWidget);
    });

    testWidgets('value/onChanged: tapping an unselected radio selects it', (
      tester,
    ) async {
      String? seen;
      await _pump(
        tester,
        AppRadio<String>(
          value: 'b',
          groupValue: 'a',
          onChanged: (v) => seen = v,
        ),
      );
      await tester.tap(find.byType(AppRadio<String>));
      expect(seen, 'b');
    });

    testWidgets('a group only shows the dot on the matching option', (
      tester,
    ) async {
      const value1 = ValueKey('one');
      const value2 = ValueKey('two');
      final theme = AppTheme.light();
      await tester.pumpWidget(
        MaterialApp(
          theme: theme,
          home: const Scaffold(
            body: Column(
              children: <Widget>[
                AppRadio<String>(
                  key: value1,
                  value: 'a',
                  groupValue: 'b',
                  label: 'A',
                ),
                AppRadio<String>(
                  key: value2,
                  value: 'b',
                  groupValue: 'b',
                  label: 'B',
                ),
              ],
            ),
          ),
        ),
      );
      // Only the selected radio's dot fills with the primary colour; the
      // ring/circle chrome around both options never does.
      bool isDot(Widget w) =>
          w is DecoratedBox &&
          (w.decoration as BoxDecoration).shape == BoxShape.circle &&
          (w.decoration as BoxDecoration).color == theme.colorScheme.primary;

      final dotInOne = find.descendant(
        of: find.byKey(value1),
        matching: find.byWidgetPredicate(isDot),
      );
      final dotInTwo = find.descendant(
        of: find.byKey(value2),
        matching: find.byWidgetPredicate(isDot),
      );
      expect(dotInOne.evaluate().length, 0);
      expect(dotInTwo.evaluate().length, 1);
    });

    testWidgets('disabled: tap is a no-op and the control is faded', (
      tester,
    ) async {
      String? seen;
      await _pump(
        tester,
        AppRadio<String>(
          value: 'a',
          groupValue: 'b',
          disabled: true,
          onChanged: (v) => seen = v,
        ),
      );
      await tester.tap(find.byType(AppRadio<String>), warnIfMissed: false);
      expect(seen, isNull);
      expect(
        find.byWidgetPredicate(
          (w) => w is Opacity && w.opacity == AppOpacity.disabled,
        ),
        findsOneWidget,
      );
    });
  });
}
