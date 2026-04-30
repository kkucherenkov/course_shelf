import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LibraryNotFoundError } from '../../domain/library/library.errors';
import { PermissionDenied } from '../../../../shared/domain-error';
import { Library } from '../../domain/library/library';

import { GetLibraryQuery } from './get-library.query';
import { GetLibraryHandler } from './get-library.handler';

import type { LibraryRepository } from '../../domain/library/library.repository';
import type { AuthorizationService } from '../../../../common/access/authorization.service';

function makeRepo(): LibraryRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    findByIds: vi.fn(),
    update: vi.fn(),
    findByRootPath: vi.fn(),
    removeWithCascade: vi.fn(),
  };
}

function makeAuthz(allow: boolean): AuthorizationService {
  return {
    canSee: vi.fn().mockResolvedValue(allow),
    invalidate: vi.fn(),
  };
}

function makeLibrary(): Library {
  return Library.reconstitute({
    id: 'lib-1' as ReturnType<typeof Library.reconstitute>['id'],
    name: 'Books',
    rootPath: '/media/books',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

const adminActor = { id: 'admin-1', role: 'admin' };
const userActor = { id: 'user-1', role: 'user' };

describe('GetLibraryHandler', () => {
  let repo: LibraryRepository;
  let handler: GetLibraryHandler;

  describe('admin actor', () => {
    beforeEach(() => {
      repo = makeRepo();
      handler = new GetLibraryHandler(repo, makeAuthz(true));
    });

    it('returns the LibraryDto when the library is found', async () => {
      const lib = makeLibrary();
      vi.mocked(repo.findById).mockResolvedValue(lib);

      const result = await handler.execute(new GetLibraryQuery('lib-1', adminActor));

      expect(result.id).toBe(lib.id);
      expect(result.name).toBe(lib.name);
      expect(result.rootPath).toBe(lib.rootPath);
      expect(typeof result.createdAt).toBe('string');
      expect(typeof result.updatedAt).toBe('string');
      expect(repo.findById).toHaveBeenCalledWith('lib-1');
    });

    it('throws LibraryNotFoundError when repo returns null', async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);

      await expect(
        handler.execute(new GetLibraryQuery('missing', adminActor)),
      ).rejects.toBeInstanceOf(LibraryNotFoundError);
    });

    it('LibraryNotFoundError has status 404', async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);

      const err = await handler
        .execute(new GetLibraryQuery('missing', adminActor))
        .catch((error: unknown) => error);

      expect(err).toBeInstanceOf(LibraryNotFoundError);
      expect((err as LibraryNotFoundError).status).toBe(404);
      expect((err as LibraryNotFoundError).code).toBe('library-not-found');
    });
  });

  describe('non-admin actor without a grant', () => {
    beforeEach(() => {
      repo = makeRepo();
      handler = new GetLibraryHandler(repo, makeAuthz(false));
    });

    it('throws PermissionDenied when library exists but user has no grant', async () => {
      const lib = makeLibrary();
      vi.mocked(repo.findById).mockResolvedValue(lib);

      await expect(handler.execute(new GetLibraryQuery('lib-1', userActor))).rejects.toBeInstanceOf(
        PermissionDenied,
      );
    });

    it('PermissionDenied has status 403', async () => {
      const lib = makeLibrary();
      vi.mocked(repo.findById).mockResolvedValue(lib);

      const err = await handler
        .execute(new GetLibraryQuery('lib-1', userActor))
        .catch((error: unknown) => error);

      expect((err as PermissionDenied).status).toBe(403);
      expect((err as PermissionDenied).code).toBe('permission-denied');
    });

    it('throws LibraryNotFoundError before checking grants when library is missing', async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);

      await expect(
        handler.execute(new GetLibraryQuery('missing', userActor)),
      ).rejects.toBeInstanceOf(LibraryNotFoundError);
    });
  });

  describe('non-admin actor with a grant', () => {
    beforeEach(() => {
      repo = makeRepo();
      handler = new GetLibraryHandler(repo, makeAuthz(true));
    });

    it('returns the LibraryDto when user has a grant', async () => {
      const lib = makeLibrary();
      vi.mocked(repo.findById).mockResolvedValue(lib);

      const result = await handler.execute(new GetLibraryQuery('lib-1', userActor));

      expect(result.id).toBe(lib.id);
      expect(result.name).toBe(lib.name);
    });
  });
});
