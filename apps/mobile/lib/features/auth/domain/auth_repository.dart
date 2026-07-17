import 'package:app_mobile/features/auth/domain/auth_user.dart';

/// Port — auth operations.  Implementations live in `data/`.
abstract class AuthRepository {
  /// Authenticate with email + password. Returns the authenticated user.
  /// Throws on failure.
  Future<AuthUser> signIn({required String email, required String password});

  /// Register a new account. Returns the created user.
  /// Throws on failure.
  Future<AuthUser> signUp({
    required String name,
    required String email,
    required String password,
  });

  /// Sign out the current session; clears the stored bearer token.
  Future<void> signOut();

  /// Fetch the current session. Returns null when no valid session exists.
  Future<AuthUser?> getSession();
}
