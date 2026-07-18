import 'package:equatable/equatable.dart';

/// `GET /courses`' `status` query param — per-user progress filter.
///
/// API-honest: the server accepts exactly one value, not a set (see
/// `packages/specs/openapi/openapi.yaml`'s `listCourses`), so the Browse
/// sheet single-selects this rather than the design's checkbox rendering.
/// TODO(E18): multi-select filters once GET /courses accepts arrays.
enum BrowseStatusFilter { all, notStarted, inProgress, completed }

/// Wire values for [BrowseStatusFilter] — exactly the OpenAPI `status` enum.
extension BrowseStatusFilterWire on BrowseStatusFilter {
  String get wireValue => switch (this) {
    BrowseStatusFilter.all => 'all',
    BrowseStatusFilter.notStarted => 'not-started',
    BrowseStatusFilter.inProgress => 'in-progress',
    BrowseStatusFilter.completed => 'completed',
  };
}

/// `GET /courses`' `sort` query param.
enum BrowseSort { recentlyWatched, newest, alphabetical }

/// Wire values for [BrowseSort] — exactly the OpenAPI `sort` enum.
extension BrowseSortWire on BrowseSort {
  String get wireValue => switch (this) {
    BrowseSort.recentlyWatched => 'recently-watched',
    BrowseSort.newest => 'newest',
    BrowseSort.alphabetical => 'alphabetical',
  };
}

/// The Browse tab's active filter/sort selection.
///
/// Single-select on every axis, matching what `GET /courses` actually
/// accepts (one `status`, one `libraryId`) — see [BrowseStatusFilter]. Mirrors
/// apps/web's `useCoursesList`: [status] `all` and [sort]
/// `recentlyWatched` are the wire defaults, so the repository omits both
/// query params when they hold those values rather than sending them
/// explicitly.
class BrowseFilter extends Equatable {
  const BrowseFilter({
    this.status = BrowseStatusFilter.all,
    this.libraryId,
    this.sort = BrowseSort.recentlyWatched,
  });

  final BrowseStatusFilter status;

  /// `null` means "every library" (no `libraryId` param sent).
  final String? libraryId;
  final BrowseSort sort;

  /// How many facets deviate from their default — drives the Filters
  /// button's count badge and whether the active-chip rail renders. [sort]
  /// deliberately does not count: the design's active-rail only ever shows
  /// status/library chips (see `cs-mobile-browse/app.jsx`'s `FILTERED`
  /// variant), sort is surfaced via its own button label instead.
  int get activeCount =>
      (status != BrowseStatusFilter.all ? 1 : 0) + (libraryId != null ? 1 : 0);

  BrowseFilter copyWith({
    BrowseStatusFilter? status,
    String? libraryId,
    bool clearLibraryId = false,
    BrowseSort? sort,
  }) {
    return BrowseFilter(
      status: status ?? this.status,
      libraryId: clearLibraryId ? null : (libraryId ?? this.libraryId),
      sort: sort ?? this.sort,
    );
  }

  @override
  List<Object?> get props => <Object?>[status, libraryId, sort];
}
