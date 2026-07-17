<script setup lang="ts">
  type Variant = 'sign-in' | 'sign-up' | 'forgot';

  withDefaults(
    defineProps<{
      variant?: Variant;
    }>(),
    { variant: 'sign-in' },
  );
</script>

<template>
  <div class="auth-layout">
    <!-- Form pane -->
    <div class="auth-layout__form-pane">
      <div class="auth-layout__brand">
        <AuthBrand />
      </div>
      <div class="auth-layout__form-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $form-max-width: 380px; // max readable width for auth forms (brief §6.2)

  .auth-layout {
    display: flex;
    min-height: 100dvh;

    &__form-pane {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      min-width: 0;
      background: var(--surface-page);
      padding: var(--space-8) var(--space-8) var(--space-9);
      overflow-y: auto;
    }

    &__brand {
      margin-bottom: var(--space-8);
    }

    &__form-content {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: 100%;
      max-width: $form-max-width;
      margin: 0 auto;
    }
  }
</style>
