import 'package:equatable/equatable.dart';

/// Where the sync engine is right now.
///
/// Three values, exactly the set `E20-F01-S01` asks for. Deliberately not a
/// fourth "offline" value: being offline is not a *sync* state, it is the
/// reason a drain is not attempted, and it is already observable through
/// [SyncState.isOnline]. Collapsing the two would make "failed while offline"
/// unrepresentable.
enum SyncStatus {
  /// Nothing in flight. Says nothing about whether the queue is empty —
  /// read [SyncState.pending] for that.
  idle,

  /// A drain is running.
  syncing,

  /// The last drain threw. The queue is intact and will be retried on the
  /// next trigger; [SyncState.error] carries the reason for display.
  failed,
}

/// Observable state of the sync engine, emitted by `SyncBloc`.
///
/// This doubles as the bloc's state and the type exposed through
/// `RepositoryProvider<Stream<SyncState>>` — one class rather than a domain
/// type plus a near-identical bloc state that has to be kept in step.
class SyncState extends Equatable {
  const SyncState({
    this.status = SyncStatus.idle,
    this.pending = 0,
    this.isOnline = true,
    this.lastSyncedAt,
    this.error,
  });

  final SyncStatus status;

  /// Rows still queued across all three outboxes. Drives "N pending" affordances
  /// and, more importantly, lets a caller distinguish `idle` + empty (nothing to
  /// do) from `idle` + non-empty (waiting for a trigger).
  final int pending;

  /// Last known connectivity. Starts optimistic: on a cold start the first
  /// `checkConnectivity()` has not answered yet, and assuming offline would
  /// render an "offline" banner for a frame on a perfectly connected device.
  final bool isOnline;

  /// When a drain last completed without throwing. Null until the first one.
  final DateTime? lastSyncedAt;

  /// Reason the last drain failed. Non-null only when [status] is
  /// [SyncStatus.failed].
  final String? error;

  /// True when there is queued work that has not reached the server.
  bool get hasPendingWork => pending > 0;

  /// `copyWith` cannot clear a nullable field — passing null means "unchanged".
  /// [clearError] is the explicit escape hatch, used on every transition out of
  /// [SyncStatus.failed] so a stale message cannot outlive the failure.
  SyncState copyWith({
    SyncStatus? status,
    int? pending,
    bool? isOnline,
    DateTime? lastSyncedAt,
    String? error,
    bool clearError = false,
  }) => SyncState(
    status: status ?? this.status,
    pending: pending ?? this.pending,
    isOnline: isOnline ?? this.isOnline,
    lastSyncedAt: lastSyncedAt ?? this.lastSyncedAt,
    error: clearError ? null : (error ?? this.error),
  );

  @override
  List<Object?> get props => <Object?>[
    status,
    pending,
    isOnline,
    lastSyncedAt,
    error,
  ];
}
