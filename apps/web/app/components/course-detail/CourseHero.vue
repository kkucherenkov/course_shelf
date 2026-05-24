<script setup lang="ts">
  import { computed } from 'vue';
  import { AppProgressLinear, COVER } from '@app/ui';
  import type { CourseOutlineSummary } from '@app/api-client-ts';
  import type { CourseAccent } from '@app/ui';

  const props = defineProps<{
    course: CourseOutlineSummary;
    accent: CourseAccent;
    resumeLabel: string;
    instructorLabel: string;
    lessonsLabel: string;
    /** Optional total-duration label (e.g. "9h 45m"); hidden when empty. */
    durationLabel?: string;
    progressLabel: string;
  }>();

  // Cover background reuses the single source of truth from @app/ui.
  const coverStyle = computed(() => ({ background: COVER[props.accent] }));
</script>

<template>
  <div class="course-hero">
    <!-- Cover (accent block) -->
    <div class="course-hero__cover" aria-hidden="true">
      <div class="course-hero__cover-inner" :style="coverStyle" />
    </div>

    <!-- Title block -->
    <div class="course-hero__info">
      <p v-if="course.instructor" class="course-hero__instructor">
        {{ instructorLabel }}: {{ course.instructor }}
      </p>
      <h1 class="course-hero__title">{{ course.title }}</h1>
      <p class="course-hero__meta">
        {{ lessonsLabel }}<template v-if="durationLabel"> · {{ durationLabel }}</template>
      </p>
      <div class="course-hero__progress-wrap">
        <AppProgressLinear
          :value="course.progress.percent"
          thin
          :label="progressLabel"
          class="course-hero__progress-bar"
        />
        <span class="course-hero__progress-text">{{ course.progress.percent }}%</span>
      </div>
      <p v-if="course.description" class="course-hero__description">
        {{ course.description }}
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
  // Cover column widths — named SCSS vars are exempt from the raw-px lint rule.
  $cover-col-lg: 240px;
  $cover-col-xs: 96px;

  .course-hero {
    display: grid;
    grid-template-columns: $cover-col-lg 1fr;
    gap: var(--space-8);
    align-items: start;

    // 1024px — stacked vertically
    @media (width <= 1024px) {
      grid-template-columns: 1fr;
    }

    // 360px — horizontal strip: small cover left, title right, no description
    @media (width <= 480px) {
      grid-template-columns: $cover-col-xs 1fr;
      gap: var(--space-4);
    }

    &__cover {
      border-radius: var(--radius-lg);
      overflow: hidden;
      aspect-ratio: 4 / 3;
      flex-shrink: 0;

      // 360px — smaller cover
      @media (width <= 480px) {
        aspect-ratio: 1 / 1;
        border-radius: var(--radius-md);
      }
    }

    &__cover-inner {
      width: 100%;
      height: 100%;
      // background is set via the :style binding in the component script
      opacity: 0.85;
    }

    &__info {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      padding-top: var(--space-1);
    }

    &__instructor {
      margin: 0;
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    &__title {
      margin: 0;
      font-size: var(--text-2xl);
      font-weight: var(--fw-bold);
      color: var(--text-fg);
      line-height: 1.25;

      @media (width <= 480px) {
        font-size: var(--text-lg);
      }
    }

    &__meta {
      margin: 0;
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    &__progress-wrap {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    &__progress-bar {
      flex: 1 1 auto;
    }

    &__progress-text {
      flex-shrink: 0;
      font-size: var(--text-xs);
      color: var(--text-secondary);
      font-variant-numeric: tabular-nums;
    }

    &__description {
      margin: 0;
      font-size: var(--text-sm);
      color: var(--text-secondary);
      line-height: 1.6;

      // Hide description in strip layout (≤480px)
      @media (width <= 480px) {
        display: none;
      }
    }
  }
</style>
