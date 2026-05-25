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
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];
