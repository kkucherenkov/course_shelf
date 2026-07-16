import 'dart:ui' show Tristate;

import 'package:flutter/gestures.dart';
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

Future<void> _hover(WidgetTester tester, Finder finder) async {
  final gesture = await tester.createGesture(kind: PointerDeviceKind.mouse);
  addTearDown(gesture.removePointer);
  await gesture.addPointer(location: Offset.zero);
  await tester.pump();
  await gesture.moveTo(tester.getCenter(finder));
  await tester.pump();
}

void main() {
  group('AppRow', () {
    testWidgets('renders body slot content', (tester) async {
      await _pump(tester, const AppRow(body: Text('Body text')));
      expect(find.text('Body text'), findsOneWidget);
    });

    testWidgets('renders leading slot when provided', (tester) async {
      await _pump(
        tester,
        const AppRow(leading: Icon(Icons.person), body: Text('Body')),
      );
      expect(find.byIcon(Icons.person), findsOneWidget);
    });

    testWidgets('omits leading wrapper when leading is not provided', (
      tester,
    ) async {
      await _pump(tester, const AppRow(body: Text('Body')));
      expect(find.byKey(const ValueKey<String>('appRowLeading')), findsNothing);
    });

    testWidgets('renders trailing slot when provided', (tester) async {
      await _pump(
        tester,
        const AppRow(body: Text('Body'), trailing: Text('12:00')),
      );
      expect(find.text('12:00'), findsOneWidget);
    });

    testWidgets('omits trailing wrapper when trailing is not provided', (
      tester,
    ) async {
      await _pump(tester, const AppRow(body: Text('Body')));
      expect(
        find.byKey(const ValueKey<String>('appRowTrailing')),
        findsNothing,
      );
    });

    testWidgets('does not set selected semantics by default', (tester) async {
      await _pump(tester, const AppRow(body: Text('x')));
      final semantics = tester.getSemantics(find.byType(AppRow));
      expect(semantics.flagsCollection.isSelected, isNot(Tristate.isTrue));
    });

    testWidgets(
      'sets selected semantics + accent-soft background when selected',
      (tester) async {
        await _pump(tester, const AppRow(selected: true, body: Text('x')));
        final semantics = tester.getSemantics(find.byType(AppRow));
        expect(semantics.flagsCollection.isSelected, Tristate.isTrue);

        final theme = AppTheme.light();
        final decoration =
            tester.widget<Container>(find.byType(Container).first).decoration
                as BoxDecoration;
        expect(
          decoration.color,
          theme.extension<AppSemanticColors>()!.accentSoft,
        );
      },
    );

    testWidgets('applies compact vertical padding when compact=true', (
      tester,
    ) async {
      await _pump(tester, const AppRow(compact: true, body: Text('x')));
      final container = tester.widget<Container>(find.byType(Container).first);
      expect(
        container.padding,
        const EdgeInsets.symmetric(
          horizontal: AppSpacing.s3,
          vertical: AppSpacing.s2,
        ),
      );
    });

    testWidgets('default (non-compact) padding is AppSpacing.s3 both axes', (
      tester,
    ) async {
      await _pump(tester, const AppRow(body: Text('x')));
      final container = tester.widget<Container>(find.byType(Container).first);
      expect(
        container.padding,
        const EdgeInsets.symmetric(
          horizontal: AppSpacing.s3,
          vertical: AppSpacing.s3,
        ),
      );
    });

    testWidgets('interactive fires onTap on tap', (tester) async {
      var taps = 0;
      await _pump(
        tester,
        AppRow(interactive: true, onTap: () => taps++, body: const Text('x')),
      );
      await tester.tap(find.byType(AppRow));
      expect(taps, 1);
    });

    testWidgets('non-interactive does not render an InkWell / fire onTap', (
      tester,
    ) async {
      var taps = 0;
      await _pump(tester, AppRow(onTap: () => taps++, body: const Text('x')));
      expect(find.byType(InkWell), findsNothing);
      await tester.tap(find.byType(AppRow), warnIfMissed: false);
      expect(taps, 0);
    });

    testWidgets('interactive hover applies raised background', (tester) async {
      await _pump(
        tester,
        AppRow(interactive: true, onTap: () {}, body: const Text('x')),
      );
      await _hover(tester, find.byType(AppRow));

      final theme = AppTheme.light();
      final decoration =
          tester.widget<Container>(find.byType(Container).first).decoration
              as BoxDecoration;
      expect(decoration.color, theme.extension<AppSemanticColors>()!.raised);
    });
  });
}
