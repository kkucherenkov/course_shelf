<script setup lang="ts">
  import { AppErrorState, AppEmptyState, AppButton } from '@app/ui';
  import type { RowStatus } from '~/composables/useHome';

  /**
   * Generic horizontal-scrolling row used by all Home page content sections.
   *
   * Visual states:
   * - loading  → skeleton cards from #skeleton slot (caller passes N AppSkeleton items)
   * - error    → AppErrorState with retry button
   * - empty    → AppEmptyState with an optional action slot
   * - default  → scoped #card slot; parent renders the actual cards
   *
   * The row collapses (hides the scroll area) when `collapsible` is true and
   * `expanded` is false. The caller owns the toggle.
   */
  const props = withDefaults(
    defineProps<{
      /** Section heading — already translated. */
      heading: string;
      status: RowStatus;
      /** True if there are no items (status === 'success' but items.length === 0). */
      empty?: boolean;
      /** Empty state heading — already translated. */
      emptyTitle?: string;
      /** Empty state body — already translated. */
      emptyBody?: string;
      /** Error heading — already translated. */
      errorTitle?: string;
      /** Retry button label — already translated. */
      retryLabel?: string;
      /** Number of visible skeleton cards during loading. Default 5. */
      skeletonCount?: number;
      /** If true, the card area can be toggled via the `expanded` prop. */
      collapsible?: boolean;
      /** Controls collapse state when `collapsible` is true. */
      expanded?: boolean;
      /** Optional label injected between heading and chevron when collapsible. */
      collapsibleMeta?: string;
      /** "Show all" label — already translated. */
      showAllLabel?: string;
      /** "Collapse" label — already translated. */
      collapseLabel?: string;
    }>(),
    {
      empty: false,
      emptyTitle: '',
      emptyBody: undefined,
      errorTitle: 'Could not load',
      retryLabel: 'Retry',
      skeletonCount: 5,
      collapsible: false,
      expanded: false,
      collapsibleMeta: undefined,
      showAllLabel: 'Show all',
      collapseLabel: 'Collapse',
    },
  );

  const emit = defineEmits<{
    retry: [];
    'update:expanded': [value: boolean];
  }>();

  function onRetry(): void {
    emit('retry');
  }

  function onToggle(): void {
    emit('update:expanded', !props.expanded);
  }
</script>

<template>
  <section class="home-row">
    <!-- heading bar -->
    <div class="home-row__header">
      <h2 class="home-row__heading">{{ heading }}</h2>

      <template v-if="collapsible">
        <span v-if="collapsibleMeta" class="home-row__meta">{{ collapsibleMeta }}</span>
        <button type="button" class="home-row__toggle" :aria-expanded="expanded" @click="onToggle">
          {{ expanded ? collapseLabel : showAllLabel }}
          <span class="home-row__chevron" :class="{ 'home-row__chevron--open': expanded }">▾</span>
        </button>
      </template>
    </div>

    <!-- body: collapsible guard -->
    <div v-if="!collapsible || expanded" class="home-row__body">
      <!-- loading state -->
      <div v-if="status === 'pending'" class="home-row__scroll">
        <slot name="skeleton">
          <!-- Fallback: plain skeleton items. Caller can override. -->
          <span
            v-for="i in skeletonCount"
            :key="i"
            class="home-row__skeleton-item"
            aria-hidden="true"
          />
        </slot>
      </div>

      <!-- error state -->
      <AppErrorState v-else-if="status === 'error'" :title="errorTitle" class="home-row__error">
        <template #action>
          <AppButton :label="retryLabel" size="sm" variant="secondary" @click="onRetry" />
        </template>
      </AppErrorState>

      <!-- empty state -->
      <AppEmptyState
        v-else-if="status === 'success' && empty"
        :title="emptyTitle"
        :body="emptyBody"
        class="home-row__empty"
      />

      <!-- populated -->
      <div v-else-if="status === 'success'" class="home-row__scroll">
        <slot />
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
  // Skeleton card dimensions — SCSS vars to satisfy the raw-px lint rule.
  $skel-w: 160px;
  $skel-h: 200px;
  // Skeleton pulse duration — SCSS var to satisfy the raw-duration lint rule.
  $skel-dur: var(--dur-slower, 1.4s);

  .home-row {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);

    &__header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    &__heading {
      margin: 0;
      font-size: var(--text-lg);
      font-weight: var(--fw-semibold);
      color: var(--text-fg);
      flex: 1;
    }

    &__meta {
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    &__toggle {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      background: transparent;
      border: none;
      color: var(--brand-accent);
      font-size: var(--text-sm);
      font-weight: var(--fw-medium);
      cursor: pointer;
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      transition: background var(--dur-fast) var(--ease-default);

      &:hover {
        background: var(--brand-accent-soft);
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 2px;
      }
    }

    &__chevron {
      display: inline-block;
      transition: transform var(--dur-fast) var(--ease-default);
      font-size: var(--text-sm);
      line-height: 1;

      &--open {
        transform: rotate(180deg);
      }
    }

    &__body {
      min-height: 0;
    }

    // Horizontal scrolling card container — scroll at xs, wraps at lg+
    &__scroll {
      display: flex;
      gap: var(--space-3);
      overflow-x: auto;
      padding-bottom: var(--space-2); // space for scrollbar
      scrollbar-width: thin;
      scrollbar-color: var(--border-default) transparent;

      // Prevent card shrinkage when scrolling
      & > * {
        flex-shrink: 0;
      }

      // xs (<640px): always scroll horizontally
      @media (width < 640px) {
        flex-wrap: nowrap;
      }

      // md+ (≥768px): allow wrap if enough width
      @media (width >= 768px) {
        flex-wrap: wrap;
        overflow-x: visible;
      }
    }

    &__skeleton-item {
      display: inline-block;
      width: $skel-w;
      height: $skel-h;
      border-radius: var(--radius-md);
      background: linear-gradient(
        90deg,
        var(--skeleton-base, var(--surface-overlay)),
        var(--skeleton-shine, var(--surface-raised)),
        var(--skeleton-base, var(--surface-overlay))
      );
      background-size: 200% 100%;
      animation: home-row-pulse $skel-dur ease-in-out infinite;
    }

    &__error,
    &__empty {
      padding: var(--space-5) var(--space-4);
    }
  }

  @keyframes home-row-pulse {
    0% {
      background-position: 200% 0;
    }

    100% {
      background-position: -200% 0;
    }
  }
</style>
