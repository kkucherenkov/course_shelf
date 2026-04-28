<script setup lang="ts">
  import { computed } from 'vue';
  import { AppBanner, AppEmptyState, AppSkeleton, CoursePosterCard } from '@app/ui';
  import type { Course } from '@app/ui';
  import type { CourseDto } from '@app/api-client-ts';

  import { useCoursesList } from '~/composables/useCoursesList';
  import { accentFromId } from '~/utils/course-accent';

  definePageMeta({ layout: 'default' });

  const { t } = useI18n();
  const { data, status, error, refetch } = useCoursesList();

  const items = computed(() => data.value?.items ?? []);

  function toCourse(item: CourseDto): Course {
    return {
      id: item.id,
      title: item.title,
      instructor: '',
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
      <p class="page-browse__subtitle">
        {{ t('pages.browse.subtitle', { n: items.length }) }}
      </p>
    </header>

    <!-- Loading: skeleton grid -->
    <div v-if="status === 'pending'" class="page-browse__grid">
      <div v-for="n in 8" :key="`skel-${n}`" class="page-browse__skeleton-cell">
        <AppSkeleton width="100%" height="220px" radius="md" />
      </div>
    </div>

    <!-- Error -->
    <AppBanner
      v-else-if="status === 'error'"
      variant="error"
      :title="t('pages.browse.errorTitle')"
      :body="error?.message ?? ''"
      class="page-browse__banner"
    >
      <template #actions>
        <button type="button" class="page-browse__retry" @click="refetch">
          {{ t('pages.browse.retry') }}
        </button>
      </template>
    </AppBanner>

    <!-- Empty -->
    <AppEmptyState
      v-else-if="items.length === 0"
      icon="folder"
      :title="t('pages.browse.emptyTitle')"
      :body="t('pages.browse.emptyBody')"
    />

    <!-- Populated grid -->
    <div v-else class="page-browse__grid">
      <NuxtLink
        v-for="item in items"
        :key="item.id"
        :to="`/courses/${item.id}`"
        class="page-browse__card-link"
      >
        <CoursePosterCard :course="toCourse(item)" />
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
      margin-bottom: var(--space-6);
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

    &__retry {
      padding: var(--space-1) var(--space-3);
      border: 0;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--brand-accent);
      cursor: pointer;
      font-size: var(--text-sm);
      font-weight: 500;

      &:hover {
        background: var(--brand-accent-soft);
      }
    }
  }
</style>
