import 'package:dio/dio.dart';

import 'package:app_mobile/features/browse/domain/browse_course.dart';
import 'package:app_mobile/features/browse/domain/browse_filter.dart';
import 'package:app_mobile/features/browse/domain/browse_repository.dart';

/// [BrowseRepository] backed by `GET /courses` and `GET /libraries` over the
/// shared, interceptor-equipped [Dio].
///
/// Calls Dio directly rather than through the generated `app_api_client`, for
/// the same reason `home_repository_impl.dart` does (that package is
/// currently unimportable — #168). Swap the parsing here for the generated
/// `CatalogApi.listCourses`/`listLibraries` once that is fixed.
///
/// Paths carry no `/api/v1` prefix. `AppConfig.apiBaseUrl` already ends in
/// `/api/v1`, and Dio *string-concatenates* baseUrl + path (it does not do
/// RFC URI resolution), so a path that re-prefixed `/api/v1` would resolve to
/// `/api/v1/api/v1/courses`.
class BrowseRepositoryImpl implements BrowseRepository {
  const BrowseRepositoryImpl(this._dio);

  final Dio _dio;

  @override
  Future<List<BrowseCourse>> fetchCourses(BrowseFilter filter) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/courses',
      queryParameters: _query(filter),
    );
    return _items(response.data, '/courses').map(_toCourse).toList();
  }

  @override
  Future<List<BrowseLibrary>> fetchLibraries() async {
    final response = await _dio.get<Map<String, dynamic>>('/libraries');
    return _items(response.data, '/libraries').map(_toLibrary).toList();
  }

  /// Mirrors apps/web's `useCoursesList`: only send a param when it deviates
  /// from the server's own default, rather than spelling out every default
  /// explicitly.
  Map<String, dynamic> _query(BrowseFilter filter) {
    final query = <String, dynamic>{};
    if (filter.libraryId != null) query['libraryId'] = filter.libraryId;
    if (filter.status != BrowseStatusFilter.all) {
      query['status'] = filter.status.wireValue;
    }
    if (filter.sort != BrowseSort.recentlyWatched) {
      query['sort'] = filter.sort.wireValue;
    }
    return query;
  }

  /// Pulls the `items` array out of a `{ items: [...] }` envelope. A 2xx with
  /// no body or no array is a broken server, not an empty result — throwing
  /// keeps the retry affordance instead of silently claiming "no courses".
  List<Map<String, dynamic>> _items(Map<String, dynamic>? body, String path) {
    final items = body?['items'];
    if (items is! List) {
      throw StateError('$path responded 2xx without an items array');
    }
    return items.cast<Map<String, dynamic>>();
  }

  BrowseCourse _toCourse(Map<String, dynamic> json) {
    final progress = json['progress'] as Map<String, dynamic>;
    final instructorsRaw = json['instructors'];
    final instructors = instructorsRaw is List
        ? instructorsRaw.cast<Map<String, dynamic>>()
        : const <Map<String, dynamic>>[];

    return BrowseCourse(
      id: json['id'] as String,
      title: json['title'] as String,
      instructor: instructors
          .map((Map<String, dynamic> i) => i['displayName'] as String)
          .join(', '),
      lessonsCompleted: (progress['lessonsCompleted'] as num).toInt(),
      lessonsTotal: (progress['lessonsTotal'] as num).toInt(),
    );
  }

  BrowseLibrary _toLibrary(Map<String, dynamic> json) =>
      BrowseLibrary(id: json['id'] as String, name: json['name'] as String);
}
