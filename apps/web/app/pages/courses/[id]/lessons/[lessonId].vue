<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
  import { AppPlayerChrome, AppSkeleton, AppNoPermission } from '@app/ui';
  import { getLesson, listLessonBookmarks } from '@app/api-client-ts';
  import type { LessonDto, BookmarkDto, LessonOutlineItem, MaterialDto } from '@app/api-client-ts';

  import { useCourseOutline } from '~/composables/useCourseOutline';
  import { PLAYBACK_SPEEDS, useLessonPlayer } from '~/composables/useLessonPlayer';
  import { useMaterialDownload } from '~/composables/useMaterialDownload';
  import { useProgressReporter } from '~/composables/useProgressReporter';
  import { useStreamUrl } from '~/composables/useStreamUrl';
  import { useTranscriptCues } from '~/composables/useTranscriptCues';
  import { usePreferencesStore } from '~/stores/preferences';
  import { parseStartTime } from '~/utils/start-time';
  import { buildSubtitleTracks } from '~/utils/subtitle-url';

  import PlayerSidebar from '~/components/lesson-player/PlayerSidebar.vue';
  import PlayerTranscriptTab from '~/components/lesson-player/PlayerTranscriptTab.vue';

  definePageMeta({ layout: 'default' });

  const { t, locale } = useI18n();
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

  // ── Subtitle tracks ──────────────────────────────────────────────────────────

  // The subtitle route takes the same signed token as the video, so every
  // `<track>` src is derived from the resolved stream URL. Unbuildable entries
  // are dropped and at most one track is marked `default` — see the helper.
  const subtitleTracks = computed(() =>
    buildSubtitleTracks(streamUrl.value, lessonData.value?.subtitles, locale.value),
  );

  const preferencesStore = usePreferencesStore();

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
    attachChromeRoot,
  } = useLessonPlayer({ initialSpeed: preferencesStore.defaultSpeed });

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
  // A local shape rather than `InstanceType<typeof AppPlayerChrome>` — the
  // latter type-checks fine under `nuxt typecheck` (Volar resolves the
  // cross-package `defineExpose` macro) but ESLint's type-aware linting
  // doesn't share that resolution and flags every member access as unsafe.
  interface PlayerChromeHandle {
    getRootEl: () => HTMLElement | null;
  }
  const chromeRef = ref<PlayerChromeHandle | null>(null);
  let hasSetStartTime = false;

  // ── Transcript ────────────────────────────────────────────────────────────────

  const { cues: transcriptCues, activeIndex: transcriptActiveIndex } = useTranscriptCues({
    videoRef,
    position,
    preferredLanguage: locale,
  });

  // `?t=` deep link — a link to a moment must land on that moment, so it beats
  // both the stored resume position and the "Resume where I left off"
  // preference. Junk (`?t=abc`, `?t=-1`) parses to null and changes nothing.
  const deepLinkStart = computed(() => parseStartTime(route.query.t));

  function onVideoLoadedMetadata(): void {
    const el = videoRef.value;
    if (!el || hasSetStartTime) return;

    if (deepLinkStart.value !== null) {
      el.currentTime = deepLinkStart.value;
      hasSetStartTime = true;
      return;
    }

    // Skip resume seek when the user has turned off "Resume where I left off".
    if (!preferencesStore.resumeWhereLeftOff) return;
    const lastSeen = lessonData.value?.progress.lastSeenAtSeconds ?? 0;
    if (lastSeen > 0) {
      el.currentTime = lastSeen;
      hasSetStartTime = true;
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

  // The chrome only mounts once loading finishes (see template `v-else`), so
  // `chromeRef` starts null — mirror the videoRef pattern above rather than
  // attaching once in `onMounted`.
  watch(chromeRef, (instance) => {
    const rootEl = instance?.getRootEl() ?? null;
    if (rootEl) attachChromeRoot(rootEl);
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

  // Course-boundary flags for the chrome's prev/next controls.
  const hasNext = computed<boolean>(() => nextLesson.value !== null);
  const hasPrev = computed<boolean>(() => allLessons.value.findIndex((l) => l.id === lessonId) > 0);

  // Localized screen-reader labels for the player chrome controls.
  // `bookmarkAt` keeps its `{time}` placeholder for the chrome to interpolate.
  const chromeAria = computed(() => ({
    player: t('pages.lessonPlayer.aria.player'),
    buffering: t('pages.lessonPlayer.aria.buffering'),
    pip: t('pages.lessonPlayer.aria.pip'),
    shortcuts: t('pages.lessonPlayer.aria.shortcuts'),
    seek: t('pages.lessonPlayer.aria.seek'),
    bookmarkAt: t('pages.lessonPlayer.aria.bookmarkAt', { time: '{time}' }),
    pause: t('pages.lessonPlayer.aria.pause'),
    play: t('pages.lessonPlayer.aria.play'),
    prevLesson: t('pages.lessonPlayer.aria.prevLesson'),
    nextLesson: t('pages.lessonPlayer.aria.nextLesson'),
    skipBack: t('pages.lessonPlayer.aria.skipBack'),
    skipForward: t('pages.lessonPlayer.aria.skipForward'),
    mute: t('pages.lessonPlayer.aria.mute'),
    unmute: t('pages.lessonPlayer.aria.unmute'),
    speed: t('pages.lessonPlayer.aria.speed'),
    subtitlesEnable: t('pages.lessonPlayer.aria.subtitlesEnable'),
    subtitlesDisable: t('pages.lessonPlayer.aria.subtitlesDisable'),
    subtitlesUnavailable: t('pages.lessonPlayer.aria.subtitlesUnavailable'),
    fullscreenEnter: t('pages.lessonPlayer.aria.fullscreenEnter'),
    fullscreenExit: t('pages.lessonPlayer.aria.fullscreenExit'),
  }));

  // Real availability — dropped/unbuildable subtitle entries never reach the
  // `<track>` list, so an empty result here means the CC button has nothing
  // to toggle.
  const subtitlesAvailable = computed(() => subtitleTracks.value.length > 0);

  const lessonShortcuts = computed(() => [
    t('pages.lessonPlayer.shortcuts.playPause'),
    t('pages.lessonPlayer.shortcuts.seekSmall'),
    t('pages.lessonPlayer.shortcuts.seekLarge'),
    t('pages.lessonPlayer.shortcuts.frameStep'),
    t('pages.lessonPlayer.shortcuts.fullscreen'),
    t('pages.lessonPlayer.shortcuts.mute'),
    t('pages.lessonPlayer.shortcuts.jumpPercent'),
  ]);

  const endNext = computed<{ title: string; countdownSec?: number } | undefined>(() => {
    if (!nextLesson.value) return;
    return {
      title: nextLesson.value.title,
      // No countdown line when autoplay is off — nothing is actually ticking.
      countdownSec: preferencesStore.autoplayNext ? countdown.value : undefined,
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
    if (isEnded && nextLesson.value && preferencesStore.autoplayNext) {
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
    return section
      ? t('pages.lessonPlayer.sectionLabel', {
          n: String(section.position).padStart(2, '0'),
          title: section.title,
        })
      : '';
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

  // ── Document heading (#623) ──────────────────────────────────────────────────
  // This route has no natural static title (app.vue's route→key map explicitly
  // skips it — it's named from data, not a string) and rendered no heading at
  // all: the visible lesson name lives inside AppPlayerChrome's own chrome,
  // which isn't a heading element. Once the lesson has loaded, both the tab
  // title and the (visually hidden — the chrome already shows this name) `h1`
  // carry the actual lesson title rather than a generic placeholder, so a
  // screen reader announces which lesson this is and a bookmarked tab is
  // identifiable at a glance.
  const pageHeading = computed(() => lessonData.value?.title ?? t('pages.lessonPlayer.title'));

  useHead(() => ({ title: pageHeading.value }));
</script>

<template>
  <div class="page-lesson-player">
    <!-- Visually hidden: AppPlayerChrome already renders this name in its
         own visible chrome; this exists purely so the document has an
         outline heading a screen reader can land on (#623). -->
    <h1 class="page-lesson-player__sr-title">{{ pageHeading }}</h1>

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
            ref="chromeRef"
            :state="chromeState"
            :position="position"
            :duration="duration"
            :buffered="buffered"
            :speed="speed"
            :speeds="PLAYBACK_SPEEDS"
            :muted="muted"
            :subtitles-enabled="subtitlesOn"
            :subtitles-available="subtitlesAvailable"
            :fullscreen="fullscreen"
            :lesson-title="lessonData?.title ?? ''"
            :lesson-subtitle="lessonSubtitle"
            :bookmarks="bookmarkMarkers"
            :error-message="errorMessage"
            :end-next="endNext"
            :has-prev="hasPrev"
            :has-next="hasNext"
            :retry-label="t('pages.lessonPlayer.retry')"
            :locked-label="t('pages.lessonPlayer.noAccessBody')"
            :up-next-label="t('pages.lessonPlayer.upNextIn', { n: '{n}' })"
            :stay-label="t('pages.lessonPlayer.stayHere')"
            :play-next-label="t('pages.lessonPlayer.playNext')"
            :shortcuts-title="t('pages.lessonPlayer.shortcuts.title')"
            :shortcuts="lessonShortcuts"
            :aria-labels="chromeAria"
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
              >
                <track
                  v-for="track in subtitleTracks"
                  :key="track.id"
                  kind="subtitles"
                  :src="track.src"
                  :srclang="track.language"
                  :label="track.label"
                  :default="track.isDefault"
                />
              </video>
            </template>
          </AppPlayerChrome>

          <!-- No `v-if` on the cue count: the panel is content-sized up to a
               viewport cap, so an untranscribed lesson costs one line that says
               so. Hiding it left no empty state anywhere, because the sidebar
               tab that used to carry one is gone. -->
          <section class="page-lesson-player__transcript" aria-labelledby="lesson-transcript-title">
            <h2 id="lesson-transcript-title" class="page-lesson-player__transcript-title">
              {{ t('pages.lessonPlayer.tabTranscript') }}
            </h2>
            <PlayerTranscriptTab
              class="page-lesson-player__transcript-body"
              :cues="transcriptCues"
              :active-index="transcriptActiveIndex"
              :no-match-label="t('pages.lessonPlayer.transcript.noMatch')"
              :filter-placeholder="t('pages.lessonPlayer.transcript.filterPlaceholder')"
              @seek="onBookmarkSeek"
            />
          </section>
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
          :tabs-label="t('pages.lessonPlayer.sidebarTabsLabel')"
          :tab-sections="t('pages.lessonPlayer.tabSections')"
          :tab-notes="t('pages.lessonPlayer.tabNotes')"
          :tab-bookmarks="t('pages.lessonPlayer.tabBookmarks')"
          :tab-materials="t('pages.lessonPlayer.tabMaterials')"
          :bookmarks-empty-title="t('pages.lessonPlayer.bookmarksEmptyTitle')"
          :bookmarks-empty-body="t('pages.lessonPlayer.bookmarksEmptyBody')"
          :bookmarks-add-label="t('pages.lessonPlayer.bookmarkAdd')"
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
  $sidebar-mobile-min-h: 300px;

  .page-lesson-player {
    // `AppNavigationShell.__main-body` already stretches to fill the viewport
    // minus its own topbar and padding (grid row with `align-content: stretch`
    // inside a `min-height: 100vh` shell) — filling that already-sized parent
    // with a percentage height, instead of re-deriving the viewport math here,
    // is what keeps this in sync with the shell's actual chrome instead of
    // silently drifting by whatever the shell's padding/topbar happen to be
    // (see tuxedo 114: this used to double-count that padding and overflow
    // the viewport by 32px on every screen size).
    height: 100%;
    display: flex;
    flex-direction: column;

    &__sr-title {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
    }

    &__no-permission {
      display: flex;
      justify-content: center;
      padding: var(--space-8) 0;
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
      // Letterbox filler around AppPlayerChrome, which paints its own dark stage.
      // Theme-independent black stage — `--media-stage` (#000) is the media-surface
      // token for the video plane, so the letterbox stays black in light mode too.
      background: var(--media-stage);

      @media (width < 768px) {
        background: transparent;
      }
    }

    // The `<video>` box is sized by AppPlayerChrome's frame slot — it owns the
    // 16:9 stage every aspect ratio letterboxes into.

    &__transcript {
      // Bounded in viewport units, and that is the load-bearing part: this
      // panel first shipped with `flex: 1; min-height: 0` on the assumption
      // that `&__layout { height: 100% }` constrains the column. It does not —
      // no ancestor gives a definite height, so nothing constrained anything
      // and the page grew with the cue list. Measured on a 46-cue lesson: 3186px
      // at 1440x900 and 7424px at 390x844, with the sidebar stretched to 3098px
      // alongside, the video scrolled out of view by the sixth cue and the
      // lesson list five and a half screens down on a phone. A 38-minute lesson
      // has 698 cues.
      // ---
      // `dvh` rather than `vh`: mobile browser chrome resizes the viewport as
      // you scroll, and `vh` freezes at the larger value.
      // ---
      // `flex: 0 1 auto` rather than `flex: 1`: the panel grows with its content
      // up to the cap, so a lesson with no transcript shows one line of empty
      // state instead of a half-screen void. That is what lets the `v-if` go.
      flex: 0 1 auto;
      min-height: 0;
      max-height: 55dvh;
      display: flex;
      flex-direction: column;
      border-top: 1px solid var(--border-default);
      background: var(--surface-raised);
      overflow: hidden;

      @media (width < 768px) {
        // The earlier `overflow: visible` here was the worst of it — reasoning
        // that a nested scroller would trap the page gesture, it let every cue
        // render inline. Browsers chain the scroll back to the page at the
        // ends, so the worry was unfounded and the cure was the disease.
        max-height: 45dvh;
      }
    }

    &__transcript-title {
      padding: var(--space-3) var(--space-4) var(--space-2);
      margin: 0;
    }

    &__transcript-body {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
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
