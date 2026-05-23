import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Studio } from '../../domain/studio/studio';
import { StudioSlugAlreadyTakenError } from '../../domain/studio/studio.errors';
import { UpsertStudioCommand } from './upsert-studio.command';
import { UpsertStudioHandler } from './upsert-studio.handler';

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

function makeStudio(overrides?: { slug?: string; displayName?: string }): Studio {
  const props: Parameters<typeof Studio.create>[0] = {
    id: 'studio-1',
    displayName: overrides?.displayName ?? 'Acme Studio',
    now: new Date('2026-01-01T00:00:00.000Z'),
  };
  if (overrides?.slug !== undefined) props.slug = overrides.slug;
  return Studio.create(props);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('UpsertStudioHandler', () => {
  let repo: StudioRepository;
  let handler: UpsertStudioHandler;

  beforeEach(() => {
    repo = makeRepo();
    handler = new UpsertStudioHandler(repo);
  });

  it('creates a new studio when no slug or external-id match exists', async () => {
    vi.mocked(repo.findBySlug).mockResolvedValue(null);
    vi.mocked(repo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new UpsertStudioCommand('Acme Studio', undefined, undefined),
    );

    expect(result.displayName).toBe('Acme Studio');
    expect(result.slug).toBe('acme-studio');
    expect(repo.save).toHaveBeenCalledOnce();
  });

  it('derives slug automatically from displayName when slug is not provided', async () => {
    vi.mocked(repo.findBySlug).mockResolvedValue(null);
    vi.mocked(repo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new UpsertStudioCommand('Film House', undefined, undefined),
    );

    expect(result.slug).toBe('film-house');
  });

  it('uses the provided slug instead of auto-deriving', async () => {
    vi.mocked(repo.findBySlug).mockResolvedValue(null);
    vi.mocked(repo.save).mockResolvedValue(undefined);

    const result = await handler.execute(new UpsertStudioCommand('Acme Studio', 'acme', undefined));

    expect(result.slug).toBe('acme');
  });

  it('updates existing studio when found by slug', async () => {
    const existing = makeStudio();
    vi.mocked(repo.findBySlug).mockResolvedValue(existing);
    vi.mocked(repo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new UpsertStudioCommand('Acme Studios Ltd.', undefined, undefined),
    );

    expect(result).toBe(existing);
    expect(result.displayName).toBe('Acme Studios Ltd.');
    expect(repo.save).toHaveBeenCalledWith(existing);
    expect(repo.findByExternalId).not.toHaveBeenCalled();
  });

  it('updates existing studio when found by external id (no slug supplied)', async () => {
    const existing = makeStudio({ slug: 'existing-slug' });
    vi.mocked(repo.findBySlug).mockResolvedValue(null);
    vi.mocked(repo.findByExternalId).mockResolvedValue(existing);
    vi.mocked(repo.save).mockResolvedValue(undefined);

    const externalIds = [{ source: 'imdb', externalId: 'co123' }];
    const result = await handler.execute(
      new UpsertStudioCommand('Updated Name', undefined, externalIds),
    );

    expect(result).toBe(existing);
    expect(result.displayName).toBe('Updated Name');
    expect(repo.findByExternalId).toHaveBeenCalledWith('imdb', 'co123');
  });

  it('replaces (not merges) externalIds on update', async () => {
    const existing = Studio.create({
      id: 'studio-1',
      displayName: 'Acme Studio',
      externalIds: [{ source: 'old-source', externalId: 'old-id' }],
    });
    vi.mocked(repo.findBySlug).mockResolvedValue(existing);
    vi.mocked(repo.save).mockResolvedValue(undefined);

    const newExternalIds = [{ source: 'imdb', externalId: 'co456' }];
    await handler.execute(new UpsertStudioCommand('Acme Studio', undefined, newExternalIds));

    expect(existing.externalIds).toHaveLength(1);
    expect(existing.externalIds[0]).toMatchObject({ source: 'imdb', externalId: 'co456' });
  });

  it('propagates StudioSlugAlreadyTakenError from the adapter', async () => {
    const existing = makeStudio();
    vi.mocked(repo.findBySlug).mockResolvedValue(existing);
    vi.mocked(repo.save).mockRejectedValue(new StudioSlugAlreadyTakenError('taken-slug'));

    await expect(
      handler.execute(new UpsertStudioCommand('Acme Studio', 'taken-slug', undefined)),
    ).rejects.toBeInstanceOf(StudioSlugAlreadyTakenError);
  });

  it('skips external-id lookup when externalIds is empty', async () => {
    vi.mocked(repo.findBySlug).mockResolvedValue(null);
    vi.mocked(repo.save).mockResolvedValue(undefined);

    await handler.execute(new UpsertStudioCommand('Acme Studio', undefined, []));

    expect(repo.findByExternalId).not.toHaveBeenCalled();
  });
});
