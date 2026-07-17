import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';

import 'package:app_mobile/features/browse/presentation/browse_screen.dart';
import 'package:app_mobile/features/downloads/presentation/downloads_screen.dart';
import 'package:app_mobile/features/home/presentation/home_screen.dart';
import 'package:app_mobile/features/search/presentation/search_screen.dart';
import 'package:app_mobile/features/settings/presentation/settings_screen.dart';
import 'package:app_mobile/i18n/strings.g.dart';

/// The authenticated root: the app's single host for the five bottom tabs
/// (Home · Browse · Downloads · Search · Settings — DESIGN_BRIEF §7.1).
///
/// [AppNavigationShell] is *controlled* — it renders `currentIndex` and reports
/// taps through `onTabChanged` without holding selection state — so the
/// selected index lives here.
///
/// Every tab body is intrinsically sized. The shell wraps each one in a
/// `SliverToBoxAdapter` inside its own `CustomScrollView` (an approved design
/// decision, documented on the widget), which means a body may be a `Column`
/// or a fixed-height horizontal carousel but never a bare `ListView`/`GridView`.
class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;

  /// Home's pull-to-refresh seam.
  ///
  /// Wired now, deliberately, so the gesture is proven through the shell
  /// before there is data behind it: the shell only builds a `RefreshIndicator`
  /// (Android) / `CupertinoSliverRefreshControl` (iOS) for a tab whose
  /// `onRefresh` is non-null, so leaving it null until E18-F01-S01 would hide
  /// the whole affordance from tests.
  ///
  /// E18-F01-S01 points this at `HomeCubit.refresh()` and drops the delay.
  Future<void> _refreshHome() async {
    await Future<void>.delayed(Duration.zero);
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final t = context.t.common.shell;

    return AppNavigationShell(
      currentIndex: _currentIndex,
      onTabChanged: (index) => setState(() => _currentIndex = index),
      tabs: <AppNavigationTab>[
        AppNavigationTab(
          label: t.navHome,
          icon: IconName.home,
          filledIcon: IconName.homeFill,
          onRefresh: _refreshHome,
          body: const HomeTabBody(),
        ),
        AppNavigationTab(
          label: t.navBrowse,
          icon: IconName.library,
          filledIcon: IconName.libraryFill,
          body: const BrowseTabBody(),
        ),
        AppNavigationTab(
          label: t.navDownloads,
          icon: IconName.download,
          filledIcon: IconName.downloadFill,
          body: const DownloadsTabBody(),
        ),
        AppNavigationTab(
          label: t.navSearch,
          icon: IconName.search,
          filledIcon: IconName.searchFill,
          body: const SearchTabBody(),
        ),
        AppNavigationTab(
          label: t.navSettings,
          icon: IconName.settings,
          filledIcon: IconName.settingsFill,
          body: const SettingsTabBody(),
        ),
      ],
    );
  }
}
