import 'package:widgetbook/widgetbook.dart';

import 'package:app_mobile/widgetbook/app_button_catalog.dart';
import 'package:app_mobile/widgetbook/avatar_catalog.dart';
import 'package:app_mobile/widgetbook/badge_catalog.dart';
import 'package:app_mobile/widgetbook/chip_catalog.dart';
import 'package:app_mobile/widgetbook/containers_catalog.dart';
import 'package:app_mobile/widgetbook/empty_error_catalog.dart';
import 'package:app_mobile/widgetbook/feedback_catalog.dart';
import 'package:app_mobile/widgetbook/fields_catalog.dart';
import 'package:app_mobile/widgetbook/icon_cs_catalog.dart';
import 'package:app_mobile/widgetbook/overlays_catalog.dart';
import 'package:app_mobile/widgetbook/progress_catalog.dart';
import 'package:app_mobile/widgetbook/radio_group_catalog.dart';
import 'package:app_mobile/widgetbook/states_catalog.dart';
import 'package:app_mobile/widgetbook/textarea_catalog.dart';

/// Builds the Widgetbook navigation tree.
///
/// Kept as a plain function (no `@widgetbook.App` code generation) so the tree
/// is a testable value. Every `app_ui` primitive from the E17-F01 component
/// wave is catalogued here, one `WidgetbookComponent` per widget.
List<WidgetbookNode> buildWidgetbookDirectories() {
  return [
    buildIconCsComponent(),
    buildAppButtonComponent(),
    buildAppIconButtonComponent(),
    ...buildFieldComponents(),
    buildTextareaComponent(),
    ...buildContainerComponents(),
    ...buildFeedbackComponents(),
    buildAppProgressLinearComponent(),
    buildAppProgressCircleComponent(),
    buildAppSpinnerComponent(),
    buildAppSkeletonComponent(),
    buildBadgeComponent(),
    buildChipComponent(),
    buildAvatarComponent(),
    buildNoPermissionComponent(),
    ...buildEmptyErrorComponents(),
    ...buildOverlayComponents(),
    buildRadioGroupComponent(),
  ];
}
