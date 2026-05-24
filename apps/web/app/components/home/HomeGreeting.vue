<script setup lang="ts">
  import { AppAvatar } from '@app/ui';

  defineProps<{
    /** User display name. */
    name: string;
    /** Avatar URL — undefined means initials fallback. */
    avatarUrl?: string;
    /** User role label already translated by the parent. */
    roleLabel: string;
    /** AppAvatar role prop — controls the badge colour. */
    avatarRole?: 'admin' | 'guest';
    /** Greeting prefix — already translated (e.g. "Good to see you,"). */
    greeting: string;
  }>();
</script>

<template>
  <div class="home-greeting">
    <AppAvatar
      :image="avatarUrl"
      :name="name"
      :role="avatarRole"
      size="xl"
      class="home-greeting__avatar"
    />
    <div class="home-greeting__text">
      <h1 class="home-greeting__hello">
        {{ greeting }}
        <span class="home-greeting__name">{{ name }}</span>
      </h1>
      <span class="home-greeting__role">{{ roleLabel }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
  .home-greeting {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-6) 0 var(--space-2);

    &__text {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    &__hello {
      margin: 0;
      font-size: var(--text-xl);
      font-weight: var(--fw-semibold);
      color: var(--text-fg);
      line-height: var(--leading-snug);
    }

    &__name {
      color: var(--brand-accent);
    }

    &__role {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      font-weight: var(--fw-medium);
    }
  }
</style>
