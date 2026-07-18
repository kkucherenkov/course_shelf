import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/features/course_detail/domain/course_detail.dart';
import 'package:app_mobile/features/course_detail/domain/course_detail_repository.dart';
import 'package:app_mobile/features/course_detail/presentation/bloc/course_detail_state.dart';

/// Drives the Course-detail screen through
/// Loading | Loaded | NoAccess | Failed (E18-F01-S03).
class CourseDetailCubit extends Cubit<CourseDetailState> {
  CourseDetailCubit(this._repository) : super(const CourseDetailState());

  final CourseDetailRepository _repository;

  /// Remembered for [retry] — the failed/no-access screens have no id of
  /// their own to hand back in.
  String? _courseId;

  /// First load. [CourseDetailScreen] provides the cubit and kicks this off
  /// with the pushed route's `courseId` argument.
  Future<void> load(String courseId) async {
    _courseId = courseId;
    emit(const CourseDetailState());
    await _fetch(courseId);
  }

  /// Re-runs the same fetch the failed/no-access screens' retry button calls.
  /// A no-op before the first [load].
  Future<void> retry() async {
    final String? courseId = _courseId;
    if (courseId == null) return;
    emit(const CourseDetailState());
    await _fetch(courseId);
  }

  Future<void> _fetch(String courseId) async {
    // Kicked off together — not `await`ed in sequence — so the outline and
    // the estimate are genuinely in flight at once; the estimate's own
    // failure handling (below) never blocks the outline call from starting.
    // Both go through an `async` wrapper so a repository implementation that
    // throws SYNCHRONOUSLY (rather than via a rejected Future) still lands in
    // the `try` block below instead of escaping it.
    final Future<CourseDetailOutline> outlineFuture = _fetchOutline(courseId);
    final Future<CourseDownloadEstimate?> estimateFuture = _fetchEstimateSoft(
      courseId,
    );

    try {
      final CourseDetailOutline outline = await outlineFuture;
      final CourseDownloadEstimate? estimate = await estimateFuture;
      if (isClosed) return;
      emit(
        CourseDetailState(
          status: CourseDetailStatus.loaded,
          detail: CourseDetail(
            summary: outline.summary,
            sections: outline.sections,
            estimate: estimate,
          ),
        ),
      );
    } on CourseAccessDeniedException {
      // Drain the estimate future rather than abandon it — a dangling Future
      // that later resolves with an error would surface as an unhandled
      // async error outside this method's try/catch.
      await estimateFuture;
      if (isClosed) return;
      emit(const CourseDetailState(status: CourseDetailStatus.noAccess));
    } on Object {
      await estimateFuture;
      if (isClosed) return;
      emit(const CourseDetailState(status: CourseDetailStatus.failed));
    }
  }

  /// Thin `async` passthrough. Being `async` (not a bare passthrough) matters:
  /// it guarantees a synchronous throw from [CourseDetailRepository.fetchOutline]
  /// is captured into the returned Future rather than escaping to the caller
  /// immediately, so [_fetch]'s `try` block is the only place that ever has to
  /// handle either failure mode.
  Future<CourseDetailOutline> _fetchOutline(String courseId) async {
    return _repository.fetchOutline(courseId);
  }

  /// Never throws: converts any [fetchDownloadEstimate] failure to `null` so
  /// the outline can still land as [CourseDetailStatus.loaded] with the
  /// secondary CTA falling back to its no-size label.
  Future<CourseDownloadEstimate?> _fetchEstimateSoft(String courseId) async {
    try {
      return await _repository.fetchDownloadEstimate(courseId);
    } on Object {
      return null;
    }
  }
}
