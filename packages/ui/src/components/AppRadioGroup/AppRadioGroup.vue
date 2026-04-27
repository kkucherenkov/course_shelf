<script setup lang="ts" generic="T extends string | number">
  import { computed, provide } from 'vue';

  import type { AppRadioGroupContext } from './context';

  const props = withDefaults(
    defineProps<{
      modelValue: T;
      name: string;
      label?: string;
      disabled?: boolean;
    }>(),
    { label: undefined, disabled: false },
  );

  const emit = defineEmits<{ 'update:modelValue': [value: T] }>();

  // Provide context to AppRadio children.
  provide<AppRadioGroupContext<T>>('app-radio-group', {
    name: computed(() => props.name),
    modelValue: computed(() => props.modelValue),
    disabled: computed(() => props.disabled),
    setValue: (v: T) => {
      emit('update:modelValue', v);
    },
  });
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="label"
    :aria-disabled="disabled || undefined"
    class="app-radio-group"
  >
    <slot />
  </div>
</template>

<style scoped lang="scss">
  .app-radio-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
</style>
