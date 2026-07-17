import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';

import 'package:app_mobile/i18n/strings.g.dart';

/// Placeholder body for the Search tab. The real search surface is
/// E18-F03-S02 (`cs-mobile-search-settings`, DESIGN_BRIEF §7.8).
///
/// Intrinsically sized — see [BrowseTabBody] for why.
class SearchTabBody extends StatelessWidget {
  const SearchTabBody({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.s8),
      child: AppEmptyState(
        icon: IconName.search,
        title: context.t.common.shell.navSearch,
        message: context.t.common.comingSoon,
      ),
    );
  }
}
