import 'package:flutter/foundation.dart';

/// One row of an `AppBookmarkList` — plain presentational view-model, Flutter
/// twin of the web `BookmarkEntry` interface
/// (`packages/ui/src/components/AppBookmarkList/AppBookmarkList.vue`). NOT a
/// domain entity or API type: it exists purely to feed the list, which stays
/// pure-presentational (data in, callbacks out).
///
/// The web `label?: string` is optional; this twin narrows it to a
/// non-nullable [label] defaulting to `''`, matching `AppBookmark.label`'s
/// own empty-string default (an absent label and a blank one render alike).
@immutable
class BookmarkEntry {
  const BookmarkEntry({required this.id, required this.time, this.label = ''});

  /// Stable identity — echoed back through the list's `onSelect` / `onEdit` /
  /// `onDelete` callbacks, and used as the row's widget key.
  final String id;

  /// Bookmark position, in seconds.
  final double time;

  /// Optional human label; empty renders a bare time chip.
  final String label;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is BookmarkEntry &&
          other.id == id &&
          other.time == time &&
          other.label == label);

  @override
  int get hashCode => Object.hash(id, time, label);

  @override
  String toString() => 'BookmarkEntry(id: $id, time: $time, label: $label)';
}
