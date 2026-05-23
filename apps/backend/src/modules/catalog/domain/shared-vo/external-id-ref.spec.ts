/**
 * Unit tests for ExternalIdRefVO factory.
 */
import { describe, expect, it } from 'vitest';

import { ExternalIdRefVO } from './external-id-ref';
import { ExternalIdRefInvalidError } from './shared.errors';

describe('ExternalIdRefVO.from', () => {
  describe('happy paths', () => {
    it('creates a ref with source and externalId only', () => {
      const ref = ExternalIdRefVO.from({ source: 'imdb', externalId: 'tt1234567' });
      expect(ref.source).toBe('imdb');
      expect(ref.externalId).toBe('tt1234567');
      expect(ref.url).toBeUndefined();
    });

    it('creates a ref with an https URL', () => {
      const ref = ExternalIdRefVO.from({
        source: 'imdb',
        externalId: 'tt1234567',
        url: 'https://www.imdb.com/title/tt1234567/',
      });
      expect(ref.url).toBe('https://www.imdb.com/title/tt1234567/');
    });

    it('creates a ref with an http URL', () => {
      const ref = ExternalIdRefVO.from({
        source: 'legacy',
        externalId: 'abc',
        url: 'http://example.com/abc',
      });
      expect(ref.url).toBe('http://example.com/abc');
    });

    it('trims source and externalId', () => {
      const ref = ExternalIdRefVO.from({ source: '  imdb  ', externalId: '  tt1234567  ' });
      expect(ref.source).toBe('imdb');
      expect(ref.externalId).toBe('tt1234567');
    });

    it('returns a plain object (no class instance)', () => {
      const ref = ExternalIdRefVO.from({ source: 'imdb', externalId: 'tt1' });
      expect(ref.constructor).toBe(Object);
    });
  });

  describe('rejection branches', () => {
    it('rejects non-string source', () => {
      expect(() => ExternalIdRefVO.from({ source: 123, externalId: 'tt1' })).toThrow(
        ExternalIdRefInvalidError,
      );
    });

    it('rejects empty source', () => {
      expect(() => ExternalIdRefVO.from({ source: '', externalId: 'tt1' })).toThrow(
        ExternalIdRefInvalidError,
      );
    });

    it('rejects whitespace-only source', () => {
      expect(() => ExternalIdRefVO.from({ source: '   ', externalId: 'tt1' })).toThrow(
        ExternalIdRefInvalidError,
      );
    });

    it('rejects non-string externalId', () => {
      expect(() => ExternalIdRefVO.from({ source: 'imdb', externalId: null })).toThrow(
        ExternalIdRefInvalidError,
      );
    });

    it('rejects empty externalId', () => {
      expect(() => ExternalIdRefVO.from({ source: 'imdb', externalId: '' })).toThrow(
        ExternalIdRefInvalidError,
      );
    });

    it('rejects whitespace-only externalId', () => {
      expect(() => ExternalIdRefVO.from({ source: 'imdb', externalId: '   ' })).toThrow(
        ExternalIdRefInvalidError,
      );
    });

    it('rejects a non-string url when present', () => {
      expect(() => ExternalIdRefVO.from({ source: 'imdb', externalId: 'tt1', url: 42 })).toThrow(
        ExternalIdRefInvalidError,
      );
    });

    it('rejects a malformed URL', () => {
      expect(() =>
        ExternalIdRefVO.from({ source: 'imdb', externalId: 'tt1', url: 'not-a-url' }),
      ).toThrow(ExternalIdRefInvalidError);
    });

    it('rejects a non-http(s) URL', () => {
      expect(() =>
        ExternalIdRefVO.from({ source: 'imdb', externalId: 'tt1', url: 'ftp://example.com/abc' }),
      ).toThrow(ExternalIdRefInvalidError);
    });

    it('rejects an empty url string', () => {
      expect(() => ExternalIdRefVO.from({ source: 'imdb', externalId: 'tt1', url: '' })).toThrow(
        ExternalIdRefInvalidError,
      );
    });
  });
});
