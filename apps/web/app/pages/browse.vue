<script setup lang="ts">
  import { computed, ref } from 'vue';
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
    type CourseListSort,
    type CourseListStatusFilter,
  } from '~/composables/useCoursesList';
  import { accentFromId } from '~/utils/course-accent';

  definePageMeta({ layout: 'default' });

  const { t } = useI18n();

  const status = ref<CourseListStatusFilter>('all');
  const sort = ref<CourseListSort>('recently-watched');

  const { data, status: fetchStatus, refetch } = useCoursesList({ status, sort });

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
  const statusOptions: { value: CourseListStatusFilter; label: string }[] = [
    { value: 'all', label: t('pages.browse.filters.all') },
    { value: 'in-progress', label: t('pages.browse.filters.inProgress') },
    { value: 'completed', label: t('pages.browse.filters.completed') },
    { value: 'not-started', label: t('pages.browse.filters.notStarted') },
  ];

  // AppSelect's option contract is `{ id, label, disabled? }`. We use the
  // sort key as the id directly — it's a stable string union — so v-model
  // remains a `Ref<CourseListSort>` end-to-end.
  const sortOptions: { id: CourseListSort; label: string }[] = [
    { id: 'recently-watched', label: t('pages.browse.sort.recentlyWatched') },
    { id: 'newest', label: t('pages.browse.sort.newest') },
    { id: 'alphabetical', label: t('pages.browse.sort.alphabetical') },
  ];

  function selectStatus(value: CourseListStatusFilter): void {
    status.value = value;
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
          :variant="status === option.value ? 'primary' : 'default'"
          :selected="status === option.value"
          :label="option.label"
          :data-testid="`browse-filter-${option.value}`"
          @click="selectStatus(option.value)"
        />
      </div>

      <label class="page-browse__sort">
        <span class="page-browse__sort-label">{{ t('pages.browse.sort.label') }}</span>
        <AppSelect v-model="sort" :options="sortOptions" data-testid="browse-sort" />
      </label>
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
      :title="
        status === 'all' ? t('pages.browse.emptyTitle') : t('pages.browse.emptyFilteredTitle')
      "
      :body="status === 'all' ? t('pages.browse.emptyBody') : t('pages.browse.emptyFilteredBody')"
    >
      <template v-if="status !== 'all'" #action>
        <AppButton variant="secondary" size="sm" @click="selectStatus('all')">
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
  .page-browse {
    max-width: 1280px;
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
      color: var(--text-fg-muted);
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

    &__sort {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
    }

    &__sort-label {
      font-size: var(--text-sm);
      color: var(--text-fg-muted);
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
