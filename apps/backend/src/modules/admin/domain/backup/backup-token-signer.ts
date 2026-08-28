/**
 * WHY this file exists:
 * Mints and verifies the short-lived token that authorises a backup download.
 * Pure domain service — no DB, no HTTP exceptions; the caller decides how a
 * verification failure surfaces.
 *
 * WHY it is not StreamTokenSigner:
 * That signer lives in the streaming bounded context and knows two scopes
 * (lesson, material) tied to lesson/material ids. An admin database archive is
 * neither. Extending it would put an admin concern inside streaming; refactoring
 * it into a shared generic would mean editing a live, well-tested security path
 * for the benefit of one new caller. This is a third, independent signer that
 * shares the *shape* but not the code, and — critically — not the key.
 *
 * Key separation is the point. Both signers use HKDF-SHA256 over
 * BETTER_AUTH_SECRET, but with different `info` strings
 * ("courseshelf:backup-token:v1" vs "courseshelf:stream-token:v1"), so the
 * derived subkeys are unrelated. A stream token presented here fails the
 * signature check; it never reaches the scope check.
 *
 * Token format: <base64url(header)>.<base64url(payload)>.<base64url(hmacSha256)>
 *   header  = { alg: "HS256", typ: "BKP", v: 1 }
 *             typ:"BKP" distinguishes it from the streaming "STK" tokens and
 *             from Centrifugo JWTs in the same process.
 *   payload = { sub: adminUserId, bid: backupId, scp: "backup", exp, iat }
 *
 * `sub` is recorded so a leaked link is attributable to the admin who minted it.
 * It is not re-checked at download time: the token *is* the capability, exactly
 * as for material downloads, because the browser cannot send a session header
 * on a plain `<a href download>`.
 */
import { createHmac, hkdfSync, timingSafeEqual } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { AppConfig } from '../../../../common/config/app-config';
import {
  BackupTokenExpiredError,
  BackupTokenMalformedError,
  BackupTokenMismatchError,
  BackupTokenScopeMismatchError,
  BackupTokenTamperedError,
} from './backup.errors';

interface TokenHeader {
  alg: 'HS256';
  typ: 'BKP';
  v: 1;
}

interface BackupTokenPayload {
  sub: string;
  bid: string;
  scp: 'backup';
  exp: number;
  iat: number;
}

export interface SignResult {
  token: string;
  expiresAt: Date;
}

export interface VerifyResult {
  /** The admin who minted the link. */
  userId: string;
  expiresAt: Date;
}

const HEADER: TokenHeader = { alg: 'HS256', typ: 'BKP', v: 1 };
const ENCODED_HEADER = Buffer.from(JSON.stringify(HEADER), 'utf8').toString('base64url');

@Injectable()
export class BackupTokenSigner {
  /** Lazily derived and cached — HKDF is cheap but not free. */
  private _subkey: Buffer | null = null;

  constructor(private readonly config: AppConfig) {}

  private get subkey(): Buffer {
    if (!this._subkey) {
      const { secret, hkdfInfo } = this.config.backups;
      // Empty salt, matching StreamTokenSigner: the payload already binds the
      // user and the archive, so per-token entropy would add nothing.
      this._subkey = Buffer.from(
        hkdfSync('sha256', Buffer.from(secret, 'utf8'), Buffer.alloc(0), hkdfInfo, 32),
      );
    }
    return this._subkey;
  }

  sign({
    userId,
    backupId,
    ttlSeconds,
  }: {
    userId: string;
    backupId: string;
    ttlSeconds: number;
  }): SignResult {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + ttlSeconds;

    const payload: BackupTokenPayload = {
      sub: userId,
      bid: backupId,
      scp: 'backup',
      exp,
      iat: now,
    };
    const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    const signingInput = `${ENCODED_HEADER}.${encodedPayload}`;
    const sig = this.hmac(signingInput).toString('base64url');

    return { token: `${signingInput}.${sig}`, expiresAt: new Date(exp * 1000) };
  }

  /** Verify a token against the archive it is being presented for. */
  verify(token: string, expectedBackupId: string): VerifyResult {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new BackupTokenMalformedError();
    }
    const [rawHeader, rawPayload, rawSig] = parts as [string, string, string];

    // Signature first: never parse attacker-controlled JSON we have not
    // authenticated, and compare in constant time.
    const expectedSig = this.hmac(`${rawHeader}.${rawPayload}`);
    const actualSig = Buffer.from(rawSig, 'base64url');
    if (actualSig.length !== expectedSig.length || !timingSafeEqual(actualSig, expectedSig)) {
      throw new BackupTokenTamperedError();
    }

    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(Buffer.from(rawPayload, 'base64url').toString('utf8')) as Record<
        string,
        unknown
      >;
    } catch {
      throw new BackupTokenMalformedError();
    }

    if (raw['scp'] !== 'backup') {
      throw new BackupTokenScopeMismatchError();
    }

    const payload = raw as unknown as BackupTokenPayload;
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.bid !== 'string' ||
      typeof payload.exp !== 'number' ||
      typeof payload.iat !== 'number'
    ) {
      throw new BackupTokenMalformedError();
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new BackupTokenExpiredError();
    }

    if (payload.bid !== expectedBackupId) {
      throw new BackupTokenMismatchError();
    }

    return { userId: payload.sub, expiresAt: new Date(payload.exp * 1000) };
  }

  private hmac(input: string): Buffer {
    return createHmac('sha256', this.subkey).update(input, 'utf8').digest();
  }
}
