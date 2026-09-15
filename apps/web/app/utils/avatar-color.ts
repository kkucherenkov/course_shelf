/**
 * Deterministically derives a user-avatar background colour from a user id.
 *
 * Same hash shape as `course-accent.ts`'s `accentFromId`, kept as a separate
 * function because avatars and course covers are different identity systems
 * with their own token palette (`--avatar-*` vs `--media-cover-*`) — see
 * `docs/design/shared/tokens.json`'s `avatar` group.
 *
 * Previously this hash and its six-hex palette were duplicated verbatim in
 * `AdminUserRow.vue` and `admin/permissions/[userId].vue` (#569).
 */

const AVATAR_HUES = ['indigo', 'teal', 'amber', 'violet', 'coral', 'blue-grey'] as const;

export function avatarBgFromId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + (id.codePointAt(i) ?? 0)) >>> 0;
  const hue = AVATAR_HUES[h % AVATAR_HUES.length] ?? 'indigo';
  return `var(--avatar-${hue})`;
}
