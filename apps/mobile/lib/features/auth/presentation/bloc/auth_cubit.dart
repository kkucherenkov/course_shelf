import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/features/auth/domain/auth_repository.dart';
import 'package:app_mobile/features/auth/presentation/bloc/auth_state.dart';

/// Manages sign-in / sign-up / session-restore flows.
/// Email+password (`signIn` / `signUp`) is the primary path; phone-OTP
/// (`requestOtp` / `verifyOtp`) is the secondary path. `signOut` and
/// `checkSession` bracket the session lifecycle.
class AuthCubit extends Cubit<AuthState> {
  AuthCubit(this._repository) : super(const AuthState());

  final AuthRepository _repository;

  /// Called once on app boot to restore the existing session (if any).
  Future<void> checkSession() async {
    emit(state.copyWith(status: AuthStatus.authenticating));
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

  /// Request a one-time code for [phone] via the backend SMS gateway.
  Future<void> requestOtp({required String phone}) async {
    emit(state.copyWith(status: AuthStatus.authenticating, errorMessage: null));
    try {
      await _repository.requestOtp(phone: phone);
      emit(state.copyWith(status: AuthStatus.otpSent, phone: phone));
    } on OtpError {
      emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: 'invalid-phone',
      ));
    } on Object catch (e) {
      emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: e.toString(),
      ));
    }
  }

  Future<void> verifyOtp({
    required String phone,
    required String code,
    required String name,
  }) async {
    emit(state.copyWith(status: AuthStatus.authenticating, errorMessage: null));
    try {
      final result = await _repository.verifyOtp(
        phone: phone,
        code: code,
        name: name,
      );
      emit(AuthState(status: AuthStatus.authenticated, user: result.user));
    } on OtpError catch (e) {
      emit(state.copyWith(
        status: AuthStatus.otpSent,
        errorMessage: 'otp-${e.kind.name}',
        phone: phone,
      ));
    } on Object catch (e) {
      emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: e.toString(),
      ));
    }
  }

  /// Return to the phone-entry step.
  void resetToPhoneStep() {
    emit(const AuthState());
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
