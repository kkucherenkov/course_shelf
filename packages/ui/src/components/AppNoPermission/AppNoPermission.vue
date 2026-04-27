<script setup lang="ts">
  import IconCS, { type IconName } from '../IconCS/IconCS.vue';

  withDefaults(
    defineProps<{
      icon?: IconName;
      title: string;
      body?: string;
    }>(),
    { icon: 'lock', body: undefined },
  );
</script>

<template>
  <div class="app-no-permission" role="status">
    <slot name="illustration">
      <IconCS :name="icon" :size="40" class="app-no-permission__icon" aria-hidden="true" />
    </slot>
    <h3 class="app-no-permission__title">
      {{ title }}
    </h3>
    <p v-if="body || $slots['body']" class="app-no-permission__body">
      <slot name="body">
        {{ body }}
      </slot>
    </p>
    <div v-if="$slots['action']" class="app-no-permission__action">
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped lang="scss">
  // S10 — no-permission state surface (role="status" — non-disruptive).
  // Icon + title use --status-warning-fg for warning palette.
  // Token substitutions:
  //   --status-warning-fg  → --status-warning-fg  (ships verbatim)
  //   --text-muted         → --text-secondary      (ships as alias)
  .app-no-permission {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--space-3);
    padding: var(--space-7) var(--space-5);
    color: var(--text-secondary);

    &__icon {
      color: var(--status-warning-fg); // warning palette
    }

    &__title {
      margin: 0;
      font-size: var(--text-lg);
      font-weight: var(--fw-semibold);
      color: var(--status-warning-fg); // warning palette — title coloured
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
