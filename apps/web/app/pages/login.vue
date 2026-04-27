<script setup lang="ts">
  import { AppInput, AppField, AppButton } from '@app/ui';
  import { ref, computed } from 'vue';

  import { useAuthStore } from '~/stores/auth';

  const { t } = useI18n({ useScope: 'local' });
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
      errorMsg.value = t('errorEmailInvalid');
      return;
    }
    if (!passwordValid.value) {
      errorMsg.value = t('errorPasswordTooShort');
      return;
    }
    const result = await authStore.signIn(email.value, password.value);
    if (!result.ok) {
      const msg = (result.error ?? '').toLowerCase();
      errorMsg.value =
        msg.includes('invalid') || msg.includes('credential') || msg.includes('password')
          ? t('errorCredentials')
          : t('errorGeneric');
      return;
    }
    await navigateTo('/');
  }
</script>

<i18n lang="json">
{
  "en": {
    "title": "Sign in",
    "subtitle": "Enter your email and password to continue.",
    "emailLabel": "Email",
    "emailHint": "Your registered email address.",
    "passwordLabel": "Password",
    "passwordHint": "At least 8 characters.",
    "signInButton": "Sign in",
    "noAccount": "Don't have an account?",
    "signUpLink": "Sign up",
    "legalFootnote": "By continuing, you agree to our Terms and Privacy Policy.",
    "errorEmailInvalid": "Please enter a valid email address.",
    "errorPasswordTooShort": "Password must be at least 8 characters.",
    "errorCredentials": "Incorrect email or password. Please try again.",
    "errorGeneric": "Something went wrong. Please try again."
  },
  "ru": {
    "title": "Войти",
    "subtitle": "Введите email и пароль для входа.",
    "emailLabel": "Email",
    "emailHint": "Ваш зарегистрированный email.",
    "passwordLabel": "Пароль",
    "passwordHint": "Не менее 8 символов.",
    "signInButton": "Войти",
    "noAccount": "Нет аккаунта?",
    "signUpLink": "Зарегистрироваться",
    "legalFootnote": "Продолжая, вы соглашаетесь с условиями и политикой конфиденциальности.",
    "errorEmailInvalid": "Введите корректный email.",
    "errorPasswordTooShort": "Пароль должен содержать не менее 8 символов.",
    "errorCredentials": "Неверный email или пароль. Попробуйте ещё раз.",
    "errorGeneric": "Что-то пошло не так. Попробуйте ещё раз."
  }
}
</i18n>

<template>
  <div class="page-login" data-testid="page-login">
    <div class="page-login__card">
      <div class="page-login__header">
        <h1 class="page-login__title">
          {{ t('title') }}
        </h1>
        <p class="page-login__subtitle">
          {{ t('subtitle') }}
        </p>
      </div>

      <p v-if="errorMsg" role="alert" class="page-login__error">
        {{ errorMsg }}
      </p>

      <form class="page-login__form" novalidate @submit.prevent="onSignIn">
        <AppField :label="t('emailLabel')" :help="t('emailHint')" required>
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

        <AppField :label="t('passwordLabel')" :help="t('passwordHint')" required>
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
          :label="t('signInButton')"
          type="submit"
          variant="primary"
          block
          :loading="authStore.isPending"
          :disabled="!formValid"
        />
      </form>

      <p class="page-login__footnote-link">
        {{ t('noAccount') }}
        <NuxtLink to="/signup" class="page-login__link">
          {{ t('signUpLink') }}
        </NuxtLink>
      </p>

      <p class="page-login__legal">
        {{ t('legalFootnote') }}
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .page-login {
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
