import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/features/home/domain/home_repository.dart';
import 'package:app_mobile/features/home/presentation/bloc/home_state.dart';

/// Drives the Home tab through Loading | Loaded | Empty | Failed
/// (E18-F01-S01).
///
/// Web Home gives each row its own status and retry. Home on mobile has one
/// screen-level state instead — there is no room for three independent error
/// panels in a phone viewport — so the rows load as a unit and any failure is
/// reported once, for the whole screen.
class HomeCubit extends Cubit<HomeState> {
  HomeCubit(this._repository) : super(const HomeState());

  final HomeRepository _repository;

  /// First load. [MainShell] provides the cubit and kicks this off.
  Future<void> load() async {
    emit(const HomeState());
    await _fetch();
  }

  /// Pull-to-refresh. The shell owns the gesture and keeps its spinner up for
  /// exactly as long as the returned future is pending, so this must not
  /// resolve before the reload has landed.
  ///
  /// Only re-enters Loading from [HomeStatus.failed], where there is nothing on
  /// screen to preserve. Refreshing over Loaded/Empty leaves the current render
  /// in place: the shell's own spinner already signals the reload, and emitting
  /// Loading here would tear the rows down under the user's finger.
  Future<void> refresh() async {
    if (state.status == HomeStatus.failed) {
      emit(const HomeState());
    }
    await _fetch();
  }

  Future<void> _fetch() async {
    try {
      final summary = await _repository.fetchSummary();
      if (isClosed) return;
      emit(
        HomeState(
          status: summary.isEmpty ? HomeStatus.empty : HomeStatus.loaded,
          summary: summary,
        ),
      );
    } on Object {
      if (isClosed) return;
      // Drops the previous summary deliberately: a half-stale row rendered
      // beneath an error panel is worse than an honest, retryable error.
      emit(const HomeState(status: HomeStatus.failed));
    }
  }
}
