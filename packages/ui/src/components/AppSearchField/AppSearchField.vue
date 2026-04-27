<script setup lang="ts">
  import { computed } from 'vue';

  import AppField from '../AppField/AppField.vue';
  import AppIconButton from '../AppIconButton/AppIconButton.vue';
  import AppInput from '../AppInput/AppInput.vue';
  import IconCS from '../IconCS/IconCS.vue';

  type Size = 'sm' | 'md' | 'lg';

  const props = withDefaults(
    defineProps<{
      modelValue: string;
      label: string;
      placeholder?: string;
      help?: string;
      error?: string;
      required?: boolean;
      disabled?: boolean;
      size?: Size;
      /** Aria-label for the clear button. Defaults to "Clear". */
      clearLabel?: string;
    }>(),
    {
      placeholder: undefined,
      help: undefined,
      error: undefined,
      required: false,
      disabled: false,
      size: 'md',
      clearLabel: 'Clear',
    },
  );

  const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

  const hasValue = computed(() => props.modelValue.length > 0);

  // Icon pixel size based on field size
  const iconSize = computed(() => {
    if (props.size === 'sm') return 14;
    if (props.size === 'lg') return 20;
    return 16;
  });

  function clear() {
    emit('update:modelValue', '');
  }
</script>

<template>
  <AppField :label="label" :help="help" :error="error" :required="required" :size="size">
    <template #default="slotAttrs">
      <div class="app-search-field__wrapper">
        <!-- Leading search icon — decorative -->
        <span class="app-search-field__icon-leading" aria-hidden="true">
          <IconCS name="search" :size="iconSize" />
        </span>
        <AppInput
          v-bind="slotAttrs"
          :model-value="modelValue"
          type="search"
          :placeholder="placeholder"
          :disabled="disabled"
          :required="required"
          :size="size ?? 'md'"
          class="app-search-field__input"
          @update:model-value="$emit('update:modelValue', $event)"
        />
        <!-- Trailing clear button — only when there is a value -->
        <span v-if="hasValue" class="app-search-field__clear">
          <!-- ariaLabel is a component prop (exempted from kebab rule in eslint.config.mjs). -->
          <AppIconButton
            name="x"
            variant="ghost"
            :size="size === 'lg' ? 'md' : 'sm'"
            :ariaLabel="clearLabel"
            :disabled="disabled"
            @click="clear"
          />
        </span>
      </div>
    </template>
  </AppField>
</template>

<style scoped lang="scss">
  .app-search-field {
    &__wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    &__icon-leading {
      position: absolute;
      inset-inline-start: var(--space-2);
      display: inline-flex;
      align-items: center;
      color: var(--text-secondary);
      pointer-events: none;
    }

    &__input {
      flex: 1 1 auto;
      // Leave room for the leading icon and optional trailing clear button.
      padding-inline-start: var(--space-6);

      // Widen right padding when clear button is present (handled by wrapper layout).
      // Hide native 'x' — we use our own clear button.
      &::-webkit-search-cancel-button {
        display: none;
      }
    }

    &__clear {
      position: absolute;
      inset-inline-end: var(--space-1);
      display: inline-flex;
      align-items: center;
    }
  }
</style>
