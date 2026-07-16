import 'package:widgetbook/widgetbook.dart';

import 'package:app_mobile/widgetbook/app_button_catalog.dart';
import 'package:app_mobile/widgetbook/icon_cs_catalog.dart';

/// Builds the Widgetbook navigation tree.
///
/// Kept as a plain function (no `@widgetbook.App` code generation) so the tree
/// is a testable value. The E16 `CanaryButton` placeholder has been retired now
/// that the real `app_ui` primitives (IconCS, AppButton, AppIconButton) exist.
List<WidgetbookNode> buildWidgetbookDirectories() {
  return [
    buildIconCsComponent(),
    buildAppButtonComponent(),
    buildAppIconButtonComponent(),
  ];
}
