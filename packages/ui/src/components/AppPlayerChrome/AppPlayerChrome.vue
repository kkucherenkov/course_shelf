<script setup lang="ts">
  import { computed, ref } from 'vue';

  import AppButton from '../AppButton/AppButton.vue';
  import IconCS from '../IconCS/IconCS.vue';

  export type PlayerState =
    | 'idle'
    | 'playing'
    | 'paused'
    | 'buffering'
    | 'error'
    | 'end'
    | 'locked';

  export type PlayerMode = 'overlay' | 'minimal';

  export interface BookmarkMarker {
    /** Position in seconds. */
    time: number;
    /** Optional human label — surfaced as the marker's `aria-label`. */
    label?: string;
  }

  /** Screen-reader labels for the chrome controls. `bookmarkAt` takes `{time}`. */
  export interface PlayerChromeAriaLabels {
    player: string;
    buffering: string;
    pip: string;
    settings: string;
    seek: string;
    bookmarkAt: string;
    pause: string;
    play: string;
    prevLesson: string;
    nextLesson: string;
    mute: string;
    unmute: string;
    speed: string;
    subtitlesEnable: string;
    subtitlesDisable: string;
    fullscreenEnter: string;
    fullscreenExit: string;
  }

  const props = withDefaults(
    defineProps<{
      /** Drives the overlay rendered above the video frame. */
      state?: PlayerState;
      /** Current playback position, in seconds. */
      position: number;
      /** Total lesson duration, in seconds. */
      duration: number;
      /** Buffered head, in seconds. Defaults to `position` (no buffer indicator). */
      buffered?: number;
      /** Playback speed (e.g. 1.0, 1.5). */
      speed?: number;
      /** Mute state — a prop so the parent (real `<video>`) owns it. */
      muted?: boolean;
      /** Subtitles toggle state. */
      subtitlesEnabled?: boolean;
      /** Show the picture-in-picture button. */
      pipAvailable?: boolean;
      /** Show the fullscreen button as toggled-on. */
      fullscreen?: boolean;
      /** `overlay` paints the full chrome; `minimal` shows only a slim played bar. */
      mode?: PlayerMode;
      /** Top-row title (e.g. "Lesson 12 · Quorum reads"). */
      lessonTitle?: string;
      /** Top-row subtitle (e.g. "SECTION 04 · CONSENSUS"). */
      lessonSubtitle?: string;
      /** Chapter break fractions (0..1). Each value renders a tick on the scrubber. */
      chapters?: number[];
      /** Bookmark markers — rendered above the scrubber at `time/duration` fractions. */
      bookmarks?: BookmarkMarker[];
      /** Visible message in the `error` state. */
      errorMessage?: string;
      /** Up-next info for the `end` state. */
      endNext?: { title: string; countdownSec?: number };
      // Visible labels — defaults are English; pass localized strings from the
      // page (the component stays i18n-free). `upNextLabel` interpolates `{n}`.
      retryLabel?: string;
      lockedLabel?: string;
      upNextLabel?: string;
      stayLabel?: string;
      playNextLabel?: string;
      /** Disable the prev/next controls at the course boundaries. */
      hasPrev?: boolean;
      hasNext?: boolean;
      /** Localized screen-reader labels; English defaults fill any gaps. */
      ariaLabels?: Partial<PlayerChromeAriaLabels>;
    }>(),
    {
      state: 'idle',
      buffered: undefined,
      speed: 1,
      muted: false,
      subtitlesEnabled: false,
      pipAvailable: true,
      fullscreen: false,
      mode: 'overlay',
      lessonTitle: '',
      lessonSubtitle: '',
      chapters: () => [],
      bookmarks: () => [],
      errorMessage: 'Playback failed',
      endNext: undefined,
      retryLabel: 'Try again',
      lockedLabel: 'You don’t have access to this lesson',
      upNextLabel: 'Up next in {n}s',
      stayLabel: 'Stay here',
      playNextLabel: 'Play next',
      hasPrev: true,
      hasNext: true,
      ariaLabels: () => ({}),
    },
  );

  const emit = defineEmits<{
    play: [];
    pause: [];
    seek: [positionSec: number];
    speed: [rate: number];
    toggleSubtitles: [];
    togglePip: [];
    toggleFullscreen: [];
    toggleMute: [];
    nextLesson: [];
    prevLesson: [];
    retry: [];
    stayHere: [];
  }>();

  const DEFAULT_ARIA: PlayerChromeAriaLabels = {
    player: 'Lesson video player',
    buffering: 'Buffering',
    pip: 'Picture in picture',
    settings: 'Settings',
    seek: 'Seek',
    bookmarkAt: 'Bookmark at {time}',
    pause: 'Pause',
    play: 'Play',
    prevLesson: 'Previous lesson',
    nextLesson: 'Next lesson',
    mute: 'Mute',
    unmute: 'Unmute',
    speed: 'Playback speed',
    subtitlesEnable: 'Enable subtitles',
    subtitlesDisable: 'Disable subtitles',
    fullscreenEnter: 'Enter fullscreen',
    fullscreenExit: 'Exit fullscreen',
  };

  const aria = computed<PlayerChromeAriaLabels>(() => ({ ...DEFAULT_ARIA, ...props.ariaLabels }));

  const SEEK_STEP_S = 5;
  const SEEK_LARGE_S = 10;
  const FRAME_STEP_S = 1 / 24;

  const scrubberRef = ref<HTMLDivElement | null>(null);

  const isPlaying = computed(() => props.state === 'playing');
  const isInert = computed(() => props.state === 'locked' || props.state === 'error');

  const playedFraction = computed(() => clamp01(props.position / nonZero(props.duration)));
  const bufferedFraction = computed(() =>
    clamp01((props.buffered ?? props.position) / nonZero(props.duration)),
  );

  const speedLabel = computed(() => `${props.speed.toFixed(1)}×`);

  const currentTimeLabel = computed(() => fmtTime(props.position));
  const totalTimeLabel = computed(() => fmtTime(props.duration));
  const sliderValueText = computed(() => `${currentTimeLabel.value} of ${totalTimeLabel.value}`);

  function clamp01(value: number): number {
    if (Number.isNaN(value)) return 0;
    return Math.max(0, Math.min(1, value));
  }

  function nonZero(value: number): number {
    return value > 0 ? value : 1;
  }

  function fmtTime(seconds: number): string {
    const total = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (hours > 0) {
      return `${String(hours)}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(minutes)}:${String(secs).padStart(2, '0')}`;
  }

  function togglePlay(): void {
    if (isInert.value) return;
    if (isPlaying.value) emit('pause');
    else emit('play');
  }

  function seekBy(deltaSec: number): void {
    if (isInert.value) return;
    const next = Math.max(0, Math.min(props.duration, props.position + deltaSec));
    emit('seek', next);
  }

  function seekTo(fraction: number): void {
    if (isInert.value) return;
    emit('seek', clamp01(fraction) * props.duration);
  }

  function onScrubberPointer(event: PointerEvent): void {
    if (isInert.value) return;
    const el = scrubberRef.value;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0) return;
    const fraction = (event.clientX - rect.left) / rect.width;
    seekTo(fraction);
  }

  function onScrubberKeydown(event: KeyboardEvent): void {
    if (isInert.value) return;
    switch (event.key) {
      case 'ArrowLeft': {
        event.preventDefault();
        seekBy(-SEEK_STEP_S);
        return;
      }
      case 'ArrowRight': {
        event.preventDefault();
        seekBy(SEEK_STEP_S);
        return;
      }
      case 'Home': {
        event.preventDefault();
        seekTo(0);
        return;
      }
      case 'End': {
        event.preventDefault();
        seekTo(1);
        return;
      }
      default:
    }
  }

  function onKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

    if (event.key === ' ' || event.key === 'k' || event.key === 'K') {
      event.preventDefault();
      togglePlay();
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      seekBy(-SEEK_STEP_S);
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      seekBy(SEEK_STEP_S);
      return;
    }
    if (event.key === 'j' || event.key === 'J') {
      event.preventDefault();
      seekBy(-SEEK_LARGE_S);
      return;
    }
    if (event.key === 'l' || event.key === 'L') {
      event.preventDefault();
      seekBy(SEEK_LARGE_S);
      return;
    }
    if (event.key === 'f' || event.key === 'F') {
      event.preventDefault();
      emit('toggleFullscreen');
      return;
    }
    if (event.key === 'm' || event.key === 'M') {
      event.preventDefault();
      emit('toggleMute');
      return;
    }
    if (event.key === ',') {
      event.preventDefault();
      seekBy(-FRAME_STEP_S);
      return;
    }
    if (event.key === '.') {
      event.preventDefault();
      seekBy(FRAME_STEP_S);
      return;
    }
    if (/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      seekTo(Number.parseInt(event.key, 10) / 10);
    }
  }
</script>

<template>
  <div
    :class="[
      'app-player-chrome',
      `app-player-chrome--${mode}`,
      `app-player-chrome--state-${state}`,
    ]"
    :tabindex="isInert ? -1 : 0"
    role="region"
    :aria-label="aria.player"
    @keydown="onKeydown"
  >
    <div class="app-player-chrome__frame" aria-hidden="true">
      <slot name="frame"> video frame · placeholder </slot>
    </div>

    <!-- State overlays -->
    <div
      v-if="state === 'buffering'"
      class="app-player-chrome__state-overlay"
      role="status"
      aria-live="polite"
      :aria-label="aria.buffering"
    >
      <div class="app-player-chrome__buffer-spinner" aria-hidden="true" />
    </div>

    <div
      v-else-if="state === 'error'"
      class="app-player-chrome__state-overlay app-player-chrome__state-overlay--column"
      role="alert"
    >
      <IconCS name="alert" :size="28" class="app-player-chrome__state-icon--error" />
      <span class="app-player-chrome__state-text">{{ errorMessage }}</span>
      <AppButton variant="secondary" size="sm" :label="retryLabel" @click="emit('retry')" />
    </div>

    <div
      v-else-if="state === 'locked'"
      class="app-player-chrome__state-overlay app-player-chrome__state-overlay--column"
      role="status"
    >
      <IconCS name="lock" :size="28" />
      <span class="app-player-chrome__state-text">{{ lockedLabel }}</span>
    </div>

    <div v-else-if="state === 'end' && endNext" class="app-player-chrome__end-banner" role="status">
      <div v-if="endNext.countdownSec !== undefined" class="app-player-chrome__end-countdown">
        {{ upNextLabel.replace('{n}', String(Math.max(0, Math.floor(endNext.countdownSec)))) }}
      </div>
      <div class="app-player-chrome__end-title">
        {{ endNext.title }}
      </div>
      <div class="app-player-chrome__end-actions">
        <AppButton variant="secondary" size="sm" :label="stayLabel" @click="emit('stayHere')" />
        <AppButton
          variant="primary"
          size="sm"
          icon-leading="next"
          :label="playNextLabel"
          @click="emit('nextLesson')"
        />
      </div>
    </div>

    <!-- Full chrome (overlay mode) -->
    <div v-show="mode === 'overlay'" class="app-player-chrome__overlay">
      <div class="app-player-chrome__top">
        <div class="app-player-chrome__lesson">
          <div v-if="lessonSubtitle" class="app-player-chrome__lesson-sub">
            {{ lessonSubtitle }}
          </div>
          <div v-if="lessonTitle" class="app-player-chrome__lesson-title">
            {{ lessonTitle }}
          </div>
        </div>
        <div class="app-player-chrome__top-actions">
          <button
            v-if="pipAvailable"
            type="button"
            class="app-player-chrome__btn"
            :aria-label="aria.pip"
            @click="emit('togglePip')"
          >
            <IconCS name="pip" :size="16" />
          </button>
          <button type="button" class="app-player-chrome__btn" :aria-label="aria.settings">
            <IconCS name="settings" :size="16" />
          </button>
        </div>
      </div>

      <div class="app-player-chrome__bottom">
        <div
          ref="scrubberRef"
          class="app-player-chrome__scrubber"
          role="slider"
          tabindex="0"
          :aria-valuemin="0"
          :aria-valuemax="duration"
          :aria-valuenow="position"
          :aria-valuetext="sliderValueText"
          :aria-label="aria.seek"
          :aria-disabled="isInert ? 'true' : undefined"
          @click="onScrubberPointer"
          @keydown="onScrubberKeydown"
        >
          <div class="app-player-chrome__scrubber-track" />
          <div
            class="app-player-chrome__scrubber-buf"
            :style="{ width: `${String(bufferedFraction * 100)}%` }"
          />
          <div
            class="app-player-chrome__scrubber-played"
            :style="{ width: `${String(playedFraction * 100)}%` }"
          />
          <div
            class="app-player-chrome__scrubber-thumb"
            :style="{ left: `${String(playedFraction * 100)}%` }"
          />
          <div
            v-for="(t, i) in chapters"
            :key="`chap-${String(i)}`"
            class="app-player-chrome__scrubber-chap"
            :style="{ left: `${String(clamp01(t) * 100)}%` }"
            aria-hidden="true"
          />
          <button
            v-for="(bm, i) in bookmarks"
            :key="`bm-${String(i)}`"
            type="button"
            class="app-player-chrome__scrubber-bm"
            :style="{ left: `${String(clamp01(bm.time / nonZero(duration)) * 100)}%` }"
            :aria-label="bm.label ?? aria.bookmarkAt.replace('{time}', fmtTime(bm.time))"
            @click.stop="seekTo(bm.time / nonZero(duration))"
          >
            <IconCS name="bookmark" :size="10" />
          </button>
        </div>

        <div class="app-player-chrome__controls">
          <button
            type="button"
            class="app-player-chrome__btn"
            :aria-label="isPlaying ? aria.pause : aria.play"
            :aria-pressed="isPlaying ? 'true' : 'false'"
            :disabled="isInert"
            @click="togglePlay"
          >
            <IconCS :name="isPlaying ? 'pause' : 'play'" :size="16" />
          </button>
          <button
            type="button"
            class="app-player-chrome__btn"
            :aria-label="aria.prevLesson"
            :disabled="!hasPrev"
            @click="emit('prevLesson')"
          >
            <IconCS name="prev" :size="16" />
          </button>
          <button
            type="button"
            class="app-player-chrome__btn"
            :aria-label="aria.nextLesson"
            :disabled="!hasNext"
            @click="emit('nextLesson')"
          >
            <IconCS name="next" :size="16" />
          </button>
          <button
            type="button"
            class="app-player-chrome__btn"
            :aria-label="muted ? aria.unmute : aria.mute"
            :aria-pressed="muted ? 'true' : 'false'"
            @click="emit('toggleMute')"
          >
            <IconCS :name="muted ? 'volume-mute' : 'volume'" :size="16" />
          </button>
          <span class="app-player-chrome__time" aria-hidden="true">
            {{ currentTimeLabel }} / {{ totalTimeLabel }}
          </span>
          <span class="app-player-chrome__spacer" />
          <button
            type="button"
            class="app-player-chrome__btn app-player-chrome__btn--text"
            :aria-label="aria.speed"
            @click="emit('speed', props.speed)"
          >
            {{ speedLabel }}
          </button>
          <button
            type="button"
            class="app-player-chrome__btn"
            :aria-label="subtitlesEnabled ? aria.subtitlesDisable : aria.subtitlesEnable"
            :aria-pressed="subtitlesEnabled ? 'true' : 'false'"
            @click="emit('toggleSubtitles')"
          >
            <IconCS name="subtitles" :size="16" />
          </button>
          <button
            type="button"
            class="app-player-chrome__btn"
            :aria-label="fullscreen ? aria.fullscreenExit : aria.fullscreenEnter"
            :aria-pressed="fullscreen ? 'true' : 'false'"
            @click="emit('toggleFullscreen')"
          >
            <IconCS name="fullscreen" :size="16" />
          </button>
        </div>
      </div>
    </div>

    <!-- Minimal mode: just a thin played bar peeking from the bottom -->
    <div v-show="mode === 'minimal'" class="app-player-chrome__mini" aria-hidden="true">
      <div class="app-player-chrome__mini-track" />
      <div
        class="app-player-chrome__mini-played"
        :style="{ width: `${String(playedFraction * 100)}%` }"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
  // Bundle .pc parity. Token aliases (bundle → shipped):
  //   --primary  → --brand-accent
  //   --info     → --status-info-fg
  //   --error    → --status-error-fg
  //   --d-fast   → --dur-fast
  //   --d-normal → --dur-base

  // Stacking context within the chrome (exempt from raw-int ban — named vars).
  $z-overlay: 1;
  $z-state: 2;

  // Player-chrome metrics that fall between design-token steps. Same literals
  // as before — these are named for intent, not rounded to the nearest token.
  $control-gap: 6px;
  $scrubber-bar-height: 3px;
  $scrubber-thumb-size: 11px;
  $chapter-tick-height: 9px;
  $bookmark-offset: -4px;
  $spinner-duration: 0.8s;

  .app-player-chrome {
    position: relative;
    aspect-ratio: 16 / 9;
    background: var(--media-stage);
    border-radius: var(--radius-md);
    overflow: hidden;

    &:focus-visible {
      outline: 2px solid var(--brand-accent);
      outline-offset: 2px;
    }

    &__frame {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        135deg,
        var(--media-placeholder-from),
        var(--media-placeholder-to)
      );
      display: grid;
      place-items: center;
      color: var(--media-fg-faint);
      font-family: var(--font-mono);
      font-size: var(--text-xs);
    }

    &__overlay {
      position: absolute;
      inset: 0;
      z-index: $z-overlay;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: var(--space-4);
      background: linear-gradient(
        180deg,
        var(--media-scrim-soft) 0%,
        transparent 30%,
        transparent 60%,
        var(--media-scrim-strong) 100%
      );
      color: var(--media-fg);
      transition: opacity var(--dur-base);
    }

    &__top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--space-3);
    }

    &__lesson {
      min-width: 0;
    }

    &__lesson-sub {
      font-size: var(--text-xs);
      color: var(--media-fg-tertiary);
      letter-spacing: 0.05em;
    }

    &__lesson-title {
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--media-fg);
    }

    &__top-actions {
      display: flex;
      gap: var(--space-1);
      flex-shrink: 0;
    }

    &__bottom {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    &__controls {
      display: flex;
      align-items: center;
      gap: $control-gap;
      color: var(--media-fg);
    }

    &__btn {
      width: var(--space-6);
      height: var(--space-6);
      border-radius: var(--radius-sm);
      display: grid;
      place-items: center;
      color: var(--media-fg);
      background: transparent;
      border: 0;
      cursor: pointer;
      transition: background var(--dur-fast);

      &:hover:not(:disabled) {
        background: var(--media-fill-hover);
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 2px;
      }

      &--text {
        width: auto;
        padding: 0 var(--space-2);
        font-family: var(--font-mono);
        font-size: var(--text-xs);
      }
    }

    &__time {
      font-family: var(--font-mono);
      font-variant-numeric: tabular-nums;
      font-size: var(--text-sm);
      color: var(--media-fg-secondary);
      padding: 0 var(--space-2);
    }

    &__spacer {
      flex: 1;
    }

    // ---- Scrubber ----
    &__scrubber {
      position: relative;
      height: var(--space-4);
      cursor: pointer;

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 2px;
      }
    }

    &__scrubber-track,
    &__scrubber-buf,
    &__scrubber-played {
      position: absolute;
      left: 0;
      top: 50%;
      height: $scrubber-bar-height;
      transform: translateY(-50%);
      border-radius: 2px;
    }

    &__scrubber-track {
      right: 0;
      background: var(--media-track);
    }

    &__scrubber-buf {
      background: var(--media-track-buffered);
    }

    &__scrubber-played {
      background: var(--brand-accent);
    }

    &__scrubber-thumb {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      width: $scrubber-thumb-size;
      height: $scrubber-thumb-size;
      border-radius: 50%;
      background: var(--brand-accent);
      pointer-events: none;
    }

    &__scrubber-chap {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 2px;
      height: $chapter-tick-height;
      background: var(--media-stage);
      border-radius: 1px;
      pointer-events: none;
    }

    &__scrubber-bm {
      position: absolute;
      top: $bookmark-offset;
      transform: translateX(-50%);
      color: var(--status-info-fg);
      background: transparent;
      border: 0;
      padding: 0;
      cursor: pointer;
      display: grid;
      place-items: center;

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 2px;
      }
    }

    // ---- State overlays ----
    &__state-overlay {
      position: absolute;
      inset: 0;
      z-index: $z-state;
      display: grid;
      place-items: center;
      background: var(--media-scrim-soft);
      color: var(--media-fg);
      gap: var(--space-2);

      &--column {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
    }

    &__state-text {
      font-size: var(--text-sm);
    }

    &__state-icon--error {
      color: var(--status-error-fg);
    }

    &__buffer-spinner {
      width: var(--space-6);
      height: var(--space-6);
      border-radius: 50%;
      border: 2px solid var(--media-border);
      border-top-color: var(--media-fg);
      animation: app-player-chrome-spin $spinner-duration linear infinite;
    }

    @media (prefers-reduced-motion: reduce) {
      &__buffer-spinner {
        animation: none;
      }
    }

    // ---- End-of-lesson banner ----
    &__end-banner {
      position: absolute;
      inset: 0;
      z-index: $z-state;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-3);
      color: var(--media-fg);
      background: var(--media-scrim-medium);
    }

    &__end-countdown {
      font-size: var(--text-sm);
      opacity: 0.8;
    }

    &__end-title {
      font-size: var(--text-lg);
      font-weight: 600;
    }

    &__end-actions {
      display: flex;
      gap: var(--space-2);
    }

    // ---- Minimal mode ----
    &__mini {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      padding: var(--space-2) var(--space-4);
      pointer-events: none;
    }

    &__mini-track {
      position: absolute;
      left: var(--space-4);
      right: var(--space-4);
      bottom: var(--space-2);
      height: 2px;
      background: var(--media-track);
      border-radius: 1px;
    }

    &__mini-played {
      position: absolute;
      left: var(--space-4);
      bottom: var(--space-2);
      height: 2px;
      background: var(--brand-accent);
      border-radius: 1px;
      transition: width var(--dur-fast);
    }

    // ---- Mode-specific overrides ----
    &--minimal &__overlay {
      display: none;
    }
  }

  @keyframes app-player-chrome-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
