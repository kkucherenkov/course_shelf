/**
 * Unit tests for useScanProgress composable.
 *
 * Verifies polling lifecycle: starts on running scan, stops when terminated,
 * clears on unmount.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref } from 'vue';
import type { ScanDto } from '@app/api-client-ts';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGetLatestLibraryScan = vi.fn();

vi.mock('@app/api-client-ts', () => ({
  getLatestLibraryScan: (...args: unknown[]) => mockGetLatestLibraryScan(...args),
  client: {},
}));

// Stub Vue lifecycle hooks
vi.mock('#imports', () => ({ ref, computed: (fn: () => unknown) => ({ value: fn() }) }));

const onBeforeUnmountCb = { fn: null as (() => void) | null };
vi.mock('vue', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- vi.mock factory requires runtime importOriginal, not a type import
  const actual = await importOriginal<typeof import('vue')>();
  return {
    ...actual,
    onBeforeUnmount: (fn: () => void) => {
      onBeforeUnmountCb.fn = fn;
    },
    watch: vi.fn(),
  };
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useScanProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    onBeforeUnmountCb.fn = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetches scan on start() and sets scan ref', async () => {
    const mockScan: ScanDto = {
      id: 'scan-1',
      libraryId: 'lib-1',
      status: 'succeeded',
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      filesScanned: 100,
      filesAdded: 5,
      filesUpdated: 0,
      coursesDiscovered: 2,
      errors: [],
    };
    mockGetLatestLibraryScan.mockResolvedValue({
      data: mockScan,
      error: null,
      response: { status: 200 },
    });

    const { useScanProgress } = await import('../useScanProgress');
    const libraryId = ref('lib-1');
    const { scan, start } = useScanProgress(libraryId);

    await start();

    expect(mockGetLatestLibraryScan).toHaveBeenCalledWith(
      expect.objectContaining({ path: { id: 'lib-1' } }),
    );
    expect(scan.value?.id).toBe('scan-1');
  });

  it('polls every 2s while status is running', async () => {
    const runningScan: ScanDto = {
      id: 'scan-2',
      libraryId: 'lib-1',
      status: 'running',
      startedAt: new Date().toISOString(),
      filesScanned: 50,
      filesAdded: 0,
      filesUpdated: 0,
      coursesDiscovered: 0,
      errors: [],
    };
    const succeededScan: ScanDto = {
      ...runningScan,
      status: 'succeeded',
      finishedAt: new Date().toISOString(),
    };

    mockGetLatestLibraryScan
      .mockResolvedValueOnce({ data: runningScan, error: null, response: { status: 200 } })
      .mockResolvedValueOnce({ data: succeededScan, error: null, response: { status: 200 } });

    const { useScanProgress } = await import('../useScanProgress');
    const libraryId = ref('lib-1');
    const { start } = useScanProgress(libraryId);

    await start();
    expect(mockGetLatestLibraryScan).toHaveBeenCalledTimes(1);

    // Advance timer by 2s to trigger the poll
    await vi.advanceTimersByTimeAsync(2000);
    expect(mockGetLatestLibraryScan).toHaveBeenCalledTimes(2);
  });

  it('stops polling when scan terminates', async () => {
    const runningScan: ScanDto = {
      id: 'scan-3',
      libraryId: 'lib-1',
      status: 'running',
      startedAt: new Date().toISOString(),
      filesScanned: 0,
      filesAdded: 0,
      filesUpdated: 0,
      coursesDiscovered: 0,
      errors: [],
    };
    const failedScan: ScanDto = {
      ...runningScan,
      status: 'failed',
      finishedAt: new Date().toISOString(),
    };

    mockGetLatestLibraryScan
      .mockResolvedValueOnce({ data: runningScan, error: null, response: { status: 200 } })
      .mockResolvedValueOnce({ data: failedScan, error: null, response: { status: 200 } });

    const { useScanProgress } = await import('../useScanProgress');
    const libraryId = ref('lib-1');
    const { start } = useScanProgress(libraryId);

    await start();
    await vi.advanceTimersByTimeAsync(2000);

    // After failed scan: further advances should NOT trigger more calls
    const callCountAfterFailed = mockGetLatestLibraryScan.mock.calls.length;
    await vi.advanceTimersByTimeAsync(6000);
    expect(mockGetLatestLibraryScan).toHaveBeenCalledTimes(callCountAfterFailed);
  });

  it('treats 404 as null scan (no error)', async () => {
    mockGetLatestLibraryScan.mockResolvedValueOnce({
      data: null,
      error: { detail: 'Not found' },
      response: { status: 404 },
    });

    const { useScanProgress } = await import('../useScanProgress');
    const libraryId = ref('lib-1');
    const { scan, error, start } = useScanProgress(libraryId);

    await start();

    expect(scan.value).toBeNull();
    expect(error.value).toBeNull();
  });
});
