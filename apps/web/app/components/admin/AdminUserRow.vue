<script setup lang="ts">
  import { computed } from 'vue';
  import type {
    AdminUserListItem,
    AdminUpdateUserRequest,
    AdminUserRole,
  } from '@app/api-client-ts';
  import AdminRoleChip from './AdminRoleChip.vue';

  const props = defineProps<Props>();

  const emit = defineEmits<{
    /** Fired when the role/banned state should be changed. */
    roleChange: [patch: { role?: AdminUserRole; banned?: boolean }];
    /** Fired when the "Edit" icon button is clicked. */
    edit: [];
    /** Fired when the "More" icon button is clicked. */
    more: [];
  }>();

  // Deterministic accent colours derived from user id.
  // Palette of 6 background CSS colours that pair well with white text.
  const AVATAR_PALETTES = [
    '#4f76c8', // indigo
    '#2d9e7a', // teal
    '#c07a2e', // amber
    '#8a4fc8', // violet
    '#b04040', // coral
    '#4a8cb0', // blue-grey
  ];

  function avatarBgFromId(id: string): string {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = ((h * 31 + (id.codePointAt(i) ?? 0)) >>> 0) >>> 0;
    // AVATAR_PALETTES has 6 entries; modulo guarantees a valid index.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- palette is statically non-empty
    return AVATAR_PALETTES[h % AVATAR_PALETTES.length]!;
  }

  interface Props {
    user: AdminUserListItem;
    isSelf: boolean;
    // Pre-translated strings
    labelAdmin: string;
    labelUser: string;
    labelGuest: string;
    labelDisabled: string;
    roleChangeYourselfTooltip: string;
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

  function formatJoined(isoString: string): string {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function onRoleChange(patch: AdminUpdateUserRequest): void {
    emit('roleChange', patch);
  }
</script>

<template>
  <div class="adm-user-row" role="row">
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
        :editable="!isSelf"
        :label-admin="labelAdmin"
        :label-user="labelUser"
        :label-guest="labelGuest"
        :label-disabled="labelDisabled"
        :tooltip-self="roleChangeYourselfTooltip"
        @change="onRoleChange"
      />
    </div>

    <!-- Joined date (md+) -->
    <div class="adm-user-row__joined">{{ formatJoined(user.createdAt) }}</div>

    <!-- Actions -->
    <div class="adm-user-row__actions" @click.stop @keydown.stop>
      <button
        type="button"
        class="adm-user-row__btn adm-user-row__btn--icon"
        :aria-label="editAriaLabel"
        @click="emit('edit')"
      >
        <span class="i-heroicons-pencil-square" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="adm-user-row__btn adm-user-row__btn--icon"
        :aria-label="moreAriaLabel"
        @click="emit('more')"
      >
        <span class="i-heroicons-ellipsis-horizontal" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $avatar-size: 36px;
  $avatar-font: 13px;
  $btn-icon-size: 28px;
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

    @media (min-width: 768px) {
      // md: avatar + name + role + joined + actions
      grid-template-columns: 32px 1.4fr 0.9fr 0.7fr auto;
    }

    @media (min-width: 1024px) {
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
      font-size: $avatar-font;
      font-weight: 600;
      font-family: var(--font-mono);
      color: var(--brand-accent-fg); // white text on accent backgrounds per design tokens
      flex-shrink: 0;
      user-select: none;
    }

    // ── Name column ───────────────────────────────────────────────────────────
    &__name-col {
      min-width: 0;
    }

    &__name {
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--text-loud);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__email {
      font-size: var(--text-xs);
      color: var(--text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-top: var(--space-1);
    }

    // ── Role chip ─────────────────────────────────────────────────────────────
    &__role {
      display: none;

      @media (min-width: 768px) {
        display: block;
      }
    }

    // ── Joined ────────────────────────────────────────────────────────────────
    &__joined {
      display: none;
      font-size: var(--text-xs);
      color: var(--text-muted);
      font-family: var(--font-mono);

      @media (min-width: 768px) {
        display: block;
      }
    }

    // ── Actions ───────────────────────────────────────────────────────────────
    &__actions {
      display: flex;
      gap: var(--space-1);
    }

    &__btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: none;
      border-radius: var(--radius-md);
      color: var(--text-muted);
      cursor: pointer;

      &--icon {
        width: $btn-icon-size;
        height: $btn-icon-size;
        padding: var(--space-1);
      }

      &:hover {
        background: var(--surface-raised);
        color: var(--text-loud);
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 2px;
      }
    }
  }
</style>
