<script setup lang="ts">
  import { computed } from 'vue';
  import {
    AppBanner,
    AppButton,
    AppChip,
    AppEmptyState,
    AppNoPermission,
    AppSelect,
    AppSkeleton,
    CoursePosterCard,
  } from '@app/ui';
  import type { Course } from '@app/ui';
  import type { CourseDto } from '@app/api-client-ts';

  import {
    useCoursesList,
    COURSE_LIST_DEFAULTS,
    type CourseListDurationBucket,
    type CourseListSort,
    type CourseListStatusFilter,
  } from '~/composables/useCoursesList';
  import { useInstructors } from '~/composables/useInstructors';
  import { useLibraries } from '~/composables/useLibraries';
  import { useQueryStringState } from '~/composables/useQueryStringState';
  import { useAuthStore } from '~/stores/auth';
  import { accentFromId } from '~/utils/course-accent';

  definePageMeta({ layout: 'default' });

  const { t } = useI18n();

  // Every filter lives in the query string, so a reload, a bookmark and a
  // shared link all reproduce the same shelf. Defaults stay out of the URL.
  const STATUS_VALUES = ['all', 'in-progress', 'completed', 'not-started'] as const;
  const SORT_VALUES = ['recently-watched', 'newest', 'alphabetical', 'duration'] as const;
  const DURATION_VALUES = ['all', 'lt5', '5to10', '10to20', 'gt20'] as const;

  const status = useQueryStringState<CourseListStatusFilter>(
    'status',
    COURSE_LIST_DEFAULTS.status,
    STATUS_VALUES,
  );
  const sort = useQueryStringState<CourseListSort>('sort', COURSE_LIST_DEFAULTS.sort, SORT_VALUES);
  const durationBucket = useQueryStringState<CourseListDurationBucket>(
    'duration',
    COURSE_LIST_DEFAULTS.durationBucket,
    DURATION_VALUES,
  );
  // Free-form cuids — no allow-list. An id that matches nothing yields an
  // empty shelf, which is the honest answer to a stale link.
  const libraryId = useQueryStringState<string>('library', COURSE_LIST_DEFAULTS.libraryId);
  const instructorId = useQueryStringState<string>('instructor', COURSE_LIST_DEFAULTS.instructorId);

  const {
    data,
    status: fetchStatus,
    refetch,
  } = useCoursesList({ status, sort, durationBucket, libraryId, instructorId });

  const items = computed(() => data.value?.items ?? []);

  // The count subtitle reflects loaded results, so only show it once data has
  // arrived — during `pending` `items` is empty and a raw count flashes "0".
  // Suppressed entirely once `hasLibraryAccess` is confirmed false (#701) —
  // "0 courses" reads as a fact about the library when it's actually a
  // permissions denial the body text below already states.
  const subtitle = computed<string>(() => {
    if (!hasLibraryAccess.value) return '';
    if (fetchStatus.value === 'pending') return t('pages.browse.subtitleLoading');
    if (fetchStatus.value === 'success')
      return t('pages.browse.subtitle', { n: items.value.length });
    return ''; // error / idle: the banner explains errors; the title carries the page
  });

  // Single-select status filter: each chip sets `status` to its value. The
  // active chip is marked `selected` (drives aria-pressed + the accent border)
  // and rendered with the 'primary' AppChip variant.
  const statusOptions = computed<{ value: CourseListStatusFilter; label: string }[]>(() => [
    { value: 'all', label: t('pages.browse.filters.all') },
    { value: 'in-progress', label: t('pages.browse.filters.inProgress') },
    { value: 'completed', label: t('pages.browse.filters.completed') },
    { value: 'not-started', label: t('pages.browse.filters.notStarted') },
  ]);

  // AppSelect's option contract is `{ id, label, disabled? }`. We use the
  // sort key as the id directly — it's a stable string union — so v-model
  // remains a `Ref<CourseListSort>` end-to-end.
  const sortOptions = computed<{ id: CourseListSort; label: string }[]>(() => [
    { id: 'recently-watched', label: t('pages.browse.sort.recentlyWatched') },
    { id: 'newest', label: t('pages.browse.sort.newest') },
    { id: 'alphabetical', label: t('pages.browse.sort.alphabetical') },
    { id: 'duration', label: t('pages.browse.sort.duration') },
  ]);

  const durationOptions = computed<{ id: CourseListDurationBucket; label: string }[]>(() => [
    { id: 'all', label: t('pages.browse.duration.all') },
    { id: 'lt5', label: t('pages.browse.duration.lt5') },
    { id: '5to10', label: t('pages.browse.duration.5to10') },
    { id: '10to20', label: t('pages.browse.duration.10to20') },
    { id: 'gt20', label: t('pages.browse.duration.gt20') },
  ]);

  // Library and instructor options come from their own endpoints. Both are
  // non-fatal: an errored list collapses to just the "any" option, so a
  // broken sidecar request never takes the shelf down with it.
  const { data: librariesData, status: librariesStatus } = useLibraries();
  const { data: instructorsData } = useInstructors();

  const libraryOptions = computed<{ id: string; label: string }[]>(() => [
    { id: COURSE_LIST_DEFAULTS.libraryId, label: t('pages.browse.library.all') },
    ...(librariesData.value?.items ?? []).map((l) => ({ id: l.id, label: l.name })),
  ]);

  const instructorOptions = computed<{ id: string; label: string }[]>(() => [
    { id: COURSE_LIST_DEFAULTS.instructorId, label: t('pages.browse.instructor.all') },
    ...(instructorsData.value?.items ?? []).map((i) => ({ id: i.id, label: i.displayName })),
  ]);

  // "if many" from the design brief: with nobody credited, the control is
  // noise. One instructor is still worth showing — it is a real narrowing.
  const showInstructorFilter = computed(() => instructorOptions.value.length > 1);

  const hasActiveFilter = computed(
    () =>
      status.value !== COURSE_LIST_DEFAULTS.status ||
      durationBucket.value !== COURSE_LIST_DEFAULTS.durationBucket ||
      libraryId.value !== COURSE_LIST_DEFAULTS.libraryId ||
      instructorId.value !== COURSE_LIST_DEFAULTS.instructorId,
  );

  // ── Empty state (#579) ───────────────────────────────────────────────────────
  //
  // `useCoursesList` returning zero items is ambiguous on its own: it means
  // something different depending on who's asking. `GET /libraries` answers
  // that — it returns only the libraries the requester has READ access to
  // (everything, for an admin) — so its own emptiness tells apart "nothing
  // was ever granted to this account" from "granted, but truly nothing to see".
  const auth = useAuthStore();
  const isAdmin = computed(() => auth.user?.role?.toLowerCase() === 'admin');

  // Same signal the home page uses (#666) to tell "nothing was ever granted
  // to this account" apart from every other empty/filtered state — reused
  // here rather than inventing a second pattern (#701). Independent of
  // `hasActiveFilter`: a stale filter in a bookmarked URL must not mask a
  // real access denial behind the "filtered" copy.
  const hasLibraryAccess = computed(() => {
    if (isAdmin.value) return true;
    // Libraries haven't resolved yet — default to the safe, always-true
    // state rather than briefly asserting "no access" off `useLibraries`'s
    // pre-fetch `{ items: [] }` default.
    if (librariesStatus.value === 'pending' || librariesStatus.value === 'idle') return true;
    return (librariesData.value?.items.length ?? 0) > 0;
  });

  // Reached only once `hasLibraryAccess` is true (see the template) — the
  // remaining distinctions are all about *what* is empty, not *whether* the
  // account can see anything at all.
  type BrowseEmptyKind = 'filtered' | 'no-courses' | 'no-library';

  const emptyKind = computed<BrowseEmptyKind>(() => {
    if (hasActiveFilter.value) return 'filtered';
    if (isAdmin.value) return 'no-library';
    return 'no-courses';
  });

  const emptyTitle = computed<string>(() => {
    if (emptyKind.value === 'filtered') return t('pages.browse.emptyFilteredTitle');
    if (emptyKind.value === 'no-courses') return t('pages.browse.emptyNoCoursesTitle');
    return t('pages.browse.emptyTitle');
  });
  const emptyBody = computed<string>(() => {
    if (emptyKind.value === 'filtered') return t('pages.browse.emptyFilteredBody');
    if (emptyKind.value === 'no-courses') return t('pages.browse.emptyNoCoursesBody');
    return t('pages.browse.emptyBody');
  });

  function selectStatus(value: CourseListStatusFilter): void {
    status.value = value;
  }

  function clearFilters(): void {
    status.value = COURSE_LIST_DEFAULTS.status;
    durationBucket.value = COURSE_LIST_DEFAULTS.durationBucket;
    libraryId.value = COURSE_LIST_DEFAULTS.libraryId;
    instructorId.value = COURSE_LIST_DEFAULTS.instructorId;
  }

  function toCourse(item: CourseDto): Course {
    return {
      id: item.id,
      title: item.title,
      // `instructors` is optional and may be empty; an empty join yields ''
      // and the card hides the line. Multiple instructors render comma-joined.
      instructor: (item.instructors ?? []).map((i) => i.displayName).join(', '),
      lessons: item.progress.lessonsTotal,
      completed: item.progress.lessonsCompleted,
      accent: accentFromId(item.id),
      // #496: posterUrl is our own signed /courses/:id/poster URL (or null —
      // no poster was ever downloaded). `cover` is bound straight to the
      // card's CSS `background`, so the shorthand carries position/size too.
      cover: item.posterUrl ? `url(${item.posterUrl}) center / cover no-repeat` : undefined,
    };
  }
</script>

<template>
  <div class="page-browse" data-testid="page-browse">
    <header class="page-browse__header">
      <h1 class="page-browse__title">{{ t('pages.browse.title') }}</h1>
      <p v-if="subtitle" class="page-browse__subtitle">
        {{ subtitle }}
      </p>
    </header>

    <!--
      ── No library access: one explanation, not a filter bar above it (#701) ──
      Same lesson as the home page's #666: a user with zero grants gets the
      denial and nothing else — no chips, no selects, no "0 courses" acting
      on a shelf they were never given access to.
    -->
    <AppNoPermission
      v-if="!hasLibraryAccess"
      icon="lock"
      :title="t('pages.browse.emptyNoAccessTitle')"
      :body="t('pages.browse.emptyNoAccessBody')"
    />

    <template v-else>
      <!-- Filters + sort row. Wraps under tight viewports; no dedicated
           bottom-sheet UX yet (deferred to design polish follow-up). -->
      <div
        class="page-browse__controls"
        role="region"
        :aria-label="t('pages.browse.filters.regionLabel')"
      >
        <div
          class="page-browse__chips"
          role="group"
          :aria-label="t('pages.browse.filters.statusLabel')"
        >
          <AppChip
            v-for="option in statusOptions"
            :key="option.value"
            :remove-label="t('ui.chip.remove')"
            :variant="status === option.value ? 'primary' : 'default'"
            :selected="status === option.value"
            :label="option.label"
            :data-testid="`browse-filter-${option.value}`"
            @click="selectStatus(option.value)"
          />
        </div>

        <div class="page-browse__selects">
          <label class="page-browse__select">
            <span class="page-browse__select-label">{{ t('pages.browse.library.label') }}</span>
            <AppSelect
              v-model="libraryId"
              :options="libraryOptions"
              size="sm"
              data-testid="browse-filter-library"
            />
          </label>

          <label class="page-browse__select">
            <span class="page-browse__select-label">{{ t('pages.browse.duration.label') }}</span>
            <AppSelect
              v-model="durationBucket"
              :options="durationOptions"
              size="sm"
              data-testid="browse-filter-duration"
            />
          </label>

          <label v-if="showInstructorFilter" class="page-browse__select">
            <span class="page-browse__select-label">{{ t('pages.browse.instructor.label') }}</span>
            <AppSelect
              v-model="instructorId"
              :options="instructorOptions"
              size="sm"
              data-testid="browse-filter-instructor"
            />
          </label>

          <label class="page-browse__select">
            <span class="page-browse__select-label">{{ t('pages.browse.sort.label') }}</span>
            <AppSelect v-model="sort" :options="sortOptions" size="sm" data-testid="browse-sort" />
          </label>

          <AppButton
            v-if="hasActiveFilter"
            variant="ghost"
            size="sm"
            data-testid="browse-clear-filters"
            @click="clearFilters"
          >
            {{ t('pages.browse.filters.clear') }}
          </AppButton>
        </div>
      </div>

      <!-- Loading: skeleton grid -->
      <div v-if="fetchStatus === 'pending'" class="page-browse__grid">
        <div v-for="n in 8" :key="`skel-${n}`" class="page-browse__skeleton-cell">
          <AppSkeleton width="100%" height="220px" radius="md" />
        </div>
      </div>

      <!-- Error -->
      <AppBanner
        v-else-if="fetchStatus === 'error'"
        variant="error"
        :title="t('pages.browse.errorTitle')"
        :body="t('pages.browse.errorBody')"
        class="page-browse__banner"
      >
        <template #actions>
          <AppButton variant="secondary" size="sm" @click="refetch">
            {{ t('pages.browse.retry') }}
          </AppButton>
        </template>
      </AppBanner>

      <!-- Empty — filtered / granted-but-empty / true empty-library (admin) -->
      <AppEmptyState
        v-else-if="items.length === 0"
        icon="folder"
        :title="emptyTitle"
        :body="emptyBody"
      >
        <template v-if="emptyKind === 'filtered'" #action>
          <AppButton
            variant="secondary"
            size="sm"
            data-testid="browse-empty-clear"
            @click="clearFilters"
          >
            {{ t('pages.browse.emptyShowAll') }}
          </AppButton>
        </template>
      </AppEmptyState>

      <!-- Populated grid -->
      <div v-else class="page-browse__grid">
        <NuxtLink
          v-for="item in items"
          :key="item.id"
          :to="`/courses/${item.id}`"
          class="page-browse__card-link"
        >
          <CoursePosterCard :course="toCourse(item)" :interactive="false" />
        </NuxtLink>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
  // Max page width for the browse grid.
  $page-max-width: 1280px;

  .page-browse {
    max-width: $page-max-width;
    margin: 0 auto;
    padding: 0 var(--space-4) var(--space-8);

    &__header {
      margin-bottom: var(--space-4);
    }

    &__title {
      margin: 0;
      font-size: var(--text-2xl);
      font-weight: var(--fw-semibold);
      color: var(--text-fg);
    }

    &__subtitle {
      margin: var(--space-1) 0 0;
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    // A column, not a wrapping row. As a row with `space-between` the selects
    // sat beside the chips in English and dropped below them in Russian, whose
    // labels are wider — so switching locale moved the whole filter group and
    // the grid under it jumped. Stacking makes the position the same in every
    // language, and the row never had enough width for both groups at the
    // narrow end anyway.
    &__controls {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: var(--space-3);
      margin-bottom: var(--space-6);
    }

    &__chips {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);

      // Status chips are the primary tap target on this page, so guarantee the
      // web ≥32px hit area (design brief §8.2). AppChip's 22px default is tuned
      // for dense tag/pill contexts; scope the bump here instead of globally.
      :deep(.app-chip) {
        min-height: var(--space-6); // 32px
        padding-inline: var(--space-3);
      }
    }

    // Four selects plus a clear button wrap among themselves on a narrow
    // screen; each select keeps its label attached rather than orphaning it on
    // the previous line.
    &__selects {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-3);
    }

    &__select {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      min-width: 0;
    }

    &__select-label {
      flex-shrink: 0;
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    &__grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: var(--space-4);
    }

    &__skeleton-cell {
      aspect-ratio: 3 / 4;
    }

    &__card-link {
      display: block;
      text-decoration: none;
      color: inherit;

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 2px;
        border-radius: var(--radius-md);
      }
    }

    &__banner {
      margin-bottom: var(--space-4);
    }
  }
</style>
