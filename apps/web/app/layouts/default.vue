<script setup lang="ts">
  /**
   * Default app layout.
   *
   * Wraps every page in `AppNavigationShell` (sidebar + topbar + bottom-tab
   * fallback). Single source of truth for navigation; admin pages used to
   * use a separate `admin.vue` shell — that's gone now and they fall
   * through to this layout. The shell renders an extra "Admin" nav block
   * when the signed-in user has the admin role.
   *
   * Pages that should render WITHOUT the shell (sign-in, sign-up, forgot,
   * reset, setup) opt out via `definePageMeta({ layout: false })`. When
   * the user isn't authenticated yet (transient state before the global
   * auth middleware redirects), the layout falls back to a plain `<slot/>`
   * to avoid flashing the shell with an empty avatar.
   */
  import { computed } from 'vue';
  import { AppNavigationShell } from '@app/ui';
  import type { IconName } from '@app/ui';

  import { useAuthStore } from '~/stores/auth';

  // The AppNavigationShell types live alongside its `.vue` file; ESLint's
  // typescript-parser does not resolve types re-exported through `.vue`
  // barrels (the export DOES type-check via tsc — see `nuxt typecheck`).
  // Reproduce the contract locally and reuse the real `IconName` enum so
  // a structural assignment to the shell's prop still type-checks.
  // Keep in sync with
  // `packages/ui/src/components/AppNavigationShell/AppNavigationShell.vue`.
  interface NavItem {
    key: string;
    label: string;
    icon: IconName;
    to?: string | { name: string; params?: Record<string, string> };
  }
  interface ShellUser {
    name: string;
    role?: 'USER' | 'ADMIN' | 'GUEST';
    avatarUrl?: string;
    initials?: string;
  }

  const { t } = useI18n();
  const route = useRoute();
  const authStore = useAuthStore();
  const colorMode = useColorMode();
  const toast = useToast();

  const isAuthenticated = computed(() => authStore.isAuthenticated);
  const isAdmin = computed(() => authStore.user?.role?.toLowerCase() === 'admin');

  // ── Nav items ───────────────────────────────────────────────────────────

  const nav = computed<NavItem[]>(() => [
    { key: 'home', label: t('layouts.default.navHome'), icon: 'home', to: '/' },
    { key: 'browse', label: t('layouts.default.navBrowse'), icon: 'search', to: '/browse' },
    { key: 'libraries', label: t('layouts.default.navLibraries'), icon: 'library', to: '/libraries' },
  ]);

  const adminNav = computed<NavItem[]>(() => {
    if (!isAdmin.value) return [];
    return [
      { key: 'admin-dashboard', label: t('pages.admin.navDashboard'), icon: 'home', to: '/admin' },
      { key: 'admin-libraries', label: t('pages.admin.navLibraries'), icon: 'library', to: '/admin/libraries' },
      { key: 'admin-users', label: t('pages.admin.navUsers'), icon: 'users', to: '/admin/users' },
      { key: 'admin-permissions', label: t('pages.admin.navPermissions'), icon: 'lock', to: '/admin/permissions' },
    ];
  });

  // ── Active route resolver ────────────────────────────────────────────────
  // Map current route.path to a NavItem key. Order matters — admin sub-paths
  // must be checked before the bare `/admin` because `startsWith` would
  // match the parent first.

  const activeRoute = computed<string>(() => {
    const p = route.path;
    if (p.startsWith('/admin/permissions')) return 'admin-permissions';
    if (p.startsWith('/admin/users')) return 'admin-users';
    if (p.startsWith('/admin/libraries')) return 'admin-libraries';
    if (p.startsWith('/admin')) return 'admin-dashboard';
    if (p.startsWith('/libraries')) return 'libraries';
    if (p.startsWith('/browse')) return 'browse';
    if (p.startsWith('/courses')) return 'browse'; // course pages live under /browse conceptually
    return 'home';
  });

  // ── Shell user ───────────────────────────────────────────────────────────

  const shellUser = computed<ShellUser>(() => {
    const u = authStore.user;
    const name = u?.displayName ?? u?.name ?? u?.email ?? '';
    const initials = name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');
    const role = u?.role?.toUpperCase();
    const normalisedRole: 'USER' | 'ADMIN' | 'GUEST' =
      role === 'ADMIN' ? 'ADMIN' : role === 'GUEST' ? 'GUEST' : 'USER';
    return { name, initials, role: normalisedRole };
  });

  // ── Color mode (bound to @nuxtjs/color-mode) ─────────────────────────────

  const shellColorMode = computed<'light' | 'dark'>(() =>
    colorMode.value === 'light' ? 'light' : 'dark',
  );

  function onColorMode(mode: 'light' | 'dark'): void {
    colorMode.preference = mode;
  }

  // ── Search (placeholder until cs-web-browse-search ships) ───────────────

  const searchValue = ref('');

  // ── Event handlers ──────────────────────────────────────────────────────

  function onNav(key: string): void {
    const all: NavItem[] = [...nav.value, ...adminNav.value];
    const item: NavItem | undefined = all.find((i) => i.key === key);
    const target = item?.to;
    if (typeof target !== 'string') return;
    void navigateTo(target);
  }

  function onProfile(): void {
    toast.add({ title: t('layouts.default.profileComingSoon'), color: 'info' });
  }

  function onSettings(): void {
    toast.add({ title: t('layouts.default.settingsComingSoon'), color: 'info' });
  }

  async function onSignOut(): Promise<void> {
    await authStore.signOut();
    await navigateTo('/sign-in');
  }
</script>

<template>
  <AppNavigationShell
    v-if="isAuthenticated"
    v-model:search-value="searchValue"
    :active-route="activeRoute"
    :nav="nav"
    :admin-nav="adminNav"
    :user="shellUser"
    :color-mode="shellColorMode"
    :search-placeholder="t('layouts.default.searchPlaceholder')"
    :brand-name="t('layouts.default.appName')"
    @nav="onNav"
    @update:color-mode="onColorMode"
    @profile="onProfile"
    @settings="onSettings"
    @sign-out="onSignOut"
  >
    <slot />
  </AppNavigationShell>

  <!-- Pre-auth transient: middleware will redirect to /sign-in shortly. -->
  <div v-else class="default-layout-bare">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
  .default-layout-bare {
    min-height: 100dvh;
    background: var(--surface-page);
    color: var(--text-fg);
  }
</style>
