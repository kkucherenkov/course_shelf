import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Library } from '../../domain/library/library';
import { ListLibrariesQuery } from './list-libraries.query';
import { ListLibrariesHandler } from './list-libraries.handler';

import type { LibraryRepository } from '../../domain/library/library.repository';

function makeRepo(): LibraryRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
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

describe('ListLibrariesHandler', () => {
  let repo: LibraryRepository;
  let handler: ListLibrariesHandler;

  beforeEach(() => {
    repo = makeRepo();
    handler = new ListLibrariesHandler(repo);
  });

  it('returns empty array when repository has no libraries', async () => {
    vi.mocked(repo.findAll).mockResolvedValue([]);

    const result = await handler.execute(new ListLibrariesQuery());

    expect(result).toEqual([]);
  });

  it('maps each Library aggregate to a LibraryDto', async () => {
    const lib = makeLibrary({ id: 'lib-1', name: 'Books', rootPath: '/media/books' });
    vi.mocked(repo.findAll).mockResolvedValue([lib]);

    const result = await handler.execute(new ListLibrariesQuery());

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

    const result = await handler.execute(new ListLibrariesQuery());

    expect(result).toHaveLength(2);
  });
});
