import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golden_toolkit/golden_toolkit.dart';

import 'package:app_ui/app_ui.dart';

import '../_support/fonts.dart';

Widget _label(String text) => Padding(
  padding: const EdgeInsets.only(bottom: 4),
  child: Text(
    text,
    style: const TextStyle(fontSize: 10, color: Colors.black87),
  ),
);

Widget _card(String title, Widget chrome) => Padding(
  padding: const EdgeInsets.only(bottom: 16),
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    mainAxisSize: MainAxisSize.min,
    children: <Widget>[
      _label(title),
      // A real mobile-landscape width (e.g. an iPhone SE at 667 or a Pixel
      // at 915, minus system bars) — 340 (a portrait-phone width) is
      // narrower than this control row can ever actually render at.
      SizedBox(width: 640, height: 640 * 9 / 19, child: chrome),
    ],
  ),
);

Widget _matrix(ThemeData theme) {
  return MaterialApp(
    debugShowCheckedModeBanner: false,
    theme: theme,
    home: Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              _card(
                'playing',
                const AppPlayerChrome(
                  state: AppPlayerChromeState.playing,
                  sectionLabel: 'SECTION 04 · CONSENSUS',
                  lessonTitle: 'Lesson 12 · Quorum reads',
                  position: Duration(minutes: 7, seconds: 43),
                  duration: Duration(minutes: 18, seconds: 24),
                  bufferedFraction: 0.6,
                  chapterFractions: <double>[0.18, 0.45, 0.72],
                  bookmarkFractions: <double>[0.58],
                ),
              ),
              _card(
                'paused',
                const AppPlayerChrome(
                  state: AppPlayerChromeState.paused,
                  sectionLabel: 'SECTION 04 · CONSENSUS',
                  lessonTitle: 'Lesson 12 · Quorum reads',
                  position: Duration(minutes: 7, seconds: 43),
                  duration: Duration(minutes: 18, seconds: 24),
                  bufferedFraction: 0.6,
                ),
              ),
              _card(
                'buffering',
                const AppPlayerChrome(
                  state: AppPlayerChromeState.buffering,
                  sectionLabel: 'SECTION 04 · CONSENSUS',
                  lessonTitle: 'Lesson 12 · Quorum reads',
                  position: Duration(minutes: 7, seconds: 43),
                  duration: Duration(minutes: 18, seconds: 24),
                ),
              ),
              _card(
                'error',
                const AppPlayerChrome(
                  state: AppPlayerChromeState.error,
                  sectionLabel: 'SECTION 04 · CONSENSUS',
                  lessonTitle: 'Lesson 12 · Quorum reads',
                  position: Duration(minutes: 7, seconds: 43),
                  duration: Duration(minutes: 18, seconds: 24),
                ),
              ),
              _card(
                'locked',
                const AppPlayerChrome(
                  state: AppPlayerChromeState.locked,
                  sectionLabel: 'SECTION 04 · CONSENSUS',
                  lessonTitle: 'Lesson 12 · Quorum reads',
                  position: Duration(minutes: 7, seconds: 43),
                  duration: Duration(minutes: 18, seconds: 24),
                ),
              ),
              _card(
                'end',
                const AppPlayerChrome(
                  state: AppPlayerChromeState.end,
                  sectionLabel: 'SECTION 04 · CONSENSUS',
                  lessonTitle: 'Lesson 12 · Quorum reads',
                  position: Duration(minutes: 18, seconds: 24),
                  duration: Duration(minutes: 18, seconds: 24),
                  upNextEyebrow: 'Up next in 5s',
                  upNextTitle: 'Lesson 13 · Causal consistency',
                ),
              ),
              _card(
                'minimal',
                const AppPlayerChrome(
                  state: AppPlayerChromeState.playing,
                  sectionLabel: 'SECTION 04 · CONSENSUS',
                  lessonTitle: 'Lesson 12 · Quorum reads',
                  position: Duration(minutes: 7, seconds: 43),
                  duration: Duration(minutes: 18, seconds: 24),
                  bufferedFraction: 0.6,
                  initiallyMinimal: true,
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

Future<void> _pumpMatrix(WidgetTester tester) =>
    tester.pump(const Duration(milliseconds: 32));

void main() {
  setUpAll(() async {
    await loadAppFonts();
    await loadPackagedFonts();
  });

  testGoldens('AppPlayerChrome matrix — light', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.light()),
      surfaceSize: const Size(700, 2500),
    );
    await screenMatchesGolden(
      tester,
      'app_player_chrome_matrix_light',
      customPump: _pumpMatrix,
    );
  });

  testGoldens('AppPlayerChrome matrix — dark', (tester) async {
    await tester.pumpWidgetBuilder(
      _matrix(AppTheme.dark()),
      surfaceSize: const Size(700, 2500),
    );
    await screenMatchesGolden(
      tester,
      'app_player_chrome_matrix_dark',
      customPump: _pumpMatrix,
    );
  });
}
