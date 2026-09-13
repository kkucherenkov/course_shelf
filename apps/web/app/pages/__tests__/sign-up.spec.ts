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
import { ref, computed, nextTick, onUnmounted } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── Nuxt auto-imports ──────────────────────────────────────────────────────
vi.stubGlobal('definePageMeta', () => undefined);
vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }));
const navigateTo = vi.fn();
vi.stubGlobal('navigateTo', navigateTo);
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
    // Step 1 has to succeed for the wizard to reach the library step.
    signUp: vi.fn(async () => ({ ok: true })),
    verifyEmail: vi.fn(),
    resendVerificationCode: vi.fn(),
  }),
}));

const mockRegisterLibrary = vi.fn();
vi.mock('@app/api-client-ts', () => ({
  registerLibrary: (...args: unknown[]) => mockRegisterLibrary(...args),
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
    template:
      '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
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

/** Lets the submit handler's awaits settle and Vue re-render. */
async function flush(): Promise<void> {
  await new Promise((r) => setTimeout(r, 0));
  await nextTick();
}

/** Clears step 1 (email verification is off in these tests) and lands on the library form. */
async function reachLibraryStep(): Promise<VueWrapper> {
  selfRegistration.value = true;
  const wrapper = await mountPage();
  await wrapper.find('form').trigger('submit');
  await flush();
  return wrapper;
}

/** Fills the library step's name + path and submits it. */
async function submitPath(wrapper: VueWrapper, rootPath: string): Promise<void> {
  const inputs = wrapper.findAll('input');
  const nameInput = inputs.at(0);
  const pathInput = inputs.at(1);
  if (!nameInput || !pathInput) throw new Error('Expected the library name + path inputs');
  await nameInput.setValue('My courses');
  await pathInput.setValue(rootPath);
  await wrapper.find('form').trigger('submit');
  await flush();
}

function bannerText(wrapper: VueWrapper): string {
  return wrapper.find('.page-sign-up__banner').text();
}

describe('pages/sign-up.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  /**
   * Step 3 is the first-run wizard's last screen: the operator who mistypes a
   * path here has nothing else to go on, so what it says has to be true.
   */
  describe('step 3 — library', () => {
    it('rejects a relative path without issuing a request', async () => {
      const wrapper = await reachLibraryStep();

      await submitPath(wrapper, 'volume1/courses');

      expect(mockRegisterLibrary).not.toHaveBeenCalled();
      expect(bannerText(wrapper)).toBe('pages.signUp.errorLibraryNotAbsolute');
      expect(navigateTo).not.toHaveBeenCalled();
    });

    it('strips the zero-width characters a pasted path carries', async () => {
      mockRegisterLibrary.mockResolvedValueOnce({
        data: {},
        error: null,
        response: { status: 201 },
      });
      const wrapper = await reachLibraryStep();

      await submitPath(wrapper, String.fromCodePoint(0x20_0b) + ' /srv/courses ');

      expect(mockRegisterLibrary).toHaveBeenCalledWith(
        expect.objectContaining({ body: expect.objectContaining({ rootPath: '/srv/courses' }) }),
      );
    });

    it("shows the server's own explanation instead of a canned sentence", async () => {
      const detail = 'request/body/name must NOT have more than 200 characters';
      mockRegisterLibrary.mockResolvedValueOnce({
        data: undefined,
        error: { type: 'about:blank', title: 'Bad Request', status: 400, detail },
        response: { status: 400 },
      });
      const wrapper = await reachLibraryStep();

      await submitPath(wrapper, '/srv/courses');

      expect(bannerText(wrapper)).toBe(detail);
    });

    it('falls back to the generic message only when the server explained nothing', async () => {
      mockRegisterLibrary.mockRejectedValueOnce(new TypeError('Failed to fetch'));
      const wrapper = await reachLibraryStep();

      await submitPath(wrapper, '/srv/courses');

      expect(bannerText(wrapper)).toBe('pages.signUp.errorLibraryFailed');
    });
  });
});
