import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('app theme exposes the brand accent and semantic colours',
      (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light(),
        home: Builder(
          builder: (context) {
            expect(
              Theme.of(context).colorScheme.primary,
              AppColorsLight.brandAccent,
            );
            expect(context.semanticColors.successFg,
                AppColorsLight.statusSuccessFg);
            return const SizedBox.shrink();
          },
        ),
      ),
    );
  });
}
