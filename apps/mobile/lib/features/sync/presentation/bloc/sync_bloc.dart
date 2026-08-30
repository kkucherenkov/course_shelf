import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/features/sync/domain/sync_repository.dart';
import 'package:app_mobile/features/sync/domain/sync_state.dart';
import 'package:app_mobile/features/sync/presentation/bloc/sync_event.dart';

export 'package:app_mobile/features/sync/presentation/bloc/sync_event.dart';

/// Decides *when* to drain; [SyncRepository] decides *how*.
///
/// Four triggers, in the order they matter:
///   - **ConnectivityChanged** — a false→true edge drains at once. This is the
///     acceptance criterion "outbox empties on reconnect within one tick
///     window"; in practice it does not wait for the tick at all.
///   - **AppResumed** — the ticker does not run while suspended, and the queue
///     may have been filling before that.
///   - **Tick** — the backstop, for a write enqueued while already online or a
///     failed drain due for retry.
///   - **ManualSync** — the user, or a producer that just enqueued.
///
/// While a drain is in flight, further triggers are dropped rather than
/// queued — see [_draining]. Queueing them would let a minute offline build a
/// backlog of ticks that all fire on reconnect and re-drain an already-empty
/// queue. Dropping is safe precisely because each trigger asks for "drain
/// whatever is queued now", not "drain this specific thing": a dropped trigger
/// loses no work, the next one sees the same queue.
///
/// A plain bool rather than `bloc_concurrency`'s `droppable()` — that would be
/// a new dependency for three lines, and the guard has to live inside [_drain]
/// anyway because [SyncConnectivityChanged] does state work before deciding
/// whether to drain at all.
class SyncBloc extends Bloc<SyncEvent, SyncState> {
  SyncBloc({
    required SyncRepository repository,
    Connectivity? connectivity,
    Duration tickInterval = const Duration(minutes: 5),
  }) : _repository = repository,
       _connectivity = connectivity,
       _tickInterval = tickInterval,
       super(const SyncState()) {
    on<SyncStarted>(_onStarted);
    on<SyncConnectivityChanged>(_onConnectivityChanged);
    on<SyncAppResumed>(_onResumed);
    on<SyncTicked>(_onTicked);
    on<SyncManualRequested>(_onManual);
  }

  final SyncRepository _repository;

  /// Optional so a test — and any caller with no platform channels — can drive
  /// the bloc purely through events. Matches `DownloadsBloc`'s shape.
  final Connectivity? _connectivity;

  final Duration _tickInterval;

  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;
  Timer? _ticker;

  /// True while a drain is running. Guards against overlapping passes, which
  /// would double-send rows read before the first pass cleared them.
  bool _draining = false;

  /// Fires once each time a drain completes without throwing.
  ///
  /// Deliberately `void` rather than [SyncState]: the one consumer — the
  /// player, which re-reads its bookmarks because a drain can rename one — only
  /// needs the edge, and an opaque element type keeps that feature from
  /// importing this one. [SyncState.lastSyncedAt] is the edge: it is set on
  /// every successful drain and on nothing else, so `distinct` on it emits
  /// exactly once per settled drain.
  Stream<void> get drained => stream
      .map((SyncState s) => s.lastSyncedAt)
      .where((DateTime? at) => at != null)
      .distinct()
      .map((DateTime? _) {});

  Future<void> _onStarted(SyncStarted event, Emitter<SyncState> emit) async {
    emit(state.copyWith(pending: await _repository.pendingCount()));

    final Connectivity? connectivity = _connectivity;
    if (connectivity != null) {
      await _connectivitySubscription?.cancel();
      _connectivitySubscription = connectivity.onConnectivityChanged.listen(
        (List<ConnectivityResult> results) =>
            add(SyncConnectivityChanged(isOnline: _isOnline(results))),
      );
      add(
        SyncConnectivityChanged(
          isOnline: _isOnline(await connectivity.checkConnectivity()),
        ),
      );
    }

    _ticker?.cancel();
    _ticker = Timer.periodic(_tickInterval, (_) => add(const SyncTicked()));
  }

  /// Only a real edge does anything at all.
  ///
  /// The platform stream re-emits "online" on every interface change — wifi to
  /// cellular, a VPN coming up — and each of those must neither kick a drain
  /// the tick already covers nor emit a state identical to the current one.
  /// The early return covers both: `Bloc.emit` deduplicates equal states, but
  /// only *after* the first emission, so without it the very first redundant
  /// connectivity report would still reach listeners.
  Future<void> _onConnectivityChanged(
    SyncConnectivityChanged event,
    Emitter<SyncState> emit,
  ) async {
    if (event.isOnline == state.isOnline) return;

    final bool cameOnline = event.isOnline;
    emit(state.copyWith(isOnline: event.isOnline));
    if (cameOnline) await _drain(emit);
  }

  Future<void> _onResumed(SyncAppResumed event, Emitter<SyncState> emit) =>
      _drain(emit);

  Future<void> _onTicked(SyncTicked event, Emitter<SyncState> emit) =>
      _drain(emit);

  Future<void> _onManual(SyncManualRequested event, Emitter<SyncState> emit) =>
      _drain(emit);

  /// The one place a drain happens, so the state machine is in one place too.
  ///
  /// Offline is a no-op rather than a failure: there is nothing wrong, the work
  /// simply waits. Marking it `failed` would light up an error affordance for
  /// the entirely normal case of being on a train.
  Future<void> _drain(Emitter<SyncState> emit) async {
    if (!state.isOnline || _draining) return;

    _draining = true;
    emit(state.copyWith(status: SyncStatus.syncing, clearError: true));
    try {
      final SyncOutcome outcome = await _repository.drain();
      emit(
        state.copyWith(
          status: SyncStatus.idle,
          pending: outcome.remaining,
          lastSyncedAt: DateTime.now(),
          clearError: true,
        ),
      );
    } on Object catch (error) {
      // The queue is intact — nothing was cleared that the server did not
      // accept — so this is a retry-later, not a loss. Re-read the count so a
      // partial drain still reports the truth.
      emit(
        state.copyWith(
          status: SyncStatus.failed,
          pending: await _pendingOrKeep(),
          error: error.toString(),
        ),
      );
    } finally {
      _draining = false;
    }
  }

  /// A count read must not itself turn a drain failure into a crash.
  Future<int> _pendingOrKeep() async {
    try {
      return await _repository.pendingCount();
    } on Object {
      return state.pending;
    }
  }

  /// `ConnectivityResult.none` is the only unambiguous "offline" answer; the
  /// platform reports a list, and any non-none entry means some interface is
  /// up. Same rule as `DownloadsBloc._isOnline` — kept identical on purpose.
  static bool _isOnline(List<ConnectivityResult> results) =>
      results.any((ConnectivityResult r) => r != ConnectivityResult.none);

  @override
  Future<void> close() async {
    _ticker?.cancel();
    await _connectivitySubscription?.cancel();
    return super.close();
  }
}
