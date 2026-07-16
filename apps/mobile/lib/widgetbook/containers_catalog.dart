import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_ui/app_ui.dart';

/// Widgetbook components cataloguing the `app_ui` layout/container
/// primitives: [AppCard], [AppRow], [AppTabs], and [AppSegmented].
List<WidgetbookComponent> buildContainerComponents() {
  return [
    _buildAppCardComponent(),
    _buildAppRowComponent(),
    _buildAppTabsComponent(),
    _buildAppSegmentedComponent(),
  ];
}

WidgetbookComponent _buildAppCardComponent() {
  return WidgetbookComponent(
    name: 'AppCard',
    useCases: [
      WidgetbookUseCase(name: 'Sizes', builder: _cardSizes),
      WidgetbookUseCase(name: 'Hoverable', builder: _cardHoverable),
      WidgetbookUseCase(name: 'Interactive', builder: _cardInteractive),
    ],
  );
}

WidgetbookComponent _buildAppRowComponent() {
  return WidgetbookComponent(
    name: 'AppRow',
    useCases: [
      WidgetbookUseCase(name: 'Default', builder: _rowDefault),
      WidgetbookUseCase(name: 'Selected + compact', builder: _rowVariants),
      WidgetbookUseCase(name: 'Interactive', builder: _rowInteractive),
    ],
  );
}

WidgetbookComponent _buildAppTabsComponent() {
  return WidgetbookComponent(
    name: 'AppTabs',
    useCases: [WidgetbookUseCase(name: 'Course sections', builder: _tabs)],
  );
}

WidgetbookComponent _buildAppSegmentedComponent() {
  return WidgetbookComponent(
    name: 'AppSegmented',
    useCases: [WidgetbookUseCase(name: 'View mode', builder: _segmented)],
  );
}

Widget _column(List<Widget> children) => Center(
  child: SingleChildScrollView(
    padding: const EdgeInsets.all(16),
    child: Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final child in children)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: child,
          ),
      ],
    ),
  ),
);

Widget _cardSizes(BuildContext context) => _column([
  const AppCard(
    title: 'System health',
    description: 'Realtime dependency status',
    child: Text('Ready to ship.'),
  ),
  const AppCard(
    size: AppCardSize.lg,
    title: 'Large card',
    description: '24px padding, radius-lg corner.',
    footer: Text('Footer content'),
    child: Text('More breathing room.'),
  ),
]);

Widget _cardHoverable(BuildContext context) => _column([
  const AppCard(
    hoverable: true,
    title: 'Hoverable',
    description: 'Visual lift on hover — not focusable, no tap.',
    child: Text('Hover me on desktop/web.'),
  ),
]);

Widget _cardInteractive(BuildContext context) => _column([
  AppCard(
    interactive: true,
    onTap: () {},
    title: 'Upcoming booking',
    description: 'Tap to view the full appointment',
    child: const Text('This whole card is a button.'),
  ),
]);

Widget _rowDefault(BuildContext context) => _column([
  const SizedBox(
    width: 320,
    child: AppRow(
      leading: CircleAvatar(radius: 16),
      body: Text('Design Fundamentals'),
      trailing: Text('7h 12m'),
    ),
  ),
]);

Widget _rowVariants(BuildContext context) => _column([
  const SizedBox(
    width: 320,
    child: Column(
      children: [
        AppRow(
          selected: true,
          leading: CircleAvatar(radius: 16),
          body: Text('Vue 3 Masterclass'),
          trailing: Text('3h 45m'),
        ),
        SizedBox(height: 2),
        AppRow(compact: true, body: Text('Compact row'), trailing: Text('42%')),
      ],
    ),
  ),
]);

Widget _rowInteractive(BuildContext context) => _column([
  SizedBox(
    width: 320,
    child: AppRow(
      interactive: true,
      onTap: () {},
      leading: const CircleAvatar(radius: 16),
      body: const Text('Tap this row'),
      trailing: const Text('12:00'),
    ),
  ),
]);

Widget _tabs(BuildContext context) {
  return _StatefulPreview<int>(
    initial: 0,
    builder: (context, selected, onChanged) => SizedBox(
      width: 360,
      child: AppTabs(
        items: const [
          AppTabItem(label: 'Overview'),
          AppTabItem(label: 'Curriculum'),
          AppTabItem(label: 'Reviews'),
        ],
        selectedIndex: selected,
        onChanged: onChanged,
        label: 'Course sections',
      ),
    ),
  );
}

Widget _segmented(BuildContext context) {
  return _StatefulPreview<int>(
    initial: 0,
    builder: (context, selected, onChanged) => AppSegmented(
      items: const [
        AppSegmentedItemData(label: 'List'),
        AppSegmentedItemData(label: 'Grid'),
        AppSegmentedItemData(label: 'Compact'),
      ],
      selectedIndex: selected,
      onChanged: onChanged,
      label: 'View mode',
    ),
  );
}

/// Minimal stateful shell so controlled components (AppTabs/AppSegmented)
/// visibly respond to taps inside the Widgetbook preview pane.
class _StatefulPreview<T> extends StatefulWidget {
  const _StatefulPreview({required this.initial, required this.builder});

  final T initial;
  final Widget Function(
    BuildContext context,
    T value,
    ValueChanged<T> onChanged,
  )
  builder;

  @override
  State<_StatefulPreview<T>> createState() => _StatefulPreviewState<T>();
}

class _StatefulPreviewState<T> extends State<_StatefulPreview<T>> {
  late T _value = widget.initial;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: widget.builder(
          context,
          _value,
          (value) => setState(() => _value = value),
        ),
      ),
    );
  }
}
