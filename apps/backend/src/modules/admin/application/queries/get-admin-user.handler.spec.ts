import { describe, it, expect, vi } from 'vitest';

import { GetAdminUserHandler } from './get-admin-user.handler';
import { GetAdminUserQuery } from './get-admin-user.query';
import { UserNotFoundError } from '../../domain/admin.errors';

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
    updatedAt: '2026-04-27T09:55:00.000Z',
    ...overrides,
  };
}

function makePort(item: AdminUserListItem | null): DashboardPort {
  return {
    getSnapshot: vi.fn(),
    hasAnyUser: vi.fn(),
    listRecentScans: vi.fn(),
    listAllLibrariesWithCounts: vi.fn(),
    listUsers: vi.fn(),
    findUserById: vi.fn().mockResolvedValue(item),
    updateUser: vi.fn(),
  };
}

function makeHandler(port: DashboardPort): GetAdminUserHandler {
  return new (GetAdminUserHandler as unknown as new (p: DashboardPort) => GetAdminUserHandler)(
    port,
  );
}

describe('GetAdminUserHandler', () => {
  describe('happy path', () => {
    it('returns the item when the port finds the user', async () => {
      const item = makeItem({ id: 'user-42', email: 'bob@example.com' });
      const port = makePort(item);
      const handler = makeHandler(port);

      const result = await handler.execute(new GetAdminUserQuery('user-42'));

      expect(result).toEqual(item);
      expect(port.findUserById).toHaveBeenCalledOnce();
      expect(port.findUserById).toHaveBeenCalledWith('user-42');
    });

    it('passes the id from the query to the port', async () => {
      const item = makeItem({ id: 'user-99' });
      const port = makePort(item);
      const handler = makeHandler(port);

      await handler.execute(new GetAdminUserQuery('user-99'));

      expect(port.findUserById).toHaveBeenCalledWith('user-99');
    });
  });

  describe('not found', () => {
    it('throws UserNotFoundError when port returns null', async () => {
      const port = makePort(null);
      const handler = makeHandler(port);

      await expect(handler.execute(new GetAdminUserQuery('missing-id'))).rejects.toBeInstanceOf(
        UserNotFoundError,
      );
    });

    it('UserNotFoundError has status 404', async () => {
      const port = makePort(null);
      const handler = makeHandler(port);

      await expect(handler.execute(new GetAdminUserQuery('missing-id'))).rejects.toMatchObject({
        status: 404,
      });
    });
  });
});
