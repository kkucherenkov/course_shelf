import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';

import 'package:app_ui/src/icons/icon_cs.dart';
import 'package:app_ui/src/icons/icon_name.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// The error-state surface — Flutter twin of the web `AppErrorState`.
///
/// A centered, error-coloured surface: glyph + title + optional message +
/// usually a "Retry" action. Given [SemanticsRole.alert] — the exact Flutter
/// analogue of the web `role="alert"` — so assistive tech interrupts and
/// announces it assertively (contrast [AppEmptyState] / `AppNoPermission`,
/// both [SemanticsRole.status] since those surfaces are expected states, not
/// failures).
///
/// Two metrics are locally-owned rather than tokenised, matching the web
/// component (which hard-codes them too rather than routing through SCSS
/// vars) — same justification as [AppNoPermission] / [AppEmptyState]:
///  - [_iconSize] (40) — the web twin passes `:size="40"` to `IconCS`
///    directly instead of a token.
///  - [_maxMessageWidth] (512 = 32rem @ 16px root) — the web `max-width: 32rem`
///    on `.app-error-state__body` has no equivalent in the spacing scale.
class AppErrorState extends StatelessWidget {
  const AppErrorState({
    required this.title,
    this.icon = IconName.alert,
    this.message,
    this.action,
    super.key,
  });

  /// Which glyph to show above the title. Defaults to `alert`, matching web.
  final IconName icon;

  /// Rendered in an emphasised, error-coloured heading style.
  final String title;

  /// Supporting copy shown below the title; omitted entirely when null
  /// (mirrors the web `v-if="body"` — no empty paragraph is rendered).
  final String? message;

  /// Optional call-to-action slot (e.g. an `AppButton` "Retry"). Omitted
  /// entirely when null.
  final Widget? action;

  static const double _iconSize = 40;
  static const double _maxMessageWidth = 512;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    // Bind off the theme's titleLarge/bodyMedium (which carry the packaged
    // sans family) and override only size/weight/colour from tokens — never
    // the bare AppTextStyles, which degrades to the platform font in
    // consuming apps.
    final titleStyle = (theme.textTheme.titleLarge ?? const TextStyle())
        .copyWith(
          fontSize: AppFontSize.lg,
          fontWeight: AppFontWeight.semibold,
          color: cs.error,
        );
    final messageStyle = (theme.textTheme.bodyMedium ?? const TextStyle())
        .copyWith(fontSize: AppFontSize.sm, color: cs.onSurfaceVariant);

    return Semantics(
      container: true,
      role: SemanticsRole.alert,
      child: Padding(
        padding: const EdgeInsets.symmetric(
          vertical: AppSpacing.s7,
          horizontal: AppSpacing.s5,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: <Widget>[
            IconCS(name: icon, size: _iconSize, color: cs.error),
            const SizedBox(height: AppSpacing.s3),
            Text(title, textAlign: TextAlign.center, style: titleStyle),
            if (message != null) ...<Widget>[
              const SizedBox(height: AppSpacing.s3),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: _maxMessageWidth),
                child: Text(
                  message!,
                  textAlign: TextAlign.center,
                  style: messageStyle,
                ),
              ),
            ],
            if (action != null) ...<Widget>[
              // Web stacks a flex `gap` (space-3) with the action's own
              // `margin-top` (space-2) — reproduce both increments.
              const SizedBox(height: AppSpacing.s3 + AppSpacing.s2),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}
