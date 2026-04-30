<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
  import { AppPlayerChrome, AppSkeleton, AppNoPermission } from '@app/ui';
  import { getLesson, listLessonBookmarks } from '@app/api-client-ts';
  import type { LessonDto, BookmarkDto, LessonOutlineItem, MaterialDto } from '@app/api-client-ts';

  import { useCourseOutline } from '~/composables/useCourseOutline';
  import { useLessonPlayer } from '~/composables/useLessonPlayer';
  import { useMaterialDownload } from '~/composables/useMaterialDownload';
  import { useProgressReporter } from '~/composables/useProgressReporter';
  import { useStreamUrl } from '~/composables/useStreamUrl';
  import { usePreferencesStore } from '~/stores/preferences';

  import PlayerSidebar from '~/components/lesson-player/PlayerSidebar.vue';

  definePageMeta({ layout: 'default' });

  const { t } = useI18n();
  const route = useRoute();
  const toast = useToast();

  const courseId = route.params.id as string;
  const lessonId = route.params.lessonId as string;

  // ── Data fetching ────────────────────────────────────────────────────────────

  const lessonErrorStatus = ref<number | null>(null);

  const { data: lessonData, status: lessonStatus } = useAsyncData<LessonDto>(
    `lesson:${lessonId}`,
    async () => {
      const res = await getLesson({ path: { id: lessonId } });
      if (res.error) {
        lessonErrorStatus.value = res.response.status;
        throw new Error(`HTTP ${String(res.response.status)}`);
      }
      return res.data as LessonDto;
    },
  );

  // Share the outline with the course detail page via the composable —
  // both pages hit the same `useAsyncData` key, and the composable
  // memoises its handler at module scope so Nuxt doesn't warn about
  // handler-identity drift between the two call sites.
  const { data: outlineData, status: outlineStatus } = useCourseOutline(courseId);

  const bookmarks = ref<BookmarkDto[]>([]);

  async function loadBookmarks(): Promise<void> {
    try {
      const res = await listLessonBookmarks({ path: { lessonId } });
      if (!res.error) {
        bookmarks.value = (res.data as { items: BookmarkDto[] }).items;
      }
    } catch {
      // best-effort
    }
  }

  // ── Stream URL ───────────────────────────────────────────────────────────────

  const {
    url: streamUrl,
    status: streamStatus,
    errorStatus: streamErrorStatus,
    fetch: fetchStream,
  } = useStreamUrl();

  // ── Player state ─────────────────────────────────────────────────────────────

  const {
    position,
    duration,
    buffered,
    playing,
    muted,
    speed,
    fullscreen,
    subtitlesOn,
    ended,
    playerState,
    onPlay,
    onPause,
    onSeek,
    onSpeed,
    onToggleMute,
    onToggleSubtitles,
    onTogglePip,
    onToggleFullscreen,
    attach,
    detach,
  } = useLessonPlayer();

  // ── Progress reporter ────────────────────────────────────────────────────────

  const lessonIdRef = computed(() => lessonId);
  const { flush } = useProgressReporter({
    lessonId: lessonIdRef,
    position,
    duration,
    playing,
  });

  // ── Video element ref ────────────────────────────────────────────────────────

  const videoRef = ref<HTMLVideoElement | null>(null);
  let hasSetResumeTime = false;

  const preferencesStore = usePreferencesStore();

  function onVideoLoadedMetadata(): void {
    if (!videoRef.value) return;
    // Skip resume seek when the user has turned off "Resume where I left off".
    if (!preferencesStore.resumeWhereLeftOff) return;
    const lastSeen = lessonData.value?.progress.lastSeenAtSeconds ?? 0;
    if (!hasSetResumeTime && lastSeen > 0) {
      videoRef.value.currentTime = lastSeen;
      hasSetResumeTime = true;
    }
  }

  onMounted(async () => {
    await Promise.all([loadBookmarks(), fetchStream(lessonId)]);
    if (videoRef.value) {
      attach(videoRef.value);
    }
  });

  onUnmounted(() => {
    void flush();
    detach();
  });

  // Attach after video el is rendered (reactive ref)
  watch(videoRef, (el) => {
    if (el) attach(el);
    else detach();
  });

  // ── Auto-advance ─────────────────────────────────────────────────────────────

  const countdown = ref(5);
  let countdownHandle: ReturnType<typeof setInterval> | null = null;

  const allLessons = computed<LessonOutlineItem[]>(
    () => outlineData.value?.sections.flatMap((s) => s.lessons) ?? [],
  );

  const nextLesson = computed<LessonOutlineItem | null>(() => {
    const flat = allLessons.value;
    const idx = flat.findIndex((l) => l.id === lessonId);
    if (idx === -1 || idx >= flat.length - 1) return null;
    return flat[idx + 1] ?? null;
  });

  const endNext = computed<{ title: string; countdownSec: number } | undefined>(() => {
    if (!nextLesson.value) return;
    return {
      title: nextLesson.value.title,
      countdownSec: countdown.value,
    };
  });

  function startCountdown(): void {
    if (countdownHandle !== null) return;
    countdown.value = 5;
    countdownHandle = setInterval(() => {
      countdown.value -= 1;
      if (countdown.value <= 0) {
        clearCountdown();
        void navigateToNextLesson();
      }
    }, 1000);
  }

  function clearCountdown(): void {
    if (countdownHandle !== null) {
      clearInterval(countdownHandle);
      countdownHandle = null;
    }
  }

  async function navigateToNextLesson(): Promise<void> {
    if (!nextLesson.value) return;
    await navigateTo(`/courses/${courseId}/lessons/${nextLesson.value.id}`);
  }

  watch(ended, (isEnded) => {
    if (isEnded && nextLesson.value) {
      startCountdown();
    }
  });

  function onStayHere(): void {
    clearCountdown();
  }

  function onNextLesson(): void {
    clearCountdown();
    void navigateToNextLesson();
  }

  function onPrevLesson(): void {
    const flat = allLessons.value;
    const idx = flat.findIndex((l) => l.id === lessonId);
    if (idx > 0) {
      const prev = flat[idx - 1];
      if (prev) void navigateTo(`/courses/${courseId}/lessons/${prev.id}`);
    }
  }

  onUnmounted(() => {
    clearCountdown();
  });

  // ── Bookmark seek ─────────────────────────────────────────────────────────────

  function onBookmarkSeek(time: number): void {
    onSeek(time);
  }

  const { download: downloadMaterial } = useMaterialDownload();

  async function onDownloadAttempt(material: MaterialDto): Promise<void> {
    const err = await downloadMaterial({
      lessonId,
      materialId: material.id,
      filename: material.label,
    });
    if (err) {
      toast.add({ title: t('pages.lessonPlayer.toastDownloadError'), color: 'error' });
    }
  }

  // ── Derived states ────────────────────────────────────────────────────────────

  const isLoading = computed(
    () =>
      lessonStatus.value === 'pending' ||
      lessonStatus.value === 'idle' ||
      outlineStatus.value === 'pending' ||
      outlineStatus.value === 'idle' ||
      streamStatus.value === 'pending' ||
      streamStatus.value === 'idle',
  );

  const isNoPermission = computed(
    () => lessonErrorStatus.value === 403 || streamErrorStatus.value === 403,
  );

  const errorMessage = computed(() => {
    if (streamStatus.value === 'error') return t('pages.lessonPlayer.streamError');
    return t('pages.lessonPlayer.loadingError');
  });

  // Bookmark markers for the chrome scrubber
  const bookmarkMarkers = computed(() =>
    bookmarks.value.map((b) => ({ time: b.positionSeconds, label: b.label })),
  );

  // Lesson section title for chrome subtitle
  const lessonSubtitle = computed(() => {
    const outline = outlineData.value;
    const lesson = lessonData.value;
    if (!outline || !lesson) return '';
    const section = outline.sections.find((s) => s.id === lesson.sectionId);
    return section ? `Section ${String(section.position).padStart(2, '0')} · ${section.title}` : '';
  });

  // Computed chrome state.
  // `ended` takes priority: when the video fires both ended+error (e.g. data URI stubs),
  // we want the end banner to show rather than the error overlay.
  // Stream-level errors (from useStreamUrl) map to chrome 'error'; video-element-level
  // errors alone do not override the end state.
  const chromeState = computed(() => {
    if (ended.value) return 'end' as const;
    if (streamStatus.value === 'error') return 'error' as const;
    return playerState.value;
  });

  function onRetry(): void {
    void fetchStream(lessonId);
  }
</script>

<template>
  <div class="page-lesson-player">
    <!-- No permission -->
    <div v-if="isNoPermission" class="page-lesson-player__no-permission">
      <AppNoPermission
        :title="t('pages.lessonPlayer.noAccess')"
        :body="t('pages.lessonPlayer.noAccessBody')"
      />
    </div>

    <!-- Loading skeleton -->
    <template v-else-if="isLoading">
      <div class="page-lesson-player__skeleton">
        <div class="page-lesson-player__skeleton-player">
          <AppSkeleton width="100%" height="100%" radius="md" />
        </div>
        <div class="page-lesson-player__skeleton-sidebar">
          <AppSkeleton width="100%" height="40px" />
          <AppSkeleton width="100%" height="calc(100% - 52px)" />
        </div>
      </div>
    </template>

    <!-- Main layout -->
    <template v-else>
      <div class="page-lesson-player__layout">
        <!-- Player column -->
        <div class="page-lesson-player__player-col">
          <AppPlayerChrome
            :state="chromeState"
            :position="position"
            :duration="duration"
            :buffered="buffered"
            :speed="speed"
            :muted="muted"
            :subtitles-enabled="subtitlesOn"
            :fullscreen="fullscreen"
            :lesson-title="lessonData?.title ?? ''"
            :lesson-subtitle="lessonSubtitle"
            :bookmarks="bookmarkMarkers"
            :error-message="errorMessage"
            :end-next="endNext"
            @play="onPlay"
            @pause="onPause"
            @seek="onSeek"
            @speed="onSpeed"
            @toggle-mute="onToggleMute"
            @toggle-subtitles="onToggleSubtitles"
            @toggle-pip="onTogglePip"
            @toggle-fullscreen="onToggleFullscreen"
            @next-lesson="onNextLesson"
            @prev-lesson="onPrevLesson"
            @retry="onRetry"
            @stay-here="onStayHere"
          >
            <template #frame>
              <video
                ref="videoRef"
                class="page-lesson-player__video"
                :src="streamUrl ?? undefined"
                preload="metadata"
                playsinline
                @loadedmetadata="onVideoLoadedMetadata"
              />
            </template>
          </AppPlayerChrome>
        </div>

        <!-- Sidebar column -->
        <PlayerSidebar
          v-if="lessonData && outlineData"
          class="page-lesson-player__sidebar"
          :sections="outlineData.sections"
          :course-id="courseId"
          :current-lesson-id="lessonId"
          :bookmarks="bookmarks"
          :materials="lessonData.materials"
          :current-time="position"
          :tab-sections="t('pages.lessonPlayer.tabSections')"
          :tab-notes="t('pages.lessonPlayer.tabNotes')"
          :tab-bookmarks="t('pages.lessonPlayer.tabBookmarks')"
          :tab-materials="t('pages.lessonPlayer.tabMaterials')"
          :bookmarks-empty-title="t('pages.lessonPlayer.bookmarksEmptyTitle')"
          :bookmarks-empty-body="t('pages.lessonPlayer.bookmarksEmptyBody')"
          :materials-empty-label="t('pages.lessonPlayer.materialsEmpty')"
          @seek="onBookmarkSeek"
          @update:bookmarks="(b) => (bookmarks = b)"
          @download-attempt="onDownloadAttempt"
        />
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
  $sidebar-w-xl: 360px;
  $sidebar-w-lg: 280px;
  // Topbar height matches the default layout header — named var, exempt from raw-px rule.
  $topbar-h: 56px;
  $sidebar-mobile-min-h: 300px;

  .page-lesson-player {
    height: calc(100vh - #{$topbar-h});
    display: flex;
    flex-direction: column;

    &__no-permission {
      display: flex;
      justify-content: center;
      padding: var(--space-12) 0;
    }

    // ── Skeleton ────────────────────────────────────────────────────────────
    &__skeleton {
      display: grid;
      grid-template-columns: 1fr $sidebar-w-xl;
      gap: 0;
      height: 100%;

      @media (width <= 1024px) {
        grid-template-columns: 1fr $sidebar-w-lg;
      }

      @media (width < 768px) {
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr;
      }
    }

    &__skeleton-player {
      aspect-ratio: 16 / 9;
      padding: var(--space-4);
    }

    &__skeleton-sidebar {
      border-left: 1px solid var(--border-default);
      padding: var(--space-3);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    // ── Main layout ──────────────────────────────────────────────────────────
    &__layout {
      display: grid;
      grid-template-columns: 1fr $sidebar-w-xl;
      height: 100%;
      overflow: hidden;

      @media (width <= 1024px) {
        grid-template-columns: 1fr $sidebar-w-lg;
      }

      @media (width < 768px) {
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr;
        overflow: visible;
        height: auto;
      }
    }

    &__player-col {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      overflow: hidden;
      // Video canvas is inherently dark; AppPlayerChrome sets its own background
      background: var(--surface-video);

      @media (width < 768px) {
        background: transparent;
      }
    }

    &__video {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: contain;
    }

    &__sidebar {
      @media (width < 768px) {
        border-left: none;
        border-top: 1px solid var(--border-default);
        min-height: $sidebar-mobile-min-h;
      }
    }
  }
</style>
