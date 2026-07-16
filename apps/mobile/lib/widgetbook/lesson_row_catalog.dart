import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_ui/app_ui.dart';

/// Widgetbook component cataloguing the `app_ui` [AppLessonRow] — the
/// mobile lesson row, including its mobile-only download-state affordance
/// (`docs/roadmap/tasks/E17-F02-S02.md`).
WidgetbookComponent buildLessonRowComponent() {
  return WidgetbookComponent(
    name: 'AppLessonRow',
    useCases: [
      WidgetbookUseCase(name: 'States', builder: _states),
      WidgetbookUseCase(
        name: 'Current + materials',
        builder: _currentAndMaterials,
      ),
      WidgetbookUseCase(name: 'Download states', builder: _downloadStates),
      WidgetbookUseCase(name: 'Loading', builder: _loading),
    ],
  );
}

Widget _label(String text) => Padding(
  padding: const EdgeInsets.only(top: 12, bottom: 4),
  child: Text(text, style: const TextStyle(fontSize: 11)),
);

Widget _column(List<Widget> children) => Center(
  child: SingleChildScrollView(
    padding: const EdgeInsets.all(16),
    child: SizedBox(
      width: 340,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      ),
    ),
  ),
);

Widget _states(BuildContext context) => _column([
  _label('Not started'),
  const AppLessonRow(
    num: 1,
    title: 'Setting up your editor',
    duration: Duration(seconds: 180),
  ),
  _label('In progress'),
  const AppLessonRow(
    num: 2,
    title: 'The TypeScript type system, top-down',
    duration: Duration(seconds: 540),
    state: LessonRowState.inProgress,
    progress: 35,
  ),
  _label('Completed'),
  const AppLessonRow(
    num: 3,
    title: 'Discriminated unions in practice',
    duration: Duration(seconds: 425),
    state: LessonRowState.completed,
  ),
  _label('Locked'),
  const AppLessonRow(
    num: 4,
    title: 'Module augmentation (premium)',
    duration: Duration(seconds: 338),
    state: LessonRowState.locked,
  ),
]);

Widget _currentAndMaterials(BuildContext context) => _column([
  _label('Current lesson (accent-soft + play icon)'),
  AppLessonRow(
    num: 5,
    title: 'Conditional types and infer',
    duration: const Duration(seconds: 612),
    current: true,
    onTap: () {},
  ),
  _label('With materials (PDF icon)'),
  const AppLessonRow(
    num: 6,
    title: 'Module resolution deep dive',
    duration: Duration(seconds: 512),
    materials: true,
  ),
]);

Widget _downloadStates(BuildContext context) => _column([
  _label('Available — tap the cloud-down icon to enqueue'),
  AppLessonRow(
    num: 7,
    title: 'Download available',
    duration: const Duration(seconds: 300),
    downloadState: LessonDownloadState.available,
    onDownload: () {},
  ),
  _label('Downloading'),
  const AppLessonRow(
    num: 8,
    title: 'Download in progress',
    duration: Duration(seconds: 300),
    downloadState: LessonDownloadState.downloading,
  ),
  _label('Downloaded'),
  const AppLessonRow(
    num: 9,
    title: 'Download complete',
    duration: Duration(seconds: 300),
    downloadState: LessonDownloadState.downloaded,
  ),
  _label('Failed'),
  const AppLessonRow(
    num: 10,
    title: 'Download failed',
    duration: Duration(seconds: 300),
    downloadState: LessonDownloadState.failed,
  ),
]);

Widget _loading(BuildContext context) => _column([
  _label('Loading skeleton'),
  const AppLessonRow(
    num: 1,
    title: 'unused while loading',
    duration: Duration.zero,
    loading: true,
  ),
]);
