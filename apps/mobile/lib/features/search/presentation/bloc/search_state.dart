import 'package:equatable/equatable.dart';

import 'package:app_mobile/features/search/domain/search_result.dart';

/// The five states the Search tab renders.
///
/// [recent] covers both "nothing typed yet" and "typed fewer than 2 trimmed
/// chars" — both render the same recent-searches surface, so there is no
/// separate "idle" status to fork on.
enum SearchStatus { recent, loading, results, empty, failed }

class SearchState extends Equatable {
  const SearchState({
    this.status = SearchStatus.recent,
    this.query = '',
    this.results,
    this.recentSearches = const <String>[],
  });

  final SearchStatus status;

  /// The exact text currently in the field — not necessarily what was last
  /// searched (a debounced keystroke can outrun the network).
  final String query;

  /// Populated for [SearchStatus.results] and [SearchStatus.empty]; null
  /// otherwise.
  final SearchResults? results;

  /// Most-recent-first, deduplicated, capped list of past search terms.
  final List<String> recentSearches;

  SearchState copyWith({
    SearchStatus? status,
    String? query,
    SearchResults? results,
    bool clearResults = false,
    List<String>? recentSearches,
  }) {
    return SearchState(
      status: status ?? this.status,
      query: query ?? this.query,
      results: clearResults ? null : (results ?? this.results),
      recentSearches: recentSearches ?? this.recentSearches,
    );
  }

  @override
  List<Object?> get props => <Object?>[status, query, results, recentSearches];
}
