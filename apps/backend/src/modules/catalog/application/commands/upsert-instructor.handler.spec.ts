import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Instructor } from '../../domain/instructor/instructor';
import { InstructorSlugAlreadyTakenError } from '../../domain/instructor/instructor.errors';
import { UpsertInstructorCommand } from './upsert-instructor.command';
import { UpsertInstructorHandler } from './upsert-instructor.handler';

import type { InstructorRepository } from '../../domain/instructor/instructor.repository';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRepo(): InstructorRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findBySlug: vi.fn(),
    findByExternalId: vi.fn(),
    findManyByIds: vi.fn(),
    findManyPaginated: vi.fn(),
    count: vi.fn(),
    findCoursesForInstructor: vi.fn(),
  };
}

function makeInstructor(overrides?: { slug?: string; displayName?: string }): Instructor {
  const props: Parameters<typeof Instructor.create>[0] = {
    id: 'inst-1',
    displayName: overrides?.displayName ?? 'John Doe',
    now: new Date('2026-01-01T00:00:00.000Z'),
  };
  if (overrides?.slug !== undefined) props.slug = overrides.slug;
  return Instructor.create(props);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('UpsertInstructorHandler', () => {
  let repo: InstructorRepository;
  let handler: UpsertInstructorHandler;

  beforeEach(() => {
    repo = makeRepo();
    handler = new UpsertInstructorHandler(repo);
  });

  it('creates a new instructor when no slug or external-id match exists', async () => {
    vi.mocked(repo.findBySlug).mockResolvedValue(null);
    vi.mocked(repo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new UpsertInstructorCommand('John Doe', undefined, undefined),
    );

    expect(result.displayName).toBe('John Doe');
    expect(result.slug).toBe('john-doe');
    expect(repo.save).toHaveBeenCalledOnce();
  });

  it('derives slug automatically from displayName when slug is not provided', async () => {
    vi.mocked(repo.findBySlug).mockResolvedValue(null);
    vi.mocked(repo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new UpsertInstructorCommand('Jane Smith', undefined, undefined),
    );

    expect(result.slug).toBe('jane-smith');
  });

  it('uses the provided slug instead of auto-deriving', async () => {
    vi.mocked(repo.findBySlug).mockResolvedValue(null);
    vi.mocked(repo.save).mockResolvedValue(undefined);

    const result = await handler.execute(new UpsertInstructorCommand('John Doe', 'jd', undefined));

    expect(result.slug).toBe('jd');
  });

  it('updates existing instructor when found by slug', async () => {
    const existing = makeInstructor();
    vi.mocked(repo.findBySlug).mockResolvedValue(existing);
    vi.mocked(repo.save).mockResolvedValue(undefined);

    const result = await handler.execute(
      new UpsertInstructorCommand('John D.', undefined, undefined),
    );

    expect(result).toBe(existing);
    expect(result.displayName).toBe('John D.');
    expect(repo.save).toHaveBeenCalledWith(existing);
    // findByExternalId should not be called when slug match succeeds
    expect(repo.findByExternalId).not.toHaveBeenCalled();
  });

  it('updates existing instructor when found by external id (no slug supplied)', async () => {
    const existing = makeInstructor({ slug: 'existing-slug' });
    vi.mocked(repo.findBySlug).mockResolvedValue(null);
    vi.mocked(repo.findByExternalId).mockResolvedValue(existing);
    vi.mocked(repo.save).mockResolvedValue(undefined);

    const externalIds = [{ source: 'youtube', externalId: 'UC123' }];
    const result = await handler.execute(
      new UpsertInstructorCommand('Updated Name', undefined, externalIds),
    );

    expect(result).toBe(existing);
    expect(result.displayName).toBe('Updated Name');
    expect(repo.findByExternalId).toHaveBeenCalledWith('youtube', 'UC123');
  });

  it('replaces (not merges) externalIds on update', async () => {
    const existing = Instructor.create({
      id: 'inst-1',
      displayName: 'John Doe',
      externalIds: [{ source: 'old-source', externalId: 'old-id' }],
    });
    vi.mocked(repo.findBySlug).mockResolvedValue(existing);
    vi.mocked(repo.save).mockResolvedValue(undefined);

    const newExternalIds = [{ source: 'youtube', externalId: 'UC123' }];
    await handler.execute(new UpsertInstructorCommand('John Doe', undefined, newExternalIds));

    expect(existing.externalIds).toHaveLength(1);
    expect(existing.externalIds[0]).toMatchObject({ source: 'youtube', externalId: 'UC123' });
  });

  it('clears externalIds when empty array is passed on update', async () => {
    const existing = Instructor.create({
      id: 'inst-1',
      displayName: 'John Doe',
      externalIds: [{ source: 'youtube', externalId: 'UC123' }],
    });
    vi.mocked(repo.findBySlug).mockResolvedValue(existing);
    vi.mocked(repo.save).mockResolvedValue(undefined);

    await handler.execute(new UpsertInstructorCommand('John Doe', undefined, []));

    expect(existing.externalIds).toHaveLength(0);
  });

  it('propagates InstructorSlugAlreadyTakenError from the adapter', async () => {
    const existing = makeInstructor();
    vi.mocked(repo.findBySlug).mockResolvedValue(existing);
    vi.mocked(repo.save).mockRejectedValue(new InstructorSlugAlreadyTakenError('taken-slug'));

    await expect(
      handler.execute(new UpsertInstructorCommand('John Doe', 'taken-slug', undefined)),
    ).rejects.toBeInstanceOf(InstructorSlugAlreadyTakenError);
  });

  it('skips external-id lookup when externalIds is empty', async () => {
    vi.mocked(repo.findBySlug).mockResolvedValue(null);
    vi.mocked(repo.save).mockResolvedValue(undefined);

    await handler.execute(new UpsertInstructorCommand('John Doe', undefined, []));

    expect(repo.findByExternalId).not.toHaveBeenCalled();
  });
});
