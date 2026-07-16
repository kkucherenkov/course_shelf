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
  group('AppNumberField', () {
    testWidgets('renders label and value', (tester) async {
      await _pump(tester, const AppNumberField(label: 'Quantity', value: 3));
      expect(find.text('Quantity'), findsOneWidget);
      expect(find.text('3'), findsOneWidget);
    });

    testWidgets('renders nothing for a null value', (tester) async {
      await _pump(tester, const AppNumberField(label: 'Quantity', value: null));
      final field = tester.widget<TextField>(find.byType(TextField));
      expect(field.controller!.text, '');
    });

    testWidgets('value/onChanged: typing a digit calls onChanged', (
      tester,
    ) async {
      num? seen;
      await _pump(
        tester,
        AppNumberField(label: 'Quantity', value: 1, onChanged: (v) => seen = v),
      );
      await tester.enterText(find.byType(TextField), '12');
      expect(seen, 12);
    });

    testWidgets('increment button fires onChanged with value + step', (
      tester,
    ) async {
      num? seen;
      await _pump(
        tester,
        AppNumberField(label: 'Quantity', value: 3, onChanged: (v) => seen = v),
      );
      await tester.tap(
        find.byWidgetPredicate(
          (w) => w is AppIconButton && w.name == IconName.plus,
        ),
      );
      expect(seen, 4);
    });

    testWidgets('increment/decrement clamp to min/max and disable steppers', (
      tester,
    ) async {
      num? seen;
      await _pump(
        tester,
        AppNumberField(
          label: 'Quantity',
          value: 5,
          min: 0,
          max: 5,
          onChanged: (v) => seen = v,
        ),
      );
      final buttons = tester
          .widgetList<AppIconButton>(find.byType(AppIconButton))
          .toList();
      final decrement = buttons.firstWhere((b) => b.name == IconName.minus);
      final increment = buttons.firstWhere((b) => b.name == IconName.plus);
      expect(increment.disabled, isTrue, reason: 'already at max');
      expect(decrement.disabled, isFalse);

      await tester.tap(
        find.byWidgetPredicate(
          (w) => w is AppIconButton && w.name == IconName.minus,
        ),
      );
      expect(seen, 4);
    });

    testWidgets('error state: shows the error message', (tester) async {
      await _pump(
        tester,
        const AppNumberField(label: 'Quantity', value: null, error: 'Required'),
      );
      expect(find.text('Required'), findsOneWidget);
    });

    testWidgets('disabled: steppers and text field are disabled', (
      tester,
    ) async {
      await _pump(
        tester,
        const AppNumberField(label: 'Quantity', value: 1, disabled: true),
      );
      final field = tester.widget<TextField>(find.byType(TextField));
      expect(field.enabled, isFalse);
      final buttons = tester.widgetList<AppIconButton>(
        find.byType(AppIconButton),
      );
      expect(buttons.every((b) => b.disabled), isTrue);
    });
  });
}
