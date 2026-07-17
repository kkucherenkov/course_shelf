import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_ui/app_ui.dart';

/// Widgetbook component cataloguing the `app_ui` [AppNavigationShell] — the
/// persistent mobile shell (5-tab bottom bar + platform-adaptive collapsing
/// title).
WidgetbookComponent buildNavigationShellComponent() {
  return WidgetbookComponent(
    name: 'AppNavigationShell',
    useCases: [
      WidgetbookUseCase(name: 'Home active', builder: (context) => _shell(0)),
      WidgetbookUseCase(name: 'Browse active', builder: (context) => _shell(1)),
      WidgetbookUseCase(
        name: 'Downloads active',
        builder: (context) => _shell(2),
      ),
      WidgetbookUseCase(name: 'Search active', builder: (context) => _shell(3)),
      WidgetbookUseCase(
        name: 'Settings active',
        builder: (context) => _shell(4),
      ),
      WidgetbookUseCase(name: 'iOS chrome', builder: _iosChrome),
      WidgetbookUseCase(name: 'Android chrome', builder: _androidChrome),
    ],
  );
}

List<AppNavigationTab> _tabs() => <AppNavigationTab>[
  AppNavigationTab(
    label: 'Home',
    icon: IconName.home,
    filledIcon: IconName.homeFill,
    body: _tabBody('Home', 'Continue watching, recently added, quick links.'),
  ),
  AppNavigationTab(
    label: 'Browse',
    icon: IconName.library,
    filledIcon: IconName.libraryFill,
    body: _tabBody('Browse', 'Catalog search and filters.'),
  ),
  AppNavigationTab(
    label: 'Downloads',
    icon: IconName.download,
    filledIcon: IconName.downloadFill,
    body: _tabBody('Downloads', 'Lessons available offline.'),
  ),
  AppNavigationTab(
    label: 'Search',
    icon: IconName.search,
    filledIcon: IconName.searchFill,
    body: _tabBody('Search', 'Search courses and lessons.'),
  ),
  AppNavigationTab(
    label: 'Settings',
    icon: IconName.settings,
    filledIcon: IconName.settingsFill,
    body: _tabBody('Settings', 'Account, downloads, and preferences.'),
  ),
];

Widget _tabBody(String heading, String message) => Padding(
  padding: const EdgeInsets.all(16),
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    mainAxisSize: MainAxisSize.min,
    children: [
      Text(heading, style: const TextStyle(fontWeight: FontWeight.w600)),
      const SizedBox(height: 8),
      Text(message),
    ],
  ),
);

Widget _shell(int currentIndex) =>
    _StatefulShellPreview(initialIndex: currentIndex, tabs: _tabs);

Widget _iosChrome(BuildContext context) => Theme(
  data: Theme.of(context).copyWith(platform: TargetPlatform.iOS),
  child: _shell(0),
);

Widget _androidChrome(BuildContext context) => Theme(
  data: Theme.of(context).copyWith(platform: TargetPlatform.android),
  child: _shell(0),
);

/// Minimal stateful shell so the controlled [AppNavigationShell] visibly
/// responds to tab taps inside the Widgetbook preview pane.
class _StatefulShellPreview extends StatefulWidget {
  const _StatefulShellPreview({required this.initialIndex, required this.tabs});

  final int initialIndex;
  final List<AppNavigationTab> Function() tabs;

  @override
  State<_StatefulShellPreview> createState() => _StatefulShellPreviewState();
}

class _StatefulShellPreviewState extends State<_StatefulShellPreview> {
  late int _currentIndex = widget.initialIndex;

  @override
  Widget build(BuildContext context) {
    return AppNavigationShell(
      tabs: widget.tabs(),
      currentIndex: _currentIndex,
      onTabChanged: (index) => setState(() => _currentIndex = index),
    );
  }
}
