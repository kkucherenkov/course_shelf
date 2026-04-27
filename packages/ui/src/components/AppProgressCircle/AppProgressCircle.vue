<script setup lang="ts">
  import { computed } from 'vue';

  const props = withDefaults(
    defineProps<{
      /** 0..100 */
      value: number;
      /** Diameter in pixels. Default 32. */
      size?: number;
      /** Stroke width in pixels. Default 3. */
      stroke?: number;
      /** aria-label for screen readers. */
      label?: string;
    }>(),
    { size: 32, stroke: 3, label: undefined },
  );

  const radius = computed(() => (props.size - props.stroke) / 2);
  const circumference = computed(() => 2 * Math.PI * radius.value);
  const offset = computed(
    () => circumference.value * (1 - Math.max(0, Math.min(100, props.value)) / 100),
  );
  const center = computed(() => props.size / 2);
</script>

<template>
  <svg
    :width="size"
    :height="size"
    :viewBox="`0 0 ${size} ${size}`"
    class="app-progress-circle"
    role="progressbar"
    :aria-label="label"
    :aria-valuemin="0"
    :aria-valuemax="100"
    :aria-valuenow="value"
  >
    <circle
      :cx="center"
      :cy="center"
      :r="radius"
      class="app-progress-circle__track"
      :stroke-width="stroke"
    />
    <circle
      :cx="center"
      :cy="center"
      :r="radius"
      class="app-progress-circle__fill"
      :stroke-width="stroke"
      :stroke-dasharray="circumference"
      :stroke-dashoffset="offset"
      stroke-linecap="round"
    />
  </svg>
</template>

<style scoped lang="scss">
  // Bundle .progress-circle contract parity.
  // Token substitutions:
  //   --surface-3  → --surface-overlay  (ships as alias --surface-3)
  //   --primary    → --brand-accent     (ships as alias)
  //   --d-slow     → --dur-slow         (ships as alias)
  //   --e-out      → --ease-out         (ships as alias)

  // Rotated -90deg so the arc starts at the 12-o'clock position.
  .app-progress-circle {
    transform: rotate(-90deg);
  }

  .app-progress-circle__track {
    fill: none;
    stroke: var(--surface-overlay); // bundle --surface-3
  }

  .app-progress-circle__fill {
    fill: none;
    stroke: var(--brand-accent); // bundle --primary
    transition: stroke-dashoffset var(--dur-slow) var(--ease-out);
  }
</style>
