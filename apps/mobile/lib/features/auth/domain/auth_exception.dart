/// Stable machine error codes emitted by Better Auth (`BASE_ERROR_CODES`).
///
/// Dart twin of `apps/web/app/constants/authErrorCodes.ts`. Better Auth
/// attaches a `code` (the SCREAMING_SNAKE key) alongside the human-readable
/// `message` on every known error; matching on `code` is robust against message
/// wording and locale changes, unlike substring-matching `message`.
abstract class AuthErrorCodes {
  /// Sign-in: wrong email/password.
  static const invalidCredentials = 'INVALID_EMAIL_OR_PASSWORD';

  /// Sign-up: the email is already registered.
  static const userAlreadyExists = 'USER_ALREADY_EXISTS';

  /// Password reset: the server has no `emailAndPassword.sendResetPassword`
  /// configured, so Better Auth refuses the request outright. This is the
  /// current state of `apps/backend` — see [ForgotCubit].
  static const resetPasswordDisabled = 'RESET_PASSWORD_DISABLED';
}

/// A Better Auth failure carrying its machine [code].
///
/// Raised by the `data/` layer so that `presentation/` can branch on a code
/// without importing Dio or parsing response bodies. Only the paths where a
/// code actually changes the UI throw this — `getSession` and `signOut` keep
/// their original Dio-level behaviour.
class AuthException implements Exception {
  const AuthException({
    this.code,
    this.message,
    this.statusCode,
    this.retryAfterSeconds,
  });

  /// Better Auth's `code`, e.g. [AuthErrorCodes.userAlreadyExists]. Null when
  /// the failure carried no recognisable code (network error, 5xx, HTML body).
  final String? code;

  final String? message;

  /// HTTP status. 429 drives the sign-in rate-limit banner.
  final int? statusCode;

  /// Seconds from the `Retry-After` response header on a 429. Null when the
  /// server sent none — web falls back to 60 at the call site.
  final int? retryAfterSeconds;

  @override
  String toString() =>
      'AuthException(${code ?? 'unknown'}): ${message ?? 'no message'}';
}
