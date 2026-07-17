import 'dart:async';

import 'package:flutter/widgets.dart';

import 'package:app_mobile/features/player/domain/lesson_playback.dart';
import 'package:app_mobile/features/player/domain/lesson_player_repository.dart';
import 'package:app_mobile/features/player/domain/video_playback_port.dart';

/// A [VideoPlaybackPort] with no platform behind it.
///
/// `video_player` cannot decode under `flutter test` — there is no platform to
/// answer its method channel — so every BLoC test drives playback through this
/// instead, pushing snapshots by hand via [emit].
class FakeVideoPlaybackPort implements VideoPlaybackPort {
  final StreamController<VideoPlaybackSnapshot> _controller =
      StreamController<VideoPlaybackSnapshot>.broadcast();

  VideoPlaybackSnapshot _snapshot = const VideoPlaybackSnapshot();

  /// Every call made on the port, in order — lets a test assert that the BLoC
  /// actually drove the engine, not just its own state.
  final List<String> calls = <String>[];

  /// Sources passed to [open], in order.
  final List<LessonVideoSource> opened = <LessonVideoSource>[];

  /// Positions passed to [seek], in order.
  final List<Duration> seeks = <Duration>[];

  /// When set, [open] throws this.
  Object? openError;

  @override
  Stream<VideoPlaybackSnapshot> get snapshots => _controller.stream;

  @override
  VideoPlaybackSnapshot get snapshot => _snapshot;

  /// Pushes a snapshot as the platform would.
  void emit(VideoPlaybackSnapshot next) {
    _snapshot = next;
    _controller.add(next);
  }

  @override
  Future<void> open(LessonVideoSource source) async {
    calls.add('open');
    opened.add(source);
    if (openError != null) throw openError!;
    _snapshot = const VideoPlaybackSnapshot(isInitialized: true);
  }

  @override
  Future<void> play() async {
    calls.add('play');
  }

  @override
  Future<void> pause() async {
    calls.add('pause');
  }

  @override
  Future<void> seek(Duration position) async {
    calls.add('seek');
    seeks.add(position);
  }

  @override
  Future<void> setSpeed(double speed) async {
    calls.add('setSpeed:$speed');
  }

  @override
  Future<void> setMuted(bool muted) async {
    calls.add('setMuted:$muted');
  }

  @override
  Widget buildSurface() => const SizedBox.shrink();

  @override
  Future<void> dispose() async {
    calls.add('dispose');
    await _controller.close();
  }
}

/// In-memory [LessonPlayerRepository].
class FakeLessonPlayerRepository implements LessonPlayerRepository {
  FakeLessonPlayerRepository({
    LessonPlayback? lesson,
    this.source = const LessonVideoSource.network('https://cdn.test/a.mp4'),
    this.sections = const <LessonOutlineSection>[],
    List<LessonBookmark>? bookmarks,
    this.note,
  }) : lesson = lesson ?? fakeLesson,
       bookmarks = bookmarks ?? <LessonBookmark>[];

  LessonPlayback lesson;
  LessonVideoSource source;
  List<LessonOutlineSection> sections;
  List<LessonBookmark> bookmarks;
  String? note;

  /// When set, [fetchLesson] throws it.
  Object? lessonError;

  /// When set, [resolveVideoSource] throws it.
  Object? sourceError;

  final List<String> savedNotes = <String>[];
  final List<String> deletedBookmarks = <String>[];
  int createBookmarkCount = 0;
  int resolveSourceCount = 0;

  @override
  Future<LessonPlayback> fetchLesson(String lessonId) async {
    if (lessonError != null) throw lessonError!;
    return lesson;
  }

  @override
  Future<List<LessonOutlineSection>> fetchCourseOutline(String courseId) async =>
      sections;

  @override
  Future<LessonVideoSource> resolveVideoSource(String lessonId) async {
    resolveSourceCount++;
    if (sourceError != null) throw sourceError!;
    return source;
  }

  @override
  Future<List<LessonBookmark>> fetchBookmarks(String lessonId) async =>
      bookmarks;

  @override
  Future<LessonBookmark> createBookmark({
    required String lessonId,
    required Duration position,
    String? label,
  }) async {
    createBookmarkCount++;
    final LessonBookmark created = LessonBookmark(
      id: 'bm-$createBookmarkCount',
      position: position,
      label: label ?? '',
    );
    bookmarks = <LessonBookmark>[...bookmarks, created];
    return created;
  }

  @override
  Future<void> deleteBookmark(String bookmarkId) async {
    deletedBookmarks.add(bookmarkId);
    bookmarks = bookmarks
        .where((LessonBookmark b) => b.id != bookmarkId)
        .toList();
  }

  @override
  Future<String?> fetchNote(String lessonId) async => note;

  @override
  Future<void> saveNote({
    required String lessonId,
    required String body,
  }) async {
    savedNotes.add(body);
    note = body;
  }

  @override
  Future<String> issueMaterialDownloadUrl({
    required String lessonId,
    required String materialId,
  }) async => 'https://cdn.test/$materialId.pdf';
}

/// One recorded `progress_outbox` write.
class RecordedProgress {
  const RecordedProgress({
    required this.lessonId,
    required this.position,
    required this.duration,
    required this.clientUpdatedAt,
  });

  final String lessonId;
  final Duration position;
  final Duration duration;
  final DateTime clientUpdatedAt;
}

/// Captures `progress_outbox` writes without a database.
class FakeProgressRecorder implements LessonProgressRecorder {
  final List<RecordedProgress> writes = <RecordedProgress>[];

  @override
  Future<void> enqueue({
    required String lessonId,
    required Duration position,
    required Duration duration,
    required DateTime clientUpdatedAt,
  }) async {
    writes.add(
      RecordedProgress(
        lessonId: lessonId,
        position: position,
        duration: duration,
        clientUpdatedAt: clientUpdatedAt,
      ),
    );
  }
}

const LessonPlayback fakeLesson = LessonPlayback(
  id: 'lesson-1',
  courseId: 'course-1',
  sectionId: 'section-1',
  title: 'Leaderless replication',
  duration: Duration(minutes: 26, seconds: 18),
  resumeAt: Duration.zero,
);
