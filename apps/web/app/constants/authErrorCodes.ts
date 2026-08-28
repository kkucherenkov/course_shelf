/**
 * Stable machine error codes emitted by Better Auth (`BASE_ERROR_CODES`).
 *
 * Better Auth attaches a `code` (the SCREAMING_SNAKE key, e.g.
 * `USER_ALREADY_EXISTS`) alongside the human-readable `message` on every known
 * error. Matching on `code` is robust against message wording/locale changes,
 * unlike substring matching on `message`.
 */
export const AUTH_ERROR_CODES = {
  /** Sign-in: wrong email/password (Better Auth `INVALID_EMAIL_OR_PASSWORD`). */
  INVALID_CREDENTIALS: 'INVALID_EMAIL_OR_PASSWORD',
  /** Sign-up: the email is already registered. */
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  /** Change-password: the supplied current password is wrong. */
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  /** Email verification: the 6-digit code does not match (emailOTP plugin). */
  INVALID_OTP: 'INVALID_OTP',
  /** Email verification: the code was right but has aged out. */
  OTP_EXPIRED: 'OTP_EXPIRED',
  /** Email verification: too many wrong codes; the OTP is now spent. */
  TOO_MANY_ATTEMPTS: 'TOO_MANY_ATTEMPTS',
  /** Password reset: the `?token=` from the emailed link is not valid. */
  INVALID_TOKEN: 'INVALID_TOKEN',
  /** Password reset: the link was valid but has expired. */
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];
