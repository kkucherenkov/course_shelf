import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

// ---------------------------------------------------------------------------
// In-memory localStorage substitute
// ---------------------------------------------------------------------------
const localStorageStore = new Map<string, string>();
const localStorageMock = {
  getItem: (k: string) => localStorageStore.get(k) ?? null,
  setItem: (k: string, v: string) => {
    localStorageStore.set(k, v);
  },
  removeItem: (k: string) => {
    localStorageStore.delete(k);
  },
  clear: () => {
    localStorageStore.clear();
  },
};
vi.stubGlobal('localStorage', localStorageMock);

// ---------------------------------------------------------------------------
// Import store AFTER mock in place
// ---------------------------------------------------------------------------
import { usePreferencesStore, effectiveLessonState } from '../preferences';

const STORAGE_KEY = 'cs.web.preferences';

describe('usePreferencesStore', () => {
  beforeEach(() => {
    localStorageStore.clear();
    setActivePinia(createPinia());
  });

  // ── Defaults ──────────────────────────────────────────────────────────────

  it('initialises with default values when localStorage is empty', () => {
    const store = usePreferencesStore();
    expect(store.density).toBe('comfortable');
    expect(store.defaultSpeed).toBe(1);
    expect(store.autoplayNext).toBe(true);
    expect(store.resumeWhereLeftOff).toBe(true);
    expect(store.completionThreshold).toBe(90);
  });

  // ── Mutations ─────────────────────────────────────────────────────────────

  it('setDensity updates density', () => {
    const store = usePreferencesStore();
    store.setDensity('compact');
    expect(store.density).toBe('compact');
  });

  it('setDefaultSpeed updates defaultSpeed', () => {
    const store = usePreferencesStore();
    store.setDefaultSpeed(1.5);
    expect(store.defaultSpeed).toBe(1.5);
  });

  it('setAutoplayNext toggles autoplayNext', () => {
    const store = usePreferencesStore();
    store.setAutoplayNext(false);
    expect(store.autoplayNext).toBe(false);
  });

  it('setResumeWhereLeftOff toggles resumeWhereLeftOff', () => {
    const store = usePreferencesStore();
    store.setResumeWhereLeftOff(false);
    expect(store.resumeWhereLeftOff).toBe(false);
  });

  it('setCompletionThreshold updates completionThreshold', () => {
    const store = usePreferencesStore();
    store.setCompletionThreshold(80);
    expect(store.completionThreshold).toBe(80);
  });

  // ── Persistence ───────────────────────────────────────────────────────────

  it('persists state to localStorage after mutation', async () => {
    const { nextTick } = await import('vue');
    const store = usePreferencesStore();
    store.setDensity('compact');
    await nextTick();
    const raw = localStorageMock.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.density).toBe('compact');
  });

  it('hydrates from localStorage on store creation', async () => {
    const { nextTick } = await import('vue');

    // Pre-populate localStorage with saved state.
    localStorageMock.setItem(
      STORAGE_KEY,
      JSON.stringify({
        density: 'compact',
        defaultSpeed: 1.25,
        autoplayNext: false,
        resumeWhereLeftOff: false,
        completionThreshold: 75,
      }),
    );

    // Reset Pinia to force a fresh store creation.
    setActivePinia(createPinia());
    const store = usePreferencesStore();
    await nextTick();

    expect(store.density).toBe('compact');
    expect(store.defaultSpeed).toBe(1.25);
    expect(store.autoplayNext).toBe(false);
    expect(store.resumeWhereLeftOff).toBe(false);
    expect(store.completionThreshold).toBe(75);
  });

  it('falls back to defaults when localStorage has invalid JSON', () => {
    localStorageMock.setItem(STORAGE_KEY, 'not-valid-json');
    setActivePinia(createPinia());
    const store = usePreferencesStore();
    expect(store.density).toBe('comfortable');
    expect(store.defaultSpeed).toBe(1);
  });

  it('falls back to defaults when stored density is not a valid value', () => {
    localStorageMock.setItem(STORAGE_KEY, JSON.stringify({ density: 'ultra-wide' }));
    setActivePinia(createPinia());
    const store = usePreferencesStore();
    expect(store.density).toBe('comfortable');
  });

  // The 'cozy' tier was dropped — it rendered identically to 'comfortable'
  // (no CSS ever keyed off it). A value stored before this change must not
  // crash the app; it falls back like any other unrecognised density.
  it('falls back to comfortable when stored density is the retired "cozy" value', () => {
    localStorageMock.setItem(STORAGE_KEY, JSON.stringify({ density: 'cozy' }));
    setActivePinia(createPinia());
    const store = usePreferencesStore();
    expect(store.density).toBe('comfortable');
  });

  // ── effectiveLessonState ──────────────────────────────────────────────────

  describe('effectiveLessonState', () => {
    it('promotes in-progress to completed once the threshold is cleared', () => {
      expect(effectiveLessonState({ state: 'in-progress', progressPercent: 80 }, 70)).toBe(
        'completed',
      );
    });

    it('leaves in-progress alone below the threshold', () => {
      expect(effectiveLessonState({ state: 'in-progress', progressPercent: 60 }, 70)).toBe(
        'in-progress',
      );
    });

    it.each(['completed', 'not-started', 'locked'] as const)(
      'passes %s through unchanged regardless of progressPercent',
      (state) => {
        expect(effectiveLessonState({ state, progressPercent: 0 }, 70)).toBe(state);
      },
    );
  });
});
