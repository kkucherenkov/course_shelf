<script lang="ts">
  /** A single choice rendered inside the dropdown. */
  export interface AppSelectOption {
    id: string;
    label: string;
    disabled?: boolean;
  }

  // Opt out of the default root-level $attrs merge so id / aria-* attrs from a
  // parent (e.g. AppField's slot props) land on the inner <select> — that's
  // where the assistive tech reads them.
  export default { inheritAttrs: false };
</script>

<script setup lang="ts">
  import { computed, useAttrs } from 'vue';

  type Size = 'sm' | 'md' | 'lg';

  const props = withDefaults(
    defineProps<{
      /** Id of the currently selected option. `null` means "no selection" (placeholder shown). */
      modelValue: string | null;
      /** Options to render. IDs must be unique. */
      options: readonly AppSelectOption[];
      /** Shown when `modelValue` is null. Translated by the consumer. */
      placeholder?: string;
      /** Size scale — drives padding + text-size tokens. */
      size?: Size;
      /** When true, the trigger is non-interactive and reads as disabled to assistive tech. */
      disabled?: boolean;
    }>(),
    { placeholder: undefined, size: 'md', disabled: false },
  );

  const emit = defineEmits<{
    'update:modelValue': [value: string];
  }>();

  // `$attrs` goes onto the inner <select> so id / aria-describedby / aria-invalid
  // / aria-required forwarded by AppField's slot props land on the actual
  // interactive element.
  const attrs = useAttrs();

  const rootClasses = computed(() => [
    'app-select',
    `app-select--${props.size}`,
    { 'app-select--disabled': props.disabled },
  ]);

  // A stable sentinel for the "no selection" <option> — keeps happy-dom from
  // printing "__APP_SELECT_PLACEHOLDER__" anywhere it leaks, while letting the
  // change handler recognise the non-real value and ignore it.
  const PLACEHOLDER_VALUE = '';

  function onChange(event: Event): void {
    if (props.disabled) return;
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    const next = target.value;
    if (next === PLACEHOLDER_VALUE) return;
    if (next === props.modelValue) return;
    emit('update:modelValue', next);
  }

  // Normalise `modelValue: null` to the placeholder sentinel so the underlying
  // native <select> reflects the "no selection" state. A selected id always
  // wins — even if it doesn't match a currently-known option id (the browser
  // renders the trigger empty, consumer can reconcile upstream).
  const boundValue = computed<string>(() => props.modelValue ?? PLACEHOLDER_VALUE);
</script>

<template>
  <div :class="rootClasses">
    <select
      v-bind="attrs"
      class="app-select__control"
      :value="boundValue"
      :disabled="disabled"
      :aria-disabled="disabled ? 'true' : undefined"
      @change="onChange"
    >
      <!-- Placeholder sits as a disabled, hidden option so it shows on the
           trigger until the user makes a real choice. -->
      <option v-if="placeholder !== undefined" :value="PLACEHOLDER_VALUE" disabled hidden>
        {{ placeholder }}
      </option>
      <option
        v-for="option in options"
        :key="option.id"
        :value="option.id"
        :disabled="option.disabled"
      >
        {{ option.label }}
      </option>
    </select>
    <!-- Decorative caret — real chevron token would live in tokens.generated.
         Uses currentColor so it tracks the text colour, stays out of the a11y
         tree via aria-hidden. -->
    <span class="app-select__chevron" aria-hidden="true">
      <svg viewBox="0 0 12 12" width="12" height="12" fill="none">
        <path
          d="M3 4.5l3 3 3-3"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>
  </div>
</template>

<style lang="scss" scoped>
  // Control heights, mirroring AppInput / bundle .input. Intrinsic component
  // geometry, so named literals rather than --space-* steps.
  $control-height-sm: 28px;
  $control-height-md: 36px;
  $control-height-lg: 44px;
  $control-height-compact: 30px;

  // Chevron clearance = the caret's inset-inline-end (--space-3/4/6 per size)
  // + the 12px glyph + an 8px gap, so the value text never runs under it.
  // Previously var(--space-10/12/14) — a phantom scale this repo never
  // emitted, so the declarations were invalid and every size fell back to the
  // symmetric padding-inline, letting long values collide with the caret.
  $chevron-clearance-sm: 32px; // 12 + 12 + 8
  $chevron-clearance-md: 36px; // 16 + 12 + 8
  $chevron-clearance-lg: 44px; // 24 + 12 + 8

  .app-select {
    position: relative;
    display: inline-flex;
    width: 100%;

    &__control {
      flex: 1 1 auto;
      width: 100%;
      padding-block: var(--space-3);
      padding-inline: var(--space-4);
      padding-inline-end: $chevron-clearance-md;
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      background: var(--surface-surface);
      color: var(--text-fg);
      font-family: var(--font-sans);
      font-size: var(--text-md);
      font-weight: var(--fw-regular);
      line-height: var(--leading-normal);
      appearance: none;
      cursor: pointer;
      transition:
        border-color var(--dur-fast) var(--ease-default),
        box-shadow var(--dur-fast) var(--ease-default);

      &:hover:not(:disabled) {
        border-color: var(--border-strong);
      }

      &:focus-visible {
        outline: none;
        border-color: var(--brand-accent);
        box-shadow: var(--shadow-focus);
      }

      &[aria-invalid='true'] {
        // --status-danger is not a shipped token; use --status-error-fg (same alias as AppField).
        border-color: var(--status-error-fg);
      }

      &:disabled {
        color: var(--text-disabled);
        cursor: not-allowed;
        background: var(--surface-raised);
      }
    }

    &__chevron {
      position: absolute;
      top: 50%;
      inset-inline-end: var(--space-4);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      pointer-events: none;
      transform: translateY(-50%);
    }

    /* ----- sizes — explicit pixel heights matching AppInput / bundle .input ----- */
    &--sm {
      .app-select__control {
        height: $control-height-sm;
        padding-block: 0;
        padding-inline: var(--space-3);
        padding-inline-end: $chevron-clearance-sm;
        font-size: var(--text-sm);
      }

      .app-select__chevron {
        inset-inline-end: var(--space-3);
      }
    }

    &--md {
      .app-select__control {
        height: $control-height-md;
        padding-block: 0;
        padding-inline: var(--space-3);
        padding-inline-end: $chevron-clearance-md;
        font-size: var(--text-md);
      }
    }

    &--lg {
      .app-select__control {
        height: $control-height-lg;
        padding-block: 0;
        padding-inline: var(--space-4);
        padding-inline-end: $chevron-clearance-lg;
        font-size: var(--text-md);
      }

      .app-select__chevron {
        inset-inline-end: var(--space-6);
      }
    }

    &--disabled {
      cursor: not-allowed;
    }
  }

  // Compact density — mirrors [data-density="compact"] .input → 30px height.
  :global([data-density='compact']) .app-select--md .app-select__control {
    height: $control-height-compact;
  }
</style>
