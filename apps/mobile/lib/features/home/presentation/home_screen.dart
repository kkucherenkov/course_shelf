import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';

import 'package:app_mobile/i18n/strings.g.dart';

/// Placeholder body for the Home tab.
///
/// **E18-F01-S01 replaces this widget** with the real Home: Continue-watching
/// + Recently-added carousels and quick links, driven by a `HomeCubit`
/// (Loading | Loaded | Empty | Failed). The seam it plugs into already exists —
/// `MainShell` passes `AppNavigationTab.onRefresh` for this tab, so the
/// pull-to-refresh gesture is live before there is anything to refresh; that
/// card only has to point the callback at `HomeCubit.refresh()` and swap this
/// body out.
///
/// Intrinsically sized on purpose: [AppNavigationShell] hands each tab body a
/// `SliverToBoxAdapter` slot inside its own `CustomScrollView`, so a body that
/// introduced its own unbounded-height scrollable would throw. The carousels
/// E18-F01-S01 brings are horizontal with a fixed height, which is fine here.
class HomeTabBody extends StatelessWidget {
  const HomeTabBody({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.s8),
      child: AppEmptyState(
        icon: IconName.home,
        title: context.t.common.shell.navHome,
        message: context.t.common.comingSoon,
      ),
    );
  }
}
