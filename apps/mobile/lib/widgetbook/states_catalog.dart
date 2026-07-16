import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_ui/app_ui.dart';

/// Widgetbook component cataloguing the `app_ui` [AppNoPermission] empty
/// state across its action / icon variants.
WidgetbookComponent buildNoPermissionComponent() {
  return WidgetbookComponent(
    name: 'AppNoPermission',
    useCases: [
      WidgetbookUseCase(name: 'Without action', builder: _withoutAction),
      WidgetbookUseCase(name: 'With action', builder: _withAction),
      WidgetbookUseCase(name: 'Custom icon', builder: _customIcon),
    ],
  );
}

Widget _center(Widget child) => Center(
  child: Padding(padding: const EdgeInsets.all(16), child: child),
);

Widget _withoutAction(BuildContext context) => _center(
  const AppNoPermission(
    title: 'Access restricted',
    message: 'You do not have permission to view this content.',
  ),
);

Widget _withAction(BuildContext context) => _center(
  AppNoPermission(
    title: 'Access restricted',
    message: 'You do not have permission to view this content.',
    action: AppButton(label: 'Log in', onPressed: () {}),
  ),
);

Widget _customIcon(BuildContext context) => _center(
  AppNoPermission(
    icon: IconName.shield,
    title: 'Premium content',
    message: 'Upgrade your plan to access this course.',
    action: AppButton(label: 'Upgrade', onPressed: () {}),
  ),
);
