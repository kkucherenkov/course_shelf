<script setup lang="ts">
  import { computed } from 'vue';

  import AppSkeleton from '../AppSkeleton/AppSkeleton.vue';
  import IconCS from '../IconCS/IconCS.vue';
  import { COVER, initials, fmtTime } from './cover-map';
  import { useCourseProgress } from './use-course-progress';
  import type { Course, CourseState } from './types';

  const props = withDefaults(
    defineProps<{
      course: Course;
      state?: CourseState;
      resumeAt?: number;
      loading?: boolean;
    }>(),
    { state: 'auto', resumeAt: undefined, loading: false },
  );

  const emit = defineEmits<{ click: [course: Course] }>();

  const { pct } = useCourseProgress(
    () => props.course,
    () => props.state,
  );

  const coverStyle = computed(() => {
    const bg = props.course.cover ?? COVER[props.course.accent];
    return { background: bg };
  });

  const coverInitials = computed(() => initials(props.course.title));

  const resumeLabel = computed(() =>
    props.resumeAt === undefined ? `${String(pct.value)}%` : `Resume ${fmtTime(props.resumeAt)}`,
  );

  function handleActivate(event: MouseEvent | KeyboardEvent): void {
    if (event instanceof KeyboardEvent && event.key !== 'Enter' && event.key !== ' ') return;
    emit('click', props.course);
  }
</script>

<template>
  <div
    v-if="!loading"
    class="course-wide-card"
    tabindex="0"
    role="button"
    :aria-label="course.title"
    @click="handleActivate"
    @keydown="handleActivate"
  >
    <!-- thumb -->
    <div class="course-wide-card__thumb" :style="coverStyle">
      <span class="course-wide-card__initials" aria-hidden="true">{{ coverInitials }}</span>
      <div class="course-wide-card__overlay" aria-hidden="true" />
      <div class="course-wide-card__strip" aria-hidden="true">
        <div class="course-wide-card__strip-fill" :style="{ width: `${pct}%` }" />
      </div>
    </div>

    <!-- body -->
    <div class="course-wide-card__body">
      <p class="course-wide-card__title">
        {{ course.title }}
      </p>
      <p class="course-wide-card__instructor">
        {{ course.instructor }}
      </p>
      <div class="course-wide-card__meta">
        <IconCS name="play" fill :size="12" class="course-wide-card__meta-icon" />
        <span class="course-wide-card__meta-resume">{{ resumeLabel }}</span>
        <span class="course-wide-card__meta-sep" aria-hidden="true"> · </span>
        <span class="course-wide-card__meta-count"
          >{{ course.completed }}/{{ course.lessons }}</span
        >
      </div>
    </div>
  </div>

  <!-- loading skeleton -->
  <div v-else class="course-wide-card course-wide-card--loading" aria-hidden="true">
    <AppSkeleton width="80px" height="80px" radius="md" />
    <div class="course-wide-card__body">
      <AppSkeleton width="75%" height="1em" radius="sm" />
      <AppSkeleton
        class="course-wide-card__skeleton-instructor"
        width="50%"
        height="0.875em"
        radius="sm"
      />
      <AppSkeleton
        class="course-wide-card__skeleton-meta"
        width="60%"
        height="0.75em"
        radius="sm"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .course-wide-card {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-2);
    border-radius: var(--radius-md);
    cursor: pointer;
    outline: none;
    transition: box-shadow var(--dur-fast) var(--ease-out);

    &:focus-visible {
      box-shadow: var(--shadow-focus);
    }

    &:hover:not(&--loading) {
      box-shadow: var(--shadow-sm);
      background: var(--surface-raised);
    }

    &--loading {
      cursor: default;
    }

    &__thumb {
      flex-shrink: 0;
      position: relative;
      width: 80px;
      height: 80px;
      border-radius: var(--radius-md);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &__initials {
      position: relative;
      z-index: 1;
      font-family: var(--font-sans);
      font-size: var(--text-lg);
      font-weight: var(--fw-bold);
      color: rgba(255, 255, 255, 0.85);
      letter-spacing: var(--tracking-wide);
      line-height: 1;
      pointer-events: none;
      user-select: none;
    }

    &__overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.4) 100%);
      z-index: 0;
      pointer-events: none;
    }

    &__strip {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: rgba(255, 255, 255, 0.25);
      z-index: 2;
    }

    &__strip-fill {
      height: 100%;
      background: var(--brand-accent);
      transition: width var(--dur-slow) var(--ease-out);
    }

    &__body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    &__title {
      margin: 0;
      font-size: var(--text-base);
      font-weight: var(--fw-semibold);
      color: var(--text-fg);
      line-height: var(--leading-snug);
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    &__instructor {
      margin: 0;
      font-size: var(--text-sm);
      color: var(--text-secondary);
      line-height: var(--leading-normal);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &__meta {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 4px;
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    &__meta-icon {
      flex-shrink: 0;
      color: var(--brand-accent);
    }

    &__meta-resume {
      font-size: var(--text-sm);
    }

    &__meta-sep {
      color: var(--text-tertiary);
    }

    &__meta-count {
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    &__skeleton-instructor {
      margin-top: 6px;
    }

    &__skeleton-meta {
      margin-top: 8px;
    }
  }
</style>
