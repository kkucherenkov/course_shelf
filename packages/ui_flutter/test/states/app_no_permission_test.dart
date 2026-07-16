import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_ui/app_ui.dart';

Future<void> _pump(WidgetTester tester, Widget child) => tester.pumpWidget(
  MaterialApp(
    theme: AppTheme.light(),
    home: Scaffold(body: Center(child: child)),
  ),
);

void main() {
  group('AppNoPermission', () {
    testWidgets('renders the title', (tester) async {
      await _pump(tester, const AppNoPermission(title: 'Access restricted'));
      expect(find.text('Access restricted'), findsOneWidget);
    });

    testWidgets('renders the message when provided', (tester) async {
      await _pump(
        tester,
        const AppNoPermission(
          title: 'Access restricted',
          message: 'You do not have permission to view this content.',
        ),
      );
      expect(
        find.text('You do not have permission to view this content.'),
        findsOneWidget,
      );
    });

    testWidgets('omits the message widget when not provided', (tester) async {
      await _pump(tester, const AppNoPermission(title: 'Access restricted'));
      expect(
        find.descendant(
          of: find.byType(AppNoPermission),
          matching: find.byType(ConstrainedBox),
        ),
        findsNothing,
      );
    });

    testWidgets('renders the default lock icon', (tester) async {
      await _pump(tester, const AppNoPermission(title: 'Access restricted'));
      final icon = tester.widget<IconCS>(find.byType(IconCS));
      expect(icon.name, IconName.lock);
    });

    testWidgets('renders a custom icon when provided', (tester) async {
      await _pump(
        tester,
        const AppNoPermission(title: 'Premium content', icon: IconName.shield),
      );
      final icon = tester.widget<IconCS>(find.byType(IconCS));
      expect(icon.name, IconName.shield);
    });

    testWidgets('renders the action and fires its callback when present', (
      tester,
    ) async {
      var taps = 0;
      await _pump(
        tester,
        AppNoPermission(
          title: 'Access restricted',
          action: AppButton(label: 'Log in', onPressed: () => taps++),
        ),
      );
      expect(find.widgetWithText(AppButton, 'Log in'), findsOneWidget);
      await tester.tap(find.byType(AppButton));
      expect(taps, 1);
    });

    testWidgets('is decorative — omits the action area when absent', (
      tester,
    ) async {
      await _pump(tester, const AppNoPermission(title: 'Access restricted'));
      expect(find.byType(AppButton), findsNothing);
    });
  });
}
