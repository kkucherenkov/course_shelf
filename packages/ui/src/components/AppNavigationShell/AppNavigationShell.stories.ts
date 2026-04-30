import { ref } from 'vue';

import type { Meta, StoryObj } from '@storybook/vue3';

import AppNavigationShell from './AppNavigationShell.vue';
import type { NavItem, ShellUser } from './AppNavigationShell.vue';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const primaryNav: NavItem[] = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'browse', label: 'Browse', icon: 'library' },
  { key: 'search', label: 'Search', icon: 'search' },
];

const adminNav: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { key: 'libraries', label: 'Libraries', icon: 'folder' },
  { key: 'users', label: 'Users', icon: 'users' },
];

const regularUser: ShellUser = {
  name: 'Elena Lin',
  role: 'USER',
  initials: 'EL',
};

const adminUser: ShellUser = {
  name: 'Alex Admin',
  role: 'ADMIN',
  initials: 'AA',
};

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<typeof AppNavigationShell> = {
  title: 'Layout/AppNavigationShell',
  component: AppNavigationShell,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    activeRoute: 'home',
    nav: primaryNav,
    user: regularUser,
    colorMode: 'dark',
    brandName: 'CourseShelf',
    brandMark: 'CS',
    searchValue: '',
    searchPlaceholder: 'Search courses, lessons…',
  },
};

export default meta;
type Story = StoryObj<typeof AppNavigationShell>;

// ── Default (1440px, regular user, primary nav only) ─────────────────────────

export const Default: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
  render: (args) => ({
    components: { AppNavigationShell },
    setup() {
      const search = ref(args.searchValue ?? '');
      const colorMode = ref<'light' | 'dark'>(args.colorMode ?? 'dark');
      const active = ref(args.activeRoute);
      const lastSubmit = ref('');
      return { args, search, colorMode, active, lastSubmit };
    },
    template: `
      <AppNavigationShell
        v-bind="args"
        :activeRoute="active"
        :searchValue="search"
        :colorMode="colorMode"
        @update:searchValue="search = $event"
        @update:colorMode="colorMode = $event"
        @nav="active = $event"
        @search-submit="lastSubmit = $event"
      >
        <div style="padding: var(--space-5);">
          <h1 style="margin: 0 0 var(--space-2); font-size: var(--text-2xl); color: var(--text-fg);">Home</h1>
          <p style="color: var(--text-secondary); margin: 0;">Welcome back, {{ args.user.name }}.</p>
          <p v-if="lastSubmit" style="color: var(--text-secondary); margin: var(--space-2) 0 0; font-size: var(--text-sm);">Last search submit: <strong>{{ lastSubmit }}</strong></p>
        </div>
      </AppNavigationShell>
    `,
  }),
};

// ── Admin (adminNav populated) ────────────────────────────────────────────────

export const Admin: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
  args: {
    activeRoute: 'dashboard',
    adminNav,
    user: adminUser,
  },
  render: (args) => ({
    components: { AppNavigationShell },
    setup() {
      const search = ref('');
      const colorMode = ref<'light' | 'dark'>('dark');
      const active = ref(args.activeRoute);
      return { args, search, colorMode, active };
    },
    template: `
      <AppNavigationShell
        v-bind="args"
        :activeRoute="active"
        :searchValue="search"
        :colorMode="colorMode"
        @update:searchValue="search = $event"
        @update:colorMode="colorMode = $event"
        @nav="active = $event"
      >
        <div style="padding: var(--space-5);">
          <h1 style="margin: 0 0 var(--space-2); font-size: var(--text-2xl); color: var(--text-fg);">Admin Dashboard</h1>
          <p style="color: var(--text-secondary); margin: 0;">Manage your platform.</p>
        </div>
      </AppNavigationShell>
    `,
  }),
};

// ── WithRightRail ──────────────────────────────────────────────────────────────

export const WithRightRail: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
  render: (args) => ({
    components: { AppNavigationShell },
    setup() {
      const search = ref('');
      const colorMode = ref<'light' | 'dark'>('dark');
      const active = ref(args.activeRoute);
      return { args, search, colorMode, active };
    },
    template: `
      <AppNavigationShell
        v-bind="args"
        :activeRoute="active"
        :searchValue="search"
        :colorMode="colorMode"
        @update:searchValue="search = $event"
        @update:colorMode="colorMode = $event"
        @nav="active = $event"
      >
        <div style="padding: var(--space-5);">
          <h1 style="margin: 0 0 var(--space-2); font-size: var(--text-2xl); color: var(--text-fg);">Browse Courses</h1>
          <p style="color: var(--text-secondary); margin: 0;">Main content area (1fr).</p>
        </div>
        <template #right-rail>
          <div style="padding: var(--space-4);">
            <h3 style="margin: 0 0 var(--space-3); font-size: var(--text-md); font-weight: 600; color: var(--text-fg);">Filters</h3>
            <p style="font-size: 13px; color: var(--text-secondary); margin: 0;">Sticky right rail (280px).</p>
          </div>
        </template>
      </AppNavigationShell>
    `,
  }),
};

// ── Narrow (xs — 360px to spot-check bottom-tab bar) ─────────────────────────

export const Narrow: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
  render: (args) => ({
    components: { AppNavigationShell },
    setup() {
      const search = ref('');
      const colorMode = ref<'light' | 'dark'>('dark');
      const active = ref(args.activeRoute);
      return { args, search, colorMode, active };
    },
    template: `
      <div style="width: 360px; overflow: hidden;">
        <AppNavigationShell
          v-bind="args"
          :activeRoute="active"
          :searchValue="search"
          :colorMode="colorMode"
          @update:searchValue="search = $event"
          @update:colorMode="colorMode = $event"
          @nav="active = $event"
        >
          <div style="padding: var(--space-4);">
            <p style="color: var(--text-secondary); margin: 0;">Mobile view — sidebar hidden, bottom-tab visible.</p>
          </div>
        </AppNavigationShell>
      </div>
    `,
  }),
};

// ── LightMode ─────────────────────────────────────────────────────────────────

export const LightMode: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
  args: {
    colorMode: 'light',
  },
  render: (args) => ({
    components: { AppNavigationShell },
    setup() {
      const search = ref('');
      const colorMode = ref<'light' | 'dark'>('light');
      const active = ref(args.activeRoute);
      return { args, search, colorMode, active };
    },
    template: `
      <AppNavigationShell
        v-bind="args"
        :activeRoute="active"
        :searchValue="search"
        :colorMode="colorMode"
        @update:searchValue="search = $event"
        @update:colorMode="colorMode = $event"
        @nav="active = $event"
      >
        <div style="padding: var(--space-5);">
          <h1 style="margin: 0 0 var(--space-2); font-size: var(--text-2xl); color: var(--text-fg);">Light Mode</h1>
          <p style="color: var(--text-secondary); margin: 0;">Shell in light color mode.</p>
        </div>
      </AppNavigationShell>
    `,
  }),
};

// ── MenuOpen (avatar menu open for visual review) ─────────────────────────────

export const MenuOpen: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
  render: (args) => ({
    components: { AppNavigationShell },
    setup() {
      const search = ref('');
      const colorMode = ref<'light' | 'dark'>('dark');
      const active = ref(args.activeRoute);
      return { args, search, colorMode, active };
    },
    template: `
      <AppNavigationShell
        v-bind="args"
        :activeRoute="active"
        :searchValue="search"
        :colorMode="colorMode"
        @update:searchValue="search = $event"
        @update:colorMode="colorMode = $event"
        @nav="active = $event"
      >
        <div style="padding: var(--space-5);">
          <p style="color: var(--text-secondary); margin: 0;">
            Click the avatar button in the top-right corner to open the user menu.
          </p>
        </div>
      </AppNavigationShell>
    `,
  }),
};
