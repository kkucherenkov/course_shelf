import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Instructor } from '../../domain/instructor/instructor';
import { ListInstructorsQuery } from './list-instructors.query';
import { ListInstructorsHandler } from './list-instructors.handler';

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

function makeInstructor(id: string, displayName: string): Instructor {
  return Instructor.create({ id, displayName, now: new Date('2026-01-01T00:00:00.000Z') });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ListInstructorsHandler', () => {
  let repo: InstructorRepository;
  let handler: ListInstructorsHandler;

  beforeEach(() => {
    repo = makeRepo();
    // Pass null as the unused _courseRepo placeholder.
    handler = new ListInstructorsHandler(repo, null);
  });

  it('returns a paginated list dto with correct shape', async () => {
    const inst1 = makeInstructor('inst-1', 'Alice');
    const inst2 = makeInstructor('inst-2', 'Bob');

    vi.mocked(repo.count).mockResolvedValue(42);
    vi.mocked(repo.findManyPaginated).mockResolvedValue([inst1, inst2]);
    vi.mocked(repo.findCoursesForInstructor)
      .mockResolvedValueOnce({ courseIds: ['c1', 'c2'], total: 2 })
      .mockResolvedValueOnce({ courseIds: ['c3'], total: 1 });

    const result = await handler.execute(new ListInstructorsQuery(0, 20));

    expect(result.total).toBe(42);
    expect(result.offset).toBe(0);
    expect(result.limit).toBe(20);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({ id: 'inst-1', coursesTotal: 2 });
    expect(result.items[1]).toMatchObject({ id: 'inst-2', coursesTotal: 1 });
  });

  it('passes search parameter to both count and findManyPaginated', async () => {
    vi.mocked(repo.count).mockResolvedValue(0);
    vi.mocked(repo.findManyPaginated).mockResolvedValue([]);

    await handler.execute(new ListInstructorsQuery(0, 20, 'alice'));

    expect(repo.count).toHaveBeenCalledWith('alice');
    expect(repo.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ offset: 0, limit: 20, search: 'alice' }),
    );
  });

  it('returns an empty list when no instructors exist', async () => {
    vi.mocked(repo.count).mockResolvedValue(0);
    vi.mocked(repo.findManyPaginated).mockResolvedValue([]);

    const result = await handler.execute(new ListInstructorsQuery(0, 20));

    expect(result.total).toBe(0);
    expect(result.items).toHaveLength(0);
  });

  it('passes pagination offset to the dto', async () => {
    const inst = makeInstructor('inst-1', 'Alice');
    vi.mocked(repo.count).mockResolvedValue(100);
    vi.mocked(repo.findManyPaginated).mockResolvedValue([inst]);
    vi.mocked(repo.findCoursesForInstructor).mockResolvedValue({ courseIds: [], total: 0 });

    const result = await handler.execute(new ListInstructorsQuery(40, 20));

    expect(result.offset).toBe(40);
    expect(result.limit).toBe(20);
  });
});
