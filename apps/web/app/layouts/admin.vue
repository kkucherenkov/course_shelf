<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useAuthStore } from '~/stores/auth';

  const { t } = useI18n();
  const route = useRoute();
  const authStore = useAuthStore();

  // Derive page title from the route — injected by pages via provide or
  // derived from meta. Pages set `pageTitle` via provide('adminPageTitle', …).
  const injectedTitle = inject<Ref<string> | string>('adminPageTitle', '');
  const pageTitle = computed(() => {
    if (typeof injectedTitle === 'string') return injectedTitle;
    return injectedTitle.value;
  });

  const mobileMenuOpen = ref(false);

  function toggleMobileMenu(): void {
    mobileMenuOpen.value = !mobileMenuOpen.value;
  }

  const userInitials = computed(() => {
    const name = authStore.user?.displayName ?? authStore.user?.name ?? authStore.user?.email ?? '';
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');
  });

  interface NavItem {
    key: string;
    labelKey: string;
    icon: string;
    to: string;
    disabled: boolean;
  }

  const navItems: NavItem[] = [
    { key: 'dashboard', labelKey: 'pages.admin.navDashboard', icon: 'i-heroicons-home', to: '/admin', disabled: false },
    { key: 'libraries', labelKey: 'pages.admin.navLibraries', icon: 'i-heroicons-building-library', to: '/admin/libraries', disabled: true },
    { key: 'users', labelKey: 'pages.admin.navUsers', icon: 'i-heroicons-users', to: '/admin/users', disabled: true },
    { key: 'permissions', labelKey: 'pages.admin.navPermissions', icon: 'i-heroicons-lock-closed', to: '/admin/permissions', disabled: true },
  ];

  function isActive(item: NavItem): boolean {
    if (item.key === 'dashboard') return route.path === '/admin' || route.path === '/admin/';
    return route.path.startsWith(item.to);
  }
</script>

<template>
  <div class="adm-layout">
    <!-- Sidebar — hidden on xs, icons-only on md, full on lg -->
    <aside class="adm-layout__side" :class="{ 'adm-layout__side--open': mobileMenuOpen }">
      <div class="adm-layout__brand">
        <div class="adm-layout__brand-mark">CS</div>
        <span class="adm-layout__brand-name">CourseShelf</span>
      </div>

      <nav :aria-label="t('pages.admin.layoutCrumb')">
        <template v-for="item in navItems" :key="item.key">
          <NuxtLink
            v-if="!item.disabled"
            :to="item.to"
            class="adm-layout__nav-item"
            :class="{ 'adm-layout__nav-item--active': isActive(item) }"
            :aria-current="isActive(item) ? 'page' : undefined"
          >
            <span :class="item.icon" class="adm-layout__nav-icon" aria-hidden="true" />
            <span class="adm-layout__nav-label">{{ t(item.labelKey) }}</span>
          </NuxtLink>
          <span
            v-else
            class="adm-layout__nav-item adm-layout__nav-item--disabled"
            aria-disabled="true"
            :title="t('pages.admin.comingSoon')"
          >
            <span :class="item.icon" class="adm-layout__nav-icon" aria-hidden="true" />
            <span class="adm-layout__nav-label">{{ t(item.labelKey) }}</span>
          </span>
        </template>
      </nav>
    </aside>

    <!-- Main content area -->
    <div class="adm-layout__main">
      <!-- Topbar -->
      <header class="adm-layout__topbar">
        <button
          type="button"
          class="adm-layout__menu-btn"
          :aria-label="t('pages.admin.layoutCrumb')"
          @click="toggleMobileMenu"
        >
          <span class="i-heroicons-bars-3" aria-hidden="true" />
        </button>

        <nav class="adm-layout__crumbs" aria-label="breadcrumb">
          <span class="adm-layout__crumb">{{ t('pages.admin.layoutCrumb') }}</span>
          <span v-if="pageTitle" class="adm-layout__crumb-sep" aria-hidden="true">
            <span class="i-heroicons-chevron-right" />
          </span>
          <span v-if="pageTitle" class="adm-layout__crumb adm-layout__crumb--active">
            {{ pageTitle }}
          </span>
        </nav>

        <div class="adm-layout__avatar" :aria-label="authStore.user?.name ?? authStore.user?.email">
          {{ userInitials }}
        </div>
      </header>

      <!-- Page content -->
      <main class="adm-layout__content">
        <slot />
      </main>
    </div>

    <!-- Mobile overlay -->
    <div
      v-if="mobileMenuOpen"
      class="adm-layout__overlay"
      aria-hidden="true"
      @click="mobileMenuOpen = false"
    />
  </div>
</template>

<style lang="scss" scoped>
  // ── Named SCSS variables for fixed-dimension UI chrome ───────────────────────
  // Stylelint rule: raw px (>= 3) in layout properties must use named SCSS vars.
  $side-md: 64px;
  $side-lg: 220px;
  $brand-mark-size: 22px;
  $avatar-size: 28px;
  $menu-btn-size: 32px;
  $nav-icon-size: 16px;
  $dur-nav: var(--dur-fast, 120ms);

  // ── Layout shell ────────────────────────────────────────────────────────────
  .adm-layout {
    display: grid;
    min-height: 100dvh;
    grid-template-columns: 1fr; // xs: no sidebar
    background: var(--surface-surface);
    color: var(--text-fg);

    @media (min-width: 768px) {
      // md: icons-only sidebar
      grid-template-columns: $side-md 1fr;
    }

    @media (min-width: 1024px) {
      // lg: full sidebar
      grid-template-columns: $side-lg 1fr;
    }
  }

  // ── Sidebar ─────────────────────────────────────────────────────────────────
  .adm-layout__side {
    display: none; // hidden on xs
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-3) var(--space-2);
    background: var(--surface-surface);
    border-right: 1px solid var(--border-default);
    position: sticky;
    top: 0;
    height: 100dvh;
    overflow-y: auto;

    @media (min-width: 768px) {
      display: flex;
    }

    // Mobile open state — slides in as a drawer
    &--open {
      display: flex;
      position: fixed;
      inset: 0 auto 0 0;
      width: $side-lg;
      z-index: var(--z-modal);
      box-shadow: var(--shadow-lg);
    }
  }

  // ── Brand mark ──────────────────────────────────────────────────────────────
  .adm-layout__brand {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--border-default);
    margin-bottom: var(--space-2);
  }

  .adm-layout__brand-mark {
    flex-shrink: 0;
    width: $brand-mark-size;
    height: $brand-mark-size;
    border-radius: var(--radius-sm);
    background: linear-gradient(135deg, var(--brand-accent), var(--brand-accent-hover));
    display: grid;
    place-items: center;
    color: var(--brand-accent-fg);
    font-weight: 700;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
  }

  .adm-layout__brand-name {
    font-weight: 600;
    color: var(--text-loud);
    font-size: var(--text-sm);
    white-space: nowrap;
    overflow: hidden;

    // hidden at md (icons-only)
    @media (min-width: 768px) and (max-width: 1023px) {
      display: none;
    }
  }

  // ── Nav items ────────────────────────────────────────────────────────────────
  .adm-layout__nav-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--text-muted);
    text-decoration: none;
    cursor: pointer;
    border-left: 2px solid transparent;
    transition:
      color $dur-nav ease,
      background $dur-nav ease,
      border-color $dur-nav ease;

    &:hover:not(&--disabled) {
      color: var(--text-loud);
      background: var(--surface-raised);
    }

    &:focus-visible {
      outline: 2px solid var(--brand-accent);
      outline-offset: 2px;
    }

    &--active {
      color: var(--brand-accent);
      background: var(--brand-accent-soft);
      border-left-color: var(--brand-accent);
    }

    &--disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    // md: center icons, hide labels
    @media (min-width: 768px) and (max-width: 1023px) {
      justify-content: center;
      padding: var(--space-3) var(--space-2);

      .adm-layout__nav-label {
        display: none;
      }
    }
  }

  .adm-layout__nav-icon {
    flex-shrink: 0;
    width: $nav-icon-size;
    height: $nav-icon-size;
  }

  // ── Main column ──────────────────────────────────────────────────────────────
  .adm-layout__main {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
  }

  // ── Topbar ───────────────────────────────────────────────────────────────────
  .adm-layout__topbar {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    border-bottom: 1px solid var(--border-default);
    background: var(--surface-surface);
    position: sticky;
    top: 0;
    z-index: var(--z-sticky);
  }

  .adm-layout__menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: $menu-btn-size;
    height: $menu-btn-size;
    border: none;
    background: none;
    border-radius: var(--radius-md);
    color: var(--text-muted);
    cursor: pointer;

    &:hover {
      background: var(--surface-raised);
      color: var(--text-loud);
    }

    &:focus-visible {
      outline: 2px solid var(--brand-accent);
      outline-offset: 2px;
    }

    // hide on md+ (sidebar is always visible)
    @media (min-width: 768px) {
      display: none;
    }
  }

  .adm-layout__crumbs {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    flex: 1;
    min-width: 0;
    font-size: var(--text-sm);
    color: var(--text-muted);
  }

  .adm-layout__crumb-sep {
    display: flex;
    align-items: center;
    color: var(--text-subtle);
    font-size: var(--text-sm);
  }

  .adm-layout__crumb {
    &--active {
      color: var(--text-loud);
      font-weight: 500;
    }
  }

  .adm-layout__avatar {
    flex-shrink: 0;
    width: $avatar-size;
    height: $avatar-size;
    border-radius: 50%;
    background: var(--brand-accent);
    color: var(--brand-accent-fg);
    display: grid;
    place-items: center;
    font-size: var(--text-xs);
    font-weight: 600;
    font-family: var(--font-mono);
    user-select: none;

    // hidden on xs
    @media (max-width: 767px) {
      display: none;
    }
  }

  // ── Content area ─────────────────────────────────────────────────────────────
  .adm-layout__content {
    flex: 1;
    padding: var(--space-5);
    min-width: 0;

    @media (max-width: 767px) {
      padding: var(--space-4);
    }
  }

  // ── Mobile overlay ───────────────────────────────────────────────────────────
  .adm-layout__overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: color-mix(in srgb, transparent, var(--surface-overlay) 72%);
    z-index: var(--z-overlay);

    @media (max-width: 767px) {
      display: block;
    }
  }
</style>
