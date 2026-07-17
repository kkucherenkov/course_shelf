import 'package:app_mobile/features/browse/domain/browse_course.dart';
import 'package:app_mobile/features/browse/domain/browse_filter.dart';

/// Port — everything the Browse tab reads. Implementations live in `data/`.
abstract class BrowseRepository {
  /// `GET /courses` filtered/sorted by [filter]. Throws on failure.
  Future<List<BrowseCourse>> fetchCourses(BrowseFilter filter);

  /// `GET /libraries` — the filter sheet's Library options. Throws on
  /// failure.
  Future<List<BrowseLibrary>> fetchLibraries();
}
