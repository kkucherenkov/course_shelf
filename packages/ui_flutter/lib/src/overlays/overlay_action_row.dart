import 'package:flutter/widgets.dart';

import 'package:app_ui/src/theme/tokens.g.dart';

/// Right-aligned, gap-spaced action row shared by [AppDialog]'s and
/// [AppBottomSheet]'s footer slots — Flutter twin of the web
/// `.app-dialog__footer { display: flex; justify-content: flex-end;
/// gap: var(--space-2); }`.
///
/// Internal to the `overlays` implementation — not exported from
/// `app_ui.dart`.
class OverlayActionRow extends StatelessWidget {
  const OverlayActionRow({required this.actions, super.key});

  final List<Widget> actions;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.end,
      mainAxisSize: MainAxisSize.max,
      children: <Widget>[
        for (int i = 0; i < actions.length; i++) ...<Widget>[
          if (i > 0) const SizedBox(width: AppSpacing.s2),
          actions[i],
        ],
      ],
    );
  }
}
