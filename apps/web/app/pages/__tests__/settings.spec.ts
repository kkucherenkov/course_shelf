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
import { computed, inject, provide } from 'vue';

// ── Nuxt auto-imports ──────────────────────────────────────────────────────
vi.stubGlobal('definePageMeta', () => undefined);
// `locale`, `locales` and `setLocale` are here because the Appearance section
// now carries a language row — the topbar's switch hides below 600px, so on a
// phone this page is the only way to change language.
const setLocaleMock = vi.fn();
vi.stubGlobal('useI18n', () => ({
  t: (key: string) => key,
  locale: { value: 'en' },
  locales: {
    value: [
      { code: 'en', name: 'English' },
      { code: 'ru', name: 'Русский' },
    ],
  },
  setLocale: setLocaleMock,
}));
vi.stubGlobal('useToast', () => ({ add: vi.fn() }));
vi.stubGlobal('useColorMode', () => ({ preference: 'dark' }));
vi.stubGlobal('navigateTo', vi.fn());
// `useInstanceConfig` is a Nuxt auto-import; without a stub the mount throws.
vi.stubGlobal('useInstanceConfig', () => ({
  config: {
    value: {
      version: '9.9.9-test',
      selfRegistration: true,
      emailVerificationRequired: false,
      ssoProviders: [],
    },
  },
  refresh: vi.fn(),
}));

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
  // These two mirror the one contract the page depends on: the real pair talks
  // through `provide`/`inject`, an item renders `role="radio"`, and clicking it
  // sets the group's value. The previous stub rendered a bare button with no
  // role and no wiring, so a test could neither find an option nor prove that
  // choosing one did anything.
  AppSegmented: {
    name: 'AppSegmented',
    props: ['modelValue', 'label'],
    emits: ['update:modelValue'],
    template: '<div class="stub-segmented" role="radiogroup" :aria-label="label"><slot /></div>',
    setup(props: { modelValue: unknown }, { emit }: { emit: (e: string, v: unknown) => void }) {
      provide('app-segmented', {
        modelValue: computed(() => props.modelValue),
        setValue: (v: unknown) => emit('update:modelValue', v),
      });
    },
  },
  AppSegmentedItem: {
    name: 'AppSegmentedItem',
    props: ['value', 'label'],
    template:
      '<button role="radio" :aria-checked="String(selected)" @click="onClick">{{ label }}</button>',
    setup(props: { value: unknown }) {
      const ctx = inject<{
        modelValue: { value: unknown };
        setValue: (v: unknown) => void;
      }>('app-segmented');
      return {
        selected: computed(() => ctx?.modelValue.value === props.value),
        onClick: () => ctx?.setValue(props.value),
      };
    },
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

  it('offers a language row, since the topbar switch is gone below 600px', async () => {
    const wrapper = await mountSettings();

    // Languages appear by their own name here, unlike the topbar's two-letter
    // codes: this page has room, and the codes existed only to fit the bar.
    const options = wrapper.findAll('[role="radio"]');
    const russian = options.find((el) => el.text() === 'Русский');
    expect(russian).toBeDefined();

    setLocaleMock.mockClear();
    await russian?.trigger('click');
    expect(setLocaleMock).toHaveBeenCalledWith('ru');
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

  it('shows the running server version', async () => {
    const wrapper = await mountSettings();

    expect(wrapper.find('[data-test="server-version"]').text()).toBe('9.9.9-test');
  });

  it('shows a dash rather than a guess when the backend could not be reached', async () => {
    vi.stubGlobal('useInstanceConfig', () => ({
      config: {
        value: {
          version: '',
          selfRegistration: true,
          emailVerificationRequired: false,
          ssoProviders: [],
        },
      },
      refresh: vi.fn(),
    }));

    const wrapper = await mountSettings();

    expect(wrapper.find('[data-test="server-version"]').text()).toBe('—');
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
