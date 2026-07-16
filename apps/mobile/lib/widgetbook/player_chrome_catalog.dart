import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_ui/app_ui.dart';

/// Widgetbook component cataloguing the `app_ui` [AppPlayerChrome] — the
/// mobile-landscape video controls overlay (`docs/roadmap/tasks/E17-F02-S03.md`).
WidgetbookComponent buildPlayerChromeComponent() {
  return WidgetbookComponent(
    name: 'AppPlayerChrome',
    useCases: [
      WidgetbookUseCase(name: 'Playing', builder: _playing),
      WidgetbookUseCase(name: 'Paused', builder: _paused),
      WidgetbookUseCase(name: 'Buffering', builder: _buffering),
      WidgetbookUseCase(name: 'Error', builder: _error),
      WidgetbookUseCase(name: 'Locked', builder: _locked),
      WidgetbookUseCase(name: 'End (up next)', builder: _end),
      WidgetbookUseCase(name: 'Minimal mode', builder: _minimal),
    ],
  );
}

Widget _frame(Widget chrome) => Center(
  child: Padding(
    padding: const EdgeInsets.all(16),
    child: AspectRatio(aspectRatio: 19 / 9, child: chrome),
  ),
);

Widget _playing(BuildContext context) => _frame(
  AppPlayerChrome(
    state: AppPlayerChromeState.playing,
    sectionLabel: 'SECTION 04 · CONSENSUS',
    lessonTitle: 'Lesson 12 · Quorum reads',
    position: const Duration(minutes: 7, seconds: 43),
    duration: const Duration(minutes: 18, seconds: 24),
    bufferedFraction: 0.6,
    chapterFractions: const <double>[0.18, 0.45, 0.72],
    bookmarkFractions: const <double>[0.58],
    onPlayPause: () {},
    onSeek: (double fraction) {},
    onSkip: (int seconds) {},
    onDismissToPortrait: () {},
    onNext: () {},
    onPrevious: () {},
    onVolumeTap: () {},
    onSpeedTap: () {},
    onSubtitlesTap: () {},
    onSettingsTap: () {},
    onToggleFullscreen: () {},
  ),
);

Widget _paused(BuildContext context) => _frame(
  AppPlayerChrome(
    state: AppPlayerChromeState.paused,
    sectionLabel: 'SECTION 04 · CONSENSUS',
    lessonTitle: 'Lesson 12 · Quorum reads',
    position: const Duration(minutes: 7, seconds: 43),
    duration: const Duration(minutes: 18, seconds: 24),
    bufferedFraction: 0.6,
    onPlayPause: () {},
  ),
);

Widget _buffering(BuildContext context) => _frame(
  const AppPlayerChrome(
    state: AppPlayerChromeState.buffering,
    sectionLabel: 'SECTION 04 · CONSENSUS',
    lessonTitle: 'Lesson 12 · Quorum reads',
    position: Duration(minutes: 7, seconds: 43),
    duration: Duration(minutes: 18, seconds: 24),
  ),
);

Widget _error(BuildContext context) => _frame(
  AppPlayerChrome(
    state: AppPlayerChromeState.error,
    sectionLabel: 'SECTION 04 · CONSENSUS',
    lessonTitle: 'Lesson 12 · Quorum reads',
    position: const Duration(minutes: 7, seconds: 43),
    duration: const Duration(minutes: 18, seconds: 24),
    onRetry: () {},
  ),
);

Widget _locked(BuildContext context) => _frame(
  const AppPlayerChrome(
    state: AppPlayerChromeState.locked,
    sectionLabel: 'SECTION 04 · CONSENSUS',
    lessonTitle: 'Lesson 12 · Quorum reads',
    position: Duration(minutes: 7, seconds: 43),
    duration: Duration(minutes: 18, seconds: 24),
  ),
);

Widget _end(BuildContext context) => _frame(
  AppPlayerChrome(
    state: AppPlayerChromeState.end,
    sectionLabel: 'SECTION 04 · CONSENSUS',
    lessonTitle: 'Lesson 12 · Quorum reads',
    position: const Duration(minutes: 18, seconds: 24),
    duration: const Duration(minutes: 18, seconds: 24),
    upNextEyebrow: 'Up next in 5s',
    upNextTitle: 'Lesson 13 · Causal consistency',
    onStay: () {},
    onPlayNext: () {},
  ),
);

Widget _minimal(BuildContext context) => _frame(
  const AppPlayerChrome(
    state: AppPlayerChromeState.playing,
    sectionLabel: 'SECTION 04 · CONSENSUS',
    lessonTitle: 'Lesson 12 · Quorum reads',
    position: Duration(minutes: 7, seconds: 43),
    duration: Duration(minutes: 18, seconds: 24),
    bufferedFraction: 0.6,
    initiallyMinimal: true,
  ),
);
