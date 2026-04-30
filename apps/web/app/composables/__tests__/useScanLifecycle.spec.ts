/**
 * Unit tests for useScanLifecycle composable.
 *
 * Verifies:
 *  - Centrifuge is constructed and subscribes to `scans:user:<userId>`.
 *  - Publications are dispatched to the store via `applyEvent`.
 *  - 401 → token-refresh → retry path.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, onMounted, onUnmounted } from 'vue';

// ── Centrifuge mock ────────────────────────────────────────────────────────────

type EventHandler = (...args: unknown[]) => void;

const mockSubOn = vi.fn();
const mockSubSubscribe = vi.fn();
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockNewSubscription = vi.fn();
const mockCentrifugeOn = vi.fn();

let _capturedGetToken: (() => Promise<string>) | null = null;
let _pubHandler: ((ctx: { data: unknown }) => void) | null = null;

vi.mock('centrifuge', () => {
  class MockCentrifuge {
    constructor(_url: string, opts: { getToken: () => Promise<string> }) {
      _capturedGetToken = opts.getToken;
    }

    on(event: string, handler: EventHandler) {
      mockCentrifugeOn(event, handler);
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

// ── API client mock ────────────────────────────────────────────────────────────

const mockIssueRealtimeToken = vi.fn();

vi.mock('@app/api-client-ts', () => ({
  issueRealtimeToken: (...args: unknown[]) => mockIssueRealtimeToken(...args),
  client: {},
}));

// ── Auth store mock ────────────────────────────────────────────────────────────

const mockRefresh = vi.fn();
const mockAuthStore = {
  isAuthenticated: true,
  user: { id: 'user-42' },
  refresh: mockRefresh,
};

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => mockAuthStore,
}));

// ── Store mock ─────────────────────────────────────────────────────────────────

const mockApplyEvent = vi.fn();

vi.mock('~/stores/scanLifecycle', () => ({
  useScanLifecycleStore: () => ({ applyEvent: mockApplyEvent }),
}));

// ── Nuxt imports mock — must override the shim for useRuntimeConfig ────────────

vi.mock('#imports', () => ({
  ref,
  onMounted,
  onUnmounted,
  useRuntimeConfig: () => ({
    public: {
      apiBaseUrl: 'http://localhost:3000/api/v1',
      authBaseUrl: 'http://localhost:3000',
      centrifugoUrl: 'ws://localhost:8000/connection/websocket',
    },
  }),
}));

// ── Import after mocks ─────────────────────────────────────────────────────────
// useScanLifecycle uses module-level singletons; reset them by reimporting.

import { useScanLifecycle } from '../useScanLifecycle';

// ── Mount/unmount helpers ──────────────────────────────────────────────────────
// We capture onMounted/onUnmounted callbacks via the vue mock.

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

describe('useScanLifecycle', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mountedCallbacks.length = 0;
    unmountedCallbacks.length = 0;
    _capturedGetToken = null;
    _pubHandler = null;

    mockIssueRealtimeToken.mockResolvedValue({
      data: { token: 'jwt-abc', expiresAt: null },
      error: null,
      response: { status: 200 },
    });
  });

  afterEach(() => {
    triggerUnmount();
  });

  it('subscribes to per-user channel on mount', () => {
    useScanLifecycle();
    triggerMount();

    expect(mockConnect).toHaveBeenCalled();
    expect(mockNewSubscription).toHaveBeenCalledWith('scans:user:user-42');
    expect(mockSubSubscribe).toHaveBeenCalled();
  });

  it('getToken factory calls issueRealtimeToken and returns the token string', async () => {
    useScanLifecycle();
    triggerMount();

    expect(_capturedGetToken).toBeTruthy();
    const token = await _capturedGetToken!();
    expect(token).toBe('jwt-abc');
    expect(mockIssueRealtimeToken).toHaveBeenCalledOnce();
  });

  it('dispatches publication data to the store via applyEvent', () => {
    useScanLifecycle();
    triggerMount();

    expect(_pubHandler).toBeTruthy();

    const event = {
      kind: 'started' as const,
      scanId: 'scan-1',
      libraryId: 'lib-1',
      libraryName: 'CS Library',
      at: '2026-04-28T10:00:00.000Z',
    };

    _pubHandler!({ data: event });

    expect(mockApplyEvent).toHaveBeenCalledWith(event);
  });

  it('retries token fetch once after 401 via auth.refresh()', async () => {
    mockIssueRealtimeToken
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'Unauthorized' },
        response: { status: 401 },
      })
      .mockResolvedValueOnce({
        data: { token: 'refreshed-jwt', expiresAt: null },
        error: null,
        response: { status: 200 },
      });

    mockRefresh.mockResolvedValue(true);

    useScanLifecycle();
    triggerMount();

    const token = await _capturedGetToken!();
    expect(mockRefresh).toHaveBeenCalledOnce();
    expect(mockIssueRealtimeToken).toHaveBeenCalledTimes(2);
    expect(token).toBe('refreshed-jwt');
  });

  it('throws when 401 persists after refresh', async () => {
    mockIssueRealtimeToken.mockResolvedValue({
      data: null,
      error: { message: 'Unauthorized' },
      response: { status: 401 },
    });
    mockRefresh.mockResolvedValue(true);

    useScanLifecycle();
    triggerMount();

    await expect(_capturedGetToken!()).rejects.toThrow();
    expect(mockIssueRealtimeToken).toHaveBeenCalledTimes(2);
  });
});
