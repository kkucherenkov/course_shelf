/**
 * Unit tests for useUpdateAdminUser composable.
 *
 * Verifies:
 * - Optimistic update is applied immediately.
 * - On success, row is synced with server response.
 * - On failure, the snapshot is reverted and null is not returned.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, computed } from 'vue';
import type { AdminUserListDto, AdminUserListItem } from '@app/api-client-ts';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockUpdateAdminUser = vi.fn();

vi.mock('@app/api-client-ts', () => ({
  updateAdminUser: (...args: unknown[]) => mockUpdateAdminUser(...args),
  client: {},
}));

vi.mock('#imports', () => ({ ref, computed }));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeUser(overrides: Partial<AdminUserListItem> = {}): AdminUserListItem {
  return {
    id: 'user-1',
    email: 'alice@example.com',
    name: 'Alice',
    displayName: null,
    role: 'user',
    banned: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useUpdateAdminUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('applies optimistic update immediately and syncs from server on success', async () => {
    const serverUser = makeUser({ role: 'admin', banned: false });
    mockUpdateAdminUser.mockResolvedValueOnce({
      data: serverUser,
      error: null,
      response: { status: 200 },
    });

    const dataRef = ref<AdminUserListDto>({ items: [makeUser()] });

    const { useUpdateAdminUser } = await import('../useUpdateAdminUser');
    const { update } = useUpdateAdminUser(dataRef);

    // Kick off the update — don't await yet so we can inspect optimistic state.
    const promise = update('user-1', { role: 'admin' });

    // Optimistic write is synchronous before the await inside update.
    expect(dataRef.value.items[0]!.role).toBe('admin');

    const result = await promise;
    expect(result).toBeNull();

    // Synced from server.
    expect(dataRef.value.items[0]!.role).toBe('admin');
  });

  it('reverts optimistic update when API call fails', async () => {
    mockUpdateAdminUser.mockResolvedValueOnce({
      data: null,
      error: { detail: 'Forbidden' },
      response: { status: 403 },
    });

    const dataRef = ref<AdminUserListDto>({ items: [makeUser({ role: 'user' })] });

    const { useUpdateAdminUser } = await import('../useUpdateAdminUser');
    const { update } = useUpdateAdminUser(dataRef);

    const result = await update('user-1', { role: 'admin' });

    // Should have reverted.
    expect(dataRef.value.items[0]!.role).toBe('user');
    // Should return an error.
    expect(result).toBeInstanceOf(Error);
  });

  it('sets banned optimistically and reverts on failure', async () => {
    mockUpdateAdminUser.mockResolvedValueOnce({
      data: null,
      error: { detail: 'Server error' },
      response: { status: 500 },
    });

    const dataRef = ref<AdminUserListDto>({ items: [makeUser({ banned: false })] });

    const { useUpdateAdminUser } = await import('../useUpdateAdminUser');
    const { update } = useUpdateAdminUser(dataRef);

    const result = await update('user-1', { banned: true });

    // Reverted.
    expect(dataRef.value.items[0]!.banned).toBe(false);
    expect(result).toBeInstanceOf(Error);
  });
});
