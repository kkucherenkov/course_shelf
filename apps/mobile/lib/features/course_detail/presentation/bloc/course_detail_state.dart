import 'package:equatable/equatable.dart';

import 'package:app_mobile/features/course_detail/domain/course_detail.dart';

/// The four states this screen renders — E18-F01-S03.
///
/// [noAccess] is a resolved answer, not a flavour of [failed]: the outline
/// 403ing means the whole course is locked (course-level access), which reads
/// as a locked banner + enroll seam, not a retryable transport error.
enum CourseDetailStatus { loading, loaded, noAccess, failed }

class CourseDetailState extends Equatable {
  const CourseDetailState({
    this.status = CourseDetailStatus.loading,
    this.detail,
  });

  final CourseDetailStatus status;

  /// Populated only for [CourseDetailStatus.loaded]. Null for every other
  /// status: [CourseDetailStatus.noAccess] carries no course data (the
  /// outline 403'd before any summary/sections came back), and
  /// [CourseDetailStatus.failed] drops whatever was there before rather than
  /// render stale content under an error.
  final CourseDetail? detail;

  @override
  List<Object?> get props => <Object?>[status, detail];
}
