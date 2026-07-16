import 'package:flutter/material.dart';

import 'package:app_ui/src/bookmarks/bookmark_time.dart';
import 'package:app_ui/src/buttons/app_button_variant.dart';
import 'package:app_ui/src/buttons/app_icon_button.dart';
import 'package:app_ui/src/icons/icon_name.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// A single lesson bookmark row — Flutter twin of the web `AppBookmark`.
///
/// Renders a tappable row with a formatted [time] chip (`M:SS`, or `H:MM:SS`
/// past an hour — see `formatBookmarkTime`), an optional truncated [label],
/// and — when [editable] (default) — trailing edit/delete icon actions.
/// [onSelect] fires on tap; [onEdit] / [onDelete] fire from their own icon
/// buttons and never bubble into [onSelect].
///
/// Deviations from the web `AppBookmark.vue` (documented, not oversights):
///  - **Actions always visible, not hover-revealed.** The web fades the
///    action row in on `:hover` / `:focus-within` (`opacity: 0` → `1`);
///    touch has no hover, so hiding the only path to edit/delete would make
///    them unreachable. This twin renders them unconditionally whenever
///    [editable] is true.
///  - **28×28 `AppIconButton` (`ghost`/`sm`), not a bespoke 24×24 button.**
///    The web action buttons are a flat 24px box with a 14px glyph; this
///    package's button scale has no 24 step (sm/md/lg = 28/36/44), and the
///    directive is to reuse [AppIconButton] rather than hand-roll one. `sm`
///    is the closest step — slightly larger, and a friendlier touch target.
///  - **Tap-only selection.** No bespoke Enter/Space keyboard handler for
///    the row itself (the web's `@keydown` on its `role="button"` div) —
///    the nested `GestureDetector`'s own `onTap` semantics action already
///    responds to assistive-technology "activate", matching this package's
///    `AppChip` precedent for a tappable-row-with-nested-actions shape.
///  - **10px row padding/gap.** The web rule is a bare literal
///    (`padding: 10px; gap: 10px;`), not a token — carried over verbatim as
///    a locally-owned constant.
class AppBookmark extends StatelessWidget {
  const AppBookmark({
    required this.time,
    this.label = '',
    this.editable = true,
    this.onSelect,
    this.onEdit,
    this.onDelete,
    super.key,
  });

  /// Bookmark position, in seconds.
  final double time;

  /// Optional human label.
  final String label;

  /// When true (default) the edit/delete actions are rendered.
  final bool editable;

  final VoidCallback? onSelect;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  /// Web parity row padding/gap (`10px`); not a spacing-scale step.
  static const double _rowPad = 10;

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    final ColorScheme cs = theme.colorScheme;

    final String formatted = formatBookmarkTime(time);
    final String semanticLabel = label.isEmpty
        ? 'Bookmark at $formatted'
        : 'Bookmark at $formatted: $label';

    final TextStyle labelStyle =
        (theme.textTheme.bodyMedium ?? const TextStyle()).copyWith(
          fontSize: AppFontSize.sm,
          color: cs.onSurface,
        );

    // `Semantics` is the outermost widget so `AppBookmark`'s own render
    // object carries the button/label annotation — mirrors `AppChip`'s same
    // "tappable row + nested action buttons" shape.
    return Semantics(
      container: true,
      button: true,
      label: semanticLabel,
      child: Padding(
        padding: const EdgeInsets.all(_rowPad),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Expanded(
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: onSelect,
                // The time chip / label text would otherwise bubble their
                // own (conflicting) label content up into the explicit
                // `label` set above — exclude them so the row exposes a
                // single, exact semantics label.
                child: ExcludeSemantics(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      BookmarkTimeChip(time: time),
                      const SizedBox(width: _rowPad),
                      Expanded(
                        child: Text(
                          label,
                          style: labelStyle,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            if (editable) ...<Widget>[
              const SizedBox(width: _rowPad),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  AppIconButton(
                    name: IconName.edit,
                    semanticLabel: 'Edit bookmark',
                    variant: AppButtonVariant.ghost,
                    size: AppButtonSize.sm,
                    onPressed: onEdit,
                  ),
                  const SizedBox(width: AppSpacing.s1),
                  AppIconButton(
                    name: IconName.trash,
                    semanticLabel: 'Delete bookmark',
                    variant: AppButtonVariant.ghost,
                    size: AppButtonSize.sm,
                    onPressed: onDelete,
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
