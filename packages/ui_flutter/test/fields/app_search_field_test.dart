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
  group('AppSearchField', () {
    testWidgets('renders label and value', (tester) async {
      await _pump(
        tester,
        const AppSearchField(label: 'Search', value: 'flutter'),
      );
      expect(find.text('Search'), findsOneWidget);
      expect(find.text('flutter'), findsOneWidget);
      final icons = tester.widgetList<IconCS>(find.byType(IconCS));
      expect(icons.any((icon) => icon.name == IconName.search), isTrue);
    });

    testWidgets('value/onChanged: typing calls onChanged', (tester) async {
      String? seen;
      await _pump(
        tester,
        AppSearchField(label: 'Search', value: '', onChanged: (v) => seen = v),
      );
      await tester.enterText(find.byType(TextField), 'dart');
      expect(seen, 'dart');
    });

    testWidgets('clear button is hidden when empty, shown with a value', (
      tester,
    ) async {
      await _pump(tester, const AppSearchField(label: 'Search', value: ''));
      expect(find.byType(AppIconButton), findsNothing);

      await _pump(tester, const AppSearchField(label: 'Search', value: 'dart'));
      expect(find.byType(AppIconButton), findsOneWidget);
    });

    testWidgets('tapping clear emits an empty string', (tester) async {
      String? seen;
      await _pump(
        tester,
        AppSearchField(
          label: 'Search',
          value: 'dart',
          onChanged: (v) => seen = v,
        ),
      );
      await tester.tap(find.byType(AppIconButton));
      expect(seen, '');
    });

    testWidgets('error state: shows the error message', (tester) async {
      await _pump(
        tester,
        const AppSearchField(label: 'Search', value: '', error: 'Required'),
      );
      expect(find.text('Required'), findsOneWidget);
    });

    testWidgets('disabled: field and clear button are disabled', (
      tester,
    ) async {
      await _pump(
        tester,
        const AppSearchField(label: 'Search', value: 'dart', disabled: true),
      );
      final field = tester.widget<TextField>(find.byType(TextField));
      expect(field.enabled, isFalse);
      final clear = tester.widget<AppIconButton>(find.byType(AppIconButton));
      expect(clear.disabled, isTrue);
    });
  });
}
