/**
 * WHY this file exists:
 * All failure modes of StreamTokenSigner.verify() surface as typed subclasses
 * of StreamTokenInvalidError so HttpExceptionFilter can map them to 401 responses
 * and the handler can distinguish them for logging purposes.
 *
 * Crucially, detail messages never echo back the offending token value — an
 * attacker must not learn which byte they got wrong.
 */
import { DomainError } from '../../../../shared/domain-error';

/** Base class for all token-verification failures. Status 401 — a fresh token
 * can be requested after re-authentication, so 401 is semantically correct. */
export class StreamTokenInvalidError extends DomainError {
  constructor(detail: string, code = 'stream-token-invalid') {
    super({ code, status: 401, title: 'Stream token invalid', detail });
    this.name = 'StreamTokenInvalidError';
  }
}

/** The HMAC signature does not match the header + payload. */
export class StreamTokenTamperedError extends StreamTokenInvalidError {
  constructor() {
    super('Token signature does not match.', 'stream-token-tampered');
    this.name = 'StreamTokenTamperedError';
  }
}

/** The token's exp claim is in the past. */
export class StreamTokenExpiredError extends StreamTokenInvalidError {
  constructor() {
    super('Token has expired.', 'stream-token-expired');
    this.name = 'StreamTokenExpiredError';
  }
}

/** The token was issued for a different lesson than the one being accessed. */
export class StreamTokenLessonMismatchError extends StreamTokenInvalidError {
  constructor() {
    super('Token was issued for a different lesson.', 'stream-token-lesson-mismatch');
    this.name = 'StreamTokenLessonMismatchError';
  }
}

/** The token was issued for a different material than the one being accessed. */
export class StreamTokenMaterialMismatchError extends StreamTokenInvalidError {
  constructor() {
    super('Token was issued for a different material.', 'stream-token-material-mismatch');
    this.name = 'StreamTokenMaterialMismatchError';
  }
}

/**
 * A lesson-scoped token was presented on a material endpoint (or vice-versa).
 * Fail-closed: scope mismatch is treated as an invalid token.
 */
export class StreamTokenScopeMismatchError extends StreamTokenInvalidError {
  constructor() {
    super('Token scope does not match the requested resource type.', 'stream-token-scope-mismatch');
    this.name = 'StreamTokenScopeMismatchError';
  }
}

/** The token string is structurally invalid (wrong part count, bad base64, etc.). */
export class StreamTokenMalformedError extends StreamTokenInvalidError {
  constructor() {
    super('Token is malformed.', 'stream-token-malformed');
    this.name = 'StreamTokenMalformedError';
  }
}
