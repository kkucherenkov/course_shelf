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
 *   payload (lesson)   = { sub: userId, lid: lessonId,                scp: "lesson",   exp, iat }
 *   payload (material) = { sub: userId, lid: lessonId, mid: materialId, scp: "material", exp, iat }
 *   sig     = HMAC-SHA256(subkey, base64url(header) + "." + base64url(payload))
 *
 * Why `lid` is included in the material payload:
 *   The binary streaming endpoint GET /stream/materials/:materialId receives only
 *   the materialId in the URL. To locate the file it must also know the lessonId
 *   (LessonFileLocator.locateMaterial needs both). Encoding `lid` in the token
 *   avoids an extra DB join at serve time and removes the need for a new
 *   findByMaterialId repository method.
 *
 * The `scp` (scope) claim ensures a lesson token can never be replayed on a
 * material endpoint and vice-versa (fail-closed). Tokens issued before this
 * field was added carry no `scp`; verify() rejects them (missing scp ≠ "lesson").
 *
 * Subkey derivation:
 *   HKDF-SHA256(ikm: BETTER_AUTH_SECRET, salt: empty, info: configurable, length: 32)
 *   Empty salt is intentional — the token already binds the user (sub) and the
 *   resource (lid / mid), so per-token entropy would only shift load without adding
 *   security. HKDF gives us a clean subkey rotation hook for v2 (change info).
 *   The derived subkey is cached on first use to avoid re-deriving on every
 *   sign/verify call under load.
 *
 * verify() and verifyMaterial() use crypto.timingSafeEqual to prevent
 * timing-based signature oracle attacks.
 */
import { createHmac, hkdfSync, timingSafeEqual } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { AppConfig } from '../../../../common/config/app-config';
import {
  StreamTokenExpiredError,
  StreamTokenLessonMismatchError,
  StreamTokenMalformedError,
  StreamTokenMaterialMismatchError,
  StreamTokenScopeMismatchError,
  StreamTokenTamperedError,
} from './stream-token.errors';

interface TokenHeader {
  alg: 'HS256';
  typ: 'STK';
  v: 1;
}

/** Lesson-scoped token payload. */
interface LessonTokenPayload {
  sub: string;
  lid: string;
  scp: 'lesson';
  exp: number;
  iat: number;
}

/**
 * Material-scoped token payload.
 * Includes `lid` (lessonId) so the streaming endpoint can call
 * locateMaterial(lessonId, materialId) without an additional DB query.
 */
interface MaterialTokenPayload {
  sub: string;
  lid: string;
  mid: string;
  scp: 'material';
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

/** Extended result for material token verification — includes lessonId. */
export interface VerifyMaterialResult extends VerifyResult {
  lessonId: string;
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

  /** Mint a short-lived token bound to `lessonId` with scope "lesson". */
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

    const payload: LessonTokenPayload = {
      sub: userId,
      lid: lessonId,
      scp: 'lesson',
      exp,
      iat: now,
    };
    const encodedPayload = base64urlEncode(JSON.stringify(payload));
    const signingInput = `${ENCODED_HEADER}.${encodedPayload}`;
    const sig = base64urlEncode(this.hmac(signingInput));

    return {
      token: `${signingInput}.${sig}`,
      expiresAt: new Date(exp * 1000),
    };
  }

  /**
   * Mint a short-lived token bound to both `materialId` and its parent
   * `lessonId`. The `lessonId` is embedded so the streaming endpoint can call
   * locateMaterial(lessonId, materialId) without an extra DB query.
   */
  signMaterial({
    userId,
    lessonId,
    materialId,
    ttlSeconds,
  }: {
    userId: string;
    lessonId: string;
    materialId: string;
    ttlSeconds: number;
  }): SignResult {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + ttlSeconds;

    const payload: MaterialTokenPayload = {
      sub: userId,
      lid: lessonId,
      mid: materialId,
      scp: 'material',
      exp,
      iat: now,
    };
    const encodedPayload = base64urlEncode(JSON.stringify(payload));
    const signingInput = `${ENCODED_HEADER}.${encodedPayload}`;
    const sig = base64urlEncode(this.hmac(signingInput));

    return {
      token: `${signingInput}.${sig}`,
      expiresAt: new Date(exp * 1000),
    };
  }

  /**
   * Verify a lesson-scoped token.
   * Throws StreamTokenScopeMismatchError if the token carries scp != "lesson".
   */
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

    // Parse as a loose object first so we can check scp before the full
    // structural validation — this ensures scope mismatch (e.g. a material token
    // presented to verify) surfaces as StreamTokenScopeMismatchError rather than
    // StreamTokenMalformedError.
    let rawObj: Record<string, unknown>;
    try {
      const raw = base64urlDecode(rawPayload).toString('utf8');
      rawObj = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new StreamTokenMalformedError();
    }

    // Reject tokens that carry a different scope (e.g. material tokens).
    // Missing scp is also rejected — tokens issued before scope was added must
    // not be accepted (fail-closed).
    if (rawObj['scp'] !== 'lesson') {
      throw new StreamTokenScopeMismatchError();
    }

    // Full structural validation.
    const payload = rawObj as unknown as LessonTokenPayload;
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

  /**
   * Verify a material-scoped token and return the embedded lessonId.
   * Throws StreamTokenScopeMismatchError if the token carries scp != "material".
   */
  verifyMaterial(token: string, expectedMaterialId: string): VerifyMaterialResult {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new StreamTokenMalformedError();
    }

    const [rawHeader, rawPayload, rawSig] = parts as [string, string, string];

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

    // Parse as a loose object first so we can check scp before the full
    // structural validation — this ensures scope mismatch (e.g. a lesson token
    // presented to verifyMaterial) surfaces as StreamTokenScopeMismatchError
    // rather than StreamTokenMalformedError (lesson tokens have no `mid`).
    let rawObj: Record<string, unknown>;
    try {
      const raw = base64urlDecode(rawPayload).toString('utf8');
      rawObj = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new StreamTokenMalformedError();
    }

    // Reject tokens that carry a different scope (e.g. lesson tokens).
    if (rawObj['scp'] !== 'material') {
      throw new StreamTokenScopeMismatchError();
    }

    // Now perform the full structural validation.
    const payload = rawObj as unknown as MaterialTokenPayload;
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.lid !== 'string' ||
      typeof payload.mid !== 'string' ||
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

    // Check material binding.
    if (payload.mid !== expectedMaterialId) {
      throw new StreamTokenMaterialMismatchError();
    }

    return {
      userId: payload.sub,
      lessonId: payload.lid,
      expiresAt: new Date(payload.exp * 1000),
    };
  }

  private hmac(input: string): Buffer {
    return createHmac('sha256', this.subkey).update(input, 'utf8').digest();
  }
}
