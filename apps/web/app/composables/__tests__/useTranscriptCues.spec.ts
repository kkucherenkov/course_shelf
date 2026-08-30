/**
 * Unit tests for useTranscriptCues.
 *
 * happy-dom ships no `TextTrackList`, so the composable is driven by a fake
 * video element: an array-like track list plus the two event targets the real
 * one exposes. Everything the composable actually depends on — `language`,
 * `mode`, `cues`, `addtrack` and the capture-phase `load` — is modelled here.
 */

import { describe, it, expect, vi } from 'vitest';
import { effectScope, ref } from 'vue';

import { useTranscriptCues } from '../useTranscriptCues';
import type { TranscriptCue } from '../useTranscriptCues';

// ── Fakes ─────────────────────────────────────────────────────────────────────

interface FakeCue {
  startTime: number;
  endTime: number;
  text: string;
}

class FakeTrack {
  cues: FakeCue[] | null;

  constructor(
    readonly language: string,
    public mode: TextTrackMode,
    cues: FakeCue[] | null,
  ) {
    this.cues = cues;
  }
}

function fakeVideo(tracks: FakeTrack[]) {
  const listeners = new Map<string, Set<EventListener>>();

  const on = (type: string, fn: EventListener): void => {
    const set = listeners.get(type) ?? new Set();
    set.add(fn);
    listeners.set(type, set);
  };
  const off = (type: string, fn: EventListener): void => {
    listeners.get(type)?.delete(fn);
  };
  const fire = (type: string): void => {
    for (const fn of listeners.get(type) ?? []) fn(new Event(type));
  };

  const textTracks = Object.assign([...tracks], {
    addEventListener: on,
    removeEventListener: off,
  });

  const el = { textTracks, addEventListener: on, removeEventListener: off };

  return {
    el: el as unknown as HTMLVideoElement,
    fire,
    listenerCount: (type: string) => listeners.get(type)?.size ?? 0,
  };
}

const CUES: FakeCue[] = [
  { startTime: 0, endTime: 2, text: 'first' },
  { startTime: 2, endTime: 4, text: 'second' },
  { startTime: 6, endTime: 8, text: 'third (after a gap)' },
];

/** Runs the composable in its own scope so `onScopeDispose` has one. */
function mount(opts: Parameters<typeof useTranscriptCues>[0]) {
  const scope = effectScope();
  const api = scope.run(() => useTranscriptCues(opts));
  if (!api) throw new Error('scope did not run');
  return { ...api, stop: () => scope.stop() };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useTranscriptCues', () => {
  it('picks the track matching the UI locale', () => {
    const ru = new FakeTrack('ru', 'disabled', [{ startTime: 0, endTime: 1, text: 'привет' }]);
    const en = new FakeTrack('en', 'disabled', CUES);
    const { el } = fakeVideo([en, ru]);

    const { cues, hasTranscript } = mount({
      videoRef: ref(el),
      position: ref(0),
      preferredLanguage: 'ru-RU',
    });

    expect(hasTranscript.value).toBe(true);
    expect(cues.value.map((c: TranscriptCue) => c.text)).toEqual(['привет']);
  });

  it('falls back to the first track when no language matches', () => {
    const en = new FakeTrack('en', 'disabled', CUES);
    const { el } = fakeVideo([en, new FakeTrack('de', 'disabled', [])]);

    const { cues } = mount({
      videoRef: ref(el),
      position: ref(0),
      preferredLanguage: 'fr-FR',
    });

    expect(cues.value).toHaveLength(CUES.length);
  });

  it('promotes a disabled track to hidden so the browser parses it', () => {
    const track = new FakeTrack('en', 'disabled', null);
    const { el } = fakeVideo([track]);

    const { hasTranscript } = mount({
      videoRef: ref(el),
      position: ref(0),
      preferredLanguage: 'en',
    });

    expect(track.mode).toBe('hidden');
    // `cues === null` on a track the browser has not parsed yet.
    expect(hasTranscript.value).toBe(false);
  });

  it('leaves a showing track alone', () => {
    const track = new FakeTrack('en', 'showing', CUES);
    const { el } = fakeVideo([track]);

    mount({ videoRef: ref(el), position: ref(0), preferredLanguage: 'en' });

    expect(track.mode).toBe('showing');
  });

  it('is empty with no tracks at all', () => {
    const { el } = fakeVideo([]);

    const { cues, activeIndex, hasTranscript } = mount({
      videoRef: ref(el),
      position: ref(1),
      preferredLanguage: 'en',
    });

    expect(cues.value).toEqual([]);
    expect(hasTranscript.value).toBe(false);
    expect(activeIndex.value).toBe(-1);
  });

  it('re-reads when the <track> element fires load', () => {
    const track = new FakeTrack('en', 'disabled', null);
    const { el, fire } = fakeVideo([track]);

    const { cues, hasTranscript } = mount({
      videoRef: ref(el),
      position: ref(0),
      preferredLanguage: 'en',
    });

    expect(cues.value).toEqual([]);

    track.cues = CUES;
    fire('load');

    expect(hasTranscript.value).toBe(true);
    expect(cues.value[0]).toEqual({ start: 0, end: 2, text: 'first' });
  });

  it('re-reads when a track is added after mount', () => {
    const { el, fire } = fakeVideo([]);
    const { cues } = mount({
      videoRef: ref(el),
      position: ref(0),
      preferredLanguage: 'en',
    });

    expect(cues.value).toEqual([]);

    (el.textTracks as unknown as FakeTrack[]).push(new FakeTrack('en', 'disabled', CUES));
    fire('addtrack');

    expect(cues.value).toHaveLength(CUES.length);
  });

  it('tracks the active cue as the playhead moves, and reports -1 in a gap', () => {
    const { el } = fakeVideo([new FakeTrack('en', 'showing', CUES)]);
    const position = ref(0);

    const { activeIndex } = mount({ videoRef: ref(el), position, preferredLanguage: 'en' });

    expect(activeIndex.value).toBe(0);
    position.value = 2;
    expect(activeIndex.value).toBe(1);
    position.value = 5; // gap between the second and third cue
    expect(activeIndex.value).toBe(-1);
    position.value = 7;
    expect(activeIndex.value).toBe(2);
    position.value = 99;
    expect(activeIndex.value).toBe(-1);
  });

  it('detaches from the old element and re-reads when the video ref changes', async () => {
    const first = fakeVideo([new FakeTrack('en', 'showing', CUES)]);
    const second = fakeVideo([new FakeTrack('en', 'showing', [])]);
    const videoRef = ref<HTMLVideoElement | null>(first.el);

    const { cues, stop } = mount({ videoRef, position: ref(0), preferredLanguage: 'en' });
    expect(cues.value).toHaveLength(CUES.length);
    expect(first.listenerCount('load')).toBe(1);

    videoRef.value = second.el;
    await vi.waitFor(() => expect(cues.value).toEqual([]));
    expect(first.listenerCount('load')).toBe(0);
    expect(second.listenerCount('load')).toBe(1);

    stop();
    expect(second.listenerCount('load')).toBe(0);
  });
});
