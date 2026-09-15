import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Library } from '../../domain/library/library';
import { LibraryPathNotAllowedError } from '../../domain/library/library.errors';

import { RegisterLibraryCommand } from './register-library.command';
import { RegisterLibraryHandler } from './register-library.handler';

import type { AppConfig } from '../../../../common/config/app-config';
import type { LibraryRepository } from '../../domain/library/library.repository';

function makeRepo(): LibraryRepository {
  return {
    save: vi.fn<(library: Library) => Promise<void>>().mockResolvedValue(undefined),
    findById: vi.fn(),
    findByRootPath: vi.fn<(rootPath: string) => Promise<Library | null>>().mockResolvedValue(null),
    findAll: vi.fn(),
    findByIds: vi.fn(),
    update: vi.fn(),
    removeWithCascade: vi.fn(),
  };
}

/** Defaults to an unrestricted allowlist — matches the production default. */
function makeAppConfig(rootAllowlist: string[] = []): AppConfig {
  return { catalog: { rootAllowlist } } as unknown as AppConfig;
}

describe('RegisterLibraryHandler', () => {
  let repo: LibraryRepository;
  let handler: RegisterLibraryHandler;

  beforeEach(() => {
    repo = makeRepo();
    handler = new RegisterLibraryHandler(repo, makeAppConfig());
  });

  it('saves a new aggregate when the rootPath is unused', async () => {
    const result = await handler.execute(new RegisterLibraryCommand('My Library', '/media/books'));

    expect(repo.findByRootPath).toHaveBeenCalledWith('/media/books');
    expect(repo.save).toHaveBeenCalledOnce();
    const saved = vi.mocked(repo.save).mock.calls[0]?.[0];
    expect(saved?.name).toBe('My Library');
    expect(saved?.rootPath).toBe('/media/books');
    expect(result.id).toBe(saved?.id);
    expect(result.alreadyExisted).toBe(false);
  });

  it('returns { id } matching the saved aggregate id', async () => {
    const result = await handler.execute(new RegisterLibraryCommand('Books', '/home/books'));

    expect(typeof result.id).toBe('string');
    expect(result.id.length).toBeGreaterThan(0);
  });

  it('short-circuits when rootPath already exists — returns the existing id with alreadyExisted=true', async () => {
    const existing = Library.reconstitute({
      // The id is brand-typed (`LibraryId`); cast through unknown to satisfy
      // the test fixture without smuggling the brand into production code.
      id: 'lib-existing' as unknown as Library['id'],
      name: 'Original name',
      rootPath: '/media/books',
      createdAt: new Date('2026-04-29T00:00:00Z'),
      updatedAt: new Date('2026-04-29T00:00:00Z'),
    });
    vi.mocked(repo.findByRootPath).mockResolvedValue(existing);

    const result = await handler.execute(
      new RegisterLibraryCommand('Books (renamed)', '/media/books'),
    );

    expect(repo.findByRootPath).toHaveBeenCalledWith('/media/books');
    expect(repo.save).not.toHaveBeenCalled();
    expect(result.id).toBe('lib-existing');
    expect(result.alreadyExisted).toBe(true);
  });

  describe('allowlist (#592)', () => {
    it('rejects a fresh rootPath outside the configured allowlist', async () => {
      const guarded = new RegisterLibraryHandler(repo, makeAppConfig(['/data/courses']));

      await expect(
        guarded.execute(new RegisterLibraryCommand('Movies', '/etc/movies')),
      ).rejects.toBeInstanceOf(LibraryPathNotAllowedError);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('accepts a fresh rootPath under an allowlisted root', async () => {
      const guarded = new RegisterLibraryHandler(repo, makeAppConfig(['/data/courses']));

      const result = await guarded.execute(
        new RegisterLibraryCommand('Movies', '/data/courses/movies'),
      );

      expect(result.alreadyExisted).toBe(false);
      expect(repo.save).toHaveBeenCalledOnce();
    });

    it('does not re-validate an already-registered rootPath (idempotent branch)', async () => {
      const existing = Library.reconstitute({
        id: 'lib-existing' as unknown as Library['id'],
        name: 'Movies',
        rootPath: '/etc/movies',
        createdAt: new Date('2026-04-29T00:00:00Z'),
        updatedAt: new Date('2026-04-29T00:00:00Z'),
      });
      vi.mocked(repo.findByRootPath).mockResolvedValue(existing);
      const guarded = new RegisterLibraryHandler(repo, makeAppConfig(['/data/courses']));

      const result = await guarded.execute(new RegisterLibraryCommand('Movies', '/etc/movies'));

      expect(result.alreadyExisted).toBe(true);
    });
  });
});
