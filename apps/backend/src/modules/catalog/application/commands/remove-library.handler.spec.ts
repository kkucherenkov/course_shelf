import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LibraryNotFoundError } from '../../domain/library/library.errors';
import { RemoveLibraryCommand } from './remove-library.command';
import { RemoveLibraryHandler } from './remove-library.handler';

import type { LibraryRepository } from '../../domain/library/library.repository';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RemoveLibraryHandler', () => {
  let repo: LibraryRepository;
  let handler: RemoveLibraryHandler;

  beforeEach(() => {
    repo = makeRepo();
    handler = new RemoveLibraryHandler(repo);
  });

  it('throws LibraryNotFoundError (404) when repo returns false', async () => {
    vi.mocked(repo.removeWithCascade).mockResolvedValue(false);

    const err = await handler
      .execute(new RemoveLibraryCommand('missing'))
      .catch((error: unknown) => error);

    expect(err).toBeInstanceOf(LibraryNotFoundError);
    expect((err as LibraryNotFoundError).status).toBe(404);
    expect((err as LibraryNotFoundError).code).toBe('library-not-found');
  });

  it('returns void on happy path', async () => {
    vi.mocked(repo.removeWithCascade).mockResolvedValue(true);

    const result = await handler.execute(new RemoveLibraryCommand('lib-1'));

    expect(result).toBeUndefined();
    expect(repo.removeWithCascade).toHaveBeenCalledWith('lib-1');
  });

  it('calls removeWithCascade with the correct id', async () => {
    vi.mocked(repo.removeWithCascade).mockResolvedValue(true);

    await handler.execute(new RemoveLibraryCommand('lib-abc'));

    expect(repo.removeWithCascade).toHaveBeenCalledOnce();
    expect(repo.removeWithCascade).toHaveBeenCalledWith('lib-abc');
  });

  it('propagates unexpected errors from the repository', async () => {
    const unexpected = new Error('DB connection lost');
    vi.mocked(repo.removeWithCascade).mockRejectedValue(unexpected);

    await expect(handler.execute(new RemoveLibraryCommand('lib-1'))).rejects.toBe(unexpected);
  });
});
