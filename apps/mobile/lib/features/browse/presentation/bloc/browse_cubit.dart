import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/features/browse/domain/browse_filter.dart';
import 'package:app_mobile/features/browse/domain/browse_repository.dart';
import 'package:app_mobile/features/browse/presentation/bloc/browse_state.dart';

/// Drives the Browse tab through Loading | Loaded | Empty | Failed.
class BrowseCubit extends Cubit<BrowseState> {
  BrowseCubit(this._repository) : super(const BrowseState());

  final BrowseRepository _repository;

  /// True once libraries have been fetched at least once — [retry] uses this
  /// to tell "the very first load failed" (re-fetch both) from "a later
  /// filter refetch failed" (libraries are still good, only courses need
  /// another try).
  bool _librariesLoaded = false;

  /// Fetches libraries (once) and the initial course list together.
  Future<void> load() async {
    emit(state.copyWith(status: BrowseStatus.loading));
    try {
      final (libraries, courses) = await (
        _repository.fetchLibraries(),
        _repository.fetchCourses(state.filter),
      ).wait;
      if (isClosed) return;
      _librariesLoaded = true;
      emit(
        state.copyWith(
          status: courses.isEmpty ? BrowseStatus.empty : BrowseStatus.loaded,
          courses: courses,
          libraries: libraries,
        ),
      );
    } on Object {
      if (isClosed) return;
      emit(state.copyWith(status: BrowseStatus.failed));
    }
  }

  /// Replaces the active filter/sort and refetches courses with it.
  Future<void> applyFilter(BrowseFilter filter) => _fetchCourses(filter);

  Future<void> setStatus(BrowseStatusFilter status) =>
      applyFilter(state.filter.copyWith(status: status));

  /// `null` clears back to "every library".
  Future<void> setLibrary(String? libraryId) => applyFilter(
    state.filter.copyWith(
      libraryId: libraryId,
      clearLibraryId: libraryId == null,
    ),
  );

  Future<void> setSort(BrowseSort sort) =>
      applyFilter(state.filter.copyWith(sort: sort));

  Future<void> clearFilters() => applyFilter(const BrowseFilter());

  /// The Failed state's Retry action. Re-runs whatever the last attempt was —
  /// the full initial load if libraries never landed, otherwise just courses
  /// under the current filter.
  Future<void> retry() =>
      _librariesLoaded ? _fetchCourses(state.filter) : load();

  Future<void> _fetchCourses(BrowseFilter filter) async {
    emit(state.copyWith(status: BrowseStatus.loading, filter: filter));
    try {
      final courses = await _repository.fetchCourses(filter);
      if (isClosed) return;
      emit(
        state.copyWith(
          status: courses.isEmpty ? BrowseStatus.empty : BrowseStatus.loaded,
          courses: courses,
        ),
      );
    } on Object {
      if (isClosed) return;
      emit(state.copyWith(status: BrowseStatus.failed));
    }
  }
}
