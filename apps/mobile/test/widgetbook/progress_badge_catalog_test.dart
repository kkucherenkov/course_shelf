import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_mobile/i18n/strings.g.dart';
import 'package:app_mobile/widgetbook/directories.dart';

/// `apps/mobile`'s only `AppProgressBadge` call site is this catalog, so it is
/// also the only place that can supply the widget with translated copy (#268 —
/// `app_ui` owns no locale and looks nothing up itself).
///
/// The `inProgress` assertion is the one with teeth: `ui.progressBadge.progress`
/// shipped as `"$completed of $total"` under a `braces` interpolation config,
/// which slang generated as a *literal* — no parameters, the two dollar signs
/// rendered verbatim to the user. Asserting on the rendered text is what would
/// catch that coming back.
void main() {
  Widget harness(WidgetbookUseCase useCase) => TranslationProvider(
    child: Builder(
      builder: (BuildContext context) => MaterialApp(
        theme: AppTheme.light(),
        home: Scaffold(body: useCase.builder(context)),
      ),
    ),
  );

  WidgetbookUseCase pillUseCase() => buildWidgetbookDirectories()
      .whereType<WidgetbookComponent>()
      .firstWhere((WidgetbookComponent c) => c.name == 'AppProgressBadge')
      .useCases
      .firstWhere((WidgetbookUseCase u) => u.name == 'Pill');

  testWidgets('the pill states render localized copy, not app_ui defaults', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(harness(pillUseCase()));

    final TranslationsUiProgressBadgeEn copy = t.ui.progressBadge;

    expect(find.text(copy.done), findsOneWidget);
    expect(find.text(copy.locked), findsOneWidget);
    expect(find.text(copy.notStarted), findsOneWidget);
    expect(find.text(copy.progress(completed: 4, total: 12)), findsOneWidget);
    expect(
      find.text('4 of 12'),
      findsOneWidget,
      reason: 'the counts must be interpolated, not printed as placeholders',
    );
  });
}
