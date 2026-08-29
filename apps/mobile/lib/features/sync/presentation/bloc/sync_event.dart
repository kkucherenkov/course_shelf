import 'package:equatable/equatable.dart';

/// Triggers the sync engine reacts to.
///
/// Four, exactly the set the card names. They are separate events rather than
/// one `SyncRequested` with a reason because they are not equivalent:
/// [SyncConnectivityChanged] also carries state the UI reads, and
/// [SyncManualRequested] must drain even when a drain was already attempted and
/// failed this tick.
sealed class SyncEvent extends Equatable {
  const SyncEvent();

  @override
  List<Object?> get props => const <Object?>[];
}

/// Subscribe to connectivity, start the ticker, and take an opening reading of
/// the queue. Dispatched once, when the bloc is provided.
class SyncStarted extends SyncEvent {
  const SyncStarted();
}

/// Connectivity flipped. A false→true edge drains immediately — that is the
/// "outbox empties on reconnect within one tick window" the card asks for, and
/// it does not wait for the tick at all.
class SyncConnectivityChanged extends SyncEvent {
  const SyncConnectivityChanged({required this.isOnline});

  final bool isOnline;

  @override
  List<Object?> get props => <Object?>[isOnline];
}

/// The app came back to the foreground. Drains without waiting for the tick,
/// because the ticker does not run while the app is suspended and the queue may
/// have been filling on the previous session.
class SyncAppResumed extends SyncEvent {
  const SyncAppResumed();
}

/// The periodic heartbeat. The backstop for everything the edge triggers miss:
/// a write enqueued while already online, or a drain that failed and is due for
/// a retry.
class SyncTicked extends SyncEvent {
  const SyncTicked();
}

/// The user asked, or a write just landed in an outbox and wants pushing now.
/// The only trigger that drains regardless of the current status.
class SyncManualRequested extends SyncEvent {
  const SyncManualRequested();
}
