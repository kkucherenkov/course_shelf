import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/features/browse/presentation/bloc/browse_cubit.dart';
import 'package:app_mobile/features/browse/presentation/browse_screen.dart';
import 'package:app_mobile/features/downloads/presentation/downloads_screen.dart';
import 'package:app_mobile/features/home/presentation/bloc/home_cubit.dart';
import 'package:app_mobile/features/home/presentation/home_screen.dart';
import 'package:app_mobile/features/search/presentation/bloc/search_cubit.dart';
import 'package:app_mobile/features/search/presentation/search_screen.dart';
import 'package:app_mobile/features/settings/presentation/bloc/settings_cubit.dart';
import 'package:app_mobile/features/settings/presentation/settings_screen.dart';
import 'package:app_mobile/i18n/strings.g.dart';
import 'package:app_mobile/shared/di/injector.dart';

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
  /// Tab order — the shell is controlled by index, and Home's quick links need
  /// to name two of these without knowing the order themselves.
  static const int _browseTab = 1;
  static const int _downloadsTab = 2;

  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    // Home's cubit is provided here, above the shell, rather than inside
    // HomeTabBody: the shell owns the pull-to-refresh gesture, so `onRefresh`
    // has to reach the same instance the body renders.
    return BlocProvider<HomeCubit>(
      create: (_) => getIt<HomeCubit>()..load(),
      child: Builder(builder: _buildShell),
    );
  }

  Widget _buildShell(BuildContext context) {
    final t = context.t.common.shell;

    return AppNavigationShell(
      currentIndex: _currentIndex,
      onTabChanged: (index) => setState(() => _currentIndex = index),
      tabs: <AppNavigationTab>[
        AppNavigationTab(
          label: t.navHome,
          icon: IconName.home,
          filledIcon: IconName.homeFill,
          // Returns the cubit's future, so the shell keeps its spinner up for
          // exactly as long as the reload actually takes.
          onRefresh: context.read<HomeCubit>().refresh,
          body: HomeQuickLinks(
            openDownloads: () => _openTab(_downloadsTab),
            openLibrary: () => _openTab(_browseTab),
            child: const HomeTabBody(),
          ),
        ),
        AppNavigationTab(
          label: t.navBrowse,
          icon: IconName.library,
          filledIcon: IconName.libraryFill,
          // BrowseCubit is provided here (not self-provided inside
          // BrowseTabBody) for the same reason SearchCubit is below: a
          // widget test can drive the body with its own
          // `BlocProvider<BrowseCubit>.value` instead of standing up get_it.
          body: BlocProvider<BrowseCubit>(
            create: (_) => getIt<BrowseCubit>()..load(),
            child: const BrowseTabBody(),
          ),
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
          // SearchCubit is provided here (not self-provided inside
          // SearchTabBody) so a widget test can drive the body with its own
          // `BlocProvider<SearchCubit>.value` instead of standing up get_it —
          // same shape as HomeCubit above. SearchQuickLinks is the no-results
          // state's "Browse library" seam (mirrors HomeQuickLinks) rather
          // than teaching Search the shell's tab order.
          body: BlocProvider<SearchCubit>(
            create: (_) => getIt<SearchCubit>(),
            child: SearchQuickLinks(
              openBrowse: () => _openTab(_browseTab),
              child: const SearchTabBody(),
            ),
          ),
        ),
        AppNavigationTab(
          label: t.navSettings,
          icon: IconName.settings,
          filledIcon: IconName.settingsFill,
          body: BlocProvider<SettingsCubit>(
            create: (_) => getIt<SettingsCubit>(),
            child: const SettingsTabBody(),
          ),
        ),
      ],
    );
  }

  void _openTab(int index) => setState(() => _currentIndex = index);
}
