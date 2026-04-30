import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Library } from '../../domain/library/library';
import { ListLibrariesQuery } from './list-libraries.query';
import { ListLibrariesHandler } from './list-libraries.handler';

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

function makeLibrary(
  overrides: Partial<{ id: string; name: string; rootPath: string }> = {},
): Library {
  return Library.reconstitute({
    id: 'lib-1' as ReturnType<typeof Library.reconstitute>['id'],
    name: overrides.name ?? 'Books',
    rootPath: overrides.rootPath ?? '/media/books',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

const adminActor = { id: 'admin-1', role: 'admin' };
const userActor = { id: 'user-1', role: 'user' };

describe('ListLibrariesHandler', () => {
  let repo: LibraryRepository;
  let handler: ListLibrariesHandler;

  describe('admin actor', () => {
    beforeEach(() => {
      repo = makeRepo();
      const authz = makeAuthz(true); // admin short-circuits inside service; mock returns true
      handler = new ListLibrariesHandler(repo, authz);
    });

    it('returns empty array when repository has no libraries', async () => {
      vi.mocked(repo.findAll).mockResolvedValue([]);

      const result = await handler.execute(new ListLibrariesQuery(adminActor));

      expect(result).toEqual([]);
    });

    it('maps each Library aggregate to a LibraryDto', async () => {
      const lib = makeLibrary({ id: 'lib-1', name: 'Books', rootPath: '/media/books' });
      vi.mocked(repo.findAll).mockResolvedValue([lib]);

      const result = await handler.execute(new ListLibrariesQuery(adminActor));

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: lib.id,
        name: lib.name,
        rootPath: lib.rootPath,
      });
      expect(typeof result[0]?.createdAt).toBe('string');
      expect(typeof result[0]?.updatedAt).toBe('string');
    });

    it('returns all libraries from the repository', async () => {
      const libs = [
        makeLibrary({ name: 'Books', rootPath: '/media/books' }),
        makeLibrary({ name: 'Music', rootPath: '/media/music' }),
      ];
      vi.mocked(repo.findAll).mockResolvedValue(libs);

      const result = await handler.execute(new ListLibrariesQuery(adminActor));

      expect(result).toHaveLength(2);
    });
  });

  describe('non-admin actor without a grant', () => {
    beforeEach(() => {
      repo = makeRepo();
      const authz = makeAuthz(false); // no grants
      handler = new ListLibrariesHandler(repo, authz);
    });

    it('returns empty array even when libraries exist', async () => {
      const lib = makeLibrary();
      vi.mocked(repo.findAll).mockResolvedValue([lib]);

      const result = await handler.execute(new ListLibrariesQuery(userActor));

      expect(result).toEqual([]);
    });

    it('calls canSee for each library', async () => {
      const authz = makeAuthz(false);
      handler = new ListLibrariesHandler(repo, authz);
      const libs = [
        makeLibrary({ name: 'Books', rootPath: '/media/books' }),
        makeLibrary({ name: 'Music', rootPath: '/media/music' }),
      ];
      vi.mocked(repo.findAll).mockResolvedValue(libs);

      await handler.execute(new ListLibrariesQuery(userActor));

      expect(authz.canSee).toHaveBeenCalledTimes(2);
    });
  });

  describe('non-admin actor with a grant on one library', () => {
    it('returns only the visible library', async () => {
      repo = makeRepo();
      // canSee returns true for first call, false for second
      const authz: AuthorizationService = {
        canSee: vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false),
        invalidate: vi.fn(),
      };
      handler = new ListLibrariesHandler(repo, authz);
      const lib1 = makeLibrary({ name: 'Books', rootPath: '/media/books' });
      const lib2 = makeLibrary({ name: 'Music', rootPath: '/media/music' });
      vi.mocked(repo.findAll).mockResolvedValue([lib1, lib2]);

      const result = await handler.execute(new ListLibrariesQuery(userActor));

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('Books');
    });
  });
});
