import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_ui/app_ui.dart';

const _fruits = <AppSelectOption>[
  AppSelectOption(id: 'apple', label: 'Apple'),
  AppSelectOption(id: 'banana', label: 'Banana'),
  AppSelectOption(id: 'cherry', label: 'Cherry', disabled: true),
];

Future<void> _pump(WidgetTester tester, Widget child) => tester.pumpWidget(
  MaterialApp(
    theme: AppTheme.light(),
    home: Scaffold(body: Center(child: child)),
  ),
);

void main() {
  group('AppSelect', () {
    testWidgets('renders the placeholder when value is null', (tester) async {
      await _pump(
        tester,
        const AppSelect(options: _fruits, placeholder: 'Pick a fruit…'),
      );
      expect(find.text('Pick a fruit…'), findsOneWidget);
    });

    testWidgets('renders the selected option label', (tester) async {
      await _pump(tester, const AppSelect(options: _fruits, value: 'banana'));
      expect(find.text('Banana'), findsOneWidget);
    });

    testWidgets('value/onChanged: choosing an option calls onChanged', (
      tester,
    ) async {
      String? seen;
      await _pump(
        tester,
        AppSelect(options: _fruits, onChanged: (v) => seen = v),
      );
      await tester.tap(find.byType(DropdownButton<String>));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Banana').last);
      await tester.pumpAndSettle();
      expect(seen, 'banana');
    });

    testWidgets('invalid draws the error-coloured border', (tester) async {
      final theme = AppTheme.light();
      await tester.pumpWidget(
        MaterialApp(
          theme: theme,
          home: const Scaffold(
            body: Center(child: AppSelect(options: _fruits, invalid: true)),
          ),
        ),
      );
      final container = tester.widget<AnimatedContainer>(
        find.byType(AnimatedContainer),
      );
      final decoration = container.decoration! as BoxDecoration;
      expect(decoration.border!.top.color, theme.colorScheme.error);
    });

    testWidgets('disabled: the dropdown has no onChanged callback', (
      tester,
    ) async {
      await _pump(
        tester,
        const AppSelect(options: _fruits, value: 'apple', disabled: true),
      );
      final dropdown = tester.widget<DropdownButton<String>>(
        find.byType(DropdownButton<String>),
      );
      expect(dropdown.onChanged, isNull);
    });
  });
}
