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
  group('AppSpinner', () {
    testWidgets('sizes match the locally-owned scale', (tester) async {
      final dimensions = <AppSpinnerSize, double>{
        AppSpinnerSize.sm: 12,
        AppSpinnerSize.md: 16,
        AppSpinnerSize.lg: 24,
      };
      for (final entry in dimensions.entries) {
        await _pump(tester, AppSpinner(size: entry.key));
        expect(
          tester.getSize(find.byType(AppSpinner)),
          Size(entry.value, entry.value),
          reason: 'size ${entry.key.name}',
        );
        await tester.pump(const Duration(milliseconds: 32));
      }
    });

    testWidgets('defaults to a "Loading" Semantics label', (tester) async {
      final handle = tester.ensureSemantics();
      await _pump(tester, const AppSpinner());
      expect(find.bySemanticsLabel('Loading'), findsOneWidget);
      await tester.pump(const Duration(milliseconds: 32));
      handle.dispose();
    });

    testWidgets('semanticLabel overrides the default', (tester) async {
      final handle = tester.ensureSemantics();
      await _pump(tester, const AppSpinner(semanticLabel: 'Saving'));
      expect(find.bySemanticsLabel('Saving'), findsOneWidget);
      await tester.pump(const Duration(milliseconds: 32));
      handle.dispose();
    });

    testWidgets('paints with an explicit color override', (tester) async {
      await _pump(tester, const AppSpinner(color: Colors.red));
      final painter =
          tester
                  .widget<CustomPaint>(
                    find.descendant(
                      of: find.byType(AppSpinner),
                      matching: find.byType(CustomPaint),
                    ),
                  )
                  .painter!
              as AppSpinnerPainter;
      expect(painter.color, Colors.red);
      await tester.pump(const Duration(milliseconds: 32));
    });

    testWidgets('inherits the ambient DefaultTextStyle colour by default', (
      tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light(),
          home: const Scaffold(
            body: Center(
              child: DefaultTextStyle(
                style: TextStyle(color: Colors.green),
                child: AppSpinner(),
              ),
            ),
          ),
        ),
      );
      final painter =
          tester
                  .widget<CustomPaint>(
                    find.descendant(
                      of: find.byType(AppSpinner),
                      matching: find.byType(CustomPaint),
                    ),
                  )
                  .painter!
              as AppSpinnerPainter;
      expect(painter.color, Colors.green);
      await tester.pump(const Duration(milliseconds: 32));
    });

    testWidgets('rotates continuously across frames', (tester) async {
      await _pump(tester, const AppSpinner());
      final rotationFinder = find.descendant(
        of: find.byType(AppSpinner),
        matching: find.byType(RotationTransition),
      );
      await tester.pump(const Duration(milliseconds: 100));
      final t1 = tester.widget<RotationTransition>(rotationFinder).turns.value;
      await tester.pump(const Duration(milliseconds: 100));
      final t2 = tester.widget<RotationTransition>(rotationFinder).turns.value;
      expect(t1, isNot(t2));
    });
  });
}
