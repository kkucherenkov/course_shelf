import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_ui/app_ui.dart';

/// Widgetbook component cataloguing the `app_ui` [AppBookmarkList] — the
/// lesson bookmark list with an optional inline add row (E17-F02-S10).
WidgetbookComponent buildBookmarkListComponent() {
  return WidgetbookComponent(
    name: 'AppBookmarkList',
    useCases: [
      WidgetbookUseCase(name: 'Default', builder: _default),
      WidgetbookUseCase(name: 'Empty', builder: _empty),
      WidgetbookUseCase(name: 'Read-only', builder: _readOnly),
      WidgetbookUseCase(name: 'With add row', builder: _withAddRow),
      WidgetbookUseCase(name: 'Empty with add row', builder: _emptyWithAddRow),
      WidgetbookUseCase(name: 'Adding', builder: _adding),
      WidgetbookUseCase(name: 'Interactive', builder: _interactive),
    ],
  );
}

const List<BookmarkEntry> _sample = <BookmarkEntry>[
  BookmarkEntry(id: 'a', time: 42, label: 'Definition of consensus'),
  BookmarkEntry(id: 'b', time: 305, label: 'Quorum reads worked example'),
  BookmarkEntry(id: 'c', time: 612, label: 'Diagram redraw'),
  BookmarkEntry(id: 'd', time: 930),
];

Widget _frame(Widget child) => Center(
  child: SingleChildScrollView(
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: SizedBox(width: 360, child: child),
    ),
  ),
);

Widget _default(BuildContext context) => _frame(
  const AppBookmarkList(bookmarks: _sample),
);

Widget _empty(BuildContext context) => _frame(
  const AppBookmarkList(bookmarks: <BookmarkEntry>[]),
);

Widget _readOnly(BuildContext context) => _frame(
  const AppBookmarkList(bookmarks: _sample, editable: false),
);

Widget _withAddRow(BuildContext context) => _frame(
  const AppBookmarkList(bookmarks: _sample, addTime: 1024),
);

Widget _emptyWithAddRow(BuildContext context) => _frame(
  const AppBookmarkList(bookmarks: <BookmarkEntry>[], addTime: 90),
);

Widget _adding(BuildContext context) => _frame(
  const AppBookmarkList(bookmarks: _sample, addTime: 1024, adding: true),
);

Widget _interactive(BuildContext context) => _frame(const _InteractiveList());

/// Stateful host so the use case can demonstrate the list's callbacks end to
/// end: delete removes a row, save appends one after a simulated round trip.
class _InteractiveList extends StatefulWidget {
  const _InteractiveList();

  @override
  State<_InteractiveList> createState() => _InteractiveListState();
}

class _InteractiveListState extends State<_InteractiveList> {
  List<BookmarkEntry> _items = <BookmarkEntry>[
    const BookmarkEntry(id: '1', time: 90, label: 'Setup explanation'),
    const BookmarkEntry(id: '2', time: 305, label: 'Diagram'),
  ];
  bool _adding = false;
  String _lastEvent = '—';
  int _nextId = 3;

  void _log(String event) => setState(() => _lastEvent = event);

  void _handleDelete(String id) {
    setState(() {
      _items = _items.where((BookmarkEntry b) => b.id != id).toList();
      _lastEvent = 'delete($id)';
    });
  }

  Future<void> _handleAddSave(BookmarkDraft draft) async {
    setState(() => _adding = true);
    await Future<void>.delayed(const Duration(milliseconds: 250));
    if (!mounted) return;
    setState(() {
      _items = <BookmarkEntry>[
        ..._items,
        BookmarkEntry(
          id: '${_nextId++}',
          time: draft.time,
          label: draft.label,
        ),
      ];
      _adding = false;
      _lastEvent = 'addSave(${draft.time}, "${draft.label}")';
    });
  }

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        AppBookmarkList(
          bookmarks: _items,
          addTime: 425,
          adding: _adding,
          onSelect: (String id) => _log('select($id)'),
          onEdit: (String id) => _log('edit($id)'),
          onDelete: _handleDelete,
          onAddSave: _handleAddSave,
          onAddCancel: () => _log('addCancel'),
        ),
        const SizedBox(height: AppSpacing.s3),
        Text(
          'Last event: $_lastEvent',
          style: (theme.textTheme.bodySmall ?? const TextStyle()).copyWith(
            fontSize: AppFontSize.xs,
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}
