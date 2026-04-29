import { describe, it, expect, vi } from 'vitest';

import { ListAdminUsersHandler } from './list-admin-users.handler';
import { ListAdminUsersQuery } from './list-admin-users.query';

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

function makePort(items: AdminUserListItem[] = []): DashboardPort {
  return {
    getSnapshot: vi.fn(),
    hasAnyUser: vi.fn(),
    listRecentScans: vi.fn(),
    listAllLibrariesWithCounts: vi.fn(),
    listUsers: vi.fn().mockResolvedValue(items),
    findUserById: vi.fn(),
    updateUser: vi.fn(),
  };
}

function makeHandler(port: DashboardPort): ListAdminUsersHandler {
  return new (ListAdminUsersHandler as unknown as new (p: DashboardPort) => ListAdminUsersHandler)(
    port,
  );
}

describe('ListAdminUsersHandler', () => {
  it('returns { items: [] } when port returns an empty list', async () => {
    const port = makePort([]);
    const handler = makeHandler(port);

    const result = await handler.execute(new ListAdminUsersQuery());

    expect(result).toEqual({ items: [] });
    expect(port.listUsers).toHaveBeenCalledOnce();
  });

  it('wraps port items into { items }', async () => {
    const items = [makeItem({ id: 'user-1', email: 'alice@example.com' })];
    const port = makePort(items);
    const handler = makeHandler(port);

    const result = await handler.execute(new ListAdminUsersQuery());

    expect(result).toEqual({ items });
  });

  it('passes search filter to port', async () => {
    const port = makePort([]);
    const handler = makeHandler(port);

    await handler.execute(new ListAdminUsersQuery('alice'));

    expect(port.listUsers).toHaveBeenCalledWith({ search: 'alice', limit: 50 });
  });

  it('passes undefined search to port when not provided', async () => {
    const port = makePort([]);
    const handler = makeHandler(port);

    await handler.execute(new ListAdminUsersQuery());

    expect(port.listUsers).toHaveBeenCalledWith({ search: undefined, limit: 50 });
  });

  it('uses default limit of 50 when limit is undefined', async () => {
    const port = makePort([]);
    const handler = makeHandler(port);

    await handler.execute(new ListAdminUsersQuery(undefined, undefined));

    expect(port.listUsers).toHaveBeenCalledWith({ search: undefined, limit: 50 });
  });

  it('clamps limit 0 to minimum 1', async () => {
    const port = makePort([]);
    const handler = makeHandler(port);

    await handler.execute(new ListAdminUsersQuery(undefined, 0));

    expect(port.listUsers).toHaveBeenCalledWith({ search: undefined, limit: 1 });
  });

  it('clamps limit 201 to maximum 200', async () => {
    const port = makePort([]);
    const handler = makeHandler(port);

    await handler.execute(new ListAdminUsersQuery(undefined, 201));

    expect(port.listUsers).toHaveBeenCalledWith({ search: undefined, limit: 200 });
  });

  it('clamps NaN to default 50', async () => {
    const port = makePort([]);
    const handler = makeHandler(port);

    await handler.execute(new ListAdminUsersQuery(undefined, Number.NaN));

    expect(port.listUsers).toHaveBeenCalledWith({ search: undefined, limit: 50 });
  });

  it('preserves role lowercase values: admin, user, guest', async () => {
    const items = [
      makeItem({ id: 'u-1', role: 'admin' }),
      makeItem({ id: 'u-2', role: 'user' }),
      makeItem({ id: 'u-3', role: 'guest' }),
    ];
    const port = makePort(items);
    const handler = makeHandler(port);

    const result = await handler.execute(new ListAdminUsersQuery());

    expect(result.items[0]!.role).toBe('admin');
    expect(result.items[1]!.role).toBe('user');
    expect(result.items[2]!.role).toBe('guest');
  });

  it('returns all items from port without reordering', async () => {
    const items = [
      makeItem({ id: 'u-3', createdAt: '2026-04-25T00:00:00.000Z' }),
      makeItem({ id: 'u-2', createdAt: '2026-04-26T00:00:00.000Z' }),
      makeItem({ id: 'u-1', createdAt: '2026-04-27T00:00:00.000Z' }),
    ];
    const port = makePort(items);
    const handler = makeHandler(port);

    const result = await handler.execute(new ListAdminUsersQuery());

    expect(result.items.map((i) => i.id)).toEqual(['u-3', 'u-2', 'u-1']);
  });
});
