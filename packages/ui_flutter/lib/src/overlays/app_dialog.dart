import 'package:flutter/material.dart';

import 'package:app_ui/src/buttons/app_button_variant.dart';
import 'package:app_ui/src/buttons/app_icon_button.dart';
import 'package:app_ui/src/icons/icon_name.dart';
import 'package:app_ui/src/overlays/overlay_action_row.dart';
import 'package:app_ui/src/theme/app_theme.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// Panel width bucket for [AppDialog] — Flutter twin of the web
/// `.app-dialog--sm` / `--md` modifier classes.
enum AppDialogSize {
  sm,
  md;

  /// Max panel width in logical pixels. Mirrors the web
  /// `.app-dialog--sm/--md { .app-dialog__panel { max-width: ... } }`
  /// hard-coded px values (480 / 640) — a locally-owned scale on both
  /// platforms; there is no spacing-token equivalent for a modal max-width.
  double get maxWidth => switch (this) {
    AppDialogSize.sm => 480,
    AppDialogSize.md => 640,
  };
}

/// The brand modal surface — Flutter twin of the web `AppDialog`.
///
/// This is the dialog PANEL only (header/description/body/footer), so
/// Widgetbook can render it inline. It does not manage open/close state or
/// route-level presentation itself; wrap it with [showAppDialog] (or a
/// hand-rolled `showDialog`/`Navigator` call) to present it modally.
///
/// [title] and its optional dismiss control render in a bordered header,
/// mirroring the web `<header class="app-dialog__header">`. [description],
/// [child] (the body slot), and [actions] (the footer slot) are each
/// independent and rendered only when supplied — unlike the web twin, whose
/// body `<div>` always mounts even when its default slot is empty. Omitting
/// an empty body avoids reserving padding around nothing and matches the
/// null-omits-render convention already used by [AppCard]/[AppNoPermission]
/// in this package.
class AppDialog extends StatelessWidget {
  const AppDialog({
    required this.title,
    this.description,
    this.size = AppDialogSize.md,
    this.dismissible = true,
    this.dismissLabel = 'Close',
    this.onDismiss,
    this.child,
    this.actions,
    super.key,
  });

  /// Rendered as the header heading; always present (mirrors the web
  /// `title` prop, which is required).
  final String title;

  /// Supporting copy shown below the header, in its own bordered row.
  /// Omitted entirely when null (web: `v-if="description"`).
  final String? description;

  final AppDialogSize size;

  /// Shows the header's close [AppIconButton] and wires it to [onDismiss].
  final bool dismissible;

  /// Accessible name for the dismiss button (web: `dismissLabel` prop,
  /// default `'Close'`).
  final String dismissLabel;

  /// Fires when the dismiss button is tapped. Callers presenting this via
  /// [showAppDialog] get this wired to `Navigator.pop` automatically.
  final VoidCallback? onDismiss;

  /// The body slot. Omitted entirely when null — see class doc.
  final Widget? child;

  /// The footer's action buttons, right-aligned and gap-spaced (web:
  /// `#footer` slot). Omitted entirely when null or empty.
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

    final bool hasActions = actions != null && actions!.isNotEmpty;

    return ConstrainedBox(
      key: const ValueKey<String>('appDialogPanel'),
      constraints: BoxConstraints(maxWidth: size.maxWidth),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: cs.surface,
          border: Border.all(color: cs.outline),
          borderRadius: BorderRadius.circular(AppRadius.lg),
          boxShadow: context.shadows.lg,
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              Container(
                key: const ValueKey<String>('appDialogHeader'),
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.s5,
                  vertical: AppSpacing.s4,
                ),
                decoration: BoxDecoration(
                  border: Border(bottom: BorderSide(color: cs.outline)),
                ),
                child: Row(
                  children: <Widget>[
                    Expanded(child: Text(title, style: titleStyle)),
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
                  key: const ValueKey<String>('appDialogDescription'),
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
                    key: const ValueKey<String>('appDialogBody'),
                    padding: const EdgeInsets.all(AppSpacing.s5),
                    child: child,
                  ),
                ),
              if (hasActions)
                Container(
                  key: const ValueKey<String>('appDialogFooter'),
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

/// Presents [AppDialog] modally via [showDialog], wiring its dismiss button
/// (and Material's barrier dismiss, when [dismissible]) to `Navigator.pop`.
///
/// The Widgetbook catalogue renders [AppDialog] directly (an imperative
/// `showDialog` call can't be catalogued inline) — use this helper from
/// application code instead of hand-rolling the `showDialog` boilerplate.
Future<T?> showAppDialog<T>(
  BuildContext context, {
  required String title,
  String? description,
  AppDialogSize size = AppDialogSize.md,
  bool dismissible = true,
  String dismissLabel = 'Close',
  Widget? child,
  List<Widget>? actions,
}) {
  return showDialog<T>(
    context: context,
    barrierDismissible: dismissible,
    builder: (BuildContext dialogContext) => Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.all(AppSpacing.s4),
      child: AppDialog(
        title: title,
        description: description,
        size: size,
        dismissible: dismissible,
        dismissLabel: dismissLabel,
        onDismiss: () => Navigator.of(dialogContext).pop(),
        actions: actions,
        child: child,
      ),
    ),
  );
}
