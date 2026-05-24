<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue';
  import { AppBanner } from '@app/ui';

  /**
   * Owns the lockout countdown only; the parent renders the (localized,
   * formatted) message via the default slot using the exposed `remaining`
   * seconds. Keeping the copy in the parent avoids both i18n inside the
   * component and the previous double-rendered "{prefix} {n}s {n}s" bug.
   */
  const props = defineProps<{ retryAfterSec: number }>();

  const emit = defineEmits<{ expired: [] }>();

  const remaining = ref(props.retryAfterSec);
  let timer: ReturnType<typeof setInterval> | null = null;

  onMounted(() => {
    timer = setInterval(() => {
      remaining.value -= 1;
      if (remaining.value <= 0) {
        if (timer !== null) clearInterval(timer);
        emit('expired');
      }
    }, 1000);
  });

  onUnmounted(() => {
    if (timer !== null) clearInterval(timer);
  });
</script>

<template>
  <AppBanner variant="warning">
    <slot :remaining="remaining" />
  </AppBanner>
</template>
