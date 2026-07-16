import 'package:flutter/foundation.dart';

/// The payload emitted by `AppBookmarkAdd`'s `onSave` callback — a plain
/// presentational mirror of the web `AppBookmarkAdd`'s `save` event payload
/// (`{ time: number; label: string }`), not a domain model.
@immutable
class BookmarkDraft {
  const BookmarkDraft({required this.time, required this.label});

  /// Bookmark position, in seconds.
  final double time;

  /// Trimmed, possibly-empty label typed by the user.
  final String label;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is BookmarkDraft && other.time == time && other.label == label);

  @override
  int get hashCode => Object.hash(time, label);

  @override
  String toString() => 'BookmarkDraft(time: $time, label: $label)';
}
