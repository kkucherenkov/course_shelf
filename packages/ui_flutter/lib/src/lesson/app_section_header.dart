import 'package:flutter/material.dart';

import 'package:app_ui/src/icons/icon_cs.dart';
import 'package:app_ui/src/icons/icon_name.dart';
import 'package:app_ui/src/theme/app_theme.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// A collapsible curriculum-section header — Flutter twin of the web
/// `AppSectionHeader` (`docs/roadmap/tasks/E17-F02-S11.md`). Ships alongside
/// [AppLessonRow], which renders the lessons this header collapses.
///
/// Pure presentational and **controlled**: [open] flows in, [onToggle] flows
/// out. The widget never flips [open] itself — the feature layer owns the
/// section's expansion state (and the animated show/hide of the lessons
/// below), exactly as the web twin's `open` prop + `toggle` emit do.
///
/// Layout mirrors the web contract: a `chevron-down` [IconCS] that rotates
/// -90° when closed over [AppDuration.fast] (web: `transition: transform
/// var(--dur-fast)`), a single-line ellipsized title reading
/// `Section 01 · {title}`, and a right-aligned mono/tabular meta reading
/// `{n} lessons · {1h 5m}`.
///
/// A11y — the Flutter equivalent of the web's `role="button"` +
/// `tabindex="0"` + `aria-expanded`: the whole header is one merged
/// semantics node flagged as a button with an expanded state, focusable and
/// activatable by tap or by Enter/Space, with an inset focus ring (web:
/// `outline: 2px solid var(--brand-accent); outline-offset: -2px`).
///
/// User-visible strings are constructor params with English defaults (house
/// convention — see `AppDownloadRow`): `app_ui` is presentation-only, so the
/// app layer injects `AppLocalizations`-backed values. Defaults reproduce the
/// web's hardcoded `Section` / `lesson` / `lessons` output verbatim.
class AppSectionHeader extends StatefulWidget {
  const AppSectionHeader({
    required this.idx,
    required this.title,
    required this.count,
    required this.duration,
    this.open = true,
    this.onToggle,
    this.sectionLabel = 'Section',
    this.lessonLabel = 'lesson',
    this.lessonsLabel = 'lessons',
    super.key,
  });

  /// 1-based section index; zero-padded to 2 digits in the title.
  final int idx;

  /// Section title, rendered after the padded index.
  final String title;

  /// Number of lessons in the section; drives [lessonLabel] vs
  /// [lessonsLabel] (singular only at exactly 1, mirroring the web).
  final int count;

  /// Total runtime of the section. The web twin takes `duration: number`
  /// (seconds); a [Duration] is the idiomatic Dart substitution — the same
  /// call the sibling [AppLessonRow] makes. Negative values clamp to `0m`.
  final Duration duration;

  /// Open/closed state — drives the chevron rotation and the expanded
  /// semantics flag. Owned by the caller.
  final bool open;

  /// Fires when the header is tapped or activated via the keyboard; `null`
  /// makes the header inert (web: `emit('toggle')`).
  final VoidCallback? onToggle;

  /// Leading word of the title, before the padded index (web: `Section`).
  final String sectionLabel;

  /// Meta noun used when [count] is exactly 1 (web: `lesson`).
  final String lessonLabel;

  /// Meta noun used for every other [count] (web: `lessons`).
  final String lessonsLabel;

  static const Key chevronKey = Key('appSectionHeaderChevron');
  static const Key titleKey = Key('appSectionHeaderTitle');
  static const Key metaKey = Key('appSectionHeaderMeta');

  /// Quarter-turn anticlockwise — the web's `transform: rotate(-90deg)` on
  /// the chevron when the section is closed.
  static const double _closedTurns = -0.25;

  /// `Section 01 · {title}` — the web's
  /// `Section {{ String(idx).padStart(2, '0') }} · {{ title }}`.
  String get _titleText =>
      '$sectionLabel ${idx.toString().padLeft(2, '0')} · $title';

  /// `{n} lessons · {1h 5m}` — the web's `lessonsLabel · formattedDuration`.
  String get _metaText => '$_lessonsText · $_formattedDuration';

  String get _lessonsText =>
      count == 1 ? '1 $lessonLabel' : '$count $lessonsLabel';

  /// Ports the web `fmtDuration` exactly, including the zero-minutes branch
  /// (`3600 → '1h'`, not `'1h 0m'`) and the `Math.max(0, ...)` clamp.
  String get _formattedDuration {
    final int total = duration.inSeconds < 0 ? 0 : duration.inSeconds;
    final int hours = total ~/ 3600;
    final int minutes = (total % 3600) ~/ 60;
    if (hours > 0) {
      return minutes > 0 ? '${hours}h ${minutes}m' : '${hours}h';
    }
    return '${minutes}m';
  }

  @override
  State<AppSectionHeader> createState() => _AppSectionHeaderState();
}

class _AppSectionHeaderState extends State<AppSectionHeader> {
  bool _focused = false;

  void _setFocused(bool value) {
    if (_focused == value) return;
    setState(() => _focused = value);
  }

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    final ColorScheme cs = theme.colorScheme;

    return MergeSemantics(
      child: Semantics(
        button: true,
        expanded: widget.open,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: widget.onToggle,
            onFocusChange: _setFocused,
            overlayColor: const WidgetStatePropertyAll<Color>(
              Colors.transparent,
            ),
            splashFactory: NoSplash.splashFactory,
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.s2,
                vertical: AppSpacing.s3,
              ),
              decoration: BoxDecoration(
                border: Border(bottom: BorderSide(color: cs.outline)),
              ),
              // Painted over the content, so the ring sits *inside* the
              // header's own bounds — the web's `outline-offset: -2px`.
              foregroundDecoration: _focused
                  ? BoxDecoration(
                      border: Border.all(color: cs.primary, width: 2),
                    )
                  : null,
              child: Row(
                children: <Widget>[
                  AnimatedRotation(
                    key: AppSectionHeader.chevronKey,
                    turns: widget.open ? 0 : AppSectionHeader._closedTurns,
                    duration: AppDuration.fast,
                    curve: AppEasing.easeDefault,
                    child: IconCS(
                      name: IconName.chevronDown,
                      size: 14,
                      color: cs.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.s3),
                  Expanded(
                    child: Text(
                      widget._titleText,
                      key: AppSectionHeader.titleKey,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: _titleStyle(theme, cs),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.s3),
                  Text(
                    widget._metaText,
                    key: AppSectionHeader.metaKey,
                    style: _metaStyle(theme, cs),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  TextStyle _titleStyle(ThemeData theme, ColorScheme cs) {
    return (theme.textTheme.bodyMedium ?? const TextStyle()).copyWith(
      fontSize: AppFontSize.md,
      fontWeight: AppFontWeight.medium,
      color: cs.onSurface,
    );
  }

  // Same recipe AppRow/AppLessonRow use to bind the packaged mono face: start
  // from a themed style (the theme's textTheme is deliberately all-sans) and
  // override family/size/colour, then add tabular figures — the web's
  // `font-family: var(--font-mono); font-variant-numeric: tabular-nums`.
  TextStyle _metaStyle(ThemeData theme, ColorScheme cs) {
    return (theme.textTheme.bodySmall ?? const TextStyle()).copyWith(
      fontFamily: AppTypography.code.fontFamily,
      fontSize: AppFontSize.xs,
      color: cs.onSurfaceVariant,
      fontFeatures: const <FontFeature>[FontFeature.tabularFigures()],
    );
  }
}
