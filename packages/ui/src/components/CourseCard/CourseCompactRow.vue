<script setup lang="ts">
  import { computed } from 'vue';

  import AppSkeleton from '../AppSkeleton/AppSkeleton.vue';
  import { COVER } from './cover-map';
  import { useCourseProgress } from './use-course-progress';
  import type { Course, CourseState } from './types';

  const props = withDefaults(
    defineProps<{
      course: Course;
      state?: CourseState;
      loading?: boolean;
    }>(),
    { state: 'auto', loading: false },
  );

  const emit = defineEmits<{ click: [course: Course] }>();

  const { pct } = useCourseProgress(
    () => props.course,
    () => props.state,
  );

  const thumbStyle = computed(() => {
    const bg = props.course.cover ?? COVER[props.course.accent];
    return { background: bg };
  });

  function handleActivate(event: MouseEvent | KeyboardEvent): void {
    if (event instanceof KeyboardEvent && event.key !== 'Enter' && event.key !== ' ') return;
    emit('click', props.course);
  }
</script>

<template>
  <div
    v-if="!loading"
    class="course-compact-row"
    tabindex="0"
    role="button"
    :aria-label="course.title"
    @click="handleActivate"
    @keydown="handleActivate"
  >
    <!-- thumb: accent block, no glyph -->
    <div class="course-compact-row__thumb" :style="thumbStyle" aria-hidden="true" />

    <!-- title -->
    <p class="course-compact-row__title">
      {{ course.title }}
    </p>

    <!-- progress bar -->
    <div class="course-compact-row__bar" aria-hidden="true">
      <div class="course-compact-row__bar-fill" :style="{ width: `${pct}%` }" />
    </div>

    <!-- pct label -->
    <span class="course-compact-row__pct">{{ pct }}%</span>
  </div>

  <!-- loading skeleton -->
  <div v-else class="course-compact-row course-compact-row--loading" aria-hidden="true">
    <AppSkeleton width="32px" height="32px" radius="sm" />
    <AppSkeleton width="120px" height="0.875em" radius="sm" />
    <AppSkeleton width="48px" height="0.75em" radius="sm" />
  </div>
</template>

<style lang="scss" scoped>
  // Progress-bar thickness — a hairline that sits between --space steps.
  $bar-height: 3px;

  .course-compact-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm);
    cursor: pointer;
    outline: none;
    transition:
      background var(--dur-fast) var(--ease-out),
      box-shadow var(--dur-fast) var(--ease-out);

    &:focus-visible {
      box-shadow: var(--shadow-focus);
    }

    &:hover:not(&--loading) {
      background: var(--surface-raised);
    }

    &--loading {
      cursor: default;
    }

    &__thumb {
      flex-shrink: 0;
      width: var(--space-6);
      height: var(--space-6);
      border-radius: var(--radius-sm);
    }

    &__title {
      flex: 1;
      min-width: 0;
      margin: 0;
      font-size: var(--text-sm);
      font-weight: var(--fw-medium);
      color: var(--text-fg);
      line-height: var(--leading-snug);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &__bar {
      flex-shrink: 0;
      width: var(--space-8);
      height: $bar-height;
      border-radius: 2px;
      background: var(--surface-overlay);
      overflow: hidden;
    }

    &__bar-fill {
      height: 100%;
      background: var(--brand-accent);
      border-radius: 2px;
      transition: width var(--dur-slow) var(--ease-out);
    }

    &__pct {
      flex-shrink: 0;
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--text-secondary);
      width: var(--space-6);
      text-align: right;
    }
  }
</style>
