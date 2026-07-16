import 'package:widgetbook/widgetbook.dart';

import 'package:app_mobile/widgetbook/app_button_catalog.dart';
import 'package:app_mobile/widgetbook/avatar_catalog.dart';
import 'package:app_mobile/widgetbook/badge_catalog.dart';
import 'package:app_mobile/widgetbook/bookmarks_catalog.dart';
import 'package:app_mobile/widgetbook/chip_catalog.dart';
import 'package:app_mobile/widgetbook/containers_catalog.dart';
import 'package:app_mobile/widgetbook/course_cards_catalog.dart';
import 'package:app_mobile/widgetbook/download_row_catalog.dart';
import 'package:app_mobile/widgetbook/empty_error_catalog.dart';
import 'package:app_mobile/widgetbook/feedback_catalog.dart';
import 'package:app_mobile/widgetbook/fields_catalog.dart';
import 'package:app_mobile/widgetbook/icon_cs_catalog.dart';
import 'package:app_mobile/widgetbook/lesson_row_catalog.dart';
import 'package:app_mobile/widgetbook/navigation_shell_catalog.dart';
import 'package:app_mobile/widgetbook/overlays_catalog.dart';
import 'package:app_mobile/widgetbook/password_field_catalog.dart';
import 'package:app_mobile/widgetbook/player_chrome_catalog.dart';
import 'package:app_mobile/widgetbook/progress_badge_catalog.dart';
import 'package:app_mobile/widgetbook/progress_catalog.dart';
import 'package:app_mobile/widgetbook/radio_group_catalog.dart';
import 'package:app_mobile/widgetbook/sso_block_catalog.dart';
import 'package:app_mobile/widgetbook/states_catalog.dart';
import 'package:app_mobile/widgetbook/textarea_catalog.dart';

/// Builds the Widgetbook navigation tree.
///
/// Kept as a plain function (no `@widgetbook.App` code generation) so the tree
/// is a testable value. Every `app_ui` primitive (E17-F01) and composite
/// (E17-F02) is catalogued here, one `WidgetbookComponent` per widget.
List<WidgetbookNode> buildWidgetbookDirectories() {
  return [
    // E17-F01 primitives.
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
    // E17-F02 composites.
    ...buildCourseCardComponents(),
    buildLessonRowComponent(),
    ...buildBookmarkComponents(),
    buildProgressBadgeComponent(),
    buildPasswordFieldComponent(),
    buildSsoBlockComponent(),
    buildDownloadRowComponent(),
    buildNavigationShellComponent(),
    buildPlayerChromeComponent(),
  ];
}
