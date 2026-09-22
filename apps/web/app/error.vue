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
   * A 404 with a live session wraps in the `default` layout (#778) — the
   * audit found it losing the whole shell (no sidebar, no search, no
   * language switch) for what is usually just a typo in the address bar.
   * A *fatal* error (this file's other branch — a real crash, not a route
   * miss) stays standalone on purpose: the shell itself may be part of what
   * broke, and `AppNavigationShell`'s data (`user`, nav) assumes a working
   * session this state may not have — same call `pages/__tokens.vue` already
   * makes (#590) for the no-session case below.
   *
   * `useHead` is set directly in this file rather than relying on
   * `app.vue`'s route-keyed title table: this page can render without
   * `app.vue`'s own tree ever mounting (Nuxt substitutes the error boundary
   * for a fatal/404 before the normal page tree runs), which is why the
   * audit found this route's `<title>` literally empty rather than falling
   * back to the brand name the way an ordinary untitled route does.
   */
  import { computed } from 'vue';
  import { AppButton } from '@app/ui';
  import type { NuxtError } from '#app';

  import { useAuthStore } from '~/stores/auth';

  const props = defineProps<{ error: NuxtError }>();
  const { t } = useI18n();
  const authStore = useAuthStore();

  const isNotFound = computed(() => props.error.status === 404);
  // Same gate `layouts/default.vue` uses for shell visibility (#602) — a
  // live token, not the hydrated profile, since that's the closer-to-the-
  // truth "this person is signed in" signal.
  const hasSession = computed(() => authStore.token !== null);
  const title = computed(() =>
    isNotFound.value ? t('pages.error.notFoundTitle') : t('pages.error.genericTitle'),
  );
  const body = computed(() =>
    isNotFound.value ? t('pages.error.notFoundBody') : t('pages.error.genericBody'),
  );

  useHead(() => ({
    title: title.value,
    titleTemplate: (pageTitle) =>
      pageTitle ? `${pageTitle} · ${t('layouts.default.appName')}` : t('layouts.default.appName'),
  }));

  function goHome(): void {
    void clearError({ redirect: '/' });
  }
</script>

<template>
  <NuxtLayout v-if="isNotFound && hasSession" name="default">
    <main class="app-error">
      <h1 class="app-error__title">{{ title }}</h1>
      <p class="app-error__body">{{ body }}</p>
      <AppButton :label="t('pages.error.homeCta')" @click="goHome" />
    </main>
  </NuxtLayout>
  <main v-else class="app-error">
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
