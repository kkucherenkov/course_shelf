import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';

import 'package:app_mobile/features/player/domain/lesson_playback.dart';
import 'package:app_mobile/features/player/presentation/bloc/player_state.dart';
import 'package:app_mobile/i18n/strings.g.dart';

/// Sections tab — the course outline, current lesson highlighted.
class PlayerSectionsPanel extends StatelessWidget {
  const PlayerSectionsPanel({
    required this.state,
    required this.onSelectLesson,
    super.key,
  });

  final PlayerState state;
  final ValueChanged<String> onSelectLesson;

  static const Key sectionsEmptyKey = Key('playerSectionsEmpty');

  @override
  Widget build(BuildContext context) {
    if (state.sections.isEmpty) {
      // The outline degrades to empty when its fetch fails (playback must not
      // die with the side panel), so this must read as a real state rather
      // than a "Loading…" that never resolves.
      return AppEmptyState(
        key: sectionsEmptyKey,
        icon: IconName.list,
        title: context.t.player.sectionsEmptyTitle,
        message: context.t.player.sectionsEmptyBody,
      );
    }

    final String? currentId = state.lesson?.id;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        for (final LessonOutlineSection section in state.sections) ...<Widget>[
          AppSectionHeader(
            idx: section.position,
            title: section.title,
            count: section.lessons.length,
            duration: section.totalDuration,
            sectionLabel: context.t.player.sectionLabel(n: ''),
          ),
          for (final LessonOutlineEntry lesson in section.lessons)
            AppLessonRow(
              num: lesson.position,
              title: lesson.title,
              duration: lesson.duration,
              state: _rowState(lesson.state),
              progress: lesson.progressPercent.toDouble(),
              materials: lesson.hasMaterials,
              current: lesson.id == currentId,
              onTap: lesson.state == LessonOutlineEntryState.locked
                  ? null
                  : () => onSelectLesson(lesson.id),
            ),
        ],
      ],
    );
  }

  LessonRowState _rowState(LessonOutlineEntryState state) => switch (state) {
    LessonOutlineEntryState.notStarted => LessonRowState.notStarted,
    LessonOutlineEntryState.inProgress => LessonRowState.inProgress,
    LessonOutlineEntryState.completed => LessonRowState.completed,
    LessonOutlineEntryState.locked => LessonRowState.locked,
  };
}

/// Notes tab — one free-text note per lesson.
class PlayerNotesPanel extends StatelessWidget {
  const PlayerNotesPanel({
    required this.state,
    required this.onSave,
    super.key,
  });

  final PlayerState state;
  final ValueChanged<String> onSave;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.s2),
      child: AppNoteEditor(
        modelValue: state.note,
        placeholder: context.t.player.notePlaceholder,
        onSave: onSave,
      ),
    );
  }
}

/// Bookmarks tab — jump-to-moment markers for this lesson.
class PlayerBookmarksPanel extends StatelessWidget {
  const PlayerBookmarksPanel({
    required this.state,
    required this.onSeek,
    required this.onDelete,
    required this.onAddSave,
    required this.onAddCancel,
    super.key,
  });

  final PlayerState state;
  final ValueChanged<Duration> onSeek;
  final ValueChanged<String> onDelete;
  final ValueChanged<BookmarkDraft> onAddSave;
  final VoidCallback onAddCancel;

  @override
  Widget build(BuildContext context) {
    return AppBookmarkList(
      bookmarks: <BookmarkEntry>[
        for (final LessonBookmark bookmark in state.bookmarks)
          BookmarkEntry(
            id: bookmark.id,
            time: bookmark.position.inSeconds.toDouble(),
            label: bookmark.label,
          ),
      ],
      adding: state.addingBookmark,
      // The add row anchors to where the user actually is in the lesson.
      addTime: state.addingBookmark
          ? state.position.inSeconds.toDouble()
          : null,
      emptyTitle: context.t.player.bookmarksEmptyTitle,
      emptyBody: context.t.player.bookmarksEmptyBody,
      onSelect: (String id) {
        final LessonBookmark? match = state.bookmarks
            .where((LessonBookmark b) => b.id == id)
            .firstOrNull;
        if (match != null) onSeek(match.position);
      },
      onDelete: onDelete,
      onAddSave: onAddSave,
      onAddCancel: onAddCancel,
    );
  }
}

/// Materials tab — lesson attachments.
///
/// Mobile is the first real consumer of
/// `POST /lessons/{id}/materials/{materialId}/download-url`; web still renders
/// "coming soon" for these rows.
class PlayerMaterialsPanel extends StatelessWidget {
  const PlayerMaterialsPanel({
    required this.state,
    required this.onDownload,
    super.key,
  });

  final PlayerState state;
  final ValueChanged<LessonMaterial> onDownload;

  static const Key emptyKey = Key('playerMaterialsEmpty');

  @override
  Widget build(BuildContext context) {
    final List<LessonMaterial> materials =
        state.lesson?.materials ?? const <LessonMaterial>[];

    if (materials.isEmpty) {
      return AppEmptyState(
        key: emptyKey,
        icon: IconName.folder,
        title: context.t.player.materialsEmptyTitle,
        message: context.t.player.materialsEmpty,
      );
    }

    final ThemeData theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        for (final LessonMaterial material in materials)
          AppRow(
            leading: IconCS(name: _icon(material.kind), size: AppFontSize.lg),
            body: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Text(
                  material.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: (theme.textTheme.bodyMedium ?? const TextStyle())
                      .copyWith(
                        fontSize: AppFontSize.sm,
                        fontWeight: AppFontWeight.medium,
                      ),
                ),
                Text(
                  '${material.kind.toUpperCase()} · ${_size(material.sizeBytes)}',
                  style: (theme.textTheme.bodySmall ?? const TextStyle())
                      .copyWith(
                        fontSize: AppFontSize.xs,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                ),
              ],
            ),
            trailing: AppIconButton(
              name: IconName.download,
              semanticLabel: context.t.player.materialDownload(
                label: material.label,
              ),
              variant: AppButtonVariant.ghost,
              size: AppButtonSize.sm,
              onPressed: () => onDownload(material),
            ),
          ),
      ],
    );
  }

  /// `MaterialKind` on the wire is `doc | note | image | slide` — there is no
  /// `pdf` member, despite the mockup drawing a PDF glyph, so `doc` and
  /// `slide` (the mockup's "Section 03 slides") both take the pdf icon.
  IconName _icon(String kind) => switch (kind) {
    'doc' || 'slide' => IconName.pdf,
    'note' => IconName.note,
    'image' => IconName.eye,
    _ => IconName.folder,
  };

  String _size(int bytes) {
    if (bytes >= 1024 * 1024) {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    }
    if (bytes >= 1024) return '${(bytes / 1024).toStringAsFixed(0)} KB';
    return '$bytes B';
  }
}
