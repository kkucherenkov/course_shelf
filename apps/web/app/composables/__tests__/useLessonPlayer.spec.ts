/**
 * Unit tests for useLessonPlayer.
 *
 * happy-dom's `<video>` has no working `textTracks` change wiring and no
 * `requestFullscreen` at all, so the composable is driven by a minimal fake
 * element — same approach as useTranscriptCues.spec.ts.
 */

import { describe, it, expect, vi } from 'vitest';

import { useLessonPlayer, PLAYBACK_SPEEDS } from '../useLessonPlayer';

// ── Fakes ─────────────────────────────────────────────────────────────────────

function fakeVideoEl() {
  const listeners = new Map<string, Set<EventListener>>();
  const on = (type: string, fn: EventListener): void => {
    const set = listeners.get(type) ?? new Set();
    set.add(fn);
    listeners.set(type, set);
  };
  const off = (type: string, fn: EventListener): void => {
    listeners.get(type)?.delete(fn);
  };

  const textTracks = Object.assign([], { addEventListener: on, removeEventListener: off });

  const el = {
    textTracks,
    addEventListener: on,
    removeEventListener: off,
    playbackRate: 1,
    requestFullscreen: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
  };

  return el as unknown as HTMLVideoElement;
}

function fakeChromeRootEl() {
  return { requestFullscreen: vi.fn() } as unknown as HTMLElement;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useLessonPlayer', () => {
  describe('initial speed', () => {
    it('defaults speed to 1 when no initialSpeed is given', () => {
      const player = useLessonPlayer();
      expect(player.speed.value).toBe(1);
    });

    it('seeds speed from options.initialSpeed', () => {
      const player = useLessonPlayer({ initialSpeed: 1.5 });
      expect(player.speed.value).toBe(1.5);
    });

    it('applies the seeded speed to the video element on attach', () => {
      const player = useLessonPlayer({ initialSpeed: 1.5 });
      const el = fakeVideoEl();
      player.attach(el);
      expect(el.playbackRate).toBe(1.5);
    });
  });

  describe('speed ladder', () => {
    it('exports the unified ladder both surfaces read', () => {
      // Regression guard for the settings-page / player drift: settings used
      // to omit 0.5×, the player used to omit 0.75×.
      expect(PLAYBACK_SPEEDS).toEqual([0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]);
    });

    it('cycles 0.5x to 0.75x — the step the old player-only ladder skipped', () => {
      const player = useLessonPlayer({ initialSpeed: 0.5 });
      const el = fakeVideoEl();
      player.attach(el);

      player.onSpeed(0.5);

      expect(player.speed.value).toBe(0.75);
      expect(el.playbackRate).toBe(0.75);
    });

    it('wraps from the top of the ladder back to the bottom', () => {
      const player = useLessonPlayer({ initialSpeed: 2 });
      const el = fakeVideoEl();
      player.attach(el);

      player.onSpeed(2);

      expect(player.speed.value).toBe(0.5);
    });
  });

  describe('fullscreen target', () => {
    it('does nothing when the chrome root was never attached', () => {
      const player = useLessonPlayer();
      const el = fakeVideoEl();
      player.attach(el);

      player.onToggleFullscreen();

      expect(el.requestFullscreen).not.toHaveBeenCalled();
    });

    it('requests fullscreen on the chrome root, not the <video>', () => {
      const player = useLessonPlayer();
      const el = fakeVideoEl();
      const rootEl = fakeChromeRootEl();
      player.attach(el);
      player.attachChromeRoot(rootEl);

      player.onToggleFullscreen();

      expect(rootEl.requestFullscreen).toHaveBeenCalledTimes(1);
      expect(el.requestFullscreen).not.toHaveBeenCalled();
    });
  });
});
