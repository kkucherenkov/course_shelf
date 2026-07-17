import 'package:equatable/equatable.dart';

import 'package:app_mobile/features/home/domain/home_summary.dart';

/// The four states E18-F01-S01 specifies for Home.
///
/// [empty] is a resolved answer, not a flavour of [loaded]: the screen swaps
/// the rows for a single empty state, so collapsing the two would make every
/// builder re-derive "is it really empty?" from the summary.
enum HomeStatus { loading, loaded, empty, failed }

class HomeState extends Equatable {
  const HomeState({
    this.status = HomeStatus.loading,
    this.summary,
  });

  final HomeStatus status;

  /// Populated for [HomeStatus.loaded] and [HomeStatus.empty] — Empty still
  /// carries the summary because the quick links read `libraryCount` from it.
  /// Null while loading and after a failure.
  final HomeSummary? summary;

  @override
  List<Object?> get props => <Object?>[status, summary];
}
