import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_ui/app_ui.dart';

/// Widgetbook component cataloguing the `app_ui` [AppProgressLinear]
/// determinate/indeterminate horizontal progress bar.
WidgetbookComponent buildAppProgressLinearComponent() {
  return WidgetbookComponent(
    name: 'AppProgressLinear',
    useCases: [
      WidgetbookUseCase(name: 'Values', builder: _linearValues),
      WidgetbookUseCase(name: 'Thin', builder: _linearThin),
      WidgetbookUseCase(name: 'Indeterminate', builder: _linearIndeterminate),
    ],
  );
}

/// Widgetbook component cataloguing the `app_ui` [AppProgressCircle]
/// determinate/indeterminate circular progress ring.
WidgetbookComponent buildAppProgressCircleComponent() {
  return WidgetbookComponent(
    name: 'AppProgressCircle',
    useCases: [
      WidgetbookUseCase(name: 'Values', builder: _circleValues),
      WidgetbookUseCase(name: 'Sizes', builder: _circleSizes),
      WidgetbookUseCase(name: 'Indeterminate', builder: _circleIndeterminate),
    ],
  );
}

/// Widgetbook component cataloguing the `app_ui` [AppSpinner] indeterminate
/// spinner.
WidgetbookComponent buildAppSpinnerComponent() {
  return WidgetbookComponent(
    name: 'AppSpinner',
    useCases: [
      WidgetbookUseCase(name: 'Sizes', builder: _spinnerSizes),
      WidgetbookUseCase(name: 'Colors', builder: _spinnerColors),
    ],
  );
}

/// Widgetbook component cataloguing the `app_ui` [AppSkeleton] shimmer
/// placeholder block.
WidgetbookComponent buildAppSkeletonComponent() {
  return WidgetbookComponent(
    name: 'AppSkeleton',
    useCases: [
      WidgetbookUseCase(name: 'Card placeholder', builder: _skeletonCard),
      WidgetbookUseCase(name: 'Radii', builder: _skeletonRadii),
    ],
  );
}

Widget _labelled(String label, Widget child) => Padding(
  padding: const EdgeInsets.symmetric(vertical: 6),
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    mainAxisSize: MainAxisSize.min,
    children: <Widget>[
      Text(label, style: const TextStyle(fontSize: 11)),
      const SizedBox(height: 4),
      child,
    ],
  ),
);

Widget _column(List<Widget> children) => Center(
  child: Padding(
    padding: const EdgeInsets.all(16),
    child: SizedBox(
      width: 280,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      ),
    ),
  ),
);

Widget _linearValues(BuildContext context) => _column([
  for (final value in <double>[0, 25, 50, 75, 100])
    _labelled('$value%', AppProgressLinear(value: value)),
]);

Widget _linearThin(BuildContext context) => _column([
  _labelled('thin 60%', const AppProgressLinear(value: 60, thin: true)),
]);

Widget _linearIndeterminate(BuildContext context) => _column([
  _labelled('indeterminate', const AppProgressLinear(label: 'Loading…')),
]);

Widget _circleValues(BuildContext context) => Center(
  child: Padding(
    padding: const EdgeInsets.all(16),
    child: Wrap(
      spacing: 24,
      runSpacing: 16,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: <Widget>[
        for (final value in <double>[0, 25, 50, 75, 100])
          Column(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              AppProgressCircle(value: value, label: '$value%'),
              const SizedBox(height: 6),
              Text('$value%', style: const TextStyle(fontSize: 11)),
            ],
          ),
      ],
    ),
  ),
);

Widget _circleSizes(BuildContext context) => const Center(
  child: Padding(
    padding: EdgeInsets.all(16),
    child: Wrap(
      spacing: 24,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: <Widget>[
        AppProgressCircle(value: 65, label: 'Default 65%'),
        AppProgressCircle(value: 65, size: 56, stroke: 4, label: 'Large 65%'),
      ],
    ),
  ),
);

Widget _circleIndeterminate(BuildContext context) => const Center(
  child: Padding(
    padding: EdgeInsets.all(16),
    child: AppProgressCircle(label: 'Loading'),
  ),
);

Widget _spinnerSizes(BuildContext context) => Center(
  child: Padding(
    padding: const EdgeInsets.all(16),
    child: Wrap(
      spacing: 24,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: <Widget>[
        for (final size in AppSpinnerSize.values) AppSpinner(size: size),
      ],
    ),
  ),
);

Widget _spinnerColors(BuildContext context) => const Center(
  child: Padding(
    padding: EdgeInsets.all(16),
    child: Wrap(
      spacing: 24,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: <Widget>[
        DefaultTextStyle(
          style: TextStyle(color: Colors.amber),
          child: AppSpinner(),
        ),
        DefaultTextStyle(
          style: TextStyle(color: Colors.red),
          child: AppSpinner(),
        ),
        DefaultTextStyle(
          style: TextStyle(color: Colors.green),
          child: AppSpinner(),
        ),
      ],
    ),
  ),
);

Widget _skeletonCard(BuildContext context) => const Center(
  child: Padding(
    padding: EdgeInsets.all(16),
    child: SizedBox(
      width: 280,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: <Widget>[
              AppSkeleton(width: 40, height: 40, radius: AppSkeletonRadius.md),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    AppSkeleton(width: 160, height: 14),
                    SizedBox(height: 8),
                    AppSkeleton(width: 100, height: 12),
                  ],
                ),
              ),
            ],
          ),
          SizedBox(height: 12),
          AppSkeleton(width: 200, height: 80, radius: AppSkeletonRadius.md),
        ],
      ),
    ),
  ),
);

Widget _skeletonRadii(BuildContext context) => _column([
  for (final radius in AppSkeletonRadius.values)
    _labelled(radius.name, AppSkeleton(height: 16, radius: radius)),
]);
