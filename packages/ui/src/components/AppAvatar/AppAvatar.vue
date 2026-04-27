<script setup lang="ts">
  import { computed } from 'vue';

  type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  type Role = 'admin' | 'guest';

  const props = withDefaults(
    defineProps<{
      image?: string;
      initials?: string;
      name?: string;
      size?: Size;
      role?: Role;
    }>(),
    { image: undefined, initials: undefined, name: undefined, size: 'md', role: undefined },
  );

  // Derive initials when not explicitly provided. First letter of each word, max 2.
  const computedInitials = computed(() => {
    if (props.initials) return props.initials.toUpperCase();
    if (!props.name) return '';
    const words = props.name.trim().split(/\s+/).filter(Boolean);
    return words
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');
  });

  const roleLabel = computed<string | undefined>(() =>
    props.role === 'admin' ? 'Administrator' : props.role === 'guest' ? 'Guest' : undefined,
  );

  const roleLetter = computed<string | undefined>(() =>
    props.role === 'admin' ? 'A' : props.role === 'guest' ? 'G' : undefined,
  );
</script>

<template>
  <span :class="['app-avatar', `app-avatar--${size}`]">
    <img v-if="image" :src="image" :alt="name ?? 'Avatar'" class="app-avatar__image" />
    <span v-else class="app-avatar__initials">{{ computedInitials }}</span>
    <span
      v-if="role"
      :class="['app-avatar__role', `app-avatar__role--${role}`]"
      role="img"
      :aria-label="roleLabel"
    >
      {{ roleLetter }}
    </span>
  </span>
</template>

<style scoped lang="scss">
  .app-avatar {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--surface-overlay), var(--surface-raised));
    color: var(--text-fg);
    font-weight: var(--fw-medium);
    font-size: var(--text-sm);
    border: 1px solid var(--border-default);
    overflow: visible;
    user-select: none;

    &__image {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }

    &__initials {
      line-height: 1;
    }

    &--xs {
      width: 20px;
      height: 20px;
      font-size: 10px;
    }
    &--sm {
      width: 24px;
      height: 24px;
      font-size: 11px;
    }
    &--md {
      width: 32px;
      height: 32px;
      font-size: 13px;
    }
    &--lg {
      width: 40px;
      height: 40px;
      font-size: 15px;
    }
    &--xl {
      width: 56px;
      height: 56px;
      font-size: 18px;
    }

    &__role {
      position: absolute;
      right: -2px;
      bottom: -2px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid var(--surface-page);
      font-size: 7px;
      display: grid;
      place-items: center;
      font-weight: var(--fw-bold);
      color: white;
      line-height: 1;

      &--admin {
        background: var(--brand-accent);
      }
      &--guest {
        background: var(--status-info-fg);
      }
    }
  }
</style>
