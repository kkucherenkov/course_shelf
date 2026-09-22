<script setup lang="ts">
  /**
   * Root component.
   *
   * Owns the two document-level things every page needs and none of them can
   * set for themselves without duplicating logic in every page file:
   *  - `<html lang>`, which has to track the active locale rather than a
   *    build-time constant (#589) — a fixed `lang` reads Cyrillic with
   *    English pronunciation rules once the user switches to `ru`.
   *  - `<title>`, resolved from the route so every screen gets a distinct,
   *    meaningful tab title (#589) instead of the app falling back to
   *    whatever `index.html` shipped with. The map below reuses each page's
   *    own existing `pages.*.title` key — no page file needs to call
   *    `useHead` itself, which matters because most of them belong to other
   *    lanes this wave.
   *
   * Routes with no natural single-noun title (course detail, lesson player —
   * both are named from data, not a static string) fall through to the bare
   * app name. Good enough to distinguish "Sign in" from "Browse"; a
   * data-driven title for those two is a follow-up, not this ticket.
   */
  import { computed } from 'vue';

  const { t, locale } = useI18n();
  const route = useRoute();

  // Ordered most-specific-first, same convention as `layouts/default.vue`'s
  // `activeRoute` resolver — a prefix match on a parent route would otherwise
  // win before its more specific child gets a chance.
  const TITLE_ROUTES: { test: (path: string) => boolean; key: string }[] = [
    { test: (p) => p === '/', key: 'pages.home.title' },
    { test: (p) => p === '/sign-in', key: 'pages.signIn.title' },
    { test: (p) => p === '/sign-up', key: 'pages.signUp.title' },
    { test: (p) => p === '/forgot', key: 'pages.forgot.title' },
    { test: (p) => p === '/reset', key: 'pages.reset.title' },
    { test: (p) => p === '/settings', key: 'pages.settings.title' },
    { test: (p) => p === '/search', key: 'pages.search.title' },
    { test: (p) => p === '/browse', key: 'pages.browse.title' },
    // Both reuse an existing key rather than adding a title-only duplicate
    // (#779) — `pages.flashcards.review.title` is already this screen's H1
    // and its sidebar nav label; `pages.admin.scrapers.title` already names
    // the page the same way `pages.admin.libraries.title` does below.
    { test: (p) => p === '/flashcards/review', key: 'pages.flashcards.review.title' },
    { test: (p) => p.startsWith('/admin/scrapers'), key: 'pages.admin.scrapers.title' },
    {
      test: (p) => p.startsWith('/courses/') && p.endsWith('/edit'),
      key: 'pages.courseEdit.title',
    },
    { test: (p) => p.startsWith('/admin/backups'), key: 'pages.admin.backups.title' },
    { test: (p) => p.startsWith('/admin/permissions'), key: 'pages.admin.permissions.title' },
    {
      test: (p) => p.startsWith('/admin/identify-tasks/'),
      key: 'pages.admin.identifyTaskDetail.title',
    },
    { test: (p) => p.startsWith('/admin/identify-tasks'), key: 'pages.admin.identifyTasks.title' },
    { test: (p) => p.startsWith('/admin/users'), key: 'pages.admin.users.title' },
    { test: (p) => p.startsWith('/admin/libraries'), key: 'pages.admin.libraries.title' },
    { test: (p) => p === '/admin', key: 'pages.admin.dashboard.title' },
  ];

  const pageTitle = computed<string | undefined>(() => {
    const path = route.path.length > 1 ? route.path.replace(/\/+$/, '') : route.path;
    const match = TITLE_ROUTES.find((r) => r.test(path));
    return match ? t(match.key) : undefined;
  });

  useHead(() => ({
    htmlAttrs: { lang: locale.value },
    title: pageTitle.value,
    titleTemplate: (title) =>
      title ? `${title} · ${t('layouts.default.appName')}` : t('layouts.default.appName'),
  }));
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
