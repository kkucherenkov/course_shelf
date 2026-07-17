import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
  group('AppBookmarkAdd', () {
    testWidgets('renders the time chip with M:SS formatting', (tester) async {
      await _pump(tester, const AppBookmarkAdd(time: 305));
      expect(find.text('5:05'), findsOneWidget);
    });

    testWidgets(
      'emits onSave with the trimmed label and current time when Save is '
      'tapped',
      (tester) async {
        BookmarkDraft? saved;
        await _pump(
          tester,
          AppBookmarkAdd(time: 90, onSave: (draft) => saved = draft),
        );
        await tester.enterText(find.byType(TextField), '  Quorum recap  ');
        await tester.tap(find.text('Save'));
        expect(saved, const BookmarkDraft(time: 90, label: 'Quorum recap'));
      },
    );

    testWidgets('saves with an empty label when none is typed', (tester) async {
      BookmarkDraft? saved;
      await _pump(
        tester,
        AppBookmarkAdd(time: 42, onSave: (draft) => saved = draft),
      );
      await tester.tap(find.text('Save'));
      expect(saved, const BookmarkDraft(time: 42, label: ''));
    });

    testWidgets('clears the label after a save', (tester) async {
      await _pump(tester, const AppBookmarkAdd(time: 90));
      await tester.enterText(find.byType(TextField), 'Recap');
      await tester.tap(find.text('Save'));
      await tester.pump();
      expect(
        tester.widget<TextField>(find.byType(TextField)).controller!.text,
        '',
      );
    });

    testWidgets('Enter inside the field fires onSave', (tester) async {
      BookmarkDraft? saved;
      await _pump(
        tester,
        AppBookmarkAdd(time: 90, onSave: (draft) => saved = draft),
      );
      await tester.enterText(find.byType(TextField), 'From keyboard');
      await tester.testTextInput.receiveAction(TextInputAction.done);
      expect(saved, const BookmarkDraft(time: 90, label: 'From keyboard'));
    });

    testWidgets('Escape inside the field emits onCancel and clears the label', (
      tester,
    ) async {
      var cancelled = 0;
      await _pump(
        tester,
        AppBookmarkAdd(time: 90, onCancel: () => cancelled++),
      );
      await tester.enterText(find.byType(TextField), 'Discard me');
      await tester.tap(find.byType(TextField));
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pump();
      expect(cancelled, 1);
      expect(
        tester.widget<TextField>(find.byType(TextField)).controller!.text,
        '',
      );
    });

    testWidgets('does not emit onSave while submitting=true', (tester) async {
      var saved = 0;
      await _pump(
        tester,
        AppBookmarkAdd(time: 90, submitting: true, onSave: (_) => saved++),
      );
      await tester.enterText(find.byType(TextField), 'In flight');
      await tester.testTextInput.receiveAction(TextInputAction.done);
      expect(saved, 0);
    });

    testWidgets('disables the field while submitting', (tester) async {
      await _pump(tester, const AppBookmarkAdd(time: 90, submitting: true));
      final field = tester.widget<TextField>(find.byType(TextField));
      expect(field.enabled, isFalse);
    });

    testWidgets('renders a cancel control with an accessible label', (
      tester,
    ) async {
      await _pump(tester, const AppBookmarkAdd(time: 90));
      expect(find.byType(AppIconButton), findsOneWidget);
      expect(
        tester.widget<AppIconButton>(find.byType(AppIconButton)).name,
        IconName.x,
      );
      expect(find.bySemanticsLabel('Cancel adding bookmark'), findsOneWidget);
    });

    testWidgets('the cancel label is overridable', (tester) async {
      await _pump(
        tester,
        const AppBookmarkAdd(time: 90, cancelLabel: 'Discard draft'),
      );
      expect(find.bySemanticsLabel('Discard draft'), findsOneWidget);
    });

    testWidgets('tapping cancel emits onCancel and clears the label', (
      tester,
    ) async {
      var cancelled = 0;
      await _pump(
        tester,
        AppBookmarkAdd(time: 90, onCancel: () => cancelled++),
      );
      await tester.enterText(find.byType(TextField), 'Discard me');
      await tester.tap(find.byType(AppIconButton));
      await tester.pump();
      expect(cancelled, 1);
      expect(
        tester.widget<TextField>(find.byType(TextField)).controller!.text,
        '',
      );
    });

    testWidgets('disables the cancel control while submitting', (tester) async {
      var cancelled = 0;
      await _pump(
        tester,
        AppBookmarkAdd(time: 90, submitting: true, onCancel: () => cancelled++),
      );
      expect(
        tester.widget<AppIconButton>(find.byType(AppIconButton)).disabled,
        isTrue,
      );
      await tester.tap(find.byType(AppIconButton), warnIfMissed: false);
      await tester.pump();
      expect(cancelled, 0);
    });

    testWidgets('does not emit onCancel on Escape while submitting', (
      tester,
    ) async {
      var cancelled = 0;
      await _pump(
        tester,
        AppBookmarkAdd(time: 90, submitting: true, onCancel: () => cancelled++),
      );
      await tester.tap(find.byType(TextField), warnIfMissed: false);
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pump();
      expect(cancelled, 0);
    });
  });
}
