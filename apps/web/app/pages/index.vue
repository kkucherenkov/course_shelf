<script setup lang="ts">
  const { t } = useI18n();
</script>

<template>
  <div class="page-home">
    <h1>{{ t('pages.home.title') }}</h1>
  </div>
</template>

<style scoped lang="scss">
  .page-home {
    padding: var(--space-8);
  }
</style>
