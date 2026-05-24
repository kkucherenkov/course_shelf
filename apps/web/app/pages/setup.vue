<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { AppTextField, AppButton, AppBanner } from '@app/ui';

  import { useAuthStore } from '~/stores/auth';

  // First-run admin onboarding — pre-auth, no shell.
  definePageMeta({ layout: false });

  const { t } = useI18n();
  const authStore = useAuthStore();

  const email = ref('');
  const password = ref('');
  const displayName = ref('');
  const errorMsg = ref('');

  const emailValid = computed(() => email.value.includes('@') && email.value.length >= 5);
  const passwordValid = computed(() => password.value.length >= 8);
  const formValid = computed(() => emailValid.value && passwordValid.value);

  async function onSubmit(): Promise<void> {
    errorMsg.value = '';
    if (!formValid.value) return;
    const result = await authStore.signUp(
      email.value,
      password.value,
      displayName.value.trim() || undefined,
    );
    if (!result.ok) {
      errorMsg.value = result.error ?? t('pages.setup.errorGeneric');
      return;
    }
    await navigateTo('/');
  }
</script>

<template>
  <div class="page-setup" data-testid="page-setup">
    <div class="page-setup__card">
      <header class="page-setup__header">
        <h1 class="page-setup__title">
          {{ t('pages.setup.title') }}
        </h1>
        <p class="page-setup__subtitle">
          {{ t('pages.setup.subtitle') }}
        </p>
      </header>

      <AppBanner v-if="errorMsg" variant="error" :body="errorMsg" />

      <form class="page-setup__form" novalidate @submit.prevent="onSubmit">
        <AppTextField
          v-model="email"
          :label="t('pages.setup.emailLabel')"
          :help="t('pages.setup.emailHint')"
          type="email"
          autocomplete="email"
          inputmode="email"
          placeholder="admin@example.com"
          required
        />
        <AppTextField
          v-model="password"
          :label="t('pages.setup.passwordLabel')"
          :help="t('pages.setup.passwordHint')"
          type="password"
          autocomplete="new-password"
          required
        />
        <AppTextField
          v-model="displayName"
          :label="t('pages.setup.displayNameLabel')"
          :help="t('pages.setup.displayNameHint')"
          autocomplete="name"
        />
        <AppButton
          :label="t('pages.setup.submitButton')"
          type="submit"
          variant="primary"
          block
          :loading="authStore.isPending"
          :disabled="!formValid"
        />
      </form>

      <p class="page-setup__legal">
        {{ t('pages.setup.legalFootnote') }}
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .page-setup {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100dvh;
    padding: var(--space-8);
    background: var(--surface-bg);

    &__card {
      width: 100%;
      max-width: 480px;
      background: var(--surface-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-xl);
      padding: var(--space-8);
      box-shadow: var(--shadow-md);
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
    }

    &__header {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    &__title {
      margin: 0;
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

    &__form {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    &__legal {
      margin: 0;
      font-size: var(--text-xs);
      color: var(--text-fg-subtle);
      text-align: center;
    }
  }
</style>
