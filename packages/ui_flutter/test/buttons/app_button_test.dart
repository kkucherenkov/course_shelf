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
  group('AppButton', () {
    testWidgets('renders its label', (tester) async {
      await _pump(tester, const AppButton(label: 'Save'));
      expect(find.text('Save'), findsOneWidget);
    });

    testWidgets('fires onPressed on tap', (tester) async {
      var taps = 0;
      await _pump(tester, AppButton(label: 'Save', onPressed: () => taps++));
      await tester.tap(find.byType(AppButton));
      expect(taps, 1);
    });

    testWidgets('disabled: no tap, null onPressed, faded to 0.45', (
      tester,
    ) async {
      var taps = 0;
      await _pump(
        tester,
        AppButton(label: 'X', disabled: true, onPressed: () => taps++),
      );
      await tester.tap(find.byType(AppButton), warnIfMissed: false);
      expect(taps, 0);
      expect(
        tester.widget<TextButton>(find.byType(TextButton)).onPressed,
        isNull,
      );
      expect(
        find.byWidgetPredicate((w) => w is Opacity && w.opacity == 0.45),
        findsOneWidget,
      );
    });

    testWidgets('loading: spinner shown, label hidden, tap guarded', (
      tester,
    ) async {
      var taps = 0;
      await _pump(
        tester,
        AppButton(label: 'Save', loading: true, onPressed: () => taps++),
      );
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.text('Save'), findsNothing);
      await tester.tap(find.byType(AppButton), warnIfMissed: false);
      expect(taps, 0);
    });

    testWidgets('renders leading + trailing IconCS at the size icon px', (
      tester,
    ) async {
      await _pump(
        tester,
        const AppButton(
          label: 'Go',
          iconLeading: IconName.play,
          iconTrailing: IconName.chevronRight,
        ),
      );
      final icons = tester.widgetList<IconCS>(find.byType(IconCS)).toList();
      expect(icons.length, 2);
      expect(icons.every((i) => i.size == 20), isTrue);
    });

    testWidgets('block fills the available width', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light(),
          home: Scaffold(
            body: SizedBox(
              width: 400,
              child: Align(
                alignment: Alignment.centerLeft,
                child: AppButton(label: 'Wide', block: true, onPressed: () {}),
              ),
            ),
          ),
        ),
      );
      expect(tester.getSize(find.byType(AppButton)).width, 400);
    });

    testWidgets('non-block shrinks below the available width', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light(),
          home: Scaffold(
            body: SizedBox(
              width: 400,
              child: Align(
                alignment: Alignment.centerLeft,
                child: AppButton(label: 'Narrow', onPressed: () {}),
              ),
            ),
          ),
        ),
      );
      expect(tester.getSize(find.byType(AppButton)).width, lessThan(400));
    });

    testWidgets('each variant resolves its token background', (tester) async {
      final theme = AppTheme.light();
      final sem = theme.extension<AppSemanticColors>()!;
      final cases = <AppButtonVariant, Color>{
        AppButtonVariant.primary: theme.colorScheme.primary,
        AppButtonVariant.secondary: sem.raised,
        AppButtonVariant.ghost: Colors.transparent,
        AppButtonVariant.destructive: theme.colorScheme.error,
      };
      for (final entry in cases.entries) {
        await _pump(
          tester,
          AppButton(label: 'V', variant: entry.key),
          theme: theme,
        );
        final style = tester.widget<TextButton>(find.byType(TextButton)).style!;
        expect(
          style.backgroundColor!.resolve(<WidgetState>{}),
          entry.value,
          reason: 'variant ${entry.key.name}',
        );
      }
    });

    testWidgets('each size resolves its height', (tester) async {
      final heights = <AppButtonSize, double>{
        AppButtonSize.sm: 28,
        AppButtonSize.md: 36,
        AppButtonSize.lg: 44,
      };
      for (final entry in heights.entries) {
        await _pump(tester, AppButton(label: 'H', size: entry.key));
        expect(
          tester.getSize(find.byType(AppButton)).height,
          entry.value,
          reason: 'size ${entry.key.name}',
        );
      }
    });
  });
}
