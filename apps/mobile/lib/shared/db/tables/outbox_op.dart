/// Op queued against a note or a bookmark.
///
/// Lives in its own file so the notes and bookmarks outboxes — which are
/// otherwise unrelated and have deliberately different shapes — do not import
/// each other just to share it.
///
/// Persisted by name via `textEnum`, so the names are a storage contract:
/// renaming a value silently breaks every queued row already on disk.
enum OutboxOp { create, update, delete }
