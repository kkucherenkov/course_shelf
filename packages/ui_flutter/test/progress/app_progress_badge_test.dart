import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_ui/app_ui.dart';

Future<void> _pump(
  WidgetTester tester,
  Widget child, {
  ThemeData? theme,
  double width = 240,
}) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: theme ?? AppTheme.light(),
      home: Scaffold(
        body: Center(
          child: SizedBox(width: width, child: child),
        ),
      ),
    ),
  );
}

void main() {
  group('AppProgressBadge', () {
    testWidgets('every variant × state combination renders without error', (
      tester,
    ) async {
      for (final variant in AppProgressBadgeVariant.values) {
        for (final state in AppProgressBadgeState.values) {
          await _pump(
            tester,
            AppProgressBadge(
              variant: variant,
              state: state,
              completed: 4,
              total: 12,
            ),
          );
          expect(
            find.byType(AppProgressBadge),
            findsOneWidget,
            reason: '$variant / $state should render without error',
          );
        }
      }
    });

    testWidgets(
      'clamps percentage to 100 when state=completed regardless of completed/total',
      (tester) async {
        final handle = tester.ensureSemantics();
        await _pump(
          tester,
          const AppProgressBadge(
            variant: AppProgressBadgeVariant.ring,
            state: AppProgressBadgeState.completed,
            completed: 99,
            total: 100,
          ),
        );
        final node = tester.getSemantics(find.byType(AppProgressBadge));
        expect(node.label, '100%');
        handle.dispose();
      },
    );

    testWidgets(
      'returns 0% when state=not-started even with positive completed',
      (tester) async {
        final handle = tester.ensureSemantics();
        await _pump(
          tester,
          const AppProgressBadge(
            variant: AppProgressBadgeVariant.bar,
            state: AppProgressBadgeState.notStarted,
            completed: 5,
            total: 10,
          ),
        );
        final node = tester.getSemantics(find.byType(AppProgressBadge));
        expect(node.label, '0%');
        handle.dispose();
      },
    );

    testWidgets('returns 0% when state=locked', (tester) async {
      final handle = tester.ensureSemantics();
      await _pump(
        tester,
        const AppProgressBadge(
          variant: AppProgressBadgeVariant.ring,
          state: AppProgressBadgeState.locked,
          completed: 5,
          total: 10,
        ),
      );
      final node = tester.getSemantics(find.byType(AppProgressBadge));
      expect(node.label, '0%');
      handle.dispose();
    });

    testWidgets('rounds percentage in in-progress state', (tester) async {
      final handle = tester.ensureSemantics();
      await _pump(
        tester,
        const AppProgressBadge(
          variant: AppProgressBadgeVariant.bar,
          state: AppProgressBadgeState.inProgress,
          completed: 1,
          total: 3,
        ),
      );
      final node = tester.getSemantics(find.byType(AppProgressBadge));
      expect(node.label, '33%');
      handle.dispose();
    });

    testWidgets('handles total=0 without dividing by zero', (tester) async {
      final handle = tester.ensureSemantics();
      await _pump(
        tester,
        const AppProgressBadge(
          variant: AppProgressBadgeVariant.bar,
          state: AppProgressBadgeState.inProgress,
        ),
      );
      final node = tester.getSemantics(find.byType(AppProgressBadge));
      expect(node.label, '0%');
      handle.dispose();
    });

    group('ring', () {
      testWidgets('feeds AppProgressCircle the 0..100 percent value', (
        tester,
      ) async {
        await _pump(
          tester,
          const AppProgressBadge(
            variant: AppProgressBadgeVariant.ring,
            state: AppProgressBadgeState.inProgress,
            completed: 1,
            total: 4,
          ),
        );
        await tester.pumpAndSettle();
        expect(
          tester
              .widget<AppProgressCircle>(find.byType(AppProgressCircle))
              .value,
          25,
        );
      });

      testWidgets('shows a check glyph and no percentage text when completed', (
        tester,
      ) async {
        await _pump(
          tester,
          const AppProgressBadge(
            variant: AppProgressBadgeVariant.ring,
            state: AppProgressBadgeState.completed,
          ),
        );
        expect(find.byType(IconCS), findsOneWidget);
        expect(find.textContaining('%'), findsNothing);
      });

      testWidgets('shows a lock glyph and no percentage text when locked', (
        tester,
      ) async {
        await _pump(
          tester,
          const AppProgressBadge(
            variant: AppProgressBadgeVariant.ring,
            state: AppProgressBadgeState.locked,
          ),
        );
        expect(find.byType(IconCS), findsOneWidget);
        expect(find.textContaining('%'), findsNothing);
      });

      testWidgets('shows the rounded percentage text otherwise', (
        tester,
      ) async {
        await _pump(
          tester,
          const AppProgressBadge(
            variant: AppProgressBadgeVariant.ring,
            state: AppProgressBadgeState.inProgress,
            completed: 1,
            total: 2,
          ),
        );
        expect(find.text('50%'), findsOneWidget);
        expect(find.byType(IconCS), findsNothing);
      });

      testWidgets('the inner disc paints primary for completed', (
        tester,
      ) async {
        final theme = AppTheme.light();
        await _pump(
          tester,
          const AppProgressBadge(
            variant: AppProgressBadgeVariant.ring,
            state: AppProgressBadgeState.completed,
          ),
          theme: theme,
        );
        final decorated = tester.widget<DecoratedBox>(
          find.descendant(
            of: find.byType(AppProgressBadge),
            matching: find.byType(DecoratedBox),
          ),
        );
        final decoration = decorated.decoration as BoxDecoration;
        expect(decoration.shape, BoxShape.circle);
        expect(decoration.color, theme.colorScheme.primary);
      });
    });

    group('bar', () {
      testWidgets('fill width is proportional to percent', (tester) async {
        await _pump(
          tester,
          const AppProgressBadge(
            variant: AppProgressBadgeVariant.bar,
            state: AppProgressBadgeState.inProgress,
            completed: 1,
            total: 4,
          ),
          width: 300,
        );
        await tester.pumpAndSettle();
        // Track width = badge width minus the gap + percentage column.
        final trackWidth = tester.getSize(find.byType(AppProgressLinear)).width;
        expect(
          tester.getSize(find.byKey(AppProgressLinear.fillKey)).width,
          closeTo(trackWidth * 0.25, 0.5),
        );
      });

      testWidgets('fill colour is primary outside the completed state', (
        tester,
      ) async {
        final theme = AppTheme.light();
        await _pump(
          tester,
          const AppProgressBadge(
            variant: AppProgressBadgeVariant.bar,
            state: AppProgressBadgeState.inProgress,
            completed: 1,
            total: 2,
          ),
          theme: theme,
        );
        await tester.pumpAndSettle();
        expect(
          tester
              .widget<AnimatedContainer>(find.byKey(AppProgressLinear.fillKey))
              .decoration,
          BoxDecoration(color: theme.colorScheme.primary),
        );
      });

      testWidgets('fill colour switches to the success token when completed', (
        tester,
      ) async {
        final theme = AppTheme.light();
        final sem = theme.extension<AppSemanticColors>()!;
        await _pump(
          tester,
          const AppProgressBadge(
            variant: AppProgressBadgeVariant.bar,
            state: AppProgressBadgeState.completed,
          ),
          theme: theme,
        );
        await tester.pumpAndSettle();
        expect(
          tester
              .widget<AnimatedContainer>(find.byKey(AppProgressLinear.fillKey))
              .decoration,
          BoxDecoration(color: sem.successFg),
        );
      });

      testWidgets('renders the percentage as trailing text', (tester) async {
        await _pump(
          tester,
          const AppProgressBadge(
            variant: AppProgressBadgeVariant.bar,
            state: AppProgressBadgeState.inProgress,
            completed: 1,
            total: 4,
          ),
        );
        expect(find.text('25%'), findsOneWidget);
      });
    });

    group('pill', () {
      testWidgets('renders "<completed> of <total>" for in-progress', (
        tester,
      ) async {
        await _pump(
          tester,
          const AppProgressBadge(
            variant: AppProgressBadgeVariant.pill,
            state: AppProgressBadgeState.inProgress,
            completed: 4,
            total: 12,
          ),
        );
        expect(find.text('4 of 12'), findsOneWidget);
      });

      testWidgets('renders Done with a check icon for completed', (
        tester,
      ) async {
        await _pump(
          tester,
          const AppProgressBadge(
            variant: AppProgressBadgeVariant.pill,
            state: AppProgressBadgeState.completed,
          ),
        );
        expect(find.text('Done'), findsOneWidget);
        expect(find.byType(IconCS), findsOneWidget);
      });

      testWidgets('renders Locked with a lock icon for locked', (tester) async {
        await _pump(
          tester,
          const AppProgressBadge(
            variant: AppProgressBadgeVariant.pill,
            state: AppProgressBadgeState.locked,
          ),
        );
        expect(find.text('Locked'), findsOneWidget);
        expect(find.byType(IconCS), findsOneWidget);
      });

      testWidgets('renders an em dash for not-started', (tester) async {
        await _pump(
          tester,
          const AppProgressBadge(
            variant: AppProgressBadgeVariant.pill,
            state: AppProgressBadgeState.notStarted,
            completed: 5,
            total: 10,
          ),
        );
        expect(find.text('—'), findsOneWidget);
        expect(find.byType(IconCS), findsNothing);
      });

      testWidgets('completed pill paints the success-soft background', (
        tester,
      ) async {
        final theme = AppTheme.light();
        final sem = theme.extension<AppSemanticColors>()!;
        await _pump(
          tester,
          const AppProgressBadge(
            variant: AppProgressBadgeVariant.pill,
            state: AppProgressBadgeState.completed,
          ),
          theme: theme,
        );
        final decorated = tester.widget<DecoratedBox>(
          find.descendant(
            of: find.byType(AppProgressBadge),
            matching: find.byType(DecoratedBox),
          ),
        );
        expect((decorated.decoration as BoxDecoration).color, sem.successSoft);
      });

      testWidgets('not-started pill paints a transparent background', (
        tester,
      ) async {
        await _pump(
          tester,
          const AppProgressBadge(
            variant: AppProgressBadgeVariant.pill,
            state: AppProgressBadgeState.notStarted,
          ),
        );
        final decorated = tester.widget<DecoratedBox>(
          find.descendant(
            of: find.byType(AppProgressBadge),
            matching: find.byType(DecoratedBox),
          ),
        );
        expect(
          (decorated.decoration as BoxDecoration).color,
          Colors.transparent,
        );
      });

      testWidgets('text style derives from the theme text theme', (
        tester,
      ) async {
        await _pump(
          tester,
          const AppProgressBadge(
            variant: AppProgressBadgeVariant.pill,
            state: AppProgressBadgeState.notStarted,
          ),
        );
        final text = tester.widget<Text>(find.text('—'));
        expect(text.style, isNotNull);
        expect(text.style!.fontFamily, contains('IBM Plex Sans'));
      });
    });
  });
}
