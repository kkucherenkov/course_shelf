/**
 * useTranscriptCues
 *
 * Lifts the cues the browser already parsed out of a `<video>`'s text tracks
 * into a plain reactive array, so a transcript panel can stay presentational
 * and testable without a real media element.
 *
 * The subtlety this exists for: a `<track>` without `default` starts in mode
 * `disabled`, and a disabled `TextTrack` exposes `cues === null` — the browser
 * has not fetched the file at all. Promoting it to `hidden` makes it parse
 * without painting cues over the video; a `showing` track is left alone so the
 * chrome's subtitle toggle keeps owning that state.
 */

import { computed, onScopeDispose, ref, toValue, watch } from 'vue';
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue';

export interface TranscriptCue {
  /** Cue start, in seconds. */
  start: number;
  /** Cue end, in seconds. */
  end: number;
  text: string;
}

export interface UseTranscriptCuesOptions {
  videoRef: Ref<HTMLVideoElement | null>;
  /** Playhead position in seconds — drives `activeIndex`. */
  position: Ref<number>;
  /** UI locale (`en-US`) or bare language (`en`); matched against `track.language`. */
  preferredLanguage: MaybeRefOrGetter<string | null | undefined>;
}

export interface UseTranscriptCuesReturn {
  cues: Ref<TranscriptCue[]>;
  /** Index of the cue covering the playhead, `-1` when none does. */
  activeIndex: ComputedRef<number>;
  /**
   * Whether the selected `<track>` failed to load (network error, 404 on the
   * subtitle route, …). Read from the DOM element's own `readyState` rather
   * than a `TextTrack` field — `TextTrack` has no error state of its own.
   *
   * Deliberately not "hasTranscript": this composable only knows what the
   * browser managed to fetch and parse, which is silent on a lesson that has
   * a transcript the browser simply failed to load. The caller already knows
   * whether a transcript exists — the lesson payload's own `subtitles` array
   * — and should use that instead of asking this composable to infer it from
   * `cues.length` (see tuxedo/audit run20 finding 1).
   */
  hasError: Ref<boolean>;
}

// `HTMLTrackElement.ERROR` per spec — hardcoded rather than read off the
// class's own static property because happy-dom (the unit-test environment)
// implements `readyState` but leaves the `NONE`/`LOADING`/`LOADED`/`ERROR`
// statics `undefined`, which would make every comparison silently false in
// tests. The numeric value is part of the HTML spec and stable.
const TRACK_READY_STATE_ERROR = 3;

/** The track whose language matches the UI locale, else the first one. */
function selectTrack(el: HTMLVideoElement, preferred: string | null | undefined): TextTrack | null {
  const tracks = el.textTracks;
  const language = (preferred ?? '').split('-')[0];
  if (language) {
    for (const track of tracks) {
      if (track.language.split('-')[0] === language) return track;
    }
  }
  return tracks[0] ?? null;
}

/** The `<track>` DOM element backing a given `TextTrack` — no standard
 * reverse link exists, so this walks the video's own track elements. */
function findTrackElement(el: HTMLVideoElement, target: TextTrack): HTMLTrackElement | null {
  for (const trackEl of el.querySelectorAll('track')) {
    if (trackEl.track === target) return trackEl;
  }
  return null;
}

export function useTranscriptCues(opts: UseTranscriptCuesOptions): UseTranscriptCuesReturn {
  const { videoRef, position, preferredLanguage } = opts;

  const cues = ref<TranscriptCue[]>([]);
  const hasError = ref(false);

  function read(): void {
    const el = videoRef.value;
    const track = el ? selectTrack(el, toValue(preferredLanguage)) : null;
    if (!track) {
      cues.value = [];
      hasError.value = false;
      return;
    }

    if (track.mode === 'disabled') track.mode = 'hidden';

    const trackEl = el ? findTrackElement(el, track) : null;
    hasError.value = trackEl?.readyState === TRACK_READY_STATE_ERROR;

    const list = track.cues;
    const next: TranscriptCue[] = [];
    // Indexed loop rather than iteration: `TextTrackCueList` is array-like
    // first and iterable second, and it is `null` until the track is parsed.
    for (let i = 0; i < (list?.length ?? 0); i += 1) {
      const cue = list?.[i] as VTTCue | undefined;
      if (cue) next.push({ start: cue.startTime, end: cue.endTime, text: cue.text });
    }
    cues.value = next;
  }

  function listen(el: HTMLVideoElement): void {
    // Neither `load` nor `error` on a `<track>` bubbles, so both are bound in
    // the capture phase on the video — the track elements are rendered from
    // the stream URL, i.e. after this composable has already latched onto
    // the `<video>`. Both transitions re-run the same `read()`: a failed
    // track's `readyState` flips to `ERROR` right as `error` fires, so one
    // function recomputes cues and the error flag together.
    el.addEventListener('load', read, true);
    el.addEventListener('error', read, true);
    el.textTracks.addEventListener('addtrack', read);
  }

  function unlisten(el: HTMLVideoElement): void {
    el.removeEventListener('load', read, true);
    el.removeEventListener('error', read, true);
    el.textTracks.removeEventListener('addtrack', read);
  }

  watch(
    videoRef,
    (el, previous) => {
      if (previous) unlisten(previous);
      if (el) listen(el);
      read();
    },
    { immediate: true },
  );

  onScopeDispose(() => {
    if (videoRef.value) unlisten(videoRef.value);
  }, true);

  const activeIndex = computed(() => {
    const at = position.value;
    // Linear scan: a lesson has hundreds of cues and `timeupdate` fires ~4×/s.
    // ponytail: swap for a binary search if a transcript ever gets long enough
    // to show up in a profile.
    return cues.value.findIndex((cue) => at >= cue.start && at < cue.end);
  });

  return { cues, activeIndex, hasError };
}
