/**
 * Unit tests for StreamTokenSigner.
 *
 * Lesson token scenarios:
 *   1.  Happy round-trip — sign then verify returns same userId.
 *   2.  Tamper detection — flip a byte in payload → StreamTokenTamperedError.
 *   3.  Tamper detection — flip a byte in signature segment → StreamTokenTamperedError.
 *   4.  Expired token — clock advances past exp → StreamTokenExpiredError.
 *   5.  Lesson mismatch — verify with wrong expectedLessonId → StreamTokenLessonMismatchError.
 *   6.  Malformed: empty string → StreamTokenMalformedError.
 *   7.  Malformed: only two parts → StreamTokenMalformedError.
 *   8.  Malformed: non-base64 payload → StreamTokenMalformedError (via tamper path).
 *   9.  HKDF determinism — two signers built from same secret produce same sig.
 *   10. Scope mismatch — material token rejected by verify() → StreamTokenScopeMismatchError.
 *
 * Material token scenarios:
 *   11. Happy round-trip — signMaterial + verifyMaterial returns userId, lessonId.
 *   12. Material mismatch — verify with wrong materialId → StreamTokenMaterialMismatchError.
 *   13. Scope mismatch — lesson token rejected by verifyMaterial() → StreamTokenScopeMismatchError.
 *   14. Expired material token → StreamTokenExpiredError.
 *   15. Tampered material token → StreamTokenTamperedError.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppConfig } from '../../../../common/config/app-config';
import {
  StreamTokenExpiredError,
  StreamTokenLessonMismatchError,
  StreamTokenMalformedError,
  StreamTokenMaterialMismatchError,
  StreamTokenScopeMismatchError,
  StreamTokenTamperedError,
} from './stream-token.errors';
import { StreamTokenSigner } from './stream-token-signer';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeConfig(secret = 'test-secret', hkdfInfo = 'courseshelf:stream-token:v1'): AppConfig {
  return {
    streaming: { secret, hkdfInfo, ttlSeconds: 900 },
  } as unknown as AppConfig;
}

function makeSigner(secret?: string): StreamTokenSigner {
  return new StreamTokenSigner(makeConfig(secret));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StreamTokenSigner', () => {
  // -------------------------------------------------------------------------
  // Round-trip (lesson)
  // -------------------------------------------------------------------------
  describe('sign + verify round-trip', () => {
    it('returns the correct userId and lessonId after a valid sign/verify', () => {
      const signer = makeSigner();
      const { token, expiresAt } = signer.sign({
        userId: 'user-abc',
        lessonId: 'lesson-xyz',
        ttlSeconds: 300,
      });

      const result = signer.verify(token, 'lesson-xyz');

      expect(result.userId).toBe('user-abc');
      expect(result.expiresAt).toEqual(expiresAt);
    });

    it('expiresAt is approximately now + ttlSeconds (within ±1s due to floor)', () => {
      const signer = makeSigner();
      const before = Date.now();
      const { expiresAt } = signer.sign({ userId: 'u1', lessonId: 'l1', ttlSeconds: 60 });
      const after = Date.now();

      const expMs = expiresAt.getTime();
      // Math.floor loses up to 999ms, so lower bound is before + 59_001
      expect(expMs).toBeGreaterThanOrEqual(before + 59_001);
      expect(expMs).toBeLessThanOrEqual(after + 61_000);
    });
  });

  // -------------------------------------------------------------------------
  // Tamper detection — payload
  // -------------------------------------------------------------------------
  describe('tamper detection', () => {
    it('throws StreamTokenTamperedError when payload segment is modified', () => {
      const signer = makeSigner();
      const { token } = signer.sign({ userId: 'u', lessonId: 'l', ttlSeconds: 300 });

      const parts = token.split('.');
      // Flip the FIRST char, not the last — base64url's last char encodes
      // only some of its 6 bits into the source bytes (the rest are
      // padding) so flipping it can leave the decoded payload identical
      // ~6% of the time, which flakes the tamper-detection test.
      const flipped = (parts[1]![0] === 'a' ? 'b' : 'a') + parts[1]!.slice(1);
      const tampered = [parts[0], flipped, parts[2]].join('.');

      expect(() => signer.verify(tampered, 'l')).toThrow(StreamTokenTamperedError);
    });

    it('throws StreamTokenTamperedError when signature segment is modified', () => {
      const signer = makeSigner();
      const { token } = signer.sign({ userId: 'u', lessonId: 'l', ttlSeconds: 300 });

      const parts = token.split('.');
      // Same base64url-padding caveat as above — flipping the first char
      // guarantees the decoded HMAC bytes change.
      const flippedSig = (parts[2]![0] === 'a' ? 'b' : 'a') + parts[2]!.slice(1);
      const tampered = [parts[0], parts[1], flippedSig].join('.');

      expect(() => signer.verify(tampered, 'l')).toThrow(StreamTokenTamperedError);
    });
  });

  // -------------------------------------------------------------------------
  // Expired
  // -------------------------------------------------------------------------
  describe('expiry', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('throws StreamTokenExpiredError when exp is in the past', () => {
      vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      const signer = makeSigner();
      const { token } = signer.sign({ userId: 'u', lessonId: 'l', ttlSeconds: 1 });

      // Advance past expiry
      vi.setSystemTime(new Date('2026-01-01T00:00:02.000Z'));

      expect(() => signer.verify(token, 'l')).toThrow(StreamTokenExpiredError);
    });
  });

  // -------------------------------------------------------------------------
  // Lesson mismatch
  // -------------------------------------------------------------------------
  describe('lesson mismatch', () => {
    it('throws StreamTokenLessonMismatchError when expectedLessonId differs', () => {
      const signer = makeSigner();
      const { token } = signer.sign({ userId: 'u', lessonId: 'lesson-a', ttlSeconds: 300 });

      expect(() => signer.verify(token, 'lesson-b')).toThrow(StreamTokenLessonMismatchError);
    });
  });

  // -------------------------------------------------------------------------
  // Malformed
  // -------------------------------------------------------------------------
  describe('malformed tokens', () => {
    it('throws StreamTokenMalformedError for empty string', () => {
      const signer = makeSigner();
      expect(() => signer.verify('', 'l')).toThrow(StreamTokenMalformedError);
    });

    it('throws StreamTokenMalformedError for only two parts', () => {
      const signer = makeSigner();
      expect(() => signer.verify('a.b', 'l')).toThrow(StreamTokenMalformedError);
    });

    it('throws StreamTokenTamperedError for a structurally-valid three-part token with wrong sig', () => {
      const signer = makeSigner();
      // Three valid-looking parts but signature doesn't match
      const h = Buffer.from('{}').toString('base64url');
      const p = Buffer.from('{}').toString('base64url');
      const s = Buffer.from('fakesig').toString('base64url');
      expect(() => signer.verify(`${h}.${p}.${s}`, 'l')).toThrow(StreamTokenTamperedError);
    });
  });

  // -------------------------------------------------------------------------
  // Scope mismatch (lesson ← material token)
  // -------------------------------------------------------------------------
  describe('scope mismatch on verify()', () => {
    it('throws StreamTokenScopeMismatchError when a material token is presented to verify()', () => {
      const signer = makeSigner();
      const { token } = signer.signMaterial({
        userId: 'u',
        lessonId: 'l',
        materialId: 'm',
        ttlSeconds: 300,
      });

      // verify() expects scp="lesson" — a material token must be rejected.
      expect(() => signer.verify(token, 'l')).toThrow(StreamTokenScopeMismatchError);
    });
  });

  // -------------------------------------------------------------------------
  // HKDF determinism
  // -------------------------------------------------------------------------
  describe('HKDF determinism', () => {
    it('two signers with the same secret produce the same signature', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

      const s1 = new StreamTokenSigner(makeConfig('shared-secret'));
      const s2 = new StreamTokenSigner(makeConfig('shared-secret'));

      const t1 = s1.sign({ userId: 'u', lessonId: 'l', ttlSeconds: 300 });
      const t2 = s2.sign({ userId: 'u', lessonId: 'l', ttlSeconds: 300 });

      expect(t1.token).toBe(t2.token);

      vi.useRealTimers();
    });

    it('signers with different secrets produce different tokens', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

      const s1 = new StreamTokenSigner(makeConfig('secret-A'));
      const s2 = new StreamTokenSigner(makeConfig('secret-B'));

      const t1 = s1.sign({ userId: 'u', lessonId: 'l', ttlSeconds: 300 });
      const t2 = s2.sign({ userId: 'u', lessonId: 'l', ttlSeconds: 300 });

      expect(t1.token).not.toBe(t2.token);

      vi.useRealTimers();
    });
  });

  // =========================================================================
  // Material token scenarios
  // =========================================================================

  describe('signMaterial + verifyMaterial round-trip', () => {
    it('returns correct userId and lessonId after valid sign/verify', () => {
      const signer = makeSigner();
      const { token, expiresAt } = signer.signMaterial({
        userId: 'user-1',
        lessonId: 'lesson-1',
        materialId: 'mat-1',
        ttlSeconds: 300,
      });

      const result = signer.verifyMaterial(token, 'mat-1');

      expect(result.userId).toBe('user-1');
      expect(result.lessonId).toBe('lesson-1');
      expect(result.expiresAt).toEqual(expiresAt);
    });

    it('expiresAt is approximately now + ttlSeconds', () => {
      const signer = makeSigner();
      const before = Date.now();
      const { expiresAt } = signer.signMaterial({
        userId: 'u',
        lessonId: 'l',
        materialId: 'm',
        ttlSeconds: 60,
      });
      const after = Date.now();

      const expMs = expiresAt.getTime();
      expect(expMs).toBeGreaterThanOrEqual(before + 59_001);
      expect(expMs).toBeLessThanOrEqual(after + 61_000);
    });
  });

  describe('material mismatch', () => {
    it('throws StreamTokenMaterialMismatchError when expectedMaterialId differs', () => {
      const signer = makeSigner();
      const { token } = signer.signMaterial({
        userId: 'u',
        lessonId: 'l',
        materialId: 'mat-a',
        ttlSeconds: 300,
      });

      expect(() => signer.verifyMaterial(token, 'mat-b')).toThrow(StreamTokenMaterialMismatchError);
    });
  });

  describe('scope mismatch on verifyMaterial()', () => {
    it('throws StreamTokenScopeMismatchError when a lesson token is presented to verifyMaterial()', () => {
      const signer = makeSigner();
      const { token } = signer.sign({ userId: 'u', lessonId: 'l', ttlSeconds: 300 });

      // verifyMaterial() expects scp="material" — a lesson token must be rejected.
      expect(() => signer.verifyMaterial(token, 'mat-1')).toThrow(StreamTokenScopeMismatchError);
    });
  });

  describe('material token expiry', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('throws StreamTokenExpiredError when material token exp is in the past', () => {
      vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      const signer = makeSigner();
      const { token } = signer.signMaterial({
        userId: 'u',
        lessonId: 'l',
        materialId: 'm',
        ttlSeconds: 1,
      });

      vi.setSystemTime(new Date('2026-01-01T00:00:02.000Z'));

      expect(() => signer.verifyMaterial(token, 'm')).toThrow(StreamTokenExpiredError);
    });
  });

  describe('material token tamper detection', () => {
    it('throws StreamTokenTamperedError when material token payload is modified', () => {
      const signer = makeSigner();
      const { token } = signer.signMaterial({
        userId: 'u',
        lessonId: 'l',
        materialId: 'm',
        ttlSeconds: 300,
      });

      const parts = token.split('.');
      // First-char flip; see the lesson-token equivalent above for why
      // the previous last-char flip flaked.
      const flipped = (parts[1]![0] === 'a' ? 'b' : 'a') + parts[1]!.slice(1);
      const tampered = [parts[0], flipped, parts[2]].join('.');

      expect(() => signer.verifyMaterial(tampered, 'm')).toThrow(StreamTokenTamperedError);
    });
  });
});
