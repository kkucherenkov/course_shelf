import 'package:equatable/equatable.dart';

import 'package:app_mobile/features/auth/domain/auth_user.dart';

enum AuthStatus { unauthenticated, authenticating, authenticated, otpSent, error }

class AuthState extends Equatable {
  const AuthState({
    this.status = AuthStatus.unauthenticated,
    this.user,
    this.errorMessage,
    this.phone,
  });

  final AuthStatus status;
  final AuthUser? user;
  final String? errorMessage;
  final String? phone;

  AuthState copyWith({
    AuthStatus? status,
    AuthUser? user,
    String? errorMessage,
    String? phone,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      errorMessage: errorMessage,
      phone: phone ?? this.phone,
    );
  }

  @override
  List<Object?> get props => [status, user, errorMessage, phone];
}
