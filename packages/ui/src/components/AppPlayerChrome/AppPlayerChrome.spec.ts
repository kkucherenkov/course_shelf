import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import AppPlayerChrome from './AppPlayerChrome.vue';

// The gear button opens an AppDialog (native <dialog>). JSDOM/happy-dom don't
// implement showModal()/close() — see AppDialog.spec.ts for the same stub.
beforeAll(() => {
  const proto = HTMLElement.prototype as unknown as HTMLDialogElement;
  if (typeof proto.showModal !== 'function') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test-only DOM polyfill
    (proto as any).showModal = function (this: HTMLDialogElement) {
      (this as unknown as Record<string, unknown>)['open'] = true;
    };
  }
  if (typeof proto.close !== 'function') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test-only DOM polyfill
    (proto as any).close = function (this: HTMLDialogElement) {
      (this as unknown as Record<string, unknown>)['open'] = false;
    };
  }
});

const baseProps = {
  position: 60, // 1:00
  duration: 600, // 10:00
};

function makeWrapper(props: Record<string, unknown> = {}) {
  return mount(AppPlayerChrome, { props: { ...baseProps, ...props } });
}

function press(wrapper: ReturnType<typeof makeWrapper>, key: string): Promise<void> {
  return wrapper.find('.app-player-chrome').trigger('keydown', { key });
}

describe('AppPlayerChrome', () => {
  describe('layout modes', () => {
    it('renders the full chrome in overlay mode', () => {
      const wrapper = makeWrapper();
      expect(wrapper.find('.app-player-chrome--overlay').exists()).toBe(true);
      // Both elements exist; overlay is visible, mini is hidden via v-show.
      const overlay = wrapper.find('.app-player-chrome__overlay');
      const mini = wrapper.find('.app-player-chrome__mini');
      expect(overlay.exists()).toBe(true);
      expect((overlay.element as HTMLElement).style.display).not.toBe('none');
      expect((mini.element as HTMLElement).style.display).toBe('none');
    });

    it('shows only the slim played bar in minimal mode', () => {
      const wrapper = makeWrapper({ mode: 'minimal' });
      const overlay = wrapper.find('.app-player-chrome__overlay');
      const mini = wrapper.find('.app-player-chrome__mini');
      expect((overlay.element as HTMLElement).style.display).toBe('none');
      expect((mini.element as HTMLElement).style.display).not.toBe('none');
      expect(wrapper.find('.app-player-chrome__mini-played').exists()).toBe(true);
    });
  });

  describe('state matrix', () => {
    it.each(['idle', 'playing', 'paused'] as const)('renders no state overlay in %s', (state) => {
      const wrapper = makeWrapper({ state });
      expect(wrapper.find('.app-player-chrome__state-overlay').exists()).toBe(false);
      expect(wrapper.find('.app-player-chrome__end-banner').exists()).toBe(false);
    });

    it('renders the buffer spinner in buffering', () => {
      const wrapper = makeWrapper({ state: 'buffering' });
      expect(wrapper.find('.app-player-chrome__buffer-spinner').exists()).toBe(true);
      expect(wrapper.find('.app-player-chrome__state-overlay').attributes('role')).toBe('status');
    });

    it('renders the error overlay with retry button', async () => {
      const wrapper = makeWrapper({ state: 'error', errorMessage: 'No connection' });
      expect(wrapper.find('.app-player-chrome__state-overlay').attributes('role')).toBe('alert');
      expect(wrapper.text()).toContain('No connection');
      const retry = wrapper.findAll('button').find((b) => b.text() === 'Try again');
      expect(retry).toBeDefined();
      await retry!.trigger('click');
      expect(wrapper.emitted('retry')).toEqual([[]]);
    });

    it('renders the locked overlay with the lock icon', () => {
      const wrapper = makeWrapper({ state: 'locked' });
      const overlay = wrapper.find('.app-player-chrome__state-overlay');
      expect(overlay.exists()).toBe(true);
      expect(wrapper.text()).toContain('don’t have access');
    });

    it('renders the end banner with countdown + Stay/Play actions', async () => {
      const wrapper = makeWrapper({
        state: 'end',
        endNext: { title: 'Lesson 13 · Causal consistency', countdownSec: 5 },
      });
      const banner = wrapper.find('.app-player-chrome__end-banner');
      expect(banner.exists()).toBe(true);
      expect(banner.text()).toContain('Up next in 5s');
      expect(banner.text()).toContain('Lesson 13 · Causal consistency');
      const stay = wrapper.findAll('button').find((b) => b.text() === 'Stay here');
      const playNext = wrapper.findAll('button').find((b) => b.text().includes('Play next'));
      await stay!.trigger('click');
      await playNext!.trigger('click');
      expect(wrapper.emitted('stayHere')).toEqual([[]]);
      expect(wrapper.emitted('nextLesson')).toEqual([[]]);
    });

    it('skips the end banner when endNext is missing', () => {
      const wrapper = makeWrapper({ state: 'end' });
      expect(wrapper.find('.app-player-chrome__end-banner').exists()).toBe(false);
    });
  });

  describe('scrubber', () => {
    it('renders track + buffered + played widths from props', () => {
      const wrapper = makeWrapper({ position: 150, duration: 600, buffered: 240 });
      const buf = wrapper.find('.app-player-chrome__scrubber-buf');
      const played = wrapper.find('.app-player-chrome__scrubber-played');
      expect((buf.element as HTMLElement).style.width).toBe('40%'); // 240 / 600
      expect((played.element as HTMLElement).style.width).toBe('25%'); // 150 / 600
    });

    it('renders one chapter tick per chapter fraction', () => {
      const wrapper = makeWrapper({ chapters: [0.25, 0.5, 0.75] });
      const ticks = wrapper.findAll('.app-player-chrome__scrubber-chap');
      expect(ticks).toHaveLength(3);
      expect((ticks[1]!.element as HTMLElement).style.left).toBe('50%');
    });

    it('renders one bookmark marker per bookmark and emits seek on click', async () => {
      const wrapper = makeWrapper({
        position: 0,
        duration: 600,
        bookmarks: [{ time: 60, label: 'Intro recap' }, { time: 300 }],
      });
      const marks = wrapper.findAll('.app-player-chrome__scrubber-bm');
      expect(marks).toHaveLength(2);
      expect((marks[0]!.element as HTMLElement).style.left).toBe('10%');
      expect(marks[0]!.attributes('aria-label')).toBe('Intro recap');
      expect(marks[1]!.attributes('aria-label')).toBe('Bookmark at 5:00');

      await marks[1]!.trigger('click');
      const seek = wrapper.emitted('seek');
      expect(seek?.[0]).toEqual([300]);
    });

    it('exposes the slider role + numeric aria props', () => {
      const wrapper = makeWrapper({ position: 90, duration: 600 });
      const slider = wrapper.find('[role="slider"]');
      expect(slider.exists()).toBe(true);
      expect(slider.attributes('aria-valuemin')).toBe('0');
      expect(slider.attributes('aria-valuemax')).toBe('600');
      expect(slider.attributes('aria-valuenow')).toBe('90');
      expect(slider.attributes('aria-valuetext')).toBe('1:30 of 10:00');
    });
  });

  describe('time labels', () => {
    it('formats short durations as M:SS', () => {
      const wrapper = makeWrapper({ position: 65, duration: 425 });
      expect(wrapper.find('.app-player-chrome__time').text()).toBe('1:05 / 7:05');
    });

    it('formats hour-long durations as H:MM:SS', () => {
      const wrapper = makeWrapper({ position: 3725, duration: 7325 });
      expect(wrapper.find('.app-player-chrome__time').text()).toBe('1:02:05 / 2:02:05');
    });
  });

  describe('control buttons', () => {
    it('emits play when paused and the play button is clicked', async () => {
      const wrapper = makeWrapper({ state: 'paused' });
      const playBtn = wrapper.find('button[aria-label="Play"]');
      await playBtn.trigger('click');
      expect(wrapper.emitted('play')).toEqual([[]]);
      expect(wrapper.emitted('pause')).toBeUndefined();
    });

    it('emits pause when playing and the pause button is clicked', async () => {
      const wrapper = makeWrapper({ state: 'playing' });
      const pauseBtn = wrapper.find('button[aria-label="Pause"]');
      await pauseBtn.trigger('click');
      expect(wrapper.emitted('pause')).toEqual([[]]);
      expect(wrapper.emitted('play')).toBeUndefined();
    });

    it('emits togglePip / toggleSubtitles / toggleFullscreen / toggleMute / nextLesson / prevLesson', async () => {
      const wrapper = makeWrapper({ state: 'playing' });
      await wrapper.find('button[aria-label="Picture in picture"]').trigger('click');
      await wrapper.find('button[aria-label="Enable subtitles"]').trigger('click');
      await wrapper.find('button[aria-label="Enter fullscreen"]').trigger('click');
      await wrapper.find('button[aria-label="Mute"]').trigger('click');
      await wrapper.find('button[aria-label="Next lesson"]').trigger('click');
      await wrapper.find('button[aria-label="Previous lesson"]').trigger('click');
      expect(wrapper.emitted('togglePip')).toEqual([[]]);
      expect(wrapper.emitted('toggleSubtitles')).toEqual([[]]);
      expect(wrapper.emitted('toggleFullscreen')).toEqual([[]]);
      expect(wrapper.emitted('toggleMute')).toEqual([[]]);
      expect(wrapper.emitted('nextLesson')).toEqual([[]]);
      expect(wrapper.emitted('prevLesson')).toEqual([[]]);
    });

    it('reflects muted/subtitles/fullscreen state via aria-pressed and icon', () => {
      const wrapper = makeWrapper({
        muted: true,
        subtitlesEnabled: true,
        fullscreen: true,
      });
      expect(wrapper.find('button[aria-label="Unmute"]').attributes('aria-pressed')).toBe('true');
      expect(
        wrapper.find('button[aria-label="Disable subtitles"]').attributes('aria-pressed'),
      ).toBe('true');
      expect(wrapper.find('button[aria-label="Exit fullscreen"]').attributes('aria-pressed')).toBe(
        'true',
      );
    });

    it('hides the PIP button when pipAvailable is false', () => {
      const wrapper = makeWrapper({ pipAvailable: false });
      expect(wrapper.find('button[aria-label="Picture in picture"]').exists()).toBe(false);
    });

    it('disables the play button in locked / error states', () => {
      const locked = makeWrapper({ state: 'locked' });
      expect((locked.find('button[aria-label="Play"]').element as HTMLButtonElement).disabled).toBe(
        true,
      );
      const errored = makeWrapper({ state: 'error' });
      expect(
        (errored.find('button[aria-label="Play"]').element as HTMLButtonElement).disabled,
      ).toBe(true);
    });

    // Previously only play was gated — mute/speed/subtitles/fullscreen/pip
    // stayed clickable in locked/error and kept emitting into a dead video.
    it('disables mute, speed, subtitles, fullscreen and pip in locked / error states', () => {
      for (const state of ['locked', 'error'] as const) {
        const wrapper = makeWrapper({ state });
        for (const label of [
          'Mute',
          'Playback speed',
          'Enable subtitles',
          'Enter fullscreen',
          'Picture in picture',
        ]) {
          expect(
            (wrapper.find(`button[aria-label="${label}"]`).element as HTMLButtonElement).disabled,
          ).toBe(true);
        }
      }
    });

    it('disables the prev control when hasPrev is false', () => {
      const wrapper = makeWrapper({ hasPrev: false });
      expect(
        (wrapper.find('button[aria-label="Previous lesson"]').element as HTMLButtonElement)
          .disabled,
      ).toBe(true);
    });

    it('disables the next control when hasNext is false', () => {
      const wrapper = makeWrapper({ hasNext: false });
      expect(
        (wrapper.find('button[aria-label="Next lesson"]').element as HTMLButtonElement).disabled,
      ).toBe(true);
    });

    it('renders custom visible labels from props', () => {
      const errored = makeWrapper({ state: 'error', retryLabel: 'Повторить' });
      expect(errored.findAll('button').some((b) => b.text() === 'Повторить')).toBe(true);
      const locked = makeWrapper({ state: 'locked', lockedLabel: 'Нет доступа' });
      expect(locked.text()).toContain('Нет доступа');
    });

    it('applies ariaLabels overrides to control labels', () => {
      const wrapper = makeWrapper({
        ariaLabels: { nextLesson: 'Следующий урок', player: 'Видеоплеер' },
      });
      expect(wrapper.find('button[aria-label="Следующий урок"]').exists()).toBe(true);
      expect(wrapper.find('[aria-label="Видеоплеер"]').exists()).toBe(true);
    });

    // Two thirds of lessons have no transcript track — the CC button used to
    // stay enabled and silently self-revert (`onTextTracksChange` flips
    // `subtitlesOn` straight back to false with no feedback to the user).
    it('disables the CC button and swaps its label when no subtitles are available', () => {
      const wrapper = makeWrapper({ subtitlesAvailable: false });
      const cc = wrapper.find('button[aria-label="No subtitles for this lesson"]');
      expect(cc.exists()).toBe(true);
      expect((cc.element as HTMLButtonElement).disabled).toBe(true);
    });

    it('keeps the CC button enabled and labelled normally when subtitles exist', () => {
      const wrapper = makeWrapper({ subtitlesAvailable: true });
      expect(
        (wrapper.find('button[aria-label="Enable subtitles"]').element as HTMLButtonElement)
          .disabled,
      ).toBe(false);
    });
  });

  describe('keyboard-shortcuts dialog', () => {
    it('opens on gear click, titled and listing every shortcut line', async () => {
      const wrapper = makeWrapper({
        shortcutsTitle: 'Shortcuts',
        shortcuts: ['Space — Play/pause', 'F — Fullscreen'],
      });
      await wrapper.find('button[aria-label="Keyboard shortcuts"]').trigger('click');
      expect(wrapper.text()).toContain('Shortcuts');
      const items = wrapper.findAll('.app-player-chrome__shortcuts-item');
      expect(items.map((i) => i.text())).toEqual(['Space — Play/pause', 'F — Fullscreen']);
    });

    it('disables the gear button in locked / error states', () => {
      const wrapper = makeWrapper({ state: 'error' });
      expect(
        (wrapper.find('button[aria-label="Keyboard shortcuts"]').element as HTMLButtonElement)
          .disabled,
      ).toBe(true);
    });
  });

  describe('exposed root element', () => {
    it('getRootEl() returns the component root, for the page to fullscreen', () => {
      const wrapper = makeWrapper();
      expect(wrapper.vm.getRootEl()).toBe(wrapper.element);
    });
  });

  describe('overlay idle-hide', () => {
    // A ref flip inside a real (fake-clock) setTimeout callback still has to
    // clear Vue's microtask-based render scheduler before the DOM reflects
    // it — `nextTick()` after every `advanceTimersByTime` call, not just a
    // synchronous assertion.
    it('hides the overlay after the idle delay while playing', async () => {
      vi.useFakeTimers();
      const wrapper = makeWrapper({ state: 'playing' });
      expect(wrapper.classes()).not.toContain('app-player-chrome--idle-hidden');
      vi.advanceTimersByTime(3000);
      await nextTick();
      expect(wrapper.classes()).toContain('app-player-chrome--idle-hidden');
      vi.useRealTimers();
    });

    it('never hides while paused, buffering, locked, or errored', async () => {
      vi.useFakeTimers();
      for (const state of ['paused', 'buffering', 'locked', 'error'] as const) {
        const wrapper = makeWrapper({ state });
        vi.advanceTimersByTime(10_000);
        await nextTick();
        expect(wrapper.classes()).not.toContain('app-player-chrome--idle-hidden');
      }
      vi.useRealTimers();
    });

    it('re-shows on pointermove and restarts the idle countdown', async () => {
      vi.useFakeTimers();
      const wrapper = makeWrapper({ state: 'playing' });
      vi.advanceTimersByTime(3000);
      await nextTick();
      expect(wrapper.classes()).toContain('app-player-chrome--idle-hidden');

      await wrapper.find('.app-player-chrome').trigger('pointermove');
      expect(wrapper.classes()).not.toContain('app-player-chrome--idle-hidden');

      // Still hidden again after another full delay, not immediately.
      vi.advanceTimersByTime(2999);
      await nextTick();
      expect(wrapper.classes()).not.toContain('app-player-chrome--idle-hidden');
      vi.advanceTimersByTime(1);
      await nextTick();
      expect(wrapper.classes()).toContain('app-player-chrome--idle-hidden');
      vi.useRealTimers();
    });

    it('re-shows when playback pauses', async () => {
      vi.useFakeTimers();
      const wrapper = makeWrapper({ state: 'playing' });
      vi.advanceTimersByTime(3000);
      await nextTick();
      expect(wrapper.classes()).toContain('app-player-chrome--idle-hidden');

      await wrapper.setProps({ state: 'paused' });
      expect(wrapper.classes()).not.toContain('app-player-chrome--idle-hidden');
      vi.useRealTimers();
    });
  });

  describe('keyboard map', () => {
    it('Space + K toggle play / pause', async () => {
      const playing = makeWrapper({ state: 'playing' });
      await press(playing, ' ');
      expect(playing.emitted('pause')).toEqual([[]]);

      const paused = makeWrapper({ state: 'paused' });
      await press(paused, 'k');
      expect(paused.emitted('play')).toEqual([[]]);
    });

    it('Arrow keys seek by ±5s', async () => {
      const wrapper = makeWrapper({ state: 'playing', position: 100, duration: 600 });
      await press(wrapper, 'ArrowLeft');
      await press(wrapper, 'ArrowRight');
      expect(wrapper.emitted('seek')).toEqual([[95], [105]]);
    });

    it('J / L seek by ±10s', async () => {
      const wrapper = makeWrapper({ state: 'playing', position: 100, duration: 600 });
      await press(wrapper, 'j');
      await press(wrapper, 'l');
      expect(wrapper.emitted('seek')).toEqual([[90], [110]]);
    });

    it('clamps seek to [0, duration]', async () => {
      const wrapper = makeWrapper({ state: 'playing', position: 2, duration: 600 });
      await press(wrapper, 'j'); // -10 → 0
      const at = makeWrapper({ state: 'playing', position: 595, duration: 600 });
      await press(at, 'l'); // +10 → 600
      expect(wrapper.emitted('seek')?.[0]).toEqual([0]);
      expect(at.emitted('seek')?.[0]).toEqual([600]);
    });

    it('F emits toggleFullscreen, M emits toggleMute', async () => {
      const wrapper = makeWrapper({ state: 'playing' });
      await press(wrapper, 'f');
      await press(wrapper, 'm');
      expect(wrapper.emitted('toggleFullscreen')).toEqual([[]]);
      expect(wrapper.emitted('toggleMute')).toEqual([[]]);
    });

    it('comma / period seek by ±1/24s (frame step)', async () => {
      const wrapper = makeWrapper({ state: 'playing', position: 1, duration: 600 });
      await press(wrapper, ',');
      await press(wrapper, '.');
      const seeks = wrapper.emitted('seek');
      expect(seeks).toBeDefined();
      const [back, fwd] = seeks!.map((args) => Number((args as number[])[0]).toFixed(4));
      expect(back).toBe('0.9583');
      expect(fwd).toBe('1.0417');
    });

    it('digit 0..9 jumps to n×10% of duration', async () => {
      const wrapper = makeWrapper({ state: 'playing', position: 0, duration: 1000 });
      await press(wrapper, '0');
      await press(wrapper, '5');
      await press(wrapper, '9');
      expect(wrapper.emitted('seek')).toEqual([[0], [500], [900]]);
    });

    it('does not emit seek/play in locked or error state', async () => {
      const locked = makeWrapper({ state: 'locked', position: 100, duration: 600 });
      await press(locked, ' ');
      await press(locked, 'ArrowLeft');
      await press(locked, '5');
      expect(locked.emitted('play')).toBeUndefined();
      expect(locked.emitted('pause')).toBeUndefined();
      expect(locked.emitted('seek')).toBeUndefined();
    });
  });

  describe('frame slot', () => {
    // The letterbox rule for slotted media is `::v-slotted(video)`, which only
    // matches when Vue stamps the slotted scope id (`data-v-…-s`) onto the
    // caller's element. Assert the stamp — without it a non-16:9 video keeps
    // its intrinsic ratio and overflows the 16:9 stage.
    it('stamps the slotted scope id on media passed to the frame', () => {
      const wrapper = mount(AppPlayerChrome, {
        props: baseProps,
        slots: { frame: '<video class="stub" />' },
      });
      const video = wrapper.find('video.stub');
      expect(video.exists()).toBe(true);
      const slotted = Object.keys(video.attributes()).filter((a) => /^data-v-.+-s$/.test(a));
      expect(slotted).toHaveLength(1);
    });
  });

  describe('frame tap (#596)', () => {
    // Before this fix the root had no click/pointerdown listener at all — a
    // motionless tap (the only gesture a touchscreen sends before scrubbing)
    // could neither bring the overlay back nor toggle playback.
    it('re-shows an idle-hidden overlay on tap, without toggling playback', async () => {
      vi.useFakeTimers();
      const wrapper = makeWrapper({ state: 'playing' });
      vi.advanceTimersByTime(3000);
      await nextTick();
      expect(wrapper.classes()).toContain('app-player-chrome--idle-hidden');

      await wrapper.find('.app-player-chrome').trigger('click');
      expect(wrapper.classes()).not.toContain('app-player-chrome--idle-hidden');
      expect(wrapper.emitted('pause')).toBeUndefined();
      vi.useRealTimers();
    });

    it('toggles play/pause on a frame tap once the overlay is already visible', async () => {
      const wrapper = makeWrapper({ state: 'paused' });
      await wrapper.find('.app-player-chrome__frame').trigger('click');
      expect(wrapper.emitted('play')).toEqual([[]]);
    });

    it('does not double-fire when the tap lands on a control button', async () => {
      const wrapper = makeWrapper({ state: 'paused' });
      await wrapper.find('button[aria-label="Play"]').trigger('click');
      expect(wrapper.emitted('play')).toEqual([[]]);
    });

    it('does not double-fire when the tap lands on the scrubber', async () => {
      const wrapper = makeWrapper({ position: 0, duration: 600 });
      const slider = wrapper.find('[role="slider"]');
      const el = slider.element as HTMLElement;
      el.getBoundingClientRect = (): DOMRect =>
        ({ left: 0, top: 0, right: 200, bottom: 16, width: 200, height: 16 }) as DOMRect;
      await slider.trigger('click', { clientX: 50 });
      expect(wrapper.emitted('seek')).toHaveLength(1);
      expect(wrapper.emitted('play')).toBeUndefined();
      expect(wrapper.emitted('pause')).toBeUndefined();
    });
  });

  describe('scrubber click', () => {
    it('emits seek with the clicked fraction × duration', async () => {
      const wrapper = makeWrapper({ position: 0, duration: 600 });
      const slider = wrapper.find('[role="slider"]');
      // Stub getBoundingClientRect for the scrubber element.
      const el = slider.element as HTMLElement;
      el.getBoundingClientRect = (): DOMRect =>
        ({ left: 0, top: 0, right: 200, bottom: 16, width: 200, height: 16 }) as DOMRect;
      await slider.trigger('click', { clientX: 50 });
      expect(wrapper.emitted('seek')?.[0]).toEqual([150]); // 25% of 600
    });
  });

  describe('transport controls', () => {
    it('skips back 15 seconds without going below zero', async () => {
      const wrapper = makeWrapper({ position: 5, duration: 600 });
      await wrapper.find('.app-player-chrome__btn--skip-back').trigger('click');
      expect(wrapper.emitted('seek')?.[0]).toEqual([0]);
    });

    it('skips forward 15 seconds without passing the duration', async () => {
      const wrapper = makeWrapper({ position: 595, duration: 600 });
      await wrapper.find('.app-player-chrome__btn--skip-forward').trigger('click');
      expect(wrapper.emitted('seek')?.[0]).toEqual([600]);
    });

    it('skips by exactly 15 seconds away from the boundaries', async () => {
      const wrapper = makeWrapper({ position: 100, duration: 600 });
      await wrapper.find('.app-player-chrome__btn--skip-back').trigger('click');
      await wrapper.find('.app-player-chrome__btn--skip-forward').trigger('click');
      expect(wrapper.emitted('seek')).toEqual([[85], [115]]);
    });

    it('does not skip in an inert state', async () => {
      const wrapper = makeWrapper({ state: 'locked' });
      await wrapper.find('.app-player-chrome__btn--skip-back').trigger('click');
      expect(wrapper.emitted('seek')).toBeUndefined();
    });

    it('labels the skip buttons from ariaLabels', () => {
      const wrapper = makeWrapper({
        ariaLabels: { skipBack: 'Назад 15 секунд', skipForward: 'Вперёд 15 секунд' },
      });
      expect(wrapper.find('.app-player-chrome__btn--skip-back').attributes('aria-label')).toBe(
        'Назад 15 секунд',
      );
      expect(wrapper.find('.app-player-chrome__btn--skip-forward').attributes('aria-label')).toBe(
        'Вперёд 15 секунд',
      );
    });
  });

  describe('big play affordance', () => {
    it('shows over the picture while idle', () => {
      const wrapper = makeWrapper({ state: 'idle' });
      expect(wrapper.find('.app-player-chrome__big-play').exists()).toBe(true);
    });

    it('shows while paused', () => {
      const wrapper = makeWrapper({ state: 'paused' });
      expect(wrapper.find('.app-player-chrome__big-play').exists()).toBe(true);
    });

    it('is gone while playing', () => {
      const wrapper = makeWrapper({ state: 'playing' });
      expect(wrapper.find('.app-player-chrome__big-play').exists()).toBe(false);
    });

    it('stays out of the way of the buffering, error, locked and end overlays', () => {
      for (const state of ['buffering', 'error', 'locked'] as const) {
        const wrapper = makeWrapper({ state });
        expect(wrapper.find('.app-player-chrome__big-play').exists()).toBe(false);
      }
      const ended = makeWrapper({ state: 'end', endNext: { title: 'Next one' } });
      expect(ended.find('.app-player-chrome__big-play').exists()).toBe(false);
    });

    it('emits play when clicked, and does not double-fire through the frame tap', async () => {
      const wrapper = makeWrapper({ state: 'paused' });
      await wrapper.find('.app-player-chrome__big-play').trigger('click');
      expect(wrapper.emitted('play')).toHaveLength(1);
    });
  });

  describe('toggle state is visible, not only announced', () => {
    it('marks the subtitles button active when subtitles are on', () => {
      const wrapper = makeWrapper({ subtitlesEnabled: true });
      const cc = wrapper.find('[aria-pressed="true"].app-player-chrome__btn--subtitles');
      expect(cc.exists()).toBe(true);
      expect(cc.classes()).toContain('app-player-chrome__btn--active');
    });

    it('leaves it unmarked when subtitles are off', () => {
      const wrapper = makeWrapper({ subtitlesEnabled: false });
      const cc = wrapper.find('.app-player-chrome__btn--subtitles');
      expect(cc.classes()).not.toContain('app-player-chrome__btn--active');
    });

    it('never marks it active when the lesson has no subtitle tracks', () => {
      const wrapper = makeWrapper({ subtitlesEnabled: true, subtitlesAvailable: false });
      const cc = wrapper.find('.app-player-chrome__btn--subtitles');
      expect(cc.classes()).not.toContain('app-player-chrome__btn--active');
      expect(cc.attributes('disabled')).toBeDefined();
    });

    it('marks the fullscreen button active in fullscreen', () => {
      const wrapper = makeWrapper({ fullscreen: true });
      expect(wrapper.find('.app-player-chrome__btn--fullscreen').classes()).toContain(
        'app-player-chrome__btn--active',
      );
    });
  });
});
