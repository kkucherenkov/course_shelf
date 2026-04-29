import { describe, it, expect, vi } from 'vitest';

import { UpdateAdminUserHandler } from './update-admin-user.handler';
import { UpdateAdminUserCommand } from './update-admin-user.command';
import { EmptyUserPatchError, UserNotFoundError } from '../../domain/admin.errors';

import type { DashboardPort } from '../../domain/dashboard.port';
import type { AdminUserListItem } from '@app/api-client-ts';

function makeItem(overrides: Partial<AdminUserListItem> = {}): AdminUserListItem {
  return {
    id: 'user-1',
    email: 'alice@example.com',
    name: 'Alice',
    displayName: null,
    role: 'user',
    banned: false,
    createdAt: '2026-04-27T09:55:00.000Z',
    updatedAt: '2026-04-27T09:57:00.000Z',
    ...overrides,
  };
}

function makePort(updated: AdminUserListItem | null = makeItem()): DashboardPort {
  return {
    getSnapshot: vi.fn(),
    hasAnyUser: vi.fn(),
    listRecentScans: vi.fn(),
    listAllLibrariesWithCounts: vi.fn(),
    listUsers: vi.fn(),
    updateUser: vi.fn().mockResolvedValue(updated),
  };
}

function makeHandler(port: DashboardPort): UpdateAdminUserHandler {
  return new (UpdateAdminUserHandler as unknown as new (
    p: DashboardPort,
  ) => UpdateAdminUserHandler)(port);
}

describe('UpdateAdminUserHandler', () => {
  describe('happy paths', () => {
    it('updates role only and returns updated item', async () => {
      const item = makeItem({ role: 'admin' });
      const port = makePort(item);
      const handler = makeHandler(port);

      const result = await handler.execute(new UpdateAdminUserCommand('user-1', { role: 'admin' }));

      expect(result).toEqual(item);
      expect(port.updateUser).toHaveBeenCalledWith('user-1', { role: 'admin' });
    });

    it('updates banned only and returns updated item', async () => {
      const item = makeItem({ banned: true });
      const port = makePort(item);
      const handler = makeHandler(port);

      const result = await handler.execute(new UpdateAdminUserCommand('user-1', { banned: true }));

      expect(result).toEqual(item);
      expect(port.updateUser).toHaveBeenCalledWith('user-1', { banned: true });
    });

    it('updates both role and banned and returns updated item', async () => {
      const item = makeItem({ role: 'guest', banned: true });
      const port = makePort(item);
      const handler = makeHandler(port);

      const result = await handler.execute(
        new UpdateAdminUserCommand('user-1', { role: 'guest', banned: true }),
      );

      expect(result).toEqual(item);
      expect(port.updateUser).toHaveBeenCalledWith('user-1', { role: 'guest', banned: true });
    });
  });

  describe('validation', () => {
    it('throws EmptyUserPatchError (400) when neither role nor banned is set', async () => {
      const port = makePort();
      const handler = makeHandler(port);

      await expect(
        handler.execute(new UpdateAdminUserCommand('user-1', {})),
      ).rejects.toBeInstanceOf(EmptyUserPatchError);

      expect(port.updateUser).not.toHaveBeenCalled();
    });

    it('EmptyUserPatchError has status 400', async () => {
      const port = makePort();
      const handler = makeHandler(port);

      await expect(handler.execute(new UpdateAdminUserCommand('user-1', {}))).rejects.toMatchObject(
        { status: 400 },
      );
    });
  });

  describe('not found', () => {
    it('throws UserNotFoundError (404) when port returns null', async () => {
      const port = makePort(null);
      const handler = makeHandler(port);

      await expect(
        handler.execute(new UpdateAdminUserCommand('missing-id', { role: 'user' })),
      ).rejects.toBeInstanceOf(UserNotFoundError);
    });

    it('UserNotFoundError has status 404', async () => {
      const port = makePort(null);
      const handler = makeHandler(port);

      await expect(
        handler.execute(new UpdateAdminUserCommand('missing-id', { banned: false })),
      ).rejects.toMatchObject({ status: 404 });
    });
  });
});
