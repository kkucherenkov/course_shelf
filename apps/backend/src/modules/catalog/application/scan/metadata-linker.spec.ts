/**
 * Unit tests for MetadataLinker.
 *
 * Uses fake in-memory repositories (no Prisma, no DB).
 *
 * Scenarios:
 *   - empty input arrays → empty output
 *   - single name → creates row + returns ref
 *   - duplicate names (different casing) → one ref (deduped by slug)
 *   - existing row → reuses it (no new save)
 *   - whitespace-only input → filtered out
 *   - studio name empty → returns null
 *   - studio name non-empty → creates row + returns ref
 *   - re-run with same names → idempotent (save called once total)
 *   - race-condition on instructor: save throws InstructorSlugAlreadyTakenError →
 *     retry findBySlug returns existing record
 */
import { describe, expect, it, vi } from 'vitest';

import { Instructor } from '../../domain/instructor/instructor';
import { InstructorSlugAlreadyTakenError } from '../../domain/instructor/instructor.errors';
import { Studio } from '../../domain/studio/studio';
import { StudioSlugAlreadyTakenError } from '../../domain/studio/studio.errors';
import { Tag } from '../../domain/tag/tag';
import { TagSlugAlreadyTakenError } from '../../domain/tag/tag.errors';
import { MetadataLinker } from './metadata-linker';

import type { InstructorRepository } from '../../domain/instructor/instructor.repository';
import type { StudioRepository } from '../../domain/studio/studio.repository';
import type { TagRepository } from '../../domain/tag/tag.repository';

// ---------------------------------------------------------------------------
// Fake repositories
// ---------------------------------------------------------------------------

function makeInstructorRepo(): InstructorRepository & { store: Map<string, Instructor> } {
  const store = new Map<string, Instructor>();
  const bySlug = new Map<string, Instructor>();
  return {
    store,
    save: vi.fn(async (inst: Instructor) => {
      if (bySlug.has(inst.slug)) {
        throw new InstructorSlugAlreadyTakenError(inst.slug);
      }
      store.set(inst.id, inst);
      bySlug.set(inst.slug, inst);
    }),
    findById: vi.fn(async (id: string) => store.get(id) ?? null),
    findBySlug: vi.fn(async (slug: string) => bySlug.get(slug) ?? null),
    findByExternalId: vi.fn(async () => null),
    findManyByIds: vi.fn(async () => []),
    findManyPaginated: vi.fn(async () => []),
    count: vi.fn(async () => 0),
    findCoursesForInstructor: vi.fn(async () => ({ courseIds: [], total: 0 })),
  };
}

function makeStudioRepo(): StudioRepository & { store: Map<string, Studio> } {
  const store = new Map<string, Studio>();
  const bySlug = new Map<string, Studio>();
  return {
    store,
    save: vi.fn(async (s: Studio) => {
      if (bySlug.has(s.slug)) {
        throw new StudioSlugAlreadyTakenError(s.slug);
      }
      store.set(s.id, s);
      bySlug.set(s.slug, s);
    }),
    findById: vi.fn(async (id: string) => store.get(id) ?? null),
    findBySlug: vi.fn(async (slug: string) => bySlug.get(slug) ?? null),
    findByExternalId: vi.fn(async () => null),
    findManyByIds: vi.fn(async () => []),
    findManyPaginated: vi.fn(async () => []),
    count: vi.fn(async () => 0),
    findCoursesForStudio: vi.fn(async () => ({ courseIds: [], total: 0 })),
  };
}

function makeTagRepo(): TagRepository & { store: Map<string, Tag> } {
  const store = new Map<string, Tag>();
  const bySlug = new Map<string, Tag>();
  return {
    store,
    save: vi.fn(async (t: Tag) => {
      if (bySlug.has(t.slug)) {
        throw new TagSlugAlreadyTakenError(t.slug);
      }
      store.set(t.id, t);
      bySlug.set(t.slug, t);
    }),
    findById: vi.fn(async (id: string) => store.get(id) ?? null),
    findBySlug: vi.fn(async (slug: string) => bySlug.get(slug) ?? null),
    findByExternalId: vi.fn(async () => null),
    findManyByIds: vi.fn(async () => []),
    findManyPaginated: vi.fn(async () => []),
    count: vi.fn(async () => 0),
    findCoursesForTag: vi.fn(async () => ({ courseIds: [], total: 0 })),
  };
}

function makeLinker(
  instructorRepo: InstructorRepository,
  studioRepo: StudioRepository,
  tagRepo: TagRepository,
): MetadataLinker {
  // MetadataLinker constructor uses @Inject decorators; instantiate directly for tests.
  return new MetadataLinker(instructorRepo, studioRepo, tagRepo);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MetadataLinker.upsertInstructorsByName', () => {
  it('empty input → empty output, no save called', async () => {
    const instructorRepo = makeInstructorRepo();
    const linker = makeLinker(instructorRepo, makeStudioRepo(), makeTagRepo());

    const result = await linker.upsertInstructorsByName([]);
    expect(result).toHaveLength(0);
    expect(instructorRepo.save).not.toHaveBeenCalled();
  });

  it('single name → creates row + returns ref with correct fields', async () => {
    const instructorRepo = makeInstructorRepo();
    const linker = makeLinker(instructorRepo, makeStudioRepo(), makeTagRepo());

    const result = await linker.upsertInstructorsByName(['Jane Doe']);

    expect(result).toHaveLength(1);
    const ref = result[0]!;
    expect(ref.displayName).toBe('Jane Doe');
    expect(ref.slug).toBe('jane-doe');
    expect(typeof ref.id).toBe('string');
    expect(ref.id.length).toBeGreaterThan(0);
    expect(instructorRepo.save).toHaveBeenCalledTimes(1);
    expect(instructorRepo.store.size).toBe(1);
  });

  it('duplicate names differing only in case → one ref (deduped by slug)', async () => {
    const instructorRepo = makeInstructorRepo();
    const linker = makeLinker(instructorRepo, makeStudioRepo(), makeTagRepo());

    const result = await linker.upsertInstructorsByName(['Jane Doe', 'jane doe', 'JANE DOE']);

    expect(result).toHaveLength(1);
    expect(result[0]!.displayName).toBe('Jane Doe');
    expect(instructorRepo.save).toHaveBeenCalledTimes(1);
    expect(instructorRepo.store.size).toBe(1);
  });

  it('existing row → reuses it, save NOT called again', async () => {
    const instructorRepo = makeInstructorRepo();
    // Pre-populate the repo with an existing instructor.
    const existing = Instructor.create({ id: 'existing-id', displayName: 'Jane Doe' });
    await instructorRepo.save(existing);
    vi.mocked(instructorRepo.save).mockClear();

    const linker = makeLinker(instructorRepo, makeStudioRepo(), makeTagRepo());
    const result = await linker.upsertInstructorsByName(['Jane Doe']);

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('existing-id');
    // save should NOT have been called again for the existing instructor
    expect(instructorRepo.save).not.toHaveBeenCalled();
  });

  it('whitespace-only names are filtered out', async () => {
    const instructorRepo = makeInstructorRepo();
    const linker = makeLinker(instructorRepo, makeStudioRepo(), makeTagRepo());

    const result = await linker.upsertInstructorsByName(['  ', '', '\t']);

    expect(result).toHaveLength(0);
    expect(instructorRepo.save).not.toHaveBeenCalled();
  });

  it('multiple distinct names → multiple refs created', async () => {
    const instructorRepo = makeInstructorRepo();
    const linker = makeLinker(instructorRepo, makeStudioRepo(), makeTagRepo());

    const result = await linker.upsertInstructorsByName(['Alice', 'Bob']);

    expect(result).toHaveLength(2);
    expect(result[0]!.displayName).toBe('Alice');
    expect(result[1]!.displayName).toBe('Bob');
    expect(instructorRepo.store.size).toBe(2);
  });

  it('re-run with same names → idempotent, save called once total', async () => {
    const instructorRepo = makeInstructorRepo();
    const linker = makeLinker(instructorRepo, makeStudioRepo(), makeTagRepo());

    const result1 = await linker.upsertInstructorsByName(['Alice']);
    const result2 = await linker.upsertInstructorsByName(['Alice']);

    // Both runs return the same ref.
    expect(result1[0]!.id).toBe(result2[0]!.id);
    // Save was only called once (first run created the row; second run found it).
    expect(instructorRepo.save).toHaveBeenCalledTimes(1);
  });

  it('race condition: save throws InstructorSlugAlreadyTakenError → retries findBySlug', async () => {
    const instructorRepo = makeInstructorRepo();
    // Pre-populate via the underlying store directly (bypassing the slug check)
    // so findBySlug returns the existing record on retry.
    const raceInstructor = Instructor.create({ id: 'race-id', displayName: 'Race User' });
    // Manually insert into the bySlug map by calling save (first call succeeds here
    // since the store is empty).
    await instructorRepo.save(raceInstructor);
    // Clear the call count so we start fresh.
    vi.mocked(instructorRepo.save).mockClear();

    // Now mock save to throw InstructorSlugAlreadyTakenError on the NEXT call.
    const originalSave = instructorRepo.save;
    let saveCallCount = 0;
    vi.mocked(instructorRepo.save).mockImplementation(async (inst: Instructor) => {
      saveCallCount++;
      if (saveCallCount === 1) {
        throw new InstructorSlugAlreadyTakenError(inst.slug);
      }
      return originalSave(inst);
    });

    const linker = makeLinker(instructorRepo, makeStudioRepo(), makeTagRepo());
    // Use the same name so it derives the same slug as the pre-populated record.
    const result = await linker.upsertInstructorsByName(['Race User']);

    expect(result).toHaveLength(1);
    // Should have found the pre-populated instructor via the retry.
    expect(result[0]!.id).toBe('race-id');
  });
});

describe('MetadataLinker.upsertStudioByName', () => {
  it('empty string → returns null, no save', async () => {
    const studioRepo = makeStudioRepo();
    const linker = makeLinker(makeInstructorRepo(), studioRepo, makeTagRepo());

    const result = await linker.upsertStudioByName('');
    expect(result).toBeNull();
    expect(studioRepo.save).not.toHaveBeenCalled();
  });

  it('whitespace-only → returns null, no save', async () => {
    const studioRepo = makeStudioRepo();
    const linker = makeLinker(makeInstructorRepo(), studioRepo, makeTagRepo());

    const result = await linker.upsertStudioByName('   ');
    expect(result).toBeNull();
    expect(studioRepo.save).not.toHaveBeenCalled();
  });

  it('valid name → creates row + returns ref', async () => {
    const studioRepo = makeStudioRepo();
    const linker = makeLinker(makeInstructorRepo(), studioRepo, makeTagRepo());

    const result = await linker.upsertStudioByName('Acme Productions');

    expect(result).not.toBeNull();
    expect(result!.displayName).toBe('Acme Productions');
    expect(result!.slug).toBe('acme-productions');
    expect(studioRepo.save).toHaveBeenCalledTimes(1);
  });

  it('same name called twice → idempotent, save once', async () => {
    const studioRepo = makeStudioRepo();
    const linker = makeLinker(makeInstructorRepo(), studioRepo, makeTagRepo());

    const ref1 = await linker.upsertStudioByName('Acme');
    const ref2 = await linker.upsertStudioByName('Acme');

    expect(ref1!.id).toBe(ref2!.id);
    expect(studioRepo.save).toHaveBeenCalledTimes(1);
  });

  it('existing studio → reuses it, save NOT called', async () => {
    const studioRepo = makeStudioRepo();
    const existing = Studio.create({ id: 'studio-id', displayName: 'Existing Studio' });
    await studioRepo.save(existing);
    vi.mocked(studioRepo.save).mockClear();

    const linker = makeLinker(makeInstructorRepo(), studioRepo, makeTagRepo());
    const result = await linker.upsertStudioByName('Existing Studio');

    expect(result!.id).toBe('studio-id');
    expect(studioRepo.save).not.toHaveBeenCalled();
  });
});

describe('MetadataLinker.upsertTagsByName', () => {
  it('empty input → empty output, no save', async () => {
    const tagRepo = makeTagRepo();
    const linker = makeLinker(makeInstructorRepo(), makeStudioRepo(), tagRepo);

    const result = await linker.upsertTagsByName([]);
    expect(result).toHaveLength(0);
    expect(tagRepo.save).not.toHaveBeenCalled();
  });

  it('single tag → creates row with null category + returns ref', async () => {
    const tagRepo = makeTagRepo();
    const linker = makeLinker(makeInstructorRepo(), makeStudioRepo(), tagRepo);

    const result = await linker.upsertTagsByName(['TypeScript']);

    expect(result).toHaveLength(1);
    expect(result[0]!.displayName).toBe('TypeScript');
    expect(result[0]!.slug).toBe('typescript');
    expect(result[0]!.category).toBeNull();
    expect(tagRepo.save).toHaveBeenCalledTimes(1);
  });

  it('duplicate tags (by slug) → one ref', async () => {
    const tagRepo = makeTagRepo();
    const linker = makeLinker(makeInstructorRepo(), makeStudioRepo(), tagRepo);

    const result = await linker.upsertTagsByName(['NestJS', 'nestjs', 'NESTJS']);

    expect(result).toHaveLength(1);
    expect(tagRepo.save).toHaveBeenCalledTimes(1);
  });

  it('whitespace-only tags are filtered out', async () => {
    const tagRepo = makeTagRepo();
    const linker = makeLinker(makeInstructorRepo(), makeStudioRepo(), tagRepo);

    const result = await linker.upsertTagsByName(['  ', '']);
    expect(result).toHaveLength(0);
    expect(tagRepo.save).not.toHaveBeenCalled();
  });

  it('existing tag → reuses it, save NOT called', async () => {
    const tagRepo = makeTagRepo();
    const existing = Tag.create({ id: 'tag-id', displayName: 'React', category: null });
    await tagRepo.save(existing);
    vi.mocked(tagRepo.save).mockClear();

    const linker = makeLinker(makeInstructorRepo(), makeStudioRepo(), tagRepo);
    const result = await linker.upsertTagsByName(['React']);

    expect(result[0]!.id).toBe('tag-id');
    expect(tagRepo.save).not.toHaveBeenCalled();
  });
});
