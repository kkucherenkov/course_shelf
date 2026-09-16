/**
 * Single shared elapsed-time clock for scan/transcription progress displays.
 *
 * Before this, `useScanProgress` derived elapsed time from a `computed` that
 * only re-evaluated when the 2s poll landed a new `scan` object, while
 * `ScanLifecycleNotifier` ran its own independent 1s `setInterval`. Two
 * on-screen counters for the *same* running scan could then show different
 * times (#603). Every caller reads the same module-level `Date.now()`
 * sample via `elapsedClockNow`, ticking at a shared 1Hz cadence — refcounted
 * so only one interval ever runs regardless of how many displays are
 * mounted. Deliberately not wrapped in a Vue lifecycle hook: callers already
 * have their own mount/unmount (or start/stop) points and drive
 * subscribe/unsubscribe from those directly.
 */

import { ref, type Ref } from 'vue';

const TICK_MS = 1000;

/** Reactive `Date.now()` sample, updated once a second while >=1 subscriber is active. */
export const elapsedClockNow: Ref<number> = ref(Date.now());

let refCount = 0;
let handle: ReturnType<typeof setInterval> | null = null;

/** Starts the shared clock on first subscriber; no-ops for subsequent ones. */
export function subscribeElapsedClock(): void {
  refCount += 1;
  if (handle === null) {
    elapsedClockNow.value = Date.now();
    handle = setInterval(() => {
      elapsedClockNow.value = Date.now();
    }, TICK_MS);
  }
}

/** Stops the shared clock once the last subscriber releases it. */
export function unsubscribeElapsedClock(): void {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0 && handle !== null) {
    clearInterval(handle);
    handle = null;
  }
}

function padTwo(n: number): string {
  return String(n).padStart(2, '0');
}

/** Formats `HH:MM:SS` elapsed since `startedAt`, against a given `now` (defaults to the shared clock). */
export function formatElapsed(startedAt: string, now: number = elapsedClockNow.value): string {
  const ms = Math.max(0, now - new Date(startedAt).getTime());
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${padTwo(h)}:${padTwo(m)}:${padTwo(s)}`;
}
