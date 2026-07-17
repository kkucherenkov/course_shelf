import 'package:dio/dio.dart';

import 'package:app_mobile/features/home/domain/home_repository.dart';
import 'package:app_mobile/features/home/domain/home_summary.dart';

/// [HomeRepository] backed by the catalog endpoints
/// (`/home/continue-watching`, `/home/recently-added`, `/libraries`) over the
/// shared, interceptor-equipped [Dio].
///
/// Calls Dio directly rather than through the generated `app_api_client`: that
/// package is currently unimportable — its pubspec/package root is nested one
/// level below where the mobile pubspec points, so `package:app_api_client/…`
/// does not resolve (#168). Swap the parsing here for `CatalogApi` once that is
/// fixed — the [HomeRepository] port keeps the change invisible upstream.
///
/// Paths use a leading slash and NO `/api/v1` prefix. `AppConfig.apiBaseUrl`
/// already ends in `/api/v1`, and Dio *string-concatenates* baseUrl + path (it
/// does not do RFC URI resolution), so a path that re-prefixed `/api/v1` would
/// resolve to `/api/v1/api/v1/home/...`. This is exactly the latent doubling
/// bug in `auth_api.dart`, whose `/api/v1/...` paths resolve to
/// `/api/v1/api/v1/...` (filed separately; do not copy that precedent).
class HomeRepositoryImpl implements HomeRepository {
  const HomeRepositoryImpl(this._dio);

  final Dio _dio;

  /// Matches web Home's `useContinueWatching` / `useRecentlyAdded`, which both
  /// ask for 10. `/libraries` is unpaged.
  static const int _rowLimit = 10;

  @override
  Future<HomeSummary> fetchSummary() async {
    // Fired together: three independent GETs behind one screen-level state, so
    // serialising them would treble the time to first paint for no benefit.
    final (cwResponse, raResponse, libResponse) = await (
      _dio.get<Map<String, dynamic>>(
        '/home/continue-watching',
        queryParameters: <String, dynamic>{'limit': _rowLimit},
      ),
      _dio.get<Map<String, dynamic>>(
        '/home/recently-added',
        queryParameters: <String, dynamic>{'limit': _rowLimit},
      ),
      _dio.get<Map<String, dynamic>>('/libraries'),
    ).wait;

    return HomeSummary(
      continueWatching: _items(cwResponse.data, '/home/continue-watching')
          .map(_toContinueWatching)
          .toList(),
      recentlyAdded: _items(raResponse.data, '/home/recently-added')
          .map(_toRecentlyAdded)
          .toList(),
      libraryCount: _items(libResponse.data, '/libraries').length,
    );
  }

  /// Pulls the `items` array out of a `{ items: [...] }` envelope. A 2xx with no
  /// body or no array is a broken server, not an empty Home — throwing keeps the
  /// retry affordance instead of silently claiming "no courses yet".
  List<Map<String, dynamic>> _items(Map<String, dynamic>? body, String path) {
    final items = body?['items'];
    if (items is! List) {
      throw StateError('$path responded 2xx without an items array');
    }
    return items.cast<Map<String, dynamic>>();
  }

  ContinueWatchingCourse _toContinueWatching(Map<String, dynamic> json) {
    return ContinueWatchingCourse(
      courseId: json['courseId'] as String,
      courseTitle: json['courseTitle'] as String,
      lessonsCompleted: (json['lessonsCompleted'] as num).toInt(),
      lessonsTotal: (json['lessonsTotal'] as num).toInt(),
      lastSeenLessonId: json['lastSeenLessonId'] as String,
    );
  }

  RecentlyAddedCourse _toRecentlyAdded(Map<String, dynamic> json) {
    return RecentlyAddedCourse(
      courseId: json['courseId'] as String,
      courseTitle: json['courseTitle'] as String,
      lessonCount: (json['lessonCount'] as num).toInt(),
    );
  }
}
