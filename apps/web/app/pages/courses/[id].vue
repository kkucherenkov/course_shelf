<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { AppButton, AppDialog, AppErrorState, AppNoPermission, AppSkeleton } from '@app/ui';
  import { runCourseRescan, startCourseTranscription, client } from '@app/api-client-ts';
  import type { CourseMaterialItem, LessonOutlineItem } from '@app/api-client-ts';

  import { accentFromId } from '~/utils/course-accent';
  import { descriptionBody } from '~/utils/description-lead';
  import { problemDetail } from '~/utils/library-register';
  import { useCourseOutline } from '~/composables/useCourseOutline';
  import { useExportDownload } from '~/composables/useExportDownload';
  import { useMaterialDownload } from '~/composables/useMaterialDownload';
  import { useContinueWatching } from '~/composables/useHome';
  import { useAuthStore } from '~/stores/auth';

  import CourseHero from '~/components/course-detail/CourseHero.vue';
  import CourseActions from '~/components/course-detail/CourseActions.vue';
  import CourseDescription from '~/components/course-detail/CourseDescription.vue';
  import CourseSectionsList from '~/components/course-detail/CourseSectionsList.vue';
  import CourseMaterialsRail from '~/components/course-detail/CourseMaterialsRail.vue';
  import CourseCompletedBanner from '~/components/course-detail/CourseCompletedBanner.vue';

  definePageMeta({ layout: 'default' });

  const { t } = useI18n();
  const route = useRoute();

  // When a child route is active (e.g. /courses/:id/lessons/:lessonId),
  // delegate rendering to <NuxtPage /> instead of showing the course detail UI.
  const hasChildRoute = computed(() => route.name !== 'courses-id');
  const toast = useToast();

  const courseId = route.params.id as string;
  const { data, status, errorStatus, refetch, markComplete, resetProgress, mutating } =
    useCourseOutline(courseId);

  // Same source the home page's "Continue watching" row uses (#573) — refetched
  // on mount rather than trusting whatever `useAsyncData` still has cached from
  // an earlier visit to `/`, since the whole point is that this page must agree
  // with the freshest server-recorded position, not a stale one.
  const continueWatching = useContinueWatching();
  void continueWatching.refetch();

  const accent = computed(() => accentFromId(courseId));

  // Admin-only entry point to the metadata editor — cosmetic; the real guard
  // is the `admin` middleware on `pages/courses/[id]/edit.vue` itself.
  const auth = useAuthStore();
  const isAdmin = computed(() => auth.user?.role?.toLowerCase() === 'admin');

  // Admin-only rescan (E32-F01-S02) — fires the request and lets the global
  // ScanLifecycleNotifier (mounted in the default layout) show progress via
  // the same scans:user:{userId} realtime channel a library scan uses.
  const isRescanning = ref(false);

  async function doRescan(): Promise<void> {
    isRescanning.value = true;
    try {
      const { error } = await runCourseRescan({
        client,
        throwOnError: false,
        path: { id: courseId },
      });
      if (error) throw new Error('rescan request failed');
      toast.add({ title: t('pages.courseDetail.toastRescanStarted'), color: 'success' });
    } catch {
      toast.add({ title: t('pages.courseDetail.toastRescanError'), color: 'error' });
    } finally {
      isRescanning.value = false;
    }
  }

  // Admin-only course transcription (E32-F02-S01). Same shape as the rescan
  // above, with one difference: the server's own `detail` is shown on failure
  // rather than a canned sentence. The 409 here is the interesting case — it
  // names the run already in flight and the cancel route, and swallowing that
  // would leave the operator with "could not start" and nothing to act on.
  const isTranscribing = ref(false);

  async function doTranscribe(): Promise<void> {
    isTranscribing.value = true;
    try {
      const { error } = await startCourseTranscription({
        client,
        throwOnError: false,
        path: { id: courseId },
        body: {},
      });
      if (error) {
        toast.add({
          title: problemDetail(error) ?? t('pages.courseDetail.toastTranscribeError'),
          color: 'error',
        });
        return;
      }
      toast.add({ title: t('pages.courseDetail.toastTranscribeStarted'), color: 'success' });
    } catch {
      toast.add({ title: t('pages.courseDetail.toastTranscribeError'), color: 'error' });
    } finally {
      isTranscribing.value = false;
    }
  }

  // ── Rescan/transcribe/reset confirm dialog (#606, #624) ──────────────────────
  // All three rewrite consequential state with no cheap undo: rescan replaces
  // the course's section/lesson list, transcription can occupy a GPU for
  // hours, and reset progress clears every lesson's watched state — on the
  // largest course in the audit database that's 540 lessons with no restore
  // button, not "reversible by rewatching" (the claim a previous wave used to
  // remove this dialog). "Mark complete" is the one action left that still
  // fires straight through, because it only adds progress and never destroys
  // it. One dialog shared by all three rather than near-identical copies.
  const pendingCourseAction = ref<'rescan' | 'transcribe' | 'reset' | null>(null);

  const courseActionDialog = computed(() => {
    if (pendingCourseAction.value === 'rescan') {
      return {
        title: t('pages.courseDetail.rescanDialogTitle'),
        description: t('pages.courseDetail.rescanDialogDescription'),
        confirmLabel: t('pages.courseDetail.rescanDialogConfirm'),
      };
    }
    if (pendingCourseAction.value === 'transcribe') {
      return {
        title: t('pages.courseDetail.transcribeDialogTitle'),
        description: t('pages.courseDetail.transcribeDialogDescription'),
        confirmLabel: t('pages.courseDetail.transcribeDialogConfirm'),
      };
    }
    if (pendingCourseAction.value === 'reset') {
      return {
        title: t('pages.courseDetail.resetDialogTitle'),
        description: t('pages.courseDetail.resetDialogDescription'),
        confirmLabel: t('pages.courseDetail.resetDialogConfirm'),
      };
    }
    return null;
  });

  function confirmCourseAction(): void {
    const action = pendingCourseAction.value;
    pendingCourseAction.value = null;
    switch (action) {
      case 'rescan': {
        void doRescan();
        break;
      }
      case 'transcribe': {
        void doTranscribe();
        break;
      }
      case 'reset': {
        void onResetProgress();
        break;
      }
      // No default
    }
  }

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
   * The lesson to resume — sourced from the same `lastSeenLessonId` the home
   * page's "Continue watching" row is built from (`GET
   * /home/continue-watching`), so the two screens can never disagree about
   * where the learner left off (#573: watch lesson 40, glance at lesson 5,
   * and this page used to send "Resume" back to 40 while home sent it to 5).
   *
   * Falls back to a position-based heuristic (furthest-along in-progress
   * lesson, else first not-started) only while that fetch is in flight, or
   * when this course isn't in the requester's continue-watching list yet —
   * the outline itself carries per-lesson `state` but no watched-at
   * timestamp to derive "most recent" from directly.
   */
  const resumeLesson = computed<LessonOutlineItem | null>(() => {
    const lessons = allLessons.value;

    // A fully completed course has nothing to "resume" — send the CTA back
    // to lesson 1 instead of wherever continue-watching last parked. That
    // read model isn't filtered by completion (#596): it still lists a
    // finished course as long as `lastSeenAt` is recent, which used to make
    // "Rewatch" open the last-watched lesson instead of the first.
    if (courseState.value !== 'completed') {
      const seenId = continueWatching.data.value?.items.find(
        (item) => item.courseId === courseId,
      )?.lastSeenLessonId;
      if (seenId) {
        const seen = lessons.find((l) => l.id === seenId);
        if (seen) return seen;
      }
    }

    // Last in-progress (furthest along in the course)
    const inProgress = lessons.filter((l) => l.state === 'in-progress');
    if (inProgress.length > 0) return inProgress.at(-1) ?? null;
    // First not-started
    return lessons.find((l) => l.state === 'not-started') ?? null;
  });

  /** The lesson id to highlight as "current" in the rows. */
  const currentLessonId = computed<string | null>(() => resumeLesson.value?.id ?? null);

  /** First lesson in the course — the rewatch target once everything is done. */
  const firstLessonId = computed<string | null>(() => allLessons.value[0]?.id ?? null);

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
    // A finished course can't be "started" — offer a rewatch from the top.
    if (courseState.value === 'completed') return t('pages.courseDetail.ctaRewatch');
    return t('pages.courseDetail.ctaStart');
  });

  const primaryCTAHref = computed<string>(() => {
    // Resume target when in-progress/not-started; first lesson when completed
    // (rewatch). Only '#' when the course genuinely has no lessons.
    const lessonId = resumeLesson.value?.id ?? firstLessonId.value;
    if (lessonId) return `/courses/${courseId}/lessons/${lessonId}`;
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

  // Total course duration for the hero meta. Empty (hidden) when unknown.
  const durationLabel = computed<string>(() => {
    const totalSec = data.value?.course.totalDurationSeconds ?? 0;
    if (totalSec <= 0) return '';
    const h = Math.floor(totalSec / 3600);
    const m = Math.round((totalSec % 3600) / 60);
    return t('pages.courseDetail.durationValue', { h, m });
  });

  // `CourseHero` already prints the lead line (descriptionLead); this is the
  // remainder `CourseDescription` shows below the fold, so the lead doesn't
  // print twice (#184).
  const courseDescriptionBody = computed<string>(() =>
    descriptionBody(data.value?.course.description ?? ''),
  );

  // ── Access control ───────────────────────────────────────────────────────────

  const isLocked = computed<boolean>(() => errorStatus.value === 403);

  // The generic loadingError copy says "check your connection and try
  // again" — wrong advice for a 429, where the connection is fine and
  // retrying only extends the block (#701).
  const loadingErrorBody = computed<string>(() =>
    errorStatus.value === 429
      ? t('ui.errors.rateLimitedBody')
      : t('pages.courseDetail.loadingError'),
  );

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

  const { download: downloadMaterial } = useMaterialDownload();
  const { downloadCourseExport } = useExportDownload();
  const isExporting = ref(false);

  async function onExportCourse(): Promise<void> {
    isExporting.value = true;
    const filename = `${data.value?.course.title ?? 'course'}.zip`;
    const err = await downloadCourseExport({ courseId, filename });
    if (err) {
      toast.add({ title: t('pages.courseDetail.toastExportError'), color: 'error' });
    }
    isExporting.value = false;
  }

  async function onDownloadAttempt(material: CourseMaterialItem): Promise<void> {
    const err = await downloadMaterial({
      lessonId: material.lessonId,
      materialId: material.id,
      filename: material.label,
    });
    if (err) {
      toast.add({ title: t('pages.courseDetail.toastDownloadError'), color: 'error' });
    }
  }

  function onSelectLesson(lessonId: string): void {
    void navigateTo(`/courses/${courseId}/lessons/${lessonId}`);
  }

  // Document heading (#701): every one of the 68 courses shared the static
  // "Course Shelf" tab title — bookmarks, history and tab switching couldn't
  // tell them apart. Falls back to a generic title before the outline loads
  // (or when it never does), same pattern as the lesson player (#623).
  const pageTitle = computed(() => data.value?.course.title ?? t('pages.courseDetail.title'));

  useHead(() => ({ title: pageTitle.value }));
</script>

<template>
  <!-- Delegate to child page (e.g. lesson player) when a nested route is active -->
  <NuxtPage v-if="hasChildRoute" />

  <div v-else class="page-course-detail">
    <!-- ── Back to browse (tuxedo 217) ───────────────────────────────────────── -->
    <AppButton
      variant="ghost"
      size="sm"
      icon-leading="arrow-left"
      :label="t('pages.courseDetail.backToBrowse')"
      to="/browse"
      class="page-course-detail__back"
    />

    <!-- ── Error / no-access state ───────────────────────────────────────────── -->
    <div v-if="status === 'error'" class="page-course-detail__error-wrap">
      <AppNoPermission
        v-if="isLocked"
        :title="t('pages.courseDetail.noAccess')"
        :body="t('pages.courseDetail.noAccessBody')"
      />
      <AppErrorState
        v-else
        :title="t('pages.courseDetail.loadErrorTitle')"
        :body="loadingErrorBody"
      >
        <template #action>
          <AppButton
            variant="secondary"
            size="md"
            :label="t('pages.courseDetail.retry')"
            @click="refetch()"
          />
        </template>
      </AppErrorState>
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
        :duration-label="durationLabel"
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
        :mutating="mutating"
        class="page-course-detail__actions"
        @mark-complete="onMarkComplete"
        @reset-progress="pendingCourseAction = 'reset'"
      />

      <!-- Export as Markdown ZIP (E28-F01-S01) — any user with access, not admin-gated -->
      <AppButton
        variant="ghost"
        size="sm"
        icon-leading="download"
        :label="t('pages.courseDetail.exportCta')"
        :loading="isExporting"
        class="page-course-detail__export-cta"
        @click="onExportCourse"
      />

      <!-- Admin-only entry point to the metadata editor -->
      <div v-if="isAdmin" class="page-course-detail__admin-actions">
        <AppButton
          variant="ghost"
          size="sm"
          icon-leading="edit"
          :label="t('pages.courseDetail.editCta')"
          :to="`/courses/${courseId}/edit`"
          class="page-course-detail__edit-cta"
        />
        <AppButton
          variant="ghost"
          size="sm"
          icon-leading="refresh"
          :label="t('pages.courseDetail.rescanCta')"
          :loading="isRescanning"
          class="page-course-detail__rescan-cta"
          @click="pendingCourseAction = 'rescan'"
        />
        <AppButton
          variant="ghost"
          size="sm"
          icon-leading="subtitles"
          :label="t('pages.courseDetail.transcribeCta')"
          :loading="isTranscribing"
          class="page-course-detail__transcribe-cta"
          @click="pendingCourseAction = 'transcribe'"
        />
      </div>

      <!-- Rescan / transcribe / reset confirm dialog (#606, #624) -->
      <AppDialog
        v-if="courseActionDialog"
        :open="pendingCourseAction !== null"
        size="sm"
        :title="courseActionDialog.title"
        :description="courseActionDialog.description"
        @update:open="pendingCourseAction = null"
      >
        <template #footer>
          <AppButton
            :label="t('pages.courseDetail.adminActionDialogCancel')"
            variant="ghost"
            size="md"
            @click="pendingCourseAction = null"
          />
          <AppButton
            :label="courseActionDialog.confirmLabel"
            variant="destructive"
            size="md"
            @click="confirmCourseAction"
          />
        </template>
      </AppDialog>

      <!-- Two-column layout: sections + rail -->
      <div class="page-course-detail__layout">
        <!-- Main: full description + completed banner + section list -->
        <div class="page-course-detail__main">
          <CourseDescription
            v-if="courseDescriptionBody"
            :heading="t('pages.courseDetail.descriptionHeading')"
            :description="courseDescriptionBody"
            class="page-course-detail__description"
          />
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
            :download-aria-label="t('pages.courseDetail.materialDownloadAria')"
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
    padding: 0 var(--space-6) var(--space-8);
    display: flex;
    flex-direction: column;
    gap: var(--space-6);

    &__back {
      align-self: flex-start;
    }

    &__error-wrap {
      display: flex;
      justify-content: center;
      padding: var(--space-8) 0;
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

    &__description {
      // First item in the main column — the full text the hero only leads into
    }

    &__admin-actions {
      display: flex;
      gap: var(--space-2);
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
