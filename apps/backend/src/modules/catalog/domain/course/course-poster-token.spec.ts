/**
 * Unit tests for CoursePosterTokenSigner (#496).
 *
 * Scenarios:
 *   1. Happy round-trip — sign then verify succeeds and returns expiresAt.
 *   2. signUrl — builds the full /api/v1/courses/:id/poster?token=... URL.
 *   3. Tamper detection — flip a byte in payload → CoursePosterTokenTamperedError.
 *   4. Tamper detection — flip a byte in signature → CoursePosterTokenTamperedError.
 *   5. Expired token → CoursePosterTokenExpiredError.
 *   6. Course mismatch — verify with wrong expectedCourseId → CoursePosterTokenMismatchError.
 *   7. Malformed: empty string / wrong part count → CoursePosterTokenMalformedError.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CoursePosterTokenExpiredError,
  CoursePosterTokenMalformedError,
  CoursePosterTokenMismatchError,
  CoursePosterTokenTamperedError,
} from './course.errors';
import { CoursePosterTokenSigner } from './course-poster-token';

import type { AppConfig } from '../../../../common/config/app-config';

function makeConfig(secret = 'test-secret', hkdfInfo = 'courseshelf:poster-token:v1'): AppConfig {
  return { posterToken: { secret, hkdfInfo, ttlSeconds: 900 } } as unknown as AppConfig;
}

function makeSigner(secret?: string): CoursePosterTokenSigner {
  return new CoursePosterTokenSigner(makeConfig(secret));
}

describe('CoursePosterTokenSigner', () => {
  describe('sign + verify round-trip', () => {
    it('verify succeeds and returns the same expiresAt sign() minted', () => {
      const signer = makeSigner();
      const { token, expiresAt } = signer.sign('course-1');

      const result = signer.verify(token, 'course-1');

      expect(result.expiresAt).toEqual(expiresAt);
    });
  });

  describe('signUrl', () => {
    it('builds /api/v1/courses/:id/poster?token=... with the signed token', () => {
      const signer = makeSigner();

      const url = signer.signUrl('course-1');

      expect(url).toMatch(/^\/api\/v1\/courses\/course-1\/poster\?token=/);
      const token = decodeURIComponent(url.split('token=')[1]!);
      expect(() => signer.verify(token, 'course-1')).not.toThrow();
    });
  });

  describe('tamper detection', () => {
    it('throws CoursePosterTokenTamperedError when payload segment is modified', () => {
      const signer = makeSigner();
      const { token } = signer.sign('course-1');

      const parts = token.split('.');
      const flipped = (parts[1]![0] === 'a' ? 'b' : 'a') + parts[1]!.slice(1);
      const tampered = [parts[0], flipped, parts[2]].join('.');

      expect(() => signer.verify(tampered, 'course-1')).toThrow(CoursePosterTokenTamperedError);
    });

    it('throws CoursePosterTokenTamperedError when signature segment is modified', () => {
      const signer = makeSigner();
      const { token } = signer.sign('course-1');

      const parts = token.split('.');
      const flippedSig = (parts[2]![0] === 'a' ? 'b' : 'a') + parts[2]!.slice(1);
      const tampered = [parts[0], parts[1], flippedSig].join('.');

      expect(() => signer.verify(tampered, 'course-1')).toThrow(CoursePosterTokenTamperedError);
    });
  });

  describe('expiry', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('throws CoursePosterTokenExpiredError when exp is in the past', () => {
      vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      const signer = makeSigner();
      const { token } = signer.sign('course-1');

      vi.setSystemTime(new Date('2026-01-01T00:15:01.000Z')); // past the 900s TTL

      expect(() => signer.verify(token, 'course-1')).toThrow(CoursePosterTokenExpiredError);
    });
  });

  describe('course mismatch', () => {
    it('throws CoursePosterTokenMismatchError when expectedCourseId differs', () => {
      const signer = makeSigner();
      const { token } = signer.sign('course-a');

      expect(() => signer.verify(token, 'course-b')).toThrow(CoursePosterTokenMismatchError);
    });
  });

  describe('malformed tokens', () => {
    it('throws CoursePosterTokenMalformedError for empty string', () => {
      const signer = makeSigner();
      expect(() => signer.verify('', 'course-1')).toThrow(CoursePosterTokenMalformedError);
    });

    it('throws CoursePosterTokenMalformedError when the part count is wrong', () => {
      const signer = makeSigner();
      expect(() => signer.verify('only.two', 'course-1')).toThrow(CoursePosterTokenMalformedError);
    });
  });
});
