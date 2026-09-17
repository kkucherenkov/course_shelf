<script setup lang="ts">
  import { computed } from 'vue';
  import { AppSegmented, AppSegmentedItem, AppSkeleton, IconCS } from '@app/ui';
  import type { AdminLibraryListItem, AccessGrantDto, CourseDto } from '@app/api-client-ts';

  interface Props {
    library: AdminLibraryListItem;
    libraryGranted: boolean;
    overrides: AccessGrantDto[];
    expanded: boolean;
    courses?: CourseDto[];
    /** Pre-translated strings */
    labelRead: string;
    labelNone: string;
    labelExpandLibrary: string;
    labelCollapseLibrary: string;
    labelOverridesBadge: string;
    labelCoursesLoading: string;
    labelCourseToggleHint: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    courses: undefined,
  });

  const emit = defineEmits<{
    /** Emitted when the library-level toggle is clicked. */
    setLibrary: [payload: { granted: boolean }];
    /** Emitted when a per-course toggle is clicked. */
    setCourse: [payload: { courseId: string; granted: boolean }];
    'update:expanded': [value: boolean];
  }>();

  const hasOverrides = computed(() => props.overrides.length > 0);

  const chevronAriaLabel = computed(() =>
    props.expanded ? props.labelCollapseLibrary : props.labelExpandLibrary,
  );

  function toggleExpanded(): void {
    emit('update:expanded', !props.expanded);
  }

  function isCourseGranted(courseId: string): boolean {
    return props.overrides.some(
      (g) => g.target.kind === 'course' && g.target.courseId === courseId,
    );
  }
</script>

<template>
  <div class="adm-perm-row-wrap">
    <!-- Library row -->
    <div class="adm-perm-row" :class="{ 'adm-perm-row--has-overrides': hasOverrides && expanded }">
      <!-- Library info -->
      <div class="adm-perm-row__info">
        <div class="adm-perm-row__icon" aria-hidden="true">
          <IconCS name="library" :size="14" />
        </div>
        <div class="adm-perm-row__meta">
          <div class="adm-perm-row__name">
            {{ library.name }}
            <span v-if="hasOverrides" class="adm-perm-row__badge" :title="labelOverridesBadge">
              {{ overrides.length }}
            </span>
          </div>
          <div class="adm-perm-row__sub">
            {{ library.coursesCount }} &middot; {{ library.lessonsCount }}
          </div>
        </div>
      </div>

      <!-- Level toggle -->
      <AppSegmented
        :model-value="libraryGranted ? 'read' : 'none'"
        :label="library.name"
        @update:model-value="emit('setLibrary', { granted: $event === 'read' })"
      >
        <AppSegmentedItem value="read" :label="labelRead" />
        <AppSegmentedItem value="none" :label="labelNone" />
      </AppSegmented>

      <!-- Expand/collapse chevron -->
      <button
        type="button"
        class="adm-perm-row__chevron"
        :aria-label="chevronAriaLabel"
        :aria-expanded="expanded"
        @click="toggleExpanded"
      >
        <IconCS
          name="chevron-down"
          :size="14"
          class="adm-perm-row__chevron-icon"
          :class="{ 'adm-perm-row__chevron-icon--open': expanded }"
        />
      </button>
    </div>

    <!-- Overrides panel -->
    <div v-if="expanded" class="adm-perm-overrides">
      <!-- Loading skeleton -->
      <template v-if="!courses">
        <div class="adm-perm-overrides__loading">
          <AppSkeleton width="80%" height="13px" />
          <AppSkeleton width="50%" height="13px" />
          <AppSkeleton width="80%" height="13px" />
        </div>
      </template>

      <template v-else>
        <div v-for="course in courses" :key="course.id" class="adm-perm-override-row">
          <!-- Course info -->
          <div class="adm-perm-override-row__info">
            <div class="adm-perm-override-row__dot" aria-hidden="true" />
            <div class="adm-perm-override-row__title">{{ course.title }}</div>
          </div>

          <!-- Course toggle -->
          <div class="adm-perm-override-row__toggle-wrap">
            <AppSegmented
              :model-value="isCourseGranted(course.id) ? 'read' : 'none'"
              :label="course.title"
              @update:model-value="
                emit('setCourse', { courseId: course.id, granted: $event === 'read' })
              "
            >
              <AppSegmentedItem value="read" :label="labelRead" />
              <AppSegmentedItem
                value="none"
                :label="labelNone"
                :title="
                  !isCourseGranted(course.id) && libraryGranted ? labelCourseToggleHint : undefined
                "
              />
            </AppSegmented>
          </div>
        </div>

        <div v-if="courses.length === 0" class="adm-perm-overrides__empty">
          <IconCS name="academic-cap" class="adm-perm-overrides__empty-icon" />
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $icon-size: 28px;
  $chevron-size: 28px;
  $chevron-icon-size: 14px;
  $course-dot-size: 18px;
  $course-dot-h: 14px;
  $badge-min-w: 18px;
  $badge-h: 18px;
  $empty-icon-size: 20px;

  .adm-perm-row-wrap {
    border-bottom: 1px solid var(--border-default);

    &:last-child {
      border-bottom: 0;
    }
  }

  .adm-perm-row {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: var(--space-3);
    align-items: center;
    padding: var(--space-3) var(--space-4);

    &--has-overrides {
      border-bottom: 1px solid var(--border-default);
    }

    &__info {
      display: flex;
      gap: var(--space-3);
      align-items: center;
      min-width: 0;
    }

    &__icon {
      flex-shrink: 0;
      width: $icon-size;
      height: $icon-size;
      border-radius: var(--radius-sm);
      background: var(--surface-raised);
      display: grid;
      place-items: center;
      color: var(--text-secondary);
      font-size: var(--text-sm);
    }

    &__meta {
      min-width: 0;
    }

    &__name {
      font-size: var(--text-sm);
      font-weight: var(--fw-medium);
      color: var(--text-loud);
      display: flex;
      gap: var(--space-2);
      align-items: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__badge {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 var(--space-1);
      min-width: $badge-min-w;
      height: $badge-h;
      border-radius: var(--radius-pill);
      font-size: var(--text-xs); // #700: was a raw 11px SCSS var, invisible to the literal gate
      font-weight: var(--fw-semibold);
      background: var(--status-info-soft);
      color: var(--status-info-fg);
    }

    &__sub {
      font-size: var(--text-xs);
      color: var(--text-secondary);
      margin-top: var(--space-1);
    }

    // ── Chevron ─────────────────────────────────────────────────────────────
    &__chevron {
      flex-shrink: 0;
      width: $chevron-size;
      height: $chevron-size;
      display: grid;
      place-items: center;
      border: none;
      background: none;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      cursor: pointer;

      &:hover {
        background: var(--surface-raised);
        color: var(--text-loud);
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 2px;
      }

      &-icon {
        width: $chevron-icon-size;
        height: $chevron-icon-size;
        transition: transform var(--dur-fast) ease;

        &--open {
          transform: rotate(0deg);
        }

        // default (collapsed): rotate -90deg
      }
    }

    // default chevron state — pointing right = collapsed
    &__chevron-icon:not(&__chevron-icon--open) {
      transform: rotate(-90deg);
    }
  }

  // ── Overrides panel ────────────────────────────────────────────────────────
  .adm-perm-overrides {
    background: color-mix(
      in oklch,
      var(--status-info-fg, var(--brand-accent)) 4%,
      var(--surface-surface)
    );
    padding: 0 var(--space-4) var(--space-3) calc(#{$icon-size} + var(--space-3) + var(--space-4));

    &__loading {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      padding-top: var(--space-3);
    }

    &__empty {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-4);
      color: var(--text-tertiary);
    }

    &__empty-icon {
      width: $empty-icon-size;
      height: $empty-icon-size;
    }
  }

  .adm-perm-override-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--space-3);
    align-items: center;
    padding: var(--space-2) 0;

    &__info {
      display: flex;
      gap: var(--space-2);
      align-items: center;
      min-width: 0;
    }

    &__dot {
      flex-shrink: 0;
      width: $course-dot-size;
      height: $course-dot-h;
      border-radius: var(--radius-xs, 3px);
      background: var(--surface-skeleton-base);
    }

    &__title {
      font-size: var(--text-xs);
      color: var(--text-fg);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__toggle-wrap {
      display: flex;
      gap: var(--space-2);
      align-items: center;
    }
  }
</style>
