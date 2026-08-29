import 'package:equatable/equatable.dart';

/// Server state for one lesson, returned when the server had newer progress
/// than the client's queued write.
///
/// The card words this as *"client overwrite from server"*, which assumes a
/// local progress cache. There is none — no Drift table stores progress, only
/// the outbox — so the drain surfaces the server's view here instead of writing
/// it somewhere. A listener holding that lesson in memory (the player) can
/// correct itself; nothing else has a copy to correct.
class StaleProgress extends Equatable {
  const StaleProgress({
    required this.lessonId,
    required this.positionSeconds,
    required this.durationSeconds,
    required this.percent,
    required this.completed,
  });

  final String lessonId;
  final int positionSeconds;
  final int durationSeconds;
  final double percent;
  final bool completed;

  @override
  List<Object?> get props => <Object?>[
    lessonId,
    positionSeconds,
    durationSeconds,
    percent,
    completed,
  ];
}

/// What one drain pass did.
class SyncOutcome extends Equatable {
  const SyncOutcome({
    this.sent = 0,
    this.dropped = 0,
    this.remaining = 0,
    this.staleProgress = const <StaleProgress>[],
  });

  /// Rows the server accepted and that were cleared from an outbox.
  final int sent;

  /// Rows cleared *without* the server accepting them — a bookmark whose
  /// create never synced and was then deleted (nothing to send), or an item the
  /// server answered `forbidden` for. Retrying either forever would wedge the
  /// queue behind work that can never succeed, so they are dropped and counted
  /// separately rather than folded into [sent].
  final int dropped;

  /// Rows still queued when the pass ended — a partial drain (the progress
  /// batch caps at 200 per call) or work a later trigger will pick up.
  final int remaining;

  /// Lessons where the server already held newer progress. See [StaleProgress].
  final List<StaleProgress> staleProgress;

  bool get isEmpty => sent == 0 && dropped == 0 && remaining == 0;

  @override
  List<Object?> get props => <Object?>[sent, dropped, remaining, staleProgress];
}

/// Drains the three outboxes into the API.
///
/// Deliberately not connectivity-aware and not scheduled: *when* to drain is
/// `SyncBloc`'s decision, and keeping that out of here is what makes the drain
/// rules testable without a ticker or a fake `Connectivity`.
abstract interface class SyncRepository {
  /// Sends every queued write it can, oldest first.
  ///
  /// Throws only when a pass could not complete — a network failure, say. A
  /// per-item rejection the server reports (`forbidden`) is not a throw: it is
  /// a drop, counted in [SyncOutcome.dropped], because the batch endpoint
  /// deliberately does not abort on one bad item.
  Future<SyncOutcome> drain();

  /// Rows queued across all three outboxes, without sending anything.
  Future<int> pendingCount();
}
