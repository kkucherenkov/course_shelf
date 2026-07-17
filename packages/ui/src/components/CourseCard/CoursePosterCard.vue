<script setup lang="ts">
  import AppSkeleton from '../AppSkeleton/AppSkeleton.vue';
  import IconCS from '../IconCS/IconCS.vue';
  import { useCourseCard } from './use-course-card';
  import type { Course, CourseState } from './types';

  const props = withDefaults(
    defineProps<{
      course: Course;
      state?: CourseState;
      loading?: boolean;
      /**
       * Whether the card is its own interactive control. Default `true`
       * keeps the standalone button semantics. Set `false` when the card is
       * wrapped in a link so the anchor owns navigation/focus/name and the
       * card stays presentational (no button nested inside an `<a>`).
       */
      interactive?: boolean;
    }>(),
    { state: 'auto', loading: false, interactive: true },
  );

  const emit = defineEmits<{ click: [course: Course] }>();

  const { pct, realState, coverStyle, coverInitials, interactiveAttrs, shouldActivate } =
    useCourseCard(
      () => props.course,
      () => props.state,
      () => props.interactive,
    );

  function handleActivate(event: MouseEvent | KeyboardEvent): void {
    if (shouldActivate(event)) emit('click', props.course);
  }
</script>

<template>
  <div
    v-if="!loading"
    class="course-poster-card"
    v-bind="interactiveAttrs"
    @click="handleActivate"
    @keydown="handleActivate"
  >
    <div class="course-poster-card__cover" :style="coverStyle">
      <span class="course-poster-card__initials" aria-hidden="true">{{ coverInitials }}</span>
      <div class="course-poster-card__overlay" aria-hidden="true" />

      <!-- completed badge -->
      <div
        v-if="realState === 'completed'"
        class="course-poster-card__badge course-poster-card__badge--completed"
        aria-hidden="true"
      >
        <IconCS name="check" :size="16" />
      </div>

      <!-- locked scrim -->
      <div v-else-if="realState === 'locked'" class="course-poster-card__scrim" aria-hidden="true">
        <IconCS name="lock" :size="20" />
      </div>

      <!-- progress strip -->
      <div v-else class="course-poster-card__strip" aria-hidden="true">
        <div class="course-poster-card__strip-fill" :style="{ width: `${pct}%` }" />
      </div>
    </div>

    <div class="course-poster-card__body">
      <p class="course-poster-card__title">
        {{ course.title }}
      </p>
      <p v-if="course.instructor" class="course-poster-card__instructor">
        {{ course.instructor }}
      </p>
    </div>
  </div>

  <!-- loading skeleton -->
  <div v-else class="course-poster-card course-poster-card--loading" aria-hidden="true">
    <AppSkeleton class="course-poster-card__cover-skeleton" width="100%" height="0" radius="md" />
    <div class="course-poster-card__body">
      <AppSkeleton width="80%" height="1em" radius="sm" />
      <AppSkeleton
        class="course-poster-card__skeleton-instructor"
        width="55%"
        height="0.875em"
        radius="sm"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  // Badge circle and hairline progress strip — both sit between --space steps.
  $badge-size: 28px;
  $strip-height: 3px;
  $skeleton-instructor-gap: 6px;

  // Stacking context within the card (named vars — no raw ints).
  $z-cover-overlay: 0;
  $z-initials: 1;
  $z-cover-top: 2;

  .course-poster-card {
    display: flex;
    flex-direction: column;
    border-radius: var(--radius-md);
    overflow: hidden;
    cursor: pointer;
    outline: none;
    transition: box-shadow var(--dur-fast) var(--ease-out);

    &:focus-visible {
      box-shadow: var(--shadow-focus);
    }

    &:hover:not(&--loading) {
      box-shadow: var(--shadow-sm);
    }

    &--loading {
      cursor: default;
    }

    &__cover {
      position: relative;
      aspect-ratio: 3 / 4;
      width: 100%;
      border-radius: var(--radius-md) var(--radius-md) 0 0;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &__cover-skeleton {
      aspect-ratio: 3 / 4;
      width: 100%;
      display: block;
      border-radius: var(--radius-md) var(--radius-md) 0 0;
    }

    &__initials {
      position: relative;
      z-index: $z-initials;
      font-family: var(--font-sans);
      font-size: var(--text-3xl);
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
      z-index: $z-cover-overlay;
      pointer-events: none;
    }

    &__badge {
      position: absolute;
      top: var(--space-2);
      right: var(--space-2);
      z-index: $z-cover-top;
      display: flex;
      align-items: center;
      justify-content: center;
      width: $badge-size;
      height: $badge-size;
      border-radius: var(--radius-pill);
      color: #fff;

      &--completed {
        background: var(--status-success-fg);
      }
    }

    &__scrim {
      position: absolute;
      inset: 0;
      z-index: $z-cover-top;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.4);
      color: #fff;
    }

    &__strip {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: $strip-height;
      background: rgba(255, 255, 255, 0.25);
      z-index: $z-cover-top;
    }

    &__strip-fill {
      height: 100%;
      background: var(--brand-accent);
      transition: width var(--dur-slow) var(--ease-out);
    }

    &__body {
      padding: var(--space-2) var(--space-1) var(--space-1);
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

    &__skeleton-instructor {
      margin-top: $skeleton-instructor-gap;
    }
  }
</style>
