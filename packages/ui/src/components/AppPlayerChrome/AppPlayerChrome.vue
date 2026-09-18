<script setup lang="ts">
  import { computed, nextTick, onUnmounted, ref, watch } from 'vue';

  import AppButton from '../AppButton/AppButton.vue';
  import AppDialog from '../AppDialog/AppDialog.vue';
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
    shortcuts: string;
    seek: string;
    bookmarkAt: string;
    pause: string;
    play: string;
    prevLesson: string;
    nextLesson: string;
    skipBack: string;
    skipForward: string;
    mute: string;
    unmute: string;
    speed: string;
    subtitlesEnable: string;
    subtitlesDisable: string;
    subtitlesUnavailable: string;
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
      /**
       * Selectable playback rates. The menu lists these in order. `readonly`
       * so a caller's `as const` ladder passes without being copied.
       */
      speeds?: readonly number[];
      /** Mute state — a prop so the parent (real `<video>`) owns it. */
      muted?: boolean;
      /** Subtitles toggle state. */
      subtitlesEnabled?: boolean;
      /** Whether the lesson has any subtitle tracks — disables the CC button when false. */
      subtitlesAvailable?: boolean;
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
      /** Title of the keyboard-shortcuts dialog opened by the gear button. */
      shortcutsTitle?: string;
      /** One pre-translated line per shortcut, shown in the dialog body. */
      shortcuts?: string[];
    }>(),
    {
      state: 'idle',
      buffered: undefined,
      speed: 1,
      // Stand-alone fallback so the component works in Storybook on its own.
      // The lesson page passes `PLAYBACK_SPEEDS`, which is the list the
      // composable actually accepts — anything else there falls back to 1×.
      speeds: () => [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
      muted: false,
      subtitlesEnabled: false,
      subtitlesAvailable: true,
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
      shortcutsTitle: 'Keyboard shortcuts',
      shortcuts: () => [],
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

  /** Transport skip step. 15s is the interval every mainstream player uses. */
  const SKIP_SECONDS = 15;

  const DEFAULT_ARIA: PlayerChromeAriaLabels = {
    player: 'Lesson video player',
    buffering: 'Buffering',
    pip: 'Picture in picture',
    shortcuts: 'Keyboard shortcuts',
    seek: 'Seek',
    bookmarkAt: 'Bookmark at {time}',
    pause: 'Pause',
    play: 'Play',
    prevLesson: 'Previous lesson',
    nextLesson: 'Next lesson',
    skipBack: 'Back 15 seconds',
    skipForward: 'Forward 15 seconds',
    mute: 'Mute',
    unmute: 'Unmute',
    speed: 'Playback speed',
    subtitlesEnable: 'Enable subtitles',
    subtitlesDisable: 'Disable subtitles',
    subtitlesUnavailable: 'No subtitles for this lesson',
    fullscreenEnter: 'Enter fullscreen',
    fullscreenExit: 'Exit fullscreen',
  };

  const aria = computed<PlayerChromeAriaLabels>(() => ({ ...DEFAULT_ARIA, ...props.ariaLabels }));

  const SEEK_STEP_S = 5;
  const SEEK_LARGE_S = 10;
  const FRAME_STEP_S = 1 / 24;
  // Idle-hide delay for the overlay while playing — long enough to read the
  // scrubber position at a glance, short enough not to leave stale controls
  // parked over the picture (matches the common YouTube-class default).
  const IDLE_HIDE_MS = 3000;

  const rootRef = ref<HTMLDivElement | null>(null);
  const scrubberRef = ref<HTMLDivElement | null>(null);
  const shortcutsOpen = ref(false);
  const speedMenuOpen = ref(false);
  const speedTriggerRef = ref<HTMLButtonElement | null>(null);
  // Wraps both the trigger and the menu — doubles as the "am I inside the
  // widget" check for the outside-click close and as the query root for the
  // rows the roving-focus keydown handler moves between.
  const speedWrapRef = ref<HTMLDivElement | null>(null);

  const isPlaying = computed(() => props.state === 'playing');
  const isInert = computed(() => props.state === 'locked' || props.state === 'error');

  // Only over a picture that is genuinely waiting to be started. The buffering,
  // error, locked and end states each paint their own overlay and must not get
  // a play button on top of them.
  const showBigPlay = computed(() => props.state === 'idle' || props.state === 'paused');

  // ── Overlay idle-hide ───────────────────────────────────────────────────────
  // Only while actively playing — paused/buffering/error/locked/end always
  // keep the overlay up, since there is nothing to "get out of the way" of.
  // Focus is handled separately in CSS (`:focus-within`), not here: a
  // keyboard user tabbing through the controls must never lose them.

  const controlsHidden = ref(false);
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  function clearIdleTimer(): void {
    if (idleTimer !== null) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
  }

  function scheduleIdleHide(): void {
    clearIdleTimer();
    if (!isPlaying.value || speedMenuOpen.value) return;
    idleTimer = setTimeout(() => {
      controlsHidden.value = true;
    }, IDLE_HIDE_MS);
  }

  function showControls(): void {
    controlsHidden.value = false;
    scheduleIdleHide();
  }

  watch(
    isPlaying,
    (playing) => {
      if (playing) scheduleIdleHide();
      else showControls();
    },
    { immediate: true },
  );

  onUnmounted(() => {
    clearIdleTimer();
    document.removeEventListener('mousedown', onSpeedMenuOutsideClick);
  });

  const playedFraction = computed(() => clamp01(props.position / nonZero(props.duration)));
  const bufferedFraction = computed(() =>
    clamp01((props.buffered ?? props.position) / nonZero(props.duration)),
  );

  // One formatter for the trigger and the menu rows. `toFixed(1)` used to
  // render the trigger and lied on three of the seven presets — 0.75 showed as
  // "0.8×", 1.25 as "1.3×", 1.75 as "1.8×" — so the button named a rate that
  // does not appear in the menu it opens. Nothing asserted that text, which is
  // why it survived.
  const speedLabel = computed(() => formatSpeed(props.speed));

  // Shared by the trigger above and the menu rows below. Declared as a
  // function, not a const, so the hoisting keeps `speedLabel` above it valid.
  function formatSpeed(rate: number): string {
    return `${String(rate)}×`;
  }

  function speedMenuItems(): HTMLButtonElement[] {
    return [
      ...(speedWrapRef.value?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? []),
    ];
  }

  // Bound on `document` only while the menu is open (added in `toggleSpeedMenu`,
  // removed in `closeSpeedMenu` and on unmount) — a `mousedown`, not `click`,
  // so the close beats the click that would otherwise land on whatever was
  // under the pointer.
  function onSpeedMenuOutsideClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (target && speedWrapRef.value && !speedWrapRef.value.contains(target)) {
      closeSpeedMenu();
    }
  }

  function closeSpeedMenu(): void {
    if (!speedMenuOpen.value) return;
    speedMenuOpen.value = false;
    document.removeEventListener('mousedown', onSpeedMenuOutsideClick);
    // Focus sat on a menu row, which `v-if` is about to unmount. Without this
    // it lands on <body> and a keyboard user is dropped out of the player
    // entirely. Synchronous: the trigger is already mounted, and waiting for
    // the tick would let the browser blur first.
    speedTriggerRef.value?.focus();
    scheduleIdleHide();
  }

  function toggleSpeedMenu(): void {
    if (speedMenuOpen.value) {
      closeSpeedMenu();
      return;
    }
    speedMenuOpen.value = true;
    // Opening must cancel the timer already ticking from the last pointer
    // move, or the overlay idle-hides out from under the open menu.
    clearIdleTimer();
    document.addEventListener('mousedown', onSpeedMenuOutsideClick);
    // `role="menu"` means opening moves focus in, not just paints the rows.
    // Land on the checked rate rather than always the first row — the menu
    // is a radio group, and that is where a native radio group's roving
    // tabindex would already be sitting.
    void nextTick(() => {
      const items = speedMenuItems();
      const checkedIndex = items.findIndex((item) => item.getAttribute('aria-checked') === 'true');
      items[Math.max(checkedIndex, 0)]?.focus();
    });
  }

  // Roving focus across the rows. Mirrors `AppNavigationShell`'s avatar-menu
  // keydown handler (ArrowUp/Down wrap via modulo on `indexOf`); Home/End are
  // this menu's own addition. Escape is handled separately by the
  // `@keydown.escape` listener on the wrapping element below, since it must
  // fire even when focus never made it past the trigger.
  function onSpeedMenuKeydown(event: KeyboardEvent): void {
    const items = speedMenuItems();
    if (items.length === 0) return;
    const idx = items.indexOf(document.activeElement as HTMLButtonElement);
    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        items[(idx + 1) % items.length]?.focus();
        return;
      }
      case 'ArrowUp': {
        event.preventDefault();
        items[(idx - 1 + items.length) % items.length]?.focus();
        return;
      }
      case 'Home': {
        event.preventDefault();
        items[0]?.focus();
        return;
      }
      case 'End': {
        event.preventDefault();
        items.at(-1)?.focus();
        return;
      }
      default:
    }
  }

  function chooseSpeed(rate: number): void {
    // Same inert guard every other emitting handler in this file carries
    // (`seekBy`, `togglePlay`, …) — the `:disabled` binding on the row stops
    // a real click, but not a click already queued the instant the player
    // went locked/error.
    if (isInert.value) return;
    closeSpeedMenu();
    emit('speed', rate);
  }

  // A menu left open across a state transition into locked/error would still
  // take picks — `isInert` disables the trigger, not an already-open menu.
  watch(isInert, (inert) => {
    if (inert) closeSpeedMenu();
  });

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

  // ── Frame tap ────────────────────────────────────────────────────────────
  // The root previously only tracked keyboard/pointer-move/focus — a
  // motionless tap on a touchscreen fires none of those, so once the overlay
  // idle-hid there was no way back to it without a mouse. One handler covers
  // both the return-from-idle-hide case and the play/pause-by-tapping-the-
  // picture affordance every video player has: overlay hidden → reveal it;
  // overlay visible → toggle play, same as the play button. Interactive
  // descendants (buttons, the scrubber, the shortcuts dialog) opt out via
  // `closest` so a tap on them isn't also handled here and double-fired.
  function onFrameTap(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('button, [role="slider"], a, dialog')) return;
    if (controlsHidden.value) {
      showControls();
      return;
    }
    togglePlay();
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

  // The page can only reach this component's own root DOM node through an
  // explicit expose — fullscreen has to target the chrome, not the `<video>`
  // it wraps, or every control painted in the overlay slot disappears.
  defineExpose({
    getRootEl: (): HTMLDivElement | null => rootRef.value,
  });
</script>

<template>
  <div
    ref="rootRef"
    :class="[
      'app-player-chrome',
      `app-player-chrome--${mode}`,
      `app-player-chrome--state-${state}`,
      { 'app-player-chrome--idle-hidden': controlsHidden },
    ]"
    :tabindex="isInert ? -1 : 0"
    role="region"
    :aria-label="aria.player"
    @keydown="onKeydown"
    @pointermove="showControls"
    @focusin="showControls"
    @focusout="scheduleIdleHide"
    @click="onFrameTap"
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

    <button
      v-if="showBigPlay"
      type="button"
      class="app-player-chrome__big-play"
      :aria-label="aria.play"
      @click="emit('play')"
    >
      <IconCS name="play" :size="32" />
    </button>

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
            class="app-player-chrome__btn app-player-chrome__btn--pip"
            :aria-label="aria.pip"
            :disabled="isInert"
            @click="emit('togglePip')"
          >
            <IconCS name="pip" :size="16" />
          </button>
          <button
            type="button"
            class="app-player-chrome__btn"
            :aria-label="aria.shortcuts"
            :disabled="isInert"
            @click="shortcutsOpen = true"
          >
            <IconCS name="settings" :size="16" />
          </button>
        </div>
      </div>

      <div class="app-player-chrome__bottom">
        <div class="app-player-chrome__scrubber-wrap">
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
          </div>

          <div v-if="bookmarks.length > 0" class="app-player-chrome__scrubber-marks">
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
        </div>

        <div class="app-player-chrome__controls">
          <button
            type="button"
            class="app-player-chrome__btn app-player-chrome__btn--skip-back"
            :aria-label="aria.skipBack"
            :disabled="isInert"
            @click="seekBy(-SKIP_SECONDS)"
          >
            <IconCS name="skip-back" :size="16" />
          </button>
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
            class="app-player-chrome__btn app-player-chrome__btn--skip-forward"
            :aria-label="aria.skipForward"
            :disabled="isInert"
            @click="seekBy(SKIP_SECONDS)"
          >
            <IconCS name="skip-forward" :size="16" />
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
            :disabled="isInert"
            @click="emit('toggleMute')"
          >
            <IconCS :name="muted ? 'volume-mute' : 'volume'" :size="16" />
          </button>
          <span class="app-player-chrome__time" aria-hidden="true">
            {{ currentTimeLabel }} / {{ totalTimeLabel }}
          </span>
          <span class="app-player-chrome__spacer" />
          <!-- Escape is handled on this wrapper, not on the menu: the menu is a
               div with no tabindex, so it never holds focus. Focus sits on the
               trigger button or a menu item, both inside this wrapper, and the
               keydown bubbles here from either. -->
          <div ref="speedWrapRef" class="app-player-chrome__speed" @keydown.escape="closeSpeedMenu">
            <button
              ref="speedTriggerRef"
              type="button"
              class="app-player-chrome__btn app-player-chrome__btn--text app-player-chrome__btn--speed"
              :aria-label="aria.speed"
              aria-haspopup="menu"
              :aria-expanded="speedMenuOpen ? 'true' : 'false'"
              :disabled="isInert"
              @click="toggleSpeedMenu"
            >
              {{ speedLabel }}
            </button>
            <div
              v-if="speedMenuOpen"
              class="app-player-chrome__speed-menu"
              role="menu"
              :aria-label="aria.speed"
              @keydown="onSpeedMenuKeydown"
            >
              <button
                v-for="rate in speeds"
                :key="rate"
                type="button"
                role="menuitemradio"
                class="app-player-chrome__speed-item"
                :aria-checked="rate === speed ? 'true' : 'false'"
                :disabled="isInert"
                @click="chooseSpeed(rate)"
              >
                {{ formatSpeed(rate) }}
              </button>
            </div>
          </div>
          <button
            type="button"
            class="app-player-chrome__btn app-player-chrome__btn--subtitles"
            :class="{
              'app-player-chrome__btn--active': subtitlesEnabled && subtitlesAvailable,
            }"
            :aria-label="
              !subtitlesAvailable
                ? aria.subtitlesUnavailable
                : subtitlesEnabled
                  ? aria.subtitlesDisable
                  : aria.subtitlesEnable
            "
            :aria-pressed="subtitlesEnabled ? 'true' : 'false'"
            :disabled="isInert || !subtitlesAvailable"
            @click="emit('toggleSubtitles')"
          >
            <IconCS name="subtitles" :size="16" />
          </button>
          <button
            type="button"
            class="app-player-chrome__btn app-player-chrome__btn--fullscreen"
            :class="{ 'app-player-chrome__btn--active': fullscreen }"
            :aria-label="fullscreen ? aria.fullscreenExit : aria.fullscreenEnter"
            :disabled="isInert"
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

    <!-- Keyboard-shortcuts help, opened by the gear button -->
    <AppDialog
      :open="shortcutsOpen"
      size="sm"
      :title="shortcutsTitle"
      @update:open="shortcutsOpen = $event"
    >
      <ul class="app-player-chrome__shortcuts">
        <li v-for="line in shortcuts" :key="line" class="app-player-chrome__shortcuts-item">
          {{ line }}
        </li>
      </ul>
    </AppDialog>
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

      // Media handed to the `frame` slot letterboxes inside the 16:9 stage.
      // Sized here rather than by each caller: without an explicit box a
      // non-16:9 `<video>` keeps its intrinsic ratio (a 320×240 source measured
      // 768×576 inside a 768×432 frame), which crops the picture and pushes the
      // native subtitle line outside the frame. Absolute rather than
      // `height: 100%` — a percentage height against a centred grid item is not
      // a definite length, which is how the overflow got in.
      ::v-slotted(video),
      ::v-slotted(img) {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }

    &__overlay {
      position: absolute;
      inset: 0;
      z-index: $z-overlay;
      // Query container for the speed menu's `max-height`. Sized entirely by
      // `inset: 0`, so size containment costs nothing here. Deliberately on
      // the overlay rather than the chrome root: `container-type` implies
      // `contain: layout`, which would turn the root into a stacking context
      // the rest of the page can see. The overlay is already one (`z-index`
      // above), and the shortcuts `<dialog>` is its sibling, not its child.
      container-type: size;
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

    // Idle-hide: the overlay (scrubber, play/pause, next lesson, bookmarks,
    // subtitles) fades out after a few seconds of inactivity while playing —
    // see the `IDLE_HIDE_MS` timer in the script. The `:focus-within`
    // override below always wins on specificity (three selectors vs. two),
    // so a keyboard user tabbed into any control never loses it mid-fade.
    &--idle-hidden &__overlay {
      opacity: 0;
      pointer-events: none;
    }

    &:focus-within#{&}--idle-hidden &__overlay {
      opacity: 1;
      pointer-events: auto;
    }

    @media (prefers-reduced-motion: reduce) {
      &__overlay {
        transition: none;
      }
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
      font-size: var(--text-sm);
      color: var(--media-fg-tertiary);
      letter-spacing: 0.05em;
    }

    &__lesson-title {
      font-size: var(--text-md);
      font-weight: var(--fw-medium);
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

      // `aria-pressed` told a screen reader; nothing told anyone looking at it.
      &--active {
        color: var(--brand-accent);
        background: var(--media-fill-hover);
      }

      &--text {
        width: auto;
        padding: 0 var(--space-2);
        font-family: var(--font-mono);
        font-size: var(--text-xs);
      }
    }

    &__big-play {
      position: absolute;
      inset: 0;
      // Above &__overlay ($z-overlay): that div is a sibling painted after
      // this button and covers the same box even where its background is
      // transparent, so without this the overlay — not the button — is the
      // real hit target for hover/focus/click.
      z-index: $z-state;
      margin: auto;
      // --space-8 is 64px; the control-row buttons are --space-6 (32px). The
      // whole point of this affordance is that you do not have to aim.
      width: var(--space-8);
      height: var(--space-8);
      border-radius: var(--radius-pill);
      display: grid;
      place-items: center;
      color: var(--media-fg);
      background: var(--media-scrim-strong);
      border: 0;
      cursor: pointer;
      transition:
        background var(--dur-fast),
        transform var(--dur-fast);

      &:hover {
        background: var(--media-fill-hover);
        transform: scale(1.05);
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 2px;
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

    &__speed {
      position: relative;
      display: inline-flex;
    }

    &__speed-menu {
      position: absolute;
      bottom: calc(100% + var(--space-2));
      right: 0;
      display: flex;
      flex-direction: column;
      min-width: var(--space-8); // 64px — fits "1.75×" with the padding below
      // Seven rows are ~232px, and the chrome is a 16:9 box with
      // `overflow: hidden` — at a 360px viewport it is only ~185px tall, so
      // the top three rows were clipped away and could not be clicked at all.
      // `100cqh` is the overlay's *content* box (its own padding is already
      // out); what remains to subtract is the controls row the trigger sits
      // in, this menu's offset above that row, and one step of clearance so a
      // scrolling menu never butts against the top of the picture.
      max-height: calc(100cqh - var(--space-6) - var(--space-2) - var(--space-4));
      overflow-y: auto;
      padding: var(--space-1);
      border-radius: var(--radius-md);
      background: var(--media-scrim-strong);
      box-shadow: var(--shadow-md);
    }

    &__speed-item {
      padding: var(--space-1) var(--space-3);
      border: 0;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--media-fg);
      text-align: right;
      font-variant-numeric: tabular-nums;
      cursor: pointer;

      &:hover:not(:disabled) {
        background: var(--media-fill-hover);
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      &[aria-checked='true'] {
        color: var(--brand-accent);
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: -2px;
      }
    }

    // ---- Scrubber ----
    // The bookmark markers are <button>s and used to live INSIDE the
    // `role="slider"` element, which is an axe `nested-interactive` failure: a
    // slider must not contain focusable descendants, and a screen reader
    // reaching one has no way to describe where it is. They are a sibling
    // layer now. The wrap is the positioning context shared by the slider and
    // that layer, so the markers' `left: %` offsets still measure the same box.
    &__scrubber-wrap {
      position: relative;
    }

    &__scrubber-marks {
      position: absolute;
      inset: 0;
      // Transparent to the pointer so clicks on the bar still reach the
      // slider underneath; each marker re-enables it for itself.
      pointer-events: none;
    }

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
      pointer-events: auto;
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
      font-weight: var(--fw-semibold);
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

    // ---- Keyboard-shortcuts dialog body ----
    &__shortcuts {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    &__shortcuts-item {
      font-size: var(--text-base);
      color: var(--text-fg);
    }
  }

  @keyframes app-player-chrome-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
