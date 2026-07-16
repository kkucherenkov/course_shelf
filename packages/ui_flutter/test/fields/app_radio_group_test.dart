import 'dart:ui' show SemanticsRole;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golden_toolkit/golden_toolkit.dart';

import 'package:app_ui/app_ui.dart';

import '../_support/fonts.dart';

const _fruitOptions = <AppRadioGroupOption<String>>[
  AppRadioGroupOption(value: 'apple', label: 'Apple'),
  AppRadioGroupOption(value: 'banana', label: 'Banana'),
  AppRadioGroupOption(value: 'cherry', label: 'Cherry'),
];

Future<void> _pump(WidgetTester tester, Widget child) => tester.pumpWidget(
  MaterialApp(
    theme: AppTheme.light(),
    home: Scaffold(body: Center(child: child)),
  ),
);

void main() {
  group('AppRadioGroup', () {
    testWidgets('renders the group label and every option label', (
      tester,
    ) async {
      await _pump(
        tester,
        AppRadioGroup<String>(
          label: 'Pick a fruit',
          value: 'apple',
          options: _fruitOptions,
          onChanged: (_) {},
        ),
      );

      expect(find.text('Pick a fruit'), findsOneWidget);
      expect(find.text('Apple'), findsOneWidget);
      expect(find.text('Banana'), findsOneWidget);
      expect(find.text('Cherry'), findsOneWidget);
    });

    testWidgets("renders an option's description when supplied", (
      tester,
    ) async {
      await _pump(
        tester,
        AppRadioGroup<String>(
          label: 'Pick a fruit',
          value: 'apple',
          onChanged: (_) {},
          options: const <AppRadioGroupOption<String>>[
            AppRadioGroupOption(
              value: 'apple',
              label: 'Apple',
              description: 'Crisp and sweet',
            ),
            AppRadioGroupOption(value: 'banana', label: 'Banana'),
          ],
        ),
      );

      expect(find.text('Crisp and sweet'), findsOneWidget);
    });

    testWidgets('tapping an unselected option fires onChanged with its value', (
      tester,
    ) async {
      String? seen;
      await _pump(
        tester,
        AppRadioGroup<String>(
          label: 'Pick a fruit',
          value: 'apple',
          options: _fruitOptions,
          onChanged: (v) => seen = v,
        ),
      );

      await tester.tap(find.text('Banana'));
      expect(seen, 'banana');
    });

    testWidgets('the currently-selected option reflects the checked visual', (
      tester,
    ) async {
      final theme = AppTheme.light();
      await tester.pumpWidget(
        MaterialApp(
          theme: theme,
          home: Scaffold(
            body: AppRadioGroup<String>(
              label: 'Pick a fruit',
              value: 'banana',
              options: _fruitOptions,
              onChanged: (_) {},
            ),
          ),
        ),
      );

      // Same predicate AppRadio's own tests use to find the filled dot —
      // exactly one option (the selected one) should show it.
      bool isDot(Widget w) =>
          w is DecoratedBox &&
          (w.decoration as BoxDecoration).shape == BoxShape.circle &&
          (w.decoration as BoxDecoration).color == theme.colorScheme.primary;

      expect(find.byWidgetPredicate(isDot), findsOneWidget);
    });

    testWidgets('disabled group blocks onChanged', (tester) async {
      String? seen;
      await _pump(
        tester,
        AppRadioGroup<String>(
          label: 'Pick a fruit',
          value: 'apple',
          disabled: true,
          options: _fruitOptions,
          onChanged: (v) => seen = v,
        ),
      );

      await tester.tap(find.text('Banana'), warnIfMissed: false);
      expect(seen, isNull);
    });

    testWidgets(
      'a disabled option blocks onChanged even when the group is enabled',
      (tester) async {
        String? seen;
        await _pump(
          tester,
          AppRadioGroup<String>(
            label: 'Pick a fruit',
            value: 'apple',
            onChanged: (v) => seen = v,
            options: const <AppRadioGroupOption<String>>[
              AppRadioGroupOption(value: 'apple', label: 'Apple'),
              AppRadioGroupOption(
                value: 'banana',
                label: 'Banana',
                disabled: true,
              ),
            ],
          ),
        );

        await tester.tap(find.text('Banana'), warnIfMissed: false);
        expect(seen, isNull);
      },
    );

    testWidgets(
      'exposes a radiogroup role with the group label as its accessible name',
      (tester) async {
        await _pump(
          tester,
          AppRadioGroup<String>(
            label: 'Pick a fruit',
            value: 'apple',
            options: _fruitOptions,
            onChanged: (_) {},
          ),
        );

        final groupSemantics = tester
            .widgetList<Semantics>(
              find.descendant(
                of: find.byType(AppRadioGroup<String>),
                matching: find.byType(Semantics),
              ),
            )
            .firstWhere((s) => s.properties.role == SemanticsRole.radioGroup);
        expect(groupSemantics.properties.label, 'Pick a fruit');
      },
    );
  });

  group('AppRadioGroup golden matrix', () {
    setUpAll(() async {
      await loadAppFonts();
      await loadPackagedFonts();
    });

    Widget matrix(ThemeData theme) => MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: theme,
      home: Scaffold(
        body: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              AppRadioGroup<String>(
                label: 'List density',
                value: 'comfortable',
                onChanged: (_) {},
                options: const <AppRadioGroupOption<String>>[
                  AppRadioGroupOption(
                    value: 'comfortable',
                    label: 'Comfortable',
                  ),
                  AppRadioGroupOption(value: 'compact', label: 'Compact'),
                ],
              ),
              const SizedBox(height: 20),
              AppRadioGroup<String>(
                label: 'Notification frequency',
                value: 'daily',
                onChanged: (_) {},
                options: const <AppRadioGroupOption<String>>[
                  AppRadioGroupOption(
                    value: 'daily',
                    label: 'Daily digest',
                    description: 'One email a day with everything new.',
                  ),
                  AppRadioGroupOption(
                    value: 'weekly',
                    label: 'Weekly digest',
                    description: 'A single summary every Monday.',
                  ),
                ],
              ),
              const SizedBox(height: 20),
              AppRadioGroup<String>(
                label: 'Disabled group',
                value: 'a',
                disabled: true,
                onChanged: (_) {},
                options: const <AppRadioGroupOption<String>>[
                  AppRadioGroupOption(value: 'a', label: 'Option A'),
                  AppRadioGroupOption(value: 'b', label: 'Option B'),
                ],
              ),
            ],
          ),
        ),
      ),
    );

    Future<void> pumpMatrix(WidgetTester tester) =>
        tester.pump(const Duration(milliseconds: 32));

    testGoldens('radio group matrix — light', (tester) async {
      await tester.pumpWidgetBuilder(
        matrix(AppTheme.light()),
        surfaceSize: const Size(360, 560),
      );
      await screenMatchesGolden(
        tester,
        'radio_group_matrix_light',
        customPump: pumpMatrix,
      );
    });

    testGoldens('radio group matrix — dark', (tester) async {
      await tester.pumpWidgetBuilder(
        matrix(AppTheme.dark()),
        surfaceSize: const Size(360, 560),
      );
      await screenMatchesGolden(
        tester,
        'radio_group_matrix_dark',
        customPump: pumpMatrix,
      );
    });
  });
}
