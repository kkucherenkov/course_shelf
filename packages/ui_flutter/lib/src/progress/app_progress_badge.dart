import 'package:flutter/material.dart';

import 'package:app_ui/src/icons/icon_cs.dart';
import 'package:app_ui/src/icons/icon_name.dart';
import 'package:app_ui/src/progress/app_progress_badge_variant.dart';
import 'package:app_ui/src/progress/app_progress_circle.dart';
import 'package:app_ui/src/progress/app_progress_linear.dart';
import 'package:app_ui/src/theme/app_theme.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// The ring / bar / pill progress indicator — Flutter twin of the web
/// `AppProgressBadge`.
///
/// Reports how far along [state] a thing is, in one of three [variant]s:
///  - [AppProgressBadgeVariant.ring] composes [AppProgressCircle] (same
///    32px/3px default geometry as the web's 32px outer / 26px inner disc)
///    with a centred percentage or `check`/`lock` glyph.
///  - [AppProgressBadgeVariant.bar] composes [AppProgressLinear] with a
///    trailing percentage column; must be laid out with a bounded width,
///    the same requirement [AppProgressLinear] itself has.
///  - [AppProgressBadgeVariant.pill] is a small rounded label with an
///    optional leading glyph.
///
/// [percent] — not [completed] / [total] alone — mirrors the web `pct`
/// computed prop exactly: `completed` state forces 100%, `notStarted` /
/// `locked` force 0%, and only `inProgress` derives its percentage from
/// `completed` / `total` (rounded, clamped 0..100, guarded against
/// division by zero).
class AppProgressBadge extends StatelessWidget {
  const AppProgressBadge({
    this.variant = AppProgressBadgeVariant.pill,
    this.state = AppProgressBadgeState.inProgress,
    this.completed = 0,
    this.total = 0,
    super.key,
  });

  final AppProgressBadgeVariant variant;
  final AppProgressBadgeState state;

  /// Units completed so far; only consulted when [state] is
  /// [AppProgressBadgeState.inProgress] (also shown verbatim in the pill's
  /// "N of M" copy for that state).
  final int completed;

  /// Units total; only consulted when [state] is
  /// [AppProgressBadgeState.inProgress].
  final int total;

  /// 0..100, mirroring the web `pct` computed prop. See the class doc.
  int get percent => switch (state) {
    AppProgressBadgeState.completed => 100,
    AppProgressBadgeState.notStarted => 0,
    AppProgressBadgeState.locked => 0,
    AppProgressBadgeState.inProgress =>
      total <= 0 ? 0 : ((completed / total) * 100).round().clamp(0, 100),
  };

  @override
  Widget build(BuildContext context) {
    return switch (variant) {
      AppProgressBadgeVariant.ring => _RingBadge(
        state: state,
        percent: percent,
      ),
      AppProgressBadgeVariant.bar => _BarBadge(state: state, percent: percent),
      AppProgressBadgeVariant.pill => _PillBadge(
        state: state,
        completed: completed,
        total: total,
      ),
    };
  }
}

/// The ring variant: an [AppProgressCircle] arc with a centred disc showing
/// either the percentage or a state glyph.
///
/// [_outerSize] / [_innerSize] mirror the web's literal 32px / 26px ring —
/// the 3px gap this leaves on each side becomes [AppProgressCircle.stroke],
/// so the arc this composes reads as the same band the web's `ring-inner`
/// cut-out implies, rather than reimplementing the arc math.
class _RingBadge extends StatelessWidget {
  const _RingBadge({required this.state, required this.percent});

  final AppProgressBadgeState state;
  final int percent;

  static const double _outerSize = 32;
  static const double _innerSize = 26;
  static const double _stroke = (_outerSize - _innerSize) / 2;

  @override
  Widget build(BuildContext context) {
    final ColorScheme cs = Theme.of(context).colorScheme;
    final bool isCompleted = state == AppProgressBadgeState.completed;
    final bool isLocked = state == AppProgressBadgeState.locked;

    final Color innerBackground = isCompleted
        ? cs.primary
        : isLocked
        ? cs.surfaceContainerLow
        : cs.surface;
    final Color innerForeground = isCompleted
        ? cs.onPrimary
        : isLocked
        ? cs.onSurfaceVariant
        : cs.onSurface;

    final Widget content = isCompleted
        ? IconCS(name: IconName.check, size: 14, color: innerForeground)
        : isLocked
        ? IconCS(name: IconName.lock, size: 12, color: innerForeground)
        : Text(
            '$percent%',
            style: (Theme.of(context).textTheme.labelSmall ?? const TextStyle())
                .copyWith(
                  fontWeight: AppFontWeight.medium,
                  letterSpacing: 0,
                  color: innerForeground,
                  fontFeatures: const <FontFeature>[
                    FontFeature.tabularFigures(),
                  ],
                ),
          );

    return Semantics(
      image: true,
      label: '$percent%',
      child: ExcludeSemantics(
        child: Stack(
          alignment: Alignment.center,
          children: <Widget>[
            AppProgressCircle(
              value: percent.toDouble(),
              size: _outerSize,
              stroke: _stroke,
            ),
            DecoratedBox(
              decoration: BoxDecoration(
                color: innerBackground,
                shape: BoxShape.circle,
              ),
              child: SizedBox(
                width: _innerSize,
                height: _innerSize,
                child: Center(child: content),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// The bar variant: an [AppProgressLinear] track with a trailing percentage
/// column.
///
/// [AppProgressLinear] always paints its fill from `colorScheme.primary`,
/// but the web `AppProgressBadge` switches the bar fill to its success
/// colour specifically when `state=completed` — a state-driven colour swap
/// the shared primitive has no parameter for. Rather than growing
/// [AppProgressLinear] a badge-specific colour override, this wraps it in a
/// locally-scoped [Theme] that substitutes `colorScheme.primary` for
/// `semanticColors.successFg` only for that one state, fully reusing the
/// primitive's existing determinate/animation logic unchanged.
class _BarBadge extends StatelessWidget {
  const _BarBadge({required this.state, required this.percent});

  final AppProgressBadgeState state;
  final int percent;

  /// Web: `min-width: 3em` on `.bar-pct`, at the badge's own `--text-xs`
  /// (11px) — a locally-owned pixel conversion; there is no token for an
  /// em-relative min-width.
  static const double _pctColumnWidth = 3 * AppFontSize.xs;

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    final ColorScheme cs = theme.colorScheme;
    final AppSemanticColors sem = context.semanticColors;

    final Widget track = AppProgressLinear(value: percent.toDouble());
    final Widget themedTrack = state == AppProgressBadgeState.completed
        ? Theme(
            data: theme.copyWith(
              colorScheme: cs.copyWith(primary: sem.successFg),
            ),
            child: track,
          )
        : track;

    final TextStyle textStyle =
        (theme.textTheme.labelSmall ?? const TextStyle()).copyWith(
          fontFamily: AppFontFamily.mono,
          letterSpacing: 0,
          color: cs.onSurfaceVariant,
          fontFeatures: const <FontFeature>[FontFeature.tabularFigures()],
        );

    // A single top-level node (mirroring the web's outer `role="img"
    // aria-label="{pct}%"`) rather than letting the visible trailing
    // percentage `Text` also contribute its own semantics node — which
    // would otherwise merge into a duplicated "33%\n33%" label.
    return Semantics(
      image: true,
      label: '$percent%',
      child: ExcludeSemantics(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: <Widget>[
            Expanded(child: themedTrack),
            const SizedBox(width: AppSpacing.s2),
            SizedBox(
              width: _pctColumnWidth,
              child: Text(
                '$percent%',
                textAlign: TextAlign.right,
                style: textStyle,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// The pill variant: a small rounded label, optionally with a leading glyph.
class _PillBadge extends StatelessWidget {
  const _PillBadge({
    required this.state,
    required this.completed,
    required this.total,
  });

  final AppProgressBadgeState state;
  final int completed;
  final int total;

  static const double _height = 22;
  static const double _iconSize = 10;

  @override
  Widget build(BuildContext context) {
    final ColorScheme cs = Theme.of(context).colorScheme;
    final AppSemanticColors sem = context.semanticColors;

    final Color background = switch (state) {
      AppProgressBadgeState.completed => sem.successSoft,
      AppProgressBadgeState.locked => cs.surfaceContainerHighest,
      AppProgressBadgeState.notStarted => Colors.transparent,
      AppProgressBadgeState.inProgress => cs.surfaceContainerHighest,
    };
    final Color foreground = switch (state) {
      AppProgressBadgeState.completed => sem.successFg,
      AppProgressBadgeState.locked => cs.onSurfaceVariant,
      AppProgressBadgeState.notStarted => cs.onSurfaceVariant,
      AppProgressBadgeState.inProgress => cs.onSurface,
    };
    final EdgeInsets padding = state == AppProgressBadgeState.notStarted
        ? EdgeInsets.zero
        : const EdgeInsets.symmetric(horizontal: AppSpacing.s2);

    final TextStyle textStyle =
        (Theme.of(context).textTheme.labelSmall ?? const TextStyle()).copyWith(
          fontWeight: AppFontWeight.medium,
          letterSpacing: 0,
          color: foreground,
          fontFeatures: const <FontFeature>[FontFeature.tabularFigures()],
        );

    final Widget content = switch (state) {
      AppProgressBadgeState.completed => Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          IconCS(name: IconName.check, size: _iconSize, color: foreground),
          const SizedBox(width: AppSpacing.s1),
          Text('Done', style: textStyle),
        ],
      ),
      AppProgressBadgeState.locked => Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          IconCS(name: IconName.lock, size: _iconSize, color: foreground),
          const SizedBox(width: AppSpacing.s1),
          Text('Locked', style: textStyle),
        ],
      ),
      AppProgressBadgeState.notStarted => Text('—', style: textStyle),
      AppProgressBadgeState.inProgress => Text(
        '$completed of $total',
        style: textStyle,
      ),
    };

    return DecoratedBox(
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(AppRadius.pill),
      ),
      child: Container(
        height: _height,
        padding: padding,
        alignment: Alignment.center,
        child: content,
      ),
    );
  }
}
