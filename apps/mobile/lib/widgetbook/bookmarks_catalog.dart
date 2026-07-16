import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_ui/app_ui.dart';

/// Widgetbook components cataloguing the `app_ui` bookmarks/notes trio —
/// [AppBookmark], [AppBookmarkAdd], and [AppNoteEditor] — one component per
/// widget, one use case per state (E17-F02-S04).
List<WidgetbookComponent> buildBookmarkComponents() {
  return [
    _buildAppBookmarkComponent(),
    _buildAppBookmarkAddComponent(),
    _buildAppNoteEditorComponent(),
  ];
}

WidgetbookComponent _buildAppBookmarkComponent() {
  return WidgetbookComponent(
    name: 'AppBookmark',
    useCases: [
      WidgetbookUseCase(name: 'Default', builder: _bookmarkDefault),
      WidgetbookUseCase(name: 'No label', builder: _bookmarkNoLabel),
      WidgetbookUseCase(name: 'Read-only', builder: _bookmarkReadOnly),
      WidgetbookUseCase(name: 'Stack', builder: _bookmarkStack),
    ],
  );
}

WidgetbookComponent _buildAppBookmarkAddComponent() {
  return WidgetbookComponent(
    name: 'AppBookmarkAdd',
    useCases: [
      WidgetbookUseCase(name: 'Default', builder: _bookmarkAddDefault),
      WidgetbookUseCase(name: 'Submitting', builder: _bookmarkAddSubmitting),
      WidgetbookUseCase(name: 'Hour-long', builder: _bookmarkAddHourLong),
    ],
  );
}

WidgetbookComponent _buildAppNoteEditorComponent() {
  return WidgetbookComponent(
    name: 'AppNoteEditor',
    useCases: [
      WidgetbookUseCase(name: 'Edit — saved', builder: _noteEditorSaved),
      WidgetbookUseCase(name: 'Preview', builder: _noteEditorPreview),
      WidgetbookUseCase(name: 'Syncing', builder: _noteEditorSyncing),
      WidgetbookUseCase(name: 'Failed', builder: _noteEditorFailed),
      WidgetbookUseCase(name: 'Offline', builder: _noteEditorOffline),
      WidgetbookUseCase(name: 'Empty', builder: _noteEditorEmpty),
    ],
  );
}

Widget _center(Widget child, {double width = 400}) => Center(
  child: Padding(
    padding: const EdgeInsets.all(16),
    child: SizedBox(width: width, child: child),
  ),
);

Widget _bookmarkDefault(BuildContext context) => _center(
  AppBookmark(
    time: 305,
    label: 'Quorum reads worked example',
    onSelect: () {},
    onEdit: () {},
    onDelete: () {},
  ),
);

Widget _bookmarkNoLabel(BuildContext context) =>
    _center(AppBookmark(time: 90, onSelect: () {}));

Widget _bookmarkReadOnly(BuildContext context) => _center(
  const AppBookmark(time: 612, label: 'Diagram redraw', editable: false),
);

Widget _bookmarkStack(BuildContext context) => _center(
  Column(
    mainAxisSize: MainAxisSize.min,
    children: [
      AppBookmark(time: 42, label: 'Definition of consensus', onSelect: () {}),
      AppBookmark(
        time: 305,
        label: 'Quorum reads worked example',
        onSelect: () {},
      ),
      AppBookmark(time: 612, label: 'Diagram redraw', onSelect: () {}),
      AppBookmark(time: 930, onSelect: () {}),
    ],
  ),
);

Widget _bookmarkAddDefault(BuildContext context) =>
    _center(AppBookmarkAdd(time: 305, onSave: (_) {}, onCancel: () {}));

Widget _bookmarkAddSubmitting(BuildContext context) =>
    _center(const AppBookmarkAdd(time: 305, submitting: true));

Widget _bookmarkAddHourLong(BuildContext context) =>
    _center(AppBookmarkAdd(time: 3725, onSave: (_) {}));

const String _sampleMarkdown = '''
# Quorum reads

With **N=5, R=3, W=3** we satisfy R+W>N so reads see the latest write.

Caveats:
- Linearizable only with a leader.
- Otherwise *stale-within-session* is still possible.''';

Widget _noteEditorSaved(BuildContext context) => _center(
  AppNoteEditor(
    modelValue: _sampleMarkdown,
    savedAt: DateTime.now().subtract(const Duration(seconds: 4)),
    onChanged: (_) {},
    onSave: (_) {},
  ),
  width: 480,
);

Widget _noteEditorPreview(BuildContext context) => _center(
  const AppNoteEditor(modelValue: _sampleMarkdown, mode: AppNoteMode.view),
  width: 480,
);

Widget _noteEditorSyncing(BuildContext context) => _center(
  const AppNoteEditor(
    modelValue: _sampleMarkdown,
    syncState: AppNoteSyncState.syncing,
  ),
  width: 480,
);

Widget _noteEditorFailed(BuildContext context) => _center(
  AppNoteEditor(
    modelValue: _sampleMarkdown,
    syncState: AppNoteSyncState.failed,
    onRetry: () {},
  ),
  width: 480,
);

Widget _noteEditorOffline(BuildContext context) => _center(
  const AppNoteEditor(
    modelValue: _sampleMarkdown,
    syncState: AppNoteSyncState.offline,
  ),
  width: 480,
);

Widget _noteEditorEmpty(BuildContext context) =>
    _center(AppNoteEditor(modelValue: '', onChanged: (_) {}), width: 480);
