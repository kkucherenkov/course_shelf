import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_ui/app_ui.dart';

Future<void> _pump(WidgetTester tester, Widget child) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: AppTheme.light(),
      home: Scaffold(body: Center(child: child)),
    ),
  );
}

void main() {
  group('AppSkeleton', () {
    testWidgets('defaults to full available width and a 16px height', (
      tester,
    ) async {
      await _pump(tester, const SizedBox(width: 240, child: AppSkeleton()));
      expect(tester.getSize(find.byType(AppSkeleton)), const Size(240, 16));
      await tester.pump(const Duration(milliseconds: 32));
    });

    testWidgets('accepts an explicit width and height', (tester) async {
      await _pump(tester, const AppSkeleton(width: 40, height: 40));
      expect(tester.getSize(find.byType(AppSkeleton)), const Size(40, 40));
      await tester.pump(const Duration(milliseconds: 32));
    });

    testWidgets('radius maps onto the AppRadius scale', (tester) async {
      final radii = <AppSkeletonRadius, double>{
        AppSkeletonRadius.sm: AppRadius.sm,
        AppSkeletonRadius.md: AppRadius.md,
        AppSkeletonRadius.pill: AppRadius.pill,
      };
      for (final entry in radii.entries) {
        await _pump(tester, AppSkeleton(radius: entry.key));
        final decoration =
            tester.widget<DecoratedBox>(find.byType(DecoratedBox)).decoration
                as BoxDecoration;
        expect(
          (decoration.borderRadius! as BorderRadius).topLeft.x,
          entry.value,
          reason: 'radius ${entry.key.name}',
        );
        await tester.pump(const Duration(milliseconds: 32));
      }
    });

    testWidgets('shimmer colours come from the theme semantic tokens', (
      tester,
    ) async {
      final theme = AppTheme.light();
      final sem = theme.extension<AppSemanticColors>()!;
      await tester.pumpWidget(
        MaterialApp(
          theme: theme,
          home: const Scaffold(body: Center(child: AppSkeleton())),
        ),
      );
      final decoration =
          tester.widget<DecoratedBox>(find.byType(DecoratedBox)).decoration
              as BoxDecoration;
      final gradient = decoration.gradient! as LinearGradient;
      expect(gradient.colors, <Color>[
        sem.skeletonBase,
        sem.skeletonShine,
        sem.skeletonBase,
      ]);
      await tester.pump(const Duration(milliseconds: 32));
    });

    testWidgets('is excluded from the semantics tree', (tester) async {
      final handle = tester.ensureSemantics();
      await _pump(tester, const AppSkeleton());
      expect(
        find.descendant(
          of: find.byType(AppSkeleton),
          matching: find.byType(ExcludeSemantics),
        ),
        findsOneWidget,
      );
      await tester.pump(const Duration(milliseconds: 32));
      handle.dispose();
    });

    testWidgets('shimmer animates without settling', (tester) async {
      await _pump(tester, const AppSkeleton());
      await tester.pump(const Duration(milliseconds: 200));
      final g1 =
          (tester.widget<DecoratedBox>(find.byType(DecoratedBox)).decoration
                      as BoxDecoration)
                  .gradient!
              as LinearGradient;
      await tester.pump(const Duration(milliseconds: 200));
      final g2 =
          (tester.widget<DecoratedBox>(find.byType(DecoratedBox)).decoration
                      as BoxDecoration)
                  .gradient!
              as LinearGradient;
      expect(g1.begin, isNot(g2.begin));
    });
  });
}
