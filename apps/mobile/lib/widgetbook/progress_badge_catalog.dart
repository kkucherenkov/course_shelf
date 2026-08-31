import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_ui/app_ui.dart';

import 'package:app_mobile/i18n/strings.g.dart';

/// Widgetbook component cataloguing the `app_ui` [AppProgressBadge] — the
/// ring / bar / pill progress indicator (E17-F02-S05).
WidgetbookComponent buildProgressBadgeComponent() {
  return WidgetbookComponent(
    name: 'AppProgressBadge',
    useCases: [
      WidgetbookUseCase(name: 'Ring', builder: _ringStates),
      WidgetbookUseCase(name: 'Bar', builder: _barStates),
      WidgetbookUseCase(name: 'Pill', builder: _pillStates),
      WidgetbookUseCase(name: 'Variant × state matrix', builder: _matrix),
    ],
  );
}

/// The one place the catalog builds a badge.
///
/// `app_ui` owns no locale and looks nothing up (see [AppProgressBadge]'s own
/// doc), so its English defaults only disappear if a consumer passes copy in.
/// This is `apps/mobile`'s only [AppProgressBadge] call site, so it is also the
/// only place that can — #268.
AppProgressBadge _badge(
  BuildContext context,
  AppProgressBadgeVariant variant,
  AppProgressBadgeState state,
) {
  final TranslationsUiProgressBadgeEn copy = context.t.ui.progressBadge;
  return AppProgressBadge(
    variant: variant,
    state: state,
    completed: 4,
    total: 12,
    doneLabel: copy.done,
    lockedLabel: copy.locked,
    notStartedLabel: copy.notStarted,
    progressLabel: (int completed, int total) =>
        copy.progress(completed: completed, total: total),
  );
}

Widget _labelled(String label, Widget child) => Padding(
  padding: const EdgeInsets.symmetric(vertical: 6),
  child: Column(
    mainAxisSize: MainAxisSize.min,
    children: <Widget>[
      child,
      const SizedBox(height: 4),
      Text(label, style: const TextStyle(fontSize: 11)),
    ],
  ),
);

Widget _row(List<Widget> children) => Center(
  child: Padding(
    padding: const EdgeInsets.all(16),
    child: Wrap(
      spacing: 24,
      runSpacing: 16,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: children,
    ),
  ),
);

Widget _ringStates(BuildContext context) => _row(<Widget>[
  for (final state in AppProgressBadgeState.values)
    _labelled(state.name, _badge(context, AppProgressBadgeVariant.ring, state)),
]);

Widget _barStates(BuildContext context) => Center(
  child: Padding(
    padding: const EdgeInsets.all(16),
    child: SizedBox(
      width: 280,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          for (final state in AppProgressBadgeState.values) ...<Widget>[
            Text(state.name, style: const TextStyle(fontSize: 11)),
            const SizedBox(height: 4),
            _badge(context, AppProgressBadgeVariant.bar, state),
            const SizedBox(height: 16),
          ],
        ],
      ),
    ),
  ),
);

Widget _pillStates(BuildContext context) => _row(<Widget>[
  for (final state in AppProgressBadgeState.values)
    _labelled(state.name, _badge(context, AppProgressBadgeVariant.pill, state)),
]);

Widget _matrix(BuildContext context) => Center(
  child: Padding(
    padding: const EdgeInsets.all(16),
    child: Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        for (final variant in AppProgressBadgeVariant.values) ...<Widget>[
          Padding(
            padding: const EdgeInsets.only(top: 8, bottom: 4),
            child: Text(
              variant.name,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          if (variant == AppProgressBadgeVariant.bar)
            SizedBox(
              width: 280,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  for (final state in AppProgressBadgeState.values) ...<Widget>[
                    _badge(context, variant, state),
                    const SizedBox(height: 8),
                  ],
                ],
              ),
            )
          else
            Wrap(
              spacing: 16,
              runSpacing: 8,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: <Widget>[
                for (final state in AppProgressBadgeState.values)
                  _badge(context, variant, state),
              ],
            ),
        ],
      ],
    ),
  ),
);
