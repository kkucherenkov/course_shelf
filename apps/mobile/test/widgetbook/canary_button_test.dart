import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/widgetbook/canary_button.dart';

void main() {
  testWidgets('renders its label', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CanaryButton(label: 'Tap me', onPressed: () {}),
        ),
      ),
    );

    expect(find.text('Tap me'), findsOneWidget);
  });

  testWidgets('is disabled when onPressed is null', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: CanaryButton(label: 'Disabled', onPressed: null),
        ),
      ),
    );

    final button = tester.widget<FilledButton>(find.byType(FilledButton));
    expect(button.onPressed, isNull);
  });
}
