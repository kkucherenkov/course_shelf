/**
 * Wraps `updateAdminUser` (`PATCH /api/v1/admin/users/{id}`) with an
 * optimistic-update pattern.
 *
 * Accepts the live `data` ref from `useAdminUsers` so it can write the
 * optimistic patch immediately, then revert on failure.
 *
 * Returns an `update` function that resolves to `null` on success or an
 * `Error` on failure, and a boolean `pending` ref.
 */

import { ref } from 'vue';
import type { Ref } from 'vue';
import { updateAdminUser, client } from '@app/api-client-ts';
import type {
  AdminUserListDto,
  AdminUserListItem,
  AdminUpdateUserRequest,
} from '@app/api-client-ts';

export interface UseUpdateAdminUserReturn {
  pending: Ref<boolean>;
  update: (userId: string, patch: AdminUpdateUserRequest) => Promise<Error | null>;
}

export function useUpdateAdminUser(
  data: Ref<AdminUserListDto | undefined>,
): UseUpdateAdminUserReturn {
  const pending = ref(false);

  async function update(userId: string, patch: AdminUpdateUserRequest): Promise<Error | null> {
    if (!data.value) return new Error('No data');

    // Snapshot previous state for rollback.
    const prevItems = data.value.items.map((u) => ({ ...u }));

    // Optimistic write.
    data.value = {
      items: data.value.items.map((u) =>
        u.id === userId
          ? {
              ...u,
              ...(patch.role !== undefined ? { role: patch.role } : {}),
              ...(patch.banned !== undefined ? { banned: patch.banned } : {}),
            }
          : u,
      ),
    };

    pending.value = true;
    try {
      const res = await updateAdminUser({
        client,
        throwOnError: false,
        path: { id: userId },
        body: patch,
      });

      if (res.error) {
        // Revert.
        data.value = { items: prevItems };
        return new Error('Failed to update user');
      }

      // Sync row from server response.
      const updated = res.data as AdminUserListItem;
      data.value = {
        items: data.value.items.map((u) => (u.id === userId ? updated : u)),
      };

      return null;
    } catch (error_) {
      data.value = { items: prevItems };
      return error_ instanceof Error ? error_ : new Error('Unexpected error');
    } finally {
      pending.value = false;
    }
  }

  return { pending, update };
}
