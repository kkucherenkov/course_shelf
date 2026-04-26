import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccessGrant } from '../../domain/grant/grant';

import { ListUserGrantsQuery } from './list-user-grants.query';
import { ListUserGrantsHandler } from './list-user-grants.handler';

import type { GrantRepository } from '../../domain/grant/grant.repository';

function makeRepo(): GrantRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findManyByUser: vi.fn<(userId: string) => Promise<AccessGrant[]>>().mockResolvedValue([]),
    delete: vi.fn(),
  };
}

function makeGrant(overrides: Partial<{ id: string; userId: string }> = {}): AccessGrant {
  return AccessGrant.reconstitute({
    id: (overrides.id ?? 'grant-1') as ReturnType<typeof AccessGrant.reconstitute>['id'],
    userId: overrides.userId ?? 'user-1',
    target: { kind: 'library', libraryId: 'lib-1' },
    level: 'READ',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

describe('ListUserGrantsHandler', () => {
  let repo: GrantRepository;
  let handler: ListUserGrantsHandler;

  beforeEach(() => {
    repo = makeRepo();
    handler = new ListUserGrantsHandler(repo);
  });

  it('returns empty array when user has no grants', async () => {
    vi.mocked(repo.findManyByUser).mockResolvedValue([]);

    const result = await handler.execute(new ListUserGrantsQuery('user-1'));

    expect(result).toEqual([]);
    expect(repo.findManyByUser).toHaveBeenCalledWith('user-1');
  });

  it('maps each AccessGrant aggregate to AccessGrantDto', async () => {
    const grant = makeGrant({ id: 'grant-1', userId: 'user-1' });
    vi.mocked(repo.findManyByUser).mockResolvedValue([grant]);

    const result = await handler.execute(new ListUserGrantsQuery('user-1'));

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'grant-1',
      userId: 'user-1',
      target: { kind: 'library', libraryId: 'lib-1' },
      level: 'READ',
    });
    expect(typeof result[0]?.createdAt).toBe('string');
  });

  it('returns all grants from the repository', async () => {
    const grants = [makeGrant({ id: 'grant-1' }), makeGrant({ id: 'grant-2' })];
    vi.mocked(repo.findManyByUser).mockResolvedValue(grants);

    const result = await handler.execute(new ListUserGrantsQuery('user-1'));

    expect(result).toHaveLength(2);
  });
});
