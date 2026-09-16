/**
 * Live scan-progress polling composable for the admin Library detail page.
 *
 * Takes a `libraryId` ref, polls `getLatestLibraryScan` every 2s while the
 * scan status is `running`, and stops on unmount or when the scan terminates.
 *
 * Returns `{ scan, isRunning, elapsedTime, start, stop, error }`. There is
 * deliberately no `percent`: `ScanDto` has no `totalFiles` field, because the
 * total is genuinely unknown until the filesystem walk finishes — a fake
 * percentage would just be a different lie than the hardcoded 0% it replaces
 * (#593). `AppScanProgress` renders an indeterminate bar plus the live
 * `filesScanned` counter instead.
 */

import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { getLatestLibraryScan, client } from '@app/api-client-ts';
import type { ScanDto } from '@app/api-client-ts';
import {
  subscribeElapsedClock,
  unsubscribeElapsedClock,
  formatElapsed,
  elapsedClockNow,
} from './useElapsedTime';

const POLL_INTERVAL_MS = 2000;

export interface UseScanProgressReturn {
  scan: Ref<ScanDto | null>;
  isRunning: Ref<boolean>;
  elapsedTime: Ref<string>;
  error: Ref<Error | null>;
  start: () => Promise<void>;
  stop: () => void;
}

export function useScanProgress(libraryId: Ref<string>): UseScanProgressReturn {
  const scan = ref<ScanDto | null>(null);
  const error = ref<Error | null>(null);
  let pollHandle: ReturnType<typeof setInterval> | null = null;

  const isRunning = computed(() => scan.value?.status === 'running');

  // Ticks off the shared clock (see useElapsedTime) rather than only
  // recomputing on each 2s poll — otherwise this display and any other
  // concurrent elapsed-time display for the same scan visibly disagree.
  subscribeElapsedClock();

  const elapsedTime = computed(() => {
    if (!scan.value?.startedAt) return '00:00:00';
    return formatElapsed(scan.value.startedAt, elapsedClockNow.value);
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
    unsubscribeElapsedClock();
  });

  return {
    scan,
    isRunning,
    elapsedTime,
    error,
    start,
    stop,
  };
}
