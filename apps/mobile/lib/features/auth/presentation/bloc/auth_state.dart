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
    this.errorCode,
    this.retryAfterSeconds,
    this.statusCode,
  });

  final AuthStatus status;
  final AuthUser? user;
  final String? errorMessage;

  /// Better Auth's machine code for the last failure, when it had one — see
  /// `AuthErrorCodes`. Lets a screen distinguish "wrong password" from "server
  /// exploded" without matching on message text.
  final String? errorCode;

  /// Seconds to wait after a 429, when the server sent `Retry-After`. Drives
  /// the sign-in rate-limit banner's countdown.
  final int? retryAfterSeconds;

  /// HTTP status of the last failure. 429 is what marks a rate-limit — the
  /// server may omit `Retry-After`, so [retryAfterSeconds] alone cannot detect it.
  final int? statusCode;

  AuthState copyWith({
    AuthStatus? status,
    AuthUser? user,
    String? errorMessage,
    String? errorCode,
    int? retryAfterSeconds,
    int? statusCode,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      // Error detail is cleared by omission: every emit restates it, so a
      // success never leaves the previous failure's code behind.
      errorMessage: errorMessage,
      errorCode: errorCode,
      retryAfterSeconds: retryAfterSeconds,
      statusCode: statusCode,
    );
  }

  @override
  List<Object?> get props => [
    status,
    user,
    errorMessage,
    errorCode,
    retryAfterSeconds,
    statusCode,
  ];
}
