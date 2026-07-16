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

BoxDecoration _decoration(WidgetTester tester) {
  final container = tester.widget<Container>(
    find.descendant(of: find.byType(AppChip), matching: find.byType(Container)),
  );
  return container.decoration! as BoxDecoration;
}

TextStyle _labelStyle(WidgetTester tester, String text) =>
    tester.widget<Text>(find.text(text)).style!;

void main() {
  group('AppChip', () {
    testWidgets('renders the label prop', (tester) async {
      await _pump(tester, const AppChip(label: 'Hello'));
      expect(find.text('Hello'), findsOneWidget);
    });

    testWidgets('prefers child content over the label prop', (tester) async {
      await _pump(
        tester,
        const AppChip(label: 'Ignored', child: Text('Slotted')),
      );
      expect(find.text('Slotted'), findsOneWidget);
      expect(find.text('Ignored'), findsNothing);
    });

    testWidgets('defaults to variant=neutral, size=md', (tester) async {
      await _pump(tester, const AppChip(label: 'x'));
      final chip = tester.widget<AppChip>(find.byType(AppChip));
      expect(chip.variant, AppChipVariant.neutral);
      expect(chip.size, AppChipSize.md);
    });

    testWidgets('each variant resolves its token background + foreground', (
      tester,
    ) async {
      final theme = AppTheme.light();
      final cs = theme.colorScheme;
      final sem = theme.extension<AppSemanticColors>()!;
      final cases = <AppChipVariant, (Color, Color)>{
        AppChipVariant.neutral: (cs.surfaceContainerHighest, cs.onSurface),
        AppChipVariant.primary: (sem.accentSoft, sem.accentHover),
        AppChipVariant.success: (sem.successSoft, sem.successFg),
        AppChipVariant.warning: (sem.warningSoft, sem.warningFg),
        AppChipVariant.error: (sem.errorSoft, cs.error),
        AppChipVariant.info: (sem.infoSoft, sem.infoFg),
      };

      for (final entry in cases.entries) {
        await _pump(
          tester,
          AppChip(label: entry.key.name, variant: entry.key),
          theme: theme,
        );
        final decoration = _decoration(tester);
        expect(
          decoration.color,
          entry.value.$1,
          reason: 'variant ${entry.key.name} background',
        );
        expect(
          _labelStyle(tester, entry.key.name).color,
          entry.value.$2,
          reason: 'variant ${entry.key.name} foreground',
        );
      }
    });

    testWidgets('renders the leading IconCS when `icon` is provided', (
      tester,
    ) async {
      await _pump(
        tester,
        const AppChip(label: 'Verified', icon: IconName.check),
      );
      expect(find.byType(IconCS), findsOneWidget);
    });

    testWidgets('does not render a leading icon when no `icon` is passed', (
      tester,
    ) async {
      await _pump(tester, const AppChip(label: 'Plain'));
      expect(find.byType(IconCS), findsNothing);
    });

    testWidgets('does not render the remove affordance by default', (
      tester,
    ) async {
      final handle = tester.ensureSemantics();
      await _pump(tester, const AppChip(label: 'x'));
      expect(find.bySemanticsLabel('Remove'), findsNothing);
      handle.dispose();
    });

    testWidgets('renders the remove affordance when `removable` is true', (
      tester,
    ) async {
      final handle = tester.ensureSemantics();
      await _pump(tester, const AppChip(label: 'x', removable: true));
      expect(find.bySemanticsLabel('Remove'), findsOneWidget);
      handle.dispose();
    });

    testWidgets(
      'emits onRemove when the remove affordance is tapped, and does not '
      'fire onTap',
      (tester) async {
        final handle = tester.ensureSemantics();
        var removes = 0;
        var taps = 0;
        await _pump(
          tester,
          AppChip(
            label: 'x',
            removable: true,
            onTap: () => taps++,
            onRemove: () => removes++,
          ),
        );
        await tester.tap(find.bySemanticsLabel('Remove'));
        expect(removes, 1);
        expect(taps, 0);
        handle.dispose();
      },
    );

    testWidgets('emits onTap when the chip content is tapped', (tester) async {
      var taps = 0;
      await _pump(tester, AppChip(label: 'x', onTap: () => taps++));
      await tester.tap(find.text('x'));
      expect(taps, 1);
    });

    testWidgets(
      'applies the selected accent border and selected semantics when '
      'selected',
      (tester) async {
        final handle = tester.ensureSemantics();
        final theme = AppTheme.light();
        await _pump(
          tester,
          const AppChip(label: 'x', selected: true),
          theme: theme,
        );
        final decoration = _decoration(tester);
        expect(decoration.border, isA<Border>());
        final border = decoration.border! as Border;
        expect(border.top.color, theme.colorScheme.primary);

        expect(
          tester.getSemantics(find.byType(AppChip)),
          matchesSemantics(
            isButton: true,
            isSelected: true,
            hasSelectedState: true,
            hasEnabledState: true,
            isEnabled: true,
            label: 'x',
          ),
        );
        handle.dispose();
      },
    );

    testWidgets('blocks onTap and onRemove when disabled, fades the chip', (
      tester,
    ) async {
      final handle = tester.ensureSemantics();
      var taps = 0;
      var removes = 0;
      await _pump(
        tester,
        AppChip(
          label: 'x',
          removable: true,
          disabled: true,
          onTap: () => taps++,
          onRemove: () => removes++,
        ),
      );
      await tester.tap(find.text('x'), warnIfMissed: false);
      await tester.tap(find.bySemanticsLabel('Remove'), warnIfMissed: false);
      expect(taps, 0);
      expect(removes, 0);
      expect(
        find.byWidgetPredicate(
          (w) => w is Opacity && w.opacity == AppOpacity.disabled,
        ),
        findsOneWidget,
      );
      handle.dispose();
    });

    testWidgets('each size resolves its fixed height', (tester) async {
      final heights = <AppChipSize, double>{
        AppChipSize.sm: 18,
        AppChipSize.md: 22,
        AppChipSize.lg: 28,
      };
      for (final entry in heights.entries) {
        await _pump(tester, AppChip(label: 'H', size: entry.key));
        final container = tester.widget<Container>(
          find.descendant(
            of: find.byType(AppChip),
            matching: find.byType(Container),
          ),
        );
        expect(
          container.constraints!.maxHeight,
          entry.value,
          reason: 'size ${entry.key.name}',
        );
      }
    });
  });
}
