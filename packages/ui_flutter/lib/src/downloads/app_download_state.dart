/// The five states of the mobile downloads state machine.
///
/// Backs [AppDownloadRow] — a **mobile-only** composite with no web twin;
/// this union and the row it drives were approved directly against the
/// `DownloadRow` prose in `docs/design/DESIGN_BRIEF.md` §5.7 / §7.7
/// (approved 2026-07-17), not ported from an existing web component.
///
/// Dart enum members can't carry a per-instance payload, so the "downloading
/// carries a 0..1 progress fraction" idea from the approved design lives on
/// [AppDownloadRow.progress] instead of on this enum — the row widget is
/// what actually varies per lesson, not the state name.
enum AppDownloadState {
  /// Enqueued for download; no bytes transferring yet.
  queued,

  /// Actively transferring. [AppDownloadRow.progress] reports 0..1 completion
  /// and drives the row's progress underline.
  downloading,

  /// Transfer suspended by the user; resumable via [AppDownloadRow.onResume].
  paused,

  /// Fully downloaded and available offline.
  ready,

  /// Transfer failed; retryable via [AppDownloadRow.onRetry].
  failed,
}
