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

  /// Ask the server to email a password-reset link (Better Auth
  /// `POST /request-password-reset`).
  ///
  /// Enumeration-safe by design: Better Auth answers `{status: true}` whether
  /// or not the address exists, so a success here says nothing about the
  /// account. It *does* throw when the server has no `sendResetPassword`
  /// configured (`RESET_PASSWORD_DISABLED`) — see [ForgotCubit] for why that
  /// case surfaces to the user instead of being swallowed.
  Future<void> requestPasswordReset({required String email});

  /// Complete a password reset with the token from the emailed link
  /// (Better Auth `POST /reset-password`). Throws on an expired/invalid token.
  Future<void> resetPassword({
    required String token,
    required String newPassword,
  });

  /// Verify an address with the 6-digit code from the sign-up email
  /// (Better Auth `POST /email-otp/verify-email`). Throws on a wrong/expired
  /// code.
  ///
  /// Only reachable when `instance.emailVerificationRequired` is true, which v1
  /// ships false — and the endpoint requires the Better Auth `emailOTP` plugin,
  /// which the backend does not currently enable. See [AuthApiImpl.verifyEmail].
  Future<void> verifyEmail({required String email, required String code});
}
