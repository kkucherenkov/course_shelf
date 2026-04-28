<script setup lang="ts">
  /**
   * Legacy token preview route. Redirects to /dev/foundations which supersedes
   * this page with all 16 design-system sections (E03-F01-S02).
   */
  definePageMeta({ layout: false });
</script>

<template>
  <div class="tokens-redirect">
    <p>
      This page has moved to
      <NuxtLink to="/dev/foundations">/dev/foundations</NuxtLink>.
    </p>
    <NuxtLink to="/dev/foundations" class="tokens-redirect__link">Go to Foundations</NuxtLink>
  </div>
</template>

<style lang="scss" scoped>
  .tokens-redirect {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    gap: var(--space-4);
    color: var(--text-fg);
    font-family: var(--font-sans);

    &__link {
      color: var(--brand-accent);
      text-decoration: underline;
      font-size: var(--text-md);
    }
  }
</style>
