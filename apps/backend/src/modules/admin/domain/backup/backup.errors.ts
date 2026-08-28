/**
 * WHY this file exists:
 * Failure modes of the backup flow, as typed DomainError subclasses so
 * HttpExceptionFilter maps them to RFC 9457 problem details with no branching
 * in the controller.
 *
 * Two families:
 *   - BackupTokenInvalidError (401) — the download link is not acceptable.
 *     Mirrors StreamTokenInvalidError, including its rule that a detail message
 *     never echoes the offending token: an attacker must not learn which byte
 *     they got wrong.
 *   - BackupUnavailableError (503) — the archive could not be produced. 503
 *     rather than 500 because every case is an environment problem the operator
 *     can fix (missing binary, version skew, timeout), and retrying after that
 *     fix is the correct client behaviour.
 */
import { DomainError, NotFound } from '../../../../shared/domain-error';

/** Base class for backup download-token failures. */
export class BackupTokenInvalidError extends DomainError {
  constructor(detail: string, code = 'backup-token-invalid') {
    super({ code, status: 401, title: 'Backup token invalid', detail });
    this.name = 'BackupTokenInvalidError';
  }
}

/** The HMAC signature does not match the header + payload. */
export class BackupTokenTamperedError extends BackupTokenInvalidError {
  constructor() {
    super('Token signature does not match.', 'backup-token-tampered');
    this.name = 'BackupTokenTamperedError';
  }
}

/** The token's exp claim is in the past. */
export class BackupTokenExpiredError extends BackupTokenInvalidError {
  constructor() {
    super('Token has expired.', 'backup-token-expired');
    this.name = 'BackupTokenExpiredError';
  }
}

/** The token was issued for a different archive than the one requested. */
export class BackupTokenMismatchError extends BackupTokenInvalidError {
  constructor() {
    super('Token was issued for a different backup.', 'backup-token-mismatch');
    this.name = 'BackupTokenMismatchError';
  }
}

/**
 * A token from another family (a stream or material token) was presented here.
 * Fail-closed — in practice the HKDF info string already makes this
 * unreachable, since the signature will not verify under the backup subkey.
 * The check stays as defence in depth in case the two ever share a key.
 */
export class BackupTokenScopeMismatchError extends BackupTokenInvalidError {
  constructor() {
    super('Token scope does not match the requested resource type.', 'backup-token-scope-mismatch');
    this.name = 'BackupTokenScopeMismatchError';
  }
}

/** Structurally invalid token (wrong part count, bad base64, bad JSON). */
export class BackupTokenMalformedError extends BackupTokenInvalidError {
  constructor() {
    super('Token is malformed.', 'backup-token-malformed');
    this.name = 'BackupTokenMalformedError';
  }
}

/**
 * The archive could not be produced. Detail names the operator-fixable cause.
 * Never carries the database URL or any pg_dump stderr verbatim — connection
 * strings carry credentials.
 */
export class BackupUnavailableError extends DomainError {
  constructor(detail: string, code = 'backup-unavailable') {
    super({ code, status: 503, title: 'Service Unavailable', detail });
    this.name = 'BackupUnavailableError';
  }
}

/**
 * `pg_dump` refuses to dump a server newer than itself, and a mismatched dump
 * is worse than no dump: it fails at restore time, long after the operator
 * stopped watching. Checked before the dump runs so nothing is written.
 */
export class BackupVersionMismatchError extends BackupUnavailableError {
  constructor(clientVersion: string, serverVersion: string) {
    super(
      `pg_dump ${clientVersion} cannot dump PostgreSQL server ${serverVersion} — the client major version must match.`,
      'backup-version-mismatch',
    );
    this.name = 'BackupVersionMismatchError';
  }
}

/** `pg_dump` is not on PATH and PG_DUMP_PATH does not point at it either. */
export class BackupToolMissingError extends BackupUnavailableError {
  constructor(pgDumpPath: string) {
    super(
      `pg_dump was not found at "${pgDumpPath}". Install postgresql-client in the backend image or set PG_DUMP_PATH.`,
      'backup-tool-missing',
    );
    this.name = 'BackupToolMissingError';
  }
}

/** Requested archive is not in the backup directory (deleted, or never existed). */
export class BackupNotFoundError extends NotFound {
  constructor(id: string) {
    super(`Backup "${id}" is no longer available.`, 'backup-not-found');
    this.name = 'BackupNotFoundError';
  }
}
