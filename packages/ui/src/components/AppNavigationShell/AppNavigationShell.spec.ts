import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppNavigationShell from './AppNavigationShell.vue';
import type { NavItem, ShellUser } from './AppNavigationShell.vue';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const defaultNav: NavItem[] = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'browse', label: 'Browse', icon: 'library' },
  { key: 'search', label: 'Search', icon: 'search' },
];

const adminNav: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { key: 'libraries', label: 'Libraries', icon: 'folder' },
  { key: 'users', label: 'Users', icon: 'users' },
];

const defaultUser: ShellUser = {
  name: 'Elena Lin',
  role: 'USER',
};

const adminUser: ShellUser = {
  name: 'Admin User',
  role: 'ADMIN',
  initials: 'AU',
};

function factory(
  overrides: {
    props?: Record<string, unknown>;
    slots?: Record<string, string>;
  } = {},
) {
  return mount(AppNavigationShell, {
    props: {
      activeRoute: 'home',
      nav: defaultNav,
      user: defaultUser,
      ...overrides.props,
    },
    slots: overrides.slots,
    attachTo: document.body,
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AppNavigationShell', () => {
  // ── Brand ──────────────────────────────────────────────────────────────────

  it('renders the default brand mark "CS"', () => {
    const w = factory();
    expect(w.find('.app-navigation-shell__brand-mark').text()).toBe('CS');
  });

  it('renders the default brand name "CourseShelf"', () => {
    const w = factory();
    expect(w.find('.app-navigation-shell__brand-name').text()).toBe('CourseShelf');
  });

  it('renders a custom brandMark and brandName', () => {
    const w = factory({ props: { brandMark: 'XY', brandName: 'MyApp' } });
    expect(w.find('.app-navigation-shell__brand-mark').text()).toBe('XY');
    expect(w.find('.app-navigation-shell__brand-name').text()).toBe('MyApp');
  });

  // ── Primary nav ───────────────────────────────────────────────────────────

  it('renders all primary nav item labels', () => {
    const w = factory();
    const sidebar = w.find('.app-navigation-shell__sidebar');
    expect(sidebar.text()).toContain('Home');
    expect(sidebar.text()).toContain('Browse');
    expect(sidebar.text()).toContain('Search');
  });

  it('sets aria-current="page" on the active nav item', () => {
    const w = factory({ props: { activeRoute: 'browse' } });
    const navItems = w.findAll('.app-navigation-shell__nav .app-row');
    const browseItem = navItems.find((el) => el.text().includes('Browse'));
    expect(browseItem?.attributes('aria-current')).toBe('page');
  });

  it('does not set aria-current on non-active nav items', () => {
    const w = factory({ props: { activeRoute: 'home' } });
    const navItems = w.findAll('.app-navigation-shell__nav .app-row');
    const browseItem = navItems.find((el) => el.text().includes('Browse'));
    expect(browseItem?.attributes('aria-current')).toBeUndefined();
  });

  it('emits "nav" with item key when a nav item is clicked', async () => {
    const w = factory({ props: { activeRoute: 'home' } });
    const navItems = w.findAll('.app-navigation-shell__nav .app-row');
    const searchItem = navItems.find((el) => el.text().includes('Search'));
    await searchItem?.trigger('click');
    expect(w.emitted('nav')).toEqual([['search']]);
  });

  // ── Admin section ─────────────────────────────────────────────────────────

  it('does not render admin section when adminNav is empty (default)', () => {
    const w = factory();
    expect(w.find('.app-navigation-shell__admin-section').exists()).toBe(false);
  });

  it('renders admin section label when adminNav has items', () => {
    const w = factory({ props: { adminNav } });
    expect(w.find('.app-navigation-shell__admin-section').exists()).toBe(true);
    expect(w.find('.app-navigation-shell__admin-section').text()).toBe('Admin');
  });

  it('renders all admin nav items', () => {
    const w = factory({ props: { adminNav } });
    const navs = w.findAll('.app-navigation-shell__nav');
    // last nav is the admin nav
    const adminNavEl = navs.at(-1);
    expect(adminNavEl?.text()).toContain('Dashboard');
    expect(adminNavEl?.text()).toContain('Libraries');
    expect(adminNavEl?.text()).toContain('Users');
  });

  it('sets aria-current="page" on active admin nav item', () => {
    const w = factory({ props: { activeRoute: 'dashboard', adminNav } });
    const allRows = w.findAll('.app-navigation-shell__nav .app-row');
    const dashRow = allRows.find((el) => el.text().includes('Dashboard'));
    expect(dashRow?.attributes('aria-current')).toBe('page');
  });

  // ── Search ────────────────────────────────────────────────────────────────

  it('renders search input with default placeholder', () => {
    const w = factory();
    const input = w.find('.app-navigation-shell__search-input');
    expect(input.attributes('placeholder')).toBe('Search courses, lessons…');
  });

  it('renders search input with custom placeholder', () => {
    const w = factory({ props: { searchPlaceholder: 'Find something…' } });
    expect(w.find('.app-navigation-shell__search-input').attributes('placeholder')).toBe(
      'Find something…',
    );
  });

  it('emits update:searchValue when typing in search input', async () => {
    const w = factory();
    const input = w.find<HTMLInputElement>('.app-navigation-shell__search-input');
    await input.setValue('vue');
    // setValue triggers both input and change; look for at least one emission
    const emitted = w.emitted('update:searchValue') as string[][];
    expect(emitted).toBeTruthy();
    expect(emitted.at(-1)).toEqual(['vue']);
  });

  // ── Theme toggle ─────────────────────────────────────────────────────────

  it('emits update:colorMode with "light" when colorMode is "dark"', async () => {
    const w = factory({ props: { colorMode: 'dark' } });
    await w.find('.app-navigation-shell__theme-toggle').trigger('click');
    expect(w.emitted('update:colorMode')).toEqual([['light']]);
  });

  it('emits update:colorMode with "dark" when colorMode is "light"', async () => {
    const w = factory({ props: { colorMode: 'light' } });
    await w.find('.app-navigation-shell__theme-toggle').trigger('click');
    expect(w.emitted('update:colorMode')).toEqual([['dark']]);
  });

  it('has correct aria-label on theme toggle for dark mode', () => {
    const w = factory({ props: { colorMode: 'dark' } });
    expect(w.find('.app-navigation-shell__theme-toggle').attributes('aria-label')).toBe(
      'Switch to light mode',
    );
  });

  it('has correct aria-label on theme toggle for light mode', () => {
    const w = factory({ props: { colorMode: 'light' } });
    expect(w.find('.app-navigation-shell__theme-toggle').attributes('aria-label')).toBe(
      'Switch to dark mode',
    );
  });

  // ── Avatar menu — open / close ─────────────────────────────────────────────

  it('menu is closed by default', () => {
    const w = factory();
    expect(w.find('.app-navigation-shell__menu').exists()).toBe(false);
  });

  it('opens the menu when avatar trigger is clicked', async () => {
    const w = factory();
    await w.find('.app-navigation-shell__avatar-trigger').trigger('click');
    expect(w.find('.app-navigation-shell__menu').exists()).toBe(true);
  });

  it('closes the menu on a second trigger click (toggle)', async () => {
    const w = factory();
    const trigger = w.find('.app-navigation-shell__avatar-trigger');
    await trigger.trigger('click');
    await trigger.trigger('click');
    expect(w.find('.app-navigation-shell__menu').exists()).toBe(false);
  });

  it('closes the menu when ESC is pressed', async () => {
    const w = factory();
    await w.find('.app-navigation-shell__avatar-trigger').trigger('click');
    expect(w.find('.app-navigation-shell__menu').exists()).toBe(true);
    await w.trigger('keydown', { key: 'Escape' });
    expect(w.find('.app-navigation-shell__menu').exists()).toBe(false);
  });

  it('closes the menu on click-outside (mousedown on document)', async () => {
    const w = factory();
    await w.find('.app-navigation-shell__avatar-trigger').trigger('click');
    expect(w.find('.app-navigation-shell__menu').exists()).toBe(true);
    // Simulate mousedown on document outside the component
    const event = new MouseEvent('mousedown', { bubbles: true });
    document.dispatchEvent(event);
    await flushPromises();
    expect(w.find('.app-navigation-shell__menu').exists()).toBe(false);
  });

  // ── Avatar menu — item events ─────────────────────────────────────────────

  it('emits "profile" and closes menu when Profile item is clicked', async () => {
    const w = factory();
    await w.find('.app-navigation-shell__avatar-trigger').trigger('click');
    const items = w.findAll('[role="menuitem"]');
    const profileItem = items.find((el) => el.text().includes('Profile'));
    await profileItem?.trigger('click');
    expect(w.emitted('profile')).toHaveLength(1);
    expect(w.find('.app-navigation-shell__menu').exists()).toBe(false);
  });

  it('emits "settings" and closes menu when Settings item is clicked', async () => {
    const w = factory();
    await w.find('.app-navigation-shell__avatar-trigger').trigger('click');
    const items = w.findAll('[role="menuitem"]');
    const settingsItem = items.find((el) => el.text().includes('Settings'));
    await settingsItem?.trigger('click');
    expect(w.emitted('settings')).toHaveLength(1);
    expect(w.find('.app-navigation-shell__menu').exists()).toBe(false);
  });

  it('emits "signOut" and closes menu when Sign out item is clicked', async () => {
    const w = factory();
    await w.find('.app-navigation-shell__avatar-trigger').trigger('click');
    const items = w.findAll('[role="menuitem"]');
    const signOutItem = items.find((el) => el.text().includes('Sign out'));
    await signOutItem?.trigger('click');
    expect(w.emitted('signOut')).toHaveLength(1);
    expect(w.find('.app-navigation-shell__menu').exists()).toBe(false);
  });

  it('emits update:colorMode and closes menu when theme menu item is clicked (dark→light)', async () => {
    const w = factory({ props: { colorMode: 'dark' } });
    await w.find('.app-navigation-shell__avatar-trigger').trigger('click');
    const items = w.findAll('[role="menuitem"]');
    const themeItem = items.find((el) => el.text().includes('Light mode'));
    await themeItem?.trigger('click');
    expect(w.emitted('update:colorMode')).toEqual([['light']]);
    expect(w.find('.app-navigation-shell__menu').exists()).toBe(false);
  });

  it('emits update:colorMode and closes menu when theme menu item is clicked (light→dark)', async () => {
    const w = factory({ props: { colorMode: 'light' } });
    await w.find('.app-navigation-shell__avatar-trigger').trigger('click');
    const items = w.findAll('[role="menuitem"]');
    const themeItem = items.find((el) => el.text().includes('Dark mode'));
    await themeItem?.trigger('click');
    expect(w.emitted('update:colorMode')).toEqual([['dark']]);
    expect(w.find('.app-navigation-shell__menu').exists()).toBe(false);
  });

  // ── Menu keyboard navigation ───────────────────────────────────────────────

  it('ArrowDown moves focus to next menu item', async () => {
    const w = factory();
    await w.find('.app-navigation-shell__avatar-trigger').trigger('click');
    await flushPromises();
    const items = w.findAll('[role="menuitem"]');
    expect(items.length).toBeGreaterThanOrEqual(2);
    // focus the first item manually
    (items[0]!.element as HTMLElement).focus();
    await w.trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(items[1]!.element);
  });

  it('ArrowUp moves focus to previous menu item (wraps)', async () => {
    const w = factory();
    await w.find('.app-navigation-shell__avatar-trigger').trigger('click');
    await flushPromises();
    const items = w.findAll('[role="menuitem"]');
    expect(items.length).toBeGreaterThanOrEqual(1);
    (items[0]!.element as HTMLElement).focus();
    await w.trigger('keydown', { key: 'ArrowUp' });
    // wrap: 0 → last
    const lastItem = items.at(-1);
    expect(lastItem).toBeDefined();
    expect(document.activeElement).toBe(lastItem!.element);
  });

  // ── Bottom-tab bar ────────────────────────────────────────────────────────

  it('renders bottom-tab bar in the DOM (present at all viewport sizes; CSS hides at ≥600px)', () => {
    const w = factory();
    expect(w.find('.app-navigation-shell__bottom-tabs').exists()).toBe(true);
  });

  it('bottom-tab bar shows only primary nav items (not admin items)', () => {
    const w = factory({ props: { adminNav } });
    const tabs = w.findAll('.app-navigation-shell__tab-item');
    const tabLabels = tabs.map((t) => t.text());
    // primary nav items are present
    expect(tabLabels.some((l) => l.includes('Home'))).toBe(true);
    // admin items are NOT present
    expect(tabLabels.some((l) => l.includes('Dashboard'))).toBe(false);
  });

  it('bottom-tab bar renders at most 5 items even when nav has more', () => {
    const bigNav: NavItem[] = [
      { key: 'a', label: 'A', icon: 'home' },
      { key: 'b', label: 'B', icon: 'library' },
      { key: 'c', label: 'C', icon: 'search' },
      { key: 'd', label: 'D', icon: 'settings' },
      { key: 'e', label: 'E', icon: 'user' },
      { key: 'f', label: 'F', icon: 'users' },
    ];
    const w = factory({ props: { nav: bigNav } });
    expect(w.findAll('.app-navigation-shell__tab-item')).toHaveLength(5);
  });

  it('sets aria-current="page" on the active bottom-tab item', () => {
    const w = factory({ props: { activeRoute: 'browse' } });
    const tabs = w.findAll('.app-navigation-shell__tab-item');
    const browseTab = tabs.find((t) => t.text().includes('Browse'));
    expect(browseTab?.attributes('aria-current')).toBe('page');
  });

  it('bottom-tab item click emits "nav" with the item key', async () => {
    const w = factory({ props: { activeRoute: 'home' } });
    const tabs = w.findAll('.app-navigation-shell__tab-item');
    const searchTab = tabs.find((t) => t.text().includes('Search'));
    await searchTab?.trigger('click');
    expect(w.emitted('nav')).toEqual([['search']]);
  });

  // ── Slots ─────────────────────────────────────────────────────────────────

  it('renders default slot content inside main body', () => {
    const w = factory({ slots: { default: '<p id="content">Page content</p>' } });
    expect(w.find('.app-navigation-shell__main-body').find('#content').exists()).toBe(true);
  });

  it('does not render rail aside when right-rail slot is absent', () => {
    const w = factory();
    expect(w.find('.app-navigation-shell__main-rail').exists()).toBe(false);
  });

  it('renders rail aside when right-rail slot is provided', () => {
    const w = factory({ slots: { 'right-rail': '<div id="rail">Rail</div>' } });
    expect(w.find('.app-navigation-shell__main-rail').exists()).toBe(true);
    expect(w.find('#rail').exists()).toBe(true);
  });

  it('adds --has-rail modifier class when right-rail slot is provided', () => {
    const w = factory({ slots: { 'right-rail': '<div>Rail</div>' } });
    expect(w.find('.app-navigation-shell__main').classes()).toContain(
      'app-navigation-shell__main--has-rail',
    );
  });

  it('does not add --has-rail modifier class when right-rail slot is absent', () => {
    const w = factory();
    expect(w.find('.app-navigation-shell__main').classes()).not.toContain(
      'app-navigation-shell__main--has-rail',
    );
  });

  // ── User block ────────────────────────────────────────────────────────────

  it('renders the user name in the sidebar user block', () => {
    const w = factory();
    expect(w.find('.app-navigation-shell__user-block').text()).toContain('Elena Lin');
  });

  it('renders the user role in the sidebar user block', () => {
    const w = factory({ props: { user: adminUser } });
    expect(w.find('.app-navigation-shell__user-block').text()).toContain('ADMIN');
  });

  // ── Actions slot ─────────────────────────────────────────────────────────

  it('renders actions slot content in the topbar', () => {
    const w = factory({ slots: { actions: '<button id="act">New</button>' } });
    expect(w.find('.app-navigation-shell__topbar').find('#act').exists()).toBe(true);
  });

  // ── Menu role ─────────────────────────────────────────────────────────────

  it('menu has role="menu"', async () => {
    const w = factory();
    await w.find('.app-navigation-shell__avatar-trigger').trigger('click');
    expect(w.find('.app-navigation-shell__menu').attributes('role')).toBe('menu');
  });

  it('all menu items have role="menuitem"', async () => {
    const w = factory();
    await w.find('.app-navigation-shell__avatar-trigger').trigger('click');
    const items = w.findAll('[role="menuitem"]');
    expect(items.length).toBeGreaterThanOrEqual(4); // Profile, Settings, Theme, Sign out
  });
});
