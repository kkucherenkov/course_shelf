<script setup lang="ts">
  /**
   * /reset — handles the reset-link URL that Better Auth emails to users.
   * Redirects to /forgot?token=<token> so the forgot page can handle step 3
   * without duplicating the new-password form.
   */

  definePageMeta({ layout: false });

  const route = useRoute();

  const token = computed(() => route.query.token as string | undefined);

  watchEffect(() => {
    if (token.value) {
      void navigateTo(`/forgot?token=${encodeURIComponent(token.value)}`);
    } else {
      // No token — redirect to the first step of the forgot flow.
      void navigateTo('/forgot');
    }
  });
</script>

<template>
  <!-- Redirect in watchEffect; nothing to render. -->
  <div />
</template>
