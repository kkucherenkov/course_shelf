import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_ui/app_ui.dart';

Future<void> _pump(WidgetTester tester, Widget child) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: AppTheme.light(),
      home: Scaffold(body: Center(child: child)),
    ),
  );
}

void main() {
  group('AppIconButton', () {
    testWidgets('renders one IconCS glyph', (tester) async {
      await _pump(
        tester,
        const AppIconButton(name: IconName.play, semanticLabel: 'Play'),
      );
      expect(find.byType(IconCS), findsOneWidget);
    });

    testWidgets('is square at the size dimension', (tester) async {
      await _pump(
        tester,
        const AppIconButton(
          name: IconName.play,
          semanticLabel: 'Play',
          size: AppButtonSize.lg,
        ),
      );
      final size = tester.getSize(find.byType(AppIconButton));
      expect(size.width, 44);
      expect(size.height, 44);
    });

    testWidgets('exposes its semantic label', (tester) async {
      final handle = tester.ensureSemantics();
      await _pump(
        tester,
        const AppIconButton(name: IconName.play, semanticLabel: 'Play video'),
      );
      expect(find.bySemanticsLabel('Play video'), findsOneWidget);
      handle.dispose();
    });

    testWidgets('fires onPressed on tap', (tester) async {
      var taps = 0;
      await _pump(
        tester,
        AppIconButton(
          name: IconName.play,
          semanticLabel: 'Play',
          onPressed: () => taps++,
        ),
      );
      await tester.tap(find.byType(AppIconButton));
      expect(taps, 1);
    });

    testWidgets('disabled does not fire and nulls onPressed', (tester) async {
      var taps = 0;
      await _pump(
        tester,
        AppIconButton(
          name: IconName.play,
          semanticLabel: 'Play',
          disabled: true,
          onPressed: () => taps++,
        ),
      );
      await tester.tap(find.byType(AppIconButton), warnIfMissed: false);
      expect(taps, 0);
      expect(
        tester.widget<TextButton>(find.byType(TextButton)).onPressed,
        isNull,
      );
    });

    testWidgets('loading shows a spinner instead of the glyph', (tester) async {
      await _pump(
        tester,
        const AppIconButton(
          name: IconName.play,
          semanticLabel: 'Play',
          loading: true,
        ),
      );
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.byType(IconCS), findsNothing);
    });
  });
}
