import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/features/auth/domain/auth_repository.dart';
import 'package:app_mobile/features/auth/presentation/bloc/auth_state.dart';

/// Manages sign-in / sign-up / session-restore flows.
/// Email+password (`signIn` / `signUp`) is the only credential path;
/// `signOut` and `checkSession` bracket the session lifecycle.
///
/// Provided once, above the `MaterialApp`'s `Navigator` (see `App`), so that
/// `AuthGate` and every pushed auth route share one instance: a `signIn` on a
/// pushed route has to be the same session the gate is watching, or the gate
/// never rebuilds into the shell.
class AuthCubit extends Cubit<AuthState> {
  AuthCubit(this._repository) : super(const AuthState());

  final AuthRepository _repository;

  /// Called once on app boot to restore the existing session (if any).
  ///
  /// Stays on [AuthStatus.unknown] until it resolves rather than passing
  /// through [AuthStatus.authenticating] — that status means "an interactive
  /// credential submit is in flight", which a silent session restore is not.
  Future<void> checkSession() async {
    try {
      final user = await _repository.getSession();
      if (user != null) {
        emit(AuthState(status: AuthStatus.authenticated, user: user));
      } else {
        emit(const AuthState(status: AuthStatus.unauthenticated));
      }
    } on Object {
      emit(const AuthState(status: AuthStatus.unauthenticated));
    }
  }

  Future<void> signIn({
    required String email,
    required String password,
  }) async {
    emit(state.copyWith(status: AuthStatus.authenticating, errorMessage: null));
    try {
      final user = await _repository.signIn(email: email, password: password);
      emit(AuthState(status: AuthStatus.authenticated, user: user));
    } on Object catch (e) {
      emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: e.toString(),
      ));
    }
  }

  Future<void> signUp({
    required String name,
    required String email,
    required String password,
  }) async {
    emit(state.copyWith(status: AuthStatus.authenticating, errorMessage: null));
    try {
      final user = await _repository.signUp(
        name: name,
        email: email,
        password: password,
      );
      emit(AuthState(status: AuthStatus.authenticated, user: user));
    } on Object catch (e) {
      emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: e.toString(),
      ));
    }
  }

  Future<void> signOut() async {
    try {
      await _repository.signOut();
    } finally {
      emit(const AuthState(status: AuthStatus.unauthenticated));
    }
  }
}
