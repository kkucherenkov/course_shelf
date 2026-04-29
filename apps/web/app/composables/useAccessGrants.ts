/**
 * Wraps the access-grants API for the admin Permissions page.
 *
 * - `listGrantsByUser` (GET /api/v1/access/grants?userId=…) — loaded via useAsyncData.
 * - `registerGrant`   (POST /api/v1/access/grants)           — imperative mutation.
 * - `revokeGrant`     (DELETE /api/v1/access/grants/{id})    — imperative mutation.
 *
 * Mutations are NOT optimistic: call grant/revoke, then refetch() on success.
 * The composable does not toast — the page layer does.
 *
 * Computed helpers:
 *   grantedLibraries  — Set<libraryId> for library-scope grants
 *   grantedCourses    — Map<courseId, AccessGrantDto> for course-scope grants
 *
 * `overridesByLibrary` is deliberately kept off the composable:
 * course→library mapping requires knowledge of which library a course belongs
 * to, which is available on the page (it lazily loads courses per library).
 * The page builds this map and passes it down to the row component.
 */

import { computed, type Ref } from 'vue';
import { listGrantsByUser, registerGrant, revokeGrant, client } from '@app/api-client-ts';
import type { AccessGrantDto, AccessGrantListDto, GrantTarget } from '@app/api-client-ts';

export type AccessGrantsStatus = 'idle' | 'pending' | 'success' | 'error';

class HttpStatusError extends Error {
  constructor(
    public readonly httpStatus: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpStatusError';
  }
}

export interface UseAccessGrantsReturn {
  data: Ref<AccessGrantDto[] | undefined>;
  status: Ref<AccessGrantsStatus>;
  error: Ref<Error | null>;
  errorStatus: Ref<number | null>;
  refetch: () => Promise<void>;
  /** Creates a grant. Returns an error object on failure, null on success. */
  grant: (target: GrantTarget) => Promise<Error | null>;
  /** Revokes a grant by id. Returns an error object on failure, null on success. */
  revoke: (id: string) => Promise<Error | null>;
  /** libraryIds that have a library-scope READ grant. */
  grantedLibraries: Ref<Set<string>>;
  /** courseId → AccessGrantDto for course-scope grants. */
  grantedCourses: Ref<Map<string, AccessGrantDto>>;
}

export function useAccessGrants(userIdRef: Ref<string>): UseAccessGrantsReturn {
  const {
    data: rawData,
    status,
    error,
    refresh,
  } = useAsyncData<AccessGrantListDto>(
    () => `access-grants:${userIdRef.value}`,
    async () => {
      const res = await listGrantsByUser({
        client,
        throwOnError: false,
        query: { userId: userIdRef.value },
      });
      if (res.error) {
        throw new HttpStatusError(res.response.status, 'Failed to load grants');
      }
      return res.data as AccessGrantListDto;
    },
    { lazy: true, watch: [userIdRef] },
  );

  const data = computed<AccessGrantDto[] | undefined>(() => rawData.value?.items);

  const errorStatus = computed<number | null>(() => {
    const e = error.value;
    if (e instanceof HttpStatusError) return e.httpStatus;
    return null;
  });

  const grantedLibraries = computed<Set<string>>(() => {
    const result = new Set<string>();
    for (const g of data.value ?? []) {
      if (g.target.kind === 'library') result.add(g.target.libraryId);
    }
    return result;
  });

  const grantedCourses = computed<Map<string, AccessGrantDto>>(() => {
    const result = new Map<string, AccessGrantDto>();
    for (const g of data.value ?? []) {
      if (g.target.kind === 'course') result.set(g.target.courseId, g);
    }
    return result;
  });

  async function grant(target: GrantTarget): Promise<Error | null> {
    const res = await registerGrant({
      client,
      throwOnError: false,
      body: { userId: userIdRef.value, target, level: 'READ' },
    });
    if (res.error) {
      return new HttpStatusError(res.response.status, 'Failed to create grant');
    }
    return null;
  }

  async function revoke(id: string): Promise<Error | null> {
    const res = await revokeGrant({ client, throwOnError: false, path: { id } });
    if (res.error) {
      return new HttpStatusError(res.response.status, 'Failed to revoke grant');
    }
    return null;
  }

  return {
    data,
    status: status as Ref<AccessGrantsStatus>,
    error: error as Ref<Error | null>,
    errorStatus,
    refetch: async () => {
      await refresh();
    },
    grant,
    revoke,
    grantedLibraries,
    grantedCourses,
  };
}
