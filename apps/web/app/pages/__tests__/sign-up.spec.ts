/**
 * Spec for apps/web/app/pages/sign-up.vue
 *
 * Guards tuxedo 111: on a fresh instance (no users yet) the sign-up wizard
 * IS the bootstrap experience — step 1 promotes the new account to ADMIN.
 * `auth.global.ts` already funnels every route into /sign-up while
 * `hasUsers === false`; this page must not then refuse to render the wizard
 * just because AUTH_SELF_REGISTRATION=false. The disabled state is only
 * correct once a user already exists.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, computed, onUnmounted } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── Nuxt auto-imports ──────────────────────────────────────────────────────
vi.stubGlobal('definePageMeta', () => undefined);
vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }));
vi.stubGlobal('navigateTo', vi.fn());
// sign-up.vue calls the real `onUnmounted` lifecycle hook without importing
// it (relies on Nuxt's auto-import); wire it to Vue's real implementation so
// the composition-api context still resolves it correctly.
vi.stubGlobal('onUnmounted', onUnmounted);

// ── Composables ──────────────────────────────────────────────────────────
const selfRegistration = ref(true);
const hasUsers = ref<boolean | null>(true);

vi.mock('~/composables/useInstanceConfig', () => ({
  useInstanceConfig: () => ({
    config: computed(() => ({
      selfRegistration: selfRegistration.value,
      emailVerificationRequired: false,
      ssoProviders: [],
    })),
    refresh: vi.fn(),
  }),
}));

vi.mock('~/composables/useFirstRun', () => ({
  useFirstRun: () => ({ hasUsers, refresh: vi.fn() }),
}));

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({
    isPending: false,
    signUp: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerificationCode: vi.fn(),
  }),
}));

vi.mock('@app/api-client-ts', () => ({
  registerLibrary: vi.fn(),
  client: {},
}));

// ── @app/ui stubs ──────────────────────────────────────────────────────────
vi.mock('@app/ui', () => ({
  AppField: {
    name: 'AppField',
    props: ['label', 'help', 'required'],
    template: '<div><slot /></div>',
  },
  AppInput: {
    name: 'AppInput',
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<input />',
  },
  AppButton: {
    name: 'AppButton',
    props: ['label', 'type', 'variant', 'block', 'loading', 'disabled'],
    template: '<button :disabled="disabled">{{ label }}</button>',
  },
  AppBanner: { name: 'AppBanner', props: ['variant', 'body'], template: '<div>{{ body }}</div>' },
  AppPasswordField: {
    name: 'AppPasswordField',
    props: ['modelValue', 'label'],
    emits: ['update:modelValue'],
    template: '<input type="password" />',
  },
  AppSelect: {
    name: 'AppSelect',
    props: ['modelValue', 'options'],
    emits: ['update:modelValue'],
    template: '<select />',
  },
  AppNoPermission: {
    name: 'AppNoPermission',
    props: ['title', 'body', 'icon'],
    template: '<div class="no-permission">{{ title }} {{ body }}</div>',
  },
}));

// ── Nuxt runtime / local auto-imported components ──────────────────────────
const globalStubs = {
  AuthLayout: { template: '<div><slot /></div>' },
  AuthStepper: true,
  NuxtLink: { template: '<a><slot /></a>' },
};

async function mountPage(): Promise<VueWrapper> {
  const mod = await import('../sign-up.vue');
  return mount(mod.default, { global: { stubs: globalStubs } });
}

describe('pages/sign-up.vue', () => {
  beforeEach(() => {
    selfRegistration.value = false;
    hasUsers.value = true;
  });

  it('shows the wizard on a fresh instance even when self-registration is disabled', async () => {
    hasUsers.value = false;
    const wrapper = await mountPage();

    expect(wrapper.find('[data-testid="page-sign-up"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="page-sign-up-disabled"]').exists()).toBe(false);
  });

  it('shows the disabled state once a user exists and self-registration is off', async () => {
    hasUsers.value = true;
    const wrapper = await mountPage();

    expect(wrapper.find('[data-testid="page-sign-up-disabled"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="page-sign-up"]').exists()).toBe(false);
  });

  it('shows the wizard when self-registration is on, regardless of hasUsers', async () => {
    selfRegistration.value = true;
    hasUsers.value = true;
    const wrapper = await mountPage();

    expect(wrapper.find('[data-testid="page-sign-up"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="page-sign-up-disabled"]').exists()).toBe(false);
  });
});
