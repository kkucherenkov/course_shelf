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
  group('AppToast', () {
    testWidgets('renders the message text', (tester) async {
      await _pump(tester, const AppToast(message: 'File saved!'));
      expect(find.text('File saved!'), findsOneWidget);
    });

    testWidgets('defaults to the info variant', (tester) async {
      late BuildContext capturedContext;
      await _pump(
        tester,
        Builder(
          builder: (context) {
            capturedContext = context;
            return const AppToast(message: 'test');
          },
        ),
      );
      final sem = capturedContext.semanticColors;
      final dot = tester.widget<DecoratedBox>(
        find.byKey(const Key('app-toast-dot')),
      );
      final decoration = dot.decoration as BoxDecoration;
      expect(decoration.color, sem.infoFg);
    });

    for (final variant in AppToastVariant.values) {
      testWidgets('dot is tinted with the variant colour ($variant)', (
        tester,
      ) async {
        late BuildContext capturedContext;
        await _pump(
          tester,
          Builder(
            builder: (context) {
              capturedContext = context;
              return AppToast(variant: variant, message: 'test');
            },
          ),
        );
        final cs = Theme.of(capturedContext).colorScheme;
        final sem = capturedContext.semanticColors;
        final expected = switch (variant) {
          AppToastVariant.success => sem.successFg,
          AppToastVariant.info => sem.infoFg,
          AppToastVariant.error => cs.error,
        };
        final dot = tester.widget<DecoratedBox>(
          find.byKey(const Key('app-toast-dot')),
        );
        final decoration = dot.decoration as BoxDecoration;
        expect(decoration.color, expected);
      });
    }

    testWidgets('does not render the dismiss button by default', (
      tester,
    ) async {
      await _pump(tester, const AppToast(message: 'test'));
      expect(find.byType(AppIconButton), findsNothing);
    });

    testWidgets('renders the dismiss button when dismissible', (tester) async {
      await _pump(tester, const AppToast(message: 'test', dismissible: true));
      expect(find.byType(AppIconButton), findsOneWidget);
    });

    testWidgets('fires onDismiss when the dismiss button is tapped', (
      tester,
    ) async {
      var dismissed = 0;
      await _pump(
        tester,
        AppToast(
          message: 'test',
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
        const AppToast(
          message: 'test',
          dismissible: true,
          dismissLabel: 'Close notification',
        ),
      );
      final button = tester.widget<AppIconButton>(find.byType(AppIconButton));
      expect(button.semanticLabel, 'Close notification');
    });
  });
}
