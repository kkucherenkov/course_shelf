/**
 * Spec for apps/web/app/pages/settings.vue
 *
 * Guards E31-F02-S02: avatar upload, email change and account deletion were
 * withdrawn rather than implemented. This is a single-owner instance — a
 * control that looks operable and is not costs the owner a support
 * conversation with themselves.
 *
 * The positive assertions are load-bearing: without them a broken mount would
 * make every "is absent" check pass for the wrong reason.
 */

import { describe, it, expect, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── Nuxt auto-imports ──────────────────────────────────────────────────────
vi.stubGlobal('definePageMeta', () => undefined);
vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }));
vi.stubGlobal('useToast', () => ({ add: vi.fn() }));
vi.stubGlobal('useColorMode', () => ({ preference: 'dark' }));
vi.stubGlobal('navigateTo', vi.fn());

// ── SDK mock ───────────────────────────────────────────────────────────────
vi.mock('@app/api-client-ts', () => ({
  updateMe: vi.fn(),
  signOutOtherSessions: vi.fn(),
  client: {},
}));

// ── Stores ─────────────────────────────────────────────────────────────────
vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({
    user: { email: 'owner@example.com', displayName: 'Owner', name: 'Owner' },
    isPending: false,
    changePassword: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock('~/stores/preferences', () => ({
  usePreferencesStore: () => ({
    density: 'comfortable',
    defaultSpeed: 1,
    autoplayNext: true,
    resumeWhereLeftOff: true,
    completionThreshold: 90,
    setDensity: vi.fn(),
    setDefaultSpeed: vi.fn(),
    setAutoplayNext: vi.fn(),
    setResumeWhereLeftOff: vi.fn(),
    setCompletionThreshold: vi.fn(),
  }),
}));

// ── @app/ui stubs ──────────────────────────────────────────────────────────
vi.mock('@app/ui', () => ({
  AppButton: {
    name: 'AppButton',
    props: ['type', 'variant', 'label', 'disabled', 'loading', 'size'],
    template: '<button :disabled="disabled">{{ label }}</button>',
  },
  AppInput: {
    name: 'AppInput',
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
    template: '<input :value="modelValue" />',
  },
  AppSwitch: {
    name: 'AppSwitch',
    props: ['modelValue', 'ariaLabel'],
    emits: ['update:modelValue'],
    template: '<input type="checkbox" :checked="modelValue" />',
  },
  AppPasswordField: {
    name: 'AppPasswordField',
    props: ['modelValue', 'label', 'autoComplete'],
    emits: ['update:modelValue'],
    template: '<input type="password" :value="modelValue" />',
  },
  AppSegmented: {
    name: 'AppSegmented',
    props: ['modelValue', 'label'],
    emits: ['update:modelValue'],
    template: '<div class="stub-segmented"><slot /></div>',
  },
  AppSegmentedItem: {
    name: 'AppSegmentedItem',
    props: ['value', 'label'],
    template: '<button>{{ label }}</button>',
  },
  AppDialog: {
    name: 'AppDialog',
    props: ['open', 'size', 'title', 'description'],
    emits: ['update:open'],
    template: '<div v-if="open"><slot name="footer" /></div>',
  },
}));

// `t` is the identity function above, so rendered copy is the key itself.
async function mountSettings(): Promise<VueWrapper> {
  const mod = await import('../settings.vue');
  return mount(mod.default);
}

async function renderSettings(): Promise<string> {
  const wrapper = await mountSettings();
  return wrapper.text();
}

describe('settings page', () => {
  it('renders the profile, appearance, playback and account sections', async () => {
    const text = await renderSettings();

    expect(text).toContain('pages.settings.sectionProfile');
    expect(text).toContain('pages.settings.sectionAppearance');
    expect(text).toContain('pages.settings.sectionPlayback');
    expect(text).toContain('pages.settings.sectionAccount');
  });

  it('keeps the controls that actually work', async () => {
    const text = await renderSettings();

    expect(text).toContain('pages.settings.profileNameLabel');
    expect(text).toContain('pages.settings.profilePasswordChange');
    expect(text).toContain('pages.settings.accountSignOutCta');
    expect(text).toContain('pages.settings.accountSignOutOthersCta');
    // The email stays visible — reading it is useful, changing it was not wired.
    expect(text).toContain('owner@example.com');
  });

  it('offers no avatar upload', async () => {
    const text = await renderSettings();

    expect(text).not.toContain('pages.settings.profileAvatarLabel');
    expect(text).not.toContain('pages.settings.profileAvatarUpload');
    expect(text).not.toContain('pages.settings.profileAvatarRemove');
  });

  it('offers no email change', async () => {
    const text = await renderSettings();

    expect(text).not.toContain('pages.settings.profileEmailChange');
  });

  it('offers no account deletion', async () => {
    const text = await renderSettings();

    expect(text).not.toContain('pages.settings.accountDeleteLabel');
    expect(text).not.toContain('pages.settings.accountDeleteCta');
  });

  it('leaves no disabled control behind', async () => {
    const wrapper = await mountSettings();

    expect(wrapper.findAll('button[disabled]')).toHaveLength(0);
  });
});
