import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_ui/app_ui.dart';

Future<void> _pump(WidgetTester tester, Widget scrubber) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: AppTheme.dark(),
      home: Scaffold(
        body: Align(
          alignment: Alignment.topLeft,
          child: SizedBox(width: 300, child: scrubber),
        ),
      ),
    ),
  );
}

void main() {
  group('AppPlayerScrubber', () {
    testWidgets('renders a bookmark glyph per bookmarkFraction', (
      tester,
    ) async {
      await _pump(
        tester,
        const AppPlayerScrubber(
          playedFraction: 0.3,
          bookmarkFractions: <double>[0.2, 0.6],
        ),
      );
      expect(find.byType(IconCS), findsNWidgets(2));
      for (final icon in tester.widgetList<IconCS>(find.byType(IconCS))) {
        expect(icon.name, IconName.bookmark);
        expect(icon.fill, isTrue);
      }
    });

    testWidgets('omits bookmark glyphs when bookmarkFractions is empty', (
      tester,
    ) async {
      await _pump(tester, const AppPlayerScrubber(playedFraction: 0));
      expect(find.byType(IconCS), findsNothing);
    });

    testWidgets('tapping fires onSeek with the tapped x-fraction', (
      tester,
    ) async {
      double? got;
      await _pump(
        tester,
        AppPlayerScrubber(playedFraction: 0, onSeek: (double f) => got = f),
      );
      final Rect rect = tester.getRect(find.byType(AppPlayerScrubber));
      await tester.tapAt(Offset(rect.left + rect.width * 0.5, rect.center.dy));
      expect(got, closeTo(0.5, 0.02));
    });

    testWidgets('clamps taps outside the bar to 0..1', (tester) async {
      double? got;
      await _pump(
        tester,
        AppPlayerScrubber(playedFraction: 0, onSeek: (double f) => got = f),
      );
      final Rect rect = tester.getRect(find.byType(AppPlayerScrubber));
      await tester.tapAt(Offset(rect.left + 1, rect.center.dy));
      expect(got, closeTo(0, 0.05));
    });

    testWidgets('does not throw when onSeek is null', (tester) async {
      await _pump(tester, const AppPlayerScrubber(playedFraction: 0.5));
      final Rect rect = tester.getRect(find.byType(AppPlayerScrubber));
      await tester.tapAt(rect.center);
      // No exception == pass.
    });

    testWidgets(
      'the painter carries played/buffered fractions, chapter ticks and colours',
      (tester) async {
        await _pump(
          tester,
          const AppPlayerScrubber(
            playedFraction: 0.4,
            bufferedFraction: 0.6,
            chapterFractions: <double>[0.2, 0.5],
          ),
        );
        final AppPlayerScrubberPainter painter =
            tester
                    .widget<CustomPaint>(
                      find.descendant(
                        of: find.byType(AppPlayerScrubber),
                        matching: find.byType(CustomPaint),
                      ),
                    )
                    .painter!
                as AppPlayerScrubberPainter;
        expect(painter.playedFraction, 0.4);
        expect(painter.bufferedFraction, 0.6);
        expect(painter.chapterFractions, <double>[0.2, 0.5]);
        expect(painter.playedColor, AppTheme.dark().colorScheme.primary);
      },
    );
  });
}
