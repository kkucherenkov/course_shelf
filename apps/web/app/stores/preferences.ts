/**
 * Pinia store for per-user playback and appearance preferences.
 *
 * Persisted to localStorage via a hand-rolled `watch` because
 * `pinia-plugin-persistedstate` is not in the dependency set.
 *
 * Density is additionally applied to `<html data-density="...">` by
 * `apps/web/app/plugins/01.density.client.ts` so changes take effect
 * without a page reload.
 */

import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

// ── Storage key ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'cs.web.preferences';

// ── Types ────────────────────────────────────────────────────────────────────

export type Density = 'comfortable' | 'cozy' | 'compact';

export interface PreferencesState {
  density: Density;
  defaultSpeed: number;
  autoplayNext: boolean;
  resumeWhereLeftOff: boolean;
  completionThreshold: number;
}

// ── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULTS: PreferencesState = {
  density: 'comfortable',
  defaultSpeed: 1,
  autoplayNext: true,
  resumeWhereLeftOff: true,
  completionThreshold: 90,
};

// ── Guard ────────────────────────────────────────────────────────────────────

function hasStorage(): boolean {
  return typeof localStorage !== 'undefined';
}

// ── Hydrate from localStorage ─────────────────────────────────────────────────

function loadFromStorage(): PreferencesState {
  if (!hasStorage()) return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<PreferencesState>;
    const validDensities: Density[] = ['comfortable', 'cozy', 'compact'];
    const rawDensity = parsed.density;
    return {
      density:
        rawDensity !== undefined && validDensities.includes(rawDensity)
          ? rawDensity
          : DEFAULTS.density,
      defaultSpeed:
        typeof parsed.defaultSpeed === 'number' && parsed.defaultSpeed > 0
          ? parsed.defaultSpeed
          : DEFAULTS.defaultSpeed,
      autoplayNext:
        typeof parsed.autoplayNext === 'boolean' ? parsed.autoplayNext : DEFAULTS.autoplayNext,
      resumeWhereLeftOff:
        typeof parsed.resumeWhereLeftOff === 'boolean'
          ? parsed.resumeWhereLeftOff
          : DEFAULTS.resumeWhereLeftOff,
      completionThreshold:
        typeof parsed.completionThreshold === 'number' &&
        parsed.completionThreshold >= 70 &&
        parsed.completionThreshold <= 100
          ? parsed.completionThreshold
          : DEFAULTS.completionThreshold,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

// ── Store ────────────────────────────────────────────────────────────────────

export const usePreferencesStore = defineStore('preferences', () => {
  const initial = loadFromStorage();

  const density = ref<Density>(initial.density);
  // TODO: useLessonPlayer reads this when it lands
  const defaultSpeed = ref<number>(initial.defaultSpeed);
  const autoplayNext = ref<boolean>(initial.autoplayNext);
  const resumeWhereLeftOff = ref<boolean>(initial.resumeWhereLeftOff);
  /**
   * Per-user display threshold for showing "completed" badge.
   * The backend uses 90 % as a hard threshold for `completed: true`;
   * this value only affects client-side UI indicators (e.g. lesson row badge).
   */
  const completionThreshold = ref<number>(initial.completionThreshold);

  // ── Persistence ─────────────────────────────────────────────────────────────

  function persist(): void {
    if (!hasStorage()) return;
    const state: PreferencesState = {
      density: density.value,
      defaultSpeed: defaultSpeed.value,
      autoplayNext: autoplayNext.value,
      resumeWhereLeftOff: resumeWhereLeftOff.value,
      completionThreshold: completionThreshold.value,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  watch([density, defaultSpeed, autoplayNext, resumeWhereLeftOff, completionThreshold], persist, {
    deep: false,
  });

  // ── Actions ──────────────────────────────────────────────────────────────────

  function setDensity(value: Density): void {
    density.value = value;
  }

  function setDefaultSpeed(value: number): void {
    defaultSpeed.value = value;
  }

  function setAutoplayNext(value: boolean): void {
    autoplayNext.value = value;
  }

  function setResumeWhereLeftOff(value: boolean): void {
    resumeWhereLeftOff.value = value;
  }

  function setCompletionThreshold(value: number): void {
    completionThreshold.value = value;
  }

  return {
    density,
    defaultSpeed,
    autoplayNext,
    resumeWhereLeftOff,
    completionThreshold,
    setDensity,
    setDefaultSpeed,
    setAutoplayNext,
    setResumeWhereLeftOff,
    setCompletionThreshold,
  };
});
