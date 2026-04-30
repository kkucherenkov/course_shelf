/**
 * Pinia store for scan lifecycle events received via Centrifugo.
 *
 * Receives `ScanLifecycleEvent` objects from `useScanLifecycle` composable
 * and exposes reactive state to `ScanLifecycleNotifier.vue`.
 *
 * State:
 *  - `activeScanMap`  – Map<scanId, ActiveScan> of in-flight scans
 *  - `recentlyFinished` – last ≤ 3 completed scans (tail-state visibility)
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface ActiveScan {
  scanId: string;
  libraryId: string;
  libraryName: string;
  startedAt: string;
  filesScanned: number;
  filesAdded: number;
  coursesDiscovered: number;
  errorsCount: number;
  finished?: { status: 'succeeded' | 'failed' | 'partial'; at: string };
}

export type ScanLifecycleEvent =
  | { kind: 'started'; scanId: string; libraryId: string; libraryName: string; at: string }
  | {
      kind: 'progress';
      scanId: string;
      libraryId: string;
      libraryName: string;
      at: string;
      filesScanned: number;
      filesAdded: number;
      coursesDiscovered: number;
      errorsCount: number;
    }
  | {
      kind: 'finished';
      scanId: string;
      libraryId: string;
      libraryName: string;
      at: string;
      status: 'succeeded' | 'failed' | 'partial';
      filesScanned: number;
      filesAdded: number;
      coursesDiscovered: number;
      errorsCount: number;
    };

const MAX_RECENTLY_FINISHED = 3;
const ACTIVE_REMOVAL_DELAY_MS = 6000;

export const useScanLifecycleStore = defineStore('scanLifecycle', () => {
  const activeScanMap = ref<Map<string, ActiveScan>>(new Map());
  const recentlyFinished = ref<ActiveScan[]>([]);

  // Track pending removal timers keyed by scanId so we can cancel on dismiss.
  const _removalTimers = new Map<string, ReturnType<typeof setTimeout>>();

  // ── Getters ────────────────────────────────────────────────────────────────

  const active = computed<ActiveScan[]>(() =>
    [...activeScanMap.value.values()].toSorted(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    ),
  );

  const hasAnyActive = computed(() => activeScanMap.value.size > 0);

  // ── Actions ────────────────────────────────────────────────────────────────

  function applyEvent(event: ScanLifecycleEvent): void {
    if (event.kind === 'started') {
      activeScanMap.value = new Map(activeScanMap.value).set(event.scanId, {
        scanId: event.scanId,
        libraryId: event.libraryId,
        libraryName: event.libraryName,
        startedAt: event.at,
        filesScanned: 0,
        filesAdded: 0,
        coursesDiscovered: 0,
        errorsCount: 0,
      });
      return;
    }

    if (event.kind === 'progress') {
      const existing = activeScanMap.value.get(event.scanId);
      const base: ActiveScan = existing ?? {
        scanId: event.scanId,
        libraryId: event.libraryId,
        libraryName: event.libraryName,
        startedAt: event.at,
        filesScanned: 0,
        filesAdded: 0,
        coursesDiscovered: 0,
        errorsCount: 0,
      };
      activeScanMap.value = new Map(activeScanMap.value).set(event.scanId, {
        ...base,
        filesScanned: event.filesScanned,
        filesAdded: event.filesAdded,
        coursesDiscovered: event.coursesDiscovered,
        errorsCount: event.errorsCount,
      });
      return;
    }

    // event.kind === 'finished' at this point (TypeScript narrows the union).
    const existing = activeScanMap.value.get(event.scanId);
    const updated: ActiveScan = {
      ...(existing ?? {
        scanId: event.scanId,
        libraryId: event.libraryId,
        libraryName: event.libraryName,
        startedAt: event.at,
      }),
      filesScanned: event.filesScanned,
      filesAdded: event.filesAdded,
      coursesDiscovered: event.coursesDiscovered,
      errorsCount: event.errorsCount,
      finished: { status: event.status, at: event.at },
    };

    activeScanMap.value = new Map(activeScanMap.value).set(event.scanId, updated);

    // After 6s: move from active to recentlyFinished.
    const timer = setTimeout(() => {
      _removalTimers.delete(event.scanId);
      _moveToRecent(event.scanId);
    }, ACTIVE_REMOVAL_DELAY_MS);

    _removalTimers.set(event.scanId, timer);
  }

  function dismiss(scanId: string): void {
    // Cancel any pending auto-removal timer.
    const timer = _removalTimers.get(scanId);
    if (timer !== undefined) {
      clearTimeout(timer);
      _removalTimers.delete(scanId);
    }
    // Remove from active regardless of finished state.
    activeScanMap.value = new Map([...activeScanMap.value].filter(([k]) => k !== scanId));
    // Also remove from recentlyFinished if it ended up there.
    recentlyFinished.value = recentlyFinished.value.filter((s) => s.scanId !== scanId);
  }

  function _moveToRecent(scanId: string): void {
    const scan = activeScanMap.value.get(scanId);
    if (!scan) return;

    activeScanMap.value = new Map([...activeScanMap.value].filter(([k]) => k !== scanId));

    recentlyFinished.value = [scan, ...recentlyFinished.value].slice(0, MAX_RECENTLY_FINISHED);
  }

  return {
    activeScanMap,
    recentlyFinished,
    active,
    hasAnyActive,
    applyEvent,
    dismiss,
  };
});
