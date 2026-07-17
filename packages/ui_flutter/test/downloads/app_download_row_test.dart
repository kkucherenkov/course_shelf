import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_ui/app_ui.dart';

Future<void> _pump(WidgetTester tester, Widget child, {double width = 340}) =>
    tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light(),
        home: Scaffold(
          body: Center(
            child: SizedBox(width: width, child: child),
          ),
        ),
      ),
    );

/// Matches a [DecoratedBox] painting a flat [BoxDecoration] in exactly
/// [color] — used to find the failed-state error wash without depending on
/// how many other (unrelated, e.g. transparent) `DecoratedBox`es Material
/// happens to build internally.
bool Function(Widget) _hasBackground(Color color) =>
    (Widget widget) =>
        widget is DecoratedBox &&
        widget.decoration is BoxDecoration &&
        (widget.decoration as BoxDecoration).color == color;

AppDownloadRow _row({
  AppDownloadState state = AppDownloadState.downloading,
  double progress = 0.42,
  VoidCallback? onCancel,
  VoidCallback? onResume,
  VoidCallback? onRetry,
  VoidCallback? onDelete,
}) => AppDownloadRow(
  lessonTitle: 'Quorum reads',
  courseTitle: 'Distributed Systems',
  sizeText: '128 MB',
  state: state,
  progress: progress,
  onCancel: onCancel,
  onResume: onResume,
  onRetry: onRetry,
  onDelete: onDelete,
);

void main() {
  group('AppDownloadRow — content', () {
    testWidgets('renders lesson title, course title, and size text', (
      tester,
    ) async {
      await _pump(tester, _row());
      expect(find.text('Quorum reads'), findsOneWidget);
      expect(find.text('Distributed Systems'), findsOneWidget);
      expect(find.text('128 MB'), findsOneWidget);
    });
  });

  group('AppDownloadRow — state glyph', () {
    final Map<AppDownloadState, IconName> expectedIcons =
        <AppDownloadState, IconName>{
          AppDownloadState.queued: IconName.cloud,
          AppDownloadState.downloading: IconName.cloudDown,
          AppDownloadState.paused: IconName.pause,
          AppDownloadState.ready: IconName.check,
          AppDownloadState.failed: IconName.alert,
        };

    for (final MapEntry<AppDownloadState, IconName> entry
        in expectedIcons.entries) {
      testWidgets('${entry.key.name} renders the ${entry.value.name} glyph', (
        tester,
      ) async {
        await _pump(tester, _row(state: entry.key));
        final IconCS icon = tester.widget<IconCS>(
          find.byKey(AppDownloadRow.stateIconKey),
        );
        expect(icon.name, entry.value);
      });
    }

    testWidgets('failed glyph paints colorScheme.error', (tester) async {
      await _pump(tester, _row(state: AppDownloadState.failed));
      final IconCS icon = tester.widget<IconCS>(
        find.byKey(AppDownloadRow.stateIconKey),
      );
      expect(icon.color, AppTheme.light().colorScheme.error);
    });

    testWidgets('ready glyph paints semanticColors.successFg', (tester) async {
      await _pump(tester, _row(state: AppDownloadState.ready));
      final IconCS icon = tester.widget<IconCS>(
        find.byKey(AppDownloadRow.stateIconKey),
      );
      final theme = AppTheme.light();
      expect(icon.color, theme.extension<AppSemanticColors>()!.successFg);
    });

    testWidgets(
      'failed row washes its background with semanticColors.errorSoft',
      (tester) async {
        await _pump(tester, _row(state: AppDownloadState.failed));
        final theme = AppTheme.light();
        final errorSoft = theme.extension<AppSemanticColors>()!.errorSoft;
        expect(
          find.byWidgetPredicate(_hasBackground(errorSoft)),
          findsOneWidget,
        );
      },
    );

    testWidgets('non-failed rows do not add an error wash', (tester) async {
      await _pump(tester, _row(state: AppDownloadState.ready));
      final theme = AppTheme.light();
      final errorSoft = theme.extension<AppSemanticColors>()!.errorSoft;
      expect(find.byWidgetPredicate(_hasBackground(errorSoft)), findsNothing);
    });
  });

  group('AppDownloadRow — progress underline', () {
    testWidgets('present only while downloading', (tester) async {
      await _pump(tester, _row(state: AppDownloadState.downloading));
      expect(find.byKey(AppDownloadRow.progressKey), findsOneWidget);
    });

    for (final state in <AppDownloadState>[
      AppDownloadState.queued,
      AppDownloadState.paused,
      AppDownloadState.ready,
      AppDownloadState.failed,
    ]) {
      testWidgets('absent while ${state.name}', (tester) async {
        await _pump(tester, _row(state: state));
        expect(find.byKey(AppDownloadRow.progressKey), findsNothing);
      });
    }

    testWidgets('reflects the progress fraction as a 0..100 value', (
      tester,
    ) async {
      await _pump(
        tester,
        _row(state: AppDownloadState.downloading, progress: 0.75),
      );
      final AppProgressLinear bar = tester.widget<AppProgressLinear>(
        find.byKey(AppDownloadRow.progressKey),
      );
      expect(bar.value, 75);
    });
  });

  group('AppDownloadRow — action affordance', () {
    // Asserts against the [AppIconButton]'s own `name`/`semanticLabel`
    // properties: `name` picks a glyph, which has no semantics counterpart to
    // read back (the glyph is deliberately excluded), so the widget's props
    // stay the exact ground truth for "which action + label did this state
    // wire up". The action's *reachability* is covered where it belongs, in
    // app_icon_button_test.dart.
    //
    // This used to carry a note blaming [AppRow] for folding every descendant
    // into one merged node. That was wrong. The collapse was an
    // [AppIconButton] defect: it wrapped an `ExcludeSemantics`'d button in a
    // non-boundary `Semantics`, contributing a node with no tap action that
    // merged straight into the row — the whole row rendered as a single
    // action-less node labelled "Quorum reads / Distributed Systems / 128 MB /
    // Cancel download". [AppRow] correctly merges only its own non-boundary
    // text descendants (one row, one node); now that [AppIconButton] lets its
    // `TextButton` keep its own semantics boundary, the trailing button
    // surfaces as a separate child node carrying focus + tap.
    AppIconButton actionButton(WidgetTester tester) =>
        tester.widget<AppIconButton>(find.byKey(AppDownloadRow.actionKey));

    testWidgets('queued action fires onCancel', (tester) async {
      var taps = 0;
      await _pump(
        tester,
        _row(state: AppDownloadState.queued, onCancel: () => taps++),
      );
      final action = actionButton(tester);
      expect(action.name, IconName.x);
      expect(action.semanticLabel, 'Cancel download');
      await tester.tap(find.byKey(AppDownloadRow.actionKey));
      expect(taps, 1);
    });

    testWidgets('downloading action fires onCancel', (tester) async {
      var taps = 0;
      await _pump(
        tester,
        _row(state: AppDownloadState.downloading, onCancel: () => taps++),
      );
      final action = actionButton(tester);
      expect(action.name, IconName.x);
      expect(action.semanticLabel, 'Cancel download');
      await tester.tap(find.byKey(AppDownloadRow.actionKey));
      expect(taps, 1);
    });

    testWidgets('paused action fires onResume', (tester) async {
      var taps = 0;
      await _pump(
        tester,
        _row(state: AppDownloadState.paused, onResume: () => taps++),
      );
      final action = actionButton(tester);
      expect(action.name, IconName.play);
      expect(action.semanticLabel, 'Resume download');
      await tester.tap(find.byKey(AppDownloadRow.actionKey));
      expect(taps, 1);
    });

    testWidgets('failed action fires onRetry', (tester) async {
      var taps = 0;
      await _pump(
        tester,
        _row(state: AppDownloadState.failed, onRetry: () => taps++),
      );
      final action = actionButton(tester);
      expect(action.name, IconName.refresh);
      expect(action.semanticLabel, 'Retry download');
      await tester.tap(find.byKey(AppDownloadRow.actionKey));
      expect(taps, 1);
    });

    testWidgets('ready action fires onDelete', (tester) async {
      var taps = 0;
      await _pump(
        tester,
        _row(state: AppDownloadState.ready, onDelete: () => taps++),
      );
      final action = actionButton(tester);
      expect(action.name, IconName.trash);
      expect(action.semanticLabel, 'Delete download');
      await tester.tap(find.byKey(AppDownloadRow.actionKey));
      expect(taps, 1);
    });

    testWidgets('does not cross-fire the wrong callback', (tester) async {
      var cancels = 0;
      var resumes = 0;
      await _pump(
        tester,
        _row(
          state: AppDownloadState.paused,
          onCancel: () => cancels++,
          onResume: () => resumes++,
        ),
      );
      await tester.tap(find.byKey(AppDownloadRow.actionKey));
      expect(cancels, 0);
      expect(resumes, 1);
    });

    testWidgets('override labels replace the English defaults', (tester) async {
      await _pump(
        tester,
        const AppDownloadRow(
          lessonTitle: 'Quorum reads',
          courseTitle: 'Distributed Systems',
          sizeText: '128 MB',
          state: AppDownloadState.failed,
          retryLabel: 'Повторить',
        ),
      );
      expect(actionButton(tester).semanticLabel, 'Повторить');
    });
  });
}
