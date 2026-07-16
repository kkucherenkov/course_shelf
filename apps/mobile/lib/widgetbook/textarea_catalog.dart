import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_ui/app_ui.dart';

/// Widgetbook component cataloguing the `app_ui` [AppTextarea] across its
/// default, error, disabled, and character-counter states.
WidgetbookComponent buildTextareaComponent() {
  return WidgetbookComponent(
    name: 'AppTextarea',
    useCases: [
      WidgetbookUseCase(name: 'Default', builder: _default),
      WidgetbookUseCase(name: 'Error', builder: _error),
      WidgetbookUseCase(name: 'Disabled', builder: _disabled),
      WidgetbookUseCase(name: 'With counter', builder: _withCounter),
    ],
  );
}

Widget _center(Widget child) => Center(
  child: Padding(
    padding: const EdgeInsets.all(16),
    child: SizedBox(width: 320, child: child),
  ),
);

Widget _default(BuildContext context) => _center(
  const AppTextarea(
    value: '',
    placeholder: 'Share any notes for your provider…',
  ),
);

Widget _error(BuildContext context) => _center(
  const AppTextarea(
    value: 'short',
    error: 'Notes must be at least 20 characters',
  ),
);

Widget _disabled(BuildContext context) =>
    _center(const AppTextarea(value: 'Disabled content', disabled: true));

Widget _withCounter(BuildContext context) => _center(
  const AppTextarea(
    value: 'Tell us about the booking context.',
    maxLength: 120,
  ),
);
