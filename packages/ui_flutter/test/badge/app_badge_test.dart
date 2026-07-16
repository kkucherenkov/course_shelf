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

BoxDecoration _decorationOf(WidgetTester tester) =>
    tester.widget<DecoratedBox>(find.byType(DecoratedBox)).decoration
        as BoxDecoration;

void main() {
  group('AppBadge', () {
    testWidgets('renders the label prop', (tester) async {
      await _pump(tester, const AppBadge(label: 'Hello'));
      expect(find.text('Hello'), findsOneWidget);
    });

    testWidgets('prefers child content over the label prop', (tester) async {
      await _pump(
        tester,
        const AppBadge(label: 'Ignored', child: Text('Slotted')),
      );
      expect(find.text('Slotted'), findsOneWidget);
      expect(find.text('Ignored'), findsNothing);
    });

    testWidgets('defaults to color=neutral, variant=subtle, size=md', (
      tester,
    ) async {
      final theme = AppTheme.light();
      final sem = theme.extension<AppSemanticColors>()!;
      await _pump(tester, const AppBadge(label: 'x'), theme: theme);
      expect(_decorationOf(tester).color, sem.raised);
      expect(_decorationOf(tester).border, isNotNull);
    });

    testWidgets('renders an IconCS on the leading side when icon is set', (
      tester,
    ) async {
      await _pump(
        tester,
        const AppBadge(label: 'Verified', icon: IconName.check),
      );
      expect(find.byType(IconCS), findsOneWidget);
    });

    testWidgets('does not render an icon when icon is not set', (tester) async {
      await _pump(tester, const AppBadge(label: 'Plain'));
      expect(find.byType(IconCS), findsNothing);
    });

    testWidgets('uppercase=true renders the label in upper case', (
      tester,
    ) async {
      await _pump(tester, const AppBadge(label: 'beta', uppercase: true));
      expect(find.text('BETA'), findsOneWidget);
      expect(find.text('beta'), findsNothing);
    });

    testWidgets('uppercase=false (default) leaves the label untouched', (
      tester,
    ) async {
      await _pump(tester, const AppBadge(label: 'beta'));
      expect(find.text('beta'), findsOneWidget);
    });

    testWidgets('every color/variant combination renders without error', (
      tester,
    ) async {
      final theme = AppTheme.light();
      for (final color in AppBadgeColor.values) {
        for (final variant in AppBadgeVariant.values) {
          await _pump(
            tester,
            AppBadge(label: 'x', color: color, variant: variant),
            theme: theme,
          );
          expect(
            find.byType(AppBadge),
            findsOneWidget,
            reason: '$color / $variant should render without error',
          );
        }
      }
    });

    testWidgets('solid variant paints a filled background for every colour', (
      tester,
    ) async {
      final theme = AppTheme.light();
      for (final color in AppBadgeColor.values) {
        await _pump(
          tester,
          AppBadge(label: 'x', color: color, variant: AppBadgeVariant.solid),
          theme: theme,
        );
        final decoration = _decorationOf(tester);
        expect(
          decoration.color,
          isNot(Colors.transparent),
          reason: 'solid $color must not be transparent',
        );
        expect(
          decoration.border,
          isNull,
          reason: 'solid $color must not draw a border',
        );
      }
    });

    testWidgets('outline variant is transparent with a border', (tester) async {
      await _pump(
        tester,
        const AppBadge(
          label: 'x',
          color: AppBadgeColor.primary,
          variant: AppBadgeVariant.outline,
        ),
      );
      final decoration = _decorationOf(tester);
      expect(decoration.color, Colors.transparent);
      expect(decoration.border, isNotNull);
    });

    testWidgets('subtle variant paints a tinted background with a border', (
      tester,
    ) async {
      final theme = AppTheme.light();
      final sem = theme.extension<AppSemanticColors>()!;
      await _pump(
        tester,
        const AppBadge(
          label: 'x',
          color: AppBadgeColor.success,
          variant: AppBadgeVariant.subtle,
        ),
        theme: theme,
      );
      final decoration = _decorationOf(tester);
      expect(decoration.color, sem.successSubtle);
      expect(decoration.border, isNotNull);
    });

    testWidgets(
      'soft variant paints a translucent background without a border',
      (tester) async {
        final theme = AppTheme.light();
        final sem = theme.extension<AppSemanticColors>()!;
        await _pump(
          tester,
          const AppBadge(
            label: 'x',
            color: AppBadgeColor.warning,
            variant: AppBadgeVariant.soft,
          ),
          theme: theme,
        );
        final decoration = _decorationOf(tester);
        expect(decoration.color, sem.warningSoft);
        expect(decoration.border, isNull);
      },
    );

    testWidgets('each size resolves its own corner radius', (tester) async {
      final radii = <AppBadgeSize, double>{
        AppBadgeSize.sm: AppRadius.xs,
        AppBadgeSize.md: AppRadius.sm,
        AppBadgeSize.lg: AppRadius.sm,
      };
      for (final entry in radii.entries) {
        await _pump(tester, AppBadge(label: 'x', size: entry.key));
        expect(
          _decorationOf(tester).borderRadius,
          BorderRadius.circular(entry.value),
          reason: 'size ${entry.key.name}',
        );
      }
    });

    testWidgets('label text style derives from the theme text theme', (
      tester,
    ) async {
      await _pump(tester, const AppBadge(label: 'x'));
      final text = tester.widget<Text>(find.text('x'));
      expect(text.style, isNotNull);
      expect(text.style!.fontFamily, contains('IBM Plex Sans'));
    });

    testWidgets('needs a label, child, or icon to render', (tester) async {
      expect(AppBadge.new, throwsAssertionError);
    });
  });
}
