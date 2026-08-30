import 'dart:async';

import 'package:dio/dio.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/features/player/data/outbox_lesson_player_repository.dart';
import 'package:app_mobile/features/player/domain/lesson_playback.dart';
import 'package:app_mobile/features/player/domain/lesson_player_repository.dart';
import 'package:app_mobile/features/sync/data/sync_api.dart';
import 'package:app_mobile/features/sync/data/sync_repository_impl.dart';
import 'package:app_mobile/features/sync/domain/sync_repository.dart';
import 'package:app_mobile/features/player/presentation/bloc/player_bloc.dart';
import 'package:app_mobile/features/player/presentation/bloc/player_event.dart';
import 'package:app_mobile/features/player/presentation/bloc/player_state.dart';
import 'package:app_mobile/shared/db/app_database.dart';

// Relative, not `package:` — `always_use_package_imports` governs `lib/` only.
import '../../support/recording_http_adapter.dart';
import '../player/player_fakes.dart';

/// The bookmarks the fake server holds, keyed by the id it assigned. Shared by
/// the two halves of the round trip: the drain writes to it over Dio, and the
/// player's reads see it through [_ServerBackedInner]. Keeping one store on
/// both sides is what makes "the same bookmark twice" observable at all —
/// against two independent fakes the duplicate cannot appear by construction.
class _FakeServer {
  final Map<String, LessonBookmark> bookmarks = <String, LessonBookmark>{};
  int _nextId = 0;

  String create({required int positionSeconds, String? label}) {
    final String id = 'srv-${++_nextId}';
    bookmarks[id] = LessonBookmark(
      id: id,
      position: Duration(seconds: positionSeconds),
      label: label ?? '',
    );
    return id;
  }
}

/// Reads straight off [_FakeServer]; every write throws, because the decorator
/// under test must queue writes rather than forward them.
class _ServerBackedInner implements LessonPlayerRepository {
  _ServerBackedInner(this._server);

  final _FakeServer _server;

  @override
  Future<List<LessonBookmark>> fetchBookmarks(String lessonId) async =>
      _server.bookmarks.values.toList();

  @override
  Future<String?> fetchNote(String lessonId) async => null;

  @override
  Future<void> saveNote({required String lessonId, required String body}) =>
      throw StateError('writes must not reach the wire');

  @override
  Future<LessonBookmark> createBookmark({
    required String lessonId,
    required Duration position,
    String? label,
  }) => throw StateError('writes must not reach the wire');

  @override
  Future<void> deleteBookmark(String bookmarkId) =>
      throw StateError('writes must not reach the wire');

  // Enough of a lesson for `PlayerBloc` to reach `PlayerStatus.paused`; the
  // bookmark assertions are the point, the playback shape is scaffolding.
  @override
  Future<LessonPlayback> fetchLesson(String lessonId) async => LessonPlayback(
    id: lessonId,
    courseId: 'c1',
    sectionId: 's1',
    title: 'Leaderless replication',
    duration: const Duration(minutes: 10),
    resumeAt: Duration.zero,
  );

  @override
  Future<List<LessonOutlineSection>> fetchCourseOutline(
    String courseId,
  ) async => const <LessonOutlineSection>[];

  @override
  Future<LessonVideoSource> resolveVideoSource(String lessonId) async =>
      const LessonVideoSource.network('https://cdn.test/a.mp4');

  @override
  Future<String> issueMaterialDownloadUrl({
    required String lessonId,
    required String materialId,
  }) => throw UnimplementedError();
}

/// The full offline-bookmark round trip: queue it with the player's repository,
/// drain it with the sync repository, read it back. Both halves run against one
/// database and one fake server, because the bug this covers only exists where
/// they meet — a bookmark the client knows by a local id and the server knows
/// by another.
void main() {
  late AppDatabase db;
  late _FakeServer server;
  late OutboxLessonPlayerRepository player;
  late SyncRepositoryImpl sync;

  setUp(() {
    db = AppDatabase(NativeDatabase.memory());
    server = _FakeServer();

    final RecordingHttpAdapter adapter = RecordingHttpAdapter(
      respond: (RequestOptions options) {
        if (options.method == 'POST' && options.path.endsWith('/bookmarks')) {
          final Map<String, dynamic> body =
              options.data as Map<String, dynamic>;
          final String id = server.create(
            positionSeconds: body['positionSeconds'] as int,
            label: body['label'] as String?,
          );
          return _json('{"id":"$id"}');
        }
        if (options.method == 'DELETE' &&
            options.path.startsWith('/bookmarks/')) {
          final String id = options.path.split('/').last;
          // The whole point of the id map: a DELETE naming an id the server
          // never assigned is a 404, and a failing leg wedges the queue.
          if (!server.bookmarks.containsKey(id)) {
            return ResponseBody.fromString('{}', 404);
          }
          server.bookmarks.remove(id);
          return _json('{}');
        }
        return _json('{}');
      },
    );

    player = OutboxLessonPlayerRepository(
      inner: _ServerBackedInner(server),
      notes: NotesOutboxDao(db),
      bookmarks: BookmarksOutboxDao(db),
      bookmarkIds: BookmarkIdMapDao(db),
    );
    sync = SyncRepositoryImpl(
      api: SyncApi(
        Dio(BaseOptions(baseUrl: 'http://localhost:3000/api/v1'))
          ..httpClientAdapter = adapter,
      ),
      progress: ProgressOutboxDao(db),
      notes: NotesOutboxDao(db),
      bookmarks: BookmarksOutboxDao(db),
      bookmarkIds: BookmarkIdMapDao(db),
    );
  });

  tearDown(() => db.close());

  test(
    'a bookmark created offline reads back once, under the server id',
    () async {
      final LessonBookmark local = await player.createBookmark(
        lessonId: 'l1',
        position: const Duration(seconds: 42),
        label: 'offline',
      );
      // Before the drain the server has nothing, so the queued copy is the only
      // copy — and it must still be readable, or the bookmark vanishes on reload.
      expect(await player.fetchBookmarks('l1'), <LessonBookmark>[local]);

      await sync.drain();

      final List<LessonBookmark> after = await player.fetchBookmarks('l1');
      expect(
        after,
        hasLength(1),
        reason: 'not the local copy AND the server one',
      );
      expect(after.single.id, 'srv-1');
      expect(after.single.position, const Duration(seconds: 42));
      expect(after.single.label, 'offline');
    },
  );

  test('a drained create leaves a localId -> serverId mapping', () async {
    final LessonBookmark local = await player.createBookmark(
      lessonId: 'l1',
      position: const Duration(seconds: 10),
    );

    await sync.drain();

    expect(await BookmarkIdMapDao(db).serverIdFor(local.id), 'srv-1');
  });

  test(
    'deleting a synced offline bookmark names the server id, not the local one',
    () async {
      final LessonBookmark local = await player.createBookmark(
        lessonId: 'l1',
        position: const Duration(seconds: 10),
      );
      await sync.drain();

      // The UI still holds the local id — nothing pushed the server id back into
      // it. Sending that id would 404 and wedge every later drain.
      await player.deleteBookmark(local.id);
      final SyncOutcome outcome = await sync.drain();

      expect(outcome.remaining, 0, reason: 'the delete leg landed, not 404ed');
      expect(server.bookmarks, isEmpty);
      expect(await player.fetchBookmarks('l1'), isEmpty);
      expect(
        await BookmarkIdMapDao(db).serverIdFor(local.id),
        isNull,
        reason: 'a settled delete drops the mapping it no longer names',
      );
    },
  );

  test(
    'a queued create that outlived its own drain is not shown twice',
    () async {
      // The mapping is written before the outbox row is cleared, and the two are
      // not one transaction — a process that stops in between leaves a queued
      // create for a bookmark the server already has. Without the map that row
      // renders as a second bookmark; with it, the server copy is recognised as
      // the same one.
      final LessonBookmark local = await player.createBookmark(
        lessonId: 'l1',
        position: const Duration(seconds: 5),
      );
      final String serverId = server.create(positionSeconds: 5);
      await BookmarkIdMapDao(db).record(localId: local.id, serverId: serverId);

      final List<LessonBookmark> shown = await player.fetchBookmarks('l1');

      expect(shown, hasLength(1));
      expect(shown.single.id, serverId);
    },
  );

  test('an open lesson picks up the server id without being reopened', () async {
    // The gap every other test in this file misses: they call `fetchBookmarks`
    // by hand after the drain. On a real screen nobody does — the list is
    // whatever `_load` put in `PlayerState`, and before the sync -> player wire
    // existed it stayed there, still carrying the local id, until the user left
    // the lesson and came back. That reopen is the refetch this card promised
    // to remove.
    final StreamController<void> settled = StreamController<void>.broadcast();
    addTearDown(settled.close);

    final PlayerBloc bloc = PlayerBloc(
      repository: player,
      progressRecorder: FakeProgressRecorder(),
      playback: FakeVideoPlaybackPort(),
      playbackPreferences: FakePlaybackPreferences(),
      syncSettled: settled.stream,
    );
    addTearDown(bloc.close);

    bloc.add(const PlayerStarted('l1'));
    await pumpEventQueue();
    expect(bloc.state.status, PlayerStatus.paused);

    bloc.add(
      const PlayerBookmarkAdded(
        position: Duration(seconds: 42),
        label: 'offline',
      ),
    );
    await pumpEventQueue();
    final String localId = bloc.state.bookmarks.single.id;
    expect(localId, isNot('srv-1'), reason: 'the server has not seen it yet');

    // The drain, then the edge `SyncBloc.drained` emits when one settles.
    // Nothing in between touches the player.
    await sync.drain();
    settled.add(null);
    await pumpEventQueue();

    expect(bloc.state.bookmarks, hasLength(1));
    expect(bloc.state.bookmarks.single.id, 'srv-1');
    expect(bloc.state.bookmarks.single.label, 'offline');
  });

  test(
    'a bookmark deleted offline does not reappear before the drain',
    () async {
      await player.createBookmark(lessonId: 'l1', position: Duration.zero);
      await sync.drain();

      await player.deleteBookmark('srv-1');

      expect(
        await player.fetchBookmarks('l1'),
        isEmpty,
        reason: 'the queued delete hides the server copy it has not sent yet',
      );
    },
  );
}

ResponseBody _json(String body) => ResponseBody.fromString(
  body,
  200,
  headers: <String, List<String>>{
    Headers.contentTypeHeader: <String>[Headers.jsonContentType],
  },
);
