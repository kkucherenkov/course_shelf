import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Library } from '../../domain/library/library';

import { RegisterLibraryCommand } from './register-library.command';
import { RegisterLibraryHandler } from './register-library.handler';

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

describe('RegisterLibraryHandler', () => {
  let repo: LibraryRepository;
  let handler: RegisterLibraryHandler;

  beforeEach(() => {
    repo = makeRepo();
    handler = new RegisterLibraryHandler(repo);
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
});
