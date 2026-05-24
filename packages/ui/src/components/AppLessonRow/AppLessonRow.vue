<script setup lang="ts">
  import { computed } from 'vue';

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
      /** Highlights the row as the active lesson (soft accent + 3px leading bar). */
      current?: boolean;
      /** 0..100; only rendered when state === 'in-progress'. */
      progress?: number;
      /** Skeleton variant. */
      loading?: boolean;
    }>(),
    {
      state: 'not-started',
      materials: false,
      current: false,
      progress: 0,
      loading: false,
    },
  );

  const emit = defineEmits<{ select: [] }>();

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
    :aria-busy="true"
    aria-label="Loading lesson"
  >
    <AppSkeleton width="24px" height="12px" />
    <AppSkeleton width="18px" height="18px" radius="pill" />
    <div class="app-lesson-row__body">
      <AppSkeleton width="70%" height="12px" />
    </div>
    <AppSkeleton width="40px" height="12px" />
  </div>
  <div
    v-else
    class="app-lesson-row"
    :class="{
      'app-lesson-row--current': current,
      'app-lesson-row--locked': state === 'locked',
    }"
    role="button"
    :tabindex="state === 'locked' ? -1 : 0"
    :aria-current="current ? 'true' : undefined"
    :aria-disabled="state === 'locked' ? 'true' : undefined"
    :data-current="current"
    :data-state="state"
    @click="onActivate"
    @keydown="onKey"
  >
    <div class="app-lesson-row__num">
      {{ String(num).padStart(2, '0') }}
    </div>
    <div class="app-lesson-row__icon" :data-state="iconState">
      <IconCS :name="iconName" :size="18" />
    </div>
    <div class="app-lesson-row__body">
      <div class="app-lesson-row__title">
        {{ title }}
      </div>
      <div v-if="showProgressBar" class="app-lesson-row__progress" aria-hidden="true">
        <div class="app-lesson-row__progress-fill" :style="{ width: `${clampedProgress}%` }" />
      </div>
      <div v-if="state === 'in-progress'" class="app-lesson-row__meta">
        <span>{{ clampedProgress }}% watched</span>
      </div>
    </div>
    <div class="app-lesson-row__trailing">
      <IconCS
        v-if="materials"
        name="pdf"
        :size="14"
        title="Materials available"
        class="app-lesson-row__materials"
      />
      <span class="app-lesson-row__duration">{{ formattedDuration }}</span>
    </div>
  </div>
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
  //   --success       → --feedback-success
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
        color: var(--feedback-success);
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
      font-size: var(--text-sm);
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
      font-size: var(--text-xs);
      color: var(--text-secondary);
    }

    &__trailing {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      flex-shrink: 0;
      color: var(--text-secondary);
      font-size: var(--text-xs);
    }

    &__materials {
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
