/**
 * Singleton-flavoured composable that owns the Centrifugo WebSocket connection
 * for scan lifecycle events.
 *
 * - Connects lazily on first call (client-side only).
 * - Issues a short-lived JWT via `issueRealtimeToken()`.
 * - On 401 retries once after `useAuthStore().refresh()`.
 * - Subscribes to `scans:user:<userId>` and dispatches each publication into
 *   `useScanLifecycleStore().applyEvent()`.
 * - Tears down on `onUnmounted` via reference-counting; the underlying
 *   Centrifuge instance is reused across component mounts.
 *
 * Returns `{ status }` for diagnostics.
 */

import { ref, onMounted, onUnmounted } from 'vue';
import { useRuntimeConfig } from '#imports';
import { Centrifuge } from 'centrifuge';
import { issueRealtimeToken, client } from '@app/api-client-ts';
import { useAuthStore } from '~/stores/auth';
import { useScanLifecycleStore } from '~/stores/scanLifecycle';
import type { ScanLifecycleEvent } from '~/stores/scanLifecycle';

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

// ── Module-level singleton ─────────────────────────────────────────────────
// One Centrifuge instance per browser tab, shared across all component
// mounts. Reference-counted so we disconnect only when the last consumer
// unmounts.

let _instance: Centrifuge | null = null;
let _refCount = 0;
let _currentUserId: string | null = null;

const _sharedStatus = ref<ConnectionStatus>('idle');

// ── Token helpers ──────────────────────────────────────────────────────────

async function fetchToken(retried = false): Promise<string> {
  const res = await issueRealtimeToken({ client, throwOnError: false });

  if (res.error) {
    if (res.response.status === 401 && !retried) {
      const auth = useAuthStore();
      const ok = await auth.refresh();
      if (ok) return fetchToken(true);
    }
    throw new Error(`Failed to obtain realtime token (HTTP ${String(res.response.status)})`);
  }

  const token = res.data.token;
  if (!token) throw new Error('Realtime token response contained no token');
  return token;
}

// ── Connection lifecycle ───────────────────────────────────────────────────

function ensureConnected(userId: string): void {
  const runtimeConfig = useRuntimeConfig();
  const centrifugoUrl = (runtimeConfig.public as Record<string, unknown>).centrifugoUrl as
    | string
    | undefined;
  const wsUrl = centrifugoUrl ?? 'ws://localhost:8000/connection/websocket';

  if (_instance && _currentUserId !== userId) {
    // Different user — tear down the old connection.
    _instance.disconnect();
    _instance = null;
    _currentUserId = null;
  }

  if (_instance) return; // already running for this user

  _sharedStatus.value = 'connecting';
  _currentUserId = userId;

  const centrifuge = new Centrifuge(wsUrl, {
    // The SDK calls this on connect and on token expiry.
    getToken: async () => fetchToken(),
  });

  centrifuge.on('connected', () => {
    _sharedStatus.value = 'connected';
  });

  centrifuge.on('disconnected', () => {
    if (_sharedStatus.value !== 'error') {
      _sharedStatus.value = 'idle';
    }
  });

  centrifuge.on('error', () => {
    _sharedStatus.value = 'error';
  });

  // Subscribe to the per-user scan channel.
  const channel = `scans:user:${userId}`;
  const sub = centrifuge.newSubscription(channel);

  sub.on('publication', (ctx) => {
    const store = useScanLifecycleStore();
    // The JS SDK deserialises the JSON payload into `ctx.data` automatically.
    store.applyEvent(ctx.data as ScanLifecycleEvent);
  });

  sub.subscribe();
  centrifuge.connect();

  _instance = centrifuge;
}

function maybeDisconnect(): void {
  if (_refCount > 0) return;
  if (!_instance) return;
  _instance.disconnect();
  _instance = null;
  _currentUserId = null;
  _sharedStatus.value = 'idle';
}

// ── Public composable ──────────────────────────────────────────────────────

export function useScanLifecycle(): { status: Ref<ConnectionStatus> } {
  if (import.meta.server) {
    // SSR guard — this composable is client-only.
    return { status: ref<ConnectionStatus>('idle') };
  }

  onMounted(() => {
    const auth = useAuthStore();
    if (!auth.isAuthenticated || !auth.user?.id) return;

    _refCount++;
    ensureConnected(auth.user.id);
  });

  onUnmounted(() => {
    _refCount = Math.max(0, _refCount - 1);
    maybeDisconnect();
  });

  return { status: _sharedStatus };
}
