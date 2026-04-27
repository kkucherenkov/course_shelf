<script setup lang="ts">
  import { AppInput, AppField, AppButton } from '@app/ui';
  import { ref, computed } from 'vue';

  import { useAuthStore } from '~/stores/auth';

  const { t } = useI18n();
  const authStore = useAuthStore();

  const email = ref('');
  const password = ref('');
  const errorMsg = ref('');

  const emailValid = computed(() => email.value.includes('@') && email.value.length >= 5);
  const passwordValid = computed(() => password.value.length >= 8);
  const formValid = computed(() => emailValid.value && passwordValid.value);

  async function onSignIn(): Promise<void> {
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
      const msg = (result.error ?? '').toLowerCase();
      errorMsg.value =
        msg.includes('invalid') || msg.includes('credential') || msg.includes('password')
          ? t('pages.signIn.errorCredentials')
          : t('pages.signIn.errorGeneric');
      return;
    }
    await navigateTo('/');
  }
</script>

<template>
  <div class="page-sign-in" data-testid="page-sign-in">
    <div class="page-sign-in__card">
      <div class="page-sign-in__header">
        <h1 class="page-sign-in__title">
          {{ t('pages.signIn.title') }}
        </h1>
        <p class="page-sign-in__subtitle">
          {{ t('pages.signIn.subtitle') }}
        </p>
      </div>

      <p v-if="errorMsg" role="alert" class="page-sign-in__error">
        {{ errorMsg }}
      </p>

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

        <AppField
          :label="t('pages.signIn.passwordLabel')"
          :help="t('pages.signIn.passwordHint')"
          required
        >
          <template #default="slotAttrs">
            <AppInput
              v-bind="slotAttrs"
              v-model="password"
              type="password"
              autocomplete="current-password"
            />
          </template>
        </AppField>

        <AppButton
          :label="t('pages.signIn.signInButton')"
          type="submit"
          variant="primary"
          block
          :loading="authStore.isPending"
          :disabled="!formValid"
        />
      </form>

      <p class="page-sign-in__footnote-link">
        {{ t('pages.signIn.noAccount') }}
        <NuxtLink to="/signup" class="page-sign-in__link">
          {{ t('pages.signIn.signUpLink') }}
        </NuxtLink>
      </p>

      <p class="page-sign-in__legal">
        {{ t('pages.signIn.legalFootnote') }}
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .page-sign-in {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100dvh;
    padding: var(--space-8);
    background: var(--surface-bg);

    &__card {
      width: 100%;
      max-width: 400px;
      background: var(--surface-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-xl);
      padding: var(--space-12);
      box-shadow: var(--shadow-md);
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
      color: var(--text-fg-muted);
    }

    &__error {
      margin: 0 0 var(--space-4);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      background: var(--status-danger-soft);
      color: var(--status-danger);
      font-size: var(--text-sm);
    }

    &__form {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
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
