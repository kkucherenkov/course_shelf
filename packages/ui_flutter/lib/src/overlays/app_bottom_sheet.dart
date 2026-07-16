import 'package:flutter/material.dart';

import 'package:app_ui/src/buttons/app_button_variant.dart';
import 'package:app_ui/src/buttons/app_icon_button.dart';
import 'package:app_ui/src/icons/icon_name.dart';
import 'package:app_ui/src/overlays/overlay_action_row.dart';
import 'package:app_ui/src/theme/app_theme.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// The brand modal sheet — the mobile-native analogue of [AppDialog].
///
/// There is no web twin (a bottom sheet has no meaning on a pointer/keyboard
/// surface); this is a mobile-only pattern. It mirrors [AppDialog]'s visual
/// language — same header/description/body/footer borders, same tokens,
/// same [OverlayActionRow] footer — but surfaces as a rounded-top sheet with
/// an optional grab [showHandle] instead of a centred, fully-rounded panel.
///
/// This is the sheet CONTENT only, so Widgetbook can render it inline. Wrap
/// it with [showAppBottomSheet] (or a hand-rolled `showModalBottomSheet`
/// call) to present it as an actual bottom sheet route.
///
/// [title], [description], [child] (the body slot), and [actions] (the
/// footer slot) are each independent and rendered only when supplied. The
/// header itself — title heading plus the optional dismiss button — is
/// entirely omitted when there is no [title] and [dismissible] is false, so
/// a body-only sheet doesn't reserve an empty bordered strip.
class AppBottomSheet extends StatelessWidget {
  const AppBottomSheet({
    this.title,
    this.description,
    this.showHandle = true,
    this.dismissible = true,
    this.dismissLabel = 'Close',
    this.onDismiss,
    this.child,
    this.actions,
    super.key,
  });

  /// Rendered as the header heading when non-null. Unlike [AppDialog.title],
  /// optional — a sheet may be purely content with no heading.
  final String? title;

  /// Supporting copy shown below the header, in its own bordered row.
  /// Omitted entirely when null.
  final String? description;

  /// Shows the pill-shaped grab affordance at the top of the sheet — the
  /// visual cue (distinct from [dismissible]) that the sheet can be dragged
  /// closed. Purely decorative; drag-to-dismiss wiring is the presenting
  /// route's responsibility (e.g. `showModalBottomSheet`'s default drag
  /// behaviour), not this widget's.
  final bool showHandle;

  /// Shows the header's close [AppIconButton] and wires it to [onDismiss].
  final bool dismissible;

  /// Accessible name for the dismiss button.
  final String dismissLabel;

  /// Fires when the dismiss button is tapped. Callers presenting this via
  /// [showAppBottomSheet] get this wired to `Navigator.pop` automatically.
  final VoidCallback? onDismiss;

  /// The body slot. Omitted entirely when null.
  final Widget? child;

  /// The footer's action buttons, right-aligned and gap-spaced. Omitted
  /// entirely when null or empty.
  final List<Widget>? actions;

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    final ColorScheme cs = theme.colorScheme;

    // Bind off the theme's titleLarge/bodyMedium (which carry the packaged
    // sans family) and override only size/weight/colour from tokens — never
    // the bare AppTextStyles, which degrades to the platform font in
    // consuming apps.
    final TextStyle titleStyle =
        (theme.textTheme.titleLarge ?? const TextStyle()).copyWith(
          fontSize: AppFontSize.lg,
          fontWeight: AppFontWeight.semibold,
          color: cs.onSurface,
        );
    final TextStyle descriptionStyle =
        (theme.textTheme.bodyMedium ?? const TextStyle()).copyWith(
          fontSize: AppFontSize.sm,
          color: cs.onSurfaceVariant,
        );

    final bool hasHeader = title != null || dismissible;
    final bool hasActions = actions != null && actions!.isNotEmpty;

    return DecoratedBox(
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(AppRadius.xl),
          topRight: Radius.circular(AppRadius.xl),
        ),
        boxShadow: context.shadows.lg,
      ),
      child: ClipRRect(
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(AppRadius.xl),
          topRight: Radius.circular(AppRadius.xl),
        ),
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              if (showHandle)
                Padding(
                  key: const ValueKey<String>('appBottomSheetHandle'),
                  padding: const EdgeInsets.only(top: AppSpacing.s3),
                  child: Center(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        color: cs.outlineVariant,
                        borderRadius: BorderRadius.circular(AppRadius.pill),
                      ),
                      child: const SizedBox(
                        width: AppSpacing.s6,
                        height: AppSpacing.s1,
                      ),
                    ),
                  ),
                ),
              if (hasHeader)
                Container(
                  key: const ValueKey<String>('appBottomSheetHeader'),
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.s5,
                    vertical: AppSpacing.s4,
                  ),
                  decoration: BoxDecoration(
                    border: Border(bottom: BorderSide(color: cs.outline)),
                  ),
                  child: Row(
                    children: <Widget>[
                      Expanded(
                        child: title != null
                            ? Text(title!, style: titleStyle)
                            : const SizedBox.shrink(),
                      ),
                      if (dismissible) ...<Widget>[
                        const SizedBox(width: AppSpacing.s3),
                        AppIconButton(
                          name: IconName.x,
                          variant: AppButtonVariant.ghost,
                          size: AppButtonSize.sm,
                          semanticLabel: dismissLabel,
                          onPressed: onDismiss,
                        ),
                      ],
                    ],
                  ),
                ),
              if (description != null)
                Container(
                  key: const ValueKey<String>('appBottomSheetDescription'),
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.s5,
                    vertical: AppSpacing.s3,
                  ),
                  decoration: BoxDecoration(
                    border: Border(bottom: BorderSide(color: cs.outline)),
                  ),
                  child: Text(description!, style: descriptionStyle),
                ),
              if (child != null)
                Flexible(
                  child: SingleChildScrollView(
                    key: const ValueKey<String>('appBottomSheetBody'),
                    padding: const EdgeInsets.all(AppSpacing.s5),
                    child: child,
                  ),
                ),
              if (hasActions)
                Container(
                  key: const ValueKey<String>('appBottomSheetFooter'),
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.s5,
                    vertical: AppSpacing.s4,
                  ),
                  decoration: BoxDecoration(
                    border: Border(top: BorderSide(color: cs.outline)),
                  ),
                  child: OverlayActionRow(actions: actions!),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Presents [AppBottomSheet] via [showModalBottomSheet], wiring its dismiss
/// button to `Navigator.pop`.
///
/// The Widgetbook catalogue renders [AppBottomSheet] directly (an imperative
/// `showModalBottomSheet` call can't be catalogued inline) — use this helper
/// from application code instead of hand-rolling the boilerplate.
Future<T?> showAppBottomSheet<T>(
  BuildContext context, {
  String? title,
  String? description,
  bool showHandle = true,
  bool dismissible = true,
  String dismissLabel = 'Close',
  Widget? child,
  List<Widget>? actions,
  bool isScrollControlled = true,
}) {
  return showModalBottomSheet<T>(
    context: context,
    backgroundColor: Colors.transparent,
    isScrollControlled: isScrollControlled,
    isDismissible: dismissible,
    enableDrag: dismissible,
    builder: (BuildContext sheetContext) => AppBottomSheet(
      title: title,
      description: description,
      showHandle: showHandle,
      dismissible: dismissible,
      dismissLabel: dismissLabel,
      onDismiss: () => Navigator.of(sheetContext).pop(),
      actions: actions,
      child: child,
    ),
  );
}
