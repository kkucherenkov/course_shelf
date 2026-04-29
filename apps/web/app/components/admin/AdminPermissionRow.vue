<script setup lang="ts">
  import { computed } from 'vue';
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
          <span class="i-heroicons-building-library" />
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
      <div class="adm-perm-row__toggle" role="group" :aria-label="library.name">
        <button
          type="button"
          class="adm-perm-row__toggle-btn"
          :class="{ 'adm-perm-row__toggle-btn--read': libraryGranted }"
          :aria-pressed="libraryGranted"
          @click="emit('setLibrary', { granted: true })"
        >
          {{ labelRead }}
        </button>
        <button
          type="button"
          class="adm-perm-row__toggle-btn"
          :class="{ 'adm-perm-row__toggle-btn--none': !libraryGranted }"
          :aria-pressed="!libraryGranted"
          @click="emit('setLibrary', { granted: false })"
        >
          {{ labelNone }}
        </button>
      </div>

      <!-- Expand/collapse chevron -->
      <button
        type="button"
        class="adm-perm-row__chevron"
        :aria-label="chevronAriaLabel"
        :aria-expanded="expanded"
        @click="toggleExpanded"
      >
        <span
          class="i-heroicons-chevron-down adm-perm-row__chevron-icon"
          :class="{ 'adm-perm-row__chevron-icon--open': expanded }"
          aria-hidden="true"
        />
      </button>
    </div>

    <!-- Overrides panel -->
    <div v-if="expanded" class="adm-perm-overrides">
      <!-- Loading skeleton -->
      <template v-if="!courses">
        <div class="adm-perm-overrides__loading">
          <div class="adm-perm-overrides__skel adm-perm-overrides__skel--line" />
          <div
            class="adm-perm-overrides__skel adm-perm-overrides__skel--line adm-perm-overrides__skel--short"
          />
          <div class="adm-perm-overrides__skel adm-perm-overrides__skel--line" />
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
            <div class="adm-perm-row__toggle" role="group" :aria-label="course.title">
              <button
                type="button"
                class="adm-perm-row__toggle-btn"
                :class="{ 'adm-perm-row__toggle-btn--read': isCourseGranted(course.id) }"
                :aria-pressed="isCourseGranted(course.id)"
                @click="emit('setCourse', { courseId: course.id, granted: true })"
              >
                {{ labelRead }}
              </button>
              <button
                type="button"
                class="adm-perm-row__toggle-btn"
                :class="{ 'adm-perm-row__toggle-btn--none': !isCourseGranted(course.id) }"
                :aria-pressed="!isCourseGranted(course.id)"
                :title="
                  !isCourseGranted(course.id) && libraryGranted ? labelCourseToggleHint : undefined
                "
                @click="emit('setCourse', { courseId: course.id, granted: false })"
              >
                {{ labelNone }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="courses.length === 0" class="adm-perm-overrides__empty">
          <span
            class="i-heroicons-academic-cap adm-perm-overrides__empty-icon"
            aria-hidden="true"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $icon-size: 28px;
  $chevron-size: 28px;
  $chevron-icon-size: 14px;
  $toggle-radius: var(--radius-md);
  $skel-h: 13px;
  $skel-dur: var(--dur-slow, 1400ms);
  $course-dot-size: 18px;
  $course-dot-h: 14px;
  $badge-font: 11px;
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
      color: var(--text-muted);
      font-size: var(--text-sm);
    }

    &__meta {
      min-width: 0;
    }

    &__name {
      font-size: var(--text-sm);
      font-weight: 500;
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
      font-size: $badge-font;
      font-weight: 600;
      background: var(--status-info-soft);
      color: var(--status-info-fg);
    }

    &__sub {
      font-size: var(--text-xs);
      color: var(--text-muted);
      margin-top: var(--space-1);
    }

    // ── Level toggle ────────────────────────────────────────────────────────
    &__toggle {
      display: inline-flex;
      padding: 2px;
      background: var(--surface-raised);
      border: 1px solid var(--border-default);
      border-radius: $toggle-radius;
    }

    &__toggle-btn {
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      font-weight: 500;
      color: var(--text-muted);
      background: none;
      border: none;
      cursor: pointer;
      transition:
        background var(--dur-fast) ease,
        color var(--dur-fast) ease;

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 1px;
      }

      &--read {
        background: var(--status-success-fg, var(--brand-accent));
        color: var(--brand-accent-fg);
      }

      &--none {
        background: var(--surface-skeleton-base, var(--surface-raised));
        color: var(--text-loud);
      }
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
      color: var(--text-muted);
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

    &__skel {
      height: $skel-h;
      border-radius: var(--radius-sm);
      background: var(--surface-skeleton-base);
      animation: adm-perm-skel-pulse $skel-dur ease-in-out infinite;

      &--line {
        width: 80%;
      }

      &--short {
        width: 50%;
      }
    }

    &__empty {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-4);
      color: var(--text-subtle);
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

  @keyframes adm-perm-skel-pulse {
    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0.4;
    }
  }
</style>
