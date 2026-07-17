import 'package:equatable/equatable.dart';

import 'package:app_mobile/features/auth/domain/auth_user.dart';

enum AuthStatus {
  /// Boot: the stored session has not been checked yet. Distinct from
  /// [unauthenticated], which is a *resolved* answer — `AuthGate` shows a
  /// splash here rather than flashing the sign-in screen for one frame.
  unknown,

  unauthenticated,

  /// An interactive sign-in / sign-up is in flight. Deliberately NOT a
  /// full-screen state: the auth screen stays mounted and renders its own
  /// inline button spinner, so the form isn't torn down under the user.
  authenticating,

  authenticated,
  error,
}

class AuthState extends Equatable {
  const AuthState({
    this.status = AuthStatus.unknown,
    this.user,
    this.errorMessage,
  });

  final AuthStatus status;
  final AuthUser? user;
  final String? errorMessage;

  AuthState copyWith({
    AuthStatus? status,
    AuthUser? user,
    String? errorMessage,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      errorMessage: errorMessage,
    );
  }

  @override
  List<Object?> get props => [status, user, errorMessage];
}
