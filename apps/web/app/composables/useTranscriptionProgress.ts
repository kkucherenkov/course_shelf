/**
 * Live transcription-run state for one library, for the admin library detail page.
 *
 * Fetches `GET /libraries/{id}/transcriptions/latest` on mount, then refetches
 * whenever a `transcription-*` event for this library arrives on the same
 * Centrifugo channel the scan lifecycle notifier subscribes to
 * (`scans:user:<userId>` — see `useScanLifecycle.ts`, which this mirrors:
 * same token/connect/subscribe shape, own connection).
 *
 * The push events only carry counters, not the error list, so a full refetch
 * on every push is the simplest way to keep both in sync — ponytail: an extra
 * GET per push is fine at admin-page cadence (pushes are already throttled
 * server-side), revisit only if that ever gets loud enough to matter.
 *
 * `start(force)` / `cancel()` call the REST endpoints directly and adopt the
 * 202 body as the new local state so the UI updates before the next push.
 */

import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue';
import { useRuntimeConfig } from '#imports';
import { Centrifuge } from 'centrifuge';
import {
  startTranscription,
  getLatestTranscription,
  cancelTranscription,
  issueRealtimeToken,
  client,
} from '@app/api-client-ts';
import type { TranscriptionDto } from '@app/api-client-ts';
import { useAuthStore } from '~/stores/auth';

interface TranscriptionLifecycleEvent {
  kind: string;
  libraryId: string;
}

export interface UseTranscriptionProgressReturn {
  transcription: Ref<TranscriptionDto | null>;
  isRunning: Ref<boolean>;
  starting: Ref<boolean>;
  cancelling: Ref<boolean>;
  error: Ref<Error | null>;
  start: (force: boolean) => Promise<void>;
  cancel: () => Promise<void>;
}

async function fetchRealtimeToken(retried = false): Promise<string> {
  const res = await issueRealtimeToken({ client, throwOnError: false });

  if (res.error) {
    if (res.response.status === 401 && !retried) {
      const auth = useAuthStore();
      const ok = await auth.refresh();
      if (ok) return fetchRealtimeToken(true);
    }
    throw new Error(`Failed to obtain realtime token (HTTP ${String(res.response.status)})`);
  }

  const token = res.data.token;
  if (!token) throw new Error('Realtime token response contained no token');
  return token;
}

export function useTranscriptionProgress(libraryId: Ref<string>): UseTranscriptionProgressReturn {
  const transcription = ref<TranscriptionDto | null>(null);
  const starting = ref(false);
  const cancelling = ref(false);
  const error = ref<Error | null>(null);

  const isRunning = computed(() => transcription.value?.status === 'running');

  async function fetchLatest(): Promise<void> {
    if (!libraryId.value) return;
    try {
      const res = await getLatestTranscription({
        client,
        throwOnError: false,
        path: { id: libraryId.value },
      });
      if (res.error) {
        if (res.response.status === 404) {
          transcription.value = null;
          return;
        }
        throw new Error('Failed to fetch transcription progress');
      }
      transcription.value = res.data;
      error.value = null;
    } catch (error_) {
      error.value = error_ instanceof Error ? error_ : new Error(String(error_));
    }
  }

  async function start(force: boolean): Promise<void> {
    starting.value = true;
    try {
      const res = await startTranscription({
        client,
        throwOnError: false,
        path: { id: libraryId.value },
        body: { force },
      });
      if (res.error) throw new Error('Failed to start transcription');
      transcription.value = res.data;
      error.value = null;
    } catch (error_) {
      error.value = error_ instanceof Error ? error_ : new Error(String(error_));
      throw error_;
    } finally {
      starting.value = false;
    }
  }

  async function cancel(): Promise<void> {
    const id = transcription.value?.id;
    if (!id) return;
    cancelling.value = true;
    try {
      const res = await cancelTranscription({ client, throwOnError: false, path: { id } });
      if (res.error) throw new Error('Failed to cancel transcription');
      transcription.value = res.data;
      error.value = null;
    } catch (error_) {
      error.value = error_ instanceof Error ? error_ : new Error(String(error_));
      throw error_;
    } finally {
      cancelling.value = false;
    }
  }

  // ── Centrifugo: same channel + connection shape as useScanLifecycle ────────
  if (!import.meta.server) {
    let centrifuge: Centrifuge | null = null;

    onMounted(() => {
      void fetchLatest();

      const auth = useAuthStore();
      if (!auth.isAuthenticated || !auth.user?.id) return;

      const runtimeConfig = useRuntimeConfig();
      const configuredUrl = (runtimeConfig.public as Record<string, unknown>).centrifugoUrl as
        | string
        | undefined;
      const wsUrl = configuredUrl ?? 'ws://localhost:8000/connection/websocket';

      centrifuge = new Centrifuge(wsUrl, { getToken: () => fetchRealtimeToken() });
      const sub = centrifuge.newSubscription(`scans:user:${auth.user.id}`);
      sub.on('publication', (ctx) => {
        const event = ctx.data as TranscriptionLifecycleEvent;
        if (!event.kind.startsWith('transcription-')) return;
        if (event.libraryId !== libraryId.value) return;
        void fetchLatest();
      });
      sub.subscribe();
      centrifuge.connect();
    });

    onUnmounted(() => {
      centrifuge?.disconnect();
      centrifuge = null;
    });
  }

  return { transcription, isRunning, starting, cancelling, error, start, cancel };
}
