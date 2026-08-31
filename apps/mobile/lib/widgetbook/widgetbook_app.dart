import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_mobile/i18n/strings.g.dart';
import 'package:app_mobile/widgetbook/directories.dart';

/// Root of the mobile Widgetbook catalog.
///
/// Mirrors the real app's themes (`AppTheme.light()` / `AppTheme.dark()`) so
/// every component previews under the exact `ThemeData` the app ships, and adds
/// a text-scale addon to check layouts against accessibility scaling.
///
/// Wrapped in [TranslationProvider] for the same reason `App` is: `app_ui`
/// widgets take their copy as parameters and never look a translation up
/// themselves, so a catalog that wants to preview the copy the app actually
/// ships has to resolve `context.t` and pass it in — exactly as a screen does.
/// Without the provider those use cases would fall back to `app_ui`'s English
/// defaults, which is precisely the untranslatable state #268 is about.
class WidgetbookApp extends StatelessWidget {
  const WidgetbookApp({super.key});

  @override
  Widget build(BuildContext context) {
    return TranslationProvider(
      child: Widgetbook.material(
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
      ),
    );
  }
}
