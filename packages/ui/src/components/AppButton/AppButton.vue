<script setup lang="ts">
  import { computed, resolveComponent } from 'vue';
  import type { RouteLocationRaw } from 'vue-router';

  import IconCS, { type IconName } from '../IconCS/IconCS.vue';

  type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
  type Size = 'sm' | 'md' | 'lg';

  const props = withDefaults(
    defineProps<{
      label?: string;
      variant?: Variant;
      size?: Size;
      loading?: boolean;
      disabled?: boolean;
      block?: boolean;
      type?: 'button' | 'submit' | 'reset';
      iconLeading?: IconName;
      iconTrailing?: IconName;
      /**
       * When set, the button renders as a `NuxtLink` so navigation CTAs stay
       * a single anchor instead of a `<button>` nested inside an `<a>`. A
       * `disabled`/`loading` button keeps the native `<button>` so the
       * inactive state and click-guard still apply.
       */
      to?: RouteLocationRaw;
    }>(),
    {
      label: undefined,
      variant: 'primary',
      size: 'md',
      loading: false,
      disabled: false,
      block: false,
      type: 'button',
      iconLeading: undefined,
      iconTrailing: undefined,
      to: undefined,
    },
  );

  const emit = defineEmits<{ click: [event: MouseEvent] }>();

  const isLink = computed(() => Boolean(props.to) && !props.disabled && !props.loading);
  const rootTag = computed(() => (isLink.value ? resolveComponent('NuxtLink') : 'button'));

  const iconPxSize = computed<number>(() => {
    if (props.size === 'sm') return 16;
    if (props.size === 'lg') return 24;
    return 20;
  });

  function onClick(event: MouseEvent): void {
    if (props.loading || props.disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    emit('click', event);
  }
</script>

<template>
  <component
    :is="rootTag"
    :to="isLink ? to : undefined"
    :class="[
      'app-button',
      `app-button--${variant}`,
      `app-button--${size}`,
      { 'app-button--block': block },
    ]"
    :type="isLink ? undefined : type"
    :disabled="isLink ? undefined : loading || disabled"
    :data-loading="loading || undefined"
    :aria-busy="loading || undefined"
    :aria-disabled="loading || disabled || undefined"
    @click="onClick"
  >
    <IconCS
      v-if="iconLeading && !loading"
      :name="iconLeading"
      :size="iconPxSize"
      class="app-button__icon app-button__icon--leading"
    />
    <span v-if="$slots['default'] || label" class="app-button__label">
      <slot>{{ label }}</slot>
    </span>
    <IconCS
      v-if="iconTrailing && !loading"
      :name="iconTrailing"
      :size="iconPxSize"
      class="app-button__icon app-button__icon--trailing"
    />
  </component>
</template>

<style lang="scss" scoped>
  // Button height scale — not in the global token set, owned here.
  $btn-h-sm: 28px;
  $btn-h-md: 36px;
  $btn-h-lg: 44px;
  // Spinner rotation — intentionally faster than --dur-slower; not a UI transition.
  $btn-spin-dur: 650ms;

  .app-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    border: 1px solid transparent;
    border-radius: var(--radius-md);
    font-family: var(--font-sans);
    font-weight: var(--fw-medium);
    cursor: pointer;
    user-select: none;
    text-decoration: none;
    white-space: nowrap;
    transition:
      background-color var(--dur-fast) var(--ease),
      border-color var(--dur-fast) var(--ease),
      color var(--dur-fast) var(--ease),
      box-shadow var(--dur-fast) var(--ease),
      transform var(--dur-fast) var(--ease);

    &:focus-visible {
      outline: 2px solid var(--brand-accent);
      outline-offset: 2px;
    }

    &:active:not([data-loading='true']):not(:disabled) {
      transform: translateY(1px);
    }

    &:disabled,
    &[aria-disabled='true'] {
      opacity: 0.45;
      pointer-events: none;
    }

    // Sizes — heights match the bundle exactly.
    &--sm {
      font-size: var(--text-sm);
      padding: 0 var(--space-3);
      height: $btn-h-sm;
      min-height: $btn-h-sm;
      gap: var(--space-1);
    }

    &--md {
      font-size: var(--text-base);
      padding: 0 var(--space-5);
      height: $btn-h-md;
      min-height: $btn-h-md;
      gap: var(--space-2);
    }

    &--lg {
      font-size: var(--text-lg);
      padding: 0 var(--space-6);
      height: $btn-h-lg;
      min-height: $btn-h-lg;
      gap: var(--space-2);
    }

    &--block {
      display: flex;
      width: 100%;
    }

    // Variants
    // --primary: brand accent fill
    &--primary {
      background-color: var(--brand-accent);
      color: var(--brand-accent-fg);

      &:hover:not(:disabled):not([data-loading='true']) {
        background-color: var(--brand-accent-hover);
      }
    }

    // --secondary: surface fill + border (maps to .btn-secondary from the bundle)
    // --surface-raised acts as "surface-alt" — it is lighter than --surface-surface
    // and is the closest existing token to the bundle's --surface-3 intent for a
    // secondary button background.
    &--secondary {
      background-color: var(--surface-raised);
      color: var(--text-fg);
      border-color: var(--border-default);

      &:hover:not(:disabled):not([data-loading='true']) {
        background-color: var(--surface-surface);
        border-color: var(--border-strong);
      }
    }

    // --ghost: transparent, text-colored
    &--ghost {
      background-color: transparent;
      color: var(--text-fg);

      &:hover:not(:disabled):not([data-loading='true']) {
        background-color: var(--surface-raised);
      }
    }

    // --destructive: danger red fill (maps to .btn-destructive)
    // --status-error-fg is the danger semantic token in the generated CSS.
    &--destructive {
      background-color: var(--status-error-fg);
      color: var(--text-inverse);

      &:hover:not(:disabled):not([data-loading='true']) {
        filter: brightness(1.05);
      }
    }

    // Loading: CSS pseudo-element spinner replaces label region.
    // `color: transparent` hides the text/icons visually while keeping layout.
    // stylelint-disable-next-line declaration-no-important
    &[data-loading='true'] {
      // stylelint-disable-next-line declaration-no-important
      color: transparent !important;
      position: relative;
    }

    &[data-loading='true']::after {
      content: '';
      position: absolute;
      width: 1em;
      height: 1em;
      top: 50%;
      left: 50%;
      margin-top: -0.5em;
      margin-left: -0.5em;
      border: 2px solid currentcolor;
      border-right-color: transparent;
      border-radius: var(--radius-pill);
      animation: app-button-spin $btn-spin-dur linear infinite;
      // Override `color: transparent` for the pseudo-element — spinner needs a
      // real color. We restore the contrast-appropriate value per variant.
      color: var(--brand-accent-fg);
    }

    // Light-variant spinner: use foreground text color for contrast.
    &--secondary[data-loading='true']::after,
    &--ghost[data-loading='true']::after {
      color: var(--text-fg);
    }

    &__icon {
      flex-shrink: 0;
    }

    &__label {
      display: inline-flex;
      align-items: center;
    }
  }

  @keyframes app-button-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
