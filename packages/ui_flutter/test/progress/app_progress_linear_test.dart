import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_ui/app_ui.dart';

Future<void> _pump(
  WidgetTester tester,
  Widget child, {
  double width = 240,
}) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: AppTheme.light(),
      home: Scaffold(
        body: Center(
          child: SizedBox(width: width, child: child),
        ),
      ),
    ),
  );
}

void main() {
  group('AppProgressLinear', () {
    testWidgets('exposes label + rounded percentage as Semantics value', (
      tester,
    ) async {
      final handle = tester.ensureSemantics();
      await _pump(
        tester,
        const AppProgressLinear(value: 42, label: 'Loading progress'),
      );
      final node = tester.getSemantics(find.byType(AppProgressLinear));
      expect(node.label, 'Loading progress');
      expect(node.value, '42%');
      handle.dispose();
    });

    testWidgets('indeterminate exposes label with no numeric value', (
      tester,
    ) async {
      final handle = tester.ensureSemantics();
      await _pump(tester, const AppProgressLinear(label: 'Loading…'));
      final node = tester.getSemantics(find.byType(AppProgressLinear));
      expect(node.label, 'Loading…');
      expect(node.value, '');
      await tester.pump(const Duration(milliseconds: 32));
      handle.dispose();
    });

    testWidgets('clamps above-range values to 100%', (tester) async {
      await _pump(tester, const AppProgressLinear(value: 150), width: 200);
      await tester.pumpAndSettle();
      expect(tester.getSize(find.byKey(AppProgressLinear.fillKey)).width, 200);
    });

    testWidgets('clamps below-range values to 0%', (tester) async {
      await _pump(tester, const AppProgressLinear(value: -20), width: 200);
      await tester.pumpAndSettle();
      expect(tester.getSize(find.byKey(AppProgressLinear.fillKey)).width, 0);
    });

    testWidgets('fill width is proportional to value', (tester) async {
      await _pump(tester, const AppProgressLinear(value: 25), width: 200);
      await tester.pumpAndSettle();
      expect(tester.getSize(find.byKey(AppProgressLinear.fillKey)).width, 50);
    });

    testWidgets('thin drops the track height to 2px', (tester) async {
      await _pump(tester, const AppProgressLinear(value: 10, thin: true));
      expect(tester.getSize(find.byType(AppProgressLinear)).height, 2);
    });

    testWidgets('default track height is 4px', (tester) async {
      await _pump(tester, const AppProgressLinear(value: 10));
      expect(tester.getSize(find.byType(AppProgressLinear)).height, 4);
    });

    testWidgets('indeterminate stripe animates without settling', (
      tester,
    ) async {
      await _pump(tester, const AppProgressLinear(), width: 200);
      await tester.pump(const Duration(milliseconds: 200));
      final first = tester.getTopLeft(find.byKey(AppProgressLinear.fillKey)).dx;
      await tester.pump(const Duration(milliseconds: 200));
      final second = tester
          .getTopLeft(find.byKey(AppProgressLinear.fillKey))
          .dx;
      expect(first, isNot(second));
    });

    testWidgets('switching from determinate to indeterminate does not throw', (
      tester,
    ) async {
      await _pump(tester, const AppProgressLinear(value: 30));
      await _pump(tester, const AppProgressLinear());
      await tester.pump(const Duration(milliseconds: 32));
      expect(tester.takeException(), isNull);
    });

    testWidgets('switching from indeterminate to determinate does not throw', (
      tester,
    ) async {
      await _pump(tester, const AppProgressLinear());
      await tester.pump(const Duration(milliseconds: 32));
      await _pump(tester, const AppProgressLinear(value: 70));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });
  });
}
