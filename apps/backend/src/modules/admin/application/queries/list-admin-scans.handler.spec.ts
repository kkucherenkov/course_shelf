import { describe, it, expect, vi } from 'vitest';

import { ListAdminScansHandler } from './list-admin-scans.handler';
import { ListAdminScansQuery } from './list-admin-scans.query';

import type { DashboardPort } from '../../domain/dashboard.port';
import type { AdminScanListItem } from '@app/api-client-ts';

function makeItem(overrides: Partial<AdminScanListItem> = {}): AdminScanListItem {
  return {
    scanId: 'scan-1',
    libraryId: 'lib-1',
    libraryName: 'Computer Science',
    status: 'succeeded',
    startedAt: '2026-04-27T09:55:00.000Z',
    finishedAt: '2026-04-27T09:58:12.000Z',
    filesScanned: 100,
    coursesAdded: 2,
    errorsCount: 0,
    ...overrides,
  };
}

function makePort(items: AdminScanListItem[] = []): DashboardPort {
  return {
    getSnapshot: vi.fn(),
    hasAnyUser: vi.fn(),
    listRecentScans: vi.fn().mockResolvedValue(items),
  };
}

function makeHandler(port: DashboardPort): ListAdminScansHandler {
  return new (ListAdminScansHandler as unknown as new (p: DashboardPort) => ListAdminScansHandler)(
    port,
  );
}

describe('ListAdminScansHandler', () => {
  it('returns { items: [] } when port returns an empty list', async () => {
    const port = makePort([]);
    const handler = makeHandler(port);

    const result = await handler.execute(new ListAdminScansQuery());

    expect(result).toEqual({ items: [] });
    expect(port.listRecentScans).toHaveBeenCalledWith(20);
  });

  it('returns items ordered as received from the port (startedAt DESC)', async () => {
    const item1 = makeItem({ scanId: 'scan-2', startedAt: '2026-04-28T10:00:00.000Z' });
    const item2 = makeItem({ scanId: 'scan-1', startedAt: '2026-04-27T09:55:00.000Z' });
    const port = makePort([item1, item2]);
    const handler = makeHandler(port);

    const result = await handler.execute(new ListAdminScansQuery(10));

    expect(result.items).toHaveLength(2);
    expect(result.items[0].scanId).toBe('scan-2');
    expect(result.items[1].scanId).toBe('scan-1');
    expect(port.listRecentScans).toHaveBeenCalledWith(10);
  });

  it('uses default limit of 20 when limit is undefined', async () => {
    const port = makePort([]);
    const handler = makeHandler(port);

    await handler.execute(new ListAdminScansQuery(undefined));

    expect(port.listRecentScans).toHaveBeenCalledWith(20);
  });

  it('clamps limit 0 to minimum 1', async () => {
    const port = makePort([]);
    const handler = makeHandler(port);

    await handler.execute(new ListAdminScansQuery(0));

    expect(port.listRecentScans).toHaveBeenCalledWith(1);
  });

  it('clamps limit 101 to maximum 100', async () => {
    const port = makePort([]);
    const handler = makeHandler(port);

    await handler.execute(new ListAdminScansQuery(101));

    expect(port.listRecentScans).toHaveBeenCalledWith(100);
  });

  it('clamps NaN to default 20', async () => {
    const port = makePort([]);
    const handler = makeHandler(port);

    await handler.execute(new ListAdminScansQuery(Number.NaN));

    expect(port.listRecentScans).toHaveBeenCalledWith(20);
  });

  it('passes limit 1 through unchanged', async () => {
    const port = makePort([]);
    const handler = makeHandler(port);

    await handler.execute(new ListAdminScansQuery(1));

    expect(port.listRecentScans).toHaveBeenCalledWith(1);
  });

  it('passes limit 100 through unchanged', async () => {
    const port = makePort([]);
    const handler = makeHandler(port);

    await handler.execute(new ListAdminScansQuery(100));

    expect(port.listRecentScans).toHaveBeenCalledWith(100);
  });

  it('maps all fields from port items into the dto', async () => {
    const item = makeItem({
      scanId: 'scan-x',
      libraryId: 'lib-x',
      libraryName: 'Mathematics',
      status: 'failed',
      startedAt: '2026-04-26T18:01:00.000Z',
      finishedAt: '2026-04-26T18:01:05.000Z',
      filesScanned: 0,
      coursesAdded: 0,
      errorsCount: 1,
    });
    const port = makePort([item]);
    const handler = makeHandler(port);

    const result = await handler.execute(new ListAdminScansQuery(5));

    expect(result.items[0]).toEqual(item);
  });

  it('handles running scan with null finishedAt', async () => {
    const item = makeItem({ status: 'running', finishedAt: null });
    const port = makePort([item]);
    const handler = makeHandler(port);

    const result = await handler.execute(new ListAdminScansQuery());

    expect(result.items[0].finishedAt).toBeNull();
    expect(result.items[0].status).toBe('running');
  });
});
