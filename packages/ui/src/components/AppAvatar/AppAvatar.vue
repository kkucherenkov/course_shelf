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
  // Avatar diameters and glyph sizes that fall between design-token steps.
  // The scale is a bespoke ramp, not the spacing scale, so the off-step rungs
  // live here as named variables (same literals as before — nothing moves).
  $size-xs: 20px;
  $size-lg: 40px;
  $size-xl: 56px;
  $initials-xs: 10px;
  $initials-md: 13px;
  $initials-lg: 15px;
  $role-glyph: 7px;

  .app-avatar {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: var(--space-6);
    height: var(--space-6);
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
      width: $size-xs;
      height: $size-xs;
      font-size: $initials-xs;
    }
    &--sm {
      width: var(--space-5);
      height: var(--space-5);
      font-size: var(--text-xs);
    }
    &--md {
      width: var(--space-6);
      height: var(--space-6);
      font-size: $initials-md;
    }
    &--lg {
      width: $size-lg;
      height: $size-lg;
      font-size: $initials-lg;
    }
    &--xl {
      width: $size-xl;
      height: $size-xl;
      font-size: var(--text-lg);
    }

    &__role {
      position: absolute;
      right: -2px;
      bottom: -2px;
      width: var(--space-3);
      height: var(--space-3);
      border-radius: 50%;
      border: 2px solid var(--surface-page);
      font-size: $role-glyph;
      display: grid;
      place-items: center;
      font-weight: var(--fw-bold);
      // The badge sits on a saturated accent/info fill, so it needs the
      // theme's on-fill foreground rather than a fixed white: in light this
      // resolves to #FFFFFF (unchanged), in dark it flips to the dark ink that
      // stays legible on the lighter accent.
      color: var(--brand-accent-fg);
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
