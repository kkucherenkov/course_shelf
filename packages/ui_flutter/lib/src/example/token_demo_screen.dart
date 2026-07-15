import 'package:flutter/material.dart';

import 'package:app_ui/src/theme/app_theme.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// Renders every populated design-token group so the theme can be eyeballed
/// and golden-tested. Mirrors the token sections of the web foundations page
/// (`apps/web/app/pages/dev/foundations.vue`).
///
/// `AppVerticalColors` is emitted empty by the token build and is omitted.
class TokenDemoScreen extends StatelessWidget {
  const TokenDemoScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final colors = context.semanticColors;
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.s4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            _Section(
              title: 'Brand accent scale',
              child: Row(
                children: <Widget>[
                  for (final Color c in colors.accentScale)
                    Expanded(child: _Swatch(color: c)),
                ],
              ),
            ),
            _Section(
              title: 'Scheme',
              child: _SwatchGrid(
                entries: <String, Color>{
                  'primary': scheme.primary,
                  'onPrimary': scheme.onPrimary,
                  'surface': scheme.surface,
                  'onSurface': scheme.onSurface,
                  'page': colors.pageBackground,
                  'raised': colors.raised,
                  'outline': scheme.outline,
                  'focus': colors.borderFocus,
                },
              ),
            ),
            _Section(
              title: 'Status',
              child: _SwatchGrid(
                entries: <String, Color>{
                  'success': colors.successFg,
                  'successSubtle': colors.successSubtle,
                  'warning': colors.warningFg,
                  'warningSubtle': colors.warningSubtle,
                  'error': scheme.error,
                  'errorSubtle': scheme.errorContainer,
                  'info': colors.infoFg,
                  'infoSubtle': colors.infoSubtle,
                },
              ),
            ),
            _Section(
              title: 'Skeleton',
              child: _SwatchGrid(
                entries: <String, Color>{
                  'base': colors.skeletonBase,
                  'shine': colors.skeletonShine,
                },
              ),
            ),
            const _Section(
              title: 'Typography',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text('Display', style: AppTextStyles.display),
                  Text('Heading 1', style: AppTextStyles.h1),
                  Text('Heading 2', style: AppTextStyles.h2),
                  Text('Heading 3', style: AppTextStyles.h3),
                  Text('Heading 4', style: AppTextStyles.h4),
                  Text('Body — the quick brown fox', style: AppTextStyles.body),
                  Text('Small — the quick brown fox', style: AppTextStyles.small),
                  Text('META — THE QUICK BROWN FOX', style: AppTextStyles.meta),
                  Text('Label', style: AppTextStyles.label),
                ],
              ),
            ),
            _Section(
              title: 'Code (mono)',
              child: Text(
                'const answer = 42;',
                style: AppTypography.code,
              ),
            ),
            _Section(
              title: 'Spacing',
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: <Widget>[
                  for (final double s in <double>[
                    AppSpacing.s1,
                    AppSpacing.s2,
                    AppSpacing.s3,
                    AppSpacing.s4,
                    AppSpacing.s5,
                    AppSpacing.s6,
                    AppSpacing.s7,
                  ])
                    Padding(
                      padding: const EdgeInsets.only(right: AppSpacing.s2),
                      child: Container(
                        width: s,
                        height: s,
                        color: scheme.primary,
                      ),
                    ),
                ],
              ),
            ),
            _Section(
              title: 'Radius',
              child: Row(
                children: <Widget>[
                  for (final double r in <double>[
                    AppRadius.xs,
                    AppRadius.sm,
                    AppRadius.md,
                    AppRadius.lg,
                    AppRadius.xl,
                    AppRadius.r2xl,
                  ])
                    Padding(
                      padding: const EdgeInsets.only(right: AppSpacing.s2),
                      child: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: colors.accentSoft,
                          borderRadius: BorderRadius.circular(r),
                          border: Border.all(color: scheme.outline),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            _Section(
              title: 'Shadows',
              child: Row(
                children: <Widget>[
                  for (final List<BoxShadow> s in <List<BoxShadow>>[
                    context.shadows.xs,
                    context.shadows.sm,
                    context.shadows.md,
                    context.shadows.lg,
                  ])
                    Padding(
                      padding: const EdgeInsets.all(AppSpacing.s3),
                      child: Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          color: scheme.surface,
                          borderRadius: BorderRadius.circular(AppRadius.md),
                          boxShadow: s,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            _Section(
              title: 'Opacity',
              child: Row(
                children: <Widget>[
                  for (final double o in <double>[
                    AppOpacity.disabled,
                    AppOpacity.muted,
                    AppOpacity.overlay,
                    AppOpacity.scrim,
                  ])
                    Padding(
                      padding: const EdgeInsets.only(right: AppSpacing.s2),
                      child: Opacity(
                        opacity: o,
                        child: Container(
                          width: 44,
                          height: 44,
                          color: scheme.primary,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.s5),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(title, style: Theme.of(context).textTheme.labelLarge),
          const SizedBox(height: AppSpacing.s2),
          child,
        ],
      ),
    );
  }
}

class _Swatch extends StatelessWidget {
  const _Swatch({required this.color});

  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 32,
      decoration: BoxDecoration(
        color: color,
        border: Border.all(color: Theme.of(context).colorScheme.outline),
      ),
    );
  }
}

class _SwatchGrid extends StatelessWidget {
  const _SwatchGrid({required this.entries});

  final Map<String, Color> entries;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: AppSpacing.s2,
      runSpacing: AppSpacing.s2,
      children: <Widget>[
        for (final MapEntry<String, Color> e in entries.entries)
          SizedBox(
            width: 92,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                _Swatch(color: e.value),
                const SizedBox(height: AppSpacing.s1),
                Text(e.key, style: AppTextStyles.meta),
              ],
            ),
          ),
      ],
    );
  }
}
