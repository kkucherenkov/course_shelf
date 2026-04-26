import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LibraryNotFoundError } from '../../domain/library/library.errors';
import { Library } from '../../domain/library/library';

import { GetLibraryQuery } from './get-library.query';
import { GetLibraryHandler } from './get-library.handler';

import type { LibraryRepository } from '../../domain/library/library.repository';

function makeRepo(): LibraryRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
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

describe('GetLibraryHandler', () => {
  let repo: LibraryRepository;
  let handler: GetLibraryHandler;

  beforeEach(() => {
    repo = makeRepo();
    handler = new GetLibraryHandler(repo);
  });

  it('returns the LibraryDto when the library is found', async () => {
    const lib = makeLibrary();
    vi.mocked(repo.findById).mockResolvedValue(lib);

    const result = await handler.execute(new GetLibraryQuery('lib-1'));

    expect(result.id).toBe(lib.id);
    expect(result.name).toBe(lib.name);
    expect(result.rootPath).toBe(lib.rootPath);
    expect(typeof result.createdAt).toBe('string');
    expect(typeof result.updatedAt).toBe('string');
    expect(repo.findById).toHaveBeenCalledWith('lib-1');
  });

  it('throws LibraryNotFoundError when repo returns null', async () => {
    vi.mocked(repo.findById).mockResolvedValue(null);

    await expect(handler.execute(new GetLibraryQuery('missing'))).rejects.toBeInstanceOf(
      LibraryNotFoundError,
    );
  });

  it('LibraryNotFoundError has status 404', async () => {
    vi.mocked(repo.findById).mockResolvedValue(null);

    const err = await handler
      .execute(new GetLibraryQuery('missing'))
      .catch((error: unknown) => error);

    expect(err).toBeInstanceOf(LibraryNotFoundError);
    expect((err as LibraryNotFoundError).status).toBe(404);
    expect((err as LibraryNotFoundError).code).toBe('library-not-found');
  });
});
