import { describe, expect, it } from 'vitest';

import { avatarBgFromId } from './avatar-color';

describe('avatarBgFromId', () => {
  it('returns a --avatar-* token reference, never a hex literal', () => {
    // Regression guard for #569: this used to be a private hex array
    // duplicated verbatim in AdminUserRow.vue and admin/permissions/[userId].vue.
    expect(avatarBgFromId('user-abc')).toMatch(/^var\(--avatar-[a-z-]+\)$/);
  });

  it('is deterministic for the same id', () => {
    expect(avatarBgFromId('user-abc')).toBe(avatarBgFromId('user-abc'));
  });

  it('spreads across the palette rather than collapsing to one hue', () => {
    const ids = Array.from({ length: 50 }, (_, i) => `user-${String(i)}`);
    const colors = new Set(ids.map((id) => avatarBgFromId(id)));
    expect(colors.size).toBeGreaterThan(1);
  });
});
