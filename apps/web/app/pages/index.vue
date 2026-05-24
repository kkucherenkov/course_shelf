<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { CourseWideCard, CoursePosterCard } from '@app/ui';
  import type { Course } from '@app/ui';
  import type {
    ContinueWatchingItem,
    RecentlyAddedItem,
    RecentlyCompletedItem,
  } from '@app/api-client-ts';

  import HomeGreeting from '~/components/home/HomeGreeting.vue';
  import HomeRow from '~/components/home/HomeRow.vue';
  import HomeYourWeek from '~/components/home/HomeYourWeek.vue';

  import {
    useContinueWatching,
    useRecentlyAdded,
    useRecentlyCompleted,
    useYourWeek,
  } from '~/composables/useHome';

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
      completed: 0,
      accent: accentFromId(item.courseId),
    };
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

  const completedCountLabel = computed(() => {
    const n = recentlyCompleted.data.value?.items.length ?? 0;
    return t('pages.home.recentlyCompleted.count', n, { named: { n } });
  });
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

    <!-- ── Two-column layout at lg+ ──────────────────────────────────────── -->
    <div class="page-home__layout">
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
          :empty-body="t('pages.home.recentlyAdded.emptyBody')"
          :error-title="t('pages.home.recentlyAdded.error')"
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
    padding: 0 var(--space-6) var(--space-10);
    max-width: $page-max-w;
    margin: 0 auto;

    &__greeting {
      margin-bottom: var(--space-6);
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
