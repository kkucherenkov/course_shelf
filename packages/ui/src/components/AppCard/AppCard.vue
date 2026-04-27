<script setup lang="ts">
  import { computed } from 'vue';

  const props = withDefaults(
    defineProps<{
      title?: string;
      description?: string;
      /**
       * When true, renders the card as a focusable, clickable surface
       * (semantic `<button>`) with hover + focus-visible affordances and
       * keyboard activation via Enter/Space. Emits `click` on activation.
       *
       * When false (default) the card renders as a plain `<div>`: no focus
       * ring, no click emit — purely presentational.
       */
      interactive?: boolean;
    }>(),
    {
      title: undefined,
      description: undefined,
      interactive: false,
    },
  );

  const emit = defineEmits<{
    click: [event: Event];
  }>();

  const rootTag = computed(() => (props.interactive ? 'button' : 'div'));
  const rootClasses = computed(() => ['app-card', { 'app-card--interactive': props.interactive }]);

  function handleClick(event: MouseEvent): void {
    if (!props.interactive) return;
    emit('click', event);
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (!props.interactive) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    emit('click', event);
  }
</script>

<template>
  <component
    :is="rootTag"
    :type="interactive ? 'button' : undefined"
    :class="rootClasses"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <div
      v-if="title || description || $slots['header']"
      class="app-card__header"
    >
      <slot name="header">
        <h3
          v-if="title"
          class="app-card__title"
        >
          {{ title }}
        </h3>
        <p
          v-if="description"
          class="app-card__description"
        >
          {{ description }}
        </p>
      </slot>
    </div>
    <div
      v-if="$slots['default']"
      class="app-card__body"
    >
      <slot />
    </div>
    <div
      v-if="$slots['footer']"
      class="app-card__footer"
    >
      <slot name="footer" />
    </div>
  </component>
</template>

<style lang="scss" scoped>
  .app-card {
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: var(--surface-surface);
    border: 1px solid var(--border-default);

    &__header {
      padding: var(--space-4) var(--space-6);
      border-bottom: 1px solid var(--border-default);
    }

    &__title {
      margin: 0;
      font-size: var(--text-lg);
      font-weight: var(--fw-semibold);
      color: var(--text-fg);
    }

    &__description {
      margin: var(--space-1) 0 0;
      font-size: var(--text-sm);
      color: var(--text-fg-muted);
    }

    &__body {
      padding: var(--space-4) var(--space-6);
    }

    &__footer {
      padding: var(--space-4) var(--space-6);
      border-top: 1px solid var(--border-default);
    }

    // Interactive surface — hover lift + focus ring, both token-driven.
    &--interactive {
      cursor: pointer;
      text-align: inherit;
      width: 100%;
      transition:
        box-shadow var(--dur-fast) var(--ease-default),
        transform var(--dur-fast) var(--ease-default);

      &:hover {
        box-shadow: var(--shadow-md);
      }

      &:focus-visible {
        outline: none;
        box-shadow: var(--shadow-focus);
      }
    }
  }
</style>
