import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';

import 'package:app_mobile/features/downloads/domain/device_storage.dart';
import 'package:app_mobile/i18n/strings.g.dart';
import 'package:app_mobile/shared/format/byte_size.dart';

/// The Downloads tab's storage header: a two-segment bar (CourseShelf / free)
/// over a legend, per `docs/design/cs-mobile-downloads/`.
///
/// Degrades deliberately. When the platform declined to report free space —
/// unsupported OS, a plugin failure, a test — [snapshot] is null or carries a
/// null reading, and the widget shows only what CourseShelf itself is holding
/// rather than inventing a denominator.
class StorageBar extends StatelessWidget {
  const StorageBar({required this.appUsedBytes, this.snapshot, super.key});

  final int appUsedBytes;
  final StorageSnapshot? snapshot;

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    final StorageSnapshot? reading = snapshot;
    final bool hasFree = reading?.hasDeviceFree ?? false;

    final String caption = hasFree
        ? context.t.downloads.storage.summary(
            used: formatDownloadBytes(appUsedBytes),
            free: formatDownloadBytes(reading!.deviceFreeBytes!),
          )
        : context.t.downloads.storage.appOnly(
            used: formatDownloadBytes(appUsedBytes),
          );

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.s4,
        AppSpacing.s4,
        AppSpacing.s4,
        AppSpacing.s2,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(caption, style: theme.textTheme.bodyMedium),
          const SizedBox(height: AppSpacing.s2),
          _Bar(appUsedBytes: appUsedBytes, freeBytes: reading?.deviceFreeBytes),
          if (hasFree) ...<Widget>[
            const SizedBox(height: AppSpacing.s2),
            _Legend(
              labels: <String>[
                context.t.downloads.storage.legendApp,
                context.t.downloads.storage.legendFree,
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _Bar extends StatelessWidget {
  const _Bar({required this.appUsedBytes, required this.freeBytes});

  final int appUsedBytes;
  final int? freeBytes;

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    final int? free = freeBytes;

    // Without a denominator there is no proportion to draw. Show a track with
    // a fixed token slice rather than a bar whose fill would silently mean
    // nothing.
    final bool proportional = free != null && appUsedBytes + free > 0;
    final int pool = proportional ? appUsedBytes + free : 0;

    return ClipRRect(
      borderRadius: BorderRadius.circular(AppRadius.sm),
      child: SizedBox(
        height: 8,
        child: Row(
          children: <Widget>[
            Expanded(
              flex: proportional ? appUsedBytes.clamp(0, pool) + 1 : 1,
              child: ColoredBox(color: theme.colorScheme.primary),
            ),
            Expanded(
              // The free remainder. Floored at 1 so a genuinely full device
              // still renders a track: Flutter throws if every flex is zero.
              flex: proportional ? (pool - appUsedBytes).clamp(1, pool) : 12,
              child: ColoredBox(
                color: theme.colorScheme.surfaceContainerHighest,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Legend extends StatelessWidget {
  const _Legend({required this.labels});

  final List<String> labels;

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    final List<Color> colors = <Color>[
      theme.colorScheme.primary,
      theme.colorScheme.surfaceContainerHighest,
    ];

    return Wrap(
      spacing: AppSpacing.s4,
      runSpacing: AppSpacing.s1,
      children: <Widget>[
        for (int i = 0; i < labels.length; i++)
          Row(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: colors[i],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: AppSpacing.s1),
              Text(labels[i], style: theme.textTheme.bodySmall),
            ],
          ),
      ],
    );
  }
}
