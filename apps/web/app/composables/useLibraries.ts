/**
 * Composables for the Libraries management page.
 *
 * `useLibraries` — list libraries (cached per session).
 * `useLatestScan(libraryId)` — fetch the latest scan for a library; auto-poll
 * every 2s while the scan status is `running`.
 * `registerLibraryRequest` — the raw `registerLibrary` call plus its
 * idempotent-conflict handling, usable without the list-fetching composable
 * above it. `useLibraries().register` wraps it; `AdminAddLibrarySheet.vue`
 * and `pages/sign-up.vue`'s library step call it directly — see its own
 * doc comment for why they don't go through `useLibraries()` itself.
 */

import {
  client,
  getLatestLibraryScan,
  listLibraries,
  registerLibrary,
  runLibraryScan,
} from '@app/api-client-ts';
import type {
  LibraryDto,
  LibraryListDto,
  ScanDto,
  RegisterLibraryRequest,
} from '@app/api-client-ts';

import { problemDetail } from '~/utils/library-register';

export type LibrariesStatus = 'idle' | 'pending' | 'success' | 'error';

/** Thrown by `registerLibraryRequest`. `detail` is the server's own
 * problem-document explanation, or null when it sent none (e.g. a
 * network-level failure never reached a response). */
export class RegisterLibraryError extends Error {
  constructor(public readonly detail: string | null) {
    super(detail ?? 'Failed to register library');
    this.name = 'RegisterLibraryError';
  }
}

/**
 * Raw `registerLibrary` call plus the one place its idempotent-on-`rootPath`
 * contract is acted on: a defensive 409 (the endpoint is documented as
 * always answering 201, existing row included — but a caller can't assume
 * that holds forever) is resolved by looking the matching row up via a fresh
 * `listLibraries` call and returning it exactly as if it had just been
 * created. Every other failure becomes `RegisterLibraryError`, carrying the
 * server's own explanation when it sent one.
 *
 * Deliberately free of `useAsyncData` — `pages/sign-up.vue`'s library step
 * reaches this before the account it belongs to is authenticated for
 * anything else in the app to have a reason to load the library list.
 * Mounting the full `useLibraries()` composable there would fire an
 * authenticated `listLibraries` GET the moment the page mounts, at step 1 —
 * before sign-up has run. The response interceptor treats that 401 as a dead
 * session and redirects to `/sign-in`, taking the wizard down with it. This
 * function only touches the network when actually called.
 */
export async function registerLibraryRequest(body: RegisterLibraryRequest): Promise<LibraryDto> {
  const res = await registerLibrary({ client, throwOnError: false, body });
  if (!res.error) return res.data;

  if (res.response.status === 409) {
    const listRes = await listLibraries({ client, throwOnError: false });
    const existing = listRes.error
      ? undefined
      : listRes.data.items.find((l) => l.rootPath === body.rootPath);
    if (existing) return existing;
  }

  throw new RegisterLibraryError(problemDetail(res.error));
}

export function useLibraries(): {
  data: Ref<LibraryListDto | undefined>;
  status: Ref<LibrariesStatus>;
  error: Ref<Error | null>;
  refresh: () => Promise<void>;
  register: (body: RegisterLibraryRequest) => Promise<LibraryDto>;
  /**
   * The server's own explanation for the last failed `register`, or null when
   * it did not send a problem document (a network-level failure). Read it in
   * the `catch` — a canned sentence there would replace a precise answer
   * ("rootPath must match ...") with a guess. Same shape as `useAdminBackup`.
   */
  registerErrorDetail: Ref<string | null>;
} {
  const { data, status, error, refresh } = useAsyncData<LibraryListDto>(
    'libraries:list',
    async () => {
      const res = await listLibraries({ client, throwOnError: false });
      if (res.error) {
        throw new Error('Failed to load libraries');
      }
      return res.data;
    },
    { server: false, default: () => ({ items: [] }) },
  );

  const registerErrorDetail = ref<string | null>(null);

  async function register(body: RegisterLibraryRequest): Promise<LibraryDto> {
    registerErrorDetail.value = null;
    try {
      const created = await registerLibraryRequest(body);
      await refresh();
      return created;
    } catch (error_) {
      registerErrorDetail.value = error_ instanceof RegisterLibraryError ? error_.detail : null;
      throw error_;
    }
  }

  return {
    data,
    status: status as Ref<LibrariesStatus>,
    error: error as Ref<Error | null>,
    refresh: async () => {
      await refresh();
    },
    register,
    registerErrorDetail,
  };
}

/**
 * Fetch the latest scan for a library and auto-poll every 2s while running.
 * Returns refs and a `triggerScan` action that POSTs a fresh scan.
 */
export function useLatestScan(libraryId: Ref<string>): {
  data: Ref<ScanDto | null>;
  status: Ref<LibrariesStatus>;
  error: Ref<Error | null>;
  refresh: () => Promise<void>;
  triggerScan: () => Promise<void>;
} {
  const data = ref<ScanDto | null>(null);
  const status = ref<LibrariesStatus>('idle');
  const error = ref<Error | null>(null);
  let pollHandle: ReturnType<typeof setTimeout> | null = null;

  async function refresh(): Promise<void> {
    if (!libraryId.value) return;
    status.value = 'pending';
    try {
      const res = await getLatestLibraryScan({
        client,
        throwOnError: false,
        path: { id: libraryId.value },
      });
      // 404 is a normal "no scan yet" state — treat as null, not error.
      if (res.error) {
        if (res.response.status === 404) {
          data.value = null;
          status.value = 'success';
          error.value = null;
          return;
        }
        throw new Error('Failed to load latest scan');
      }
      data.value = res.data;
      status.value = 'success';
      error.value = null;
      schedulePoll();
    } catch (error_) {
      error.value = error_ instanceof Error ? error_ : new Error(String(error_));
      status.value = 'error';
    }
  }

  function schedulePoll(): void {
    if (pollHandle !== null) {
      clearTimeout(pollHandle);
      pollHandle = null;
    }
    if (data.value?.status === 'running') {
      pollHandle = setTimeout(() => {
        void refresh();
      }, 2000);
    }
  }

  async function triggerScan(): Promise<void> {
    if (!libraryId.value) return;
    const res = await runLibraryScan({
      client,
      throwOnError: false,
      path: { id: libraryId.value },
    });
    if (res.error) {
      throw new Error('Failed to start scan');
    }
    data.value = res.data;
    status.value = 'success';
    error.value = null;
    schedulePoll();
  }

  watch(
    libraryId,
    () => {
      void refresh();
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    if (pollHandle !== null) {
      clearTimeout(pollHandle);
      pollHandle = null;
    }
  });

  return {
    data,
    status,
    error,
    refresh,
    triggerScan,
  };
}
