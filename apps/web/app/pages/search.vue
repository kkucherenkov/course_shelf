<script setup lang="ts">
  import { computed } from 'vue';
  import { AppButton, AppEmptyState, AppSkeleton } from '@app/ui';
  import type { SearchCourseHit, SearchLessonHit } from '@app/api-client-ts';

  import { useSearch } from '~/composables/useSearch';
  import { highlight } from '~/utils/highlight';

  definePageMeta({ layout: 'default' });

  const { t } = useI18n();
  const route = useRoute();

  // ── Query state ──────────────────────────────────────────────────────────────

  const q = computed<string>(() => {
    const raw = route.query.q;
    return typeof raw === 'string' ? raw : '';
  });

  const { data, status, errorStatus, retry } = useSearch(q);

  // Cause-specific error body: rate-limit reads differently from a transient
  // failure. (Other statuses share one actionable line.)
  const errorBody = computed<string>(() =>
    errorStatus.value === 429
      ? t('pages.search.errorBodyRateLimited')
      : t('pages.search.errorBody'),
  );

  const courses = computed<SearchCourseHit[]>(() => data.value?.courses ?? []);
  const lessons = computed<SearchLessonHit[]>(() => data.value?.lessons ?? []);
  const totalCount = computed(() => courses.value.length + lessons.value.length);

  const isEmpty = computed(
    () => status.value === 'success' && courses.value.length === 0 && lessons.value.length === 0,
  );
</script>

<template>
  <div class="page-search" data-testid="page-search">
    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <header class="page-search__header">
      <h1 class="page-search__title">{{ t('pages.search.title') }}</h1>
      <p v-if="q && status === 'success'" class="page-search__subtitle">
        {{
          totalCount === 0
            ? t('pages.search.headerCountZero', { q })
            : t('pages.search.headerCount', { n: totalCount, q })
        }}
      </p>
    </header>

    <!-- ── Empty: no query ────────────────────────────────────────────────── -->
    <AppEmptyState v-if="!q" icon="search" :title="t('pages.search.emptyTypeSomething')" />

    <!-- ── Empty: query too short ─────────────────────────────────────────── -->
    <AppEmptyState
      v-else-if="q.trim().length < 2"
      icon="search"
      :title="t('pages.search.emptyShortQuery')"
    />

    <!-- ── Loading skeleton ───────────────────────────────────────────────── -->
    <template v-else-if="status === 'pending'">
      <div class="page-search__group">
        <div class="page-search__group-header">
          <AppSkeleton width="80px" height="14px" />
        </div>
        <div v-for="i in 3" :key="`skel-course-${i}`" class="page-search__skel-row">
          <AppSkeleton width="64px" height="48px" radius="sm" />
          <div class="page-search__skel-body">
            <AppSkeleton :width="['70%', '55%', '62%'][i - 1]" height="14px" />
            <AppSkeleton width="40%" height="11px" />
          </div>
          <AppSkeleton width="36px" height="11px" />
        </div>
      </div>
      <div class="page-search__group">
        <div class="page-search__group-header">
          <AppSkeleton width="60px" height="14px" />
        </div>
        <div v-for="i in 3" :key="`skel-lesson-${i}`" class="page-search__skel-row">
          <AppSkeleton width="64px" height="48px" radius="sm" />
          <div class="page-search__skel-body">
            <AppSkeleton :width="['65%', '50%', '58%'][i - 1]" height="14px" />
            <AppSkeleton width="40%" height="11px" />
          </div>
          <AppSkeleton width="36px" height="11px" />
        </div>
      </div>
    </template>

    <!-- ── Error ──────────────────────────────────────────────────────────── -->
    <div v-else-if="status === 'error'" class="page-search__error" role="alert">
      <p class="page-search__error-title">{{ t('pages.search.errorTitle') }}</p>
      <p class="page-search__error-body">{{ errorBody }}</p>
      <AppButton
        variant="secondary"
        size="sm"
        :label="t('pages.search.errorRetry')"
        @click="retry"
      />
    </div>

    <!-- ── No results ─────────────────────────────────────────────────────── -->
    <AppEmptyState
      v-else-if="isEmpty"
      icon="search"
      :title="t('pages.search.emptyNoMatches', { q })"
      :body="t('pages.search.emptyNoMatchesBody')"
    >
      <template #action>
        <AppButton
          variant="secondary"
          size="sm"
          to="/browse"
          :label="t('pages.search.emptyBrowseAll')"
        />
      </template>
    </AppEmptyState>

    <!-- ── Results ────────────────────────────────────────────────────────── -->
    <template v-else-if="status === 'success'">
      <!-- Courses group -->
      <section v-if="courses.length > 0" class="page-search__group">
        <div class="page-search__group-header">
          <h2 class="page-search__group-title">{{ t('pages.search.groupCourses') }}</h2>
          <span class="page-search__group-count">{{ courses.length }}</span>
        </div>
        <ul class="page-search__list" role="list">
          <li v-for="course in courses" :key="course.id" class="page-search__list-item">
            <NuxtLink :to="`/courses/${course.id}`" class="page-search__item">
              <div
                class="page-search__item-thumb page-search__item-thumb--course"
                aria-hidden="true"
              >
                <span class="page-search__item-initials">
                  {{
                    course.title
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((w) => w[0]?.toUpperCase() ?? '')
                      .join('')
                  }}
                </span>
              </div>
              <div class="page-search__item-body">
                <p class="page-search__item-title">
                  <template v-for="(seg, idx) in highlight(course.title, q)" :key="idx">
                    <mark v-if="seg.match" class="page-search__highlight">{{ seg.text }}</mark>
                    <span v-else>{{ seg.text }}</span>
                  </template>
                </p>
                <p class="page-search__item-context">
                  {{ t('pages.search.courseLessonsTotal', { n: course.lessonsTotal }) }}
                </p>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </section>

      <!-- Lessons group -->
      <section v-if="lessons.length > 0" class="page-search__group">
        <div class="page-search__group-header">
          <h2 class="page-search__group-title">{{ t('pages.search.groupLessons') }}</h2>
          <span class="page-search__group-count">{{ lessons.length }}</span>
        </div>
        <ul class="page-search__list" role="list">
          <li v-for="lesson in lessons" :key="lesson.id" class="page-search__list-item">
            <NuxtLink
              :to="`/courses/${lesson.courseId}/lessons/${lesson.id}`"
              class="page-search__item"
            >
              <div
                class="page-search__item-thumb page-search__item-thumb--lesson"
                aria-hidden="true"
              >
                <span class="page-search__item-initials">
                  {{
                    lesson.courseTitle
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((w) => w[0]?.toUpperCase() ?? '')
                      .join('')
                  }}
                </span>
              </div>
              <div class="page-search__item-body">
                <p class="page-search__item-breadcrumb">
                  {{ lesson.courseTitle }}
                  <span aria-hidden="true"> · </span>
                  {{ lesson.sectionTitle }}
                </p>
                <p class="page-search__item-title">
                  <template v-for="(seg, idx) in highlight(lesson.title, q)" :key="idx">
                    <mark v-if="seg.match" class="page-search__highlight">{{ seg.text }}</mark>
                    <span v-else>{{ seg.text }}</span>
                  </template>
                </p>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<style lang="scss" scoped>
  // Max page width for the single-column results list.
  $page-max-width: 860px;
  // Tight optical gap between title and breadcrumb; below the --space-* scale.
  $item-body-gap: 3px;

  .page-search {
    max-width: $page-max-width;
    margin: 0 auto;
    padding: 0 var(--space-4) var(--space-8);

    // ── Header ──────────────────────────────────────────────────────────────
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
      color: var(--text-secondary);
    }

    // ── Result group ─────────────────────────────────────────────────────────
    &__group {
      margin-bottom: var(--space-8);
    }

    &__group-header {
      display: flex;
      align-items: baseline;
      gap: var(--space-2);
      margin-bottom: var(--space-3);
    }

    &__group-title {
      margin: 0;
      font-size: var(--text-xs);
      font-weight: var(--fw-semibold);
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    &__group-count {
      font-size: var(--text-xs);
      color: var(--text-secondary);
      font-variant-numeric: tabular-nums;
    }

    // ── List ─────────────────────────────────────────────────────────────────
    &__list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    &__list-item {
      display: contents;
    }

    // ── Item row ─────────────────────────────────────────────────────────────
    &__item {
      display: grid;
      grid-template-columns: 64px 1fr;
      gap: var(--space-3);
      padding: var(--space-3);
      border-radius: var(--radius-md);
      text-decoration: none;
      color: inherit;
      align-items: center;
      transition: background var(--dur-fast) var(--ease-default);

      &:hover {
        background: var(--surface-raised);
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 2px;
        border-radius: var(--radius-md);
      }
    }

    &__item-thumb {
      width: var(--space-8);
      height: var(--space-7);
      border-radius: var(--radius-sm);
      display: grid;
      place-items: center;
      flex-shrink: 0;
      overflow: hidden;

      &--course {
        background: var(--brand-accent);
      }

      &--lesson {
        background: var(--surface-overlay);
        border: 1px solid var(--border-default);
      }
    }

    &__item-initials {
      font-size: var(--text-xs);
      font-weight: var(--fw-bold);
      color: var(--brand-accent-fg);
      letter-spacing: 0.04em;
    }

    &__item-body {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: $item-body-gap;
    }

    &__item-breadcrumb {
      margin: 0;
      font-size: var(--text-xs);
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &__item-title {
      margin: 0;
      font-size: var(--text-sm);
      font-weight: var(--fw-medium);
      color: var(--text-fg);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &__item-context {
      margin: 0;
      font-size: var(--text-xs);
      color: var(--text-secondary);
    }

    // ── Highlight mark ───────────────────────────────────────────────────────
    &__highlight {
      background: color-mix(in oklch, var(--brand-accent) 20%, transparent);
      color: var(--brand-accent);
      padding: 0 2px;
      border-radius: 2px;
      font-weight: var(--fw-semibold);
      font-style: normal;
    }

    // ── Skeleton rows ────────────────────────────────────────────────────────
    &__skel-row {
      display: grid;
      grid-template-columns: 64px 1fr 36px;
      gap: var(--space-3);
      padding: var(--space-3);
      align-items: center;
    }

    &__skel-body {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    // ── Error ────────────────────────────────────────────────────────────────
    &__error {
      padding: var(--space-8) var(--space-4);
      text-align: center;
      color: var(--text-secondary);
    }

    &__error-title {
      margin: 0 0 var(--space-1);
      font-size: var(--text-sm);
      color: var(--status-error-fg);
    }

    &__error-body {
      margin: 0 0 var(--space-3);
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }
  }
</style>
