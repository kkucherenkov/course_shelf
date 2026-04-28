/**
 * Progress reporter composable.
 *
 * Fires `recordLessonProgress` every 10 seconds of real played time
 * (while `playing === true`). Also fires on:
 *   - `document.visibilitychange` when the tab becomes hidden
 *   - `window.beforeunload`
 *
 * Dedupes — at most one request in-flight; subsequent triggers while a
 * request is in-flight are discarded. Stops cleanly on unmount.
 */

import { onUnmounted, watch } from 'vue';
import type { Ref } from 'vue';
import { recordLessonProgress } from '@app/api-client-ts';

export interface UseProgressReporterOptions {
  lessonId: Ref<string>;
  position: Ref<number>;
  duration: Ref<number>;
  playing: Ref<boolean>;
}

export interface UseProgressReporterReturn {
  flush: () => Promise<void>;
}

const INTERVAL_MS = 10_000;

export function useProgressReporter(opts: UseProgressReporterOptions): UseProgressReporterReturn {
  const { lessonId, position, duration, playing } = opts;

  let inFlight = false;
  let intervalHandle: ReturnType<typeof setInterval> | null = null;

  async function send(): Promise<void> {
    if (inFlight) return;
    const id = lessonId.value;
    const pos = position.value;
    const dur = duration.value;
    // Don't send for an un-initialised lesson
    if (!id || dur === 0) return;
    inFlight = true;
    try {
      await recordLessonProgress({
        body: {
          lessonId: id,
          positionSeconds: Math.floor(pos),
          durationSeconds: Math.floor(dur),
          clientUpdatedAt: new Date().toISOString(),
        },
      });
    } catch {
      // Best-effort — swallow network errors
    } finally {
      inFlight = false;
    }
  }

  function startInterval(): void {
    if (intervalHandle !== null) return;
    intervalHandle = setInterval(() => {
      void send();
    }, INTERVAL_MS);
  }

  function stopInterval(): void {
    if (intervalHandle !== null) {
      clearInterval(intervalHandle);
      intervalHandle = null;
    }
  }

  // Start / stop the interval based on playing state
  const stopWatch = watch(
    playing,
    (isPlaying) => {
      if (isPlaying) {
        startInterval();
      } else {
        stopInterval();
      }
    },
    { immediate: true },
  );

  // Flush on tab hide
  function onVisibilityChange(): void {
    if (document.visibilityState === 'hidden') {
      void send();
    }
  }

  // Flush on page unload — synchronous approach (best-effort)
  function onBeforeUnload(): void {
    void send();
  }

  // SPA-only: document and window are always available
  document.addEventListener('visibilitychange', onVisibilityChange);
  globalThis.window.addEventListener('beforeunload', onBeforeUnload);

  onUnmounted(() => {
    stopWatch();
    stopInterval();
    document.removeEventListener('visibilitychange', onVisibilityChange);
    globalThis.window.removeEventListener('beforeunload', onBeforeUnload);
  });

  return { flush: send };
}
