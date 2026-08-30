import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/features/downloads/domain/device_storage.dart';
import 'package:app_mobile/features/downloads/domain/download_item.dart';
import 'package:app_mobile/features/downloads/domain/downloads_repository.dart';
import 'package:app_mobile/features/downloads/presentation/bloc/downloads_event.dart';
import 'package:app_mobile/features/downloads/presentation/bloc/downloads_state.dart';

/// Owns the Downloads tab's view of the queue.
///
/// Deliberately thin: every queue mechanic (serialization, resume, backoff,
/// crypto) lives in [DownloadsRepository], so this class stays event
/// translation plus subscriptions and can be reasoned about on its own.
///
/// [DeviceStorage] and [Connectivity] are optional so the course-detail screen,
/// which resolves the same bloc only to ask `itemFor(lessonId)`, does not pay
/// for a platform channel it never reads.
class DownloadsBloc extends Bloc<DownloadsEvent, DownloadsState> {
  DownloadsBloc(
    this._repository, {
    DeviceStorage? deviceStorage,
    Connectivity? connectivity,
  }) : _deviceStorage = deviceStorage,
       _connectivity = connectivity,
       super(const DownloadsState()) {
    on<DownloadsStarted>(_onStarted);
    on<DownloadsUpdated>(_onUpdated);
    on<DownloadsStorageRequested>(_onStorageRequested);
    on<DownloadsStorageUpdated>(_onStorageUpdated);
    on<DownloadsConnectivityChanged>(
      (DownloadsConnectivityChanged e, Emitter<DownloadsState> emit) =>
          emit(state.copyWith(isOnline: e.isOnline)),
    );
    on<EnqueueLesson>(
      (EnqueueLesson e, _) => _repository.enqueueLesson(
        e.lessonId,
        courseId: e.courseId,
        lessonTitle: e.lessonTitle,
        courseTitle: e.courseTitle,
      ),
    );
    on<EnqueueCourse>(
      (EnqueueCourse e, _) => _repository.enqueueCourse(e.courseId, e.lessons),
    );
    on<PauseDownload>((PauseDownload e, _) => _repository.pause(e.lessonId));
    on<ResumeDownload>((ResumeDownload e, _) => _repository.resume(e.lessonId));
    on<CancelDownload>((CancelDownload e, _) => _repository.cancel(e.lessonId));
    on<RetryDownload>((RetryDownload e, _) => _repository.retry(e.lessonId));
    on<DeleteCourseDownloads>(_onDeleteCourse);
  }

  final DownloadsRepository _repository;
  final DeviceStorage? _deviceStorage;
  final Connectivity? _connectivity;

  StreamSubscription<List<DownloadItem>>? _subscription;
  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;

  Future<void> _onStarted(
    DownloadsStarted event,
    Emitter<DownloadsState> emit,
  ) async {
    // An app kill can strand a row in `downloading`. Reconcile before showing
    // the list, so the user never sees a download that is not actually running.
    await _repository.reconcileAfterRestart();
    await _subscription?.cancel();
    _subscription = _repository.watchAll().listen(
      (List<DownloadItem> items) => add(DownloadsUpdated(items)),
    );

    final Connectivity? connectivity = _connectivity;
    if (connectivity != null) {
      await _connectivitySubscription?.cancel();
      _connectivitySubscription = connectivity.onConnectivityChanged.listen(
        (List<ConnectivityResult> results) =>
            add(DownloadsConnectivityChanged(isOnline: _isOnline(results))),
      );
      add(
        DownloadsConnectivityChanged(
          isOnline: _isOnline(await connectivity.checkConnectivity()),
        ),
      );
    }

    add(const DownloadsStorageRequested());
  }

  void _onUpdated(DownloadsUpdated event, Emitter<DownloadsState> emit) {
    emit(state.copyWith(items: event.items, isLoading: false));
    // A finished or deleted download moves the numbers, so re-read rather than
    // leaving a stale bar on screen.
    add(const DownloadsStorageRequested());
  }

  Future<void> _onStorageRequested(
    DownloadsStorageRequested event,
    Emitter<DownloadsState> emit,
  ) async {
    final DeviceStorage? storage = _deviceStorage;
    // Nothing to read from: emit no snapshot at all rather than an empty one.
    // The bar falls back to CourseShelf's own usage, which the state already
    // derives from the queue.
    if (storage == null) return;

    final int? freeBytes = await storage.read();
    add(DownloadsStorageUpdated(StorageSnapshot(deviceFreeBytes: freeBytes)));
  }

  void _onStorageUpdated(
    DownloadsStorageUpdated event,
    Emitter<DownloadsState> emit,
  ) {
    // Capacity moves slowly; re-emitting an identical reading after every
    // queue tick would rebuild the whole tab for nothing.
    if (event.snapshot == state.storage) return;
    emit(state.copyWith(storage: event.snapshot));
  }

  Future<void> _onDeleteCourse(
    DeleteCourseDownloads event,
    Emitter<DownloadsState> emit,
  ) async {
    // Snapshot first: `cancel` mutates the stream this list came from, and
    // iterating a collection while it is being rewritten under you is how you
    // delete half a course.
    final List<String> lessonIds = state.items
        .where((DownloadItem i) => i.courseId == event.courseId)
        .map((DownloadItem i) => i.lessonId)
        .toList(growable: false);

    for (final String lessonId in lessonIds) {
      await _repository.cancel(lessonId);
    }
  }

  /// `ConnectivityResult.none` is the only unambiguous "offline" answer; the
  /// plugin reports a list because a device can hold several interfaces at
  /// once, and any non-none entry means something is up.
  static bool _isOnline(List<ConnectivityResult> results) =>
      results.any((ConnectivityResult r) => r != ConnectivityResult.none);

  @override
  Future<void> close() async {
    await _subscription?.cancel();
    await _connectivitySubscription?.cancel();
    return super.close();
  }
}
