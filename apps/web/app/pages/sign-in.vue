<script setup lang="ts">
  import { AppField, AppInput, AppButton, AppCheckbox, AppBanner, AppPasswordField } from '@app/ui';
  import { ref, computed } from 'vue';

  import { useAuthStore } from '~/stores/auth';
  import { useInstanceConfig } from '~/composables/useInstanceConfig';

  definePageMeta({ layout: false });

  const { t } = useI18n();
  const toast = useToast();
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

  // Countdown formatter — m:ss once we're over a minute, else "{n}s".
  function formatRetry(sec: number): string {
    if (sec >= 60) {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${String(m)}:${String(s).padStart(2, '0')}`;
    }
    return `${String(sec)}s`;
  }

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

    const result = await authStore.signIn(email.value, password.value, keepSignedIn.value);

    if (!result.ok) {
      if (result.statusCode === 429) {
        // Server-supplied Retry-After (seconds); fall back to 60 if absent.
        rateLimitSec.value = result.retryAfter ?? 60;
        return;
      }
      const msg = (result.error ?? '').toLowerCase();
      errorMsg.value =
        msg.includes('invalid') || msg.includes('credential') || msg.includes('password')
          ? t('pages.signIn.errorCredentials')
          : t('pages.signIn.errorGeneric');
      return;
    }
    toast.add({ title: t('pages.signIn.successToast'), color: 'success' });
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

      <!-- Rate-limit banner — the banner owns the countdown; we format it. -->
      <RateLimitBanner
        v-if="rateLimitSec !== null"
        :retry-after-sec="rateLimitSec"
        class="page-sign-in__banner"
        @expired="onRateLimitExpired"
      >
        <template #default="{ remaining }">
          {{ t('pages.signIn.errorRateLimit', { time: formatRetry(remaining) }) }}
        </template>
      </RateLimitBanner>

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
              autofocus
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

    &__row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
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

    &__legal {
      margin: var(--space-4) 0 0;
      font-size: var(--text-xs);
      color: var(--text-tertiary);
      text-align: center;
    }
  }
</style>
