import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/features/player/domain/lesson_playback.dart';
import 'package:app_mobile/features/player/domain/video_playback_port.dart';
import 'package:app_mobile/features/player/presentation/bloc/player_bloc.dart';
import 'package:app_mobile/features/player/presentation/bloc/player_event.dart';
import 'package:app_mobile/features/player/presentation/lesson_player_screen.dart';
import 'package:app_mobile/features/player/presentation/widgets/portrait_player_stage.dart';
import 'package:app_mobile/i18n/strings.g.dart';

import 'player_fakes.dart';

/// A buffering spinner animates forever, so `pumpAndSettle` would time out.
Future<void> _settle(WidgetTester tester) async {
  for (int i = 0; i < 6; i++) {
    await tester.pump(const Duration(milliseconds: 32));
  }
}

void main() {
  late FakeLessonPlayerRepository repository;
  late FakeProgressRecorder recorder;
  late FakeVideoPlaybackPort playback;

  setUp(() {
    repository = FakeLessonPlayerRepository();
    recorder = FakeProgressRecorder();
    playback = FakeVideoPlaybackPort();
  });

  PlayerBloc buildBloc() => PlayerBloc(
    repository: repository,
    progressRecorder: recorder,
    playback: playback,
  );

  Future<void> pumpPlayer(
    WidgetTester tester, {
    Size size = const Size(400, 800),
    PlayerBloc? bloc,
  }) async {
    tester.view.physicalSize = size;
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    final PlayerBloc instance = bloc ?? buildBloc();
    instance.add(const PlayerStarted('lesson-1'));

    await tester.pumpWidget(
      TranslationProvider(
        child: MaterialApp(
          theme: AppTheme.light(),
          home: BlocProvider<PlayerBloc>.value(
            value: instance,
            child: const LessonPlayerView(),
          ),
        ),
      ),
    );
    await _settle(tester);
  }

  group('portrait', () {
    testWidgets('shows the 16:9 stage and all four tabs', (
      WidgetTester tester,
    ) async {
      await pumpPlayer(tester);

      expect(find.byType(PortraitPlayerStage), findsOneWidget);
      expect(
        tester.widget<AspectRatio>(
          find.descendant(
            of: find.byType(PortraitPlayerStage),
            matching: find.byType(AspectRatio),
          ),
        ).aspectRatio,
        16 / 9,
      );

      for (final String label in <String>[
        'Sections',
        'Notes',
        'Bookmarks',
        'Materials',
      ]) {
        expect(find.text(label), findsOneWidget);
      }
    });

    testWidgets('hides the offline indicator for a network source', (
      WidgetTester tester,
    ) async {
      await pumpPlayer(tester);
      expect(find.text('Watching offline'), findsNothing);
    });

    testWidgets('shows "Watching offline" when the source is a local file', (
      WidgetTester tester,
    ) async {
      repository.source = const LessonVideoSource.localFile('/tmp/a.enc');
      await pumpPlayer(tester);
      expect(find.text('Watching offline'), findsOneWidget);
    });

    testWidgets('the play control is reachable by assistive tech', (
      WidgetTester tester,
    ) async {
      await pumpPlayer(tester);

      // `tester.tap` never touches the semantics layer, so a control can be
      // tappable and still unusable with a screen reader. Assert the semantics
      // node itself carries the label and the tap action.
      expect(find.byKey(PortraitPlayerStage.playPauseKey), findsOneWidget);

      final SemanticsNode node = tester.getSemantics(
        find.bySemanticsLabel('Play'),
      );
      expect(
        node,
        matchesSemantics(
          label: 'Play',
          isButton: true,
          isEnabled: true,
          hasEnabledState: true,
          hasTapAction: true,
          isFocusable: true,
          hasFocusAction: true,
        ),
        reason: 'play/pause must be activatable from the semantics tree',
      );
    });

    testWidgets('switching to Materials shows the empty state', (
      WidgetTester tester,
    ) async {
      await pumpPlayer(tester);

      // The strip scrolls horizontally by design (the mockup's tab row is
      // `overflowX: auto`): at 400px the fourth tab starts past the right
      // edge, so it has to be brought into view before it can be tapped.
      await tester.ensureVisible(find.text('Materials'));
      await _settle(tester);
      await tester.tap(find.text('Materials'));
      await _settle(tester);

      expect(find.text('No materials for this lesson.'), findsOneWidget);
    });

    testWidgets('a buffering lesson shows the spinner without settling', (
      WidgetTester tester,
    ) async {
      final PlayerBloc bloc = buildBloc();
      await pumpPlayer(tester, bloc: bloc);

      playback.emit(
        const VideoPlaybackSnapshot(
          duration: Duration(minutes: 26),
          isInitialized: true,
          isPlaying: true,
          isBuffering: true,
        ),
      );
      await _settle(tester);

      expect(find.byKey(PortraitPlayerStage.bufferingKey), findsOneWidget);
    });
  });

  group('landscape', () {
    testWidgets('swaps the portrait stage for the immersive chrome', (
      WidgetTester tester,
    ) async {
      await pumpPlayer(tester, size: const Size(800, 400));

      expect(find.byType(AppPlayerChrome), findsOneWidget);
      expect(find.byType(PortraitPlayerStage), findsNothing);
      // The tab strip is portrait-only — landscape is full-bleed video.
      expect(find.text('Sections'), findsNothing);
    });

    testWidgets('feeds the video surface into the chrome videoSlot', (
      WidgetTester tester,
    ) async {
      await pumpPlayer(tester, size: const Size(800, 400));

      final AppPlayerChrome chrome = tester.widget<AppPlayerChrome>(
        find.byType(AppPlayerChrome),
      );
      expect(chrome.videoSlot, isNotNull);
    });
  });

  group('system chrome', () {
    late List<MethodCall> calls;

    setUp(() {
      calls = <MethodCall>[];
      TestDefaultBinaryMessengerBinding
          .instance
          .defaultBinaryMessenger
          .setMockMethodCallHandler(SystemChannels.platform, (
            MethodCall call,
          ) async {
            calls.add(call);
            return null;
          });
    });

    tearDown(() {
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
          .setMockMethodCallHandler(SystemChannels.platform, null);
    });

    testWidgets('goes immersive in landscape', (WidgetTester tester) async {
      await pumpPlayer(tester, size: const Size(800, 400));

      expect(
        calls
            .where(
              (MethodCall c) => c.method == 'SystemChrome.setEnabledSystemUIMode',
            )
            .map((MethodCall c) => c.arguments)
            .last,
        'SystemUiMode.immersiveSticky',
      );
    });

    testWidgets('restores the system UI when popped from landscape', (
      WidgetTester tester,
    ) async {
      await pumpPlayer(tester, size: const Size(800, 400));
      calls.clear();

      // Tearing the player down is what a Navigator.pop does. Leaving the
      // status bar hidden here would leak into every screen after it.
      await tester.pumpWidget(const SizedBox.shrink());
      await _settle(tester);

      expect(
        calls
            .where(
              (MethodCall c) => c.method == 'SystemChrome.setEnabledSystemUIMode',
            )
            .map((MethodCall c) => c.arguments)
            .last,
        'SystemUiMode.edgeToEdge',
        reason: 'a popped player must not leave the status bar hidden',
      );
      expect(
        calls
            .where(
              (MethodCall c) =>
                  c.method == 'SystemChrome.setPreferredOrientations',
            )
            .map((MethodCall c) => c.arguments)
            .last,
        isEmpty,
        reason: 'a popped player must not leave the device pinned to landscape',
      );
    });
  });
}
