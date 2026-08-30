import { describe, it, expect, vi } from 'vitest';

import { ListAdminTranscriptionsHandler } from './list-admin-transcriptions.handler';
import { ListAdminTranscriptionsQuery } from './list-admin-transcriptions.query';

import type { DashboardPort } from '../../domain/dashboard.port';
import type { AdminTranscriptionListItem } from '@app/api-client-ts';

function makeItem(overrides: Partial<AdminTranscriptionListItem> = {}): AdminTranscriptionListItem {
  return {
    transcriptionId: 'trn-1',
    libraryId: 'lib-1',
    libraryName: 'Computer Science',
    status: 'succeeded',
    force: false,
    startedAt: '2026-08-30T12:00:00.000Z',
    finishedAt: '2026-08-30T12:10:00.000Z',
    lessonsTotal: 10,
    lessonsTranscribed: 10,
    errorsCount: 0,
    ...overrides,
  };
}

function makePort(items: AdminTranscriptionListItem[] = []): DashboardPort {
  return {
    getSnapshot: vi.fn(),
    hasAnyUser: vi.fn(),
    listRecentScans: vi.fn(),
    listRecentTranscriptions: vi.fn().mockResolvedValue(items),
    listAllLibrariesWithCounts: vi.fn(),
    listUsers: vi.fn(),
    findUserById: vi.fn(),
    updateUser: vi.fn(),
  };
}

function makeHandler(port: DashboardPort): ListAdminTranscriptionsHandler {
  return new (ListAdminTranscriptionsHandler as unknown as new (
    p: DashboardPort,
  ) => ListAdminTranscriptionsHandler)(port);
}

describe('ListAdminTranscriptionsHandler', () => {
  it('returns { items: [] } when port returns an empty list', async () => {
    const port = makePort([]);
    const handler = makeHandler(port);

    const result = await handler.execute(new ListAdminTranscriptionsQuery());

    expect(result).toEqual({ items: [] });
    expect(port.listRecentTranscriptions).toHaveBeenCalledWith(20, undefined);
  });

  it('uses default limit of 20 when limit is undefined', async () => {
    const port = makePort([]);
    const handler = makeHandler(port);

    await handler.execute(new ListAdminTranscriptionsQuery(undefined));

    expect(port.listRecentTranscriptions).toHaveBeenCalledWith(20, undefined);
  });

  it('clamps limit 0 to minimum 1', async () => {
    const port = makePort([]);
    const handler = makeHandler(port);

    await handler.execute(new ListAdminTranscriptionsQuery(0));

    expect(port.listRecentTranscriptions).toHaveBeenCalledWith(1, undefined);
  });

  it('clamps limit 101 to maximum 100', async () => {
    const port = makePort([]);
    const handler = makeHandler(port);

    await handler.execute(new ListAdminTranscriptionsQuery(101));

    expect(port.listRecentTranscriptions).toHaveBeenCalledWith(100, undefined);
  });

  it('clamps NaN to default 20', async () => {
    const port = makePort([]);
    const handler = makeHandler(port);

    await handler.execute(new ListAdminTranscriptionsQuery(Number.NaN));

    expect(port.listRecentTranscriptions).toHaveBeenCalledWith(20, undefined);
  });

  it('maps all fields from port items into the dto', async () => {
    const item = makeItem({
      transcriptionId: 'trn-x',
      libraryId: 'lib-x',
      libraryName: 'Mathematics',
      status: 'failed',
      force: true,
      errorsCount: 3,
    });
    const port = makePort([item]);
    const handler = makeHandler(port);

    const result = await handler.execute(new ListAdminTranscriptionsQuery(5));

    expect(result.items[0]).toEqual(item);
  });

  it('handles a running transcription with null finishedAt', async () => {
    const item = makeItem({ status: 'running', finishedAt: null });
    const port = makePort([item]);
    const handler = makeHandler(port);

    const result = await handler.execute(new ListAdminTranscriptionsQuery());

    expect(result.items[0]?.finishedAt).toBeNull();
    expect(result.items[0]?.status).toBe('running');
  });

  it('passes libraryId to the port when provided', async () => {
    const port = makePort([]);
    const handler = makeHandler(port);

    await handler.execute(new ListAdminTranscriptionsQuery(10, 'lib-42'));

    expect(port.listRecentTranscriptions).toHaveBeenCalledWith(10, 'lib-42');
  });

  it('passes undefined libraryId to the port when not provided', async () => {
    const port = makePort([]);
    const handler = makeHandler(port);

    await handler.execute(new ListAdminTranscriptionsQuery(10));

    expect(port.listRecentTranscriptions).toHaveBeenCalledWith(10, undefined);
  });

  it('returns empty items for unknown libraryId without throwing', async () => {
    const port = makePort([]);
    const handler = makeHandler(port);

    const result = await handler.execute(new ListAdminTranscriptionsQuery(20, 'nonexistent-lib'));

    expect(result).toEqual({ items: [] });
  });
});
