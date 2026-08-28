/**
 * Unit tests for BackupTokenSigner.
 *
 *   1.  Happy round-trip — sign then verify returns the minting admin's id.
 *   2.  Tamper: flipped payload byte → BackupTokenTamperedError.
 *   3.  Tamper: flipped signature byte → BackupTokenTamperedError.
 *   4.  Expired token → BackupTokenExpiredError.
 *   5.  Wrong archive id → BackupTokenMismatchError.
 *   6.  Malformed: empty string → BackupTokenMalformedError.
 *   7.  Malformed: two segments → BackupTokenMalformedError.
 *   8.  Malformed: valid signature over non-JSON payload → BackupTokenMalformedError.
 *   9.  Malformed: valid signature over JSON missing claims → BackupTokenMalformedError.
 *   10. Scope: correctly signed token carrying scp != "backup" →
 *       BackupTokenScopeMismatchError.
 *   11. HKDF determinism — same secret + info produce the same signature.
 *   12. **Key separation** — a signer using the streaming info string cannot
 *       produce a token this one accepts. This is the property that makes a
 *       second signer safe to have; if it ever breaks, a stream token becomes a
 *       database download.
 *   13. expiresAt matches the exp claim.
 */
import { createHmac, hkdfSync } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppConfig } from '../../../../common/config/app-config';
import {
  BackupTokenExpiredError,
  BackupTokenMalformedError,
  BackupTokenMismatchError,
  BackupTokenScopeMismatchError,
  BackupTokenTamperedError,
} from './backup.errors';
import { BackupTokenSigner } from './backup-token-signer';

const BACKUP_ID = '20260829T014500-3f9a2c1b8e7d4a6f';
const USER_ID = 'usr_admin_1';

function makeConfig(secret = 'test-secret', hkdfInfo = 'courseshelf:backup-token:v1'): AppConfig {
  return {
    backups: { secret, hkdfInfo, ttlSeconds: 300 },
  } as unknown as AppConfig;
}

/** Mint a structurally valid token with an arbitrary payload, correctly signed. */
function forgeSignedToken(payload: unknown, secret: string, info: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'BKP', v: 1 }), 'utf8').toString(
    'base64url',
  );
  const body =
    typeof payload === 'string'
      ? Buffer.from(payload, 'utf8').toString('base64url')
      : Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const subkey = Buffer.from(
    hkdfSync('sha256', Buffer.from(secret, 'utf8'), Buffer.alloc(0), info, 32),
  );
  const sig = createHmac('sha256', subkey).update(`${header}.${body}`, 'utf8').digest('base64url');
  return `${header}.${body}.${sig}`;
}

function flipLastChar(segment: string): string {
  const last = segment.at(-1);
  return segment.slice(0, -1) + (last === 'A' ? 'B' : 'A');
}

describe('BackupTokenSigner', () => {
  let signer: BackupTokenSigner;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-29T01:45:00Z'));
    signer = new BackupTokenSigner(makeConfig());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('round-trips a signed token', () => {
    const { token } = signer.sign({ userId: USER_ID, backupId: BACKUP_ID, ttlSeconds: 300 });
    expect(signer.verify(token, BACKUP_ID).userId).toBe(USER_ID);
  });

  it('reports expiresAt matching the exp claim', () => {
    const { token, expiresAt } = signer.sign({
      userId: USER_ID,
      backupId: BACKUP_ID,
      ttlSeconds: 300,
    });
    expect(expiresAt.toISOString()).toBe('2026-08-29T01:50:00.000Z');
    expect(signer.verify(token, BACKUP_ID).expiresAt).toEqual(expiresAt);
  });

  it('rejects a tampered payload', () => {
    const { token } = signer.sign({ userId: USER_ID, backupId: BACKUP_ID, ttlSeconds: 300 });
    const [h, p, s] = token.split('.') as [string, string, string];
    expect(() => signer.verify(`${h}.${flipLastChar(p)}.${s}`, BACKUP_ID)).toThrow(
      BackupTokenTamperedError,
    );
  });

  it('rejects a tampered signature', () => {
    const { token } = signer.sign({ userId: USER_ID, backupId: BACKUP_ID, ttlSeconds: 300 });
    const [h, p, s] = token.split('.') as [string, string, string];
    expect(() => signer.verify(`${h}.${p}.${flipLastChar(s)}`, BACKUP_ID)).toThrow(
      BackupTokenTamperedError,
    );
  });

  it('rejects an expired token', () => {
    const { token } = signer.sign({ userId: USER_ID, backupId: BACKUP_ID, ttlSeconds: 300 });
    vi.setSystemTime(new Date('2026-08-29T01:50:01Z'));
    expect(() => signer.verify(token, BACKUP_ID)).toThrow(BackupTokenExpiredError);
  });

  it('rejects a token minted for another archive', () => {
    const { token } = signer.sign({ userId: USER_ID, backupId: BACKUP_ID, ttlSeconds: 300 });
    expect(() => signer.verify(token, '20260829T014500-0000000000000000')).toThrow(
      BackupTokenMismatchError,
    );
  });

  it.each([
    ['empty string', ''],
    ['two segments', 'aaa.bbb'],
    ['four segments', 'a.b.c.d'],
  ])('rejects a malformed token (%s)', (_label, token) => {
    expect(() => signer.verify(token, BACKUP_ID)).toThrow(BackupTokenMalformedError);
  });

  it('rejects a correctly signed token whose payload is not JSON', () => {
    const token = forgeSignedToken('not json at all', 'test-secret', 'courseshelf:backup-token:v1');
    expect(() => signer.verify(token, BACKUP_ID)).toThrow(BackupTokenMalformedError);
  });

  it('rejects a correctly signed token missing required claims', () => {
    const token = forgeSignedToken(
      { scp: 'backup', bid: BACKUP_ID },
      'test-secret',
      'courseshelf:backup-token:v1',
    );
    expect(() => signer.verify(token, BACKUP_ID)).toThrow(BackupTokenMalformedError);
  });

  it('rejects a correctly signed token carrying a foreign scope', () => {
    const token = forgeSignedToken(
      { sub: USER_ID, bid: BACKUP_ID, scp: 'lesson', exp: 9_999_999_999, iat: 1 },
      'test-secret',
      'courseshelf:backup-token:v1',
    );
    expect(() => signer.verify(token, BACKUP_ID)).toThrow(BackupTokenScopeMismatchError);
  });

  it('derives the same subkey from the same secret and info', () => {
    const a = new BackupTokenSigner(makeConfig());
    const b = new BackupTokenSigner(makeConfig());
    const tokenA = a.sign({ userId: USER_ID, backupId: BACKUP_ID, ttlSeconds: 300 }).token;
    const tokenB = b.sign({ userId: USER_ID, backupId: BACKUP_ID, ttlSeconds: 300 }).token;
    expect(tokenA).toBe(tokenB);
  });

  it('does not accept a token signed under the streaming HKDF info', () => {
    // Same secret, same payload shape, only the info string differs — this is
    // exactly what a replayed stream token would look like if the subkeys were
    // shared.
    const token = forgeSignedToken(
      { sub: USER_ID, bid: BACKUP_ID, scp: 'backup', exp: 9_999_999_999, iat: 1 },
      'test-secret',
      'courseshelf:stream-token:v1',
    );
    expect(() => signer.verify(token, BACKUP_ID)).toThrow(BackupTokenTamperedError);
  });
});
