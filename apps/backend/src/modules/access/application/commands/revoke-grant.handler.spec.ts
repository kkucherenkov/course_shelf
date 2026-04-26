import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GrantNotFoundError } from '../../domain/grant/grant.errors';

import { RevokeGrantCommand } from './revoke-grant.command';
import { RevokeGrantHandler } from './revoke-grant.handler';

import type { GrantRepository } from '../../domain/grant/grant.repository';

function makeRepo(): GrantRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findManyByUser: vi.fn(),
    delete: vi.fn<(id: string) => Promise<boolean>>().mockResolvedValue(true),
  };
}

describe('RevokeGrantHandler', () => {
  let repo: GrantRepository;
  let handler: RevokeGrantHandler;

  beforeEach(() => {
    repo = makeRepo();
    handler = new RevokeGrantHandler(repo);
  });

  it('calls repo.delete with the given id', async () => {
    await handler.execute(new RevokeGrantCommand('grant-1'));

    expect(repo.delete).toHaveBeenCalledWith('grant-1');
  });

  it('resolves without error when grant is found', async () => {
    vi.mocked(repo.delete).mockResolvedValue(true);

    await expect(handler.execute(new RevokeGrantCommand('grant-1'))).resolves.toBeUndefined();
  });

  it('throws GrantNotFoundError when repo returns false', async () => {
    vi.mocked(repo.delete).mockResolvedValue(false);

    await expect(handler.execute(new RevokeGrantCommand('missing'))).rejects.toBeInstanceOf(
      GrantNotFoundError,
    );
  });

  it('GrantNotFoundError has status 404 and code grant-not-found', async () => {
    vi.mocked(repo.delete).mockResolvedValue(false);

    const err = await handler
      .execute(new RevokeGrantCommand('missing'))
      .catch((error: unknown) => error);

    expect(err).toBeInstanceOf(GrantNotFoundError);
    expect((err as GrantNotFoundError).status).toBe(404);
    expect((err as GrantNotFoundError).code).toBe('grant-not-found');
  });
});
