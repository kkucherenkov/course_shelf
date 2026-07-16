import 'dart:ui' show Tristate;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_ui/app_ui.dart';

Future<void> _pump(
  WidgetTester tester, {
  int num = 1,
  String title = 'Intro to TypeScript generics',
  Duration duration = const Duration(seconds: 425),
  LessonRowState state = LessonRowState.notStarted,
  bool materials = false,
  bool current = false,
  double progress = 0,
  LessonDownloadState? downloadState,
  bool loading = false,
  VoidCallback? onTap,
  VoidCallback? onDownload,
}) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: AppTheme.light(),
      home: Scaffold(
        body: SizedBox(
          width: 360,
          child: AppLessonRow(
            num: num,
            title: title,
            duration: duration,
            state: state,
            materials: materials,
            current: current,
            progress: progress,
            downloadState: downloadState,
            loading: loading,
            onTap: onTap,
            onDownload: onDownload,
          ),
        ),
      ),
    ),
  );
}

IconCS _iconAt(WidgetTester tester, Key key) =>
    tester.widget<IconCS>(find.byKey(key));

void main() {
  group('AppLessonRow', () {
    testWidgets('renders the padded lesson number, title and mono duration', (
      tester,
    ) async {
      await _pump(tester, num: 1, duration: const Duration(seconds: 425));
      expect(tester.widget<Text>(find.byKey(AppLessonRow.numKey)).data, '01');
      expect(find.text('Intro to TypeScript generics'), findsOneWidget);
      expect(
        tester.widget<Text>(find.byKey(AppLessonRow.durationKey)).data,
        '7:05',
      );
    });

    testWidgets('formats hour-long durations as H:MM:SS', (tester) async {
      await _pump(tester, duration: const Duration(seconds: 3725));
      expect(
        tester.widget<Text>(find.byKey(AppLessonRow.durationKey)).data,
        '1:02:05',
      );
    });

    testWidgets('uses the circle icon by default (not-started)', (
      tester,
    ) async {
      await _pump(tester);
      expect(_iconAt(tester, AppLessonRow.iconKey).name, IconName.circle);
    });

    testWidgets(
      'shows the check-circle icon and success colour when completed',
      (tester) async {
        await _pump(tester, state: LessonRowState.completed);
        final IconCS icon = _iconAt(tester, AppLessonRow.iconKey);
        expect(icon.name, IconName.checkCircle);
        final ThemeData theme = AppTheme.light();
        expect(icon.color, theme.extension<AppSemanticColors>()!.successFg);
      },
    );

    testWidgets('shows the lock icon and disables activation when locked', (
      tester,
    ) async {
      var taps = 0;
      await _pump(tester, state: LessonRowState.locked, onTap: () => taps++);
      expect(_iconAt(tester, AppLessonRow.iconKey).name, IconName.lock);
      expect(find.byType(InkWell), findsNothing);
      await tester.tap(find.byType(AppLessonRow), warnIfMissed: false);
      expect(taps, 0);
    });

    testWidgets(
      'renders the underline progress bar and "n% watched" meta when in-progress',
      (tester) async {
        await _pump(tester, state: LessonRowState.inProgress, progress: 42);
        final AppProgressLinear bar = tester.widget<AppProgressLinear>(
          find.byKey(AppLessonRow.progressKey),
        );
        expect(bar.value, 42);
        expect(bar.thin, isTrue);
        expect(
          tester.widget<Text>(find.byKey(AppLessonRow.metaKey)).data,
          '42% watched',
        );
      },
    );

    testWidgets(
      'omits the progress bar when in-progress with progress=0 but still shows meta',
      (tester) async {
        await _pump(tester, state: LessonRowState.inProgress, progress: 0);
        expect(find.byKey(AppLessonRow.progressKey), findsNothing);
        expect(
          tester.widget<Text>(find.byKey(AppLessonRow.metaKey)).data,
          '0% watched',
        );
      },
    );

    testWidgets('clamps progress to 0..100', (tester) async {
      await _pump(tester, state: LessonRowState.inProgress, progress: 250);
      final AppProgressLinear bar = tester.widget<AppProgressLinear>(
        find.byKey(AppLessonRow.progressKey),
      );
      expect(bar.value, 100);
      expect(
        tester.widget<Text>(find.byKey(AppLessonRow.metaKey)).data,
        '100% watched',
      );
    });

    testWidgets(
      'flips the leading icon to play and applies the accent colour when current',
      (tester) async {
        await _pump(tester, current: true);
        final IconCS icon = _iconAt(tester, AppLessonRow.iconKey);
        expect(icon.name, IconName.play);
        final ThemeData theme = AppTheme.light();
        expect(icon.color, theme.colorScheme.primary);

        final semantics = tester.getSemantics(find.byType(AppLessonRow));
        expect(semantics.flagsCollection.isSelected, Tristate.isTrue);
      },
    );

    testWidgets(
      'current overrides the icon colour even when state is completed',
      (tester) async {
        await _pump(tester, current: true, state: LessonRowState.completed);
        final IconCS icon = _iconAt(tester, AppLessonRow.iconKey);
        // Icon *shape* still prefers completed's check-circle...
        expect(icon.name, IconName.checkCircle);
        // ...but colour follows `current`, mirroring the web's
        // `iconState = current ? 'current' : state` computed.
        final ThemeData theme = AppTheme.light();
        expect(icon.color, theme.colorScheme.primary);
      },
    );

    testWidgets(
      'renders a PDF icon when materials=true and omits it otherwise',
      (tester) async {
        await _pump(tester);
        expect(find.byKey(AppLessonRow.materialsKey), findsNothing);

        await _pump(tester, materials: true);
        expect(find.byKey(AppLessonRow.materialsKey), findsOneWidget);
      },
    );

    testWidgets('fires onTap on tap', (tester) async {
      var taps = 0;
      await _pump(tester, onTap: () => taps++);
      await tester.tap(find.byType(AppLessonRow));
      expect(taps, 1);
    });

    testWidgets('renders the skeleton variant when loading=true', (
      tester,
    ) async {
      await _pump(tester, loading: true);
      expect(find.byKey(AppLessonRow.titleKey), findsNothing);
      expect(find.byKey(AppLessonRow.durationKey), findsNothing);
      expect(find.byType(AppSkeleton), findsNWidgets(4));
    });

    group('downloadState', () {
      testWidgets('omits the download icon when null', (tester) async {
        await _pump(tester);
        expect(find.byKey(AppLessonRow.downloadKey), findsNothing);
      });

      testWidgets('shows a check icon in success colour when downloaded', (
        tester,
      ) async {
        await _pump(tester, downloadState: LessonDownloadState.downloaded);
        final IconCS icon = tester.widget<IconCS>(
          find.byKey(AppLessonRow.downloadKey),
        );
        expect(icon.name, IconName.check);
        final ThemeData theme = AppTheme.light();
        expect(icon.color, theme.extension<AppSemanticColors>()!.successFg);
      });

      testWidgets('shows a spinner when downloading', (tester) async {
        await _pump(tester, downloadState: LessonDownloadState.downloading);
        expect(
          find.descendant(
            of: find.byKey(AppLessonRow.downloadKey),
            matching: find.byType(AppSpinner),
          ),
          findsOneWidget,
        );
      });

      testWidgets(
        'shows a tappable cloud-down icon and fires onDownload when available',
        (tester) async {
          var downloads = 0;
          var taps = 0;
          await _pump(
            tester,
            downloadState: LessonDownloadState.available,
            onDownload: () => downloads++,
            onTap: () => taps++,
          );
          final IconCS icon = tester.widget<IconCS>(
            find.descendant(
              of: find.byKey(AppLessonRow.downloadKey),
              matching: find.byType(IconCS),
            ),
          );
          expect(icon.name, IconName.cloudDown);

          await tester.tap(find.byKey(AppLessonRow.downloadKey));
          expect(downloads, 1);
          // Tapping the download icon should not also select the row.
          expect(taps, 0);
        },
      );

      testWidgets('shows an alert icon in error colour when failed', (
        tester,
      ) async {
        await _pump(tester, downloadState: LessonDownloadState.failed);
        final IconCS icon = tester.widget<IconCS>(
          find.byKey(AppLessonRow.downloadKey),
        );
        expect(icon.name, IconName.alert);
        final ThemeData theme = AppTheme.light();
        expect(icon.color, theme.colorScheme.error);
      });
    });
  });
}
