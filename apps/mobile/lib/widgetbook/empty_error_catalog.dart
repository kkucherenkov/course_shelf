import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_ui/app_ui.dart';

/// Widgetbook components cataloguing the `app_ui` [AppEmptyState] and
/// [AppErrorState] surfaces across their action / icon / message variants.
List<WidgetbookComponent> buildEmptyErrorComponents() {
  return <WidgetbookComponent>[
    WidgetbookComponent(
      name: 'AppEmptyState',
      useCases: [
        WidgetbookUseCase(name: 'Message only', builder: _emptyMessageOnly),
        WidgetbookUseCase(name: 'With action', builder: _emptyWithAction),
        WidgetbookUseCase(name: 'Custom icon', builder: _emptyCustomIcon),
      ],
    ),
    WidgetbookComponent(
      name: 'AppErrorState',
      useCases: [
        WidgetbookUseCase(name: 'Message only', builder: _errorMessageOnly),
        WidgetbookUseCase(name: 'With retry', builder: _errorWithRetry),
        WidgetbookUseCase(name: 'Custom icon', builder: _errorCustomIcon),
      ],
    ),
  ];
}

Widget _center(Widget child) => Center(
  child: Padding(padding: const EdgeInsets.all(16), child: child),
);

Widget _emptyMessageOnly(BuildContext context) => _center(
  const AppEmptyState(
    title: 'No courses yet',
    message: 'Add your first course to get started.',
  ),
);

Widget _emptyWithAction(BuildContext context) => _center(
  AppEmptyState(
    title: 'No courses yet',
    message: 'Add your first course to get started.',
    action: AppButton(label: 'Add course', onPressed: () {}),
  ),
);

Widget _emptyCustomIcon(BuildContext context) => _center(
  AppEmptyState(
    icon: IconName.bookmark,
    title: 'No bookmarks yet',
    message: 'Bookmark a lesson to find it here later.',
    action: AppButton(label: 'Browse lessons', onPressed: () {}),
  ),
);

Widget _errorMessageOnly(BuildContext context) => _center(
  const AppErrorState(
    title: 'Failed to load',
    message: 'Please try again later.',
  ),
);

Widget _errorWithRetry(BuildContext context) => _center(
  AppErrorState(
    title: 'Failed to load',
    message: 'Please try again later.',
    action: AppButton(label: 'Retry', onPressed: () {}),
  ),
);

Widget _errorCustomIcon(BuildContext context) => _center(
  AppErrorState(
    icon: IconName.wifiOff,
    title: 'Connection lost',
    message: 'Check your internet connection and try again.',
    action: AppButton(label: 'Retry', onPressed: () {}),
  ),
);
