import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';

import 'package:app_mobile/i18n/strings.g.dart';

/// Placeholder body for the Browse tab. The real catalog grid + filters are
/// E18-F01-S02, which replaces this widget wholesale.
///
/// Intrinsically sized on purpose: [AppNavigationShell] hands each tab body a
/// `SliverToBoxAdapter` slot inside its own `CustomScrollView`, so a body that
/// introduced its own unbounded-height scrollable would throw.
class BrowseTabBody extends StatelessWidget {
  const BrowseTabBody({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.s8),
      child: AppEmptyState(
        icon: IconName.library,
        title: context.t.common.shell.navBrowse,
        message: context.t.common.comingSoon,
      ),
    );
  }
}
