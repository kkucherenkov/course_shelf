import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_ui/app_ui.dart';

/// Widgetbook component cataloguing the `app_ui` [IconCS] brand icon family:
/// the full 71-glyph gallery, the size matrix, and the fill toggle.
WidgetbookComponent buildIconCsComponent() {
  return WidgetbookComponent(
    name: 'IconCS',
    useCases: [
      WidgetbookUseCase(name: 'Gallery', builder: _gallery),
      WidgetbookUseCase(name: 'Sizes', builder: _sizes),
      WidgetbookUseCase(name: 'Fill toggle', builder: _fillToggle),
    ],
  );
}

Widget _gallery(BuildContext context) {
  return SingleChildScrollView(
    padding: const EdgeInsets.all(16),
    child: Wrap(
      spacing: 16,
      runSpacing: 16,
      children: [
        for (final name in IconName.values)
          SizedBox(
            width: 64,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconCS(name: name, size: 24),
                const SizedBox(height: 6),
                Text(
                  name.token,
                  style: const TextStyle(fontSize: 9),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
      ],
    ),
  );
}

Widget _sizes(BuildContext context) {
  return const Center(
    child: Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Padding(
          padding: EdgeInsets.all(12),
          child: IconCS(name: IconName.play, size: 16),
        ),
        Padding(
          padding: EdgeInsets.all(12),
          child: IconCS(name: IconName.play, size: 20),
        ),
        Padding(
          padding: EdgeInsets.all(12),
          child: IconCS(name: IconName.play, size: 24),
        ),
        Padding(
          padding: EdgeInsets.all(12),
          child: IconCS(name: IconName.play, size: 48),
        ),
      ],
    ),
  );
}

Widget _fillToggle(BuildContext context) {
  return const Center(
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Padding(
          padding: EdgeInsets.all(16),
          child: IconCS(name: IconName.bookmark, size: 32),
        ),
        Padding(
          padding: EdgeInsets.all(16),
          child: IconCS(name: IconName.bookmark, size: 32, fill: true),
        ),
        Padding(
          padding: EdgeInsets.all(16),
          child: IconCS(name: IconName.play, size: 32),
        ),
        Padding(
          padding: EdgeInsets.all(16),
          child: IconCS(name: IconName.play, size: 32, fill: true),
        ),
      ],
    ),
  );
}
