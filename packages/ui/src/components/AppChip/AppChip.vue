<script setup lang="ts">
  import { computed, resolveComponent } from 'vue';
  import type { RouteLocationRaw } from 'vue-router';

  import IconCS, { type IconName } from '../IconCS/IconCS.vue';

  type Variant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  type Size = 'sm' | 'md' | 'lg';

  const props = withDefaults(
    defineProps<{
      label?: string;
      variant?: Variant;
      size?: Size;
      icon?: IconName;
      removable?: boolean;
      selected?: boolean;
      disabled?: boolean;
      /** If set, chip renders as a NuxtLink instead of a button. */
      to?: RouteLocationRaw;
    }>(),
    {
      label: undefined,
      variant: 'default',
      size: 'md',
      icon: undefined,
      removable: false,
      selected: false,
      disabled: false,
      to: undefined,
    },
  );

  const emit = defineEmits<{
    click: [event: MouseEvent];
    remove: [event: Event];
  }>();

  const isLink = computed(() => Boolean(props.to) && !props.disabled);
  const rootTag = computed(() => (isLink.value ? resolveComponent('NuxtLink') : 'button'));

  const rootClasses = computed(() => [
    'app-chip',
    `app-chip--${props.variant}`,
    `app-chip--${props.size}`,
    {
      'app-chip--selected': props.selected,
      'app-chip--disabled': props.disabled,
      'app-chip--removable': props.removable,
    },
  ]);

  // Icon pixel size — one step smaller than the chip so the glyph doesn't crowd the label.
  const iconPx = computed<number>(() => {
    if (props.size === 'sm') return 10;
    if (props.size === 'lg') return 14;
    return 12;
  });

  function handleClick(event: MouseEvent): void {
    if (props.disabled) return;
    emit('click', event);
  }

  function handleRemove(event: Event): void {
    if (props.disabled) return;
    // Prevent the remove click from bubbling up as a chip click.
    event.stopPropagation();
    emit('remove', event);
  }
</script>

<template>
  <component
    :is="rootTag"
    :to="to"
    :type="isLink ? undefined : 'button'"
    :class="rootClasses"
    :disabled="isLink ? undefined : disabled"
    :aria-pressed="selected ? 'true' : undefined"
    :aria-disabled="disabled ? 'true' : undefined"
    @click="handleClick"
  >
    <IconCS v-if="icon" :name="icon" :size="iconPx" class="app-chip__icon" />
    <span v-if="$slots['default'] || label" class="app-chip__label">
      <slot>{{ label }}</slot>
    </span>
    <span
      v-if="removable"
      class="app-chip__remove"
      role="button"
      tabindex="0"
      aria-label="Remove"
      @click="handleRemove"
      @keydown.enter.prevent="handleRemove"
      @keydown.space.prevent="handleRemove"
    >
      <IconCS name="x" :size="iconPx" />
    </span>
  </component>
</template>

<style lang="scss" scoped>
  // Chip metrics sit between --space-* steps (4/8/12…), so they are named
  // SCSS variables holding the same literals.
  $chip-gap: 6px;
  $chip-height-sm: 18px;
  $chip-height-md: 22px;
  $chip-height-lg: 28px;

  .app-chip {
    display: inline-flex;
    align-items: center;
    gap: $chip-gap;
    height: $chip-height-md;
    padding: 0 var(--space-2);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-pill);
    background: var(--surface-overlay);
    color: var(--text-fg);
    font-family: var(--font-sans);
    font-weight: var(--fw-medium);
    font-size: var(--text-sm);
    line-height: var(--leading-snug);
    text-decoration: none;
    cursor: pointer;
    transition:
      background-color var(--dur-fast) var(--ease-default),
      border-color var(--dur-fast) var(--ease-default),
      color var(--dur-fast) var(--ease-default);

    &:focus-visible {
      outline: none;
      box-shadow: var(--shadow-focus);
    }

    &__icon {
      flex-shrink: 0;
    }

    &__label {
      display: inline-flex;
      align-items: center;
    }

    &__remove {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-inline-start: 2px;
      padding: 2px;
      border-radius: var(--radius-pill);
      color: currentcolor;
      cursor: pointer;
      transition: background-color var(--dur-fast) var(--ease-default);

      // Was rgba(0, 0, 0, 0.08): a theme-blind tint that all but vanished on
      // the dark palette. --surface-raised is the library's hover fill.
      &:hover {
        background-color: var(--surface-raised);
      }

      &:focus-visible {
        outline: none;
        box-shadow: var(--shadow-focus);
      }
    }

    /* ----- sizes ----- */
    &--sm {
      height: $chip-height-sm;
      padding: 0 var(--space-1);
      font-size: var(--text-xs);
    }

    &--md {
      height: $chip-height-md;
      padding: 0 var(--space-2);
      font-size: var(--text-sm);
    }

    &--lg {
      height: $chip-height-lg;
      padding: 0 var(--space-3);
      font-size: var(--text-md);
    }

    /* ----- flat variant axis ----- */
    // default: neutral chip with surface-overlay background (base styles above)

    &--primary {
      background: var(--brand-accent-soft);
      color: var(--brand-accent-hover);
      border-color: transparent;
    }

    &--success {
      background: var(--status-success-soft);
      color: var(--status-success-fg);
      border-color: transparent;
    }

    &--warning {
      background: var(--status-warning-soft);
      color: var(--status-warning-fg);
      border-color: transparent;
    }

    &--error {
      background: var(--status-error-soft);
      color: var(--status-error-fg);
      border-color: transparent;
    }

    &--info {
      background: var(--status-info-soft);
      color: var(--status-info-fg);
      border-color: transparent;
    }

    /* ----- selected / disabled ----- */
    &--selected {
      border-color: var(--brand-accent);
      box-shadow: inset 0 0 0 1px var(--brand-accent);
    }

    &--disabled {
      cursor: not-allowed;
      opacity: var(--opacity-disabled);

      .app-chip__remove {
        cursor: not-allowed;
      }
    }
  }
</style>
