/**
 * Live scan-progress polling composable for the admin Library detail page.
 *
 * Takes a `libraryId` ref, polls `getLatestLibraryScan` every 2s while the
 * scan status is `running`, and stops on unmount or when the scan terminates.
 *
 * Returns `{ scan, isRunning, elapsedTime, percent, start, stop, error }`.
 */

import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { getLatestLibraryScan, client } from '@app/api-client-ts';
import type { ScanDto } from '@app/api-client-ts';

const POLL_INTERVAL_MS = 2000;

export interface UseScanProgressReturn {
  scan: Ref<ScanDto | null>;
  isRunning: Ref<boolean>;
  elapsedTime: Ref<string>;
  percent: Ref<number>;
  error: Ref<Error | null>;
  start: () => Promise<void>;
  stop: () => void;
}

function padTwo(n: number): string {
  return String(n).padStart(2, '0');
}

function formatElapsed(startedAt: string): string {
  const ms = Date.now() - new Date(startedAt).getTime();
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${padTwo(h)}:${padTwo(m)}:${padTwo(s)}`;
}

export function useScanProgress(libraryId: Ref<string>): UseScanProgressReturn {
  const scan = ref<ScanDto | null>(null);
  const error = ref<Error | null>(null);
  let pollHandle: ReturnType<typeof setInterval> | null = null;

  const isRunning = computed(() => scan.value?.status === 'running');

  const elapsedTime = computed(() => {
    if (!scan.value?.startedAt) return '00:00:00';
    return formatElapsed(scan.value.startedAt);
  });

  const percent = computed<number>(() => {
    // ScanDto does not expose a totalFiles field — keep at 0 while running.
    return 0;
  });

  async function fetchScan(): Promise<void> {
    if (!libraryId.value) return;
    try {
      const res = await getLatestLibraryScan({
        client,
        throwOnError: false,
        path: { id: libraryId.value },
      });
      if (res.error) {
        // 404 = no scan yet; treat as null, not error.
        if (res.response.status === 404) {
          scan.value = null;
          return;
        }
        throw new Error('Failed to fetch scan progress');
      }
      const fetchedScan = res.data;
      scan.value = fetchedScan;
      error.value = null;

      // Stop polling when scan has terminated
      if (fetchedScan.status !== 'running') {
        stop();
      }
    } catch (error_) {
      error.value = error_ instanceof Error ? error_ : new Error(String(error_));
      stop();
    }
  }

  function stop(): void {
    if (pollHandle !== null) {
      clearInterval(pollHandle);
      pollHandle = null;
    }
  }

  async function start(): Promise<void> {
    stop();
    await fetchScan();
    if (isRunning.value) {
      pollHandle = setInterval(() => {
        void fetchScan();
      }, POLL_INTERVAL_MS);
    }
  }

  // Re-start polling when libraryId changes
  watch(
    libraryId,
    (id) => {
      if (id) {
        void start();
      }
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    stop();
  });

  return {
    scan,
    isRunning,
    elapsedTime,
    percent,
    error,
    start,
    stop,
  };
}
