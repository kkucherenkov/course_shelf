import 'package:flutter/material.dart';

import 'package:app_ui/src/buttons/app_button_variant.dart';
import 'package:app_ui/src/buttons/app_icon_button.dart';
import 'package:app_ui/src/containers/app_row.dart';
import 'package:app_ui/src/downloads/app_download_state.dart';
import 'package:app_ui/src/icons/icon_cs.dart';
import 'package:app_ui/src/icons/icon_name.dart';
import 'package:app_ui/src/progress/app_progress_linear.dart';
import 'package:app_ui/src/theme/app_theme.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// One row in the mobile downloads manager — a **mobile-only** composite
/// with no web twin (approved directly against the `DownloadRow` prose in
/// `docs/design/DESIGN_BRIEF.md` §5.7 / §7.7, 2026-07-17).
///
/// Presentational and controlled: [state] and [progress] are owned by the
/// caller (a download-manager Cubit in the consuming app) and every user
/// action surfaces as a callback rather than mutating internal state. Built
/// entirely from `app_ui` primitives — [AppRow] for the leading/body/
/// trailing layout, [IconCS] for the state glyph and the single trailing
/// action, [AppIconButton] for that action, and [AppProgressLinear] for the
/// `downloading`-only underline.
///
/// Glyph mapping (see [IconName]; every name below already exists in the
/// family — none invented):
///  - [AppDownloadState.queued] → `cloud` (waiting, not yet transferring)
///  - [AppDownloadState.downloading] → `cloudDown` (actively transferring)
///  - [AppDownloadState.paused] → `pause`
///  - [AppDownloadState.ready] → `check`
///  - [AppDownloadState.failed] → `alert`
///
/// Action affordance — a single trailing [AppIconButton], state-driven:
///  - queued / downloading → cancel (`x`, fires [onCancel])
///  - paused → resume (`play`, fires [onResume])
///  - failed → retry (`refresh` — the family has **no** dedicated "retry"
///    glyph; `refresh` is the closest existing match, chosen instead of
///    inventing one)
///  - ready → delete (`trash`, fires [onDelete])
///
/// [onPause] is exposed but unused by this widget's own layout: the approved
/// design specifies a *single* trailing action per row (matching the
/// DESIGN_BRIEF §5.7 prose, which lists only cancel/retry/delete), so no
/// separate pause affordance is rendered during `downloading`. A caller that
/// wants one can render it alongside and drive [state] to `paused` on tap.
///
/// Token mapping per the approved design:
///  - `failed`: the state glyph paints `colorScheme.error`, and the whole row
///    washes with `context.semanticColors.errorSoft` — the same "single
///    elevated affordance" pattern [AppRow.selected] uses with `accentSoft`,
///    applied here to flag a row that needs attention in a long download
///    list (a locally-owned reading of the brief's "failed glyph/text →
///    colorScheme.error / errorSoft" token line, since the approved layout
///    has no separate status-text slot to paint).
///  - `ready`: the state glyph paints `context.semanticColors.successFg`.
///  - size text (trailing) and the course subtitle (body, second line): both
///    `AppFontSize.sm` / `colorScheme.onSurfaceVariant`, overriding
///    [AppRow]'s default trailing style (which otherwise forces a
///    monospace/`xs` treatment meant for tabular timestamps).
class AppDownloadRow extends StatelessWidget {
  const AppDownloadRow({
    required this.lessonTitle,
    required this.courseTitle,
    required this.sizeText,
    required this.state,
    this.progress = 0,
    this.onCancel,
    this.onResume,
    this.onRetry,
    this.onDelete,
    this.onPause,
    this.cancelLabel = 'Cancel download',
    this.resumeLabel = 'Resume download',
    this.retryLabel = 'Retry download',
    this.deleteLabel = 'Delete download',
    super.key,
  }) : assert(
         progress >= 0 && progress <= 1,
         'progress must be within 0..1, got $progress',
       );

  /// First body line — the lesson name.
  final String lessonTitle;

  /// Second body line — the parent course name.
  final String courseTitle;

  /// Trailing size caption (e.g. `"128 MB"`); the caller formats/localizes it.
  final String sizeText;

  /// Which state-machine state this row currently renders.
  final AppDownloadState state;

  /// 0..1 completion fraction. Only meaningful — and only rendered as the
  /// progress underline — while [state] is [AppDownloadState.downloading].
  final double progress;

  /// Fires when the trailing action is tapped while [state] is
  /// [AppDownloadState.queued] or [AppDownloadState.downloading].
  final VoidCallback? onCancel;

  /// Fires when the trailing action is tapped while [state] is
  /// [AppDownloadState.paused].
  final VoidCallback? onResume;

  /// Fires when the trailing action is tapped while [state] is
  /// [AppDownloadState.failed].
  final VoidCallback? onRetry;

  /// Fires when the trailing action is tapped while [state] is
  /// [AppDownloadState.ready].
  final VoidCallback? onDelete;

  /// Reserved for a caller-rendered pause affordance during `downloading`;
  /// unused by this widget's own single-action layout — see class doc.
  final VoidCallback? onPause;

  /// Accessible name for the cancel action; override to localize.
  final String cancelLabel;

  /// Accessible name for the resume action; override to localize.
  final String resumeLabel;

  /// Accessible name for the retry action; override to localize.
  final String retryLabel;

  /// Accessible name for the delete action; override to localize.
  final String deleteLabel;

  /// Test/inspection key for the leading state glyph.
  static const Key stateIconKey = Key('appDownloadRowStateIcon');

  /// Test/inspection key for the trailing action button.
  static const Key actionKey = Key('appDownloadRowAction');

  /// Test/inspection key for the downloading-only progress underline.
  static const Key progressKey = Key('appDownloadRowProgress');

  bool get _showsProgress => state == AppDownloadState.downloading;

  IconName get _stateIcon => switch (state) {
    AppDownloadState.queued => IconName.cloud,
    AppDownloadState.downloading => IconName.cloudDown,
    AppDownloadState.paused => IconName.pause,
    AppDownloadState.ready => IconName.check,
    AppDownloadState.failed => IconName.alert,
  };

  Color _stateIconColor(ColorScheme cs, AppSemanticColors sem) =>
      switch (state) {
        AppDownloadState.failed => cs.error,
        AppDownloadState.ready => sem.successFg,
        AppDownloadState.downloading => cs.primary,
        AppDownloadState.queued ||
        AppDownloadState.paused => cs.onSurfaceVariant,
      };

  ({IconName icon, String label, VoidCallback? onPressed}) _resolveAction() =>
      switch (state) {
        AppDownloadState.queued || AppDownloadState.downloading => (
          icon: IconName.x,
          label: cancelLabel,
          onPressed: onCancel,
        ),
        AppDownloadState.paused => (
          icon: IconName.play,
          label: resumeLabel,
          onPressed: onResume,
        ),
        AppDownloadState.failed => (
          icon: IconName.refresh,
          label: retryLabel,
          onPressed: onRetry,
        ),
        AppDownloadState.ready => (
          icon: IconName.trash,
          label: deleteLabel,
          onPressed: onDelete,
        ),
      };

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    final ColorScheme cs = theme.colorScheme;
    final AppSemanticColors sem = context.semanticColors;

    // Bind off the theme's bodyMedium/bodySmall (which carry the packaged
    // sans family) and override only size/weight/colour from tokens — never
    // the bare AppTextStyles, which degrades to the platform font in
    // consuming apps.
    final TextStyle titleStyle =
        (theme.textTheme.bodyMedium ?? const TextStyle()).copyWith(
          fontWeight: AppFontWeight.medium,
          color: sem.textLoud,
        );
    // Also overrides AppRow's forced monospace/xs trailing treatment when
    // reused for [sizeText] below — see class doc.
    final TextStyle subtleStyle =
        (theme.textTheme.bodySmall ?? const TextStyle()).copyWith(
          fontSize: AppFontSize.sm,
          color: cs.onSurfaceVariant,
        );

    final action = _resolveAction();

    final Widget body = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        Text(
          lessonTitle,
          style: titleStyle,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: AppSpacing.s1),
        Text(
          courseTitle,
          style: subtleStyle,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        if (_showsProgress) ...<Widget>[
          const SizedBox(height: AppSpacing.s1),
          AppProgressLinear(
            key: progressKey,
            value: progress * 100,
            thin: true,
            label: 'Download progress',
          ),
        ],
      ],
    );

    final Widget trailing = Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        Text(sizeText, style: subtleStyle),
        const SizedBox(height: AppSpacing.s1),
        AppIconButton(
          key: actionKey,
          name: action.icon,
          semanticLabel: action.label,
          variant: AppButtonVariant.ghost,
          size: AppButtonSize.sm,
          onPressed: action.onPressed,
        ),
      ],
    );

    final Widget row = AppRow(
      leading: IconCS(
        key: stateIconKey,
        name: _stateIcon,
        color: _stateIconColor(cs, sem),
      ),
      body: body,
      trailing: trailing,
    );

    if (state != AppDownloadState.failed) return row;

    return DecoratedBox(
      decoration: BoxDecoration(
        color: sem.errorSoft,
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: row,
    );
  }
}
