/**
 * Unit tests for useProgressReporter composable.
 *
 * Uses vi.useFakeTimers to control the 10-second interval.
 * Mocks `@app/api-client-ts` recordLessonProgress so no real HTTP occurs.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref, watch, onUnmounted as vueOnUnmounted } from 'vue';
import type { Ref } from 'vue';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRecordLessonProgress = vi.fn().mockResolvedValue({ data: {}, error: null });

vi.mock('@app/api-client-ts', () => ({
  recordLessonProgress: (...args: unknown[]) => mockRecordLessonProgress(...args),
}));

// Nuxt #imports shim
vi.mock('#imports', () => ({
  ref,
  watch,
  onUnmounted: vueOnUnmounted,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

// Vue's onUnmounted needs an active component instance. We simulate unmount
// by capturing the registered callbacks and calling them manually.
const unmountCallbacks: (() => void)[] = [];

vi.mock('vue', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...(original as object),
    onUnmounted: (cb: () => void) => {
      unmountCallbacks.push(cb);
    },
  };
});

// Import after mocks are registered
async function loadComposable() {
  const mod = await import('../useProgressReporter');
  return mod.useProgressReporter;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useProgressReporter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockRecordLessonProgress.mockClear();
    mockRecordLessonProgress.mockResolvedValue({ data: {}, error: null });
    unmountCallbacks.length = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
    // Run unmount callbacks to clean up listeners
    for (const cb of unmountCallbacks) cb();
  });

  it('fires after 10 s of playing === true', async () => {
    const useProgressReporter = await loadComposable();
    const lessonId: Ref<string> = ref('lesson-1');
    const position: Ref<number> = ref(30);
    const duration: Ref<number> = ref(300);
    const playing: Ref<boolean> = ref(true);

    useProgressReporter({ lessonId, position, duration, playing });

    expect(mockRecordLessonProgress).not.toHaveBeenCalled();
    vi.advanceTimersByTime(10_000);
    // Let async queue drain
    await vi.runAllTicks();

    expect(mockRecordLessonProgress).toHaveBeenCalledTimes(1);
    expect(mockRecordLessonProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          lessonId: 'lesson-1',
          positionSeconds: 30,
          durationSeconds: 300,
        }),
      }),
    );
  });

  it('does not fire when playing === false even after 30 s', async () => {
    const useProgressReporter = await loadComposable();
    const lessonId: Ref<string> = ref('lesson-2');
    const position: Ref<number> = ref(10);
    const duration: Ref<number> = ref(200);
    const playing: Ref<boolean> = ref(false);

    useProgressReporter({ lessonId, position, duration, playing });

    vi.advanceTimersByTime(30_000);
    await vi.runAllTicks();

    expect(mockRecordLessonProgress).not.toHaveBeenCalled();
  });

  it('stops firing when playing flips to false', async () => {
    const useProgressReporter = await loadComposable();
    const lessonId: Ref<string> = ref('lesson-3');
    const position: Ref<number> = ref(20);
    const duration: Ref<number> = ref(200);
    const playing: Ref<boolean> = ref(true);

    useProgressReporter({ lessonId, position, duration, playing });

    vi.advanceTimersByTime(10_000);
    await vi.runAllTicks();
    expect(mockRecordLessonProgress).toHaveBeenCalledTimes(1);

    playing.value = false;
    // Allow watch to react
    await vi.runAllTicks();

    vi.advanceTimersByTime(30_000);
    await vi.runAllTicks();

    // Still only 1 call
    expect(mockRecordLessonProgress).toHaveBeenCalledTimes(1);
  });

  it('fires once on visibilitychange hidden', async () => {
    const useProgressReporter = await loadComposable();
    const lessonId: Ref<string> = ref('lesson-4');
    const position: Ref<number> = ref(50);
    const duration: Ref<number> = ref(500);
    const playing: Ref<boolean> = ref(false);

    useProgressReporter({ lessonId, position, duration, playing });

    // Simulate tab hide
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    });
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.runAllTicks();

    expect(mockRecordLessonProgress).toHaveBeenCalledTimes(1);

    // Restore
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
  });

  it('fires once on beforeunload', async () => {
    const useProgressReporter = await loadComposable();
    const lessonId: Ref<string> = ref('lesson-5');
    const position: Ref<number> = ref(80);
    const duration: Ref<number> = ref(600);
    const playing: Ref<boolean> = ref(false);

    useProgressReporter({ lessonId, position, duration, playing });

    globalThis.window.dispatchEvent(new Event('beforeunload'));
    await vi.runAllTicks();

    expect(mockRecordLessonProgress).toHaveBeenCalledTimes(1);
  });

  it('dedupes — concurrent triggers result in one in-flight POST', async () => {
    let resolveFirst!: () => void;
    const firstCallPromise = new Promise<{ data: object; error: null }>((resolve) => {
      resolveFirst = () => resolve({ data: {}, error: null });
    });
    mockRecordLessonProgress.mockReturnValueOnce(firstCallPromise);

    const useProgressReporter = await loadComposable();
    const lessonId: Ref<string> = ref('lesson-6');
    const position: Ref<number> = ref(100);
    const duration: Ref<number> = ref(700);
    const playing: Ref<boolean> = ref(true);

    useProgressReporter({ lessonId, position, duration, playing });

    vi.advanceTimersByTime(10_000);
    await vi.runAllTicks();
    // First call is in-flight

    // Trigger a second tick while first is still in-flight
    vi.advanceTimersByTime(10_000);
    await vi.runAllTicks();

    // Only one call should have been made (second was dropped)
    expect(mockRecordLessonProgress).toHaveBeenCalledTimes(1);

    // Resolve the first call
    resolveFirst();
    await vi.runAllTicks();

    // Now the next tick should fire
    vi.advanceTimersByTime(10_000);
    await vi.runAllTicks();
    expect(mockRecordLessonProgress).toHaveBeenCalledTimes(2);
  });

  it('stops cleanly on unmount — no more POSTs after unmount callbacks run', async () => {
    const useProgressReporter = await loadComposable();
    const lessonId: Ref<string> = ref('lesson-7');
    const position: Ref<number> = ref(0);
    const duration: Ref<number> = ref(300);
    const playing: Ref<boolean> = ref(true);

    useProgressReporter({ lessonId, position, duration, playing });

    // Run unmount callbacks (stop interval, remove listeners)
    for (const cb of unmountCallbacks) cb();

    vi.advanceTimersByTime(30_000);
    await vi.runAllTicks();

    expect(mockRecordLessonProgress).not.toHaveBeenCalled();
  });
});
