import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_ui/app_ui.dart';

Future<void> _pump(WidgetTester tester, Widget child) => tester.pumpWidget(
  MaterialApp(
    theme: AppTheme.light(),
    home: Scaffold(body: Center(child: child)),
  ),
);

void main() {
  group('AppEmptyState', () {
    testWidgets('renders the title', (tester) async {
      await _pump(tester, const AppEmptyState(title: 'No courses yet'));
      expect(find.text('No courses yet'), findsOneWidget);
    });

    testWidgets('renders the message when provided', (tester) async {
      await _pump(
        tester,
        const AppEmptyState(
          title: 'No courses yet',
          message: 'Add your first course to get started.',
        ),
      );
      expect(
        find.text('Add your first course to get started.'),
        findsOneWidget,
      );
    });

    testWidgets('omits the message widget when not provided', (tester) async {
      await _pump(tester, const AppEmptyState(title: 'No courses yet'));
      expect(
        find.descendant(
          of: find.byType(AppEmptyState),
          matching: find.byType(ConstrainedBox),
        ),
        findsNothing,
      );
    });

    testWidgets('renders the default folder icon', (tester) async {
      await _pump(tester, const AppEmptyState(title: 'No courses yet'));
      final icon = tester.widget<IconCS>(find.byType(IconCS));
      expect(icon.name, IconName.folder);
    });

    testWidgets('renders a custom icon when provided', (tester) async {
      await _pump(
        tester,
        const AppEmptyState(title: 'No bookmarks', icon: IconName.bookmark),
      );
      final icon = tester.widget<IconCS>(find.byType(IconCS));
      expect(icon.name, IconName.bookmark);
    });

    testWidgets('renders the action and fires its callback when present', (
      tester,
    ) async {
      var taps = 0;
      await _pump(
        tester,
        AppEmptyState(
          title: 'No courses yet',
          action: AppButton(label: 'Add course', onPressed: () => taps++),
        ),
      );
      expect(find.widgetWithText(AppButton, 'Add course'), findsOneWidget);
      await tester.tap(find.byType(AppButton));
      expect(taps, 1);
    });

    testWidgets('omits the action area when absent', (tester) async {
      await _pump(tester, const AppEmptyState(title: 'No courses yet'));
      expect(find.byType(AppButton), findsNothing);
    });

    testWidgets('is announced as a polite status region', (tester) async {
      await _pump(tester, const AppEmptyState(title: 'No courses yet'));
      final semantics = tester.getSemantics(find.byType(AppEmptyState));
      expect(semantics.role, SemanticsRole.status);
    });
  });
}
