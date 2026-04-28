<script setup lang="ts">
  import {
    AppField,
    AppInput,
    AppButton,
    AppCheckbox,
    AppSsoBlock,
    AppBanner,
    AppPasswordField,
  } from '@app/ui';
  import type { SsoProvider } from '@app/ui';
  import type { IconName } from '@app/ui';
  import { ref, computed } from 'vue';

  import { useAuthStore } from '~/stores/auth';
  import { useInstanceConfig } from '~/composables/useInstanceConfig';

  definePageMeta({ layout: false });

  const { t } = useI18n();
  const authStore = useAuthStore();
  const { config } = useInstanceConfig();

  const email = ref('');
  const password = ref('');
  const keepSignedIn = ref(false);
  const errorMsg = ref('');
  const rateLimitSec = ref<number | null>(null);

  const emailValid = computed(() => email.value.includes('@') && email.value.length >= 5);
  const passwordValid = computed(() => password.value.length >= 8);
  const formValid = computed(() => emailValid.value && passwordValid.value);

  // SsoProviderConfig.iconName is string; AppSsoBlock.SsoProvider.iconName is IconName (union).
  // The cast is safe: the backend only emits valid icon names.
  const ssoProviders = computed<SsoProvider[]>(() =>
    config.value.ssoProviders.map((p) => ({
      id: p.id,
      label: p.label,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      iconName: p.iconName as IconName,
    })),
  );

  async function onSignIn(): Promise<void> {
    if (rateLimitSec.value !== null) return;
    errorMsg.value = '';
    if (!emailValid.value) {
      errorMsg.value = t('pages.signIn.errorEmailInvalid');
      return;
    }
    if (!passwordValid.value) {
      errorMsg.value = t('pages.signIn.errorPasswordTooShort');
      return;
    }

    const result = await authStore.signIn(email.value, password.value);

    if (!result.ok) {
      const statusCode = (result as { statusCode?: number }).statusCode;
      if (statusCode === 429) {
        // Try to extract Retry-After from error payload.
        const retryAfter = (result as { retryAfter?: number }).retryAfter ?? 60;
        rateLimitSec.value = retryAfter;
        return;
      }
      const msg = (result.error ?? '').toLowerCase();
      errorMsg.value =
        msg.includes('invalid') || msg.includes('credential') || msg.includes('password')
          ? t('pages.signIn.errorCredentials')
          : t('pages.signIn.errorGeneric');
      return;
    }
    await navigateTo('/');
  }

  function onRateLimitExpired(): void {
    rateLimitSec.value = null;
  }
</script>

<template>
  <AuthLayout variant="sign-in">
    <div class="page-sign-in" data-testid="page-sign-in">
      <div class="page-sign-in__header">
        <h1 class="page-sign-in__title">
          {{ t('pages.signIn.title') }}
        </h1>
        <p class="page-sign-in__subtitle">
          {{ t('pages.signIn.subtitle') }}
        </p>
      </div>

      <!-- Rate-limit banner -->
      <RateLimitBanner
        v-if="rateLimitSec !== null"
        :retry-after-sec="rateLimitSec"
        :body-prefix="t('pages.signIn.errorRateLimit', { n: rateLimitSec })"
        class="page-sign-in__banner"
        @expired="onRateLimitExpired"
      />

      <!-- Generic error banner -->
      <AppBanner
        v-else-if="errorMsg"
        variant="error"
        :body="errorMsg"
        class="page-sign-in__banner"
      />

      <form class="page-sign-in__form" novalidate @submit.prevent="onSignIn">
        <AppField
          :label="t('pages.signIn.emailLabel')"
          :help="t('pages.signIn.emailHint')"
          required
        >
          <template #default="slotAttrs">
            <AppInput
              v-bind="slotAttrs"
              v-model="email"
              type="email"
              autocomplete="email"
              inputmode="email"
              placeholder="user@example.com"
            />
          </template>
        </AppField>

        <AppPasswordField
          v-model="password"
          :label="t('pages.signIn.passwordLabel')"
          :hint="t('pages.signIn.passwordHint')"
          auto-complete="current-password"
          required
        />

        <div class="page-sign-in__row">
          <AppCheckbox v-model="keepSignedIn" :label="t('pages.signIn.keepSignedInLabel')" />
          <NuxtLink to="/forgot" class="page-sign-in__link">
            {{ t('pages.signIn.forgotPasswordLink') }}
          </NuxtLink>
        </div>

        <AppButton
          :label="t('pages.signIn.signInButton')"
          type="submit"
          variant="primary"
          block
          :loading="authStore.isPending"
          :disabled="!formValid || rateLimitSec !== null"
        />
      </form>

      <!-- SSO block — only when providers are configured -->
      <template v-if="ssoProviders.length > 0">
        <div class="page-sign-in__divider" aria-hidden="true">
          <span>or</span>
        </div>
        <AppSsoBlock :providers="ssoProviders" />
      </template>

      <!-- Sign-up CTA — hidden when self-registration is disabled -->
      <p v-if="config.selfRegistration" class="page-sign-in__footnote-link">
        {{ t('pages.signIn.noAccount') }}
        <NuxtLink to="/sign-up" class="page-sign-in__link">
          {{ t('pages.signIn.signUpLink') }}
        </NuxtLink>
      </p>

      <p class="page-sign-in__legal">
        {{ t('pages.signIn.legalFootnote') }}
      </p>
    </div>
  </AuthLayout>
</template>

<style lang="scss" scoped>
  .page-sign-in {
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
      color: var(--text-fg-muted);
    }

    &__banner {
      margin-bottom: var(--space-4);
    }

    &__form {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    &__row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
    }

    &__divider {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin: var(--space-5) 0;
      font-size: var(--text-xs);
      color: var(--text-fg-subtle);

      &::before,
      &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--border-default);
      }
    }

    &__footnote-link {
      margin: var(--space-4) 0 0;
      font-size: var(--text-sm);
      color: var(--text-fg-muted);
      text-align: center;
    }

    &__link {
      color: var(--brand-accent);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    &__legal {
      margin: var(--space-4) 0 0;
      font-size: var(--text-xs);
      color: var(--text-fg-subtle);
      text-align: center;
    }
  }
</style>
