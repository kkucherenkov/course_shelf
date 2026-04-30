import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useScanLifecycleStore } from '../scanLifecycle';
import type { ScanLifecycleEvent } from '../scanLifecycle';

describe('useScanLifecycleStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── started ────────────────────────────────────────────────────────────────

  it('inserts a new scan on "started"', () => {
    const store = useScanLifecycleStore();
    const ev: ScanLifecycleEvent = {
      kind: 'started',
      scanId: 'scan-1',
      libraryId: 'lib-1',
      libraryName: 'CS Library',
      at: '2026-04-28T10:00:00.000Z',
    };

    store.applyEvent(ev);

    expect(store.active).toHaveLength(1);
    expect(store.active[0]?.scanId).toBe('scan-1');
    expect(store.active[0]?.filesScanned).toBe(0);
    expect(store.hasAnyActive).toBe(true);
  });

  // ── progress ───────────────────────────────────────────────────────────────

  it('updates counters on "progress"', () => {
    const store = useScanLifecycleStore();

    store.applyEvent({
      kind: 'started',
      scanId: 'scan-1',
      libraryId: 'lib-1',
      libraryName: 'CS Library',
      at: '2026-04-28T10:00:00.000Z',
    });

    store.applyEvent({
      kind: 'progress',
      scanId: 'scan-1',
      libraryId: 'lib-1',
      libraryName: 'CS Library',
      at: '2026-04-28T10:00:05.000Z',
      filesScanned: 42,
      filesAdded: 10,
      coursesDiscovered: 3,
      errorsCount: 1,
    });

    const scan = store.active[0]!;
    expect(scan.filesScanned).toBe(42);
    expect(scan.filesAdded).toBe(10);
    expect(scan.coursesDiscovered).toBe(3);
    expect(scan.errorsCount).toBe(1);
  });

  it('creates scan on first "progress" if "started" was missed', () => {
    const store = useScanLifecycleStore();

    store.applyEvent({
      kind: 'progress',
      scanId: 'scan-orphan',
      libraryId: 'lib-1',
      libraryName: 'CS Library',
      at: '2026-04-28T10:00:05.000Z',
      filesScanned: 5,
      filesAdded: 2,
      coursesDiscovered: 1,
      errorsCount: 0,
    });

    expect(store.active).toHaveLength(1);
    expect(store.active[0]?.filesScanned).toBe(5);
  });

  // ── finished ───────────────────────────────────────────────────────────────

  it('sets finished flag on scan when "finished" arrives', () => {
    const store = useScanLifecycleStore();

    store.applyEvent({
      kind: 'started',
      scanId: 'scan-1',
      libraryId: 'lib-1',
      libraryName: 'CS Library',
      at: '2026-04-28T10:00:00.000Z',
    });

    store.applyEvent({
      kind: 'finished',
      scanId: 'scan-1',
      libraryId: 'lib-1',
      libraryName: 'CS Library',
      at: '2026-04-28T10:01:00.000Z',
      status: 'succeeded',
      filesScanned: 100,
      filesAdded: 20,
      coursesDiscovered: 5,
      errorsCount: 0,
    });

    const scan = store.active[0]!;
    expect(scan.finished).toBeDefined();
    expect(scan.finished?.status).toBe('succeeded');
    // Still in active — removal happens after 6 s
    expect(store.active).toHaveLength(1);
  });

  it('moves scan from active to recentlyFinished after 6 seconds', () => {
    const store = useScanLifecycleStore();

    store.applyEvent({
      kind: 'started',
      scanId: 'scan-1',
      libraryId: 'lib-1',
      libraryName: 'CS Library',
      at: '2026-04-28T10:00:00.000Z',
    });

    store.applyEvent({
      kind: 'finished',
      scanId: 'scan-1',
      libraryId: 'lib-1',
      libraryName: 'CS Library',
      at: '2026-04-28T10:01:00.000Z',
      status: 'succeeded',
      filesScanned: 100,
      filesAdded: 20,
      coursesDiscovered: 5,
      errorsCount: 0,
    });

    expect(store.active).toHaveLength(1);
    expect(store.recentlyFinished).toHaveLength(0);

    vi.advanceTimersByTime(6000);

    expect(store.active).toHaveLength(0);
    expect(store.recentlyFinished).toHaveLength(1);
    expect(store.recentlyFinished[0]?.scanId).toBe('scan-1');
  });

  it('caps recentlyFinished at 3 entries', () => {
    const store = useScanLifecycleStore();

    for (let i = 1; i <= 4; i++) {
      store.applyEvent({
        kind: 'started',
        scanId: `scan-${i}`,
        libraryId: 'lib-1',
        libraryName: `Library ${i}`,
        at: `2026-04-28T10:0${i}:00.000Z`,
      });
      store.applyEvent({
        kind: 'finished',
        scanId: `scan-${i}`,
        libraryId: 'lib-1',
        libraryName: `Library ${i}`,
        at: `2026-04-28T10:0${i}:30.000Z`,
        status: 'succeeded',
        filesScanned: 10,
        filesAdded: 2,
        coursesDiscovered: 1,
        errorsCount: 0,
      });
      vi.advanceTimersByTime(6000);
    }

    expect(store.recentlyFinished).toHaveLength(3);
  });

  // ── dismiss ────────────────────────────────────────────────────────────────

  it('dismiss removes a scan from active and cancels its timer', () => {
    const store = useScanLifecycleStore();

    store.applyEvent({
      kind: 'started',
      scanId: 'scan-1',
      libraryId: 'lib-1',
      libraryName: 'CS Library',
      at: '2026-04-28T10:00:00.000Z',
    });

    store.applyEvent({
      kind: 'finished',
      scanId: 'scan-1',
      libraryId: 'lib-1',
      libraryName: 'CS Library',
      at: '2026-04-28T10:01:00.000Z',
      status: 'succeeded',
      filesScanned: 10,
      filesAdded: 2,
      coursesDiscovered: 1,
      errorsCount: 0,
    });

    store.dismiss('scan-1');

    expect(store.active).toHaveLength(0);
    expect(store.hasAnyActive).toBe(false);

    // Advance past the auto-removal window — should not throw or add to recentlyFinished.
    vi.advanceTimersByTime(6000);
    expect(store.recentlyFinished).toHaveLength(0);
  });

  // ── active getter sorted by startedAt desc ─────────────────────────────────

  it('returns active scans sorted by startedAt descending', () => {
    const store = useScanLifecycleStore();

    store.applyEvent({
      kind: 'started',
      scanId: 'scan-older',
      libraryId: 'lib-1',
      libraryName: 'Old Library',
      at: '2026-04-28T09:00:00.000Z',
    });
    store.applyEvent({
      kind: 'started',
      scanId: 'scan-newer',
      libraryId: 'lib-2',
      libraryName: 'New Library',
      at: '2026-04-28T10:00:00.000Z',
    });

    expect(store.active[0]?.scanId).toBe('scan-newer');
    expect(store.active[1]?.scanId).toBe('scan-older');
  });

  // ── partial status ─────────────────────────────────────────────────────────

  it('handles partial finished status', () => {
    const store = useScanLifecycleStore();

    store.applyEvent({
      kind: 'started',
      scanId: 'scan-partial',
      libraryId: 'lib-1',
      libraryName: 'CS Library',
      at: '2026-04-28T10:00:00.000Z',
    });

    store.applyEvent({
      kind: 'finished',
      scanId: 'scan-partial',
      libraryId: 'lib-1',
      libraryName: 'CS Library',
      at: '2026-04-28T10:01:00.000Z',
      status: 'partial',
      filesScanned: 50,
      filesAdded: 10,
      coursesDiscovered: 2,
      errorsCount: 3,
    });

    expect(store.active[0]?.finished?.status).toBe('partial');
    expect(store.active[0]?.errorsCount).toBe(3);
  });
});
