<script setup lang="ts">
  import { computed } from 'vue';

  import IconCS, { type IconName } from '../IconCS/IconCS.vue';

  type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
  type Size = 'sm' | 'md' | 'lg';

  const props = withDefaults(
    defineProps<{
      name: IconName;
      ariaLabel: string;
      variant?: Variant;
      size?: Size;
      loading?: boolean;
      disabled?: boolean;
      type?: 'button' | 'submit' | 'reset';
    }>(),
    { variant: 'primary', size: 'md', loading: false, disabled: false, type: 'button' },
  );

  const emit = defineEmits<{ click: [event: MouseEvent] }>();

  const iconPx = computed<number>(() => {
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
  <button
    :class="['app-icon-button', `app-icon-button--${variant}`, `app-icon-button--${size}`]"
    :type="type"
    :aria-label="ariaLabel"
    :disabled="loading || disabled"
    :data-loading="loading || undefined"
    :aria-busy="loading || undefined"
    :aria-disabled="loading || disabled || undefined"
    @click="onClick"
  >
    <IconCS
      v-if="!loading"
      :name="name"
      :size="iconPx"
    />
  </button>
</template>

<style lang="scss" scoped>
  // Square size scale — not in the global token set, owned here.
  $icon-btn-sm: 28px;
  $icon-btn-md: 36px;
  $icon-btn-lg: 44px;
  // Spinner rotation — intentionally faster than --dur-slower; not a UI transition.
  $icon-btn-spin-dur: 650ms;

  .app-icon-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent;
    border-radius: var(--radius-md);
    cursor: pointer;
    user-select: none;
    flex-shrink: 0;
    padding: 0;
    transition:
      background-color var(--dur-fast) var(--ease),
      border-color var(--dur-fast) var(--ease),
      color var(--dur-fast) var(--ease),
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

    // Square sizes — width === height matching the bundle's .btn-icon.btn-{sm,lg}
    &--sm {
      width: $icon-btn-sm;
      height: $icon-btn-sm;
    }

    &--md {
      width: $icon-btn-md;
      height: $icon-btn-md;
    }

    &--lg {
      width: $icon-btn-lg;
      height: $icon-btn-lg;
    }

    // Variants — same palette as AppButton
    &--primary {
      background-color: var(--brand-accent);
      color: var(--brand-accent-fg);

      &:hover:not(:disabled):not([data-loading='true']) {
        background-color: var(--brand-accent-hover);
      }
    }

    &--secondary {
      background-color: var(--surface-raised);
      color: var(--text-fg);
      border-color: var(--border-default);

      &:hover:not(:disabled):not([data-loading='true']) {
        background-color: var(--surface-surface);
        border-color: var(--border-strong);
      }
    }

    &--ghost {
      background-color: transparent;
      color: var(--text-fg);

      &:hover:not(:disabled):not([data-loading='true']) {
        background-color: var(--surface-raised);
      }
    }

    &--destructive {
      background-color: var(--status-error-fg);
      color: var(--text-inverse);

      &:hover:not(:disabled):not([data-loading='true']) {
        filter: brightness(1.05);
      }
    }

    // Loading spinner replaces the icon center-out via ::after pseudo-element.
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
      animation: app-icon-button-spin $icon-btn-spin-dur linear infinite;
      color: var(--brand-accent-fg);
    }

    &--secondary[data-loading='true']::after,
    &--ghost[data-loading='true']::after {
      color: var(--text-fg);
    }
  }

  @keyframes app-icon-button-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
