/**
 * WHY this file exists:
 * Mints and verifies the short-lived signed token that lets an `<img>` tag
 * load `GET /courses/:id/poster` (#496) without an Authorization header —
 * the web app attaches auth as a Bearer header via JS (see api.client.ts),
 * which a native `src=` attribute cannot do. Same problem, same shape of fix
 * as streaming's StreamTokenSigner (video/subtitle/material); this is its own
 * class, not an added scope there, because it lives in a different bounded
 * context (catalog owns Course) and streaming must not import catalog.
 *
 * Deliberately NOT bound to a userId, unlike StreamTokenSigner. A poster is
 * not per-viewer content: anyone who could see the course when the token was
 * minted may reuse the same URL for the token's remaining lifetime. That is a
 * narrower guarantee, acceptable because a leaked poster URL exposes a
 * low-res cover image already public on the course's original site — not the
 * course content itself. The token is embedded directly in every CourseDto a
 * list/get query returns (no separate "issue" round trip per poster), so
 * minting it must be cheap and DB-free — it is, since verification never
 * touches a repository.
 *
 * Token format mirrors StreamTokenSigner:
 *   <base64url(header)>.<base64url(payload)>.<base64url(hmacSha256)>
 *   header  = { alg: "HS256", typ: "CPT", v: 1 }   (CPT = Course Poster Token)
 *   payload = { cid: courseId, exp, iat }
 *   sig     = HMAC-SHA256(subkey, base64url(header) + "." + base64url(payload))
 * Subkey via HKDF-SHA256(ikm: BETTER_AUTH_SECRET, salt: empty, info: AppConfig.posterToken.hkdfInfo).
 * verify() uses crypto.timingSafeEqual to prevent a timing-based signature oracle.
 */
import { createHmac, hkdfSync, timingSafeEqual } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { AppConfig } from '../../../../common/config/app-config';
import {
  CoursePosterTokenExpiredError,
  CoursePosterTokenMalformedError,
  CoursePosterTokenMismatchError,
  CoursePosterTokenTamperedError,
} from './course.errors';

interface TokenHeader {
  alg: 'HS256';
  typ: 'CPT';
  v: 1;
}

interface TokenPayload {
  cid: string;
  exp: number;
  iat: number;
}

export interface SignResult {
  token: string;
  expiresAt: Date;
}

const HEADER: TokenHeader = { alg: 'HS256', typ: 'CPT', v: 1 };
const ENCODED_HEADER = base64urlEncode(JSON.stringify(HEADER));

function base64urlEncode(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64url');
}

function base64urlDecode(input: string): Buffer {
  return Buffer.from(input, 'base64url');
}

@Injectable()
export class CoursePosterTokenSigner {
  /** Lazily derived and cached — HKDF is cheap but non-trivial under high RPS. */
  private _subkey: Buffer | null = null;

  constructor(private readonly config: AppConfig) {}

  private get subkey(): Buffer {
    if (!this._subkey) {
      const { secret, hkdfInfo } = this.config.posterToken;
      const ikm = Buffer.from(secret, 'utf8');
      const salt = Buffer.alloc(0);
      this._subkey = Buffer.from(hkdfSync('sha256', ikm, salt, hkdfInfo, 32));
    }
    return this._subkey;
  }

  /** Mint a short-lived token bound to `courseId`, using AppConfig.posterToken.ttlSeconds. */
  sign(courseId: string): SignResult {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + this.config.posterToken.ttlSeconds;

    const payload: TokenPayload = { cid: courseId, exp, iat: now };
    const encodedPayload = base64urlEncode(JSON.stringify(payload));
    const signingInput = `${ENCODED_HEADER}.${encodedPayload}`;
    const sig = base64urlEncode(this.hmac(signingInput));

    return { token: `${signingInput}.${sig}`, expiresAt: new Date(exp * 1000) };
  }

  /**
   * `sign()` plus the route shape, in one call — the single place that knows
   * the poster route is `/api/v1/courses/:id/poster?token=...`, so every
   * CourseDto mapper call site stays a one-liner.
   */
  signUrl(courseId: string): string {
    const { token } = this.sign(courseId);
    return `/api/v1/courses/${courseId}/poster?token=${encodeURIComponent(token)}`;
  }

  /** Verify a poster token against the courseId in the URL. */
  verify(token: string, expectedCourseId: string): { expiresAt: Date } {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new CoursePosterTokenMalformedError();
    }
    const [rawHeader, rawPayload, rawSig] = parts as [string, string, string];

    const signingInput = `${rawHeader}.${rawPayload}`;
    const expectedSig = this.hmac(signingInput);
    let actualSigBuf: Buffer;
    try {
      actualSigBuf = base64urlDecode(rawSig);
    } catch {
      throw new CoursePosterTokenMalformedError();
    }

    if (actualSigBuf.length !== expectedSig.length || !timingSafeEqual(actualSigBuf, expectedSig)) {
      throw new CoursePosterTokenTamperedError();
    }

    let payload: TokenPayload;
    try {
      const raw = base64urlDecode(rawPayload).toString('utf8');
      payload = JSON.parse(raw) as TokenPayload;
    } catch {
      throw new CoursePosterTokenMalformedError();
    }

    if (
      typeof payload.cid !== 'string' ||
      typeof payload.exp !== 'number' ||
      typeof payload.iat !== 'number'
    ) {
      throw new CoursePosterTokenMalformedError();
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp <= nowSec) {
      throw new CoursePosterTokenExpiredError();
    }

    if (payload.cid !== expectedCourseId) {
      throw new CoursePosterTokenMismatchError();
    }

    return { expiresAt: new Date(payload.exp * 1000) };
  }

  private hmac(input: string): Buffer {
    return createHmac('sha256', this.subkey).update(input, 'utf8').digest();
  }
}
