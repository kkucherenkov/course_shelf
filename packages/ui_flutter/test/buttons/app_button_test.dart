import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_ui/app_ui.dart';

Future<void> _pump(
  WidgetTester tester,
  Widget child, {
  ThemeData? theme,
}) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: theme ?? AppTheme.light(),
      home: Scaffold(body: Center(child: child)),
    ),
  );
}

void main() {
  group('AppButton', () {
    testWidgets('renders its label', (tester) async {
      await _pump(tester, const AppButton(label: 'Save'));
      expect(find.text('Save'), findsOneWidget);
    });

    testWidgets('fires onPressed on tap', (tester) async {
      var taps = 0;
      await _pump(tester, AppButton(label: 'Save', onPressed: () => taps++));
      await tester.tap(find.byType(AppButton));
      expect(taps, 1);
    });

    testWidgets('disabled: no tap, null onPressed, faded to 0.45', (
      tester,
    ) async {
      var taps = 0;
      await _pump(
        tester,
        AppButton(label: 'X', disabled: true, onPressed: () => taps++),
      );
      await tester.tap(find.byType(AppButton), warnIfMissed: false);
      expect(taps, 0);
      expect(
        tester.widget<TextButton>(find.byType(TextButton)).onPressed,
        isNull,
      );
      expect(
        find.byWidgetPredicate((w) => w is Opacity && w.opacity == 0.45),
        findsOneWidget,
      );
    });

    testWidgets('loading: spinner shown, label hidden, tap guarded', (
      tester,
    ) async {
      var taps = 0;
      await _pump(
        tester,
        AppButton(label: 'Save', loading: true, onPressed: () => taps++),
      );
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.text('Save'), findsNothing);
      await tester.tap(find.byType(AppButton), warnIfMissed: false);
      expect(taps, 0);
    });

    testWidgets('renders leading + trailing IconCS at the size icon px', (
      tester,
    ) async {
      await _pump(
        tester,
        const AppButton(
          label: 'Go',
          iconLeading: IconName.play,
          iconTrailing: IconName.chevronRight,
        ),
      );
      final icons = tester.widgetList<IconCS>(find.byType(IconCS)).toList();
      expect(icons.length, 2);
      expect(icons.every((i) => i.size == 20), isTrue);
    });

    testWidgets('block fills the available width', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light(),
          home: Scaffold(
            body: SizedBox(
              width: 400,
              child: Align(
                alignment: Alignment.centerLeft,
                child: AppButton(label: 'Wide', block: true, onPressed: () {}),
              ),
            ),
          ),
        ),
      );
      expect(tester.getSize(find.byType(AppButton)).width, 400);
    });

    testWidgets('non-block shrinks below the available width', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light(),
          home: Scaffold(
            body: SizedBox(
              width: 400,
              child: Align(
                alignment: Alignment.centerLeft,
                child: AppButton(label: 'Narrow', onPressed: () {}),
              ),
            ),
          ),
        ),
      );
      expect(tester.getSize(find.byType(AppButton)).width, lessThan(400));
    });

    testWidgets('each variant resolves its token background', (tester) async {
      final theme = AppTheme.light();
      final sem = theme.extension<AppSemanticColors>()!;
      final cases = <AppButtonVariant, Color>{
        AppButtonVariant.primary: theme.colorScheme.primary,
        AppButtonVariant.secondary: sem.raised,
        AppButtonVariant.ghost: Colors.transparent,
        AppButtonVariant.destructive: theme.colorScheme.error,
      };
      for (final entry in cases.entries) {
        await _pump(
          tester,
          AppButton(label: 'V', variant: entry.key),
          theme: theme,
        );
        final style = tester.widget<TextButton>(find.byType(TextButton)).style!;
        expect(
          style.backgroundColor!.resolve(<WidgetState>{}),
          entry.value,
          reason: 'variant ${entry.key.name}',
        );
      }
    });

    testWidgets('each size resolves its height', (tester) async {
      final heights = <AppButtonSize, double>{
        AppButtonSize.sm: 28,
        AppButtonSize.md: 36,
        AppButtonSize.lg: 44,
      };
      for (final entry in heights.entries) {
        await _pump(tester, AppButton(label: 'H', size: entry.key));
        expect(
          tester.getSize(find.byType(AppButton)).height,
          entry.value,
          reason: 'size ${entry.key.name}',
        );
      }
    });
  });

  group('AppButton semantics', () {
    /// Locates the button node by its `isButton` flag rather than by label:
    /// naming is exactly what these tests pin down, so a label-based finder
    /// would miss a nameless node and fail for the wrong reason. Nor can we
    /// reach it with `tester.getSemantics(find.byType(AppButton))` — the
    /// widget's outermost render object ([IgnorePointer]) contributes no node
    /// of its own, so that call resolves to the enclosing *route* node.
    SemanticsFinder buttonFinder() =>
        find.semantics.byFlag(SemanticsFlag.isButton);

    SemanticsNode buttonNode() => buttonFinder().evaluate().single;

    /// [SemanticsController.tap] refuses to act on a node that advertises no
    /// tap action, so it cannot tell "action absent" from "action present but
    /// swallowed". `checkForAction: false` dispatches the action anyway,
    /// proving the callback is genuinely unreachable rather than merely
    /// unadvertised. `tester.tap` proves nothing here: it only drives the
    /// hit-test path and stays green even against a node that offers no tap
    /// action at all.
    void forceSemanticTap(WidgetTester tester) {
      tester.semantics.performAction(
        buttonFinder(),
        SemanticsAction.tap,
        checkForAction: false,
      );
    }

    testWidgets('enabled node is a labelled, focusable, tappable button', (
      tester,
    ) async {
      final handle = tester.ensureSemantics();
      await _pump(tester, AppButton(label: 'Save', onPressed: () {}));
      expect(
        buttonNode(),
        matchesSemantics(
          label: 'Save',
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
      await _pump(tester, AppButton(label: 'Save', onPressed: () => taps++));
      tester.semantics.tap(buttonFinder());
      await tester.pump();
      expect(taps, 1);
      handle.dispose();
    });

    testWidgets('a custom-child button announces its semanticLabel', (
      tester,
    ) async {
      final handle = tester.ensureSemantics();
      await _pump(
        tester,
        AppButton(
          onPressed: () {},
          semanticLabel: 'Bold',
          child: const Text('B'),
        ),
      );
      // The glyph child ('B') is excluded from semantics; the button node is
      // named by the supplied [semanticLabel], not by the visible child.
      expect(buttonNode().label, 'Bold');
      handle.dispose();
    });

    testWidgets('icon-only enabled node announces its semanticLabel', (
      tester,
    ) async {
      final handle = tester.ensureSemantics();
      await _pump(
        tester,
        AppButton(
          iconLeading: IconName.play,
          semanticLabel: 'Play',
          onPressed: () {},
        ),
      );
      // The gap the tap-only tests missed: an icon-only button is a full,
      // named, activatable button to assistive tech — not a nameless glyph.
      expect(
        buttonNode(),
        matchesSemantics(
          label: 'Play',
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

    testWidgets('semanticLabel overrides the visible label as the name', (
      tester,
    ) async {
      final handle = tester.ensureSemantics();
      await _pump(
        tester,
        AppButton(
          label: 'OK',
          semanticLabel: 'Confirm order',
          onPressed: () {},
        ),
      );
      expect(find.text('OK'), findsOneWidget);
      expect(buttonNode().label, 'Confirm order');
      handle.dispose();
    });

    testWidgets('disabled node reports not-enabled and is not activatable', (
      tester,
    ) async {
      final handle = tester.ensureSemantics();
      var taps = 0;
      await _pump(
        tester,
        AppButton(label: 'Save', disabled: true, onPressed: () => taps++),
      );
      expect(
        buttonNode(),
        matchesSemantics(
          label: 'Save',
          isButton: true,
          hasEnabledState: true,
          isEnabled: false,
          isFocusable: false,
          hasTapAction: false,
          hasFocusAction: false,
        ),
      );
      expect(() => tester.semantics.tap(buttonFinder()), throwsStateError);
      forceSemanticTap(tester);
      await tester.pump();
      expect(taps, 0);
      handle.dispose();
    });

    testWidgets('loading node reports not-enabled, unfocusable, action-less', (
      tester,
    ) async {
      final handle = tester.ensureSemantics();
      await _pump(
        tester,
        AppButton(label: 'Save', loading: true, onPressed: () {}),
      );
      expect(
        buttonNode(),
        matchesSemantics(
          label: 'Save',
          isButton: true,
          hasEnabledState: true,
          isEnabled: false,
          isFocusable: false,
          hasTapAction: false,
          hasFocusAction: false,
        ),
      );
      handle.dispose();
    });

    testWidgets('loading node cannot fire onPressed via semantics', (
      tester,
    ) async {
      final handle = tester.ensureSemantics();
      var taps = 0;
      await _pump(
        tester,
        AppButton(label: 'Save', loading: true, onPressed: () => taps++),
      );
      expect(() => tester.semantics.tap(buttonFinder()), throwsStateError);
      forceSemanticTap(tester);
      await tester.pump();
      expect(taps, 0);
      handle.dispose();
    });

    // `loading` swaps the whole content — label, custom child and icons — for
    // the spinner, so no visible descendant is left to announce. Before this
    // fix a child-only button therefore went nameless while loading (its name
    // lived in the now-unmounted child). `semanticLabel` is required whenever
    // `label` is null, so the loading node always has a string to announce —
    // this pins that child-only loading buttons stay named.
    testWidgets('child-only loading node still announces its semanticLabel', (
      tester,
    ) async {
      final handle = tester.ensureSemantics();
      await _pump(
        tester,
        AppButton(
          loading: true,
          semanticLabel: 'Saving',
          onPressed: () {},
          child: const Text('Save'),
        ),
      );
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(
        buttonNode(),
        matchesSemantics(
          label: 'Saving',
          isButton: true,
          hasEnabledState: true,
          isEnabled: false,
          isFocusable: false,
          hasTapAction: false,
          hasFocusAction: false,
        ),
      );
      handle.dispose();
    });
  });

  group('AppButton assertions', () {
    test('requires a semanticLabel when label is null', () {
      expect(
        () => AppButton(iconLeading: IconName.play, onPressed: () {}),
        throwsAssertionError,
      );
      expect(
        () => AppButton(onPressed: () {}, child: const Text('x')),
        throwsAssertionError,
      );
    });

    test('label alone satisfies the semanticLabel requirement', () {
      expect(() => const AppButton(label: 'Save'), returnsNormally);
    });
  });
}
