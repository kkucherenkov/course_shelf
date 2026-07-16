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
  group('AppCheckbox', () {
    testWidgets('renders its label', (tester) async {
      await _pump(
        tester,
        const AppCheckbox(value: false, label: 'Accept terms'),
      );
      expect(find.text('Accept terms'), findsOneWidget);
    });

    testWidgets('renders a check glyph only when checked', (tester) async {
      await _pump(tester, const AppCheckbox(value: false));
      expect(find.byType(IconCS), findsNothing);

      await _pump(tester, const AppCheckbox(value: true));
      final icon = tester.widget<IconCS>(find.byType(IconCS));
      expect(icon.name, IconName.check);
    });

    testWidgets('indeterminate renders a dash glyph, wins over checked', (
      tester,
    ) async {
      await _pump(tester, const AppCheckbox(value: true, indeterminate: true));
      final icon = tester.widget<IconCS>(find.byType(IconCS));
      expect(icon.name, IconName.minus);
    });

    testWidgets('value/onChanged: tapping toggles the value', (tester) async {
      bool? seen;
      await _pump(
        tester,
        AppCheckbox(value: false, onChanged: (v) => seen = v),
      );
      await tester.tap(find.byType(AppCheckbox));
      expect(seen, isTrue);
    });

    testWidgets('disabled: tap is a no-op and the control is faded', (
      tester,
    ) async {
      bool? seen;
      await _pump(
        tester,
        AppCheckbox(value: false, disabled: true, onChanged: (v) => seen = v),
      );
      await tester.tap(find.byType(AppCheckbox), warnIfMissed: false);
      expect(seen, isNull);
      expect(
        find.byWidgetPredicate(
          (w) => w is Opacity && w.opacity == AppOpacity.disabled,
        ),
        findsOneWidget,
      );
    });

    testWidgets('exposes its checked/mixed state to assistive tech', (
      tester,
    ) async {
      await _pump(
        tester,
        const AppCheckbox(
          value: false,
          indeterminate: true,
          label: 'Select all',
        ),
      );
      // Focus() also wraps its child in an unlabelled Semantics node —
      // find ours specifically by its label.
      final semantics = tester
          .widgetList<Semantics>(
            find.descendant(
              of: find.byType(AppCheckbox),
              matching: find.byType(Semantics),
            ),
          )
          .firstWhere((s) => s.properties.label == 'Select all');
      expect(semantics.properties.mixed, isTrue);
    });
  });
}
