import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppPlayerChrome from './AppPlayerChrome.vue';

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
});
