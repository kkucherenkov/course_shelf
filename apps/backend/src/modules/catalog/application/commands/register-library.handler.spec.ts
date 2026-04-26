import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LibraryAlreadyExistsError } from '../../domain/library/library.errors';

import { RegisterLibraryCommand } from './register-library.command';
import { RegisterLibraryHandler } from './register-library.handler';

import type { LibraryRepository } from '../../domain/library/library.repository';
import type { Library } from '../../domain/library/library';

function makeRepo(): LibraryRepository {
  return {
    save: vi.fn<(library: Library) => Promise<void>>().mockResolvedValue(undefined),
    findById: vi.fn(),
    findAll: vi.fn(),
  };
}

describe('RegisterLibraryHandler', () => {
  let repo: LibraryRepository;
  let handler: RegisterLibraryHandler;

  beforeEach(() => {
    repo = makeRepo();
    handler = new RegisterLibraryHandler(repo);
  });

  it('calls repo.save with the registered aggregate', async () => {
    const result = await handler.execute(new RegisterLibraryCommand('My Library', '/media/books'));

    expect(repo.save).toHaveBeenCalledOnce();
    const saved = vi.mocked(repo.save).mock.calls[0]?.[0];
    expect(saved?.name).toBe('My Library');
    expect(saved?.rootPath).toBe('/media/books');
    expect(result.id).toBe(saved?.id);
  });

  it('returns { id } matching the saved aggregate id', async () => {
    const result = await handler.execute(new RegisterLibraryCommand('Books', '/home/books'));

    expect(typeof result.id).toBe('string');
    expect(result.id.length).toBeGreaterThan(0);
  });

  it('rethrows LibraryAlreadyExistsError from the repository', async () => {
    vi.mocked(repo.save).mockRejectedValue(new LibraryAlreadyExistsError('/media/books'));

    await expect(
      handler.execute(new RegisterLibraryCommand('Books', '/media/books')),
    ).rejects.toBeInstanceOf(LibraryAlreadyExistsError);
  });
});
