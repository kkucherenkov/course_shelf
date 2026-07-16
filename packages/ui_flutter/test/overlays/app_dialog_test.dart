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
  group('AppDialog', () {
    testWidgets('renders the title', (tester) async {
      await _pump(tester, const AppDialog(title: 'Dialog title'));
      expect(find.text('Dialog title'), findsOneWidget);
    });

    testWidgets('renders the description when provided', (tester) async {
      await _pump(
        tester,
        const AppDialog(title: 'Dialog title', description: 'Supporting copy.'),
      );
      expect(find.text('Supporting copy.'), findsOneWidget);
    });

    testWidgets('omits the description row when not provided', (tester) async {
      await _pump(tester, const AppDialog(title: 'Dialog title'));
      expect(
        find.byKey(const ValueKey<String>('appDialogDescription')),
        findsNothing,
      );
    });

    testWidgets('renders the body slot content', (tester) async {
      await _pump(
        tester,
        const AppDialog(title: 'Dialog title', child: Text('Body copy')),
      );
      expect(find.text('Body copy'), findsOneWidget);
    });

    testWidgets('omits the body slot when child is null', (tester) async {
      await _pump(tester, const AppDialog(title: 'Dialog title'));
      expect(find.byKey(const ValueKey<String>('appDialogBody')), findsNothing);
    });

    testWidgets('renders footer actions, gap-spaced, right aligned', (
      tester,
    ) async {
      await _pump(
        tester,
        AppDialog(
          title: 'Dialog title',
          actions: <Widget>[
            AppButton(label: 'Cancel', onPressed: () {}),
            AppButton(label: 'Confirm', onPressed: () {}),
          ],
        ),
      );
      expect(find.widgetWithText(AppButton, 'Cancel'), findsOneWidget);
      expect(find.widgetWithText(AppButton, 'Confirm'), findsOneWidget);
    });

    testWidgets('omits the footer when actions is null', (tester) async {
      await _pump(tester, const AppDialog(title: 'Dialog title'));
      expect(
        find.byKey(const ValueKey<String>('appDialogFooter')),
        findsNothing,
      );
    });

    testWidgets('shows the dismiss button by default and fires onDismiss', (
      tester,
    ) async {
      var dismissed = false;
      await _pump(
        tester,
        AppDialog(title: 'Dialog title', onDismiss: () => dismissed = true),
      );
      expect(find.byType(AppIconButton), findsOneWidget);
      await tester.tap(find.byType(AppIconButton));
      expect(dismissed, isTrue);
    });

    testWidgets('hides the dismiss button when dismissible is false', (
      tester,
    ) async {
      await _pump(
        tester,
        const AppDialog(title: 'Dialog title', dismissible: false),
      );
      expect(find.byType(AppIconButton), findsNothing);
    });

    testWidgets('sm size constrains the panel to 480 logical pixels', (
      tester,
    ) async {
      await _pump(
        tester,
        const AppDialog(title: 'Dialog title', size: AppDialogSize.sm),
      );
      final constraints = tester
          .widget<ConstrainedBox>(
            find.byKey(const ValueKey<String>('appDialogPanel')),
          )
          .constraints;
      expect(constraints.maxWidth, 480);
    });

    testWidgets('md size constrains the panel to 640 logical pixels', (
      tester,
    ) async {
      await _pump(tester, const AppDialog(title: 'Dialog title'));
      final constraints = tester
          .widget<ConstrainedBox>(
            find.byKey(const ValueKey<String>('appDialogPanel')),
          )
          .constraints;
      expect(constraints.maxWidth, 640);
    });
  });
}
