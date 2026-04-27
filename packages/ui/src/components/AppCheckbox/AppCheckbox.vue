<script setup lang="ts">
  import { computed } from 'vue';

  const props = withDefaults(
    defineProps<{
      modelValue: boolean;
      label?: string;
      indeterminate?: boolean;
      disabled?: boolean;
      required?: boolean;
    }>(),
    { label: undefined, indeterminate: false, disabled: false, required: false },
  );

  const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();

  // a11y / field-linkage attrs (id, aria-describedby, aria-invalid, aria-required)
  // come in via $attrs from AppField's slot contract. They must land on the <button>
  // itself, so we disable the default root-element fallthrough and spread $attrs manually.
  defineOptions({ inheritAttrs: false });

  const ariaChecked = computed<'true' | 'false' | 'mixed'>(() => {
    if (props.indeterminate) return 'mixed';
    return props.modelValue ? 'true' : 'false';
  });

  function toggle() {
    if (props.disabled) return;
    // From indeterminate → true (consistent with native HTML behaviour).
    emit('update:modelValue', !props.modelValue);
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      toggle();
    }
  }
</script>

<template>
  <label :class="['app-checkbox', { 'app-checkbox--disabled': disabled }]">
    <button
      v-bind="$attrs"
      type="button"
      role="checkbox"
      :class="[
        'app-checkbox__box',
        {
          'app-checkbox__box--checked': modelValue && !indeterminate,
          'app-checkbox__box--indeterminate': indeterminate,
        },
      ]"
      :aria-checked="ariaChecked"
      :aria-disabled="disabled || undefined"
      :disabled="disabled"
      :aria-required="required || undefined"
      @click="toggle"
      @keydown="onKeydown"
    >
      <!-- Visual: checkmark when checked, dash when indeterminate. -->
      <svg v-if="modelValue && !indeterminate" viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M3 8.5l3 3 7-7"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <svg v-else-if="indeterminate" viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M3.5 8h9"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
    </button>
    <span v-if="label || $slots['default']" class="app-checkbox__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<style scoped lang="scss">
  .app-checkbox {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    cursor: pointer;
    user-select: none;

    &__box {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 18px;
      height: 18px;
      border: 1.5px solid var(--border-strong);
      border-radius: var(--radius-sm);
      background: var(--surface-surface);
      color: transparent;
      cursor: pointer;
      padding: 0;
      transition:
        background-color var(--dur-fast) var(--ease),
        border-color var(--dur-fast) var(--ease),
        color var(--dur-fast) var(--ease);

      svg {
        width: 12px;
        height: 12px;
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 2px;
      }

      &--checked,
      &--indeterminate {
        background: var(--brand-accent);
        border-color: var(--brand-accent);
        color: var(--brand-accent-fg);
      }
    }

    &__label {
      font-size: var(--text-sm);
      color: var(--text-fg);
    }

    &--disabled {
      cursor: not-allowed;
      opacity: var(--opacity-disabled);
    }
  }
</style>
