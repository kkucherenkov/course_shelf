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
  group('AppTextField', () {
    testWidgets('renders label and value', (tester) async {
      await _pump(
        tester,
        const AppTextField(label: 'Email', value: 'kirill@example.com'),
      );
      expect(find.text('Email'), findsOneWidget);
      expect(find.text('kirill@example.com'), findsOneWidget);
    });

    testWidgets('value/onChanged: typing calls onChanged with new text', (
      tester,
    ) async {
      String? seen;
      await _pump(
        tester,
        AppTextField(label: 'Name', value: '', onChanged: (v) => seen = v),
      );
      await tester.enterText(find.byType(TextField), 'Ada');
      expect(seen, 'Ada');
    });

    testWidgets('reflects an externally-updated value', (tester) async {
      Widget build(String value) => AppTextField(label: 'Name', value: value);
      await _pump(tester, build('Ada'));
      expect(find.text('Ada'), findsOneWidget);
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light(),
          home: Scaffold(body: Center(child: build('Grace'))),
        ),
      );
      expect(find.text('Grace'), findsOneWidget);
    });

    testWidgets('error state: shows the error message, not the help text', (
      tester,
    ) async {
      await _pump(
        tester,
        const AppTextField(
          label: 'Email',
          value: '',
          help: 'We will never share this.',
          error: 'Required',
        ),
      );
      expect(find.text('Required'), findsOneWidget);
      expect(find.text('We will never share this.'), findsNothing);
    });

    testWidgets('disabled: the underlying TextField is disabled', (
      tester,
    ) async {
      await _pump(
        tester,
        const AppTextField(label: 'Email', value: '', disabled: true),
      );
      final field = tester.widget<TextField>(find.byType(TextField));
      expect(field.enabled, isFalse);
    });

    testWidgets('password type obscures text', (tester) async {
      await _pump(
        tester,
        const AppTextField(
          label: 'Password',
          value: 'secret',
          type: AppTextFieldType.password,
        ),
      );
      final field = tester.widget<TextField>(find.byType(TextField));
      expect(field.obscureText, isTrue);
    });

    testWidgets('required renders the asterisk', (tester) async {
      await _pump(
        tester,
        const AppTextField(label: 'Email', value: '', required: true),
      );
      expect(find.text('*'), findsOneWidget);
    });
  });
}
