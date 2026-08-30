/**
 * Unit tests for useTranscriptionProgress composable.
 *
 * Verifies:
 *  - Initial GET latest hydrates `transcription` (and treats 404 as null).
 *  - Centrifuge subscribes to `scans:user:<userId>` and a matching
 *    `transcription-*` publication triggers a refetch.
 *  - A publication for a different library is ignored.
 *  - `start(force)` posts the force flag and adopts the 202 body.
 *  - `cancel()` posts to the run id and adopts the 202 body.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref } from 'vue';
import type { TranscriptionDto } from '@app/api-client-ts';

// ── Centrifuge mock ──────────────────────────────────────────────────────────

type EventHandler = (...args: unknown[]) => void;

const mockSubOn = vi.fn();
const mockSubSubscribe = vi.fn();
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockNewSubscription = vi.fn();

let _pubHandler: ((ctx: { data: unknown }) => void) | null = null;

vi.mock('centrifuge', () => {
  class MockCentrifuge {
    constructor(
      _url: string,
      private opts: { getToken: () => Promise<string> },
    ) {}

    on() {
      // connection-level events are not exercised here
    }

    newSubscription(channel: string) {
      mockNewSubscription(channel);
      return {
        on: (event: string, handler: EventHandler) => {
          mockSubOn(event, handler);
          if (event === 'publication') {
            _pubHandler = handler as (ctx: { data: unknown }) => void;
          }
        },
        subscribe: mockSubSubscribe,
      };
    }

    connect() {
      mockConnect();
    }

    disconnect() {
      mockDisconnect();
    }
  }

  return { Centrifuge: MockCentrifuge };
});

// ── API client mock ──────────────────────────────────────────────────────────

const mockIssueRealtimeToken = vi.fn();
const mockGetLatestTranscription = vi.fn();
const mockStartTranscription = vi.fn();
const mockCancelTranscription = vi.fn();

vi.mock('@app/api-client-ts', () => ({
  issueRealtimeToken: (...args: unknown[]) => mockIssueRealtimeToken(...args),
  getLatestTranscription: (...args: unknown[]) => mockGetLatestTranscription(...args),
  startTranscription: (...args: unknown[]) => mockStartTranscription(...args),
  cancelTranscription: (...args: unknown[]) => mockCancelTranscription(...args),
  client: {},
}));

// ── Auth store mock ──────────────────────────────────────────────────────────

const mockAuthStore = { isAuthenticated: true, user: { id: 'user-42' }, refresh: vi.fn() };

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => mockAuthStore,
}));

// ── Nuxt imports mock ─────────────────────────────────────────────────────────

vi.mock('#imports', () => ({
  useRuntimeConfig: () => ({
    public: { centrifugoUrl: 'ws://localhost:8000/connection/websocket' },
  }),
}));

// ── Mount/unmount capture ─────────────────────────────────────────────────────

const mountedCallbacks: (() => void)[] = [];
const unmountedCallbacks: (() => void)[] = [];

vi.mock('vue', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- vi.mock factory requires runtime import
  const actual = await importOriginal<typeof import('vue')>();
  return {
    ...actual,
    onMounted: (fn: () => void) => {
      mountedCallbacks.push(fn);
    },
    onUnmounted: (fn: () => void) => {
      unmountedCallbacks.push(fn);
    },
  };
});

function triggerMount() {
  const cbs = [...mountedCallbacks];
  mountedCallbacks.length = 0;
  for (const fn of cbs) fn();
}

function triggerUnmount() {
  const cbs = [...unmountedCallbacks];
  unmountedCallbacks.length = 0;
  for (const fn of cbs) fn();
}

// ── Import after mocks ─────────────────────────────────────────────────────────

import { useTranscriptionProgress } from '../useTranscriptionProgress';

const baseDto: TranscriptionDto = {
  id: 'tr-1',
  libraryId: 'lib-1',
  status: 'running',
  force: false,
  startedAt: '2026-04-28T10:00:00.000Z',
  lessonsTotal: 10,
  lessonsSkipped: 1,
  lessonsTranscribed: 2,
  lessonsFailed: 0,
  errors: [],
};

describe('useTranscriptionProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mountedCallbacks.length = 0;
    unmountedCallbacks.length = 0;
    _pubHandler = null;

    mockIssueRealtimeToken.mockResolvedValue({
      data: { token: 'jwt-abc', expiresAt: null },
      error: null,
      response: { status: 200 },
    });
    mockGetLatestTranscription.mockResolvedValue({
      data: baseDto,
      error: null,
      response: { status: 200 },
    });
  });

  afterEach(() => {
    triggerUnmount();
  });

  it('hydrates transcription from GET latest on mount', async () => {
    const { transcription } = useTranscriptionProgress(ref('lib-1'));
    triggerMount();
    await vi.waitFor(() => expect(transcription.value).toEqual(baseDto));
  });

  it('treats a 404 as no transcription yet', async () => {
    mockGetLatestTranscription.mockResolvedValue({
      data: null,
      error: { message: 'Not found' },
      response: { status: 404 },
    });

    const { transcription } = useTranscriptionProgress(ref('lib-1'));
    triggerMount();
    await vi.waitFor(() => expect(mockGetLatestTranscription).toHaveBeenCalled());
    expect(transcription.value).toBeNull();
  });

  it('subscribes to the per-user scan channel', () => {
    useTranscriptionProgress(ref('lib-1'));
    triggerMount();
    expect(mockNewSubscription).toHaveBeenCalledWith('scans:user:user-42');
    expect(mockConnect).toHaveBeenCalled();
    expect(mockSubSubscribe).toHaveBeenCalled();
  });

  it('refetches on a matching transcription-* publication', async () => {
    useTranscriptionProgress(ref('lib-1'));
    triggerMount();
    await vi.waitFor(() => expect(mockGetLatestTranscription).toHaveBeenCalledTimes(1));

    _pubHandler!({ data: { kind: 'transcription-progress', libraryId: 'lib-1' } });

    await vi.waitFor(() => expect(mockGetLatestTranscription).toHaveBeenCalledTimes(2));
  });

  it('ignores a publication for a different library', async () => {
    useTranscriptionProgress(ref('lib-1'));
    triggerMount();
    await vi.waitFor(() => expect(mockGetLatestTranscription).toHaveBeenCalledTimes(1));

    _pubHandler!({ data: { kind: 'transcription-progress', libraryId: 'lib-2' } });

    // give any stray microtask a chance to run, then assert no extra call
    await Promise.resolve();
    expect(mockGetLatestTranscription).toHaveBeenCalledTimes(1);
  });

  it('start(force) posts the flag and adopts the response', async () => {
    mockStartTranscription.mockResolvedValue({
      data: { ...baseDto, force: true },
      error: null,
      response: { status: 202 },
    });

    const { start, transcription } = useTranscriptionProgress(ref('lib-1'));
    triggerMount();
    await start(true);

    expect(mockStartTranscription).toHaveBeenCalledWith(
      expect.objectContaining({ path: { id: 'lib-1' }, body: { force: true } }),
    );
    expect(transcription.value?.force).toBe(true);
  });

  it('cancel() posts to the run id and adopts the response', async () => {
    mockGetLatestTranscription.mockResolvedValue({
      data: baseDto,
      error: null,
      response: { status: 200 },
    });
    mockCancelTranscription.mockResolvedValue({
      data: { ...baseDto, status: 'cancelled' },
      error: null,
      response: { status: 202 },
    });

    const { cancel, transcription } = useTranscriptionProgress(ref('lib-1'));
    triggerMount();
    await vi.waitFor(() => expect(transcription.value).toEqual(baseDto));

    await cancel();

    expect(mockCancelTranscription).toHaveBeenCalledWith(
      expect.objectContaining({ path: { id: 'tr-1' } }),
    );
    expect(transcription.value?.status).toBe('cancelled');
  });
});
