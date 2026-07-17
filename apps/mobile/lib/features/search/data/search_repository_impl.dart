import 'package:dio/dio.dart';

import 'package:app_mobile/features/search/domain/search_repository.dart';
import 'package:app_mobile/features/search/domain/search_result.dart';

/// [SearchRepository] backed by GET `/search` over the shared,
/// interceptor-equipped [Dio].
///
/// Calls Dio directly rather than through the generated `app_api_client`, for
/// the same reason `home_repository_impl.dart` does (that package is
/// currently unimportable — #168). Swap the parsing here for the generated
/// `CatalogApi.searchCatalogue` once that is fixed.
///
/// The path carries no `/api/v1` prefix. `AppConfig.apiBaseUrl` already ends
/// in `/api/v1`, and Dio *string-concatenates* baseUrl + path (it does not do
/// RFC URI resolution), so a path that re-prefixed `/api/v1` would resolve to
/// `/api/v1/api/v1/search`.
class SearchRepositoryImpl implements SearchRepository {
  const SearchRepositoryImpl(this._dio);

  final Dio _dio;

  @override
  Future<SearchResults> search(String query, {int limit = 20}) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/search',
      queryParameters: <String, dynamic>{'q': query, 'limit': limit},
    );

    final body = response.data;
    final courses = body?['courses'];
    final lessons = body?['lessons'];
    if (body == null || courses is! List || lessons is! List) {
      throw StateError('/search responded 2xx without courses/lessons arrays');
    }

    return SearchResults(
      query: (body['query'] as String?) ?? query,
      courses: courses.cast<Map<String, dynamic>>().map(_toCourseHit).toList(),
      lessons: lessons.cast<Map<String, dynamic>>().map(_toLessonHit).toList(),
    );
  }

  SearchCourseHit _toCourseHit(Map<String, dynamic> json) => SearchCourseHit(
    id: json['id'] as String,
    libraryId: json['libraryId'] as String,
    title: json['title'] as String,
    slug: json['slug'] as String,
    lessonsTotal: (json['lessonsTotal'] as num).toInt(),
  );

  SearchLessonHit _toLessonHit(Map<String, dynamic> json) => SearchLessonHit(
    id: json['id'] as String,
    courseId: json['courseId'] as String,
    courseTitle: json['courseTitle'] as String,
    sectionTitle: json['sectionTitle'] as String,
    title: json['title'] as String,
    position: (json['position'] as num).toInt(),
  );
}
