import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GrantNotFoundError } from '../../domain/grant/grant.errors';
import { AccessGrant } from '../../domain/grant/grant';

import { RevokeGrantCommand } from './revoke-grant.command';
import { RevokeGrantHandler } from './revoke-grant.handler';

import type { GrantRepository } from '../../domain/grant/grant.repository';
import type { AuthorizationService } from '../../../../common/access/authorization.service';
import type { GrantId } from '../../domain/grant/grant';

function makeGrant(id: string, userId: string): AccessGrant {
  return AccessGrant.reconstitute({
    id: id as GrantId,
    userId,
    target: { kind: 'library', libraryId: 'lib-1' },
    level: 'READ',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

function makeRepo(grant: AccessGrant | null = null): GrantRepository {
  return {
    save: vi.fn(),
    findById: vi.fn<(id: string) => Promise<AccessGrant | null>>().mockResolvedValue(grant),
    findManyByUser: vi.fn(),
    delete: vi.fn<(id: string) => Promise<boolean>>().mockResolvedValue(true),
  };
}

function makeAuthz(): AuthorizationService {
  return {
    canSee: vi.fn().mockResolvedValue(true),
    invalidate: vi.fn(),
  };
}

describe('RevokeGrantHandler', () => {
  let repo: GrantRepository;
  let authz: AuthorizationService;
  let handler: RevokeGrantHandler;

  describe('when grant exists', () => {
    beforeEach(() => {
      const grant = makeGrant('grant-1', 'user-1');
      repo = makeRepo(grant);
      authz = makeAuthz();
      handler = new RevokeGrantHandler(repo, authz);
    });

    it('calls repo.delete with the given id', async () => {
      await handler.execute(new RevokeGrantCommand('grant-1'));

      expect(repo.delete).toHaveBeenCalledWith('grant-1');
    });

    it('resolves without error when grant is found and deleted', async () => {
      await expect(handler.execute(new RevokeGrantCommand('grant-1'))).resolves.toBeUndefined();
    });

    it('calls authz.invalidate with the userId after a successful delete', async () => {
      await handler.execute(new RevokeGrantCommand('grant-1'));

      expect(authz.invalidate).toHaveBeenCalledOnce();
      expect(authz.invalidate).toHaveBeenCalledWith('user-1');
    });
  });

  describe('when grant does not exist (findById returns null)', () => {
    beforeEach(() => {
      repo = makeRepo(null); // findById returns null
      authz = makeAuthz();
      handler = new RevokeGrantHandler(repo, authz);
    });

    it('throws GrantNotFoundError when repo returns null from findById', async () => {
      await expect(handler.execute(new RevokeGrantCommand('missing'))).rejects.toBeInstanceOf(
        GrantNotFoundError,
      );
    });

    it('does not call authz.invalidate when grant is not found', async () => {
      await expect(handler.execute(new RevokeGrantCommand('missing'))).rejects.toBeInstanceOf(
        GrantNotFoundError,
      );

      expect(authz.invalidate).not.toHaveBeenCalled();
    });

    it('GrantNotFoundError has status 404 and code grant-not-found', async () => {
      const err = await handler
        .execute(new RevokeGrantCommand('missing'))
        .catch((error: unknown) => error);

      expect(err).toBeInstanceOf(GrantNotFoundError);
      expect((err as GrantNotFoundError).status).toBe(404);
      expect((err as GrantNotFoundError).code).toBe('grant-not-found');
    });
  });

  describe('when delete returns false (concurrent race)', () => {
    beforeEach(() => {
      const grant = makeGrant('grant-1', 'user-1');
      repo = makeRepo(grant);
      vi.mocked(repo.delete).mockResolvedValue(false);
      authz = makeAuthz();
      handler = new RevokeGrantHandler(repo, authz);
    });

    it('throws GrantNotFoundError when delete returns false', async () => {
      await expect(handler.execute(new RevokeGrantCommand('grant-1'))).rejects.toBeInstanceOf(
        GrantNotFoundError,
      );
    });
  });
});
