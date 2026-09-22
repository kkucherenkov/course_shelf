<script setup lang="ts">
  import { computed, resolveComponent } from 'vue';
  import type { RouteLocationRaw } from 'vue-router';

  import AppSkeleton from '../AppSkeleton/AppSkeleton.vue';
  import IconCS from '../IconCS/IconCS.vue';

  import type { IconName } from '../IconCS/IconCS.vue';

  export type LessonState = 'not-started' | 'in-progress' | 'completed' | 'locked';

  const props = withDefaults(
    defineProps<{
      /** 1-based lesson number; padded to 2 digits in the leading column. */
      num: number;
      /** Lesson title. */
      title: string;
      /** Total duration in seconds; shown mono-spaced in the trailing column. */
      duration: number;
      /** Lesson state — drives the leading icon and styling. */
      state?: LessonState;
      /** Renders a small PDF icon in the trailing area when true. */
      materials?: boolean;
      /** Renders a small subtitles icon in the trailing area when true. */
      transcript?: boolean;
      /** Highlights the row as the active lesson (soft accent + 3px leading bar). */
      current?: boolean;
      /** 0..100; only rendered when state === 'in-progress'. */
      progress?: number;
      /** Skeleton variant. */
      loading?: boolean;
      /** Accessible name; override to translate. */
      loadingLabel?: string;
      /** Accessible name; override to translate. */
      materialsLabel?: string;
      /** Accessible name; override to translate. */
      transcriptLabel?: string;
      /**
       * Renders the "<n>% watched" meta line. A callback rather than a plain
       * string because only the consumer knows where its locale puts the
       * number; `@app/ui` never calls `t()` itself.
       */
      formatWatched?: (percent: number) => string;
      /**
       * Navigation target. When set (and the row is neither loading nor
       * locked), the row renders as a `NuxtLink` — a real `<a href>` — instead
       * of a `<div role="button">` only a click/keydown handler can activate
       * (#780: a 540-lesson course page had 3 real links in 5486 DOM nodes).
       * Locked/loading rows never become a link regardless: there is nothing
       * to navigate to yet.
       */
      to?: RouteLocationRaw;
    }>(),
    {
      state: 'not-started',
      materials: false,
      transcript: false,
      current: false,
      progress: 0,
      loading: false,
      loadingLabel: 'Loading lesson',
      materialsLabel: 'Materials available',
      transcriptLabel: 'Transcript available',
      formatWatched: undefined,
      to: undefined,
    },
  );

  const emit = defineEmits<{ select: [] }>();

  const isLink = computed(() => Boolean(props.to) && !props.loading && props.state !== 'locked');
  const rootTag = computed(() => (isLink.value ? resolveComponent('NuxtLink') : 'div'));
  // A real `<a href>` is focusable/activatable on its own — no role/tabindex
  // needed, and a locked row (no `to`, or `to` withheld by the consumer) is
  // never a tab stop.
  const rowTabindex = computed(() => {
    if (isLink.value) return;
    return props.state === 'locked' ? -1 : 0;
  });

  const iconName = computed<IconName>(() => {
    if (props.state === 'completed') return 'check-circle';
    if (props.current) return 'play';
    if (props.state === 'locked') return 'lock';
    return 'circle';
  });

  const iconState = computed(() => (props.current ? 'current' : props.state));

  const showProgressBar = computed(() => props.state === 'in-progress' && props.progress > 0);

  const clampedProgress = computed(() => Math.max(0, Math.min(100, Math.round(props.progress))));

  const formattedDuration = computed(() => fmtTime(props.duration));

  // `defineProps` defaults are hoisted out of setup() and cannot reference a
  // function declared here, so the fallback lives at the call site.
  const watchedLabel = computed(() =>
    (props.formatWatched ?? defaultFormatWatched)(clampedProgress.value),
  );

  function defaultFormatWatched(percent: number): string {
    return `${String(percent)}% watched`;
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

  function onActivate(): void {
    if (props.loading || props.state === 'locked') return;
    emit('select');
  }

  function onKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onActivate();
    }
  }
</script>

<template>
  <div
    v-if="loading"
    class="app-lesson-row app-lesson-row--loading"
    role="status"
    :aria-busy="true"
    :aria-label="loadingLabel"
  >
    <AppSkeleton width="24px" height="12px" />
    <AppSkeleton width="18px" height="18px" radius="pill" />
    <div class="app-lesson-row__body">
      <AppSkeleton width="70%" height="12px" />
    </div>
    <AppSkeleton width="40px" height="12px" />
  </div>
  <component
    :is="rootTag"
    v-else
    :to="isLink ? to : undefined"
    class="app-lesson-row"
    :class="{
      'app-lesson-row--current': current,
      'app-lesson-row--locked': state === 'locked',
    }"
    :role="isLink ? undefined : 'button'"
    :tabindex="rowTabindex"
    :aria-current="current ? 'true' : undefined"
    :aria-disabled="!isLink && state === 'locked' ? 'true' : undefined"
    :data-current="current"
    :data-state="state"
    @click="isLink ? undefined : onActivate()"
    @keydown="isLink ? undefined : onKey($event)"
  >
    <div class="app-lesson-row__num">
      {{ String(num).padStart(2, '0') }}
    </div>
    <div class="app-lesson-row__icon" :data-state="iconState">
      <IconCS :name="iconName" :size="18" />
    </div>
    <div class="app-lesson-row__body">
      <div class="app-lesson-row__title" :title="title">
        {{ title }}
      </div>
      <div v-if="showProgressBar" class="app-lesson-row__progress" aria-hidden="true">
        <div class="app-lesson-row__progress-fill" :style="{ width: `${clampedProgress}%` }" />
      </div>
      <div v-if="state === 'in-progress'" class="app-lesson-row__meta">
        <span>{{ watchedLabel }}</span>
      </div>
    </div>
    <div class="app-lesson-row__trailing">
      <IconCS
        v-if="materials"
        name="pdf"
        :size="14"
        :title="materialsLabel"
        class="app-lesson-row__materials"
      />
      <IconCS
        v-if="transcript"
        name="subtitles"
        :size="14"
        :title="transcriptLabel"
        class="app-lesson-row__transcript"
      />
      <span class="app-lesson-row__duration">{{ formattedDuration }}</span>
    </div>
  </component>
</template>

<style scoped lang="scss">
  // Bundle .lr contract parity. Token aliases (bundle → shipped):
  //   --surface-2     → --surface-raised
  //   --surface-3     → --surface-overlay
  //   --primary       → --brand-accent
  //   --primary-soft  → --brand-accent-soft
  //   --text-loud     → --text-fg
  //   --text-muted    → --text-secondary
  //   --text-subtle   → --text-tertiary
  //   --success       → --status-success-fg
  //   --d-fast        → --dur-fast
  // Leading lesson-number column width — named var, exempt from the raw-px rule.
  $num-col-w: 24px;

  .app-lesson-row {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background var(--dur-fast);
    // Neutralises the anchor default (blue, underlined) when `to` renders a
    // NuxtLink root — harmless on the plain-div variant.
    color: inherit;
    text-decoration: none;

    &:hover {
      background: var(--surface-raised);
    }

    &:focus-visible {
      outline: 2px solid var(--brand-accent);
      outline-offset: -2px;
    }

    // Current row is marked by the accent-soft background + play icon +
    // aria-current. No left side-stripe (avoids the side-stripe anti-pattern).
    &--current {
      background: var(--brand-accent-soft);
    }

    &--locked {
      cursor: not-allowed;
    }

    &__num {
      width: $num-col-w;
      flex-shrink: 0;
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--text-tertiary);
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    &__icon {
      flex-shrink: 0;
      color: var(--text-secondary);

      &[data-state='completed'] {
        color: var(--status-success-fg);
      }

      &[data-state='current'] {
        color: var(--brand-accent);
      }

      &[data-state='locked'] {
        color: var(--text-tertiary);
      }
    }

    &__body {
      flex: 1 1 auto;
      min-width: 0;
    }

    &__title {
      font-size: var(--text-md);
      color: var(--text-fg);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &--locked &__title {
      color: var(--text-secondary);
    }

    &__progress {
      margin-top: var(--space-1);
      height: 2px;
      background: var(--surface-overlay);
      border-radius: 1px;
      overflow: hidden;
    }

    &__progress-fill {
      height: 100%;
      background: var(--brand-accent);
    }

    &__meta {
      margin-top: 2px;
      display: flex;
      gap: var(--space-2);
      align-items: center;
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    &__trailing {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      flex-shrink: 0;
      color: var(--text-secondary);
      font-size: var(--text-sm);
    }

    &__materials,
    &__transcript {
      flex-shrink: 0;
    }

    &__duration {
      font-family: var(--font-mono);
      font-variant-numeric: tabular-nums;
    }

    &--loading {
      cursor: default;
    }
  }
</style>
