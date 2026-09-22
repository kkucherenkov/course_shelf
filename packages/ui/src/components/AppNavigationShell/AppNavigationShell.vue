<script setup lang="ts">
  import { computed, nextTick, onUnmounted, ref, useSlots } from 'vue';

  import AppAvatar from '../AppAvatar/AppAvatar.vue';
  import AppBadge from '../AppBadge/AppBadge.vue';
  import AppDialog from '../AppDialog/AppDialog.vue';
  import AppRow from '../AppRow/AppRow.vue';
  import AppSegmented from '../AppSegmented/AppSegmented.vue';
  import AppSegmentedItem from '../AppSegmentedItem/AppSegmentedItem.vue';
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
    /**
     * Optional count badge (e.g. due flashcards). Omit, `undefined` or `0`
     * renders no badge — a permanent nav entry with a badge that appears
     * only when there's something to act on.
     */
    badge?: number;
  }

  export interface ShellUser {
    name: string;
    role?: 'USER' | 'ADMIN' | 'GUEST';
    /** Translated display text for `role` — e.g. "Administrator". Rendered
     * as-is; the shell never translates `role` itself. */
    roleLabel?: string;
    avatarUrl?: string;
    initials?: string;
  }

  type ColorMode = 'light' | 'dark' | 'system';
  const props = withDefaults(
    defineProps<{
      /** Key of the currently active nav item — used to set aria-current="page". */
      activeRoute: string;
      /**
       * Primary nav items. The bottom-tab bar (xs widths) renders the first 4
       * (or all 5, if none of `nav`/`adminNav` overflow) plus an overflow
       * "More" tab that opens the full nav — primary and admin — in a dialog.
       * Nothing is ever silently unreachable at xs widths.
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
      colorMode?: ColorMode;
      brandName?: string;
      brandMark?: string;
      /** Landmark and menu names; override to translate. */
      primaryNavLabel?: string;
      adminNavLabel?: string;
      /**
       * Accessible name for the avatar-menu `role="menu"` popover, also used
       * as the desktop avatar-trigger button's `aria-label` (#630): the
       * button renders only an avatar image/initials, with no text a screen
       * reader can read as its name. Required, not defaulted, for the same
       * reason as `sidebarLabel`/`rightRailLabel` above — an English default
       * would let a forgotten translation ship silently instead of failing
       * at the type/prop-validation level.
       */
      userMenuLabel: string;
      bottomNavLabel?: string;
      /**
       * The shell renders two <aside> landmarks (the sidebar and the optional
       * right rail). Two unnamed landmarks of the same role are an axe
       * `landmark-unique` failure and are indistinguishable in a screen
       * reader's landmark list, so each carries its own name.
       *
       * Required, not defaulted (#623): every other label on this component
       * has an English fallback a caller can silently skip, which is fine
       * for cosmetic copy but wrong here — a landmark name a caller forgot
       * to translate is a broken screen-reader landmark list, not a stray
       * English word, and it went unnoticed through two prior audits
       * specifically because the fallback made the gap invisible. Skipping
       * either prop is now a Vue prop-validation warning and a type error
       * at every call site, not a silent English default.
       */
      sidebarLabel: string;
      rightRailLabel: string;
      /** Visible heading over the admin section; override to translate. */
      adminLabel?: string;
      /** Overflow bottom-tab label + title of the nav dialog it opens. */
      moreLabel?: string;
      /** Dismiss button aria-label on the overflow nav dialog. */
      closeLabel?: string;
      /** Avatar-menu item labels. */
      profileLabel?: string;
      settingsLabel?: string;
      signOutLabel?: string;
      /**
       * Words for the three theme states, shared by the avatar-menu theme
       * item (as the text of the state a click switches *to*) and by the
       * topbar toggle's icon selection.
       */
      themeLightLabel?: string;
      themeDarkLabel?: string;
      themeSystemLabel?: string;
      /** Static aria-label for the icon-only topbar theme toggle. */
      themeToggleLabel?: string;
      /** aria-label for the language switch; it has no visible caption. */
      localeSwitchLabel?: string;
      /**
       * Every locale this deployment ships, in display order. Rendered as a
       * segmented control so the current language is visible as state rather
       * than inferred from a button that names a different one. Each `name` is
       * that locale's own name (e.g. "Русский"), never translated — a
       * language's name is not relative to whatever language is active. Fewer
       * than two entries hides the control: there is nothing to switch.
       */
      locales?: readonly { code: string; name: string }[];
      /** Which of `locales` is active. */
      locale?: string;
      /**
       * The light/dark the viewer is actually looking at, which is NOT the
       * same as `colorMode`: that one stores the preference and may say
       * `system`. The topbar toggle flips relative to what is on screen, so it
       * needs this. `apps/web` has both for free — Nuxt's `useColorMode()`
       * exposes `.value` (resolved) and `.preference` (stored).
       */
      resolvedColorMode?: 'light' | 'dark';
    }>(),
    {
      adminNav: () => [],
      searchValue: '',
      searchPlaceholder: 'Search courses, lessons…',
      colorMode: 'dark',
      brandName: 'CourseShelf',
      brandMark: 'CS',
      primaryNavLabel: 'Primary navigation',
      adminNavLabel: 'Admin navigation',
      bottomNavLabel: 'Bottom navigation',
      adminLabel: 'Admin',
      moreLabel: 'More',
      closeLabel: 'Close',
      profileLabel: 'Profile',
      settingsLabel: 'Settings',
      signOutLabel: 'Sign out',
      themeLightLabel: 'Light',
      themeDarkLabel: 'Dark',
      themeSystemLabel: 'System',
      themeToggleLabel: 'Toggle color theme',
      localeSwitchLabel: 'Language',
      locales: () => [],
      locale: '',
      resolvedColorMode: 'dark',
    },
  );

  const emit = defineEmits<{
    'update:searchValue': [value: string];
    'update:colorMode': [mode: ColorMode];
    /** Fired with the chosen locale's code. */
    'update:locale': [code: string];
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

  // Each sidebar/overflow row below also carries `:to` (#780), so a plain
  // click already navigates via a real `<a href>`; `emit('nav', ...)` still
  // fires alongside it so the consumer's existing `navigateTo()` wiring
  // keeps working unchanged. A modified click (new tab, middle-click,
  // copy-link) is handled entirely by the anchor itself — NuxtLink does not
  // preventDefault or push in that case — so the emit here is a same-page,
  // same-tab no-op underneath it, never a swallowed modifier click.
  function onNavClick(item: NavItem) {
    emit('nav', item.key);
    closeMobileNav();
  }

  // ── Theme cycle (light → dark → system → …) ───────────────────────────────
  // A binary toggle can only set an explicit light/dark preference, so it
  // silently destroys "follow system" the moment it's clicked once — there
  // was no way back to it from here. The topbar icon and the avatar-menu
  // item both show/act on the state a click switches *to*, same convention
  // the binary toggle used.

  // Binary by design: the topbar is the flip-on-the-fly control, and Settings
  // owns the full three-way choice including `system` (settings.vue already
  // renders all three in an AppSegmented). A three-step cycle in the topbar
  // made `system` reachable only by passing through it, and the icon showed
  // the state a click switches *to* — the same misleading convention the
  // language button used, and the reason both were reported.
  //
  // `resolvedColorMode`, not `colorMode`: when the stored preference is
  // `system` the click has to flip away from what is actually on screen. A
  // toggle keyed on the preference would emit `dark` while the viewer already
  // sees dark and nothing would appear to happen.
  const oppositeColorMode = computed<'light' | 'dark'>(() =>
    props.resolvedColorMode === 'dark' ? 'light' : 'dark',
  );

  // The icon names the state you are IN, not the one you are going to. Its
  // accessible name carries the action, so nothing is lost.
  const themeToggleIcon = computed<IconName>(() =>
    props.resolvedColorMode === 'dark' ? 'moon' : 'sun',
  );

  function toggleColorMode() {
    emit('update:colorMode', oppositeColorMode.value);
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

  // ── Avatar role mapping ────────────────────────────────────────────────────
  // AppAvatar.role accepts 'admin' | 'guest'. Map ShellUser.role accordingly.
  const avatarRole = computed<'admin' | 'guest' | undefined>(() =>
    props.user.role === 'ADMIN' ? 'admin' : props.user.role === 'GUEST' ? 'guest' : undefined,
  );

  // ── Bottom-tab items (max 5, minus 1 reserved for "More" on overflow) ──────
  // Admin nav never fits in 5 tabs and was previously dropped outright below
  // 600px — the whole /admin surface (#568). Any nav item beyond the first 4
  // now has a way out: the "More" tab opens everything in a dialog instead
  // of the bar silently truncating.
  const showMoreTab = computed(() => props.adminNav.length > 0 || props.nav.length > 5);
  const bottomTabItems = computed(() => props.nav.slice(0, showMoreTab.value ? 4 : 5));

  // ── Mobile nav overflow dialog ──────────────────────────────────────────────
  const mobileNavOpen = ref(false);

  function closeMobileNav() {
    mobileNavOpen.value = false;
  }

  // ── Right-rail slot detection ──────────────────────────────────────────────
  const hasRightRail = computed(() => !!slots['right-rail']);

  onUnmounted(() => {
    cleanupClickOutside?.();
  });
</script>

<template>
  <div class="app-navigation-shell" @keydown="onMenuKeydown">
    <!-- ── Sidebar ──────────────────────────────────────────────────────────── -->
    <aside class="app-navigation-shell__sidebar" :aria-label="sidebarLabel">
      <!-- Brand -->
      <div class="app-navigation-shell__brand">
        <span class="app-navigation-shell__brand-mark">{{ brandMark }}</span>
        <span class="app-navigation-shell__brand-name">{{ brandName }}</span>
      </div>

      <!-- Primary nav -->
      <nav class="app-navigation-shell__nav" :aria-label="primaryNavLabel">
        <AppRow
          v-for="item in nav"
          :key="item.key"
          :selected="item.key === activeRoute"
          compact
          interactive
          :to="item.to"
          :aria-current="item.key === activeRoute ? 'page' : undefined"
          @click="onNavClick(item)"
        >
          <template #leading>
            <IconCS :name="item.icon" :size="18" />
          </template>
          {{ item.label }}
          <template v-if="item.badge" #trailing>
            <AppBadge :label="String(item.badge)" color="primary" size="sm" />
          </template>
        </AppRow>
      </nav>

      <!-- Admin nav -->
      <template v-if="adminNav && adminNav.length > 0">
        <div class="app-navigation-shell__admin-section">{{ adminLabel }}</div>
        <nav class="app-navigation-shell__nav" :aria-label="adminNavLabel">
          <AppRow
            v-for="item in adminNav"
            :key="item.key"
            :selected="item.key === activeRoute"
            compact
            interactive
            :to="item.to"
            :aria-current="item.key === activeRoute ? 'page' : undefined"
            @click="onNavClick(item)"
          >
            <template #leading>
              <IconCS :name="item.icon" :size="18" />
            </template>
            {{ item.label }}
            <template v-if="item.badge" #trailing>
              <AppBadge :label="String(item.badge)" color="primary" size="sm" />
            </template>
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
          :role-label="user.roleLabel"
          size="sm"
        />
        <div class="app-navigation-shell__user-info">
          <span class="app-navigation-shell__user-name">{{ user.name }}</span>
          <span class="app-navigation-shell__user-role">{{ user.roleLabel }}</span>
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
            type="search"
            :placeholder="searchPlaceholder"
            :aria-label="searchPlaceholder"
            :value="searchValue"
            @input="emit('update:searchValue', ($event.target as HTMLInputElement).value)"
            @keydown.enter="emit('searchSubmit', ($event.target as HTMLInputElement).value)"
          />
        </div>

        <span class="app-navigation-shell__topbar-spacer" />

        <slot name="actions" />

        <!-- Both languages visible at once, the active one marked. The button
             this replaced showed the language a click switched *to*, which read
             as a status label and was actually a target. Hidden below two
             locales: there is nothing to switch between. -->
        <AppSegmented
          v-if="locales.length > 1"
          :model-value="locale"
          :label="localeSwitchLabel"
          class="app-navigation-shell__locale-switch"
          @update:model-value="(code: string) => emit('update:locale', code)"
        >
          <!-- The code is what shows; the locale's own name is the accessible
               name. Full names made the topbar 31px wider than the button this
               replaced and pushed the home page into horizontal scroll at
               375px, which tests/e2e/home.spec.ts caught. Two codes side by
               side with one marked still supply the property that was missing
               before — the old control was a lone button naming the OTHER
               language. -->
          <AppSegmentedItem
            v-for="loc in locales"
            :key="loc.code"
            :value="loc.code"
            :aria-label="loc.name"
          >
            {{ loc.code.toUpperCase() }}
          </AppSegmentedItem>
        </AppSegmented>

        <button
          type="button"
          class="app-navigation-shell__theme-toggle"
          :aria-label="themeToggleLabel"
          @click="toggleColorMode"
        >
          <IconCS :name="themeToggleIcon" :size="16" />
        </button>

        <!-- Avatar trigger (topbar) -->
        <div ref="menuRef" class="app-navigation-shell__avatar-wrap">
          <button
            type="button"
            class="app-navigation-shell__avatar-trigger"
            aria-haspopup="menu"
            :aria-expanded="menuOpen ? 'true' : 'false'"
            :aria-label="userMenuLabel"
            @click="toggleMenu"
          >
            <AppAvatar
              :image="user.avatarUrl"
              :initials="user.initials"
              :name="user.name"
              :role="avatarRole"
              :role-label="user.roleLabel"
              size="sm"
            />
          </button>

          <!-- Avatar menu -->
          <div
            v-if="menuOpen"
            class="app-navigation-shell__menu"
            role="menu"
            :aria-label="userMenuLabel"
          >
            <button
              type="button"
              class="app-navigation-shell__menu-item"
              role="menuitem"
              @click="onProfile"
            >
              <IconCS name="user" :size="16" />
              {{ profileLabel }}
            </button>
            <button
              type="button"
              class="app-navigation-shell__menu-item"
              role="menuitem"
              @click="onSettings"
            >
              <IconCS name="settings" :size="16" />
              {{ settingsLabel }}
            </button>
            <div class="app-navigation-shell__menu-divider" role="separator" />
            <button
              type="button"
              class="app-navigation-shell__menu-item app-navigation-shell__menu-item--danger"
              role="menuitem"
              @click="onSignOut"
            >
              <IconCS name="logout" :size="16" />
              {{ signOutLabel }}
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
        <aside
          v-if="hasRightRail"
          class="app-navigation-shell__main-rail"
          :aria-label="rightRailLabel"
        >
          <slot name="right-rail" />
        </aside>
      </main>
    </div>

    <!-- ── Bottom-tab bar (xs only) ────────────────────────────────────────── -->
    <nav class="app-navigation-shell__bottom-tabs" :aria-label="bottomNavLabel">
      <button
        v-for="item in bottomTabItems"
        :key="item.key"
        type="button"
        class="app-navigation-shell__tab-item"
        :aria-current="item.key === activeRoute ? 'page' : undefined"
        @click="onNavClick(item)"
      >
        <span class="app-navigation-shell__tab-icon-wrap">
          <IconCS :name="item.icon" :size="20" />
          <AppBadge
            v-if="item.badge"
            :label="String(item.badge)"
            color="primary"
            size="sm"
            class="app-navigation-shell__tab-badge"
          />
        </span>
        <span class="app-navigation-shell__tab-label">{{ item.label }}</span>
      </button>

      <!-- Overflow entry — opens the full nav (primary + admin) below. -->
      <button
        v-if="showMoreTab"
        type="button"
        class="app-navigation-shell__tab-item"
        aria-haspopup="dialog"
        :aria-expanded="mobileNavOpen ? 'true' : 'false'"
        @click="mobileNavOpen = true"
      >
        <IconCS name="menu" :size="20" />
        <span class="app-navigation-shell__tab-label">{{ moreLabel }}</span>
      </button>
    </nav>

    <!-- ── Overflow nav dialog (mirrors the sidebar, reachable at xs) ───────── -->
    <AppDialog
      v-if="showMoreTab"
      :open="mobileNavOpen"
      :title="moreLabel"
      :dismiss-label="closeLabel"
      size="sm"
      @update:open="mobileNavOpen = $event"
    >
      <nav class="app-navigation-shell__nav" :aria-label="primaryNavLabel">
        <AppRow
          v-for="item in nav"
          :key="item.key"
          :selected="item.key === activeRoute"
          compact
          interactive
          :to="item.to"
          :aria-current="item.key === activeRoute ? 'page' : undefined"
          @click="onNavClick(item)"
        >
          <template #leading>
            <IconCS :name="item.icon" :size="18" />
          </template>
          {{ item.label }}
          <template v-if="item.badge" #trailing>
            <AppBadge :label="String(item.badge)" color="primary" size="sm" />
          </template>
        </AppRow>
      </nav>

      <template v-if="adminNav && adminNav.length > 0">
        <div class="app-navigation-shell__admin-section">{{ adminLabel }}</div>
        <nav class="app-navigation-shell__nav" :aria-label="adminNavLabel">
          <AppRow
            v-for="item in adminNav"
            :key="item.key"
            :selected="item.key === activeRoute"
            compact
            interactive
            :to="item.to"
            :aria-current="item.key === activeRoute ? 'page' : undefined"
            @click="onNavClick(item)"
          >
            <template #leading>
              <IconCS :name="item.icon" :size="18" />
            </template>
            {{ item.label }}
            <template v-if="item.badge" #trailing>
              <AppBadge :label="String(item.badge)" color="primary" size="sm" />
            </template>
          </AppRow>
        </nav>
      </template>
    </AppDialog>
  </div>
</template>

<style scoped lang="scss">
  // Chrome metrics with no matching --space-* step (scale: 4/8/12/16/24/32/48/
  // 64/96) — named SCSS variables holding the same literals.
  $brand-mark-size: 28px;
  $topbar-height: 56px;
  $search-max-width: 420px;
  $menu-min-width: 180px;
  // Bottom-tab badge offset (#775) — positions it over the icon's top-right
  // corner; no matching --space-* step at this size.
  $tab-badge-offset-top: -6px;
  $tab-badge-offset-right: -10px;

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
      width: $brand-mark-size;
      height: $brand-mark-size;
      border-radius: var(--radius-sm);
      background: var(--brand-accent);
      color: var(--brand-accent-fg);
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
      font-size: var(--text-sm);
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
      font-size: var(--text-md);
      color: var(--text-fg);
      font-weight: var(--fw-medium);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &__user-role {
      font-size: var(--text-sm);
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
      // A grid item's automatic min-width defaults to its content's
      // min-content size (here: the topbar's fixed-width controls plus the
      // search field's floor) rather than 0. At the single-column mobile
      // breakpoint that min-content (~385px) is wider than a 375px phone,
      // so the "1fr" track grew to fit it and blew the whole document out
      // to the right by the difference (#616) — inner overflow:auto on
      // `&__main`/`&__main-body` never gets a say, because this item sits
      // one level higher, still `overflow: visible`. `min-width: 0` opts
      // this item out of that automatic minimum, letting the track (and
      // everything in it) clamp to the real available width; the topbar's
      // own flex children still shrink to fit inside it (search flows down
      // to its own min-content) rather than being clipped.
      min-width: 0;
    }

    // ── Top bar ───────────────────────────────────────────────────────────
    &__topbar {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--border-default);
      background: var(--surface-overlay);
      height: $topbar-height;
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
      max-width: $search-max-width;
      background: var(--surface-raised);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      padding: var(--space-2) var(--space-3);

      // The input itself sits flush inside this pill with no border of its
      // own — the ring belongs on the container (`:focus-within`) so the
      // whole pill highlights, matching the weight of every other topbar
      // control's `:focus-visible` ring (#597: this was `outline: none`
      // with nothing to replace it).
      &:focus-within {
        outline: 2px solid var(--brand-accent);
        outline-offset: 1px;
      }
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

    // ── Language switch ──────────────────────────────────────────────────
    &__locale-switch {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: var(--space-6);
      padding: 0 var(--space-2);
      border-radius: var(--radius-md);
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: var(--text-xs);
      font-weight: var(--fw-medium);
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

    // ── Theme toggle ──────────────────────────────────────────────────────
    &__theme-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--space-6);
      height: var(--space-6);
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
      top: calc(100% + var(--space-2));
      right: 0;
      // This menu is anchored inside the fixed bottom-tab bar (--z-sticky, 200)
      // at xs widths, so a plain --z-dropdown (100) paints *under* the bar the
      // user just tapped. It's a user-opened overlay, so it takes the next scale
      // rung above sticky: --z-overlay (300) — the lowest layer that clears
      // sticky chrome. A shared-scale rung, not a per-component magic number.
      z-index: var(--z-overlay);
      min-width: $menu-min-width;
      background: var(--surface-overlay);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-lg);
      padding: var(--space-1);
      // Was `0 8px 24px rgb(0 0 0 / 12%)` — the same 0/8px/24px geometry the
      // light --shadow-md ships, but theme-blind. --shadow-md is the menu
      // elevation token and adapts to the dark palette.
      box-shadow: var(--shadow-md);
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
      z-index: var(--z-sticky);
      height: var(--space-8);
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

      // Color alone doesn't survive low-vision/color-blind viewing — the
      // active tab's label also goes semibold, not just a hue change (#597).
      &[aria-current='page'] {
        color: var(--brand-accent);
        font-weight: var(--fw-semibold);
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: -2px;
      }
    }

    &__tab-label {
      font-size: var(--text-xs); // scale floor — was a hand-picked 10px (#700)
      // Nearest token to the bundle's 1.2 — 0.05 off at this font size is
      // sub-pixel.
      line-height: var(--leading-tight);
    }

    &__tab-icon-wrap {
      position: relative;
      display: inline-flex;
    }

    &__tab-badge {
      position: absolute;
      top: $tab-badge-offset-top;
      right: $tab-badge-offset-right;
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

      // No room for it beside the search and the avatar at this width, and a
      // segmented control cannot shrink to the width of the single button it
      // replaced — tests/e2e/home.spec.ts caught the home page scrolling
      // horizontally at 375px. Settings carries the language row instead, the
      // same split the theme control uses: full choice there, quick switch here
      // only where it fits.
      &__locale-switch {
        display: none;
      }

      // Clears the fixed bottom-tab bar, whose height is the same --space-8.
      &__main {
        padding-bottom: var(--space-8);
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
