<script setup lang="ts">
  /**
   * App-wide error boundary (Nuxt's `error.vue` convention).
   *
   * Catches both a page's own thrown/fatal error and Nuxt's built-in 404 for
   * any URL that matches no route — including a stale bookmark or a route a
   * later release removed (e.g. `/libraries`, dead since #674/#665). Without
   * this file Nuxt falls back to its own unstyled error page, which is a
   * bare `<div>` with no landmark at all — every axe run against a dead link
   * failed both `landmark-one-main` and `region` (tuxedo 251).
   *
   * Renders standalone, no `default` layout: that layout's shell assumes an
   * authenticated nav context (`AppNavigationShell`) this state may not have
   * — same call `pages/__tokens.vue` already makes (#590). Own `<main>`
   * landmark instead, so the page stays accessible even when everything
   * else about the app failed to load.
   */
  import { computed } from 'vue';
  import { AppButton } from '@app/ui';
  import type { NuxtError } from '#app';

  const props = defineProps<{ error: NuxtError }>();
  const { t } = useI18n();

  const isNotFound = computed(() => props.error.status === 404);
  const title = computed(() =>
    isNotFound.value ? t('pages.error.notFoundTitle') : t('pages.error.genericTitle'),
  );
  const body = computed(() =>
    isNotFound.value ? t('pages.error.notFoundBody') : t('pages.error.genericBody'),
  );

  function goHome(): void {
    void clearError({ redirect: '/' });
  }
</script>

<template>
  <main class="app-error">
    <h1 class="app-error__title">{{ title }}</h1>
    <p class="app-error__body">{{ body }}</p>
    <AppButton :label="t('pages.error.homeCta')" @click="goHome" />
  </main>
</template>

<style lang="scss" scoped>
  $body-max-w: 480px;

  .app-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);
    min-height: 100vh;
    padding: var(--space-6);
    text-align: center;
    background: var(--surface-page);

    &__title {
      margin: 0;
      font-size: var(--text-2xl);
      font-weight: var(--fw-semibold);
      color: var(--text-loud);
    }

    &__body {
      margin: 0;
      max-width: $body-max-w;
      font-size: var(--text-base);
      color: var(--text-secondary);
    }
  }
</style>
