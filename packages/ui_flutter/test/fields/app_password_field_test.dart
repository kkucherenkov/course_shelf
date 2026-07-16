import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_ui/app_ui.dart';

Future<void> _pump(WidgetTester tester, Widget child) => tester.pumpWidget(
  MaterialApp(
    theme: AppTheme.light(),
    home: Scaffold(body: Center(child: child)),
  ),
);

Color _unfilled(WidgetTester tester) => Theme.of(
  tester.element(find.byType(AppPasswordField)),
).colorScheme.surfaceContainerHighest;

int _filledSegmentCount(WidgetTester tester) {
  final unfilled = _unfilled(tester);
  var count = 0;
  for (var i = 1; i <= 3; i++) {
    final container = tester.widget<Container>(
      find.byKey(ValueKey<String>('app-password-field-meter-segment-$i')),
    );
    final decoration = container.decoration! as BoxDecoration;
    if (decoration.color != unfilled) count++;
  }
  return count;
}

void main() {
  group('AppPasswordField', () {
    testWidgets('renders label and obscures the value by default', (
      tester,
    ) async {
      await _pump(
        tester,
        const AppPasswordField(label: 'Password', value: 'secret123'),
      );
      expect(find.text('Password'), findsOneWidget);
      final field = tester.widget<TextField>(find.byType(TextField));
      expect(field.obscureText, isTrue);
      expect(field.controller!.text, 'secret123');
    });

    testWidgets('emits onChanged when typing', (tester) async {
      String? seen;
      await _pump(
        tester,
        AppPasswordField(value: '', onChanged: (v) => seen = v),
      );
      await tester.enterText(find.byType(TextField), 'hunter2');
      expect(seen, 'hunter2');
    });

    testWidgets('toggle button flips obscureText and swaps aria label', (
      tester,
    ) async {
      await _pump(
        tester,
        const AppPasswordField(
          value: 'secret',
          showLabel: 'Show password',
          hideLabel: 'Hide password',
        ),
      );

      expect(
        tester.widget<TextField>(find.byType(TextField)).obscureText,
        isTrue,
      );
      var toggle = tester.widget<AppIconButton>(find.byType(AppIconButton));
      expect(toggle.semanticLabel, 'Show password');

      await tester.tap(find.byType(AppIconButton));
      await tester.pump();

      expect(
        tester.widget<TextField>(find.byType(TextField)).obscureText,
        isFalse,
      );
      toggle = tester.widget<AppIconButton>(find.byType(AppIconButton));
      expect(toggle.semanticLabel, 'Hide password');

      await tester.tap(find.byType(AppIconButton));
      await tester.pump();

      expect(
        tester.widget<TextField>(find.byType(TextField)).obscureText,
        isTrue,
      );
    });

    testWidgets('disabled: toggle button and field are disabled', (
      tester,
    ) async {
      await _pump(
        tester,
        const AppPasswordField(value: 'secret', disabled: true),
      );
      final field = tester.widget<TextField>(find.byType(TextField));
      expect(field.enabled, isFalse);
      final toggle = tester.widget<AppIconButton>(find.byType(AppIconButton));
      expect(toggle.disabled, isTrue);

      await tester.tap(find.byType(AppIconButton));
      await tester.pump();
      expect(
        tester.widget<TextField>(find.byType(TextField)).obscureText,
        isTrue,
      );
    });

    testWidgets('error state: shows the error message', (tester) async {
      await _pump(tester, const AppPasswordField(value: '', error: 'Required'));
      expect(find.text('Required'), findsOneWidget);
    });

    testWidgets('renders hint when no error', (tester) async {
      await _pump(
        tester,
        const AppPasswordField(value: '', help: 'Use a memorable phrase'),
      );
      expect(find.text('Use a memorable phrase'), findsOneWidget);
    });

    group('strength meter', () {
      // Mirrors the web `AppPasswordField.spec.ts` strength-meter matrix
      // verbatim.
      const cases = <(String, int, String)>[
        ('', 0, 'Empty'),
        ('abc', 1, 'Weak'),
        ('aaaaaaaa', 2, 'Okay'),
        ('abcdefghijkl', 2, 'Okay'),
        ('ab1!', 1, 'Weak'),
        ('abc!def@', 2, 'Okay'),
        ('abcdefghijkl1!', 3, 'Strong'),
        ('abcdefghijklmnopq', 3, 'Strong'),
      ];

      for (final (value, expectedScore, expectedLabel) in cases) {
        testWidgets('"$value" -> score $expectedScore ($expectedLabel)', (
          tester,
        ) async {
          expect(
            AppPasswordStrength.of(value).segments,
            expectedScore,
            reason: 'pure strength function',
          );

          await _pump(tester, AppPasswordField(value: value, withMeter: true));
          expect(_filledSegmentCount(tester), expectedScore);
          expect(
            find.textContaining(expectedLabel),
            findsOneWidget,
            reason: 'meter caption should show the strength label',
          );
        });
      }

      testWidgets('does not render the meter when withMeter is false', (
        tester,
      ) async {
        await _pump(tester, const AppPasswordField(value: 'whatever'));
        expect(
          find.byKey(
            const ValueKey<String>('app-password-field-meter-segment-1'),
          ),
          findsNothing,
        );
      });

      testWidgets('error wins over meter caption when both could apply', (
        tester,
      ) async {
        await _pump(
          tester,
          const AppPasswordField(
            value: 'x',
            withMeter: true,
            error: 'Too weak',
          ),
        );
        expect(find.text('Too weak'), findsOneWidget);
        expect(find.textContaining('12+ chars'), findsNothing);
        // The bar itself is independent of the error/help footer priority —
        // it still renders (mirrors the web template, where `v-if="withMeter"`
        // on the bar has no dependency on the error/hint block below it).
        expect(
          find.byKey(
            const ValueKey<String>('app-password-field-meter-segment-1'),
          ),
          findsOneWidget,
        );
      });
    });
  });
}
