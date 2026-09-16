<script setup lang="ts">
  import { computed } from 'vue';
  import { AppIconButton } from '@app/ui';
  import type {
    AdminUserListItem,
    AdminUpdateUserRequest,
    AdminUserRole,
  } from '@app/api-client-ts';
  import AdminRoleChip from './AdminRoleChip.vue';
  import { avatarBgFromId } from '~/utils/avatar-color';

  const props = withDefaults(defineProps<Props>(), {
    rolesEditable: true,
    roleReadOnlyTooltip: undefined,
  });

  const emit = defineEmits<{
    /** Fired when the role/banned state should be changed. */
    roleChange: [patch: { role?: AdminUserRole; banned?: boolean }];
    /** Fired when the "Edit" icon button is clicked. */
    edit: [];
    /** Fired when the "More" icon button is clicked. */
    more: [];
  }>();

  const { locale } = useI18n();

  interface Props {
    user: AdminUserListItem;
    isSelf: boolean;
    // When false, the role chip never opens a menu regardless of `isSelf`
    // (e.g. the permissions picker, where roles are changed on /admin/users).
    rolesEditable?: boolean;
    // Pre-translated strings
    labelAdmin: string;
    labelUser: string;
    labelGuest: string;
    labelDisabled: string;
    roleChangeYourselfTooltip: string;
    // Shown instead of `roleChangeYourselfTooltip` when the chip is
    // read-only because of `rolesEditable`, not because of `isSelf`.
    roleReadOnlyTooltip?: string;
    editAriaLabel: string;
    moreAriaLabel: string;
  }

  const initials = computed<string>(() => {
    // displayName is string|null; fall back to name (always string).
    const name = props.user.displayName ?? props.user.name;
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w: string) => w[0]?.toUpperCase() ?? '')
      .join('');
  });

  const avatarBg = computed<string>(() => avatarBgFromId(props.user.id));

  const chipEditable = computed<boolean>(() => !props.isSelf && props.rolesEditable);

  const chipTooltip = computed<string | undefined>(() => {
    if (props.isSelf) return props.roleChangeYourselfTooltip;
    return props.rolesEditable ? undefined : props.roleReadOnlyTooltip;
  });

  function formatJoined(isoString: string): string {
    const d = new Date(isoString);
    return d.toLocaleDateString(locale.value, { month: 'short', day: 'numeric' });
  }

  function onRoleChange(patch: AdminUpdateUserRequest): void {
    emit('roleChange', patch);
  }
</script>

<template>
  <!-- No `role="row"` (#591): neither caller wraps this in a table/grid, so
       it's a styled list row, not an ARIA table row. -->
  <div class="adm-user-row">
    <!-- Avatar -->
    <div class="adm-user-row__avatar" aria-hidden="true" :style="{ background: avatarBg }">
      {{ initials }}
    </div>

    <!-- Name + email -->
    <div class="adm-user-row__name-col">
      <div class="adm-user-row__name">{{ user.displayName ?? user.name }}</div>
      <div class="adm-user-row__email">{{ user.email }}</div>
    </div>

    <!-- Role chip (md+) -->
    <div class="adm-user-row__role" @click.stop @keydown.stop>
      <AdminRoleChip
        :role="user.role"
        :banned="user.banned"
        :editable="chipEditable"
        :label-admin="labelAdmin"
        :label-user="labelUser"
        :label-guest="labelGuest"
        :label-disabled="labelDisabled"
        :tooltip-self="chipTooltip"
        @change="onRoleChange"
      />
    </div>

    <!-- Joined date (md+) -->
    <div class="adm-user-row__joined">{{ formatJoined(user.createdAt) }}</div>

    <!-- Actions -->
    <div class="adm-user-row__actions" @click.stop @keydown.stop>
      <AppIconButton
        name="edit"
        variant="ghost"
        size="sm"
        :ariaLabel="editAriaLabel"
        @click="emit('edit')"
      />
      <AppIconButton
        name="more-h"
        variant="ghost"
        size="sm"
        :ariaLabel="moreAriaLabel"
        @click="emit('more')"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $avatar-size: 36px;
  $row-pad-v: 12px;
  $row-pad-h: 14px;

  .adm-user-row {
    display: grid;
    gap: var(--space-3);
    align-items: center;
    padding: $row-pad-v $row-pad-h;
    border-bottom: 1px solid var(--border-default);

    // xs: avatar + name-col + actions
    grid-template-columns: #{$avatar-size} 1fr auto;

    @media (width >= 768px) {
      // md: avatar + name + role + joined + actions
      grid-template-columns: 32px 1.4fr 0.9fr 0.7fr auto;
    }

    @media (width >= 1024px) {
      // lg: avatar + name + role + joined + actions (wider name column)
      grid-template-columns: #{$avatar-size} 1.5fr 1.2fr 0.9fr auto;
    }

    &:last-child {
      border-bottom: 0;
    }

    &:hover {
      background: var(--surface-raised);
    }

    // ── Avatar ────────────────────────────────────────────────────────────────
    &__avatar {
      width: $avatar-size;
      height: $avatar-size;
      border-radius: 50%;
      display: grid;
      place-items: center;
      // #700: was a raw 13px SCSS var, off-scale and invisible to the literal gate.
      font-size: var(--text-md);
      font-weight: var(--fw-semibold);
      font-family: var(--font-mono);
      // Theme-independent: --avatar-* backgrounds don't flip with the page
      // theme (hashed from the user id), so a theme-flipped foreground like
      // --brand-accent-fg went near-black-on-blue in dark mode.
      color: var(--media-fg);
      flex-shrink: 0;
      user-select: none;
    }

    // ── Name column ───────────────────────────────────────────────────────────
    &__name-col {
      min-width: 0;
    }

    &__name {
      font-size: var(--text-sm);
      font-weight: var(--fw-medium);
      color: var(--text-loud);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__email {
      font-size: var(--text-xs);
      color: var(--text-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-top: var(--space-1);
    }

    // ── Role chip ─────────────────────────────────────────────────────────────
    &__role {
      display: none;

      @media (width >= 768px) {
        display: block;
      }
    }

    // ── Joined ────────────────────────────────────────────────────────────────
    &__joined {
      display: none;
      font-size: var(--text-xs);
      color: var(--text-secondary);
      font-family: var(--font-mono);

      @media (width >= 768px) {
        display: block;
      }
    }

    // ── Actions ───────────────────────────────────────────────────────────────
    &__actions {
      display: flex;
      gap: var(--space-1);
    }
  }
</style>
