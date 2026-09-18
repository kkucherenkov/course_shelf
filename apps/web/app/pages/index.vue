<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { AppNoPermission, CourseWideCard, CoursePosterCard } from '@app/ui';
  import type { Course } from '@app/ui';
  import type {
    ContinueWatchingItem,
    RecentlyAddedItem,
    RecentlyCompletedItem,
  } from '@app/api-client-ts';

  import HomeGreeting from '~/components/home/HomeGreeting.vue';
  import HomeRow from '~/components/home/HomeRow.vue';
  import HomeYourWeek from '~/components/home/HomeYourWeek.vue';
  import { formatCueTime } from '~/utils/format-time';

  import {
    useContinueWatching,
    useRecentlyAdded,
    useRecentlyCompleted,
    useYourWeek,
  } from '~/composables/useHome';
  import { useCourseCatalogAccess } from '~/composables/useCoursesList';
  import { useLibraries } from '~/composables/useLibraries';

  import { useAuthStore } from '~/stores/auth';
  import { accentFromId } from '~/utils/course-accent';

  definePageMeta({ layout: 'default' });

  const { t, locale } = useI18n();
  const authStore = useAuthStore();

  // ── Auth user info ──────────────────────────────────────────────────────────

  const userName = computed(
    () => authStore.user?.displayName ?? authStore.user?.name ?? t('pages.home.roleUser'),
  );
  const userRole = computed(() => authStore.user?.role ?? 'USER');

  const roleLabel = computed(() => {
    if (userRole.value === 'ADMIN') return t('pages.home.roleAdmin');
    if (userRole.value === 'GUEST') return t('pages.home.roleGuest');
    return t('pages.home.roleUser');
  });

  function resolveAvatarRole(role: string): 'admin' | 'guest' | undefined {
    if (role === 'ADMIN') return 'admin';
    if (role === 'GUEST') return 'guest';
    return undefined;
  }

  const avatarRole = computed<'admin' | 'guest' | undefined>(() =>
    resolveAvatarRole(userRole.value),
  );

  // ── Data rows ───────────────────────────────────────────────────────────────

  const continueWatching = useContinueWatching();
  const recentlyAdded = useRecentlyAdded();
  const recentlyCompleted = useRecentlyCompleted();
  const yourWeek = useYourWeek();

  // ── Catalog access (#623) ────────────────────────────────────────────────────
  //
  // Same signal `browse.vue` uses to tell "nothing was ever granted to this
  // account" apart from "granted, but genuinely nothing to see" — reused here
  // so a user with zero grants reads the same honest answer on both screens,
  // instead of "start a course"/"finish a course" advice they have no course
  // to act on. Two unfiltered probes, OR'd together — see
  // `useCourseCatalogAccess`'s doc comment for why `useLibraries` alone
  // misses a course-level grant (tuxedo 249).
  const { data: librariesData, status: librariesStatus } = useLibraries();
  const { hasAnyCourse: hasAnyCatalogCourse, status: catalogAccessStatus } =
    useCourseCatalogAccess();

  const hasCatalogAccess = computed(() => {
    if (userRole.value === 'ADMIN') return true;
    // Default to the safe, always-true state while neither probe has
    // resolved yet, rather than briefly asserting "no access".
    if (librariesStatus.value === 'pending' || librariesStatus.value === 'idle') return true;
    if (catalogAccessStatus.value === 'pending' || catalogAccessStatus.value === 'idle')
      return true;
    return (librariesData.value?.items.length ?? 0) > 0 || hasAnyCatalogCourse.value;
  });

  // ── Recently completed — collapsible state ─────────────────────────────────

  const completedExpanded = ref(false);

  // ── Course data mapping helpers ─────────────────────────────────────────────

  function continueWatchingToCourse(item: ContinueWatchingItem): Course {
    return {
      id: item.courseId,
      title: item.courseTitle,
      instructor: '',
      lessons: item.lessonsTotal,
      completed: item.lessonsCompleted,
      accent: accentFromId(item.courseId),
    };
  }

  function recentlyAddedToCourse(item: RecentlyAddedItem): Course {
    return {
      id: item.courseId,
      title: item.courseTitle,
      instructor: '',
      lessons: item.lessonCount,
      completed: item.lessonsCompleted,
      accent: accentFromId(item.courseId),
    };
  }

  // tuxedo 200: resumeLabel formats a real player position (mm:ss / h:mm:ss)
  // instead of CourseWideCard's percentage fallback. Undefined when the
  // course has no recorded position — the card falls back to `${pct}%`.
  function continueWatchingResumeLabel(item: ContinueWatchingItem): string | undefined {
    if (item.resumePositionSeconds === undefined) return undefined;
    return t('pages.home.continueWatching.resumeLabel', {
      time: formatCueTime(item.resumePositionSeconds),
    });
  }

  function recentlyCompletedToCourse(item: RecentlyCompletedItem): Course {
    return {
      id: item.courseId,
      title: item.courseTitle,
      instructor: '',
      lessons: item.lessonsTotal,
      completed: item.lessonsTotal,
      accent: accentFromId(item.courseId),
    };
  }

  // ── Your week labels ────────────────────────────────────────────────────────

  function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString(locale.value, { month: 'short', day: 'numeric' });
  }

  const yourWeekMinutesLabel = computed(() => {
    const n = yourWeek.data.value?.minutesWatched ?? 0;
    return t('pages.home.yourWeek.minutesWatched', { n });
  });

  const yourWeekLessonsLabel = computed(() => {
    const n = yourWeek.data.value?.lessonsCompleted ?? 0;
    return t('pages.home.yourWeek.lessonsCompleted', n, { named: { n } });
  });

  const yourWeekRangeLabel = computed(() => {
    const range = yourWeek.data.value?.range;
    if (!range) return '';
    return t('pages.home.yourWeek.range', {
      from: fmtDate(range.from),
      to: fmtDate(range.to),
    });
  });

  // ── Recently completed meta label ───────────────────────────────────────────
  //
  // Guarded by fetch status so the collapsed row's meta span (rendered
  // outside HomeRow's loading gate) doesn't flash "0 courses" while the
  // request is still in flight.
  const completedCountLabel = computed(() => {
    if (recentlyCompleted.status.value !== 'success') return '';
    const n = recentlyCompleted.data.value?.items.length ?? 0;
    return t('pages.home.recentlyCompleted.count', n, { named: { n } });
  });

  // Member vs. admin split for a *genuinely* empty library — reachable only
  // when `hasCatalogAccess` is true, since the whole three-row block is
  // gated on it below (#666: the no-access explanation now renders once,
  // not once per row).
  const recentlyAddedEmptyBody = computed(() =>
    userRole.value === 'ADMIN'
      ? t('pages.home.recentlyAdded.emptyBody')
      : t('pages.home.recentlyAdded.emptyBodyMember'),
  );

  // ── Rate-limited error bodies (#701) ────────────────────────────────────────
  //
  // Each row's generic errorBody says "check your connection and try again" —
  // wrong advice for a 429, where the connection is fine and retrying only
  // extends the block. `RateLimitBanner`'s countdown treatment is /sign-in
  // only; these read-only rows just need the advice to stop being wrong.
  const continueWatchingErrorBody = computed(() =>
    continueWatching.errorStatus.value === 429
      ? t('ui.errors.rateLimitedBody')
      : t('pages.home.continueWatching.errorBody'),
  );
  const recentlyAddedErrorBody = computed(() =>
    recentlyAdded.errorStatus.value === 429
      ? t('ui.errors.rateLimitedBody')
      : t('pages.home.recentlyAdded.errorBody'),
  );
  const recentlyCompletedErrorBody = computed(() =>
    recentlyCompleted.errorStatus.value === 429
      ? t('ui.errors.rateLimitedBody')
      : t('pages.home.recentlyCompleted.errorBody'),
  );
  const yourWeekErrorBody = computed(() =>
    yourWeek.errorStatus.value === 429
      ? t('ui.errors.rateLimitedBody')
      : t('pages.home.yourWeek.errorBody'),
  );
</script>

<template>
  <div class="page-home">
    <!-- ── Greeting ────────────────────────────────────────────────────────── -->
    <HomeGreeting
      :name="userName"
      :role-label="roleLabel"
      :avatar-role="avatarRole"
      :greeting="t('pages.home.greeting')"
      class="page-home__greeting"
    />

    <!--
      ── No library access: one explanation, not one per row (#666) ──────
      No #action slot on purpose: the honest next step here is "ask an
      administrator" (already said in the body), not a button. A "check
      again" retry would just replay the same denial — nothing on this
      screen made the grant stale, so refetching resolves nothing. A real
      next action (request access, contact an admin) needs a contract
      change (an endpoint that exposes admin contact, or a request-access
      flow) — out of scope for this fix, tracked separately.
    -->
    <AppNoPermission
      v-if="!hasCatalogAccess"
      :title="t('pages.browse.emptyNoAccessTitle')"
      :body="t('pages.browse.emptyNoAccessBody')"
      class="page-home__no-access"
    />

    <!-- ── Two-column layout at lg+ ──────────────────────────────────────── -->
    <div v-else class="page-home__layout">
      <!-- ── Main content ──────────────────────────────────────────────────── -->
      <div class="page-home__main">
        <!-- Continue watching -->
        <HomeRow
          :heading="t('pages.home.continueWatching.heading')"
          :status="continueWatching.status.value"
          :empty="(continueWatching.data.value?.items.length ?? 0) === 0"
          :empty-title="t('pages.home.continueWatching.empty')"
          :empty-body="t('pages.home.continueWatching.emptyBody')"
          :error-title="t('pages.home.continueWatching.error')"
          :error-body="continueWatchingErrorBody"
          :retry-label="t('pages.home.continueWatching.retry')"
          :skeleton-count="5"
          class="page-home__row page-home__row--continue"
          @retry="continueWatching.refetch()"
        >
          <NuxtLink
            v-for="item in continueWatching.data.value?.items"
            :key="item.courseId"
            :to="`/courses/${item.courseId}/lessons/${item.lastSeenLessonId}`"
            class="page-home__card-link"
          >
            <CourseWideCard
              :course="continueWatchingToCourse(item)"
              :resume-label="continueWatchingResumeLabel(item)"
              :interactive="false"
              class="page-home__wide-card"
            />
          </NuxtLink>
        </HomeRow>

        <!-- Recently added -->
        <HomeRow
          :heading="t('pages.home.recentlyAdded.heading')"
          :status="recentlyAdded.status.value"
          :empty="(recentlyAdded.data.value?.items.length ?? 0) === 0"
          :empty-title="t('pages.home.recentlyAdded.empty')"
          :empty-body="recentlyAddedEmptyBody"
          :error-title="t('pages.home.recentlyAdded.error')"
          :error-body="recentlyAddedErrorBody"
          :retry-label="t('pages.home.recentlyAdded.retry')"
          :skeleton-count="6"
          class="page-home__row page-home__row--recently-added"
          @retry="recentlyAdded.refetch()"
        >
          <NuxtLink
            v-for="item in recentlyAdded.data.value?.items"
            :key="item.courseId"
            :to="`/courses/${item.courseId}`"
            class="page-home__card-link"
          >
            <CoursePosterCard
              :course="recentlyAddedToCourse(item)"
              :interactive="false"
              class="page-home__poster-card"
            />
          </NuxtLink>
        </HomeRow>

        <!-- Recently completed (collapsible) -->
        <HomeRow
          :heading="t('pages.home.recentlyCompleted.heading')"
          :status="recentlyCompleted.status.value"
          :empty="(recentlyCompleted.data.value?.items.length ?? 0) === 0"
          :empty-title="t('pages.home.recentlyCompleted.empty')"
          :empty-body="t('pages.home.recentlyCompleted.emptyBody')"
          :error-title="t('pages.home.recentlyCompleted.error')"
          :error-body="recentlyCompletedErrorBody"
          :retry-label="t('pages.home.recentlyCompleted.retry')"
          :skeleton-count="4"
          collapsible
          :expanded="completedExpanded"
          :collapsible-meta="completedCountLabel"
          :show-all-label="t('pages.home.recentlyCompleted.showAll')"
          :collapse-label="t('pages.home.recentlyCompleted.collapse')"
          class="page-home__row page-home__row--completed"
          @retry="recentlyCompleted.refetch()"
          @update:expanded="completedExpanded = $event"
        >
          <NuxtLink
            v-for="item in recentlyCompleted.data.value?.items"
            :key="item.courseId"
            :to="`/courses/${item.courseId}`"
            class="page-home__card-link"
          >
            <CoursePosterCard
              :course="recentlyCompletedToCourse(item)"
              state="completed"
              :interactive="false"
              class="page-home__poster-card"
            />
          </NuxtLink>
        </HomeRow>
      </div>

      <!-- ── Right rail (lg+) ──────────────────────────────────────────────── -->
      <div class="page-home__rail">
        <HomeYourWeek
          :data="yourWeek.data.value"
          :status="yourWeek.status.value"
          :heading="t('pages.home.yourWeek.heading')"
          :minutes-label="yourWeekMinutesLabel"
          :lessons-label="yourWeekLessonsLabel"
          :range-label="yourWeekRangeLabel"
          :error-title="t('pages.home.yourWeek.error')"
          :error-body="yourWeekErrorBody"
          :retry-label="t('pages.home.yourWeek.retry')"
          @retry="yourWeek.refetch()"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
  // Card width SCSS variables — exempt from the raw-px lint rule (named vars).
  // Wide card: ~5 visible at 1440px with sidebar (240px) + rail (280px).
  $card-wide-xs: 200px;
  $card-wide-lg: 160px;
  $card-wide-xl: 180px;
  // Poster card: ~6 visible at 1440px.
  $card-poster-xs: 160px;
  $card-poster-lg: 130px;
  $card-poster-xl: 140px;
  // Rail width at lg+.
  $rail-width: 280px;
  // Topbar height matches AppNavigationShell.
  $topbar-h: 56px;
  // Max page width — matches common 1440 design viewport.
  $page-max-w: 1440px;

  .page-home {
    padding: 0 var(--space-6) var(--space-8);
    max-width: $page-max-w;
    margin: 0 auto;

    &__greeting {
      margin-bottom: var(--space-6);
    }

    &__no-access {
      margin-top: var(--space-4);
    }

    // ── Two-column layout ──────────────────────────────────────────────────
    &__layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-6);

      // >1024px: show right rail column (exclusive so 1024px stays at md/single-col layout)
      @media (width > 1024px) {
        grid-template-columns: 1fr $rail-width;
        align-items: start;
      }
    }

    &__main {
      display: flex;
      flex-direction: column;
      gap: var(--space-8);
      min-width: 0;
    }

    // ── Right rail ─────────────────────────────────────────────────────────
    &__rail {
      // ≤1024px: hidden — content flows full-width in main column.
      // >1024px: visible sticky column.
      // Using `> 1024px` (exclusive) so the 1024-wide viewport stays at md layout.
      display: none;

      @media (width > 1024px) {
        display: block;
        position: sticky;
        top: calc(#{$topbar-h} + var(--space-4));
      }
    }

    // ── Card sizing ────────────────────────────────────────────────────────

    // CourseWideCard: exactly 5 visible at 1440px wide viewport
    &__wide-card {
      width: $card-wide-xs;

      @media (width >= 1024px) {
        width: $card-wide-lg;
      }

      @media (width >= 1440px) {
        width: $card-wide-xl;
      }
    }

    // CoursePosterCard: exactly 6 visible at 1440px wide viewport
    &__poster-card {
      width: $card-poster-xs;

      @media (width >= 1024px) {
        width: $card-poster-lg;
      }

      @media (width >= 1440px) {
        width: $card-poster-xl;
      }
    }

    // Card wrappers — keep links transparent so the card's own focus / hover
    // styles still drive the visual feedback.
    &__card-link {
      display: block;
      text-decoration: none;
      color: inherit;

      &:focus {
        outline: none;
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 2px;
        border-radius: var(--radius-md);
      }
    }
  }
</style>
