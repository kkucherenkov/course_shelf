import 'package:flutter/gestures.dart'
    show kDoubleTapMinTime, kDoubleTapTimeout;
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_ui/app_ui.dart';

Future<void> _pump(
  WidgetTester tester,
  AppPlayerChrome chrome, {
  ThemeData? theme,
}) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: theme ?? AppTheme.dark(),
      home: Scaffold(
        body: Center(
          child: SizedBox(width: 700, height: 700 * 9 / 19, child: chrome),
        ),
      ),
    ),
  );
}

// The key lives on the AppIconButton itself; the glyph is a descendant.
IconCS _iconAt(WidgetTester tester, Key key) => tester.widget<IconCS>(
  find.descendant(of: find.byKey(key), matching: find.byType(IconCS)),
);

/// Elapses past `GestureDetector`'s onTap/onDoubleTap disambiguation window
/// (a bare `Timer`, not a scheduled frame — `pumpAndSettle` won't wait for
/// it) and flushes the resulting rebuild.
Future<void> _settleDoubleTapWindow(WidgetTester tester) =>
    tester.pump(kDoubleTapTimeout);

AppPlayerChrome _chrome({
  AppPlayerChromeState state = AppPlayerChromeState.playing,
  Duration position = Duration.zero,
  Duration duration = const Duration(minutes: 1),
  double bufferedFraction = 0,
  List<double> chapterFractions = const <double>[],
  List<double> bookmarkFractions = const <double>[],
  bool initiallyMinimal = false,
  String? upNextTitle,
  VoidCallback? onPlayPause,
  ValueChanged<double>? onSeek,
  ValueChanged<int>? onSkip,
  VoidCallback? onDismissToPortrait,
  VoidCallback? onNext,
  VoidCallback? onPrevious,
  VoidCallback? onVolumeTap,
  VoidCallback? onSpeedTap,
  VoidCallback? onSubtitlesTap,
  VoidCallback? onSettingsTap,
  VoidCallback? onToggleFullscreen,
  VoidCallback? onRetry,
  VoidCallback? onStay,
  VoidCallback? onPlayNext,
}) {
  return AppPlayerChrome(
    state: state,
    sectionLabel: 'SECTION 04 · CONSENSUS',
    lessonTitle: 'Lesson 12 · Quorum reads',
    position: position,
    duration: duration,
    bufferedFraction: bufferedFraction,
    chapterFractions: chapterFractions,
    bookmarkFractions: bookmarkFractions,
    initiallyMinimal: initiallyMinimal,
    upNextTitle: upNextTitle,
    onPlayPause: onPlayPause,
    onSeek: onSeek,
    onSkip: onSkip,
    onDismissToPortrait: onDismissToPortrait,
    onNext: onNext,
    onPrevious: onPrevious,
    onVolumeTap: onVolumeTap,
    onSpeedTap: onSpeedTap,
    onSubtitlesTap: onSubtitlesTap,
    onSettingsTap: onSettingsTap,
    onToggleFullscreen: onToggleFullscreen,
    onRetry: onRetry,
    onStay: onStay,
    onPlayNext: onPlayNext,
  );
}

void main() {
  group('AppPlayerChrome', () {
    testWidgets('playing state renders top bar, scrubber and control row', (
      tester,
    ) async {
      await _pump(
        tester,
        _chrome(
          position: const Duration(minutes: 7, seconds: 43),
          duration: const Duration(minutes: 18, seconds: 24),
        ),
      );
      expect(find.text('SECTION 04 · CONSENSUS'), findsOneWidget);
      expect(find.text('Lesson 12 · Quorum reads'), findsOneWidget);
      expect(find.byKey(AppPlayerChrome.scrubberKey), findsOneWidget);
      expect(find.byKey(AppPlayerChrome.playPauseKey), findsOneWidget);
      expect(
        tester.widget<Text>(find.byKey(AppPlayerChrome.timeKey)).data,
        '7:43 / 18:24',
      );
    });

    testWidgets(
      'shows the pause glyph while playing, play glyph while paused',
      (tester) async {
        await _pump(tester, _chrome(state: AppPlayerChromeState.playing));
        expect(
          _iconAt(tester, AppPlayerChrome.playPauseKey).name,
          IconName.pause,
        );

        await _pump(tester, _chrome(state: AppPlayerChromeState.paused));
        expect(
          _iconAt(tester, AppPlayerChrome.playPauseKey).name,
          IconName.play,
        );
      },
    );

    testWidgets('play/pause button fires onPlayPause', (tester) async {
      var taps = 0;
      await _pump(tester, _chrome(onPlayPause: () => taps++));
      await tester.tap(find.byKey(AppPlayerChrome.playPauseKey));
      expect(taps, 1);
    });

    testWidgets('previous/next/volume/speed/subtitles/settings/fullscreen '
        'buttons fire their callbacks', (tester) async {
      var prev = 0, next = 0, volume = 0, speed = 0;
      var subtitles = 0, settings = 0, fullscreen = 0;
      await _pump(
        tester,
        _chrome(
          onPrevious: () => prev++,
          onNext: () => next++,
          onVolumeTap: () => volume++,
          onSpeedTap: () => speed++,
          onSubtitlesTap: () => subtitles++,
          onSettingsTap: () => settings++,
          onToggleFullscreen: () => fullscreen++,
        ),
      );
      await tester.tap(find.byKey(AppPlayerChrome.previousKey));
      await tester.tap(find.byKey(AppPlayerChrome.nextKey));
      await tester.tap(find.byKey(AppPlayerChrome.volumeKey));
      await tester.tap(find.byKey(AppPlayerChrome.speedKey));
      await tester.tap(find.byKey(AppPlayerChrome.subtitlesKey));
      await tester.tap(find.byKey(AppPlayerChrome.settingsKey));
      await tester.tap(find.byKey(AppPlayerChrome.fullscreenKey));
      expect(prev, 1);
      expect(next, 1);
      expect(volume, 1);
      expect(speed, 1);
      expect(subtitles, 1);
      expect(settings, 1);
      expect(fullscreen, 1);
    });

    testWidgets('scrubber tap fires onSeek with the tapped fraction', (
      tester,
    ) async {
      double? seekFraction;
      await _pump(tester, _chrome(onSeek: (double f) => seekFraction = f));
      final Rect scrubber = tester.getRect(
        find.byKey(AppPlayerChrome.scrubberKey),
      );
      await tester.tapAt(
        Offset(scrubber.left + scrubber.width * 0.25, scrubber.center.dy),
      );
      expect(seekFraction, closeTo(0.25, 0.03));
    });

    testWidgets(
      'double-tap on the right half fires onSkip(10) and shows the right edge hint',
      (tester) async {
        final List<int> skips = <int>[];
        await _pump(tester, _chrome(onSkip: skips.add));
        final Rect area = tester.getRect(
          find.byKey(AppPlayerChrome.videoAreaKey),
        );
        final Offset rightPoint = Offset(area.right - 12, area.center.dy);
        await tester.tapAt(rightPoint);
        await tester.pump(kDoubleTapMinTime);
        await tester.tapAt(rightPoint);
        await _settleDoubleTapWindow(tester);
        expect(skips, <int>[10]);
        expect(find.byKey(AppPlayerChrome.rightHintKey), findsOneWidget);
        expect(find.byKey(AppPlayerChrome.leftHintKey), findsNothing);
      },
    );

    testWidgets('double-tap on the left half fires onSkip(-10)', (
      tester,
    ) async {
      final List<int> skips = <int>[];
      await _pump(tester, _chrome(onSkip: skips.add));
      final Rect area = tester.getRect(
        find.byKey(AppPlayerChrome.videoAreaKey),
      );
      final Offset leftPoint = Offset(area.left + 12, area.center.dy);
      await tester.tapAt(leftPoint);
      await tester.pump(kDoubleTapMinTime);
      await tester.tapAt(leftPoint);
      await _settleDoubleTapWindow(tester);
      expect(skips, <int>[-10]);
      expect(find.byKey(AppPlayerChrome.leftHintKey), findsOneWidget);
    });

    testWidgets('a single tap toggles minimal mode', (tester) async {
      await _pump(tester, _chrome());
      expect(find.byKey(AppPlayerChrome.playPauseKey), findsOneWidget);
      expect(find.byKey(AppPlayerChrome.minimalScrubberKey), findsNothing);

      final Rect area = tester.getRect(
        find.byKey(AppPlayerChrome.videoAreaKey),
      );
      await tester.tapAt(area.center);
      await _settleDoubleTapWindow(tester);

      expect(find.byKey(AppPlayerChrome.minimalScrubberKey), findsOneWidget);
    });

    testWidgets('initiallyMinimal starts in minimal mode', (tester) async {
      await _pump(tester, _chrome(initiallyMinimal: true));
      expect(find.byKey(AppPlayerChrome.minimalScrubberKey), findsOneWidget);
    });

    testWidgets('pinch-in fires onDismissToPortrait', (tester) async {
      var dismissed = false;
      await _pump(tester, _chrome(onDismissToPortrait: () => dismissed = true));
      final Offset center = tester
          .getRect(find.byKey(AppPlayerChrome.videoAreaKey))
          .center;

      final TestGesture g1 = await tester.startGesture(
        center.translate(-40, 0),
      );
      final TestGesture g2 = await tester.startGesture(center.translate(40, 0));
      await tester.pump(const Duration(milliseconds: 20));
      await g1.moveTo(center.translate(-5, 0));
      await g2.moveTo(center.translate(5, 0));
      await tester.pump(const Duration(milliseconds: 20));
      await g1.up();
      await g2.up();
      await tester.pump();

      expect(dismissed, isTrue);
    });

    testWidgets('buffering shows a spinner alongside the normal controls', (
      tester,
    ) async {
      await _pump(tester, _chrome(state: AppPlayerChromeState.buffering));
      expect(find.byKey(AppPlayerChrome.bufferingSpinnerKey), findsOneWidget);
      expect(find.byKey(AppPlayerChrome.playPauseKey), findsOneWidget);
      expect(find.byKey(AppPlayerChrome.scrubberKey), findsOneWidget);
      await tester.pump(const Duration(milliseconds: 32));
    });

    testWidgets(
      'error state shows the alert glyph, message, and a retry button that fires onRetry',
      (tester) async {
        var retried = false;
        await _pump(
          tester,
          _chrome(
            state: AppPlayerChromeState.error,
            onRetry: () => retried = true,
          ),
        );
        expect(find.text('Playback failed'), findsOneWidget);
        expect(find.byKey(AppPlayerChrome.retryKey), findsOneWidget);
        expect(find.byKey(AppPlayerChrome.scrubberKey), findsNothing);

        await tester.tap(find.byKey(AppPlayerChrome.retryKey));
        expect(retried, isTrue);
      },
    );

    testWidgets('locked state shows the lock glyph and message, no controls', (
      tester,
    ) async {
      await _pump(tester, _chrome(state: AppPlayerChromeState.locked));
      expect(find.text("You don't have access to this lesson"), findsOneWidget);
      expect(find.byKey(AppPlayerChrome.scrubberKey), findsNothing);
      expect(find.byKey(AppPlayerChrome.playPauseKey), findsNothing);
    });

    testWidgets(
      'end state shows the up-next banner and fires onStay / onPlayNext',
      (tester) async {
        var stayed = false;
        var playedNext = false;
        await _pump(
          tester,
          _chrome(
            state: AppPlayerChromeState.end,
            upNextTitle: 'Lesson 13 · Causal consistency',
            onStay: () => stayed = true,
            onPlayNext: () => playedNext = true,
          ),
        );
        expect(find.text('Lesson 13 · Causal consistency'), findsOneWidget);
        expect(find.byKey(AppPlayerChrome.stayKey), findsOneWidget);
        expect(find.byKey(AppPlayerChrome.playNextKey), findsOneWidget);

        await tester.tap(find.byKey(AppPlayerChrome.stayKey));
        expect(stayed, isTrue);
        await tester.tap(find.byKey(AppPlayerChrome.playNextKey));
        expect(playedNext, isTrue);
      },
    );

    testWidgets('renders a custom videoSlot when provided', (tester) async {
      await _pump(
        tester,
        const AppPlayerChrome(
          state: AppPlayerChromeState.playing,
          sectionLabel: 's',
          lessonTitle: 't',
          position: Duration.zero,
          duration: Duration(minutes: 1),
          videoSlot: ColoredBox(key: Key('customVideoSlot'), color: Colors.red),
        ),
      );
      expect(find.byKey(const Key('customVideoSlot')), findsOneWidget);
    });
  });
}
