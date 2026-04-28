<script setup lang="ts">
  import { ref, onMounted, onUnmounted, computed } from 'vue';
  import { AppBanner } from '@app/ui';

  const props = defineProps<{
    retryAfterSec: number;
    bodyPrefix?: string;
  }>();

  const emit = defineEmits<{ expired: [] }>();

  const remaining = ref(props.retryAfterSec);
  let timer: ReturnType<typeof setInterval> | null = null;

  const displayText = computed(() => {
    const prefix = props.bodyPrefix ?? '';
    const sec = String(remaining.value);
    return `${prefix} ${sec}s`.trim();
  });

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
  <AppBanner variant="warning" :body="displayText" />
</template>
