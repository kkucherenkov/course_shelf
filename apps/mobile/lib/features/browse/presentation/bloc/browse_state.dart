import 'package:equatable/equatable.dart';

import 'package:app_mobile/features/browse/domain/browse_course.dart';
import 'package:app_mobile/features/browse/domain/browse_filter.dart';

/// The four states the Browse tab renders.
enum BrowseStatus { loading, loaded, empty, failed }

class BrowseState extends Equatable {
  const BrowseState({
    this.status = BrowseStatus.loading,
    this.courses = const <BrowseCourse>[],
    this.libraries = const <BrowseLibrary>[],
    this.filter = const BrowseFilter(),
  });

  final BrowseStatus status;
  final List<BrowseCourse> courses;

  /// Fetched once on [BrowseStatus.loading]'s first pass and kept across
  /// every subsequent filter refetch — the filter sheet's Library options
  /// never need to be re-fetched.
  final List<BrowseLibrary> libraries;
  final BrowseFilter filter;

  BrowseState copyWith({
    BrowseStatus? status,
    List<BrowseCourse>? courses,
    List<BrowseLibrary>? libraries,
    BrowseFilter? filter,
  }) {
    return BrowseState(
      status: status ?? this.status,
      courses: courses ?? this.courses,
      libraries: libraries ?? this.libraries,
      filter: filter ?? this.filter,
    );
  }

  @override
  List<Object?> get props => <Object?>[status, courses, libraries, filter];
}
