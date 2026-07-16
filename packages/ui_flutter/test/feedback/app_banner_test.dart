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
  group('AppBanner', () {
    testWidgets('renders with the default info variant', (tester) async {
      await _pump(tester, const AppBanner(body: 'Hello'));
      final icon = tester.widget<IconCS>(find.byType(IconCS));
      expect(icon.name, IconName.info);
    });

    testWidgets('renders the title when provided', (tester) async {
      await _pump(
        tester,
        const AppBanner(title: 'Important', body: 'Something happened'),
      );
      expect(find.text('Important'), findsOneWidget);
    });

    testWidgets('does not render a title widget when title is omitted', (
      tester,
    ) async {
      await _pump(tester, const AppBanner(body: 'Body text'));
      expect(find.text('Body text'), findsOneWidget);
      // Only the body Text should render — no separate title Text.
      expect(find.byType(Text), findsOneWidget);
    });

    testWidgets('renders the body prop as fallback when no child is given', (
      tester,
    ) async {
      await _pump(tester, const AppBanner(body: 'My body text'));
      expect(find.text('My body text'), findsOneWidget);
    });

    testWidgets('child content wins over the body prop', (tester) async {
      await _pump(
        tester,
        const AppBanner(body: 'Ignored body', child: Text('Slot content wins')),
      );
      expect(find.text('Slot content wins'), findsOneWidget);
      expect(find.text('Ignored body'), findsNothing);
    });

    testWidgets('does not render actions when none are provided', (
      tester,
    ) async {
      await _pump(tester, const AppBanner(body: 'Body'));
      expect(find.byKey(const Key('my-action')), findsNothing);
    });

    testWidgets('renders the actions widget when provided', (tester) async {
      await _pump(
        tester,
        AppBanner(
          body: 'Body',
          actions: ElevatedButton(
            key: const Key('my-action'),
            onPressed: () {},
            child: const Text('Retry'),
          ),
        ),
      );
      expect(find.byKey(const Key('my-action')), findsOneWidget);
    });

    testWidgets('does not render the dismiss button by default', (
      tester,
    ) async {
      await _pump(tester, const AppBanner(body: 'Body'));
      expect(find.byType(AppIconButton), findsNothing);
    });

    testWidgets('renders the dismiss button when dismissible', (tester) async {
      await _pump(tester, const AppBanner(body: 'Body', dismissible: true));
      expect(find.byType(AppIconButton), findsOneWidget);
    });

    testWidgets('fires onDismiss when the dismiss button is tapped', (
      tester,
    ) async {
      var dismissed = 0;
      await _pump(
        tester,
        AppBanner(
          body: 'Body',
          dismissible: true,
          onDismiss: () => dismissed++,
        ),
      );
      await tester.tap(find.byType(AppIconButton));
      expect(dismissed, 1);
    });

    testWidgets('passes the custom dismissLabel to the dismiss button', (
      tester,
    ) async {
      await _pump(
        tester,
        const AppBanner(
          body: 'Body',
          dismissible: true,
          dismissLabel: 'Close banner',
        ),
      );
      final button = tester.widget<AppIconButton>(find.byType(AppIconButton));
      expect(button.semanticLabel, 'Close banner');
    });

    const iconByVariant = <AppFeedbackVariant, IconName>{
      AppFeedbackVariant.info: IconName.info,
      AppFeedbackVariant.success: IconName.checkCircle,
      AppFeedbackVariant.warning: IconName.alert,
      AppFeedbackVariant.error: IconName.alert,
    };

    for (final entry in iconByVariant.entries) {
      testWidgets('passes the correct icon for variant=${entry.key.name}', (
        tester,
      ) async {
        await _pump(tester, AppBanner(variant: entry.key, body: 'test'));
        final icon = tester.widget<IconCS>(find.byType(IconCS));
        expect(icon.name, entry.value);
      });
    }

    for (final variant in AppFeedbackVariant.values) {
      testWidgets('tints the icon with the variant colour ($variant)', (
        tester,
      ) async {
        late BuildContext capturedContext;
        await _pump(
          tester,
          Builder(
            builder: (context) {
              capturedContext = context;
              return AppBanner(variant: variant, body: 'test');
            },
          ),
        );
        final cs = Theme.of(capturedContext).colorScheme;
        final sem = capturedContext.semanticColors;
        final expected = switch (variant) {
          AppFeedbackVariant.info => sem.infoFg,
          AppFeedbackVariant.success => sem.successFg,
          AppFeedbackVariant.warning => sem.warningFg,
          AppFeedbackVariant.error => cs.error,
        };
        final icon = tester.widget<IconCS>(find.byType(IconCS));
        expect(icon.color, expected);
      });
    }
  });
}
