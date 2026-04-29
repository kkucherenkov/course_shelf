import { describe, it, expect, vi } from 'vitest';

import { ListAdminLibrariesHandler } from './list-admin-libraries.handler';
import { ListAdminLibrariesQuery } from './list-admin-libraries.query';

import type { DashboardPort } from '../../domain/dashboard.port';
import type { AdminLibraryListItem } from '@app/api-client-ts';

function makeItem(overrides: Partial<AdminLibraryListItem> = {}): AdminLibraryListItem {
  return {
    id: 'lib-1',
    name: 'Mathematics',
    rootPath: '/data/math',
    coursesCount: 3,
    lessonsCount: 12,
    lastScan: {
      status: 'succeeded',
      startedAt: '2026-04-27T09:55:00.000Z',
      finishedAt: '2026-04-27T09:58:12.000Z',
      errorsCount: 0,
    },
    ...overrides,
  };
}

function makePort(items: AdminLibraryListItem[] = []): DashboardPort {
  return {
    getSnapshot: vi.fn(),
    hasAnyUser: vi.fn(),
    listRecentScans: vi.fn(),
    listAllLibrariesWithCounts: vi.fn().mockResolvedValue(items),
    listUsers: vi.fn(),
    findUserById: vi.fn(),
    updateUser: vi.fn(),
  };
}

function makeHandler(port: DashboardPort): ListAdminLibrariesHandler {
  return new (ListAdminLibrariesHandler as unknown as new (
    p: DashboardPort,
  ) => ListAdminLibrariesHandler)(port);
}

describe('ListAdminLibrariesHandler', () => {
  it('returns { items: [] } when port returns an empty list', async () => {
    const port = makePort([]);
    const handler = makeHandler(port);

    const result = await handler.execute(new ListAdminLibrariesQuery());

    expect(result).toEqual({ items: [] });
    expect(port.listAllLibrariesWithCounts).toHaveBeenCalledOnce();
  });

  it('wraps port items into { items }', async () => {
    const items = [makeItem({ id: 'lib-1', name: 'Algebra' })];
    const port = makePort(items);
    const handler = makeHandler(port);

    const result = await handler.execute(new ListAdminLibrariesQuery());

    expect(result).toEqual({ items });
  });

  it('preserves alphabetic ordering returned by the port', async () => {
    const items = [
      makeItem({ id: 'lib-a', name: 'Biology' }),
      makeItem({ id: 'lib-b', name: 'Chemistry' }),
      makeItem({ id: 'lib-c', name: 'Mathematics' }),
    ];
    const port = makePort(items);
    const handler = makeHandler(port);

    const result = await handler.execute(new ListAdminLibrariesQuery());

    expect(result.items.map((i) => i.name)).toEqual(['Biology', 'Chemistry', 'Mathematics']);
  });

  it('handles library with no courses and no scans (zero counts, null lastScan)', async () => {
    const emptyLib = makeItem({
      id: 'lib-empty',
      name: 'Empty Library',
      coursesCount: 0,
      lessonsCount: 0,
      lastScan: null,
    });
    const port = makePort([emptyLib]);
    const handler = makeHandler(port);

    const result = await handler.execute(new ListAdminLibrariesQuery());

    expect(result.items[0]?.coursesCount).toBe(0);
    expect(result.items[0]?.lessonsCount).toBe(0);
    expect(result.items[0]?.lastScan).toBeNull();
  });

  it('handles library with a running scan (finishedAt null)', async () => {
    const lib = makeItem({
      lastScan: {
        status: 'running',
        startedAt: '2026-04-28T10:00:00.000Z',
        finishedAt: null,
        errorsCount: 0,
      },
    });
    const port = makePort([lib]);
    const handler = makeHandler(port);

    const result = await handler.execute(new ListAdminLibrariesQuery());

    expect(result.items[0]?.lastScan?.status).toBe('running');
    expect(result.items[0]?.lastScan?.finishedAt).toBeNull();
  });

  it('handles library with a failed scan and errorsCount > 0', async () => {
    const lib = makeItem({
      lastScan: {
        status: 'failed',
        startedAt: '2026-04-26T08:00:00.000Z',
        finishedAt: '2026-04-26T08:01:00.000Z',
        errorsCount: 5,
      },
    });
    const port = makePort([lib]);
    const handler = makeHandler(port);

    const result = await handler.execute(new ListAdminLibrariesQuery());

    expect(result.items[0]?.lastScan?.status).toBe('failed');
    expect(result.items[0]?.lastScan?.errorsCount).toBe(5);
  });

  it('handles a mixed list: one with scan, one without', async () => {
    const items = [
      makeItem({ id: 'lib-1', name: 'Alpha', lastScan: null }),
      makeItem({
        id: 'lib-2',
        name: 'Beta',
        lastScan: {
          status: 'succeeded',
          startedAt: '2026-04-27T09:00:00.000Z',
          finishedAt: '2026-04-27T09:05:00.000Z',
          errorsCount: 0,
        },
      }),
    ];
    const port = makePort(items);
    const handler = makeHandler(port);

    const result = await handler.execute(new ListAdminLibrariesQuery());

    expect(result.items).toHaveLength(2);
    expect(result.items[0]?.lastScan).toBeNull();
    expect(result.items[1]?.lastScan?.status).toBe('succeeded');
  });
});
