import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
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

void main() {
  group('AppIconButton', () {
    testWidgets('renders one IconCS glyph', (tester) async {
      await _pump(
        tester,
        const AppIconButton(name: IconName.play, semanticLabel: 'Play'),
      );
      expect(find.byType(IconCS), findsOneWidget);
    });

    testWidgets('is square at the size dimension', (tester) async {
      await _pump(
        tester,
        const AppIconButton(
          name: IconName.play,
          semanticLabel: 'Play',
          size: AppButtonSize.lg,
        ),
      );
      final size = tester.getSize(find.byType(AppIconButton));
      expect(size.width, 44);
      expect(size.height, 44);
    });

    testWidgets('exposes its semantic label', (tester) async {
      final handle = tester.ensureSemantics();
      await _pump(
        tester,
        const AppIconButton(name: IconName.play, semanticLabel: 'Play video'),
      );
      expect(find.bySemanticsLabel('Play video'), findsOneWidget);
      handle.dispose();
    });

    testWidgets('fires onPressed on tap', (tester) async {
      var taps = 0;
      await _pump(
        tester,
        AppIconButton(
          name: IconName.play,
          semanticLabel: 'Play',
          onPressed: () => taps++,
        ),
      );
      await tester.tap(find.byType(AppIconButton));
      expect(taps, 1);
    });

    testWidgets('disabled does not fire and nulls onPressed', (tester) async {
      var taps = 0;
      await _pump(
        tester,
        AppIconButton(
          name: IconName.play,
          semanticLabel: 'Play',
          disabled: true,
          onPressed: () => taps++,
        ),
      );
      await tester.tap(find.byType(AppIconButton), warnIfMissed: false);
      expect(taps, 0);
      expect(
        tester.widget<TextButton>(find.byType(TextButton)).onPressed,
        isNull,
      );
    });

    testWidgets('loading shows a spinner instead of the glyph', (tester) async {
      await _pump(
        tester,
        const AppIconButton(
          name: IconName.play,
          semanticLabel: 'Play',
          loading: true,
        ),
      );
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.byType(IconCS), findsNothing);
    });
  });

  group('AppIconButton — semantics', () {
    /// The node under test is the one the inner [TextButton] owns — the same
    /// shape [AppButton] produces. It sits *below* [AppIconButton]'s outermost
    /// render object (IgnorePointer/Opacity own no node), so finding it by
    /// [AppIconButton] would walk up past it to the enclosing route.
    SemanticsNode buttonNode(WidgetTester tester) =>
        tester.getSemantics(find.byType(TextButton));

    /// Addresses the node the way assistive tech does: by its accessible name.
    SemanticsFinder byName(String label) => find.semantics.byLabel(label);

    /// Forces a tap through the semantics layer even when the node advertises
    /// no tap action, proving the callback is genuinely unreachable rather
    /// than merely unadvertised. `tester.tap` only drives the hit-test path,
    /// which stays green even on a node that offers no tap action at all.
    void forceSemanticTap(WidgetTester tester, String label) {
      tester.semantics.performAction(
        byName(label),
        SemanticsAction.tap,
        checkForAction: false,
      );
    }

    testWidgets('enabled node is a labelled, focusable, tappable button', (
      tester,
    ) async {
      final handle = tester.ensureSemantics();
      await _pump(
        tester,
        AppIconButton(
          name: IconName.trash,
          semanticLabel: 'Delete',
          onPressed: () {},
        ),
      );
      expect(
        buttonNode(tester),
        matchesSemantics(
          label: 'Delete',
          isButton: true,
          hasEnabledState: true,
          isEnabled: true,
          isFocusable: true,
          hasTapAction: true,
          hasFocusAction: true,
        ),
      );
      handle.dispose();
    });

    testWidgets('activating the node via semantics fires onPressed', (
      tester,
    ) async {
      final handle = tester.ensureSemantics();
      var taps = 0;
      await _pump(
        tester,
        AppIconButton(
          name: IconName.trash,
          semanticLabel: 'Delete',
          onPressed: () => taps++,
        ),
      );
      tester.semantics.tap(byName('Delete'));
      await tester.pump();
      expect(taps, 1);
      handle.dispose();
    });

    testWidgets('disabled node reports not-enabled and is not activatable', (
      tester,
    ) async {
      final handle = tester.ensureSemantics();
      var taps = 0;
      await _pump(
        tester,
        AppIconButton(
          name: IconName.trash,
          semanticLabel: 'Delete',
          disabled: true,
          onPressed: () => taps++,
        ),
      );
      expect(
        buttonNode(tester),
        matchesSemantics(
          label: 'Delete',
          isButton: true,
          hasEnabledState: true,
          isEnabled: false,
          isFocusable: false,
          hasTapAction: false,
          hasFocusAction: false,
        ),
      );
      expect(() => tester.semantics.tap(byName('Delete')), throwsStateError);
      forceSemanticTap(tester, 'Delete');
      await tester.pump();
      expect(taps, 0);
      handle.dispose();
    });

    testWidgets('loading node reports not-enabled and is not activatable', (
      tester,
    ) async {
      final handle = tester.ensureSemantics();
      var taps = 0;
      await _pump(
        tester,
        AppIconButton(
          name: IconName.trash,
          semanticLabel: 'Delete',
          loading: true,
          onPressed: () => taps++,
        ),
      );
      expect(
        buttonNode(tester),
        matchesSemantics(
          label: 'Delete',
          isButton: true,
          hasEnabledState: true,
          isEnabled: false,
          isFocusable: false,
          hasTapAction: false,
          hasFocusAction: false,
        ),
      );
      expect(() => tester.semantics.tap(byName('Delete')), throwsStateError);
      forceSemanticTap(tester, 'Delete');
      await tester.pump();
      expect(taps, 0);
      handle.dispose();
    });

    testWidgets('the glyph does not leak into the announced label', (
      tester,
    ) async {
      final handle = tester.ensureSemantics();
      await _pump(
        tester,
        AppIconButton(
          name: IconName.trash,
          semanticLabel: 'Delete',
          onPressed: () {},
        ),
      );
      // Exactly one labelled node, carrying exactly the supplied label: the
      // glyph contributes no node of its own to merge in beside it.
      expect(find.bySemanticsLabel('Delete'), findsOneWidget);
      expect(buttonNode(tester).label, 'Delete');
      handle.dispose();
    });
  });
}
