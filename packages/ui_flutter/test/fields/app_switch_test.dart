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
  group('AppSwitch', () {
    testWidgets('renders its label', (tester) async {
      await _pump(
        tester,
        const AppSwitch(value: false, label: 'Notifications'),
      );
      expect(find.text('Notifications'), findsOneWidget);
    });

    testWidgets('value/onChanged: tapping toggles the value', (tester) async {
      bool? seen;
      await _pump(tester, AppSwitch(value: false, onChanged: (v) => seen = v));
      await tester.tap(find.byType(AppSwitch));
      expect(seen, isTrue);
    });

    testWidgets('tapping the label also toggles (label is clickable)', (
      tester,
    ) async {
      bool? seen;
      await _pump(
        tester,
        AppSwitch(
          value: false,
          label: 'Notifications',
          onChanged: (v) => seen = v,
        ),
      );
      await tester.tap(find.text('Notifications'));
      expect(seen, isTrue);
    });

    testWidgets('disabled: tap is a no-op and the control is faded', (
      tester,
    ) async {
      bool? seen;
      await _pump(
        tester,
        AppSwitch(value: false, disabled: true, onChanged: (v) => seen = v),
      );
      await tester.tap(find.byType(AppSwitch), warnIfMissed: false);
      expect(seen, isNull);
      expect(
        find.byWidgetPredicate(
          (w) => w is Opacity && w.opacity == AppOpacity.disabled,
        ),
        findsOneWidget,
      );
    });

    testWidgets('exposes its checked state to assistive tech', (tester) async {
      await _pump(tester, const AppSwitch(value: true, label: 'Wifi'));
      // Focus() also wraps its child in an unlabelled Semantics node —
      // find ours specifically by its label.
      final semantics = tester
          .widgetList<Semantics>(
            find.descendant(
              of: find.byType(AppSwitch),
              matching: find.byType(Semantics),
            ),
          )
          .firstWhere((s) => s.properties.label == 'Wifi');
      expect(semantics.properties.toggled, isTrue);
    });
  });
}
