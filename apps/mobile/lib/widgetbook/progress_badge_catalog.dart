import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_ui/app_ui.dart';

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
    _labelled(
      state.name,
      AppProgressBadge(
        variant: AppProgressBadgeVariant.ring,
        state: state,
        completed: 4,
        total: 12,
      ),
    ),
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
            AppProgressBadge(
              variant: AppProgressBadgeVariant.bar,
              state: state,
              completed: 4,
              total: 12,
            ),
            const SizedBox(height: 16),
          ],
        ],
      ),
    ),
  ),
);

Widget _pillStates(BuildContext context) => _row(<Widget>[
  for (final state in AppProgressBadgeState.values)
    _labelled(
      state.name,
      AppProgressBadge(
        variant: AppProgressBadgeVariant.pill,
        state: state,
        completed: 4,
        total: 12,
      ),
    ),
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
                    AppProgressBadge(
                      variant: variant,
                      state: state,
                      completed: 4,
                      total: 12,
                    ),
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
                  AppProgressBadge(
                    variant: variant,
                    state: state,
                    completed: 4,
                    total: 12,
                  ),
              ],
            ),
        ],
      ],
    ),
  ),
);
