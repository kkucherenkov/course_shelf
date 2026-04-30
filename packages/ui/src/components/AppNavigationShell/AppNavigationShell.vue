<script setup lang="ts">
  import { computed, nextTick, onUnmounted, ref, useSlots } from 'vue';

  import AppAvatar from '../AppAvatar/AppAvatar.vue';
  import AppRow from '../AppRow/AppRow.vue';
  import IconCS from '../IconCS/IconCS.vue';
  import type { IconName } from '../IconCS/IconCS.vue';

  export interface NavItem {
    key: string;
    label: string;
    icon: IconName;
    /**
     * Optional navigation target. The shell does not call a router directly
     * (it stays framework-agnostic). Emit `nav` is fired for every item click;
     * the consumer is responsible for calling `navigateTo()` / `router.push()`.
     */
    to?: string | { name: string; params?: Record<string, string> };
  }

  export interface ShellUser {
    name: string;
    role?: 'USER' | 'ADMIN' | 'GUEST';
    avatarUrl?: string;
    initials?: string;
  }

  const props = withDefaults(
    defineProps<{
      /** Key of the currently active nav item — used to set aria-current="page". */
      activeRoute: string;
      /**
       * Primary nav items. Bottom-tab bar renders the first 5 only
       * (overflow is silently truncated at xs widths).
       */
      nav: NavItem[];
      /**
       * Optional admin nav items. Rendered in a separate section below the
       * primary nav. When the array is empty (default), the admin section is
       * not rendered at all.
       */
      adminNav?: NavItem[];
      user: ShellUser;
      searchValue?: string;
      searchPlaceholder?: string;
      colorMode?: 'light' | 'dark';
      brandName?: string;
      brandMark?: string;
    }>(),
    {
      adminNav: () => [],
      searchValue: '',
      searchPlaceholder: 'Search courses, lessons…',
      colorMode: 'dark',
      brandName: 'CourseShelf',
      brandMark: 'CS',
    },
  );

  const emit = defineEmits<{
    'update:searchValue': [value: string];
    'update:colorMode': [mode: 'light' | 'dark'];
    /** Fired on every nav-item click with the item's key. */
    nav: [key: string];
    /** Fired when Enter is pressed in the search input. */
    searchSubmit: [value: string];
    profile: [];
    settings: [];
    signOut: [];
  }>();

  const slots = useSlots();

  // ── Avatar menu ────────────────────────────────────────────────────────────

  const menuOpen = ref(false);
  const menuRef = ref<HTMLElement | null>(null);
  const menuItems = ref<HTMLElement[]>([]);
  let cleanupClickOutside: (() => void) | null = null;

  function onClickOutside(e: MouseEvent) {
    if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
      closeMenu();
    }
  }

  function openMenu() {
    menuOpen.value = true;
    void nextTick(() => {
      document.addEventListener('mousedown', onClickOutside);
      cleanupClickOutside = () => {
        document.removeEventListener('mousedown', onClickOutside);
      };
      menuItems.value = [
        ...(menuRef.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []),
      ];
    });
  }

  function closeMenu() {
    menuOpen.value = false;
    cleanupClickOutside?.();
    cleanupClickOutside = null;
  }

  function toggleMenu() {
    if (menuOpen.value) closeMenu();
    else openMenu();
  }

  function onMenuKeydown(e: KeyboardEvent) {
    if (!menuOpen.value) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeMenu();
      return;
    }
    const items = menuItems.value;
    if (items.length === 0) return;
    const current = document.activeElement as HTMLElement;
    const idx = items.indexOf(current);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[(idx + 1) % items.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      items[(idx - 1 + items.length) % items.length]?.focus();
    } else if (e.key === 'Enter' && idx !== -1) {
      e.preventDefault();
      items[idx]?.click();
    }
  }

  // ── Event handlers ─────────────────────────────────────────────────────────

  function onNavClick(item: NavItem) {
    emit('nav', item.key);
  }

  function toggleColorMode() {
    emit('update:colorMode', props.colorMode === 'dark' ? 'light' : 'dark');
  }

  function onProfile() {
    emit('profile');
    closeMenu();
  }

  function onSettings() {
    emit('settings');
    closeMenu();
  }

  function onSignOut() {
    emit('signOut');
    closeMenu();
  }

  function onThemeMenuItem() {
    toggleColorMode();
    closeMenu();
  }

  // ── Avatar role mapping ────────────────────────────────────────────────────
  // AppAvatar.role accepts 'admin' | 'guest'. Map ShellUser.role accordingly.
  const avatarRole = computed<'admin' | 'guest' | undefined>(() =>
    props.user.role === 'ADMIN' ? 'admin' : props.user.role === 'GUEST' ? 'guest' : undefined,
  );

  // ── Bottom-tab items (max 5) ───────────────────────────────────────────────
  const bottomTabItems = computed(() => props.nav.slice(0, 5));

  // ── Right-rail slot detection ──────────────────────────────────────────────
  const hasRightRail = computed(() => !!slots['right-rail']);

  onUnmounted(() => {
    cleanupClickOutside?.();
  });
</script>

<template>
  <div class="app-navigation-shell" @keydown="onMenuKeydown">
    <!-- ── Sidebar ──────────────────────────────────────────────────────────── -->
    <aside class="app-navigation-shell__sidebar">
      <!-- Brand -->
      <div class="app-navigation-shell__brand">
        <span class="app-navigation-shell__brand-mark">{{ brandMark }}</span>
        <span class="app-navigation-shell__brand-name">{{ brandName }}</span>
      </div>

      <!-- Primary nav -->
      <nav class="app-navigation-shell__nav" aria-label="Primary navigation">
        <AppRow
          v-for="item in nav"
          :key="item.key"
          :selected="item.key === activeRoute"
          compact
          interactive
          :aria-current="item.key === activeRoute ? 'page' : undefined"
          @click="onNavClick(item)"
        >
          <template #leading>
            <IconCS :name="item.icon" :size="18" />
          </template>
          {{ item.label }}
        </AppRow>
      </nav>

      <!-- Admin nav -->
      <template v-if="adminNav && adminNav.length > 0">
        <div class="app-navigation-shell__admin-section">Admin</div>
        <nav class="app-navigation-shell__nav" aria-label="Admin navigation">
          <AppRow
            v-for="item in adminNav"
            :key="item.key"
            :selected="item.key === activeRoute"
            compact
            interactive
            :aria-current="item.key === activeRoute ? 'page' : undefined"
            @click="onNavClick(item)"
          >
            <template #leading>
              <IconCS :name="item.icon" :size="18" />
            </template>
            {{ item.label }}
          </AppRow>
        </nav>
      </template>

      <span class="app-navigation-shell__sidebar-spacer" />

      <!-- User block -->
      <button
        type="button"
        class="app-navigation-shell__user-block"
        aria-haspopup="menu"
        :aria-expanded="menuOpen ? 'true' : 'false'"
        @click="toggleMenu"
      >
        <AppAvatar
          :image="user.avatarUrl"
          :initials="user.initials"
          :name="user.name"
          :role="avatarRole"
          size="sm"
        />
        <div class="app-navigation-shell__user-info">
          <span class="app-navigation-shell__user-name">{{ user.name }}</span>
          <span class="app-navigation-shell__user-role">{{ user.role ?? 'USER' }}</span>
        </div>
        <IconCS name="settings" :size="16" class="app-navigation-shell__user-settings-icon" />
      </button>
    </aside>

    <!-- ── Right side ──────────────────────────────────────────────────────── -->
    <div class="app-navigation-shell__right">
      <!-- Top bar -->
      <header class="app-navigation-shell__topbar">
        <div class="app-navigation-shell__search">
          <IconCS name="search" :size="16" class="app-navigation-shell__search-icon" />
          <input
            class="app-navigation-shell__search-input"
            :placeholder="searchPlaceholder"
            :value="searchValue"
            @input="emit('update:searchValue', ($event.target as HTMLInputElement).value)"
            @keydown.enter="emit('searchSubmit', ($event.target as HTMLInputElement).value)"
          />
        </div>

        <span class="app-navigation-shell__topbar-spacer" />

        <slot name="actions" />

        <button
          type="button"
          class="app-navigation-shell__theme-toggle"
          :aria-label="`Switch to ${colorMode === 'dark' ? 'light' : 'dark'} mode`"
          @click="toggleColorMode"
        >
          <IconCS :name="colorMode === 'dark' ? 'sun' : 'moon'" :size="16" />
        </button>

        <!-- Avatar trigger (topbar) -->
        <div ref="menuRef" class="app-navigation-shell__avatar-wrap">
          <button
            type="button"
            class="app-navigation-shell__avatar-trigger"
            aria-haspopup="menu"
            :aria-expanded="menuOpen ? 'true' : 'false'"
            @click="toggleMenu"
          >
            <AppAvatar
              :image="user.avatarUrl"
              :initials="user.initials"
              :name="user.name"
              :role="avatarRole"
              size="sm"
            />
          </button>

          <!-- Avatar menu -->
          <div
            v-if="menuOpen"
            class="app-navigation-shell__menu"
            role="menu"
            aria-label="User menu"
          >
            <button
              type="button"
              class="app-navigation-shell__menu-item"
              role="menuitem"
              @click="onProfile"
            >
              <IconCS name="user" :size="16" />
              Profile
            </button>
            <button
              type="button"
              class="app-navigation-shell__menu-item"
              role="menuitem"
              @click="onSettings"
            >
              <IconCS name="settings" :size="16" />
              Settings
            </button>
            <button
              type="button"
              class="app-navigation-shell__menu-item"
              role="menuitem"
              @click="onThemeMenuItem"
            >
              <IconCS :name="colorMode === 'dark' ? 'sun' : 'moon'" :size="16" />
              {{ colorMode === 'dark' ? 'Light mode' : 'Dark mode' }}
            </button>
            <div class="app-navigation-shell__menu-divider" role="separator" />
            <button
              type="button"
              class="app-navigation-shell__menu-item app-navigation-shell__menu-item--danger"
              role="menuitem"
              @click="onSignOut"
            >
              <IconCS name="logout" :size="16" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <!-- Main content -->
      <main
        class="app-navigation-shell__main"
        :class="{ 'app-navigation-shell__main--has-rail': hasRightRail }"
      >
        <div class="app-navigation-shell__main-body">
          <slot />
        </div>
        <aside v-if="hasRightRail" class="app-navigation-shell__main-rail">
          <slot name="right-rail" />
        </aside>
      </main>
    </div>

    <!-- ── Bottom-tab bar (xs only) ────────────────────────────────────────── -->
    <nav class="app-navigation-shell__bottom-tabs" aria-label="Bottom navigation">
      <button
        v-for="item in bottomTabItems"
        :key="item.key"
        type="button"
        class="app-navigation-shell__tab-item"
        :aria-current="item.key === activeRoute ? 'page' : undefined"
        @click="onNavClick(item)"
      >
        <IconCS :name="item.icon" :size="20" />
        <span class="app-navigation-shell__tab-label">{{ item.label }}</span>
      </button>
    </nav>
  </div>
</template>

<style scoped lang="scss">
  // ── Shell root ─────────────────────────────────────────────────────────────
  .app-navigation-shell {
    display: grid;
    grid-template-columns: 240px 1fr;
    grid-template-rows: 1fr;
    min-height: 100vh;
    background: var(--surface-page);
    color: var(--text-fg);
    position: relative;

    // ── Sidebar ────────────────────────────────────────────────────────────
    &__sidebar {
      grid-column: 1;
      grid-row: 1;
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      padding: var(--space-4) var(--space-3);
      border-right: 1px solid var(--border-default);
      background: var(--surface-overlay);
      overflow-y: auto;
    }

    // ── Brand ──────────────────────────────────────────────────────────────
    &__brand {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      margin-bottom: var(--space-2);
    }

    &__brand-mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: var(--radius-sm);
      background: var(--brand-accent);
      color: white;
      font-size: var(--text-xs);
      font-weight: var(--fw-bold);
      flex-shrink: 0;
    }

    &__brand-name {
      font-size: var(--text-sm);
      font-weight: var(--fw-semibold);
      color: var(--text-fg);
      white-space: nowrap;
    }

    // ── Nav ────────────────────────────────────────────────────────────────
    &__nav {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    // ── Admin section label ────────────────────────────────────────────────
    &__admin-section {
      padding: var(--space-3) var(--space-3) var(--space-1);
      font-size: var(--text-xs);
      font-weight: var(--fw-medium);
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    // ── Spacer ────────────────────────────────────────────────────────────
    &__sidebar-spacer {
      flex: 1;
    }

    // ── User block ────────────────────────────────────────────────────────
    &__user-block {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      cursor: pointer;
      width: 100%;
      text-align: left;
      background: transparent;
      border: none;
      color: var(--text-fg);
      transition: background var(--dur-fast) var(--ease-default);

      &:hover {
        background: var(--surface-raised);
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: -2px;
      }
    }

    &__user-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    &__user-name {
      font-size: var(--text-sm);
      color: var(--text-fg);
      font-weight: var(--fw-medium);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &__user-role {
      font-size: var(--text-xs);
      color: var(--text-secondary);
    }

    &__user-settings-icon {
      flex-shrink: 0;
      color: var(--text-secondary);
    }

    // ── Right side (topbar + main) ─────────────────────────────────────────
    &__right {
      grid-column: 2;
      grid-row: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    // ── Top bar ───────────────────────────────────────────────────────────
    &__topbar {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--border-default);
      background: var(--surface-overlay);
      height: 56px;
      flex-shrink: 0;
    }

    &__topbar-spacer {
      flex: 1;
    }

    // ── Search ────────────────────────────────────────────────────────────
    &__search {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      flex: 1;
      max-width: 420px;
      background: var(--surface-raised);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      padding: var(--space-2) var(--space-3);
    }

    &__search-icon {
      flex-shrink: 0;
      color: var(--text-secondary);
    }

    &__search-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: var(--text-fg);
      font-size: var(--text-sm);
      min-width: 0;

      &::placeholder {
        color: var(--text-secondary);
      }
    }

    // ── Theme toggle ──────────────────────────────────────────────────────
    &__theme-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: var(--radius-md);
      background: transparent;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      flex-shrink: 0;
      transition: background var(--dur-fast) var(--ease-default);

      &:hover {
        background: var(--surface-raised);
        color: var(--text-fg);
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: -2px;
      }
    }

    // ── Avatar wrap + menu ────────────────────────────────────────────────
    &__avatar-wrap {
      position: relative;
      flex-shrink: 0;
    }

    &__avatar-trigger {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      padding: 2px;

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 2px;
      }
    }

    &__menu {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      z-index: 100;
      min-width: 180px;
      background: var(--surface-overlay);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-lg);
      padding: var(--space-1);
      box-shadow: 0 8px 24px rgb(0 0 0 / 12%);
    }

    &__menu-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      width: 100%;
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      background: transparent;
      border: none;
      color: var(--text-fg);
      font-size: var(--text-sm);
      cursor: pointer;
      text-align: left;
      transition: background var(--dur-fast) var(--ease-default);

      &:hover {
        background: var(--surface-raised);
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: -2px;
      }

      &--danger {
        color: var(--status-error-fg);
      }
    }

    &__menu-divider {
      height: 1px;
      background: var(--border-default);
      margin: var(--space-1) 0;
    }

    // ── Main content ──────────────────────────────────────────────────────
    &__main {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr;
      overflow: auto;

      &--has-rail {
        grid-template-columns: 1fr 280px;
      }
    }

    &__main-body {
      padding: var(--space-4);
      overflow: auto;
    }

    &__main-rail {
      padding: var(--space-4) var(--space-3);
      border-left: 1px solid var(--border-default);
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
    }

    // ── Bottom-tab bar (xs — hidden at ≥600px by default) ────────────────
    &__bottom-tabs {
      display: none; // shown only at <600px via media query below
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 50;
      height: 64px;
      background: var(--surface-overlay);
      border-top: 1px solid var(--border-default);
      align-items: center;
      justify-content: space-around;
      padding: 0 var(--space-2);
    }

    &__tab-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      flex: 1;
      background: transparent;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      padding: var(--space-2) var(--space-1);
      border-radius: var(--radius-sm);
      transition: color var(--dur-fast) var(--ease-default);

      &[aria-current='page'] {
        color: var(--brand-accent);
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: -2px;
      }
    }

    &__tab-label {
      font-size: 10px;
      line-height: 1.2;
    }
  }

  // ── Responsive ──────────────────────────────────────────────────────────────
  @media (width < 600px) {
    .app-navigation-shell {
      grid-template-columns: 1fr;

      &__sidebar {
        display: none;
      }

      &__right {
        grid-column: 1;
      }

      &__bottom-tabs {
        display: flex;
      }

      &__main {
        padding-bottom: 64px;
      }
    }
  }

  @media (width >= 600px) {
    .app-navigation-shell {
      &__bottom-tabs {
        display: none;
      }
    }
  }
</style>
