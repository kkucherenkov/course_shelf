import 'package:flutter/material.dart';
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
  group('AppBookmark', () {
    testWidgets('formats time as M:SS in the time chip', (tester) async {
      await _pump(
        tester,
        const AppBookmark(time: 305, label: 'Quorum reads worked example'),
      );
      expect(find.text('5:05'), findsOneWidget);
    });

    testWidgets('formats hour-long times as H:MM:SS', (tester) async {
      await _pump(tester, const AppBookmark(time: 3725));
      expect(find.text('1:02:05'), findsOneWidget);
    });

    testWidgets('renders the label text', (tester) async {
      await _pump(
        tester,
        const AppBookmark(time: 305, label: 'Quorum reads worked example'),
      );
      expect(find.text('Quorum reads worked example'), findsOneWidget);
    });

    testWidgets('exposes a descriptive semantics label with a label', (
      tester,
    ) async {
      final handle = tester.ensureSemantics();
      await _pump(
        tester,
        const AppBookmark(time: 305, label: 'Quorum reads worked example'),
      );
      expect(
        tester.getSemantics(find.byType(AppBookmark)),
        matchesSemantics(
          isButton: true,
          label: 'Bookmark at 5:05: Quorum reads worked example',
        ),
      );
      handle.dispose();
    });

    testWidgets('falls back to a time-only semantics label with no label', (
      tester,
    ) async {
      final handle = tester.ensureSemantics();
      await _pump(tester, const AppBookmark(time: 60));
      expect(
        tester.getSemantics(find.byType(AppBookmark)),
        matchesSemantics(isButton: true, label: 'Bookmark at 1:00'),
      );
      handle.dispose();
    });

    testWidgets('renders the edit + delete actions when editable (default)', (
      tester,
    ) async {
      final handle = tester.ensureSemantics();
      await _pump(tester, const AppBookmark(time: 305));
      expect(find.bySemanticsLabel('Edit bookmark'), findsOneWidget);
      expect(find.bySemanticsLabel('Delete bookmark'), findsOneWidget);
      handle.dispose();
    });

    testWidgets('omits the action row when editable=false', (tester) async {
      final handle = tester.ensureSemantics();
      await _pump(tester, const AppBookmark(time: 305, editable: false));
      expect(find.bySemanticsLabel('Edit bookmark'), findsNothing);
      expect(find.bySemanticsLabel('Delete bookmark'), findsNothing);
      handle.dispose();
    });

    testWidgets('emits onSelect when the row is tapped', (tester) async {
      var selected = 0;
      await _pump(tester, AppBookmark(time: 305, onSelect: () => selected++));
      await tester.tap(find.text('5:05'));
      expect(selected, 1);
    });

    testWidgets(
      'edit / delete fire their own callback and never bubble select',
      (tester) async {
        final handle = tester.ensureSemantics();
        var selected = 0;
        var edited = 0;
        var deleted = 0;
        await _pump(
          tester,
          AppBookmark(
            time: 305,
            onSelect: () => selected++,
            onEdit: () => edited++,
            onDelete: () => deleted++,
          ),
        );
        await tester.tap(find.bySemanticsLabel('Edit bookmark'));
        await tester.tap(find.bySemanticsLabel('Delete bookmark'));
        expect(edited, 1);
        expect(deleted, 1);
        expect(selected, 0);
        handle.dispose();
      },
    );
  });
}
