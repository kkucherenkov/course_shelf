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
   * there is no bearer token at all (transient state before the global
   * auth middleware redirects to /sign-in), the layout falls back to a
   * plain `<slot/>` to avoid flashing the shell with an empty avatar.
   *
   * Shell visibility gates on the *token*, not the hydrated profile (#602).
   * A live token with `user === null` is exactly the transient/degraded
   * state `auth.global.ts` deliberately passes through on a 429/5xx from
   * get-session (#581) rather than signing the session out — the token is
   * the closer-to-the-truth signal of "this person is signed in", and
   * gating on `user` instead made the whole nav vanish under a backend
   * hiccup even though the session was still good. `shellUser` degrades
   * gracefully to an empty name/initials for that brief window; nothing
   * downstream crashes on it.
   */
  import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
  import { AppNavigationShell, AppCommandPalette } from '@app/ui';
  import type { IconName, Command } from '@app/ui';

  import { useAuthStore } from '~/stores/auth';
  import { useScanLifecycle } from '~/composables/useScanLifecycle';

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
    roleLabel?: string;
    avatarUrl?: string;
    initials?: string;
  }
  type ColorMode = 'light' | 'dark' | 'system';

  const { t, locale, locales, setLocale } = useI18n();
  const route = useRoute();
  const authStore = useAuthStore();
  const colorMode = useColorMode();

  // Subscribe to Centrifugo scan lifecycle events for the authenticated user.
  useScanLifecycle();

  // Shell visibility — see the layout-level doc comment above (#602).
  const hasSession = computed(() => authStore.token !== null);
  const isAdmin = computed(() => authStore.user?.role?.toLowerCase() === 'admin');

  // ── Nav items ───────────────────────────────────────────────────────────

  const nav = computed<NavItem[]>(() => [
    { key: 'home', label: t('layouts.default.navHome'), icon: 'home', to: '/' },
    { key: 'browse', label: t('layouts.default.navBrowse'), icon: 'search', to: '/browse' },
    {
      key: 'libraries',
      label: t('layouts.default.navLibraries'),
      icon: 'library',
      to: '/libraries',
    },
  ]);

  const adminNav = computed<NavItem[]>(() => {
    if (!isAdmin.value) return [];
    return [
      { key: 'admin-dashboard', label: t('pages.admin.navDashboard'), icon: 'home', to: '/admin' },
      {
        key: 'admin-libraries',
        label: t('pages.admin.navLibrariesManage'),
        icon: 'library',
        to: '/admin/libraries',
      },
      { key: 'admin-users', label: t('pages.admin.navUsers'), icon: 'users', to: '/admin/users' },
      {
        key: 'admin-identify-tasks',
        label: t('pages.admin.navIdentifyTasks'),
        icon: 'list',
        to: '/admin/identify-tasks',
      },
      {
        key: 'admin-permissions',
        label: t('pages.admin.navPermissions'),
        icon: 'lock',
        to: '/admin/permissions',
      },
      {
        key: 'admin-backups',
        label: t('pages.admin.navBackups'),
        icon: 'download',
        to: '/admin/backups',
      },
    ];
  });

  // ── Active route resolver ────────────────────────────────────────────────
  // Map current route.path to a NavItem key. Order matters — admin sub-paths
  // must be checked before the bare `/admin` because `startsWith` would
  // match the parent first.

  const activeRoute = computed<string>(() => {
    const p = route.path;
    if (p.startsWith('/admin/backups')) return 'admin-backups';
    if (p.startsWith('/admin/permissions')) return 'admin-permissions';
    if (p.startsWith('/admin/identify-tasks')) return 'admin-identify-tasks';
    if (p.startsWith('/admin/users')) return 'admin-users';
    if (p.startsWith('/admin/libraries')) return 'admin-libraries';
    if (p.startsWith('/admin')) return 'admin-dashboard';
    if (p.startsWith('/libraries')) return 'libraries';
    if (p.startsWith('/search')) return 'browse'; // search is scoped under browse conceptually
    if (p.startsWith('/browse')) return 'browse';
    if (p.startsWith('/courses')) return 'browse'; // course pages live under /browse conceptually
    // No nav item is keyed 'settings' (it's reachable only via the avatar
    // menu / user-block gear icon) — matching nothing here is the point: it
    // stops /settings from falling through to the 'home' default below and
    // lighting up "Home" while looking at Settings.
    if (p.startsWith('/settings')) return 'settings';
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
    const roleLabel =
      normalisedRole === 'ADMIN'
        ? t('ui.nav.roleAdmin')
        : normalisedRole === 'GUEST'
          ? t('ui.nav.roleGuest')
          : t('ui.nav.roleUser');
    return { name, initials, role: normalisedRole, roleLabel };
  });

  // ── Color mode (bound to @nuxtjs/color-mode) ─────────────────────────────
  // `colorMode.value` is the *resolved* light/dark — it can never read
  // "system" back out, even when that's the stored preference. Reading
  // `preference` instead is what lets the topbar toggle show/cycle through
  // "System" rather than silently overwriting it on the first click.

  const shellColorMode = computed<ColorMode>(() => {
    const pref = colorMode.preference;
    return pref === 'light' || pref === 'system' ? pref : 'dark';
  });

  function onColorMode(mode: ColorMode): void {
    colorMode.preference = mode;
  }

  // The topbar toggle's icon always shows the state a click switches *to*
  // (see AppNavigationShell's own comment on this) — which means the state
  // it's currently IN was never announced anywhere (#597). Composing the
  // static action label with the current state's existing translated word
  // reuses `ui.nav.theme*` as-is; no new copy.
  const themeToggleAriaLabel = computed<string>(() => {
    const current =
      shellColorMode.value === 'light'
        ? t('ui.nav.themeLight')
        : shellColorMode.value === 'system'
          ? t('ui.nav.themeSystem')
          : t('ui.nav.themeDark');
    return `${t('ui.nav.themeToggle')}: ${current}`;
  });

  // ── Locale switch (#607) ──────────────────────────────────────────────────
  // No prefix-based locale routing (`strategy: 'no_prefix'`), so switching
  // locale is just `setLocale()` — it also persists to the `i18n_locale`
  // cookie `detectBrowserLanguage` reads. A locale's own name is never
  // translated (English is called "English" no matter what UI language is
  // active), which is why this needs no `t()` key.
  const otherLocale = computed<{ code: string; name: string } | undefined>(() => {
    const other = locales.value.find((l) => l.code !== locale.value);
    return other?.name ? { code: other.code, name: other.name } : undefined;
  });

  function onLocaleChange(code: string): void {
    // The shell's `update:locale` contract is a bare `string` (the UI
    // package has no notion of this app's configured locales); `code` here
    // always came from `locales.value` a moment earlier in `otherLocale`,
    // so it's safe to hand back to `setLocale`'s narrower, generated union.
    void setLocale(code as Parameters<typeof setLocale>[0]);
  }

  // ── Search ───────────────────────────────────────────────────────────────

  const searchValue = ref('');

  // One-way bind: when route navigates to /search?q=..., reflect in the shell.
  watch(
    () => route.query.q,
    (q) => {
      if (route.path === '/search') {
        searchValue.value = typeof q === 'string' ? q : '';
      }
    },
    { immediate: true },
  );

  function onSearchSubmit(): void {
    const q = searchValue.value.trim();
    if (q.length < 2) return;
    void navigateTo({ path: '/search', query: { q } });
  }

  // ── Event handlers ──────────────────────────────────────────────────────

  function onNav(key: string): void {
    const all: NavItem[] = [...nav.value, ...adminNav.value];
    const item: NavItem | undefined = all.find((i) => i.key === key);
    const target = item?.to;
    if (typeof target !== 'string') return;
    void navigateTo(target);
  }

  function onProfile(): void {
    void navigateTo('/settings#section-profile');
  }

  function onSettings(): void {
    void navigateTo('/settings');
  }

  async function onSignOut(): Promise<void> {
    await authStore.signOut();
    await navigateTo('/sign-in');
  }

  // ── Command palette (#607) ──────────────────────────────────────────────
  // Built, storied, spec'd — mounted nowhere. Commands reuse the same
  // translated labels the sidebar/topbar already compute; no new copy for
  // the entries themselves, only for the palette chrome (title/placeholder/
  // empty state — genuinely new surface, see `ui.commandPalette.*`).

  interface PaletteCommand extends Command {
    to?: string;
    run?: () => void;
  }

  const paletteOpen = ref(false);
  // Stays false until the palette is opened for the first time, then stays
  // true forever after — see `onGlobalKeydown` for why. Mounting
  // AppCommandPalette unconditionally would leave its AppDialog's native
  // `<dialog class="app-dialog">` permanently in the DOM (closed, but
  // present): every other page that locates `.app-dialog` by itself
  // (e.g. course-detail's reset-progress confirm) started resolving to two
  // elements — a strict-mode Playwright violation, not a visual one — the
  // moment this shell rendered on their page too.
  const paletteMounted = ref(false);

  const paletteCommands = computed<PaletteCommand[]>(() => {
    const navGroup = t('ui.nav.primary');
    const adminGroup = t('ui.nav.admin');
    // No `icon` here: `NavItem.icon` is typed `IconName`, which — like the
    // rest of this file's `NavItem`/`ShellUser` — eslint's typescript parser
    // can't resolve through the `.vue` re-export chain (see the doc comment
    // at the top of this file). Command icons are decorative; dropping them
    // avoids fighting a known parser limitation for zero functional loss.
    const fromNav = (items: NavItem[], group: string): PaletteCommand[] =>
      items
        .filter((item): item is NavItem & { to: string } => typeof item.to === 'string')
        .map((item) => ({ id: `nav-${item.key}`, label: item.label, to: item.to, group }));

    const actions: PaletteCommand[] = [
      { id: 'action-profile', label: t('ui.nav.profile'), run: onProfile },
      { id: 'action-settings', label: t('ui.nav.settings'), run: onSettings },
      { id: 'action-sign-out', label: t('ui.nav.signOut'), run: () => void onSignOut() },
    ];

    return [...fromNav(nav.value, navGroup), ...fromNav(adminNav.value, adminGroup), ...actions];
  });

  function onPaletteSelect(command: Command): void {
    const cmd = command as PaletteCommand;
    if (cmd.to) void navigateTo(cmd.to);
    else cmd.run?.();
  }

  function onGlobalKeydown(event: KeyboardEvent): void {
    if (!hasSession.value) return;
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (!paletteMounted.value) {
        // First open: mount closed, then flip `open` on the next tick so
        // AppDialog's own `watch(() => props.open)` — which is not
        // `immediate` — sees an actual false→true transition and calls
        // `showModal()`. Born-open would otherwise never call it.
        paletteMounted.value = true;
        void nextTick(() => {
          paletteOpen.value = true;
        });
      } else {
        paletteOpen.value = !paletteOpen.value;
      }
    }
  }

  onMounted(() => {
    globalThis.addEventListener('keydown', onGlobalKeydown);
  });
  onUnmounted(() => {
    globalThis.removeEventListener('keydown', onGlobalKeydown);
  });
</script>

<template>
  <AppNavigationShell
    v-if="hasSession"
    v-model:search-value="searchValue"
    :active-route="activeRoute"
    :nav="nav"
    :admin-nav="adminNav"
    :user="shellUser"
    :color-mode="shellColorMode"
    :search-placeholder="t('layouts.default.searchPlaceholder')"
    :brand-name="t('layouts.default.appName')"
    :primary-nav-label="t('ui.nav.primary')"
    :admin-label="t('ui.nav.admin')"
    :admin-nav-label="t('ui.nav.adminNav')"
    :user-menu-label="t('ui.nav.userMenu')"
    :bottom-nav-label="t('ui.nav.bottom')"
    :more-label="t('ui.nav.more')"
    :close-label="t('ui.nav.close')"
    :profile-label="t('ui.nav.profile')"
    :settings-label="t('ui.nav.settings')"
    :sign-out-label="t('ui.nav.signOut')"
    :theme-light-label="t('ui.nav.themeLight')"
    :theme-dark-label="t('ui.nav.themeDark')"
    :theme-system-label="t('ui.nav.themeSystem')"
    :theme-toggle-label="themeToggleAriaLabel"
    :other-locale="otherLocale"
    @nav="onNav"
    @update:color-mode="onColorMode"
    @update:locale="onLocaleChange"
    @search-submit="onSearchSubmit"
    @profile="onProfile"
    @settings="onSettings"
    @sign-out="onSignOut"
  >
    <slot />
  </AppNavigationShell>

  <!-- Floating scan lifecycle notifier — fixed position, sits above everything. -->
  <ScanLifecycleNotifier v-if="hasSession" />

  <!-- Cmd/Ctrl+K (#607) — lazily mounted, see `paletteMounted`'s comment. -->
  <AppCommandPalette
    v-if="hasSession && paletteMounted"
    v-model:open="paletteOpen"
    :commands="paletteCommands"
    :title="t('ui.commandPalette.title')"
    :placeholder="t('ui.commandPalette.placeholder')"
    :empty-label="t('ui.commandPalette.empty')"
    @select="onPaletteSelect"
  />

  <!-- No token at all: middleware will redirect to /sign-in shortly.
       Explicit condition, not `v-else` — three other elements above each
       carry their own `v-if`, and `v-else` binds to whichever one is
       textually adjacent, not to `hasSession` specifically. That silently
       repointed itself at `AppCommandPalette`'s `v-if` when it was added,
       which is `false` until the palette's first open — making this branch
       render even with a live session. -->
  <main v-if="!hasSession" class="default-layout-bare">
    <slot />
  </main>
</template>

<style lang="scss" scoped>
  .default-layout-bare {
    min-height: 100dvh;
    background: var(--surface-page);
    color: var(--text-fg);
  }
</style>
