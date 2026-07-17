import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_ui/app_ui.dart';

Future<void> _pump(
  WidgetTester tester, {
  int idx = 2,
  String title = 'Type narrowing',
  int count = 5,
  Duration duration = const Duration(seconds: 4500),
  bool open = true,
  VoidCallback? onToggle,
}) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: AppTheme.light(),
      home: Scaffold(
        body: SizedBox(
          width: 360,
          child: AppSectionHeader(
            idx: idx,
            title: title,
            count: count,
            duration: duration,
            open: open,
            onToggle: onToggle,
          ),
        ),
      ),
    ),
  );
}

String _titleOf(WidgetTester tester) =>
    tester.widget<Text>(find.byKey(AppSectionHeader.titleKey)).data!;

String _metaOf(WidgetTester tester) =>
    tester.widget<Text>(find.byKey(AppSectionHeader.metaKey)).data!;

double _chevronTurns(WidgetTester tester) => tester
    .widget<AnimatedRotation>(find.byKey(AppSectionHeader.chevronKey))
    .turns;

void main() {
  group('AppSectionHeader', () {
    testWidgets('renders the zero-padded section title', (tester) async {
      await _pump(tester, idx: 2, title: 'Type narrowing');
      expect(_titleOf(tester), 'Section 02 · Type narrowing');
    });

    testWidgets('does not pad section indices of 10 or more', (tester) async {
      await _pump(tester, idx: 12, title: 'Late section');
      expect(_titleOf(tester), 'Section 12 · Late section');
    });

    testWidgets('ellipsizes a long title on a single line', (tester) async {
      await _pump(tester, title: 'A very long section title that must clip');
      final Text title = tester.widget<Text>(
        find.byKey(AppSectionHeader.titleKey),
      );
      expect(title.maxLines, 1);
      expect(title.overflow, TextOverflow.ellipsis);
    });

    testWidgets('renders lessons count and duration in the meta', (
      tester,
    ) async {
      await _pump(tester, count: 5, duration: const Duration(seconds: 4500));
      expect(_metaOf(tester), '5 lessons · 1h 15m');
    });

    testWidgets('uses the singular lesson label when count is 1', (
      tester,
    ) async {
      await _pump(tester, count: 1);
      expect(_metaOf(tester), '1 lesson · 1h 15m');
    });

    testWidgets('uses the plural lesson label when count is 0', (tester) async {
      await _pump(tester, count: 0);
      expect(_metaOf(tester), '0 lessons · 1h 15m');
    });

    testWidgets('renders the meta mono with tabular figures', (tester) async {
      await _pump(tester);
      final TextStyle style = tester
          .widget<Text>(find.byKey(AppSectionHeader.metaKey))
          .style!;
      expect(style.fontFamily, AppTypography.code.fontFamily);
      expect(style.fontSize, AppFontSize.xs);
      expect(
        style.fontFeatures,
        const <FontFeature>[FontFeature.tabularFigures()],
      );
    });

    group('duration formatting', () {
      const Map<int, String> cases = <int, String>{
        3661: '1h 1m',
        3600: '1h',
        4500: '1h 15m',
        7200: '2h',
        540: '9m',
        125: '2m',
        59: '0m',
        0: '0m',
        -1: '0m',
        -3600: '0m',
      };

      cases.forEach((int seconds, String expected) {
        testWidgets('formats ${seconds}s as "$expected"', (tester) async {
          await _pump(tester, count: 2, duration: Duration(seconds: seconds));
          expect(_metaOf(tester), '2 lessons · $expected');
        });
      });
    });

    group('open state', () {
      testWidgets('leaves the chevron unrotated when open', (tester) async {
        await _pump(tester, open: true);
        expect(_chevronTurns(tester), 0);
      });

      testWidgets('rotates the chevron -90 degrees when closed', (
        tester,
      ) async {
        await _pump(tester, open: false);
        expect(_chevronTurns(tester), -0.25);
      });

      testWidgets('animates the chevron over --dur-fast', (tester) async {
        await _pump(tester, open: false);
        expect(
          tester
              .widget<AnimatedRotation>(find.byKey(AppSectionHeader.chevronKey))
              .duration,
          AppDuration.fast,
        );
      });

      testWidgets('exposes expanded state mirroring the open prop', (
        tester,
      ) async {
        final SemanticsHandle handle = tester.ensureSemantics();

        // One merged button node announcing both lines — the Flutter
        // equivalent of the web's role="button" + aria-expanded on a single
        // element wrapping the title and meta text.
        const String label = 'Section 02 · Type narrowing\n5 lessons · 1h 15m';

        await _pump(tester, open: true, onToggle: () {});
        expect(
          tester.getSemantics(find.byType(AppSectionHeader)),
          matchesSemantics(
            isButton: true,
            hasExpandedState: true,
            isExpanded: true,
            hasTapAction: true,
            hasFocusAction: true,
            isFocusable: true,
            label: label,
          ),
        );

        await _pump(tester, open: false, onToggle: () {});
        expect(
          tester.getSemantics(find.byType(AppSectionHeader)),
          matchesSemantics(
            isButton: true,
            hasExpandedState: true,
            isExpanded: false,
            hasTapAction: true,
            hasFocusAction: true,
            isFocusable: true,
            label: label,
          ),
        );

        handle.dispose();
      });
    });

    group('toggle', () {
      testWidgets('fires onToggle when the row is tapped', (tester) async {
        int toggles = 0;
        await _pump(tester, onToggle: () => toggles++);

        await tester.tap(find.byType(AppSectionHeader));
        await tester.pump();

        expect(toggles, 1);
      });

      testWidgets('fires onToggle on Enter and Space when focused', (
        tester,
      ) async {
        int toggles = 0;
        await _pump(tester, onToggle: () => toggles++);

        await tester.tap(find.byType(AppSectionHeader));
        await tester.pump();
        toggles = 0;

        Focus.of(
          tester.element(find.byKey(AppSectionHeader.titleKey)),
        ).requestFocus();
        await tester.pump();

        await tester.sendKeyEvent(LogicalKeyboardKey.enter);
        await tester.pump();
        await tester.sendKeyEvent(LogicalKeyboardKey.space);
        await tester.pump();

        expect(toggles, 2);
      });

      testWidgets('stays inert when no onToggle is supplied', (tester) async {
        await _pump(tester);
        await tester.tap(find.byType(AppSectionHeader));
        await tester.pump();
        // No exception — the tap is simply a no-op.
        expect(tester.takeException(), isNull);
      });
    });
  });
}
