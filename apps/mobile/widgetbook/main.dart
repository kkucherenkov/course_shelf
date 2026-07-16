import 'package:flutter/material.dart';

import 'package:app_mobile/widgetbook/widgetbook_app.dart';

/// Widgetbook entrypoint. Run with:
///
/// ```sh
/// flutter run -t widgetbook/main.dart   # or: pnpm dev:widgetbook
/// ```
///
/// Kept intentionally thin — a single package import plus `runApp` — so it
/// satisfies `always_use_package_imports` (which only resolves files under
/// `lib/`). All catalog logic lives in `lib/widgetbook/`.
void main() {
  runApp(const WidgetbookApp());
}
