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

/// Moves a synthetic mouse pointer over [finder] and settles the hover state.
Future<void> _hover(WidgetTester tester, Finder finder) async {
  final gesture = await tester.createGesture(kind: PointerDeviceKind.mouse);
  addTearDown(gesture.removePointer);
  await gesture.addPointer(location: Offset.zero);
  await tester.pump();
  await gesture.moveTo(tester.getCenter(finder));
  await tester.pump();
}

void main() {
  group('AppCard', () {
    testWidgets('renders body slot content', (tester) async {
      await _pump(tester, const AppCard(child: Text('Body copy')));
      expect(find.text('Body copy'), findsOneWidget);
    });

    testWidgets('renders title and description when provided', (tester) async {
      await _pump(
        tester,
        const AppCard(
          title: 'System health',
          description: 'All services operational',
          child: Text('x'),
        ),
      );
      expect(find.text('System health'), findsOneWidget);
      expect(find.text('All services operational'), findsOneWidget);
    });

    testWidgets('omits the header when no title/description/header given', (
      tester,
    ) async {
      await _pump(tester, const AppCard(child: Text('x')));
      expect(find.byKey(const ValueKey<String>('appCardHeader')), findsNothing);
    });

    testWidgets('renders the footer slot when provided', (tester) async {
      await _pump(
        tester,
        const AppCard(footer: Text('Footer text'), child: Text('x')),
      );
      expect(find.text('Footer text'), findsOneWidget);
    });

    testWidgets('renders a custom header slot, overriding title/description', (
      tester,
    ) async {
      await _pump(
        tester,
        const AppCard(
          title: 'Ignored',
          header: Text('Custom header'),
          child: Text('x'),
        ),
      );
      expect(find.text('Custom header'), findsOneWidget);
      expect(find.text('Ignored'), findsNothing);
    });

    testWidgets('size md pads the body with AppSpacing.s4', (tester) async {
      await _pump(tester, const AppCard(child: Text('x')));
      final padding = tester.widget<Padding>(
        find.ancestor(of: find.text('x'), matching: find.byType(Padding)),
      );
      expect(padding.padding, const EdgeInsets.all(AppSpacing.s4));
    });

    testWidgets('size lg pads the body with AppSpacing.s5', (tester) async {
      await _pump(
        tester,
        const AppCard(size: AppCardSize.lg, child: Text('x')),
      );
      final padding = tester.widget<Padding>(
        find.ancestor(of: find.text('x'), matching: find.byType(Padding)),
      );
      expect(padding.padding, const EdgeInsets.all(AppSpacing.s5));
    });

    testWidgets('hoverable lifts border + background on hover', (tester) async {
      await _pump(tester, const AppCard(hoverable: true, child: Text('x')));
      final theme = AppTheme.light();
      final decorationBefore =
          tester
                  .widget<DecoratedBox>(find.byType(DecoratedBox).first)
                  .decoration
              as BoxDecoration;
      expect(decorationBefore.color, theme.colorScheme.surface);

      await _hover(tester, find.byType(AppCard));

      final decorationAfter =
          tester
                  .widget<DecoratedBox>(find.byType(DecoratedBox).first)
                  .decoration
              as BoxDecoration;
      expect(
        decorationAfter.color,
        theme.extension<AppSemanticColors>()!.raised,
      );
    });

    testWidgets('hoverable is ignored when interactive is also true', (
      tester,
    ) async {
      await _pump(
        tester,
        AppCard(
          hoverable: true,
          interactive: true,
          onTap: () {},
          child: const Text('x'),
        ),
      );
      final theme = AppTheme.light();
      await _hover(tester, find.byType(AppCard));
      final decoration =
          tester
                  .widget<DecoratedBox>(find.byType(DecoratedBox).first)
                  .decoration
              as BoxDecoration;
      expect(decoration.color, theme.colorScheme.surface);
    });

    testWidgets('interactive fires onTap on tap', (tester) async {
      var taps = 0;
      await _pump(
        tester,
        AppCard(interactive: true, onTap: () => taps++, child: const Text('x')),
      );
      await tester.tap(find.byType(AppCard));
      expect(taps, 1);
    });

    testWidgets('non-interactive does not fire onTap on tap', (tester) async {
      var taps = 0;
      await _pump(tester, AppCard(onTap: () => taps++, child: const Text('x')));
      await tester.tap(find.byType(AppCard), warnIfMissed: false);
      expect(taps, 0);
      expect(find.byType(InkWell), findsNothing);
    });

    testWidgets('interactive elevates with a shadow on hover', (tester) async {
      await _pump(
        tester,
        AppCard(interactive: true, onTap: () {}, child: const Text('x')),
      );
      final before =
          tester
                  .widget<DecoratedBox>(find.byType(DecoratedBox).first)
                  .decoration
              as BoxDecoration;
      expect(before.boxShadow, isNull);

      await _hover(tester, find.byType(AppCard));

      final after =
          tester
                  .widget<DecoratedBox>(find.byType(DecoratedBox).first)
                  .decoration
              as BoxDecoration;
      expect(after.boxShadow, isNotNull);
    });
  });
}
