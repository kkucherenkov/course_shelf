import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_ui/app_ui.dart';

/// Widgetbook components cataloguing the `app_ui` overlay surfaces:
/// [AppDialog] and [AppBottomSheet].
///
/// Both are catalogued as their surface widget directly — an imperative
/// `showDialog`/`showModalBottomSheet` call can't be rendered inline in the
/// Widgetbook preview pane.
List<WidgetbookComponent> buildOverlayComponents() {
  return [_buildAppDialogComponent(), _buildAppBottomSheetComponent()];
}

WidgetbookComponent _buildAppDialogComponent() {
  return WidgetbookComponent(
    name: 'AppDialog',
    useCases: [
      WidgetbookUseCase(name: 'Default', builder: _dialogDefault),
      WidgetbookUseCase(
        name: 'With description',
        builder: _dialogWithDescription,
      ),
      WidgetbookUseCase(name: 'With footer', builder: _dialogWithFooter),
      WidgetbookUseCase(name: 'Small size', builder: _dialogSmallSize),
      WidgetbookUseCase(
        name: 'Non-dismissible',
        builder: _dialogNonDismissible,
      ),
    ],
  );
}

WidgetbookComponent _buildAppBottomSheetComponent() {
  return WidgetbookComponent(
    name: 'AppBottomSheet',
    useCases: [
      WidgetbookUseCase(name: 'Default', builder: _sheetDefault),
      WidgetbookUseCase(name: 'With footer', builder: _sheetWithFooter),
      WidgetbookUseCase(name: 'No handle', builder: _sheetNoHandle),
      WidgetbookUseCase(name: 'Non-dismissible', builder: _sheetNonDismissible),
    ],
  );
}

Widget _center(Widget child) => Center(
  child: Padding(padding: const EdgeInsets.all(16), child: child),
);

Widget _dialogDefault(BuildContext context) => _center(
  AppDialog(
    title: 'Dialog title',
    onDismiss: () {},
    child: const Text('Dialog body content goes here.'),
  ),
);

Widget _dialogWithDescription(BuildContext context) => _center(
  AppDialog(
    title: 'Dialog title',
    description: 'This is an optional description that provides context.',
    onDismiss: () {},
    child: const Text('Dialog body content.'),
  ),
);

Widget _dialogWithFooter(BuildContext context) => _center(
  AppDialog(
    title: 'Dialog title',
    onDismiss: () {},
    actions: <Widget>[
      AppButton(
        variant: AppButtonVariant.secondary,
        label: 'Cancel',
        onPressed: () {},
      ),
      AppButton(label: 'Confirm', onPressed: () {}),
    ],
    child: const Text('Are you sure you want to proceed?'),
  ),
);

Widget _dialogSmallSize(BuildContext context) => _center(
  AppDialog(
    size: AppDialogSize.sm,
    title: 'Small dialog',
    onDismiss: () {},
    child: const Text('Compact dialog content.'),
  ),
);

Widget _dialogNonDismissible(BuildContext context) => _center(
  AppDialog(
    title: 'Mandatory action',
    dismissible: false,
    actions: <Widget>[AppButton(label: 'I accept', onPressed: () {})],
    child: const Text('This dialog cannot be dismissed with a close button.'),
  ),
);

Widget _sheetDefault(BuildContext context) => _center(
  AppBottomSheet(
    title: 'Sheet title',
    onDismiss: () {},
    child: const Text('Sheet body content goes here.'),
  ),
);

Widget _sheetWithFooter(BuildContext context) => _center(
  AppBottomSheet(
    title: 'Sheet title',
    onDismiss: () {},
    actions: <Widget>[
      AppButton(
        variant: AppButtonVariant.secondary,
        label: 'Cancel',
        onPressed: () {},
      ),
      AppButton(label: 'Confirm', onPressed: () {}),
    ],
    child: const Text('Sheet body content goes here.'),
  ),
);

Widget _sheetNoHandle(BuildContext context) => _center(
  const AppBottomSheet(
    showHandle: false,
    dismissible: false,
    child: Text('Minimal sheet body only.'),
  ),
);

Widget _sheetNonDismissible(BuildContext context) => _center(
  AppBottomSheet(
    title: 'Mandatory action',
    dismissible: false,
    actions: <Widget>[AppButton(label: 'I accept', onPressed: () {})],
    child: const Text('This sheet cannot be dismissed.'),
  ),
);
