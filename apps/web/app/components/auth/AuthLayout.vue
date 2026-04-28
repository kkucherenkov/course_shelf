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
    <!-- Marketing pane — hidden at < 768px via CSS -->
    <div class="auth-layout__marketing-pane" aria-hidden="true">
      <AuthMarketing :variant="variant" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $form-max-width: 420px; // max readable width for auth forms
  $marketing-pane-width: 420px; // fixed width for the marketing panel

  .auth-layout {
    display: flex;
    min-height: 100dvh;

    &__form-pane {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      min-width: 0;
      background: var(--surface-bg);
      padding: var(--space-8) var(--space-8) var(--space-12);
      overflow-y: auto;
    }

    &__brand {
      margin-bottom: var(--space-10);
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

    &__marketing-pane {
      display: none;
      flex: 0 0 $marketing-pane-width;
      min-width: 0;

      @media (min-width: 768px) {
        display: block;
      }
    }
  }
</style>
