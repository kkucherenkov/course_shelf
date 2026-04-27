<script setup lang="ts">
  import IconCS, { type IconName } from '../IconCS/IconCS.vue';

  withDefaults(
    defineProps<{
      icon?: IconName;
      title: string;
      body?: string;
    }>(),
    { icon: 'alert', body: undefined },
  );
</script>

<template>
  <div class="app-error-state" role="alert">
    <slot name="illustration">
      <IconCS :name="icon" :size="40" class="app-error-state__icon" aria-hidden="true" />
    </slot>
    <h3 class="app-error-state__title">
      {{ title }}
    </h3>
    <p v-if="body || $slots['body']" class="app-error-state__body">
      <slot name="body">
        {{ body }}
      </slot>
    </p>
    <div v-if="$slots['action']" class="app-error-state__action">
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped lang="scss">
  // S10 — error state surface (role="alert" for live assertive announcement).
  // Icon + title use --status-error-fg for error palette emphasis.
  // Token substitutions:
  //   --status-error-fg  → --status-error-fg  (ships verbatim)
  //   --text-muted       → --text-secondary   (ships as alias)
  //   --text-loud        → --text-loud        (ships verbatim)
  .app-error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--space-3);
    padding: var(--space-7) var(--space-5);
    color: var(--text-secondary);

    &__icon {
      color: var(--status-error-fg); // error palette
    }

    &__title {
      margin: 0;
      font-size: var(--text-lg);
      font-weight: var(--fw-semibold);
      color: var(--status-error-fg); // error palette — title coloured
    }

    &__body {
      margin: 0;
      font-size: var(--text-sm);
      color: var(--text-secondary);
      max-width: 32rem;
    }

    &__action {
      margin-top: var(--space-2);
    }
  }
</style>
