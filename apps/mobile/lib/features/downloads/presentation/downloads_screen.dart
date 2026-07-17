import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';

import 'package:app_mobile/i18n/strings.g.dart';

/// Placeholder body for the Downloads tab. The real manager/queue/storage
/// surface is E19 (`AppDownloadRow` already exists in the catalog awaiting it).
///
/// Intrinsically sized — see [BrowseTabBody] for why.
class DownloadsTabBody extends StatelessWidget {
  const DownloadsTabBody({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.s8),
      child: AppEmptyState(
        icon: IconName.download,
        title: context.t.common.shell.navDownloads,
        message: context.t.common.comingSoon,
      ),
    );
  }
}
