import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_ui/app_ui.dart';

/// Widgetbook component cataloguing the `app_ui` [AppSectionHeader] — the
/// collapsible curriculum-section header shipped alongside [AppLessonRow]
/// (`docs/roadmap/tasks/E17-F02-S11.md`).
///
/// The `Open` / `Closed` use cases are *stateful* — [AppSectionHeader] is a
/// controlled widget, so the catalog owns the open flag and flips it on
/// toggle, exactly as a feature-layer Bloc would.
WidgetbookComponent buildSectionHeaderComponent() {
  return WidgetbookComponent(
    name: 'AppSectionHeader',
    useCases: [
      WidgetbookUseCase(name: 'Open', builder: _open),
      WidgetbookUseCase(name: 'Closed', builder: _closed),
      WidgetbookUseCase(name: 'Long title (ellipsis)', builder: _longTitle),
      WidgetbookUseCase(name: 'Single lesson', builder: _singleLesson),
    ],
  );
}

Widget _frame(Widget child) => Center(
  child: Padding(
    padding: const EdgeInsets.all(16),
    child: SizedBox(width: 340, child: child),
  ),
);

Widget _open(BuildContext context) => _frame(
  const _ToggleableSectionHeader(
    idx: 1,
    title: 'TypeScript foundations',
    count: 6,
    duration: Duration(seconds: 3300),
    initiallyOpen: true,
  ),
);

Widget _closed(BuildContext context) => _frame(
  const _ToggleableSectionHeader(
    idx: 2,
    title: 'Type narrowing',
    count: 4,
    duration: Duration(seconds: 2200),
    initiallyOpen: false,
  ),
);

Widget _longTitle(BuildContext context) => _frame(
  const _ToggleableSectionHeader(
    idx: 10,
    title:
        'Advanced generics, variance, and the structural type system '
        'explained from first principles',
    count: 9,
    duration: Duration(seconds: 7245),
    initiallyOpen: true,
  ),
);

Widget _singleLesson(BuildContext context) => _frame(
  const _ToggleableSectionHeader(
    idx: 3,
    title: 'Bonus material',
    count: 1,
    duration: Duration(seconds: 540),
    initiallyOpen: true,
  ),
);

/// Minimal stand-in for the feature layer that owns `open` — lets the catalog
/// demo the chevron's rotate transition on tap.
class _ToggleableSectionHeader extends StatefulWidget {
  const _ToggleableSectionHeader({
    required this.idx,
    required this.title,
    required this.count,
    required this.duration,
    required this.initiallyOpen,
  });

  final int idx;
  final String title;
  final int count;
  final Duration duration;
  final bool initiallyOpen;

  @override
  State<_ToggleableSectionHeader> createState() =>
      _ToggleableSectionHeaderState();
}

class _ToggleableSectionHeaderState extends State<_ToggleableSectionHeader> {
  late bool _open = widget.initiallyOpen;

  @override
  Widget build(BuildContext context) {
    return AppSectionHeader(
      idx: widget.idx,
      title: widget.title,
      count: widget.count,
      duration: widget.duration,
      open: _open,
      onToggle: () => setState(() => _open = !_open),
    );
  }
}
