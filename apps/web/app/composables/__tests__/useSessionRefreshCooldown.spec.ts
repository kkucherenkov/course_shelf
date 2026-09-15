import { describe, it, expect, beforeEach } from 'vitest';
import {
  lastTransientRefreshFailureAt,
  isRefreshCoolingDown,
  resetRefreshCooldown,
} from '../useSessionRefreshCooldown';

describe('useSessionRefreshCooldown', () => {
  beforeEach(() => {
    resetRefreshCooldown();
  });

  it('is not cooling down before any failure was recorded', () => {
    expect(isRefreshCoolingDown(1_000_000)).toBe(false);
  });

  it('is cooling down immediately after a failure', () => {
    lastTransientRefreshFailureAt.value = 1_000_000;
    expect(isRefreshCoolingDown(1_000_100)).toBe(true);
  });

  it('stops cooling down once the window elapses', () => {
    lastTransientRefreshFailureAt.value = 1_000_000;
    expect(isRefreshCoolingDown(1_005_000)).toBe(false);
  });

  it('resetRefreshCooldown() clears a recorded failure', () => {
    lastTransientRefreshFailureAt.value = 1_000_000;
    resetRefreshCooldown();
    expect(isRefreshCoolingDown(1_000_100)).toBe(false);
  });
});
