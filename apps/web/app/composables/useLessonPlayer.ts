/**
 * useLessonPlayer
 *
 * Wraps an HTMLVideoElement ref + AppPlayerChrome event handlers.
 * Encapsulates the imperative video API behind reactive refs.
 *
 * The page attaches the video element via `attach(videoEl)` after mount.
 * Chrome events (`onPlay`, `onPause`, etc.) are bound directly in the
 * template and forwarded here.
 */

import { ref } from 'vue';
import type { Ref } from 'vue';

export interface UseLessonPlayerReturn {
  // Reactive state (passed as props to AppPlayerChrome)
  position: Ref<number>;
  duration: Ref<number>;
  buffered: Ref<number>;
  playing: Ref<boolean>;
  muted: Ref<boolean>;
  speed: Ref<number>;
  fullscreen: Ref<boolean>;
  subtitlesOn: Ref<boolean>;
  ended: Ref<boolean>;
  playerState: Ref<'idle' | 'playing' | 'paused' | 'buffering' | 'error' | 'end'>;
  videoError: Ref<string | null>;

  // AppPlayerChrome event handlers
  onPlay: () => void;
  onPause: () => void;
  onSeek: (sec: number) => void;
  onSpeed: (rate: number) => void;
  onToggleMute: () => void;
  onToggleSubtitles: () => void;
  onTogglePip: () => void;
  onToggleFullscreen: () => void;

  // Called once after mount to wire the <video> element
  attach: (el: HTMLVideoElement) => void;
  detach: () => void;
}

export function useLessonPlayer(): UseLessonPlayerReturn {
  let videoEl: HTMLVideoElement | null = null;

  const position = ref(0);
  const duration = ref(0);
  const buffered = ref(0);
  const playing = ref(false);
  const muted = ref(false);
  const speed = ref(1);
  const fullscreen = ref(false);
  const subtitlesOn = ref(false);
  const ended = ref(false);
  const playerState = ref<'idle' | 'playing' | 'paused' | 'buffering' | 'error' | 'end'>('idle');
  const videoError = ref<string | null>(null);

  // ── Video element event handlers ───────────────────────────────────────────

  function onTimeUpdate(): void {
    if (!videoEl) return;
    position.value = videoEl.currentTime;
  }

  function onDurationChange(): void {
    if (!videoEl) return;
    duration.value = videoEl.duration || 0;
  }

  function onProgress(): void {
    if (!videoEl) return;
    const buf = videoEl.buffered;
    if (buf.length > 0) {
      buffered.value = buf.end(buf.length - 1);
    }
  }

  function onPlay(): void {
    playing.value = true;
    ended.value = false;
    playerState.value = 'playing';
  }

  function onPause(): void {
    playing.value = false;
    if (!ended.value) {
      playerState.value = 'paused';
    }
  }

  function onWaiting(): void {
    playerState.value = 'buffering';
  }

  function onCanPlay(): void {
    playerState.value = playing.value ? 'playing' : 'paused';
  }

  function onEnded(): void {
    playing.value = false;
    ended.value = true;
    playerState.value = 'end';
  }

  function onError(): void {
    playing.value = false;
    playerState.value = 'error';
    const err = videoEl?.error;
    videoError.value = err ? `Video error ${String(err.code)}: ${err.message}` : 'Playback failed';
  }

  function onVolumeChange(): void {
    if (!videoEl) return;
    muted.value = videoEl.muted;
  }

  function onFullscreenChange(): void {
    fullscreen.value = Boolean(document.fullscreenElement);
  }

  // ── Attach / detach ────────────────────────────────────────────────────────

  function attach(el: HTMLVideoElement): void {
    detach();
    videoEl = el;

    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('durationchange', onDurationChange);
    el.addEventListener('progress', onProgress);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('waiting', onWaiting);
    el.addEventListener('canplay', onCanPlay);
    el.addEventListener('ended', onEnded);
    el.addEventListener('error', onError);
    el.addEventListener('volumechange', onVolumeChange);

    if (typeof document !== 'undefined') {
      document.addEventListener('fullscreenchange', onFullscreenChange);
    }
  }

  function detach(): void {
    if (!videoEl) return;
    const el = videoEl;

    el.removeEventListener('timeupdate', onTimeUpdate);
    el.removeEventListener('durationchange', onDurationChange);
    el.removeEventListener('progress', onProgress);
    el.removeEventListener('play', onPlay);
    el.removeEventListener('pause', onPause);
    el.removeEventListener('waiting', onWaiting);
    el.removeEventListener('canplay', onCanPlay);
    el.removeEventListener('ended', onEnded);
    el.removeEventListener('error', onError);
    el.removeEventListener('volumechange', onVolumeChange);

    if (typeof document !== 'undefined') {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    }

    videoEl = null;
  }

  // ── Chrome event handlers (called from the template) ──────────────────────

  function chromePlay(): void {
    void videoEl?.play();
  }

  function chromePause(): void {
    videoEl?.pause();
  }

  function chromeSeek(sec: number): void {
    if (!videoEl) return;
    videoEl.currentTime = sec;
    position.value = sec;
  }

  function chromeSpeed(rate: number): void {
    if (!videoEl) return;
    // Cycle through preset speeds when the same speed is clicked, or set directly
    const SPEEDS = [0.5, 1, 1.25, 1.5, 1.75, 2];
    let next: number;
    if (rate === speed.value) {
      // cycle to next
      const idx = SPEEDS.indexOf(rate);
      next = SPEEDS[(idx + 1) % SPEEDS.length] ?? 1;
    } else {
      next = SPEEDS.includes(rate) ? rate : 1;
    }
    videoEl.playbackRate = next;
    speed.value = next;
  }

  function chromeToggleMute(): void {
    if (!videoEl) return;
    videoEl.muted = !videoEl.muted;
    muted.value = videoEl.muted;
  }

  function chromeToggleSubtitles(): void {
    subtitlesOn.value = !subtitlesOn.value;
    if (!videoEl) return;
    // Enable/disable the first text track
    const tracks = videoEl.textTracks;
    for (const track of tracks) {
      track.mode = subtitlesOn.value ? 'showing' : 'hidden';
    }
  }

  function chromeTogglePip(): void {
    if (!videoEl) return;
    if (document.pictureInPictureElement) {
      void document.exitPictureInPicture();
    } else {
      void videoEl.requestPictureInPicture();
    }
  }

  function chromeToggleFullscreen(): void {
    if (!document.fullscreenElement) {
      if (videoEl) void videoEl.requestFullscreen();
    } else {
      void document.exitFullscreen();
    }
  }

  return {
    position,
    duration,
    buffered,
    playing,
    muted,
    speed,
    fullscreen,
    subtitlesOn,
    ended,
    playerState,
    videoError,
    onPlay: chromePlay,
    onPause: chromePause,
    onSeek: chromeSeek,
    onSpeed: chromeSpeed,
    onToggleMute: chromeToggleMute,
    onToggleSubtitles: chromeToggleSubtitles,
    onTogglePip: chromeTogglePip,
    onToggleFullscreen: chromeToggleFullscreen,
    attach,
    detach,
  };
}
