<script setup lang="ts">
  import { ref, computed } from 'vue';
  import type { AdminUserRole } from '@app/api-client-ts';

  // Extend the visual role concept with 'disabled' for banned users.
  type VisualRole = AdminUserRole | 'disabled';

  interface Props {
    role: AdminUserRole;
    banned: boolean;
    editable: boolean;
    // Pre-translated labels
    labelAdmin: string;
    labelUser: string;
    labelGuest: string;
    labelDisabled: string;
    // Tooltip for the self-protect case
    tooltipSelf?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    tooltipSelf: undefined,
  });

  const emit = defineEmits<{
    /** Fired when the admin selects a different role or toggles banned. */
    change: [payload: { role?: AdminUserRole; banned?: boolean }];
  }>();

  const menuOpen = ref(false);

  const visualRole = computed<VisualRole>(() => (props.banned ? 'disabled' : props.role));

  const chipLabel = computed<string>(() => {
    switch (visualRole.value) {
      case 'admin': {
        return props.labelAdmin;
      }
      case 'user': {
        return props.labelUser;
      }
      case 'guest': {
        return props.labelGuest;
      }
      default: {
        // 'disabled' (banned) — exhaustive via VisualRole union
        return props.labelDisabled;
      }
    }
  });

  function toggleMenu(): void {
    if (!props.editable) return;
    menuOpen.value = !menuOpen.value;
  }

  function closeMenu(): void {
    menuOpen.value = false;
  }

  interface MenuOption {
    visualRole: VisualRole;
    label: string;
    payload: { role?: AdminUserRole; banned?: boolean };
  }

  const menuOptions = computed<MenuOption[]>(() => [
    { visualRole: 'admin', label: props.labelAdmin, payload: { role: 'admin', banned: false } },
    { visualRole: 'user', label: props.labelUser, payload: { role: 'user', banned: false } },
    { visualRole: 'guest', label: props.labelGuest, payload: { role: 'guest', banned: false } },
    { visualRole: 'disabled', label: props.labelDisabled, payload: { banned: true } },
  ]);

  function select(option: MenuOption): void {
    emit('change', option.payload);
    closeMenu();
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleMenu();
    }
    if (event.key === 'Escape') {
      closeMenu();
    }
  }
</script>

<template>
  <span class="adm-role-chip" :title="!editable && tooltipSelf ? tooltipSelf : undefined">
    <!-- The chip itself -->
    <span
      class="adm-role-chip__pill"
      :class="`adm-role-chip__pill--${visualRole}`"
      :data-role="visualRole"
      :role="editable ? 'button' : undefined"
      :tabindex="editable ? 0 : undefined"
      :aria-haspopup="editable ? 'listbox' : undefined"
      :aria-expanded="editable ? menuOpen : undefined"
      @click="toggleMenu"
      @keydown="onKeydown"
    >
      <span
        v-if="visualRole === 'admin'"
        class="i-heroicons-shield-check adm-role-chip__icon"
        aria-hidden="true"
      />
      {{ chipLabel }}
      <span
        v-if="editable"
        class="i-heroicons-chevron-down adm-role-chip__caret"
        aria-hidden="true"
      />
    </span>

    <!-- Dropdown menu -->
    <span v-if="menuOpen && editable" class="adm-role-chip__menu" role="listbox">
      <span
        v-for="option in menuOptions"
        :key="option.visualRole"
        class="adm-role-chip__option"
        :class="`adm-role-chip__option--${option.visualRole}`"
        :aria-selected="option.visualRole === visualRole"
        role="option"
        tabindex="0"
        @click.stop="select(option)"
        @keydown.enter.prevent="select(option)"
        @keydown.space.prevent="select(option)"
      >
        {{ option.label }}
      </span>
    </span>

    <!-- Click-away backdrop -->
    <span
      v-if="menuOpen && editable"
      class="adm-role-chip__backdrop"
      aria-hidden="true"
      @click.stop="closeMenu"
    />
  </span>
</template>

<style lang="scss" scoped>
  $chip-font: var(--text-xs);
  $chip-fw: 500;
  $icon-size: 11px;
  $chip-pad-v: 3px;
  $menu-min-w: 120px;
  $menu-z: var(--z-dropdown, 200);
  $dur-chip: var(--dur-fast);

  .adm-role-chip {
    position: relative;
    display: inline-block;

    // ── Pill ───────────────────────────────────────────────────────────────────
    &__pill {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      padding: $chip-pad-v var(--space-2) $chip-pad-v var(--space-2);
      border-radius: var(--radius-pill);
      font-size: $chip-font;
      font-weight: $chip-fw;
      line-height: 1.4;
      border: 1px solid transparent;
      white-space: nowrap;
      transition: background $dur-chip ease;
      user-select: none;

      &[role='button'] {
        cursor: pointer;

        &:hover {
          filter: brightness(0.95);
        }

        &:focus-visible {
          outline: 2px solid var(--brand-accent);
          outline-offset: 2px;
        }
      }

      // Role colour variants matching design tokens
      &--admin {
        background: var(--brand-accent-soft);
        color: var(--brand-accent-hover);
      }

      &--user {
        background: var(--surface-raised);
        color: var(--text-fg);
        border-color: var(--border-default);
      }

      &--guest {
        background: var(--status-info-soft);
        color: var(--status-info-fg);
      }

      &--disabled {
        background: var(--surface-raised);
        color: var(--text-subtle);
        border-color: var(--border-default);
        text-decoration: line-through;
      }
    }

    &__icon {
      width: $icon-size;
      height: $icon-size;
      flex-shrink: 0;
    }

    &__caret {
      width: $icon-size;
      height: $icon-size;
      flex-shrink: 0;
      opacity: 0.65;
    }

    // ── Dropdown menu ─────────────────────────────────────────────────────────
    &__menu {
      position: absolute;
      top: calc(100% + var(--space-1));
      left: 0;
      z-index: $menu-z;
      display: flex;
      flex-direction: column;
      min-width: $menu-min-w;
      background: var(--surface-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-md);
      padding: var(--space-1) 0;
      overflow: hidden;
    }

    &__option {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      font-size: $chip-font;
      font-weight: $chip-fw;
      cursor: pointer;
      color: var(--text-fg);

      &:hover {
        background: var(--surface-raised);
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: -2px;
      }

      &[aria-selected='true'] {
        background: var(--brand-accent-soft);
        color: var(--brand-accent-hover);
      }

      &--disabled {
        color: var(--status-error-fg);
      }
    }

    // ── Click-away backdrop ───────────────────────────────────────────────────
    &__backdrop {
      position: fixed;
      inset: 0;
      z-index: calc(#{$menu-z} - 1);
    }
  }
</style>
