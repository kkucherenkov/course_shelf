import 'dart:async';

import 'package:flutter/foundation.dart' show listEquals;
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/features/search/domain/search_repository.dart';
import 'package:app_mobile/features/search/presentation/bloc/search_state.dart';
import 'package:app_mobile/shared/preferences/recent_searches_store.dart';

/// Drives the Search tab through Recent | Loading | Results | Empty | Failed.
///
/// Recent searches are seeded from and persisted to [RecentSearchesStore]
/// (device-local). They change on a successful search and on explicit
/// clear/remove.
class SearchCubit extends Cubit<SearchState> {
  SearchCubit(this._repository, RecentSearchesStore recentsStore)
    : _recentsStore = recentsStore,
      super(SearchState(recentSearches: recentsStore.read()));

  final SearchRepository _repository;
  final RecentSearchesStore _recentsStore;

  @override
  void onChange(Change<SearchState> change) {
    super.onChange(change);
    // Persist only when the recents list actually changed — not on every
    // keystroke-driven status/query emit.
    final List<String> next = change.nextState.recentSearches;
    if (!listEquals(next, change.currentState.recentSearches)) {
      _recentsStore.write(next);
    }
  }

  /// Mirrors the server's own gate (`packages/specs/openapi/openapi.yaml`:
  /// "Trimmed length must be >= 2"), so a shorter query never leaves the
  /// device.
  static const int _minQueryLength = 2;
  static const int _maxRecents = 8;
  static const Duration _debounce = Duration(milliseconds: 300);

  Timer? _debounceTimer;

  /// The last query that actually reached the network — what Retry re-runs.
  String? _lastSearchedTrimmed;

  /// Called on every keystroke. Below [_minQueryLength] trimmed chars this
  /// switches straight back to [SearchStatus.recent] with no network call;
  /// at or above it, the actual search is debounced by [_debounce].
  void queryChanged(String raw) {
    _debounceTimer?.cancel();
    final trimmed = raw.trim();

    if (trimmed.length < _minQueryLength) {
      emit(
        state.copyWith(
          status: SearchStatus.recent,
          query: raw,
          clearResults: true,
        ),
      );
      return;
    }

    _debounceTimer = Timer(_debounce, () => _runSearch(trimmed, raw));
  }

  /// Re-runs a recent term immediately — an explicit tap, not a keystroke, so
  /// it skips the debounce.
  Future<void> searchRecent(String term) async {
    _debounceTimer?.cancel();
    await _runSearch(term.trim(), term);
  }

  /// Retries the last query that actually reached the network — the Failed
  /// state's Retry action.
  Future<void> retry() async {
    final trimmed = _lastSearchedTrimmed;
    if (trimmed == null) return;
    await _runSearch(trimmed, state.query);
  }

  /// Clears the field back to [SearchStatus.recent].
  void clearQuery() {
    _debounceTimer?.cancel();
    emit(
      state.copyWith(
        status: SearchStatus.recent,
        query: '',
        clearResults: true,
      ),
    );
  }

  void clearRecent() => emit(state.copyWith(recentSearches: const <String>[]));

  void removeRecent(String term) {
    emit(
      state.copyWith(
        recentSearches: state.recentSearches
            .where((String t) => t != term)
            .toList(),
      ),
    );
  }

  Future<void> _runSearch(String trimmed, String displayQuery) async {
    if (trimmed.length < _minQueryLength) return;
    _lastSearchedTrimmed = trimmed;
    if (isClosed) return;
    emit(
      state.copyWith(
        status: SearchStatus.loading,
        query: displayQuery,
        clearResults: true,
      ),
    );

    try {
      // Spells out the default explicitly: a mocked SearchRepository's
      // noSuchMethod-based call only sees arguments the caller actually
      // wrote, so an omitted `limit:` here would never match a `when(...
      // limit: 20)` stub in tests.
      final results = await _repository.search(trimmed, limit: 20);
      if (isClosed) return;
      emit(
        state.copyWith(
          status: results.isEmpty ? SearchStatus.empty : SearchStatus.results,
          results: results,
          recentSearches: _withRecent(trimmed),
        ),
      );
    } on Object {
      if (isClosed) return;
      emit(state.copyWith(status: SearchStatus.failed, clearResults: true));
    }
  }

  /// Prepends [term], dropping any earlier occurrence and capping the list at
  /// [_maxRecents].
  List<String> _withRecent(String term) {
    final next = <String>[
      term,
      ...state.recentSearches.where((String t) => t != term),
    ];
    return next.take(_maxRecents).toList();
  }

  @override
  Future<void> close() {
    _debounceTimer?.cancel();
    return super.close();
  }
}
