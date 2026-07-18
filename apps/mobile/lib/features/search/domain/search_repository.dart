import 'package:app_mobile/features/search/domain/search_result.dart';

/// Port — everything the Search tab reads. Implementations live in `data/`.
abstract class SearchRepository {
  /// Searches course + lesson titles for [query]. [limit] caps each list
  /// independently (server default/max: 20/100). Callers are expected to
  /// pre-trim and length-gate [query]; the server itself returns empty lists
  /// for anything shorter than 2 trimmed characters, so a cubit that skips
  /// the call below that length is an optimisation, not a correctness
  /// requirement.
  Future<SearchResults> search(String query, {int limit = 20});
}
