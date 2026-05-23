import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Tag } from '../../domain/tag/tag';
import { TagSlugAlreadyTakenError } from '../../domain/tag/tag.errors';
import { UpsertTagCommand } from './upsert-tag.command';
import { UpsertTagHandler } from './upsert-tag.handler';

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

function makeTag(overrides?: {
  slug?: string;
  displayName?: string;
  category?: string | null;
}): Tag {
  const props: Parameters<typeof Tag.create>[0] = {
    id: 'tag-1',
    displayName: overrides?.displayName ?? 'TypeScript',
    category: overrides?.category ?? null,
    now: new Date('2026-01-01T00:00:00.000Z'),
  };
  if (overrides?.slug !== undefined) props.slug = overrides.slug;
  return Tag.create(props);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('UpsertTagHandler', () => {
  let repo: TagRepository;
  let handler: UpsertTagHandler;

  beforeEach(() => {
    repo = makeRepo();
    handler = new UpsertTagHandler(repo);
  });

  it('creates a new tag when no slug or external-id match exists', async () => {
    vi.mocked(repo.findBySlug).mockResolvedValue(null);
    vi.mocked(repo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new UpsertTagCommand('TypeScript', undefined, null, undefined),
    );

    expect(result.displayName).toBe('TypeScript');
    expect(result.slug).toBe('typescript');
    expect(result.category).toBeNull();
    expect(repo.save).toHaveBeenCalledOnce();
  });

  it('creates a new tag with a category', async () => {
    vi.mocked(repo.findBySlug).mockResolvedValue(null);
    vi.mocked(repo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new UpsertTagCommand('TypeScript', undefined, 'language', undefined),
    );

    expect(result.category).toBe('language');
  });

  it('derives slug automatically from displayName when slug is not provided', async () => {
    vi.mocked(repo.findBySlug).mockResolvedValue(null);
    vi.mocked(repo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new UpsertTagCommand('React JS', undefined, null, undefined),
    );

    expect(result.slug).toBe('react-js');
  });

  it('uses the provided slug instead of auto-deriving', async () => {
    vi.mocked(repo.findBySlug).mockResolvedValue(null);
    vi.mocked(repo.save).mockResolvedValue(undefined);

    const result = await handler.execute(new UpsertTagCommand('TypeScript', 'ts', null, undefined));

    expect(result.slug).toBe('ts');
  });

  it('updates existing tag when found by slug', async () => {
    const existing = makeTag();
    vi.mocked(repo.findBySlug).mockResolvedValue(existing);
    vi.mocked(repo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new UpsertTagCommand('TypeScript 5', undefined, 'language', undefined),
    );

    expect(result).toBe(existing);
    expect(result.displayName).toBe('TypeScript 5');
    expect(result.category).toBe('language');
    expect(repo.save).toHaveBeenCalledWith(existing);
    expect(repo.findByExternalId).not.toHaveBeenCalled();
  });

  it('does not change category when category is undefined (missing from patch)', async () => {
    const existing = makeTag({ category: 'framework' });
    vi.mocked(repo.findBySlug).mockResolvedValue(existing);
    vi.mocked(repo.save).mockResolvedValue(undefined);

    // category is undefined — should leave the existing category intact
    await handler.execute(new UpsertTagCommand('TypeScript', undefined, undefined, undefined));

    expect(existing.category).toBe('framework');
  });

  it('clears category when null is explicitly passed', async () => {
    const existing = makeTag({ category: 'framework' });
    vi.mocked(repo.findBySlug).mockResolvedValue(existing);
    vi.mocked(repo.save).mockResolvedValue(undefined);

    await handler.execute(new UpsertTagCommand('TypeScript', undefined, null, undefined));

    expect(existing.category).toBeNull();
  });

  it('updates existing tag when found by external id (no slug supplied)', async () => {
    const existing = makeTag({ slug: 'existing-slug' });
    vi.mocked(repo.findBySlug).mockResolvedValue(null);
    vi.mocked(repo.findByExternalId).mockResolvedValue(existing);
    vi.mocked(repo.save).mockResolvedValue(undefined);

    const externalIds = [{ source: 'npm', externalId: 'typescript' }];
    const result = await handler.execute(
      new UpsertTagCommand('Updated Name', undefined, undefined, externalIds),
    );

    expect(result).toBe(existing);
    expect(result.displayName).toBe('Updated Name');
    expect(repo.findByExternalId).toHaveBeenCalledWith('npm', 'typescript');
  });

  it('replaces (not merges) externalIds on update', async () => {
    const existing = Tag.create({
      id: 'tag-1',
      displayName: 'TypeScript',
      externalIds: [{ source: 'old-source', externalId: 'old-id' }],
    });
    vi.mocked(repo.findBySlug).mockResolvedValue(existing);
    vi.mocked(repo.save).mockResolvedValue(undefined);

    const newExternalIds = [{ source: 'npm', externalId: 'typescript' }];
    await handler.execute(new UpsertTagCommand('TypeScript', undefined, null, newExternalIds));

    expect(existing.externalIds).toHaveLength(1);
    expect(existing.externalIds[0]).toMatchObject({ source: 'npm', externalId: 'typescript' });
  });

  it('propagates TagSlugAlreadyTakenError from the adapter', async () => {
    const existing = makeTag();
    vi.mocked(repo.findBySlug).mockResolvedValue(existing);
    vi.mocked(repo.save).mockRejectedValue(new TagSlugAlreadyTakenError('taken-slug'));

    await expect(
      handler.execute(new UpsertTagCommand('TypeScript', 'taken-slug', null, undefined)),
    ).rejects.toBeInstanceOf(TagSlugAlreadyTakenError);
  });

  it('skips external-id lookup when externalIds is empty', async () => {
    vi.mocked(repo.findBySlug).mockResolvedValue(null);
    vi.mocked(repo.save).mockResolvedValue(undefined);

    await handler.execute(new UpsertTagCommand('TypeScript', undefined, null, []));

    expect(repo.findByExternalId).not.toHaveBeenCalled();
  });
});
