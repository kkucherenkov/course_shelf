import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GrantAlreadyExistsError } from '../../domain/grant/grant.errors';

import { RegisterGrantCommand } from './register-grant.command';
import { RegisterGrantHandler } from './register-grant.handler';

import type { GrantRepository } from '../../domain/grant/grant.repository';
import type { AccessGrant } from '../../domain/grant/grant';

function makeRepo(): GrantRepository {
  return {
    save: vi.fn<(grant: AccessGrant) => Promise<void>>().mockResolvedValue(undefined),
    findById: vi.fn(),
    findManyByUser: vi.fn(),
    delete: vi.fn(),
  };
}

describe('RegisterGrantHandler', () => {
  let repo: GrantRepository;
  let handler: RegisterGrantHandler;

  beforeEach(() => {
    repo = makeRepo();
    handler = new RegisterGrantHandler(repo);
  });

  it('calls repo.save with the registered aggregate', async () => {
    const result = await handler.execute(
      new RegisterGrantCommand('user-1', { kind: 'library', libraryId: 'lib-1' }, 'READ'),
    );

    expect(repo.save).toHaveBeenCalledOnce();
    const saved = vi.mocked(repo.save).mock.calls[0]?.[0];
    expect(saved?.userId).toBe('user-1');
    expect(saved?.target).toEqual({ kind: 'library', libraryId: 'lib-1' });
    expect(saved?.level).toBe('READ');
    expect(result.id).toBe(saved?.id);
  });

  it('returns { id } matching the saved aggregate id', async () => {
    const result = await handler.execute(
      new RegisterGrantCommand('user-1', { kind: 'course', courseId: 'course-1' }, 'READ'),
    );

    expect(typeof result.id).toBe('string');
    expect(result.id.length).toBeGreaterThan(0);
  });

  it('rethrows GrantAlreadyExistsError from the repository', async () => {
    vi.mocked(repo.save).mockRejectedValue(new GrantAlreadyExistsError());

    await expect(
      handler.execute(
        new RegisterGrantCommand('user-1', { kind: 'library', libraryId: 'lib-1' }, 'READ'),
      ),
    ).rejects.toBeInstanceOf(GrantAlreadyExistsError);
  });
});
