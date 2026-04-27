<script setup lang="ts" generic="T extends string | number">
  import { computed, provide } from 'vue';

  const props = defineProps<{
    modelValue: T;
    /** aria-label for the tablist element. */
    label?: string;
  }>();

  const emit = defineEmits<{ 'update:modelValue': [value: T] }>();

  provide('app-tabs', {
    modelValue: computed(() => props.modelValue),
    setValue: (v: T) => {
      emit('update:modelValue', v);
    },
  });
</script>

<template>
  <div role="tablist" :aria-label="label" class="app-tabs">
    <slot />
  </div>
</template>

<style scoped lang="scss">
  // Bundle .tabs contract parity.
  // Token substitutions:
  //   --border → --border-default  (ships as alias)
  .app-tabs {
    display: inline-flex;
    gap: 0;
    border-bottom: 1px solid var(--border-default);
  }
</style>
