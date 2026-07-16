import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_mobile/widgetbook/directories.dart';

/// Root of the mobile Widgetbook catalog.
///
/// Mirrors the real app's themes (`AppTheme.light()` / `AppTheme.dark()`) so
/// every component previews under the exact `ThemeData` the app ships, and adds
/// a text-scale addon to check layouts against accessibility scaling.
class WidgetbookApp extends StatelessWidget {
  const WidgetbookApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Widgetbook.material(
      directories: buildWidgetbookDirectories(),
      addons: [
        MaterialThemeAddon(
          themes: [
            WidgetbookTheme(name: 'Light', data: AppTheme.light()),
            WidgetbookTheme(name: 'Dark', data: AppTheme.dark()),
          ],
        ),
        TextScaleAddon(),
      ],
    );
  }
}
