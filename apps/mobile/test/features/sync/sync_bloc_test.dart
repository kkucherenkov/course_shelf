import 'dart:async';

import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/features/sync/domain/sync_repository.dart';
import 'package:app_mobile/features/sync/domain/sync_state.dart';
import 'package:app_mobile/features/sync/presentation/bloc/sync_bloc.dart';

/// Records what was asked of it and answers however the test wants.
///
/// Hand-written rather than mocked: the interface is two methods, and the
/// tests below care about *how many times* drain ran, which a counter states
/// more plainly than a verification call.
class _FakeSyncRepository implements SyncRepository {
  _FakeSyncRepository({
    this.outcome = const SyncOutcome(),
    this.pending = 0,
    this.throws,
  });

  SyncOutcome outcome;
  int pending;
  Object? throws;

  int drainCalls = 0;

  /// Completes the in-flight drain when set, so a test can hold one open and
  /// fire more triggers at it.
  Completer<void>? gate;

  @override
  Future<SyncOutcome> drain() async {
    drainCalls++;
    if (gate != null) await gate!.future;
    final Object? error = throws;
    if (error != null) throw error;
    return outcome;
  }

  @override
  Future<int> pendingCount() async => pending;
}

void main() {
  group('offline', () {
    blocTest<SyncBloc, SyncState>(
      'does not drain while offline',
      build: () => SyncBloc(repository: _FakeSyncRepository()),
      seed: () => const SyncState(isOnline: false),
      act: (SyncBloc bloc) => bloc
        ..add(const SyncTicked())
        ..add(const SyncManualRequested())
        ..add(const SyncAppResumed()),
      expect: () => const <SyncState>[],
      verify: (SyncBloc bloc) {
        // Offline is a no-op, not a failure: the work simply waits. Emitting
        // `failed` would light an error affordance for being on a train.
        expect(bloc.state.status, SyncStatus.idle);
      },
    );
  });

  group('connectivity', () {
    blocTest<SyncBloc, SyncState>(
      'an offline→online edge drains at once',
      build: () => SyncBloc(
        repository: _FakeSyncRepository(outcome: const SyncOutcome(sent: 3)),
      ),
      seed: () => const SyncState(isOnline: false),
      act: (SyncBloc bloc) =>
          bloc.add(const SyncConnectivityChanged(isOnline: true)),
      expect: () => <Matcher>[
        isA<SyncState>()
            .having((SyncState s) => s.isOnline, 'isOnline', isTrue)
            .having((SyncState s) => s.status, 'status', SyncStatus.idle),
        isA<SyncState>().having(
          (SyncState s) => s.status,
          'status',
          SyncStatus.syncing,
        ),
        isA<SyncState>()
            .having((SyncState s) => s.status, 'status', SyncStatus.idle)
            .having((SyncState s) => s.lastSyncedAt, 'lastSyncedAt', isNotNull),
      ],
    );

    blocTest<SyncBloc, SyncState>(
      'online→online does not drain',
      // The platform stream re-emits on every interface change — wifi to
      // cellular, a VPN coming up. Draining on each would duplicate the work
      // the tick already covers.
      build: () => SyncBloc(repository: _FakeSyncRepository()),
      act: (SyncBloc bloc) =>
          bloc.add(const SyncConnectivityChanged(isOnline: true)),
      expect: () => const <SyncState>[],
    );

    blocTest<SyncBloc, SyncState>(
      'going offline is recorded but drains nothing',
      build: () => SyncBloc(repository: _FakeSyncRepository()),
      act: (SyncBloc bloc) =>
          bloc.add(const SyncConnectivityChanged(isOnline: false)),
      expect: () => <Matcher>[
        isA<SyncState>().having(
          (SyncState s) => s.isOnline,
          'isOnline',
          isFalse,
        ),
      ],
    );
  });

  group('triggers', () {
    for (final (String name, SyncEvent event) in <(String, SyncEvent)>[
      ('tick', const SyncTicked()),
      ('manual', const SyncManualRequested()),
      ('resume', const SyncAppResumed()),
    ]) {
      blocTest<SyncBloc, SyncState>(
        '$name drains when online',
        build: () => SyncBloc(
          repository: _FakeSyncRepository(
            outcome: const SyncOutcome(sent: 1, remaining: 2),
          ),
        ),
        act: (SyncBloc bloc) => bloc.add(event),
        expect: () => <Matcher>[
          isA<SyncState>().having(
            (SyncState s) => s.status,
            'status',
            SyncStatus.syncing,
          ),
          isA<SyncState>()
              .having((SyncState s) => s.status, 'status', SyncStatus.idle)
              .having((SyncState s) => s.pending, 'pending', 2),
        ],
      );
    }
  });

  group('failure', () {
    blocTest<SyncBloc, SyncState>(
      'a throwing drain reports failed and keeps the queue',
      build: () => SyncBloc(
        repository: _FakeSyncRepository(
          throws: StateError('network down'),
          pending: 4,
        ),
      ),
      act: (SyncBloc bloc) => bloc.add(const SyncTicked()),
      expect: () => <Matcher>[
        isA<SyncState>().having(
          (SyncState s) => s.status,
          'status',
          SyncStatus.syncing,
        ),
        isA<SyncState>()
            .having((SyncState s) => s.status, 'status', SyncStatus.failed)
            .having((SyncState s) => s.error, 'error', contains('network down'))
            .having((SyncState s) => s.pending, 'pending', 4),
      ],
    );

    blocTest<SyncBloc, SyncState>(
      'a later success clears the error',
      build: () => SyncBloc(repository: _FakeSyncRepository()),
      seed: () => const SyncState(status: SyncStatus.failed, error: 'stale'),
      act: (SyncBloc bloc) => bloc.add(const SyncManualRequested()),
      expect: () => <Matcher>[
        isA<SyncState>()
            .having((SyncState s) => s.status, 'status', SyncStatus.syncing)
            .having((SyncState s) => s.error, 'error', isNull),
        isA<SyncState>()
            .having((SyncState s) => s.status, 'status', SyncStatus.idle)
            .having((SyncState s) => s.error, 'error', isNull),
      ],
    );
  });

  group('overlap', () {
    test('triggers arriving during a drain are dropped, not queued', () async {
      // A minute offline would otherwise build a backlog of ticks that all
      // fire on reconnect and re-drain an already-empty queue. Dropping is
      // safe: each trigger means "drain whatever is queued now", so the next
      // one sees the same queue.
      final _FakeSyncRepository repository = _FakeSyncRepository()
        ..gate = Completer<void>();
      final SyncBloc bloc = SyncBloc(repository: repository);

      bloc.add(const SyncTicked());
      await Future<void>.delayed(Duration.zero);
      bloc
        ..add(const SyncTicked())
        ..add(const SyncManualRequested())
        ..add(const SyncAppResumed());
      await Future<void>.delayed(Duration.zero);

      expect(repository.drainCalls, 1);

      repository.gate!.complete();
      await Future<void>.delayed(Duration.zero);
      await bloc.close();
    });
  });

  group('start-up', () {
    blocTest<SyncBloc, SyncState>(
      'reads the opening queue depth without draining',
      // No `connectivity` passed, so nothing subscribes to platform channels
      // and the only emission is the count.
      build: () => SyncBloc(repository: _FakeSyncRepository(pending: 7)),
      act: (SyncBloc bloc) => bloc.add(const SyncStarted()),
      expect: () => <Matcher>[
        isA<SyncState>()
            .having((SyncState s) => s.pending, 'pending', 7)
            .having((SyncState s) => s.status, 'status', SyncStatus.idle),
      ],
      verify: (SyncBloc bloc) => expect(bloc.state.hasPendingWork, isTrue),
    );
  });
}
