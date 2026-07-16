import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_ui/app_ui.dart';

/// Widgetbook component cataloguing the `app_ui` [AppDownloadRow] — the
/// mobile-only downloads-manager state machine row (E17-F02-S06). One use
/// case per [AppDownloadState].
WidgetbookComponent buildDownloadRowComponent() {
  return WidgetbookComponent(
    name: 'AppDownloadRow',
    useCases: [
      WidgetbookUseCase(name: 'Queued', builder: _queued),
      WidgetbookUseCase(name: 'Downloading', builder: _downloading),
      WidgetbookUseCase(name: 'Paused', builder: _paused),
      WidgetbookUseCase(name: 'Ready', builder: _ready),
      WidgetbookUseCase(name: 'Failed', builder: _failed),
    ],
  );
}

Widget _frame(Widget child) => Center(
  child: Padding(
    padding: const EdgeInsets.all(16),
    child: SizedBox(width: 340, child: child),
  ),
);

Widget _queued(BuildContext context) => _frame(
  AppDownloadRow(
    lessonTitle: '01 — Kickoff',
    courseTitle: 'Design Fundamentals',
    sizeText: '64 MB',
    state: AppDownloadState.queued,
    onCancel: () {},
  ),
);

Widget _downloading(BuildContext context) => _frame(
  AppDownloadRow(
    lessonTitle: '12 — Quorum reads',
    courseTitle: 'Distributed Systems',
    sizeText: '128 MB',
    state: AppDownloadState.downloading,
    progress: 0.42,
    onCancel: () {},
  ),
);

Widget _paused(BuildContext context) => _frame(
  AppDownloadRow(
    lessonTitle: '04 — Consensus intro',
    courseTitle: 'Distributed Systems',
    sizeText: '96 MB',
    state: AppDownloadState.paused,
    progress: 0.6,
    onResume: () {},
  ),
);

Widget _ready(BuildContext context) => _frame(
  AppDownloadRow(
    lessonTitle: '02 — Composables',
    courseTitle: 'Vue 3 Masterclass',
    sizeText: '210 MB',
    state: AppDownloadState.ready,
    onDelete: () {},
  ),
);

Widget _failed(BuildContext context) => _frame(
  AppDownloadRow(
    lessonTitle: '07 — Suspense & islands',
    courseTitle: 'Vue 3 Masterclass',
    sizeText: '88 MB',
    state: AppDownloadState.failed,
    onRetry: () {},
  ),
);
