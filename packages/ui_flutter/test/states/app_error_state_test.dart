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
  group('AppErrorState', () {
    testWidgets('renders the title', (tester) async {
      await _pump(tester, const AppErrorState(title: 'Failed to load'));
      expect(find.text('Failed to load'), findsOneWidget);
    });

    testWidgets('renders the message when provided', (tester) async {
      await _pump(
        tester,
        const AppErrorState(
          title: 'Failed to load',
          message: 'Please try again later.',
        ),
      );
      expect(find.text('Please try again later.'), findsOneWidget);
    });

    testWidgets('omits the message widget when not provided', (tester) async {
      await _pump(tester, const AppErrorState(title: 'Failed to load'));
      expect(
        find.descendant(
          of: find.byType(AppErrorState),
          matching: find.byType(ConstrainedBox),
        ),
        findsNothing,
      );
    });

    testWidgets('renders the default alert icon', (tester) async {
      await _pump(tester, const AppErrorState(title: 'Failed to load'));
      final icon = tester.widget<IconCS>(find.byType(IconCS));
      expect(icon.name, IconName.alert);
    });

    testWidgets('renders a custom icon when provided', (tester) async {
      await _pump(
        tester,
        const AppErrorState(title: 'Connection lost', icon: IconName.wifiOff),
      );
      final icon = tester.widget<IconCS>(find.byType(IconCS));
      expect(icon.name, IconName.wifiOff);
    });

    testWidgets('tints the icon and title with the error colour', (
      tester,
    ) async {
      late BuildContext capturedContext;
      await _pump(
        tester,
        Builder(
          builder: (context) {
            capturedContext = context;
            return const AppErrorState(title: 'Failed to load');
          },
        ),
      );
      final cs = Theme.of(capturedContext).colorScheme;
      final icon = tester.widget<IconCS>(find.byType(IconCS));
      expect(icon.color, cs.error);
      final title = tester.widget<Text>(find.text('Failed to load'));
      expect(title.style?.color, cs.error);
    });

    testWidgets('renders the retry action and fires its callback when '
        'present', (tester) async {
      var taps = 0;
      await _pump(
        tester,
        AppErrorState(
          title: 'Failed to load',
          action: AppButton(label: 'Retry', onPressed: () => taps++),
        ),
      );
      expect(find.widgetWithText(AppButton, 'Retry'), findsOneWidget);
      await tester.tap(find.byType(AppButton));
      expect(taps, 1);
    });

    testWidgets('omits the action area when absent', (tester) async {
      await _pump(tester, const AppErrorState(title: 'Failed to load'));
      expect(find.byType(AppButton), findsNothing);
    });

    testWidgets('is announced as an assertive alert region', (tester) async {
      await _pump(tester, const AppErrorState(title: 'Failed to load'));
      final semantics = tester.getSemantics(find.byType(AppErrorState));
      expect(semantics.role, SemanticsRole.alert);
    });
  });
}
