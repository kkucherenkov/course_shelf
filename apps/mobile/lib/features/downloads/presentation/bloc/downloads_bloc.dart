import 'dart:async';

import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/features/downloads/domain/download_item.dart';
import 'package:app_mobile/features/downloads/domain/downloads_repository.dart';
import 'package:app_mobile/features/downloads/presentation/bloc/downloads_event.dart';
import 'package:app_mobile/features/downloads/presentation/bloc/downloads_state.dart';

/// Owns the Downloads tab's view of the queue.
///
/// Deliberately thin: every queue mechanic (serialization, resume, backoff,
/// crypto) lives in [DownloadsRepository], so this class stays event
/// translation plus one subscription and can be reasoned about on its own.
class DownloadsBloc extends Bloc<DownloadsEvent, DownloadsState> {
  DownloadsBloc(this._repository) : super(const DownloadsState()) {
    on<DownloadsStarted>(_onStarted);
    on<DownloadsUpdated>(_onUpdated);
    on<EnqueueLesson>(
      (EnqueueLesson e, _) =>
          _repository.enqueueLesson(e.lessonId, courseId: e.courseId),
    );
    on<EnqueueCourse>(
      (EnqueueCourse e, _) =>
          _repository.enqueueCourse(e.courseId, e.lessonIds),
    );
    on<PauseDownload>((PauseDownload e, _) => _repository.pause(e.lessonId));
    on<ResumeDownload>((ResumeDownload e, _) => _repository.resume(e.lessonId));
    on<CancelDownload>((CancelDownload e, _) => _repository.cancel(e.lessonId));
    on<RetryDownload>((RetryDownload e, _) => _repository.retry(e.lessonId));
  }

  final DownloadsRepository _repository;
  StreamSubscription<List<DownloadItem>>? _subscription;

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
  }

  void _onUpdated(DownloadsUpdated event, Emitter<DownloadsState> emit) {
    emit(state.copyWith(items: event.items, isLoading: false));
  }

  @override
  Future<void> close() async {
    await _subscription?.cancel();
    return super.close();
  }
}
