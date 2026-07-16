import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_ui/app_ui.dart';

/// Widgetbook components cataloguing the `app_ui` feedback/messaging trio —
/// [AppAlert], [AppBanner], and [AppToast] — one use case per variant.
List<WidgetbookComponent> buildFeedbackComponents() {
  return [
    _buildAppAlertComponent(),
    _buildAppBannerComponent(),
    _buildAppToastComponent(),
  ];
}

WidgetbookComponent _buildAppAlertComponent() {
  return WidgetbookComponent(
    name: 'AppAlert',
    useCases: [
      WidgetbookUseCase(name: 'Info', builder: _alertInfo),
      WidgetbookUseCase(name: 'Success', builder: _alertSuccess),
      WidgetbookUseCase(name: 'Warning', builder: _alertWarning),
      WidgetbookUseCase(name: 'Error', builder: _alertError),
      WidgetbookUseCase(name: 'All variants', builder: _alertAllVariants),
    ],
  );
}

WidgetbookComponent _buildAppBannerComponent() {
  return WidgetbookComponent(
    name: 'AppBanner',
    useCases: [
      WidgetbookUseCase(name: 'Info', builder: _bannerInfo),
      WidgetbookUseCase(name: 'Success', builder: _bannerSuccess),
      WidgetbookUseCase(name: 'Warning', builder: _bannerWarning),
      WidgetbookUseCase(name: 'Error', builder: _bannerError),
      WidgetbookUseCase(name: 'With actions', builder: _bannerWithActions),
      WidgetbookUseCase(name: 'Dismissible', builder: _bannerDismissible),
    ],
  );
}

WidgetbookComponent _buildAppToastComponent() {
  return WidgetbookComponent(
    name: 'AppToast',
    useCases: [
      WidgetbookUseCase(name: 'Info', builder: _toastInfo),
      WidgetbookUseCase(name: 'Success', builder: _toastSuccess),
      WidgetbookUseCase(name: 'Error', builder: _toastError),
      WidgetbookUseCase(name: 'Dismissible', builder: _toastDismissible),
    ],
  );
}

Widget _column(List<Widget> children) => Center(
  child: Padding(
    padding: const EdgeInsets.all(16),
    child: Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final child in children)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: child,
          ),
      ],
    ),
  ),
);

Widget _alertInfo(BuildContext context) => _column([
  const AppAlert(
    variant: AppFeedbackVariant.info,
    message: 'Password must be at least 8 characters.',
  ),
]);

Widget _alertSuccess(BuildContext context) => _column([
  const AppAlert(
    variant: AppFeedbackVariant.success,
    message: 'Email address is valid.',
  ),
]);

Widget _alertWarning(BuildContext context) => _column([
  const AppAlert(
    variant: AppFeedbackVariant.warning,
    message: 'This username is already taken.',
  ),
]);

Widget _alertError(BuildContext context) => _column([
  const AppAlert(
    variant: AppFeedbackVariant.error,
    message: 'This field is required.',
  ),
]);

Widget _alertAllVariants(BuildContext context) => _column([
  for (final variant in AppFeedbackVariant.values)
    AppAlert(
      variant: variant,
      message: '${variant.name} — This field is required.',
    ),
]);

Widget _bannerInfo(BuildContext context) => _column([
  const AppBanner(
    variant: AppFeedbackVariant.info,
    body: 'This is a notification message.',
  ),
]);

Widget _bannerSuccess(BuildContext context) => _column([
  const AppBanner(
    variant: AppFeedbackVariant.success,
    title: 'Upload complete',
    body: 'Your file has been uploaded successfully.',
  ),
]);

Widget _bannerWarning(BuildContext context) => _column([
  const AppBanner(
    variant: AppFeedbackVariant.warning,
    title: 'Action required',
    body: 'Please verify your email address before continuing.',
  ),
]);

Widget _bannerError(BuildContext context) => _column([
  const AppBanner(
    variant: AppFeedbackVariant.error,
    title: 'Could not load courses',
    body:
        "We couldn't load your courses. Check your connection, then try again.",
  ),
]);

Widget _bannerWithActions(BuildContext context) => _column([
  AppBanner(
    variant: AppFeedbackVariant.error,
    title: 'Could not load courses',
    body:
        "We couldn't load your courses. Check your connection, then try again.",
    actions: AppButton(
      label: 'Retry',
      size: AppButtonSize.sm,
      onPressed: () {},
    ),
  ),
]);

Widget _bannerDismissible(BuildContext context) => _column([
  for (final variant in AppFeedbackVariant.values)
    AppBanner(
      variant: variant,
      body: '${variant.name} — dismissible',
      dismissible: true,
      onDismiss: () {},
    ),
]);

Widget _toastInfo(BuildContext context) => _column([
  const AppToast(
    variant: AppToastVariant.info,
    message: 'New version available. Refresh to update.',
  ),
]);

Widget _toastSuccess(BuildContext context) => _column([
  const AppToast(
    variant: AppToastVariant.success,
    message: 'File uploaded successfully.',
  ),
]);

Widget _toastError(BuildContext context) => _column([
  const AppToast(
    variant: AppToastVariant.error,
    message: 'Failed to connect to the server.',
  ),
]);

Widget _toastDismissible(BuildContext context) => _column([
  for (final variant in AppToastVariant.values)
    AppToast(
      variant: variant,
      message: '${variant.name} — dismissible',
      dismissible: true,
      onDismiss: () {},
    ),
]);
