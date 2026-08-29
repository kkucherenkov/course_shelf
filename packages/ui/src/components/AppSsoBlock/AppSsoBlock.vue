<script setup lang="ts">
  import AppButton from '../AppButton/AppButton.vue';

  import type { IconName } from '../IconCS/IconCS.vue';

  export interface SsoProvider {
    /** Stable identifier — emitted on click so the auth page can dispatch the right sign-in flow. */
    id: string;
    /** Visible label (e.g. "Continue with Google"). */
    label: string;
    /** Icon glyph from the IconCS family. */
    iconName: IconName;
  }

  withDefaults(
    defineProps<{
      providers: SsoProvider[];
      /** Accessible name for the provider group; override to translate. */
      groupLabel?: string;
    }>(),
    { groupLabel: 'Sign in with' },
  );

  const emit = defineEmits<{ select: [providerId: string] }>();

  function onClick(provider: SsoProvider): void {
    emit('select', provider.id);
  }
</script>

<template>
  <div v-if="providers.length > 0" class="app-sso-block" role="group" :aria-label="groupLabel">
    <AppButton
      v-for="provider in providers"
      :key="provider.id"
      variant="secondary"
      block
      :icon-leading="provider.iconName"
      :label="provider.label"
      @click="onClick(provider)"
    />
  </div>
</template>

<style scoped lang="scss">
  .app-sso-block {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
</style>
