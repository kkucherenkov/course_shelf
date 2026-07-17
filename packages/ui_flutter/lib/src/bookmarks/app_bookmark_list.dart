import 'package:flutter/material.dart';

import 'package:app_ui/src/bookmarks/app_bookmark.dart';
import 'package:app_ui/src/bookmarks/app_bookmark_add.dart';
import 'package:app_ui/src/bookmarks/bookmark_draft.dart';
import 'package:app_ui/src/bookmarks/bookmark_entry.dart';
import 'package:app_ui/src/icons/icon_name.dart';
import 'package:app_ui/src/states/app_empty_state.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// A lesson's bookmark list — Flutter twin of the web `AppBookmarkList`.
///
/// A `--space-1`-gapped column composed of already-shipped parts: an optional
/// [AppBookmarkAdd] on top (rendered only when [addTime] is non-null — i.e.
/// the player has a playhead to bookmark), then one [AppBookmark] per entry,
/// or an [AppEmptyState] when there is nothing to show.
///
/// The empty state is suppressed while the add row is in flight — it renders
/// only when [bookmarks] is empty AND [addTime] is null, mirroring the web
/// `v-else-if="addTime === undefined"`. An add row is already an answer to
/// "there's nothing here"; showing both would be noise.
///
/// [onSelect] / [onEdit] / [onDelete] echo the originating [BookmarkEntry.id];
/// [onAddSave] / [onAddCancel] forward the add row's own callbacks unchanged.
///
/// User-visible copy ([emptyTitle], [emptyBody]) is a constructor param with
/// the web component's English default — `app_ui` is presentation-only, so the
/// app layer injects `AppLocalizations`.
class AppBookmarkList extends StatelessWidget {
  const AppBookmarkList({
    required this.bookmarks,
    this.addTime,
    this.editable = true,
    this.adding = false,
    this.emptyTitle = 'No bookmarks yet',
    this.emptyBody =
        'Add a bookmark from the player to mark a moment for later.',
    this.onSelect,
    this.onEdit,
    this.onDelete,
    this.onAddSave,
    this.onAddCancel,
    super.key,
  });

  /// Rendered in order, one [AppBookmark] each.
  final List<BookmarkEntry> bookmarks;

  /// Current playhead, in seconds. When non-null an inline add row appears on
  /// top (and suppresses the empty state); null omits it entirely.
  final double? addTime;

  /// Forwarded to every row — false hides the edit/delete actions.
  final bool editable;

  /// Forwarded to the add row as `submitting` while a save is in flight.
  final bool adding;

  /// Empty-state title — cosmetic override.
  final String emptyTitle;

  /// Empty-state supporting copy — cosmetic override.
  final String emptyBody;

  /// Fires with the tapped entry's id.
  final ValueChanged<String>? onSelect;

  /// Fires with the id of the entry whose edit action was tapped.
  final ValueChanged<String>? onEdit;

  /// Fires with the id of the entry whose delete action was tapped.
  final ValueChanged<String>? onDelete;

  /// Forwarded from the add row's own save callback.
  final ValueChanged<BookmarkDraft>? onAddSave;

  /// Forwarded from the add row's own cancel callback.
  final VoidCallback? onAddCancel;

  @override
  Widget build(BuildContext context) {
    final double? time = addTime;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      spacing: AppSpacing.s1,
      children: <Widget>[
        if (time != null)
          AppBookmarkAdd(
            time: time,
            submitting: adding,
            onSave: onAddSave,
            onCancel: onAddCancel,
          ),
        if (bookmarks.isNotEmpty)
          for (final BookmarkEntry entry in bookmarks)
            AppBookmark(
              key: ValueKey<String>(entry.id),
              time: entry.time,
              label: entry.label,
              editable: editable,
              onSelect: onSelect == null ? null : () => onSelect!(entry.id),
              onEdit: onEdit == null ? null : () => onEdit!(entry.id),
              onDelete: onDelete == null ? null : () => onDelete!(entry.id),
            )
        else if (time == null)
          AppEmptyState(
            icon: IconName.bookmark,
            title: emptyTitle,
            message: emptyBody,
          ),
      ],
    );
  }
}
