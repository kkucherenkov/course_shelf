/**
 * WHY this file exists:
 * Pure domain service that mints and verifies compact signed stream tokens.
 * No DB lookup, no NestJS HTTP exceptions — callers (application handlers)
 * decide how to surface verification failures.
 *
 * Token format: <base64url(header)>.<base64url(payload)>.<base64url(hmacSha256)>
 *
 *   header  = { alg: "HS256", typ: "STK", v: 1 }
 *             typ:"STK" disambiguates from Centrifugo JWTs and Better Auth tokens
 *             in the same process.
 *   payload = { sub: userId, lid: lessonId, exp: unixSec, iat: unixSec }
 *   sig     = HMAC-SHA256(subkey, base64url(header) + "." + base64url(payload))
 *
 * Subkey derivation:
 *   HKDF-SHA256(ikm: BETTER_AUTH_SECRET, salt: empty, info: configurable, length: 32)
 *   Empty salt is intentional — the token already binds the user (sub) and the
 *   lesson (lid), so per-token entropy would only shift load without adding
 *   security. HKDF gives us a clean subkey rotation hook for v2 (change info).
 *   The derived subkey is cached on first use to avoid re-deriving on every
 *   sign/verify call under load.
 *
 * verify() uses crypto.timingSafeEqual to prevent timing-based signature
 * oracle attacks.
 */
import { createHmac, hkdfSync, timingSafeEqual } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { AppConfig } from '../../../../common/config/app-config';
import {
  StreamTokenExpiredError,
  StreamTokenLessonMismatchError,
  StreamTokenMalformedError,
  StreamTokenTamperedError,
} from './stream-token.errors';

interface TokenHeader {
  alg: 'HS256';
  typ: 'STK';
  v: 1;
}

interface TokenPayload {
  sub: string;
  lid: string;
  exp: number;
  iat: number;
}

export interface SignResult {
  token: string;
  expiresAt: Date;
}

export interface VerifyResult {
  userId: string;
  expiresAt: Date;
}

const HEADER: TokenHeader = { alg: 'HS256', typ: 'STK', v: 1 };
const ENCODED_HEADER = base64urlEncode(JSON.stringify(HEADER));

function base64urlEncode(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64url');
}

function base64urlDecode(input: string): Buffer {
  return Buffer.from(input, 'base64url');
}

@Injectable()
export class StreamTokenSigner {
  /** Lazily derived and cached — HKDF is cheap but non-trivial under high RPS. */
  private _subkey: Buffer | null = null;

  constructor(private readonly config: AppConfig) {}

  private get subkey(): Buffer {
    if (!this._subkey) {
      const { secret, hkdfInfo } = this.config.streaming;
      const ikm = Buffer.from(secret, 'utf8');
      // Salt is intentionally empty — see module docblock.
      const salt = Buffer.alloc(0);
      this._subkey = Buffer.from(hkdfSync('sha256', ikm, salt, hkdfInfo, 32));
    }
    return this._subkey;
  }

  sign({
    userId,
    lessonId,
    ttlSeconds,
  }: {
    userId: string;
    lessonId: string;
    ttlSeconds: number;
  }): SignResult {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + ttlSeconds;

    const payload: TokenPayload = { sub: userId, lid: lessonId, exp, iat: now };
    const encodedPayload = base64urlEncode(JSON.stringify(payload));
    const signingInput = `${ENCODED_HEADER}.${encodedPayload}`;
    const sig = base64urlEncode(this.hmac(signingInput));

    return {
      token: `${signingInput}.${sig}`,
      expiresAt: new Date(exp * 1000),
    };
  }

  verify(token: string, expectedLessonId: string): VerifyResult {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new StreamTokenMalformedError();
    }

    const [rawHeader, rawPayload, rawSig] = parts as [string, string, string];

    // Verify signature before parsing payload (fail-fast + timing-safe).
    const signingInput = `${rawHeader}.${rawPayload}`;
    const expectedSig = this.hmac(signingInput);
    let actualSigBuf: Buffer;
    try {
      actualSigBuf = base64urlDecode(rawSig);
    } catch {
      throw new StreamTokenMalformedError();
    }

    if (actualSigBuf.length !== expectedSig.length || !timingSafeEqual(actualSigBuf, expectedSig)) {
      throw new StreamTokenTamperedError();
    }

    // Parse payload — only after signature is verified.
    let payload: TokenPayload;
    try {
      const raw = base64urlDecode(rawPayload).toString('utf8');
      payload = JSON.parse(raw) as TokenPayload;
    } catch {
      throw new StreamTokenMalformedError();
    }

    if (
      typeof payload.sub !== 'string' ||
      typeof payload.lid !== 'string' ||
      typeof payload.exp !== 'number' ||
      typeof payload.iat !== 'number'
    ) {
      throw new StreamTokenMalformedError();
    }

    // Check expiry.
    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp <= nowSec) {
      throw new StreamTokenExpiredError();
    }

    // Check lesson binding.
    if (payload.lid !== expectedLessonId) {
      throw new StreamTokenLessonMismatchError();
    }

    return {
      userId: payload.sub,
      expiresAt: new Date(payload.exp * 1000),
    };
  }

  private hmac(input: string): Buffer {
    return createHmac('sha256', this.subkey).update(input, 'utf8').digest();
  }
}
