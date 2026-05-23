import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Studio } from '../../domain/studio/studio';
import { ListStudiosQuery } from './list-studios.query';
import { ListStudiosHandler } from './list-studios.handler';

import type { StudioRepository } from '../../domain/studio/studio.repository';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRepo(): StudioRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findBySlug: vi.fn(),
    findByExternalId: vi.fn(),
    findManyByIds: vi.fn(),
    findManyPaginated: vi.fn(),
    count: vi.fn(),
    findCoursesForStudio: vi.fn(),
  };
}

function makeStudio(id: string, displayName: string): Studio {
  return Studio.create({ id, displayName, now: new Date('2026-01-01T00:00:00.000Z') });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ListStudiosHandler', () => {
  let repo: StudioRepository;
  let handler: ListStudiosHandler;

  beforeEach(() => {
    repo = makeRepo();
    handler = new ListStudiosHandler(repo, null);
  });

  it('returns a paginated list dto with correct shape', async () => {
    const s1 = makeStudio('studio-1', 'Acme');
    const s2 = makeStudio('studio-2', 'Beta');

    vi.mocked(repo.count).mockResolvedValue(10);
    vi.mocked(repo.findManyPaginated).mockResolvedValue([s1, s2]);
    vi.mocked(repo.findCoursesForStudio)
      .mockResolvedValueOnce({ courseIds: ['c1'], total: 1 })
      .mockResolvedValueOnce({ courseIds: [], total: 0 });

    const result = await handler.execute(new ListStudiosQuery(0, 20));

    expect(result.total).toBe(10);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({ id: 'studio-1', coursesTotal: 1 });
    expect(result.items[1]).toMatchObject({ id: 'studio-2', coursesTotal: 0 });
  });

  it('passes search parameter to count and findManyPaginated', async () => {
    vi.mocked(repo.count).mockResolvedValue(0);
    vi.mocked(repo.findManyPaginated).mockResolvedValue([]);

    await handler.execute(new ListStudiosQuery(0, 20, 'acme'));

    expect(repo.count).toHaveBeenCalledWith('acme');
    expect(repo.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ offset: 0, limit: 20, search: 'acme' }),
    );
  });

  it('returns empty list when no studios exist', async () => {
    vi.mocked(repo.count).mockResolvedValue(0);
    vi.mocked(repo.findManyPaginated).mockResolvedValue([]);

    const result = await handler.execute(new ListStudiosQuery(0, 20));

    expect(result.total).toBe(0);
    expect(result.items).toHaveLength(0);
  });
});
