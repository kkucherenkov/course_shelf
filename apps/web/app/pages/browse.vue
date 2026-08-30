<script setup lang="ts">
  import { computed } from 'vue';
  import {
    AppBanner,
    AppButton,
    AppChip,
    AppEmptyState,
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
  const subtitle = computed<string>(() => {
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
  const { data: librariesData } = useLibraries();
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

    <!-- Empty -->
    <AppEmptyState
      v-else-if="items.length === 0"
      icon="folder"
      :title="hasActiveFilter ? t('pages.browse.emptyFilteredTitle') : t('pages.browse.emptyTitle')"
      :body="hasActiveFilter ? t('pages.browse.emptyFilteredBody') : t('pages.browse.emptyBody')"
    >
      <template v-if="hasActiveFilter" #action>
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
      font-weight: 600;
      color: var(--text-fg);
    }

    &__subtitle {
      margin: var(--space-1) 0 0;
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    &__controls {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
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

    // Four selects plus a clear button do not fit beside the chip row below
    // roughly 900px, so the group wraps as a unit and each select keeps its
    // label attached rather than orphaning it on the previous line.
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
