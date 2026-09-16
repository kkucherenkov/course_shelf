<script setup lang="ts">
  import IconCS, { type IconName } from '../IconCS/IconCS.vue';

  withDefaults(
    defineProps<{
      icon?: IconName;
      title: string;
      body?: string;
      /**
       * Heading level for `title` (#631). This component has no idea where
       * it's mounted, so it cannot know what level follows the page's own
       * `h1` — a hardcoded `h3` produced an `h1 → h3` skip on every page
       * that renders this state directly under its heading. `2` matches
       * that common case; a page nesting this deeper passes the real level.
       */
      headingLevel?: 2 | 3 | 4 | 5 | 6;
    }>(),
    { icon: 'folder', body: undefined, headingLevel: 2 },
  );
</script>

<template>
  <div class="app-empty-state" role="status">
    <slot name="illustration">
      <IconCS :name="icon" :size="40" class="app-empty-state__icon" aria-hidden="true" />
    </slot>
    <component :is="`h${headingLevel}`" class="app-empty-state__title">
      {{ title }}
    </component>
    <p v-if="body || $slots['body']" class="app-empty-state__body">
      <slot name="body">
        {{ body }}
      </slot>
    </p>
    <!-- `actions` is a fallback alias for `action` — one consumer
         (admin/libraries) used the plural name that AppBanner uses, and the
         slot silently dropped its content instead of erroring. -->
    <div v-if="$slots['action'] || $slots['actions']" class="app-empty-state__action">
      <slot name="action">
        <slot name="actions" />
      </slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
  // S10 — neutral empty state surface.
  // Token substitutions:
  //   --text-loud     → --text-loud       (ships verbatim)
  //   --text-muted    → --text-secondary  (ships as alias --text-muted)
  //   --text          → --text-fg         (ships as alias)
  .app-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--space-3);
    padding: var(--space-7) var(--space-5); // 48px 24px — generous padding per spec
    color: var(--text-secondary); // muted context color

    &__icon {
      color: var(--text-secondary); // neutral gray icon
    }

    &__title {
      margin: 0;
      font-size: var(--text-lg);
      font-weight: var(--fw-semibold);
      color: var(--text-loud); // bundle --text-loud
    }

    &__body {
      margin: 0;
      font-size: var(--text-sm);
      color: var(--text-secondary); // bundle --text-muted
      max-width: 32rem;
    }

    &__action {
      margin-top: var(--space-2);
    }
  }
</style>
