<script setup lang="ts">
  import { computed } from 'vue';

  type Size = 'md' | 'lg';

  const props = withDefaults(
    defineProps<{
      title?: string;
      description?: string;
      /**
       * Bundle size: `md` matches `.card` (`--radius-md`, 16px padding);
       * `lg` matches `.card-lg` (`--radius-lg`, 24px padding).
       */
      size?: Size;
      /**
       * Visual hover affordance without focusability — matches the bundle's
       * `.card-hover`. Stays a `<div>`. Ignored when `interactive` is true
       * (interactive already supplies a richer hover).
       */
      hoverable?: boolean;
      /**
       * Renders the card as a focusable, clickable `<button>` with
       * keyboard activation (Enter/Space) and a focus ring. Emits `click`.
       */
      interactive?: boolean;
    }>(),
    {
      title: undefined,
      description: undefined,
      size: 'md',
      hoverable: false,
      interactive: false,
    },
  );

  const emit = defineEmits<{
    click: [event: Event];
  }>();

  const rootTag = computed(() => (props.interactive ? 'button' : 'div'));
  const rootClasses = computed(() => [
    'app-card',
    `app-card--${props.size}`,
    {
      'app-card--interactive': props.interactive,
      'app-card--hoverable': props.hoverable && !props.interactive,
    },
  ]);

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
    <div v-if="title || description || $slots['header']" class="app-card__header">
      <slot name="header">
        <h3 v-if="title" class="app-card__title">
          {{ title }}
        </h3>
        <p v-if="description" class="app-card__description">
          {{ description }}
        </p>
      </slot>
    </div>
    <div v-if="$slots['default']" class="app-card__body">
      <slot />
    </div>
    <div v-if="$slots['footer']" class="app-card__footer">
      <slot name="footer" />
    </div>
  </component>
</template>

<style lang="scss" scoped>
  // Bundle .card / .card-lg / .card-hover parity. Sizes match the bundle's
  // uniform-padding contract; hoverable is a non-focusable visual lift.
  .app-card {
    overflow: hidden;
    background: var(--surface-surface);
    border: 1px solid var(--border-default);
    transition:
      border-color var(--dur-fast) var(--ease-default),
      background-color var(--dur-fast) var(--ease-default);

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

    // size: md (matches .card — 16px uniform, --radius-md)
    &--md {
      border-radius: var(--radius-md);

      .app-card__header,
      .app-card__body,
      .app-card__footer {
        padding: var(--space-4);
      }

      .app-card__header {
        border-bottom: 1px solid var(--border-default);
      }

      .app-card__footer {
        border-top: 1px solid var(--border-default);
      }
    }

    // size: lg (matches .card-lg — 24px uniform, --radius-lg)
    &--lg {
      border-radius: var(--radius-lg);

      .app-card__header,
      .app-card__body,
      .app-card__footer {
        padding: var(--space-5);
      }

      .app-card__header {
        border-bottom: 1px solid var(--border-default);
      }

      .app-card__footer {
        border-top: 1px solid var(--border-default);
      }
    }

    // .card-hover — visual lift on hover, stays a <div>. Skipped when the
    // card is interactive (its own hover is richer).
    &--hoverable:hover {
      border-color: var(--border-strong);
      background: var(--surface-raised);
    }

    // Interactive surface — focusable button + hover lift + focus ring.
    &--interactive {
      cursor: pointer;
      text-align: inherit;
      width: 100%;
      transition:
        border-color var(--dur-fast) var(--ease-default),
        background-color var(--dur-fast) var(--ease-default),
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
