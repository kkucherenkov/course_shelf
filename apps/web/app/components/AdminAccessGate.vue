<script setup lang="ts">
  /**
   * Gates `<slot/>` on `useAdminAccess.ts`'s three-state read (#776).
   *
   * Pure props-in — the reactive read of auth state stays in
   * `layouts/default.vue`, which already legitimately owns it (#602). This
   * component only decides what to render for each state:
   *  - 'unknown'  — a loading state, not the real page (which would fetch
   *    its own admin data and 403 while role is still unresolved).
   *  - 'denied'   — `AppNoPermission` inline, on the real `/admin` URL, no
   *    retry action (a 403 can't be retried into a 200).
   *  - 'granted'  — the slotted content, unchanged.
   */
  import { AppNoPermission, AppSkeleton } from '@app/ui';

  import type { AdminAccessState } from '~/composables/useAdminAccess';

  defineProps<{
    state: AdminAccessState;
    /** Accessible label for the loading state's `role="status"` region. */
    loadingLabel: string;
    deniedTitle: string;
    deniedBody: string;
  }>();
</script>

<template>
  <div
    v-if="state === 'unknown'"
    class="admin-access-gate admin-access-gate--loading"
    role="status"
    aria-live="polite"
  >
    <span class="sr-only">{{ loadingLabel }}</span>
    <AppSkeleton width="40%" height="2rem" radius="md" />
    <AppSkeleton width="100%" height="10rem" radius="md" />
  </div>
  <AppNoPermission
    v-else-if="state === 'denied'"
    :title="deniedTitle"
    :body="deniedBody"
    class="admin-access-gate"
  />
  <slot v-else />
</template>

<style scoped lang="scss">
  .admin-access-gate {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-6);
  }
</style>
