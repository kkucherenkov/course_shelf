<script setup lang="ts">
  import { computed } from 'vue';
  import { AppNoPermission, AppSkeleton } from '@app/ui';
  import type { LessonOutlineItem } from '@app/api-client-ts';

  import { accentFromId } from '~/utils/course-accent';
  import { useCourseOutline } from '~/composables/useCourseOutline';

  import CourseHero from '~/components/course-detail/CourseHero.vue';
  import CourseActions from '~/components/course-detail/CourseActions.vue';
  import CourseSectionsList from '~/components/course-detail/CourseSectionsList.vue';
  import CourseMaterialsRail from '~/components/course-detail/CourseMaterialsRail.vue';
  import CourseCompletedBanner from '~/components/course-detail/CourseCompletedBanner.vue';

  definePageMeta({ layout: 'default' });

  const { t } = useI18n();
  const route = useRoute();
  const toast = useToast();

  const courseId = route.params.id as string;
  const { data, status, errorStatus, refetch, markComplete, resetProgress, mutating } =
    useCourseOutline(courseId);

  const accent = computed(() => accentFromId(courseId));

  // ── Derived course state ─────────────────────────────────────────────────────

  /** All lessons from all sections flattened. */
  const allLessons = computed<LessonOutlineItem[]>(
    () => data.value?.sections.flatMap((s) => s.lessons) ?? [],
  );

  /**
   * Determine course state:
   * - 'completed' — every lesson is completed
   * - 'in-progress' — at least one lesson is in-progress
   * - 'not-started' — otherwise
   */
  const courseState = computed<'not-started' | 'in-progress' | 'completed'>(() => {
    const lessons = allLessons.value;
    if (lessons.length === 0) return 'not-started';
    const allDone = lessons.every((l) => l.state === 'completed');
    if (allDone) return 'completed';
    const anyInProgress = lessons.some((l) => l.state === 'in-progress');
    if (anyInProgress) return 'in-progress';
    return 'not-started';
  });

  /**
   * The "current" lesson:
   * - If any lesson is in-progress, pick the first one (most recently watched
   *   would need a timestamp, but the backend returns them sorted by position,
   *   so we take the last in-progress lesson as the resume target).
   * - Otherwise take the first not-started lesson.
   */
  const resumeLesson = computed<LessonOutlineItem | null>(() => {
    const lessons = allLessons.value;
    // Last in-progress (furthest along in the course)
    const inProgress = lessons.filter((l) => l.state === 'in-progress');
    if (inProgress.length > 0) return inProgress.at(-1) ?? null;
    // First not-started
    return lessons.find((l) => l.state === 'not-started') ?? null;
  });

  /** The lesson id to highlight as "current" in the rows. */
  const currentLessonId = computed<string | null>(() => resumeLesson.value?.id ?? null);

  /**
   * Find the section number and lesson position for the resume CTA label.
   */
  const resumePosition = computed<{ section: number; lesson: number } | null>(() => {
    if (!resumeLesson.value) return null;
    const lessonId = resumeLesson.value.id;
    for (const section of data.value?.sections ?? []) {
      const found = section.lessons.find((l) => l.id === lessonId);
      if (found) return { section: section.position, lesson: found.position };
    }
    return null;
  });

  const primaryCTALabel = computed<string>(() => {
    if (courseState.value === 'in-progress' && resumePosition.value) {
      return t('pages.courseDetail.ctaResume', {
        section: resumePosition.value.section,
        lesson: resumePosition.value.lesson,
      });
    }
    return t('pages.courseDetail.ctaStart');
  });

  const primaryCTAHref = computed<string>(() => {
    const lessonId = resumeLesson.value?.id;
    if (lessonId) return `/lessons/${lessonId}`;
    // Fallback — no lesson to jump to (all completed with no "first not-started")
    return '#';
  });

  // ── Completed banner text ────────────────────────────────────────────────────

  const completedBannerLabel = computed<string>(() => {
    const totalSec = data.value?.course.totalDurationSeconds ?? 0;
    const hours = Math.round(totalSec / 3600);
    return t('pages.courseDetail.completedBanner', { hours });
  });

  // ── Lessons meta label ───────────────────────────────────────────────────────

  const lessonsLabel = computed<string>(() => {
    const n = data.value?.course.lessonsTotal ?? 0;
    return t('pages.courseDetail.lessons', n, { named: { n } });
  });

  // ── Access control ───────────────────────────────────────────────────────────

  const isLocked = computed<boolean>(() => errorStatus.value === 403);

  // ── Mutations ────────────────────────────────────────────────────────────────

  async function onMarkComplete(): Promise<void> {
    const err = await markComplete();
    if (err) {
      toast.add({ title: t('pages.courseDetail.toastMarkCompleteError'), color: 'error' });
    } else {
      toast.add({ title: t('pages.courseDetail.toastMarkCompleteSuccess'), color: 'success' });
    }
  }

  async function onResetProgress(): Promise<void> {
    const err = await resetProgress();
    if (err) {
      toast.add({ title: t('pages.courseDetail.toastResetError'), color: 'error' });
    } else {
      toast.add({ title: t('pages.courseDetail.toastResetSuccess'), color: 'success' });
    }
  }

  function onDownloadAttempt(): void {
    toast.add({ title: t('pages.courseDetail.toastDownloadSoon'), color: 'info' });
  }

  function onSelectLesson(lessonId: string): void {
    void navigateTo(`/lessons/${lessonId}`);
  }
</script>

<template>
  <div class="page-course-detail">
    <!-- ── Error / no-access state ───────────────────────────────────────────── -->
    <div v-if="status === 'error'" class="page-course-detail__error-wrap">
      <AppNoPermission
        v-if="isLocked"
        :title="t('pages.courseDetail.noAccess')"
        :body="t('pages.courseDetail.noAccessBody')"
      />
      <div v-else class="page-course-detail__load-error">
        <p class="page-course-detail__load-error-msg">{{ t('pages.courseDetail.loadingError') }}</p>
        <button type="button" class="page-course-detail__retry-btn" @click="refetch()">
          {{ t('pages.courseDetail.retry') }}
        </button>
      </div>
    </div>

    <!-- ── Loading skeleton ──────────────────────────────────────────────────── -->
    <template v-else-if="status === 'pending' || status === 'idle'">
      <div class="page-course-detail__skeleton">
        <AppSkeleton width="100%" height="200px" radius="md" />
        <AppSkeleton width="60%" height="28px" />
        <AppSkeleton width="40%" height="16px" />
        <AppSkeleton width="100%" height="400px" radius="md" />
      </div>
    </template>

    <!-- ── Main content ──────────────────────────────────────────────────────── -->
    <template v-else-if="data">
      <!-- Hero -->
      <CourseHero
        :course="data.course"
        :accent="accent"
        :resume-label="primaryCTALabel"
        :instructor-label="t('pages.courseDetail.instructorBy')"
        :lessons-label="lessonsLabel"
        :progress-label="t('pages.courseDetail.progress')"
        class="page-course-detail__hero"
      />

      <!-- Actions -->
      <CourseActions
        :course-state="courseState"
        :primary-label="primaryCTALabel"
        :primary-href="primaryCTAHref"
        :mark-complete-label="t('pages.courseDetail.ctaMarkComplete')"
        :reset-progress-label="t('pages.courseDetail.ctaResetProgress')"
        :reset-dialog-title="t('pages.courseDetail.resetDialogTitle')"
        :reset-dialog-description="t('pages.courseDetail.resetDialogDescription')"
        :reset-dialog-confirm-label="t('pages.courseDetail.resetDialogConfirm')"
        :reset-dialog-cancel-label="t('pages.courseDetail.resetDialogCancel')"
        :mutating="mutating"
        class="page-course-detail__actions"
        @mark-complete="onMarkComplete"
        @reset-progress="onResetProgress"
      />

      <!-- Two-column layout: sections + rail -->
      <div class="page-course-detail__layout">
        <!-- Main: completed banner + section list -->
        <div class="page-course-detail__main">
          <CourseCompletedBanner
            v-if="courseState === 'completed'"
            :label="completedBannerLabel"
            class="page-course-detail__completed-banner"
          />
          <CourseSectionsList
            :sections="data.sections"
            :current-lesson-id="currentLessonId"
            class="page-course-detail__sections"
            @select-lesson="onSelectLesson"
          />
        </div>

        <!-- Rail: materials -->
        <div class="page-course-detail__rail">
          <CourseMaterialsRail
            :materials="data.materials"
            :heading="t('pages.courseDetail.materialsHeading')"
            :empty-label="t('pages.courseDetail.materialsEmpty')"
            :download-soon-label="t('pages.courseDetail.toastDownloadSoon')"
            @download-attempt="onDownloadAttempt"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
  $rail-width: 300px;
  $page-max-w: 1440px;
  // Topbar height matches the default layout header — named var, exempt from raw-px rule.
  $topbar-h: 56px;

  .page-course-detail {
    max-width: $page-max-w;
    margin: 0 auto;
    padding: 0 var(--space-6) var(--space-12);
    display: flex;
    flex-direction: column;
    gap: var(--space-6);

    &__error-wrap {
      display: flex;
      justify-content: center;
      padding: var(--space-12) 0;
    }

    &__load-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-4);
    }

    &__load-error-msg {
      margin: 0;
      font-size: var(--text-base);
      color: var(--text-secondary);
    }

    &__retry-btn {
      appearance: none;
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--text-fg);
      padding: var(--space-2) var(--space-4);
      font-size: var(--text-sm);
      cursor: pointer;

      &:hover {
        background: var(--surface-raised);
      }
    }

    &__skeleton {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    &__hero {
      // Full-width hero at the top
    }

    &__actions {
      // Stays below hero, above section list
    }

    &__layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-6);
      align-items: start;

      // >1024px: side-by-side
      @media (width > 1024px) {
        grid-template-columns: 1fr $rail-width;
      }
    }

    &__main {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      min-width: 0;
    }

    &__completed-banner {
      // Banner above section list — no margin needed; gap handles it
    }

    &__rail {
      // At ≤1024px: rail flows naturally below main (single column)
      // At >1024px: sticky right rail
      @media (width > 1024px) {
        position: sticky;
        top: calc(#{$topbar-h} + var(--space-4));
      }
    }
  }
</style>
