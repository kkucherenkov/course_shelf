<script setup lang="ts">
  import { computed } from 'vue';

  import { useAuthStore } from '~/stores/auth';

  const { t } = useI18n();
  const route = useRoute();
  const authStore = useAuthStore();

  const isAuthenticated = computed(() => authStore.isAuthenticated);

  const NO_PAD_ROUTES = new Set(['/sign-in', '/setup']);
  const isNoPad = computed(() => NO_PAD_ROUTES.has(route.path));

  async function onSignOut(): Promise<void> {
    await authStore.signOut();
    await navigateTo('/sign-in');
  }
</script>

<template>
  <div class="default-layout">
    <header class="default-layout__header">
      <nav class="default-layout__nav" :aria-label="t('layouts.default.appName')">
        <NuxtLink to="/" class="default-layout__brand">
          {{ t('layouts.default.appName') }}
        </NuxtLink>
        <ul class="default-layout__nav-list">
          <li class="default-layout__nav-item">
            <NuxtLink
              to="/"
              class="default-layout__nav-link"
              :class="{ 'default-layout__nav-link--active': route.path === '/' }"
            >
              {{ t('layouts.default.navHome') }}
            </NuxtLink>
          </li>
          <li v-if="!isAuthenticated" class="default-layout__nav-item">
            <NuxtLink
              to="/sign-in"
              class="default-layout__nav-link"
              :class="{ 'default-layout__nav-link--active': route.path === '/sign-in' }"
            >
              {{ t('layouts.default.navSignIn') }}
            </NuxtLink>
          </li>
          <li v-if="isAuthenticated" class="default-layout__nav-item">
            <button type="button" class="default-layout__nav-link" @click="onSignOut">
              {{ t('layouts.default.navSignOut') }}
            </button>
          </li>
        </ul>
      </nav>
    </header>

    <main class="default-layout__main" :class="{ 'default-layout__main--no-pad': isNoPad }">
      <slot />
    </main>

    <footer class="default-layout__footer">
      <span class="default-layout__footer-copy"
        >&copy; 2026 {{ t('layouts.default.appName') }}</span
      >
    </footer>
  </div>
</template>

<style lang="scss" scoped>
  .default-layout {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
    background: var(--surface-bg);
    color: var(--text-fg);

    &__header {
      position: sticky;
      top: 0;
      z-index: var(--z-sticky);
      background: var(--surface-surface);
      border-bottom: 1px solid var(--border-default);
    }

    &__nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 var(--space-8);
      height: 56px;
    }

    &__brand {
      font-family: var(--font-sans);
      font-size: var(--text-lg);
      font-weight: var(--fw-semibold);
      color: var(--text-fg);
      text-decoration: none;
      letter-spacing: var(--tracking-snug);

      &:hover {
        color: var(--brand-accent);
      }
    }

    &__nav-list {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      list-style: none;
      margin: 0;
      padding: 0;
    }

    &__nav-item {
      display: flex;
    }

    &__nav-link {
      display: inline-flex;
      align-items: center;
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      font-weight: var(--fw-medium);
      color: var(--text-fg-muted);
      text-decoration: none;
      background: none;
      border: none;
      cursor: pointer;
      transition:
        color var(--dur-fast) var(--ease),
        background var(--dur-fast) var(--ease);

      &:hover {
        color: var(--text-fg);
        background: var(--surface-bg-subtle);
      }

      &:focus-visible {
        outline: none;
        box-shadow: var(--shadow-focus);
      }

      &--active {
        color: var(--brand-accent);
        background: var(--brand-accent-soft);

        &:hover {
          color: var(--brand-accent-hover);
          background: var(--brand-accent-soft-hover);
        }
      }
    }

    &__main {
      flex: 1;
      padding: var(--space-8);

      &--no-pad {
        padding: 0;
      }
    }

    &__footer {
      border-top: 1px solid var(--border-soft);
      padding: var(--space-6) var(--space-8);
      text-align: center;
    }

    &__footer-copy {
      font-size: var(--text-xs);
      color: var(--text-fg-disabled);
    }
  }
</style>
