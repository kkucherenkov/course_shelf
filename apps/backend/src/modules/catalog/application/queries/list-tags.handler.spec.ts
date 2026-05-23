import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Tag } from '../../domain/tag/tag';
import { ListTagsQuery } from './list-tags.query';
import { ListTagsHandler } from './list-tags.handler';

import type { TagRepository } from '../../domain/tag/tag.repository';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRepo(): TagRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findBySlug: vi.fn(),
    findByExternalId: vi.fn(),
    findManyByIds: vi.fn(),
    findManyPaginated: vi.fn(),
    count: vi.fn(),
    findCoursesForTag: vi.fn(),
  };
}

function makeTag(id: string, displayName: string, category: string | null = null): Tag {
  return Tag.create({ id, displayName, category, now: new Date('2026-01-01T00:00:00.000Z') });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ListTagsHandler', () => {
  let repo: TagRepository;
  let handler: ListTagsHandler;

  beforeEach(() => {
    repo = makeRepo();
    handler = new ListTagsHandler(repo, null);
  });

  it('returns a paginated list dto with correct shape', async () => {
    const t1 = makeTag('tag-1', 'TypeScript', 'language');
    const t2 = makeTag('tag-2', 'React', 'framework');

    vi.mocked(repo.count).mockResolvedValue(5);
    vi.mocked(repo.findManyPaginated).mockResolvedValue([t1, t2]);
    vi.mocked(repo.findCoursesForTag)
      .mockResolvedValueOnce({ courseIds: ['c1', 'c2'], total: 2 })
      .mockResolvedValueOnce({ courseIds: ['c3'], total: 1 });

    const result = await handler.execute(new ListTagsQuery(0, 20));

    expect(result.total).toBe(5);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({ id: 'tag-1', category: 'language', coursesTotal: 2 });
    expect(result.items[1]).toMatchObject({ id: 'tag-2', category: 'framework', coursesTotal: 1 });
  });

  it('passes category filter to count and findManyPaginated', async () => {
    vi.mocked(repo.count).mockResolvedValue(0);
    vi.mocked(repo.findManyPaginated).mockResolvedValue([]);

    await handler.execute(new ListTagsQuery(0, 20, undefined, 'language'));

    expect(repo.count).toHaveBeenCalledWith({ category: 'language' });
    expect(repo.findManyPaginated).toHaveBeenCalledWith({
      offset: 0,
      limit: 20,
      category: 'language',
    });
  });

  it('passes search and category together', async () => {
    vi.mocked(repo.count).mockResolvedValue(0);
    vi.mocked(repo.findManyPaginated).mockResolvedValue([]);

    await handler.execute(new ListTagsQuery(0, 20, 'type', 'language'));

    expect(repo.count).toHaveBeenCalledWith({ search: 'type', category: 'language' }); // both present → both included
  });

  it('returns empty list when no tags exist', async () => {
    vi.mocked(repo.count).mockResolvedValue(0);
    vi.mocked(repo.findManyPaginated).mockResolvedValue([]);

    const result = await handler.execute(new ListTagsQuery(0, 20));

    expect(result.total).toBe(0);
    expect(result.items).toHaveLength(0);
  });

  it('null category on tag is preserved in dto', async () => {
    const t = makeTag('tag-1', 'General', null);
    vi.mocked(repo.count).mockResolvedValue(1);
    vi.mocked(repo.findManyPaginated).mockResolvedValue([t]);
    vi.mocked(repo.findCoursesForTag).mockResolvedValue({ courseIds: [], total: 0 });

    const result = await handler.execute(new ListTagsQuery(0, 20));

    expect(result.items[0]?.category).toBeNull();
  });
});
