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
  hasTranscript: ComputedRef<boolean>;
}

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

export function useTranscriptCues(opts: UseTranscriptCuesOptions): UseTranscriptCuesReturn {
  const { videoRef, position, preferredLanguage } = opts;

  const cues = ref<TranscriptCue[]>([]);

  function read(): void {
    const el = videoRef.value;
    const track = el ? selectTrack(el, toValue(preferredLanguage)) : null;
    if (!track) {
      cues.value = [];
      return;
    }

    if (track.mode === 'disabled') track.mode = 'hidden';

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
    // `load` on a `<track>` does not bubble, so listen in the capture phase:
    // the track elements are rendered from the stream URL, i.e. after this
    // composable has already latched onto the `<video>`.
    el.addEventListener('load', read, true);
    el.textTracks.addEventListener('addtrack', read);
  }

  function unlisten(el: HTMLVideoElement): void {
    el.removeEventListener('load', read, true);
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

  const hasTranscript = computed(() => cues.value.length > 0);

  return { cues, activeIndex, hasTranscript };
}
