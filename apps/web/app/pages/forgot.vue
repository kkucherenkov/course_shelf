<script setup lang="ts">
  import { AppField, AppInput, AppButton, AppBanner, AppPasswordField } from '@app/ui';
  import { ref, computed } from 'vue';

  import { useAuthStore } from '~/stores/auth';
  import { useFirstRun } from '~/composables/useFirstRun';

  definePageMeta({ layout: false });

  const { t } = useI18n();
  const route = useRoute();
  const authStore = useAuthStore();
  const { hasUsers } = useFirstRun();

  type StepId = 'email' | 'sent' | 'reset';

  // If ?token= is in the URL, skip directly to reset step.
  const initialStep = computed<StepId>(() => {
    return route.query.token ? 'reset' : 'email';
  });

  const currentStep = ref<StepId>(initialStep.value);
  const enteredEmail = ref('');
  const errorMsg = ref('');

  // Step 3 state
  const newPassword = ref('');
  const confirmPassword = ref('');
  const resetToken = computed(() => (route.query.token as string | undefined) ?? '');

  // Redirect first-time users to sign-up.
  watchEffect(() => {
    if (hasUsers.value === false) {
      void navigateTo('/sign-up');
    }
  });

  // ── Step 1: Send email ──────────────────────────────────────────────────────

  async function onSendEmail(): Promise<void> {
    errorMsg.value = '';
    const result = await authStore.forgotPassword(enteredEmail.value);
    if (!result.ok) {
      errorMsg.value = result.error ?? t('pages.forgot.errorGeneric');
      return;
    }
    currentStep.value = 'sent';
  }

  // ── Step 3: Reset password ──────────────────────────────────────────────────

  async function onResetPassword(): Promise<void> {
    errorMsg.value = '';
    if (!resetToken.value) {
      errorMsg.value = t('pages.forgot.errorTokenMissing');
      return;
    }
    if (newPassword.value !== confirmPassword.value) {
      errorMsg.value = t('pages.forgot.errorPasswordMismatch');
      return;
    }
    const result = await authStore.resetPassword(newPassword.value, resetToken.value);
    if (!result.ok) {
      errorMsg.value = result.error ?? t('pages.forgot.errorGeneric');
      return;
    }
    await navigateTo('/');
  }

  const mailtoLink = computed(() => `mailto:${enteredEmail.value}`);
</script>

<template>
  <AuthLayout variant="forgot">
    <div class="page-forgot" data-testid="page-forgot">
      <!-- Step 1: Enter email -->
      <template v-if="currentStep === 'email'">
        <div class="page-forgot__eyebrow">{{ t('pages.forgot.eyebrow') }}</div>
        <div class="page-forgot__header">
          <h1 class="page-forgot__title">{{ t('pages.forgot.title') }}</h1>
          <p class="page-forgot__subtitle">{{ t('pages.forgot.subtitle') }}</p>
        </div>

        <AppBanner v-if="errorMsg" variant="error" :body="errorMsg" class="page-forgot__banner" />

        <form class="page-forgot__form" novalidate @submit.prevent="onSendEmail">
          <AppField :label="t('pages.forgot.emailLabel')" required>
            <template #default="slotAttrs">
              <AppInput
                v-bind="slotAttrs"
                v-model="enteredEmail"
                type="email"
                autocomplete="email"
                inputmode="email"
                placeholder="user@example.com"
              />
            </template>
          </AppField>

          <AppButton
            :label="t('pages.forgot.sendButton')"
            type="submit"
            variant="primary"
            block
            :loading="authStore.isPending"
            :disabled="!enteredEmail.includes('@')"
          />
        </form>

        <p class="page-forgot__footnote-link">
          {{ t('pages.forgot.rememberedIt') }}
          <NuxtLink to="/sign-in" class="page-forgot__link">
            {{ t('pages.forgot.backToSignIn') }}
          </NuxtLink>
        </p>
      </template>

      <!-- Step 2: Confirmation -->
      <template v-else-if="currentStep === 'sent'">
        <div class="page-forgot__sent-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div class="page-forgot__header">
          <h1 class="page-forgot__title">{{ t('pages.forgot.sentTitle') }}</h1>
          <p class="page-forgot__subtitle">
            {{ t('pages.forgot.sentSubtitle', { email: enteredEmail }) }}
          </p>
        </div>

        <!-- Plain anchor — AppButton always renders as <button>; we need a
             real `mailto:` link the OS can pick up. Styled to match
             AppButton variant=secondary/block. -->
        <a :href="mailtoLink" class="page-forgot__mail-button">
          {{ t('pages.forgot.openMailApp') }}
        </a>

        <p class="page-forgot__footnote-link">
          <NuxtLink to="/sign-in" class="page-forgot__link">
            {{ t('pages.forgot.backToSignIn') }}
          </NuxtLink>
        </p>
      </template>

      <!-- Step 3: Set new password -->
      <template v-else-if="currentStep === 'reset'">
        <div class="page-forgot__eyebrow">{{ t('pages.forgot.newPasswordEyebrow') }}</div>
        <div class="page-forgot__header">
          <h1 class="page-forgot__title">{{ t('pages.forgot.newPasswordTitle') }}</h1>
          <p class="page-forgot__subtitle">{{ t('pages.forgot.newPasswordSubtitle') }}</p>
        </div>

        <AppBanner v-if="errorMsg" variant="error" :body="errorMsg" class="page-forgot__banner" />

        <form class="page-forgot__form" novalidate @submit.prevent="onResetPassword">
          <AppPasswordField
            v-model="newPassword"
            :label="t('pages.forgot.newPasswordLabel')"
            auto-complete="new-password"
            with-meter
            required
          />

          <AppPasswordField
            v-model="confirmPassword"
            :label="t('pages.forgot.confirmPasswordLabel')"
            auto-complete="new-password"
            required
          />

          <AppButton
            :label="t('pages.forgot.updateButton')"
            type="submit"
            variant="primary"
            block
            :loading="authStore.isPending"
            :disabled="!newPassword || !confirmPassword"
          />
        </form>
      </template>
    </div>
  </AuthLayout>
</template>

<style lang="scss" scoped>
  .page-forgot {
    width: 100%;

    &__eyebrow {
      font-size: var(--text-xs);
      font-weight: var(--fw-medium);
      letter-spacing: var(--tracking-widest);
      color: var(--text-tertiary);
      margin-bottom: var(--space-3);
      text-transform: uppercase;
    }

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

    &__sent-icon {
      $icon-size: 48px; // success check circle icon

      display: flex;
      align-items: center;
      justify-content: center;
      width: $icon-size;
      height: $icon-size;
      border-radius: 50%;
      background: var(--success-soft);
      color: var(--success);
      margin-bottom: var(--space-5);
    }

    &__mail-button {
      $mail-button-height: 36px; // compact secondary action, below the 40px primary

      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: $mail-button-height;
      padding: 0 var(--space-4);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-default);
      background: var(--surface-overlay);
      color: var(--text-fg);
      font-size: var(--text-sm);
      font-weight: 500;
      text-decoration: none;
      transition:
        background var(--dur-fast) var(--ease-default),
        border-color var(--dur-fast) var(--ease-default);

      &:hover {
        background: var(--surface-raised);
        border-color: var(--border-strong);
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 2px;
      }
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
    }
  }
</style>
