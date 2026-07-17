import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_ui/app_ui.dart';

Future<void> _pump(WidgetTester tester, Widget child, {ThemeData? theme}) =>
    tester.pumpWidget(
      MaterialApp(
        theme: theme ?? AppTheme.light(),
        home: Scaffold(body: Center(child: child)),
      ),
    );

void main() {
  group('AppNoteEditor', () {
    group('mode', () {
      testWidgets('renders a TextField in edit mode (default)', (tester) async {
        await _pump(tester, const AppNoteEditor(modelValue: 'hi'));
        expect(find.byType(TextField), findsOneWidget);
      });

      testWidgets('renders the markdown preview in view mode', (tester) async {
        await _pump(
          tester,
          const AppNoteEditor(modelValue: '**bold**', mode: AppNoteMode.view),
        );
        expect(find.byType(TextField), findsNothing);
        final richText = tester.widgetList<Text>(find.byType(Text));
        expect(richText.any((t) => t.textSpan?.toPlainText() == 'bold'), true);
      });

      testWidgets('emits onModeChanged when the toggle is tapped', (
        tester,
      ) async {
        AppNoteMode? changed;
        await _pump(
          tester,
          AppNoteEditor(
            modelValue: '',
            onModeChanged: (mode) => changed = mode,
          ),
        );
        await tester.tap(find.text('Preview'));
        expect(changed, AppNoteMode.view);
      });

      testWidgets('disables every toolbar tool in view mode', (tester) async {
        final handle = tester.ensureSemantics();
        await _pump(
          tester,
          const AppNoteEditor(modelValue: '', mode: AppNoteMode.view),
        );
        for (final label in ['Bold', 'Italic', 'Heading', 'List', 'Link']) {
          expect(
            tester.getSemantics(find.bySemanticsLabel(label)),
            matchesSemantics(
              label: label,
              isButton: true,
              hasEnabledState: true,
              isEnabled: false,
            ),
            reason: label,
          );
        }
        handle.dispose();
      });

      // Guards #176: the old `_toolButton` wrapped its AppButton in
      // `Semantics(...) + ExcludeSemantics(child: AppButton)`, which stranded
      // the label on an action-less parent — a named button a screen reader
      // could not activate. `tester.tap` never caught it (it drives
      // hit-testing, not the semantics layer). Assert the tap/focus actions
      // ride on the SAME node as the label, in edit mode.
      testWidgets('each toolbar tool is a tappable, focusable, named button in '
          'edit mode', (tester) async {
        final handle = tester.ensureSemantics();
        await _pump(
          tester,
          AppNoteEditor(modelValue: '', mode: AppNoteMode.edit, onChanged: (_) {}),
        );
        for (final label in ['Bold', 'Italic', 'Heading', 'List', 'Link']) {
          expect(
            tester.getSemantics(find.bySemanticsLabel(label)),
            matchesSemantics(
              label: label,
              isButton: true,
              hasEnabledState: true,
              isEnabled: true,
              isFocusable: true,
              hasTapAction: true,
              hasFocusAction: true,
            ),
            reason: label,
          );
        }
        handle.dispose();
      });

      // #176, same file: the Edit/Preview mode toggle used the identical
      // wrapper (plus a `toggled` state), so it too was a named-but-inert
      // control. It must carry the tap action on the toggled node.
      testWidgets('the mode toggle is a tappable toggled button', (
        tester,
      ) async {
        final handle = tester.ensureSemantics();
        await _pump(
          tester,
          const AppNoteEditor(modelValue: '', mode: AppNoteMode.view),
        );
        final node = tester
            .getSemantics(find.bySemanticsLabel('Edit'))
            .getSemanticsData();
        expect(node.label, 'Edit');
        expect(node.hasFlag(SemanticsFlag.isButton), isTrue);
        expect(node.hasFlag(SemanticsFlag.isToggled), isTrue);
        expect(
          node.hasAction(SemanticsAction.tap),
          isTrue,
          reason: 'a screen reader must be able to activate the mode toggle',
        );
        handle.dispose();
      });
    });

    group('toolbar actions', () {
      testWidgets('Bold wraps the current selection with **…**', (
        tester,
      ) async {
        String? next;
        await _pump(
          tester,
          AppNoteEditor(
            modelValue: 'hello world',
            onChanged: (value) => next = value,
          ),
        );
        final controller = tester
            .widget<TextField>(find.byType(TextField))
            .controller!;
        controller.selection = const TextSelection(
          baseOffset: 0,
          extentOffset: 5,
        );
        await tester.tap(find.bySemanticsLabel('Bold'));
        expect(next, '**hello** world');
      });

      testWidgets('Italic wraps the current selection with single *', (
        tester,
      ) async {
        String? next;
        await _pump(
          tester,
          AppNoteEditor(modelValue: 'hi', onChanged: (value) => next = value),
        );
        final controller = tester
            .widget<TextField>(find.byType(TextField))
            .controller!;
        controller.selection = const TextSelection(
          baseOffset: 0,
          extentOffset: 2,
        );
        await tester.tap(find.bySemanticsLabel('Italic'));
        expect(next, '*hi*');
      });

      testWidgets('Heading inserts "# " at the start of the current line', (
        tester,
      ) async {
        String? next;
        await _pump(
          tester,
          AppNoteEditor(
            modelValue: 'first\nsecond',
            onChanged: (value) => next = value,
          ),
        );
        final controller = tester
            .widget<TextField>(find.byType(TextField))
            .controller!;
        controller.selection = const TextSelection.collapsed(offset: 8);
        await tester.tap(find.bySemanticsLabel('Heading'));
        expect(next, 'first\n# second');
      });

      testWidgets('List inserts "- " at the start of the current line', (
        tester,
      ) async {
        String? next;
        await _pump(
          tester,
          AppNoteEditor(modelValue: 'item', onChanged: (value) => next = value),
        );
        final controller = tester
            .widget<TextField>(find.byType(TextField))
            .controller!;
        controller.selection = const TextSelection.collapsed(offset: 2);
        await tester.tap(find.bySemanticsLabel('List'));
        expect(next, '- item');
      });

      testWidgets('Link wraps the selection with [sel](url)', (tester) async {
        String? next;
        await _pump(
          tester,
          AppNoteEditor(
            modelValue: 'see docs',
            onChanged: (value) => next = value,
          ),
        );
        final controller = tester
            .widget<TextField>(find.byType(TextField))
            .controller!;
        controller.selection = const TextSelection(
          baseOffset: 4,
          extentOffset: 8,
        );
        await tester.tap(find.bySemanticsLabel('Link'));
        expect(next, 'see [docs](url)');
      });

      testWidgets('Link inserts placeholder text when nothing is selected', (
        tester,
      ) async {
        String? next;
        await _pump(
          tester,
          AppNoteEditor(
            modelValue: 'before',
            onChanged: (value) => next = value,
          ),
        );
        final controller = tester
            .widget<TextField>(find.byType(TextField))
            .controller!;
        controller.selection = const TextSelection.collapsed(offset: 6);
        await tester.tap(find.bySemanticsLabel('Link'));
        expect(next, 'before[link](url)');
      });
    });

    group('editing', () {
      testWidgets('typing in the field emits onChanged', (tester) async {
        String? seen;
        await _pump(
          tester,
          AppNoteEditor(modelValue: '', onChanged: (value) => seen = value),
        );
        await tester.enterText(find.byType(TextField), 'typed note');
        expect(seen, 'typed note');
      });
    });

    group('markdown renderer', () {
      testWidgets('renders #/##/### as sized headings', (tester) async {
        await _pump(
          tester,
          const AppNoteEditor(
            modelValue: '# One\n\n## Two\n\n### Three',
            mode: AppNoteMode.view,
          ),
        );
        expect(find.text('One'), findsOneWidget);
        expect(find.text('Two'), findsOneWidget);
        expect(find.text('Three'), findsOneWidget);
      });

      testWidgets('renders consecutive "- " lines as bullet items', (
        tester,
      ) async {
        await _pump(
          tester,
          const AppNoteEditor(
            modelValue: '- one\n- two\n- three',
            mode: AppNoteMode.view,
          ),
        );
        expect(find.textContaining('one'), findsOneWidget);
        expect(find.textContaining('two'), findsOneWidget);
        expect(find.textContaining('three'), findsOneWidget);
      });

      testWidgets('renders **bold** and *italic* inline within a paragraph', (
        tester,
      ) async {
        await _pump(
          tester,
          const AppNoteEditor(
            modelValue: 'a **b** *c* d',
            mode: AppNoteMode.view,
          ),
        );
        final Iterable<TextSpan> spans = tester
            .widgetList<Text>(find.byType(Text))
            .map((t) => t.textSpan)
            .whereType<TextSpan>()
            .expand((s) => s.children ?? const <InlineSpan>[])
            .whereType<TextSpan>();
        expect(
          spans.any(
            (s) =>
                s.text == 'b' && s.style?.fontWeight == AppFontWeight.semibold,
          ),
          true,
        );
        expect(
          spans.any(
            (s) => s.text == 'c' && s.style?.fontStyle == FontStyle.italic,
          ),
          true,
        );
      });
    });

    group('debounced save', () {
      testWidgets('emits onSave once after debounceMs of quiet', (
        tester,
      ) async {
        var saves = 0;
        String? lastSaved;
        Widget build(String value) => AppNoteEditor(
          modelValue: value,
          debounceMs: 600,
          onSave: (v) {
            saves++;
            lastSaved = v;
          },
        );
        await _pump(tester, build(''));
        await _pump(tester, build('a'));
        await tester.pump(const Duration(milliseconds: 300));
        await _pump(tester, build('ab'));
        await tester.pump(const Duration(milliseconds: 300));
        expect(saves, 0);
        await tester.pump(const Duration(milliseconds: 300));
        expect(saves, 1);
        expect(lastSaved, 'ab');
      });

      testWidgets('does not fire save after the widget is disposed', (
        tester,
      ) async {
        var saves = 0;
        Widget build(String value) => AppNoteEditor(
          modelValue: value,
          debounceMs: 600,
          onSave: (_) => saves++,
        );
        await _pump(tester, build(''));
        await _pump(tester, build('pending'));
        await tester.pumpWidget(const SizedBox());
        await tester.pump(const Duration(seconds: 1));
        expect(saves, 0);
      });
    });

    group('sync indicator', () {
      testWidgets('shows the bare "Saved" label when savedAt is missing', (
        tester,
      ) async {
        await _pump(
          tester,
          const AppNoteEditor(
            modelValue: '',
            syncState: AppNoteSyncState.saved,
          ),
        );
        expect(find.text('Saved'), findsOneWidget);
      });

      testWidgets('formats "Saved · Nm ago" from savedAt', (tester) async {
        await _pump(
          tester,
          AppNoteEditor(
            modelValue: '',
            syncState: AppNoteSyncState.saved,
            savedAt: DateTime.now().subtract(const Duration(minutes: 5)),
          ),
        );
        expect(find.text('Saved · 5m ago'), findsOneWidget);
      });

      testWidgets('shows Syncing… / Failed — retrying / Offline — queued', (
        tester,
      ) async {
        await _pump(
          tester,
          const AppNoteEditor(
            modelValue: '',
            syncState: AppNoteSyncState.syncing,
          ),
        );
        expect(find.textContaining('Syncing'), findsOneWidget);

        await _pump(
          tester,
          const AppNoteEditor(
            modelValue: '',
            syncState: AppNoteSyncState.failed,
          ),
        );
        expect(find.textContaining('Failed'), findsOneWidget);

        await _pump(
          tester,
          const AppNoteEditor(
            modelValue: '',
            syncState: AppNoteSyncState.offline,
          ),
        );
        expect(find.textContaining('Offline'), findsOneWidget);
      });

      testWidgets('emits onRetry when Retry is tapped in failed state', (
        tester,
      ) async {
        var retries = 0;
        await _pump(
          tester,
          AppNoteEditor(
            modelValue: '',
            syncState: AppNoteSyncState.failed,
            onRetry: () => retries++,
          ),
        );
        await tester.tap(find.text('Retry'));
        expect(retries, 1);
      });
    });
  });
}
