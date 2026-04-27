<script setup lang="ts" generic="T extends string | number">
  import { computed, provide } from 'vue';

  const props = defineProps<{
    modelValue: T;
    /** aria-label for the radiogroup element. */
    label?: string;
  }>();

  const emit = defineEmits<{ 'update:modelValue': [value: T] }>();

  provide('app-segmented', {
    modelValue: computed(() => props.modelValue),
    setValue: (v: T) => {
      emit('update:modelValue', v);
    },
  });
</script>

<template>
  <div role="radiogroup" :aria-label="label" class="app-segmented">
    <slot />
  </div>
</template>

<style scoped lang="scss">
  // Bundle .seg container parity.
  // Token substitutions:
  //   --surface-2  → --surface-raised  (ships as alias)
  //   --border     → --border-default  (ships as alias)
  //   --radius-md  → --radius-md       (ships verbatim)
  .app-segmented {
    display: inline-flex;
    padding: 2px;
    background: var(--surface-raised); // bundle --surface-2
    border: 1px solid var(--border-default); // bundle --border
    border-radius: var(--radius-md);
  }
</style>
