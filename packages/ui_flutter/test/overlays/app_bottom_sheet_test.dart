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
  group('AppBottomSheet', () {
    testWidgets('renders the title when provided', (tester) async {
      await _pump(tester, const AppBottomSheet(title: 'Sheet title'));
      expect(find.text('Sheet title'), findsOneWidget);
    });

    testWidgets('renders the body slot content', (tester) async {
      await _pump(
        tester,
        const AppBottomSheet(title: 'Sheet title', child: Text('Body copy')),
      );
      expect(find.text('Body copy'), findsOneWidget);
    });

    testWidgets('omits the body slot when child is null', (tester) async {
      await _pump(tester, const AppBottomSheet(title: 'Sheet title'));
      expect(
        find.byKey(const ValueKey<String>('appBottomSheetBody')),
        findsNothing,
      );
    });

    testWidgets('renders footer actions, gap-spaced, right aligned', (
      tester,
    ) async {
      await _pump(
        tester,
        AppBottomSheet(
          title: 'Sheet title',
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
      await _pump(tester, const AppBottomSheet(title: 'Sheet title'));
      expect(
        find.byKey(const ValueKey<String>('appBottomSheetFooter')),
        findsNothing,
      );
    });

    testWidgets('shows the grab handle by default', (tester) async {
      await _pump(tester, const AppBottomSheet(title: 'Sheet title'));
      expect(
        find.byKey(const ValueKey<String>('appBottomSheetHandle')),
        findsOneWidget,
      );
    });

    testWidgets('hides the grab handle when showHandle is false', (
      tester,
    ) async {
      await _pump(
        tester,
        const AppBottomSheet(title: 'Sheet title', showHandle: false),
      );
      expect(
        find.byKey(const ValueKey<String>('appBottomSheetHandle')),
        findsNothing,
      );
    });

    testWidgets('shows the dismiss button by default and fires onDismiss', (
      tester,
    ) async {
      var dismissed = false;
      await _pump(
        tester,
        AppBottomSheet(title: 'Sheet title', onDismiss: () => dismissed = true),
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
        const AppBottomSheet(title: 'Sheet title', dismissible: false),
      );
      expect(find.byType(AppIconButton), findsNothing);
    });

    testWidgets('omits the header entirely with no title and not dismissible', (
      tester,
    ) async {
      await _pump(
        tester,
        const AppBottomSheet(dismissible: false, child: Text('Body only')),
      );
      expect(
        find.byKey(const ValueKey<String>('appBottomSheetHeader')),
        findsNothing,
      );
    });
  });
}
