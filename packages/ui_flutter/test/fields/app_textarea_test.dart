import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_ui/app_ui.dart';

Future<void> _pump(
  WidgetTester tester,
  Widget child, {
  ThemeData? theme,
}) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: theme ?? AppTheme.light(),
      home: Scaffold(body: Center(child: child)),
    ),
  );
}

void main() {
  group('AppTextarea', () {
    testWidgets('renders the placeholder as TextField hint text', (
      tester,
    ) async {
      await _pump(
        tester,
        const AppTextarea(value: '', placeholder: 'Write notes…'),
      );
      final field = tester.widget<TextField>(find.byType(TextField));
      expect(field.decoration?.hintText, 'Write notes…');
    });

    testWidgets('reflects value into the underlying controller', (
      tester,
    ) async {
      await _pump(tester, const AppTextarea(value: 'hello world'));
      final field = tester.widget<TextField>(find.byType(TextField));
      expect(field.controller?.text, 'hello world');
    });

    testWidgets('fires onChanged when text is entered', (tester) async {
      String? seen;
      await _pump(
        tester,
        AppTextarea(value: '', onChanged: (next) => seen = next),
      );
      await tester.enterText(find.byType(TextField), 'typed');
      expect(seen, 'typed');
    });

    testWidgets('defaults rows to 3 (minLines == maxLines == 3)', (
      tester,
    ) async {
      await _pump(tester, const AppTextarea(value: ''));
      final field = tester.widget<TextField>(find.byType(TextField));
      expect(field.minLines, 3);
      expect(field.maxLines, 3);
    });

    testWidgets('honours an explicit rows count', (tester) async {
      await _pump(tester, const AppTextarea(value: '', rows: 6));
      final field = tester.widget<TextField>(find.byType(TextField));
      expect(field.minLines, 6);
      expect(field.maxLines, 6);
    });

    testWidgets('is multiline: keyboardType is TextInputType.multiline', (
      tester,
    ) async {
      await _pump(tester, const AppTextarea(value: ''));
      final field = tester.widget<TextField>(find.byType(TextField));
      expect(field.keyboardType, TextInputType.multiline);
    });

    testWidgets('disabled: TextField is disabled and shows the muted fill', (
      tester,
    ) async {
      final theme = AppTheme.light();
      final sem = theme.extension<AppSemanticColors>()!;
      await _pump(
        tester,
        const AppTextarea(value: 'locked', disabled: true),
        theme: theme,
      );
      final field = tester.widget<TextField>(find.byType(TextField));
      expect(field.enabled, isFalse);
      expect(field.decoration?.fillColor, sem.raised);
    });

    testWidgets('error: shows the error message below the field', (
      tester,
    ) async {
      await _pump(tester, const AppTextarea(value: '', error: 'Too short'));
      expect(find.text('Too short'), findsOneWidget);
    });

    testWidgets('error: tints the enabled + focused border with cs.error', (
      tester,
    ) async {
      final theme = AppTheme.light();
      await _pump(
        tester,
        const AppTextarea(value: '', error: 'Too short'),
        theme: theme,
      );
      final field = tester.widget<TextField>(find.byType(TextField));
      final enabledBorder =
          field.decoration?.enabledBorder as OutlineInputBorder;
      final focusedBorder =
          field.decoration?.focusedBorder as OutlineInputBorder;
      expect(enabledBorder.borderSide.color, theme.colorScheme.error);
      expect(focusedBorder.borderSide.color, theme.colorScheme.error);
    });

    testWidgets('no error: focused border uses semanticColors.borderFocus', (
      tester,
    ) async {
      final theme = AppTheme.light();
      final sem = theme.extension<AppSemanticColors>()!;
      await _pump(tester, const AppTextarea(value: ''), theme: theme);
      final field = tester.widget<TextField>(find.byType(TextField));
      final focusedBorder =
          field.decoration?.focusedBorder as OutlineInputBorder;
      expect(focusedBorder.borderSide.color, sem.borderFocus);
    });

    testWidgets('no maxLength: no counter is rendered', (tester) async {
      await _pump(tester, const AppTextarea(value: 'abc'));
      expect(find.textContaining('/'), findsNothing);
    });

    testWidgets('maxLength: renders a live character counter', (tester) async {
      await _pump(tester, const AppTextarea(value: 'abc', maxLength: 10));
      expect(find.text('3/10'), findsOneWidget);
      await tester.enterText(find.byType(TextField), 'abcde');
      await tester.pump();
      expect(find.text('5/10'), findsOneWidget);
    });

    testWidgets('maxLength: TextField enforces the cap', (tester) async {
      await _pump(tester, const AppTextarea(value: '', maxLength: 4));
      final field = tester.widget<TextField>(find.byType(TextField));
      expect(field.maxLength, 4);
    });
  });
}
