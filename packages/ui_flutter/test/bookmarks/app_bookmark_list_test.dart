import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_ui/app_ui.dart';

const List<BookmarkEntry> _sample = <BookmarkEntry>[
  BookmarkEntry(id: 'a', time: 60, label: 'Intro'),
  BookmarkEntry(id: 'b', time: 305, label: 'Worked example'),
  BookmarkEntry(id: 'c', time: 612),
];

Future<void> _pump(WidgetTester tester, Widget child, {ThemeData? theme}) =>
    tester.pumpWidget(
      MaterialApp(
        theme: theme ?? AppTheme.light(),
        home: Scaffold(body: Center(child: child)),
      ),
    );

void main() {
  group('AppBookmarkList', () {
    testWidgets('renders one AppBookmark per entry', (tester) async {
      await _pump(tester, const AppBookmarkList(bookmarks: _sample));
      expect(find.byType(AppBookmark), findsNWidgets(3));
      expect(find.text('Intro'), findsOneWidget);
      expect(find.text('Worked example'), findsOneWidget);
      expect(find.text('10:12'), findsOneWidget);
    });

    testWidgets('renders the empty state when no bookmarks and no add row', (
      tester,
    ) async {
      await _pump(tester, const AppBookmarkList(bookmarks: <BookmarkEntry>[]));
      expect(find.byType(AppEmptyState), findsOneWidget);
      expect(find.text('No bookmarks yet'), findsOneWidget);
      expect(
        find.text('Add a bookmark from the player to mark a moment for later.'),
        findsOneWidget,
      );
      expect(find.byType(AppBookmarkAdd), findsNothing);
    });

    testWidgets('honours the emptyTitle / emptyBody overrides', (tester) async {
      await _pump(
        tester,
        const AppBookmarkList(
          bookmarks: <BookmarkEntry>[],
          emptyTitle: 'Nothing marked',
          emptyBody: 'Custom body copy.',
        ),
      );
      expect(find.text('Nothing marked'), findsOneWidget);
      expect(find.text('Custom body copy.'), findsOneWidget);
      expect(find.text('No bookmarks yet'), findsNothing);
    });

    testWidgets('omits the empty state when an add row is shown', (
      tester,
    ) async {
      await _pump(
        tester,
        const AppBookmarkList(bookmarks: <BookmarkEntry>[], addTime: 90),
      );
      expect(find.byType(AppEmptyState), findsNothing);
      expect(find.byType(AppBookmarkAdd), findsOneWidget);
    });

    testWidgets('omits the add row when addTime is null', (tester) async {
      await _pump(tester, const AppBookmarkList(bookmarks: _sample));
      expect(find.byType(AppBookmarkAdd), findsNothing);
    });

    testWidgets('mounts the add row above the list when addTime is provided', (
      tester,
    ) async {
      await _pump(
        tester,
        const AppBookmarkList(bookmarks: _sample, addTime: 90),
      );
      expect(find.byType(AppBookmarkAdd), findsOneWidget);
      expect(find.byType(AppBookmark), findsNWidgets(3));
      expect(
        tester.getTopLeft(find.byType(AppBookmarkAdd)).dy,
        lessThan(tester.getTopLeft(find.byType(AppBookmark).first).dy),
      );
    });

    testWidgets('forwards adding to the add row as submitting', (tester) async {
      await _pump(
        tester,
        const AppBookmarkList(
          bookmarks: <BookmarkEntry>[],
          addTime: 90,
          adding: true,
        ),
      );
      expect(
        tester.widget<AppBookmarkAdd>(find.byType(AppBookmarkAdd)).submitting,
        isTrue,
      );
    });

    testWidgets('emits onSelect with the entry id when a row is tapped', (
      tester,
    ) async {
      final List<String> selected = <String>[];
      await _pump(
        tester,
        AppBookmarkList(bookmarks: _sample, onSelect: selected.add),
      );
      await tester.tap(find.text('1:00'));
      expect(selected, <String>['a']);
    });

    testWidgets('emits onEdit with the entry id', (tester) async {
      final handle = tester.ensureSemantics();
      final List<String> edited = <String>[];
      await _pump(
        tester,
        AppBookmarkList(bookmarks: _sample, onEdit: edited.add),
      );
      await tester.tap(find.bySemanticsLabel('Edit bookmark').at(1));
      expect(edited, <String>['b']);
      handle.dispose();
    });

    testWidgets('emits onDelete with the entry id', (tester) async {
      final handle = tester.ensureSemantics();
      final List<String> deleted = <String>[];
      await _pump(
        tester,
        AppBookmarkList(bookmarks: _sample, onDelete: deleted.add),
      );
      await tester.tap(find.bySemanticsLabel('Delete bookmark').at(2));
      expect(deleted, <String>['c']);
      handle.dispose();
    });

    testWidgets('hides row actions when editable=false', (tester) async {
      final handle = tester.ensureSemantics();
      await _pump(
        tester,
        const AppBookmarkList(bookmarks: _sample, editable: false),
      );
      expect(find.bySemanticsLabel('Edit bookmark'), findsNothing);
      expect(find.bySemanticsLabel('Delete bookmark'), findsNothing);
      handle.dispose();
    });

    testWidgets('forwards onAddSave from the add row', (tester) async {
      BookmarkDraft? saved;
      await _pump(
        tester,
        AppBookmarkList(
          bookmarks: const <BookmarkEntry>[],
          addTime: 305,
          onAddSave: (draft) => saved = draft,
        ),
      );
      await tester.enterText(find.byType(TextField), 'Recap');
      await tester.testTextInput.receiveAction(TextInputAction.done);
      expect(saved, const BookmarkDraft(time: 305, label: 'Recap'));
    });

    testWidgets('forwards onAddCancel from the add row', (tester) async {
      var cancelled = 0;
      await _pump(
        tester,
        AppBookmarkList(
          bookmarks: const <BookmarkEntry>[],
          addTime: 305,
          onAddCancel: () => cancelled++,
        ),
      );
      await tester.tap(find.byType(TextField));
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pump();
      expect(cancelled, 1);
    });
  });

  group('BookmarkEntry', () {
    test('defaults label to an empty string', () {
      const entry = BookmarkEntry(id: 'a', time: 60);
      expect(entry.label, '');
    });

    test('is a value type', () {
      const a = BookmarkEntry(id: 'a', time: 60, label: 'Intro');
      const b = BookmarkEntry(id: 'a', time: 60, label: 'Intro');
      const c = BookmarkEntry(id: 'b', time: 60, label: 'Intro');
      expect(a, b);
      expect(a.hashCode, b.hashCode);
      expect(a, isNot(c));
    });
  });
}
