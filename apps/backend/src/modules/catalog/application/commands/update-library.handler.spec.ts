import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LibraryNotFoundError, LibraryUpdateEmptyError } from '../../domain/library/library.errors';
import { Library } from '../../domain/library/library';
import { UpdateLibraryCommand } from './update-library.command';
import { UpdateLibraryHandler } from './update-library.handler';

import type { LibraryRepository } from '../../domain/library/library.repository';
import type { LibraryId } from '../../domain/library/library';

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

function makeLibrary(overrides: Partial<{ id: string; name: string }> = {}): Library {
  return Library.reconstitute({
    id: (overrides.id ?? 'lib-1') as LibraryId,
    name: overrides.name ?? 'Books',
    rootPath: '/media/books',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('UpdateLibraryHandler', () => {
  let repo: LibraryRepository;
  let handler: UpdateLibraryHandler;

  beforeEach(() => {
    repo = makeRepo();
    handler = new UpdateLibraryHandler(repo);
  });

  it('throws LibraryUpdateEmptyError (400) when patch is empty', async () => {
    const err = await handler
      .execute(new UpdateLibraryCommand('lib-1', {}))
      .catch((error: unknown) => error);

    expect(err).toBeInstanceOf(LibraryUpdateEmptyError);
    expect((err as LibraryUpdateEmptyError).status).toBe(400);
    expect((err as LibraryUpdateEmptyError).code).toBe('library-update-empty');
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('throws LibraryNotFoundError (404) when repo.update returns null', async () => {
    vi.mocked(repo.update).mockResolvedValue(null);

    const err = await handler
      .execute(new UpdateLibraryCommand('missing', { name: 'New Name' }))
      .catch((error: unknown) => error);

    expect(err).toBeInstanceOf(LibraryNotFoundError);
    expect((err as LibraryNotFoundError).status).toBe(404);
    expect((err as LibraryNotFoundError).code).toBe('library-not-found');
  });

  it('returns LibraryDto on happy path', async () => {
    const updated = makeLibrary({ id: 'lib-1', name: 'New Name' });
    vi.mocked(repo.update).mockResolvedValue(updated);

    const result = await handler.execute(new UpdateLibraryCommand('lib-1', { name: 'New Name' }));

    expect(result.id).toBe('lib-1');
    expect(result.name).toBe('New Name');
    expect(typeof result.createdAt).toBe('string');
    expect(typeof result.updatedAt).toBe('string');
    expect(repo.update).toHaveBeenCalledWith('lib-1', { name: 'New Name' });
  });

  it('forwards only the name field to the repository', async () => {
    const updated = makeLibrary({ name: 'Renamed' });
    vi.mocked(repo.update).mockResolvedValue(updated);

    await handler.execute(new UpdateLibraryCommand('lib-1', { name: 'Renamed' }));

    const [, patch] = vi.mocked(repo.update).mock.calls[0]!;
    expect(patch).toEqual({ name: 'Renamed' });
  });
});
