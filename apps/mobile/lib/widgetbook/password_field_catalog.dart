import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_ui/app_ui.dart';

/// Widgetbook component cataloguing the `app_ui` [AppPasswordField] —
/// visibility toggle + optional strength meter — across its empty,
/// obscured/revealed, and per-strength-level states.
///
/// Not wired into `directories.dart` by this card; add
/// `buildPasswordFieldComponent()` to `buildWidgetbookDirectories()`
/// separately.
WidgetbookComponent buildPasswordFieldComponent() {
  return WidgetbookComponent(
    name: 'AppPasswordField',
    useCases: [
      WidgetbookUseCase(name: 'Empty', builder: _empty),
      WidgetbookUseCase(name: 'Obscured', builder: _obscured),
      WidgetbookUseCase(name: 'Revealed', builder: _revealed),
      WidgetbookUseCase(name: 'Error', builder: _error),
      WidgetbookUseCase(name: 'Disabled', builder: _disabled),
      WidgetbookUseCase(name: 'Meter — weak', builder: _meterWeak),
      WidgetbookUseCase(name: 'Meter — okay', builder: _meterOkay),
      WidgetbookUseCase(name: 'Meter — strong', builder: _meterStrong),
    ],
  );
}

Widget _column(List<Widget> children) => Center(
  child: Padding(
    padding: const EdgeInsets.all(16),
    child: SizedBox(
      width: 320,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          for (final child in children)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: child,
            ),
        ],
      ),
    ),
  ),
);

Widget _empty(BuildContext context) =>
    _column([const AppPasswordField(value: '')]);

Widget _obscured(BuildContext context) =>
    _column([const AppPasswordField(value: 'sup3r-secret!')]);

Widget _revealed(BuildContext context) => _column([
  const AppPasswordField(value: 'sup3r-secret!', initiallyVisible: true),
]);

Widget _error(BuildContext context) => _column([
  const AppPasswordField(
    value: 'short',
    error: 'Password must be at least 8 characters.',
  ),
]);

Widget _disabled(BuildContext context) =>
    _column([const AppPasswordField(value: 'cannot-touch', disabled: true)]);

Widget _meterWeak(BuildContext context) =>
    _column([const AppPasswordField(value: 'abcdef', withMeter: true)]);

Widget _meterOkay(BuildContext context) =>
    _column([const AppPasswordField(value: 'abcdefghij', withMeter: true)]);

Widget _meterStrong(BuildContext context) =>
    _column([const AppPasswordField(value: 'abcdefghijkl1!', withMeter: true)]);
