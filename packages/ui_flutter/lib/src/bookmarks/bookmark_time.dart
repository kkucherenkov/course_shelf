import 'package:flutter/material.dart';

import 'package:app_ui/src/theme/app_theme.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// Formats a duration in seconds as `M:SS`, or `H:MM:SS` once it reaches an
/// hour — Flutter twin of the `fmtTime` helper duplicated in the web
/// `AppBookmark.vue` / `AppBookmarkAdd.vue`.
String formatBookmarkTime(double seconds) {
  final int total = seconds < 0 ? 0 : seconds.floor();
  final int hours = total ~/ 3600;
  final int minutes = (total % 3600) ~/ 60;
  final int secs = total % 60;
  final String paddedSecs = secs.toString().padLeft(2, '0');
  if (hours > 0) {
    return '$hours:${minutes.toString().padLeft(2, '0')}:$paddedSecs';
  }
  return '$minutes:$paddedSecs';
}

/// The small monospace time chip shared by `AppBookmark` and
/// `AppBookmarkAdd` — Flutter twin of each web component's
/// `.app-bookmark__time` / `.app-bookmark-add__time` element.
///
/// `2px 6px` padding is a bare literal in both web stylesheets (not a
/// spacing-scale step); carried over verbatim as a locally-owned constant
/// rather than rounding to the nearest `AppSpacing` step.
class BookmarkTimeChip extends StatelessWidget {
  const BookmarkTimeChip({required this.time, super.key});

  /// Bookmark position, in seconds.
  final double time;

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    final ColorScheme cs = theme.colorScheme;
    final AppSemanticColors sem = context.semanticColors;

    final TextStyle style = (theme.textTheme.bodySmall ?? const TextStyle())
        .copyWith(
          fontFamily: AppTypography.code.fontFamily,
          fontSize: AppFontSize.sm,
          color: cs.primary,
          fontFeatures: const <FontFeature>[FontFeature.tabularFigures()],
        );

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: sem.accentSoft,
        borderRadius: BorderRadius.circular(AppRadius.sm),
      ),
      child: Text(formatBookmarkTime(time), style: style),
    );
  }
}
