<script setup lang="ts">
  import {
    AppField,
    AppInput,
    AppButton,
    AppBanner,
    AppPasswordField,
    AppSelect,
    AppNoPermission,
  } from '@app/ui';
  import type { AppSelectOption } from '@app/ui';
  import { ref, computed, watch } from 'vue';

  import { registerLibrary } from '@app/api-client-ts';
  import { client } from '@app/api-client-ts';

  import { useAuthStore } from '~/stores/auth';
  import { useInstanceConfig } from '~/composables/useInstanceConfig';
  import { useFirstRun } from '~/composables/useFirstRun';
  import { useOtpInput } from '~/composables/useOtpInput';
  import { AUTH_ERROR_CODES } from '~/constants/authErrorCodes';
  import type { StepDef } from '~/components/auth/AuthStepper.vue';

  definePageMeta({ layout: false });

  const { t } = useI18n();
  const authStore = useAuthStore();
  const { config } = useInstanceConfig();
  const { hasUsers } = useFirstRun();

  // First-run: no users exist yet, so this account becomes the first admin.
  const isFirstAdmin = computed(() => hasUsers.value === false);

  // ── Step management ─────────────────────────────────────────────────────────

  // Logical steps — 'verify' is conditional on emailVerificationRequired.
  type StepId = 'account' | 'verify' | 'library';

  const currentStep = ref<StepId>('account');

  // Visible steps depend on emailVerificationRequired.
  const visibleSteps = computed<StepDef[]>(() => {
    if (config.value.emailVerificationRequired) {
      return [
        { id: 'account', label: t('pages.signUp.stepAccount') },
        { id: 'verify', label: t('pages.signUp.stepVerify') },
        { id: 'library', label: t('pages.signUp.stepLibrary') },
      ];
    }
    return [
      { id: 'account', label: t('pages.signUp.stepAccount') },
      { id: 'library', label: t('pages.signUp.stepLibrary') },
    ];
  });

  // ── Form state ───────────────────────────────────────────────────────────────

  // Step 1 — Account
  const fullName = ref('');
  const email = ref('');
  const password = ref('');
  const step1Error = ref('');

  // Step 2 — Verify
  // Per-cell template refs so the OTP model can drive focus without a global
  // DOM query.
  const codeInputs = ref<HTMLInputElement[]>([]);
  function setCodeInput(el: unknown, index: number): void {
    if (el instanceof HTMLInputElement) codeInputs.value[index] = el;
  }
  const {
    digits: verifyCode,
    fullCode,
    onInput: onCodeInput,
    onKeydown: onCodeKeydown,
    onPaste: onCodePaste,
    reset: resetCode,
  } = useOtpInput({
    focusInput: (index) => codeInputs.value[index]?.focus(),
  });
  const resendCountdown = ref(60);
  let resendTimer: ReturnType<typeof setInterval> | null = null;
  const step2Error = ref('');

  // Step 3 — Library
  const libraryName = ref('');
  const libraryPath = ref('');
  const scanStrategy = ref<string | null>('auto');
  const step3Error = ref('');

  const scanStrategyOptions = computed<AppSelectOption[]>(() => [
    { id: 'auto', label: t('pages.signUp.libraryScanStrategyAuto') },
    { id: 'frame', label: t('pages.signUp.libraryScanStrategyFrame') },
    { id: 'skip', label: t('pages.signUp.libraryScanStrategySkip') },
  ]);

  // ── Step 1 submit ─────────────────────────────────────────────────────────────

  async function onAccountSubmit(): Promise<void> {
    step1Error.value = '';

    const result = await authStore.signUp(email.value, password.value, fullName.value || undefined);
    if (!result.ok) {
      step1Error.value =
        result.code === AUTH_ERROR_CODES.USER_ALREADY_EXISTS
          ? t('pages.signUp.errorEmailTaken')
          : t('pages.signUp.errorGeneric');
      return;
    }

    // The first account is promoted to ADMIN server-side by the Better Auth
    // user-create hook — no client-side promotion call needed.

    if (config.value.emailVerificationRequired) {
      currentStep.value = 'verify';
      startResendCountdown();
    } else {
      currentStep.value = 'library';
    }
  }

  // ── Step 2 — verification ──────────────────────────────────────────────────

  function stopResendCountdown(): void {
    if (resendTimer !== null) {
      clearInterval(resendTimer);
      resendTimer = null;
    }
  }

  function startResendCountdown(): void {
    resendCountdown.value = 60;
    stopResendCountdown();
    resendTimer = setInterval(() => {
      resendCountdown.value -= 1;
      if (resendCountdown.value <= 0) stopResendCountdown();
    }, 1000);
  }

  onUnmounted(stopResendCountdown);

  async function onVerifySubmit(): Promise<void> {
    step2Error.value = '';
    const result = await authStore.verifyEmail(fullCode.value);
    if (!result.ok) {
      step2Error.value = result.error ?? t('pages.signUp.errorGeneric');
      return;
    }
    currentStep.value = 'library';
  }

  function onResend(): void {
    if (resendCountdown.value > 0) return;
    // Stub: real impl would call authClient.emailVerification.send().
    startResendCountdown();
  }

  // Going back to fix the email must not leave a stale code or a running
  // countdown behind for the next verify pass.
  function onEditEmail(): void {
    resetCode();
    step2Error.value = '';
    stopResendCountdown();
    currentStep.value = 'account';
  }

  // ── Step 3 — Library ──────────────────────────────────────────────────────

  async function onLibrarySubmit(): Promise<void> {
    step3Error.value = '';
    const rootPath = libraryPath.value.trim();

    try {
      const res = await registerLibrary({
        client,
        throwOnError: false,
        body: { name: libraryName.value, rootPath },
      });

      if (res.error) {
        // The endpoint is idempotent on rootPath now (auto-grants the
        // user on existing libraries) so 409 isn't a code path anymore.
        // Anything else here is a real failure — bad path, network, etc.
        step3Error.value = t('pages.signUp.errorLibraryPath');
        return;
      }
    } catch {
      step3Error.value = t('pages.signUp.errorLibraryPath');
      return;
    }

    // The backend has already kicked off the initial scan on its side
    // (or skipped it for an already-registered path that the user just
    // joined). Drop the user on the home page — the Continue Watching /
    // Recently Added rows fill in as the projector catches up.
    await navigateTo('/');
  }

  async function onSkipLibrary(): Promise<void> {
    await navigateTo('/');
  }

  // Watch for config loading to reset step computation reactively.
  watch(
    () => config.value.emailVerificationRequired,
    () => {
      // If currently on 'verify' but verification is no longer required, skip ahead.
      if (currentStep.value === 'verify' && !config.value.emailVerificationRequired) {
        currentStep.value = 'library';
      }
    },
  );
</script>

<template>
  <AuthLayout variant="sign-up">
    <!-- Self-registration disabled state -->
    <div v-if="!config.selfRegistration" class="page-sign-up" data-testid="page-sign-up-disabled">
      <AppNoPermission
        :title="t('pages.signUp.disabledTitle')"
        :body="t('pages.signUp.disabledBody')"
        icon="lock"
      />
      <div class="page-sign-up__back-link">
        <NuxtLink to="/sign-in" class="page-sign-up__link">
          {{ t('pages.signUp.signInLink') }}
        </NuxtLink>
      </div>
    </div>

    <!-- Wizard -->
    <div v-else class="page-sign-up" data-testid="page-sign-up">
      <AuthStepper :steps="visibleSteps" :current="currentStep" />

      <!-- Step 1: Account -->
      <template v-if="currentStep === 'account'">
        <div class="page-sign-up__header">
          <h1 class="page-sign-up__title">
            {{ isFirstAdmin ? t('pages.setup.title') : t('pages.signUp.title') }}
          </h1>
          <p class="page-sign-up__subtitle">
            {{ isFirstAdmin ? t('pages.setup.subtitle') : t('pages.signUp.subtitle') }}
          </p>
        </div>

        <AppBanner
          v-if="step1Error"
          variant="error"
          :body="step1Error"
          class="page-sign-up__banner"
        />

        <form class="page-sign-up__form" novalidate @submit.prevent="onAccountSubmit">
          <AppField :label="t('pages.signUp.fullNameLabel')" required>
            <template #default="slotAttrs">
              <AppInput
                v-bind="slotAttrs"
                v-model="fullName"
                type="text"
                :placeholder="t('pages.signUp.fullNamePlaceholder')"
                autocomplete="name"
              />
            </template>
          </AppField>

          <AppField :label="t('pages.signUp.emailLabel')" required>
            <template #default="slotAttrs">
              <AppInput
                v-bind="slotAttrs"
                v-model="email"
                type="email"
                :placeholder="t('pages.signUp.emailPlaceholder')"
                autocomplete="email"
                inputmode="email"
              />
            </template>
          </AppField>

          <AppPasswordField
            v-model="password"
            :label="t('pages.signUp.passwordLabel')"
            auto-complete="new-password"
            with-meter
            required
          />

          <AppButton
            :label="t('pages.signUp.continueButton')"
            type="submit"
            variant="primary"
            block
            :loading="authStore.isPending"
            :disabled="!email || !password || password.length < 8"
          />
        </form>

        <p class="page-sign-up__footnote-link">
          {{ t('pages.signUp.alreadyHaveAccount') }}
          <NuxtLink to="/sign-in" class="page-sign-up__link">
            {{ t('pages.signUp.signInLink') }}
          </NuxtLink>
        </p>
      </template>

      <!-- Step 2: Verify -->
      <template v-else-if="currentStep === 'verify'">
        <div class="page-sign-up__header">
          <h1 class="page-sign-up__title">{{ t('pages.signUp.verifyTitle') }}</h1>
          <p class="page-sign-up__subtitle">
            {{ t('pages.signUp.verifySubtitle', { email }) }}
          </p>
        </div>

        <AppBanner
          v-if="step2Error"
          variant="error"
          :body="step2Error"
          class="page-sign-up__banner"
        />

        <form class="page-sign-up__form" novalidate @submit.prevent="onVerifySubmit">
          <div
            class="page-sign-up__code-row"
            role="group"
            :aria-label="t('pages.signUp.verifyCodeLabel')"
          >
            <input
              v-for="(_, index) in verifyCode"
              :key="index"
              :ref="(el) => setCodeInput(el, index)"
              class="page-sign-up__code-input"
              type="text"
              inputmode="numeric"
              maxlength="1"
              :value="verifyCode[index]"
              :aria-label="`Digit ${index + 1}`"
              @input="onCodeInput(index, $event)"
              @keydown="onCodeKeydown(index, $event)"
              @paste="onCodePaste"
            />
          </div>

          <p class="page-sign-up__resend-text">
            <template v-if="resendCountdown > 0">
              {{ t('pages.signUp.resendCountdown', { n: resendCountdown }) }}
            </template>
            <button
              v-else
              type="button"
              class="page-sign-up__link page-sign-up__link--btn"
              @click="onResend"
            >
              {{ t('pages.signUp.resendButton') }}
            </button>
          </p>

          <AppButton
            :label="t('pages.signUp.verifyButton')"
            type="submit"
            variant="primary"
            block
            :disabled="fullCode.length < 6"
          />
        </form>

        <p class="page-sign-up__footnote-link">
          {{ t('pages.signUp.wrongEmail') }}
          <button
            type="button"
            class="page-sign-up__link page-sign-up__link--btn"
            @click="onEditEmail"
          >
            {{ t('pages.signUp.editEmail') }}
          </button>
        </p>
      </template>

      <!-- Step 3: Library -->
      <template v-else-if="currentStep === 'library'">
        <div class="page-sign-up__header">
          <h1 class="page-sign-up__title">{{ t('pages.signUp.libraryTitle') }}</h1>
          <p class="page-sign-up__subtitle">{{ t('pages.signUp.librarySubtitle') }}</p>
        </div>

        <AppBanner
          v-if="step3Error"
          variant="error"
          :body="step3Error"
          class="page-sign-up__banner"
        />

        <form class="page-sign-up__form" novalidate @submit.prevent="onLibrarySubmit">
          <AppField :label="t('pages.signUp.libraryNameLabel')" required>
            <template #default="slotAttrs">
              <AppInput
                v-bind="slotAttrs"
                v-model="libraryName"
                type="text"
                :placeholder="t('pages.signUp.libraryNamePlaceholder')"
              />
            </template>
          </AppField>

          <AppField
            :label="t('pages.signUp.libraryPathLabel')"
            :help="t('pages.signUp.libraryPathHint')"
            required
          >
            <template #default="slotAttrs">
              <AppInput
                v-bind="slotAttrs"
                v-model="libraryPath"
                type="text"
                :placeholder="t('pages.signUp.libraryPathPlaceholder')"
                class="page-sign-up__path-input"
              />
            </template>
          </AppField>

          <AppField :label="t('pages.signUp.libraryScanStrategyLabel')">
            <template #default="slotAttrs">
              <AppSelect v-bind="slotAttrs" v-model="scanStrategy" :options="scanStrategyOptions" />
            </template>
          </AppField>

          <AppButton
            :label="t('pages.signUp.finishButton')"
            type="submit"
            variant="primary"
            block
            :disabled="!libraryName || !libraryPath"
          />
        </form>

        <p class="page-sign-up__footnote-link">
          <button
            type="button"
            class="page-sign-up__link page-sign-up__link--btn"
            @click="onSkipLibrary"
          >
            {{ t('pages.signUp.skipLibrary') }}
          </button>
        </p>
      </template>
    </div>
  </AuthLayout>
</template>

<style lang="scss" scoped>
  .page-sign-up {
    width: 100%;

    &__header {
      margin-bottom: var(--space-8);
    }

    &__title {
      margin: 0 0 var(--space-2);
      font-size: var(--text-3xl);
      font-weight: var(--fw-bold);
      letter-spacing: var(--tracking-tight);
      color: var(--text-fg);
    }

    &__subtitle {
      margin: 0;
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    &__banner {
      margin-bottom: var(--space-4);
    }

    &__form {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    &__code-row {
      display: flex;
      gap: var(--space-2);
      justify-content: center;
    }

    &__code-input {
      $digit-w: 44px; // single OTP digit cell width
      $digit-h: 52px; // single OTP digit cell height

      width: $digit-w;
      height: $digit-h;
      text-align: center;
      font-size: var(--text-xl);
      font-weight: var(--fw-semibold);
      border: 2px solid var(--border-default);
      border-radius: var(--radius-md);
      background: var(--surface-surface);
      color: var(--text-fg);
      caret-color: var(--brand-accent);
      transition: border-color var(--dur-fast) var(--ease-default);

      &:focus-visible {
        border-color: var(--brand-accent);
        outline: none;
      }
    }

    &__resend-text {
      margin: 0;
      text-align: center;
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    &__path-input {
      font-family: var(--font-mono);
    }

    &__back-link {
      margin-top: var(--space-4);
      text-align: center;
    }

    &__footnote-link {
      margin: var(--space-4) 0 0;
      font-size: var(--text-sm);
      color: var(--text-secondary);
      text-align: center;
    }

    &__link {
      color: var(--brand-accent);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }

      &--btn {
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
        font: inherit;
      }
    }
  }
</style>
