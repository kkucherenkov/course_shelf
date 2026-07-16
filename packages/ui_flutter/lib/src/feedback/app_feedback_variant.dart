import 'package:app_ui/src/icons/icon_name.dart';

/// Semantic tone shared by [AppAlert] and [AppBanner] — Flutter twin of the
/// `Variant` union (`'info' | 'success' | 'warning' | 'error'`) used by the
/// web `AppAlert.vue` / `AppBanner.vue`. [AppToast] has a narrower set (no
/// `warning`) — see `AppToastVariant`.
enum AppFeedbackVariant { info, success, warning, error }

/// Maps each variant to the status glyph the web components resolve via
/// their `iconName` computed property (`check-circle` for success, `alert`
/// for both warning and error, `info` otherwise).
extension AppFeedbackVariantIcon on AppFeedbackVariant {
  IconName get icon => switch (this) {
    AppFeedbackVariant.info => IconName.info,
    AppFeedbackVariant.success => IconName.checkCircle,
    AppFeedbackVariant.warning => IconName.alert,
    AppFeedbackVariant.error => IconName.alert,
  };
}
