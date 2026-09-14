/**
 * Live transcription-run state for one library, for the admin library detail page.
 *
 * Fetches `GET /libraries/{id}/transcriptions/latest` on mount, then refetches
 * whenever a `transcription-*` event for this library arrives on the same
 * Centrifugo channel the scan lifecycle notifier subscribes to
 * (`scans:user:<userId>`). Rides `subscribeToScansChannel` from
 * `useScanLifecycle.ts` rather than opening a second Centrifuge connection —
 * that module owns the one-instance-per-tab invariant for this channel.
 *
 * The push events only carry counters, not the error list, so a full refetch
 * on every push is the simplest way to keep both in sync — ponytail: an extra
 * GET per push is fine at admin-page cadence (pushes are already throttled
 * server-side), revisit only if that ever gets loud enough to matter.
 *
 * Realtime is an accelerator, not the only source of truth: polls every 2s
 * while a run is `running`, mirroring `useLatestScan` in `useLibraries.ts`,
 * and also retries every 2s after a failed fetch so a transient network
 * hiccup on the initial load self-heals instead of leaving the Cancel
 * control gone until a page reload.
 *
 * `start(force)` / `cancel()` call the REST endpoints directly and adopt the
 * 202 body as the new local state so the UI updates before the next push.
 */

import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue';
import {
  startTranscription,
  getLatestTranscription,
  cancelTranscription,
  client,
} from '@app/api-client-ts';
import type { TranscriptionDto } from '@app/api-client-ts';
import { useAuthStore } from '~/stores/auth';
import { subscribeToScansChannel } from './useScanLifecycle';

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

const POLL_INTERVAL_MS = 2000;

export function useTranscriptionProgress(libraryId: Ref<string>): UseTranscriptionProgressReturn {
  const transcription = ref<TranscriptionDto | null>(null);
  const starting = ref(false);
  const cancelling = ref(false);
  const error = ref<Error | null>(null);
  let pollHandle: ReturnType<typeof setTimeout> | null = null;

  const isRunning = computed(() => transcription.value?.status === 'running');

  // Keep polling while a run is going, and retry while the last fetch
  // failed — a confirmed "no run" (404, error cleared) needs no polling.
  function schedulePoll(): void {
    if (pollHandle !== null) {
      clearTimeout(pollHandle);
      pollHandle = null;
    }
    if (isRunning.value || error.value !== null) {
      pollHandle = setTimeout(() => {
        void fetchLatest();
      }, POLL_INTERVAL_MS);
    }
  }

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
          error.value = null;
          schedulePoll();
          return;
        }
        throw new Error('Failed to fetch transcription progress');
      }
      transcription.value = res.data;
      error.value = null;
      schedulePoll();
    } catch (error_) {
      error.value = error_ instanceof Error ? error_ : new Error(String(error_));
      schedulePoll();
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
      schedulePoll();
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
      schedulePoll();
    } catch (error_) {
      error.value = error_ instanceof Error ? error_ : new Error(String(error_));
      throw error_;
    } finally {
      cancelling.value = false;
    }
  }

  // ── Centrifugo: shared channel via useScanLifecycle's subscription seam ────
  if (!import.meta.server) {
    let unsubscribe: (() => void) | null = null;

    onMounted(() => {
      void fetchLatest();

      const auth = useAuthStore();
      if (!auth.isAuthenticated || !auth.user?.id) return;

      unsubscribe = subscribeToScansChannel(auth.user.id, (data) => {
        const event = data as TranscriptionLifecycleEvent;
        if (!event.kind.startsWith('transcription-')) return;
        if (event.libraryId !== libraryId.value) return;
        void fetchLatest();
      });
    });

    onUnmounted(() => {
      unsubscribe?.();
      unsubscribe = null;
      if (pollHandle !== null) {
        clearTimeout(pollHandle);
        pollHandle = null;
      }
    });
  }

  return { transcription, isRunning, starting, cancelling, error, start, cancel };
}
