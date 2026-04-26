/**
 * Unit tests for GetLatestScanHandler.
 * Covers: scan present (returns DTO), scan absent (throws ScanNotFoundError).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Scan } from '../../domain/scan/scan';
import { ScanNotFoundError } from '../../domain/scan/scan.errors';
import { GetLatestScanQuery } from './get-latest-scan.query';
import { GetLatestScanHandler } from './get-latest-scan.handler';

import type { ScanRepository } from '../../domain/scan/scan.repository';

function makeScanRepo(): ScanRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findLatestByLibrary: vi.fn(),
    findRunningByLibrary: vi.fn(),
  };
}

function makeCompletedScan(libraryId = 'lib-1'): Scan {
  const scan = Scan.start({ id: 'scan-1', libraryId, now: new Date('2026-01-01T00:00:00.000Z') });
  scan.complete(new Date('2026-01-01T01:00:00.000Z'));
  return scan;
}

describe('GetLatestScanHandler', () => {
  let repo: ScanRepository;
  let handler: GetLatestScanHandler;

  beforeEach(() => {
    repo = makeScanRepo();
    handler = new GetLatestScanHandler(repo);
  });

  it('returns a ScanDto when the scan exists', async () => {
    const scan = makeCompletedScan('lib-1');
    vi.mocked(repo.findLatestByLibrary).mockResolvedValue(scan);

    const dto = await handler.execute(new GetLatestScanQuery('lib-1'));

    expect(dto.id).toBe(scan.id);
    expect(dto.libraryId).toBe('lib-1');
    expect(dto.status).toBe('succeeded');
    expect(typeof dto.startedAt).toBe('string');
    expect(typeof dto.finishedAt).toBe('string');
  });

  it('calls findLatestByLibrary with the correct libraryId', async () => {
    const scan = makeCompletedScan('lib-42');
    vi.mocked(repo.findLatestByLibrary).mockResolvedValue(scan);

    await handler.execute(new GetLatestScanQuery('lib-42'));

    expect(repo.findLatestByLibrary).toHaveBeenCalledWith('lib-42');
  });

  it('throws ScanNotFoundError when no scan exists', async () => {
    vi.mocked(repo.findLatestByLibrary).mockResolvedValue(null);

    await expect(handler.execute(new GetLatestScanQuery('lib-missing'))).rejects.toBeInstanceOf(
      ScanNotFoundError,
    );
  });

  it('maps errors array to ScanDto.errors correctly', async () => {
    const scan = Scan.start({ id: 'scan-1', libraryId: 'lib-1' });
    scan.recordError({ path: 'bad.txt', message: 'Unsupported', code: 'unsupported-extension' });
    scan.complete();
    vi.mocked(repo.findLatestByLibrary).mockResolvedValue(scan);

    const dto = await handler.execute(new GetLatestScanQuery('lib-1'));

    expect(dto.errors).toHaveLength(1);
    expect(dto.errors[0]).toMatchObject({
      path: 'bad.txt',
      code: 'unsupported-extension',
    });
  });
});
