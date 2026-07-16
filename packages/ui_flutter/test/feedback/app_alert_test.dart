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
  group('AppAlert', () {
    testWidgets('renders the message text', (tester) async {
      await _pump(tester, const AppAlert(message: 'Field is required'));
      expect(find.text('Field is required'), findsOneWidget);
    });

    testWidgets('defaults to the info variant', (tester) async {
      await _pump(tester, const AppAlert(message: 'test'));
      final icon = tester.widget<IconCS>(find.byType(IconCS));
      expect(icon.name, IconName.info);
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
        await _pump(tester, AppAlert(variant: entry.key, message: 'test'));
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
              return AppAlert(variant: variant, message: 'test');
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

    testWidgets('is announced as a live region', (tester) async {
      await _pump(tester, const AppAlert(message: 'test'));
      final semantics = tester.getSemantics(find.byType(AppAlert));
      expect(semantics.flagsCollection.isLiveRegion, isTrue);
    });
  });
}
