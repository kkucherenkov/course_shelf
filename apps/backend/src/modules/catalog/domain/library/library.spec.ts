import { describe, expect, it } from 'vitest';

import { LibraryNameRequiredError, LibraryPathNotAbsoluteError } from './library.errors';
import { Library } from './library';

describe('Library aggregate', () => {
  const validProps = { id: 'lib-1', name: 'My Library', rootPath: '/media/books' };

  describe('register — happy path', () => {
    it('creates an aggregate with the expected field values', () => {
      const lib = Library.register(validProps);

      expect(lib.id).toBe('lib-1');
      expect(lib.name).toBe('My Library');
      expect(lib.rootPath).toBe('/media/books');
    });

    it('trims whitespace from name', () => {
      const lib = Library.register({ ...validProps, name: '  Trimmed  ' });
      expect(lib.name).toBe('Trimmed');
    });

    it('accepts Windows absolute paths', () => {
      const winPath = String.raw`C:\Users\books`;
      const lib = Library.register({ ...validProps, rootPath: winPath });
      expect(lib.rootPath).toBe(String.raw`C:\Users\books`);
    });

    it('uses the provided now for createdAt / updatedAt', () => {
      const now = new Date('2026-01-01T00:00:00.000Z');
      const lib = Library.register({ ...validProps, now });
      expect(lib.createdAt).toBe(now);
      expect(lib.updatedAt).toBe(now);
    });
  });

  describe('register — invariant violations', () => {
    it('throws LibraryNameRequiredError for an empty name', () => {
      expect(() => Library.register({ ...validProps, name: '' })).toThrow(LibraryNameRequiredError);
    });

    it('throws LibraryNameRequiredError for a whitespace-only name', () => {
      expect(() => Library.register({ ...validProps, name: '   ' })).toThrow(
        LibraryNameRequiredError,
      );
    });

    it('throws LibraryPathNotAbsoluteError for a relative path', () => {
      expect(() => Library.register({ ...validProps, rootPath: 'relative/path' })).toThrow(
        LibraryPathNotAbsoluteError,
      );
    });

    it('throws LibraryPathNotAbsoluteError for a bare filename', () => {
      expect(() => Library.register({ ...validProps, rootPath: 'books' })).toThrow(
        LibraryPathNotAbsoluteError,
      );
    });

    it('LibraryNameRequiredError has status 422 and correct code', () => {
      let caught: LibraryNameRequiredError | undefined;
      try {
        Library.register({ ...validProps, name: '' });
      } catch (error) {
        caught = error as LibraryNameRequiredError;
      }
      expect(caught?.status).toBe(422);
      expect(caught?.code).toBe('library-name-required');
    });

    it('LibraryPathNotAbsoluteError has status 422 and correct code', () => {
      let caught: LibraryPathNotAbsoluteError | undefined;
      try {
        Library.register({ ...validProps, rootPath: 'relative' });
      } catch (error) {
        caught = error as LibraryPathNotAbsoluteError;
      }
      expect(caught?.status).toBe(422);
      expect(caught?.code).toBe('library-path-not-absolute');
    });
  });
});
