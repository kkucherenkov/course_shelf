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
  group('AppProgressCircle', () {
    testWidgets(
      'determinate resolves value, colour and strokeWidth from tokens',
      (tester) async {
        final theme = AppTheme.light();
        await _pump(tester, const AppProgressCircle(value: 50), theme: theme);
        await tester.pumpAndSettle();
        final indicator = tester.widget<CircularProgressIndicator>(
          find.byType(CircularProgressIndicator),
        );
        expect(indicator.value, closeTo(0.5, 0.001));
        expect(indicator.color, theme.colorScheme.primary);
        expect(
          indicator.backgroundColor,
          theme.colorScheme.surfaceContainerHighest,
        );
        expect(indicator.strokeWidth, 3);
        expect(indicator.strokeCap, StrokeCap.round);
      },
    );

    testWidgets('clamps out-of-range values', (tester) async {
      await _pump(tester, const AppProgressCircle(value: 150));
      await tester.pumpAndSettle();
      expect(
        tester
            .widget<CircularProgressIndicator>(
              find.byType(CircularProgressIndicator),
            )
            .value,
        closeTo(1.0, 0.001),
      );
    });

    testWidgets('negative values clamp to 0', (tester) async {
      await _pump(tester, const AppProgressCircle(value: -30));
      await tester.pumpAndSettle();
      expect(
        tester
            .widget<CircularProgressIndicator>(
              find.byType(CircularProgressIndicator),
            )
            .value,
        closeTo(0.0, 0.001),
      );
    });

    testWidgets('indeterminate has a null value and keeps animating', (
      tester,
    ) async {
      await _pump(tester, const AppProgressCircle());
      final indicator = tester.widget<CircularProgressIndicator>(
        find.byType(CircularProgressIndicator),
      );
      expect(indicator.value, isNull);
      await tester.pump(const Duration(milliseconds: 200));
      expect(tester.takeException(), isNull);
    });

    testWidgets('is sized to size', (tester) async {
      await _pump(tester, const AppProgressCircle(value: 10, size: 56));
      expect(
        tester.getSize(find.byType(AppProgressCircle)),
        const Size(56, 56),
      );
    });

    testWidgets('honours a custom stroke width', (tester) async {
      await _pump(tester, const AppProgressCircle(value: 10, stroke: 6));
      await tester.pumpAndSettle();
      expect(
        tester
            .widget<CircularProgressIndicator>(
              find.byType(CircularProgressIndicator),
            )
            .strokeWidth,
        6,
      );
    });

    testWidgets('exposes label + percentage as Semantics value', (
      tester,
    ) async {
      final handle = tester.ensureSemantics();
      await _pump(
        tester,
        const AppProgressCircle(value: 65, label: 'Course completion'),
      );
      await tester.pumpAndSettle();
      final node = tester.getSemantics(find.byType(AppProgressCircle));
      expect(node.label, 'Course completion');
      expect(node.value, '65%');
      handle.dispose();
    });
  });
}
