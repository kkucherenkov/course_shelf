/**
 * Composables for the Libraries management page.
 *
 * `useLibraries` — list libraries (cached per session).
 * `useLatestScan(libraryId)` — fetch the latest scan for a library; auto-poll
 * every 2s while the scan status is `running`.
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

export type LibrariesStatus = 'idle' | 'pending' | 'success' | 'error';

export function useLibraries(): {
  data: Ref<LibraryListDto | undefined>;
  status: Ref<LibrariesStatus>;
  error: Ref<Error | null>;
  refresh: () => Promise<void>;
  register: (body: RegisterLibraryRequest) => Promise<LibraryDto>;
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

  async function register(body: RegisterLibraryRequest): Promise<LibraryDto> {
    const res = await registerLibrary({ client, throwOnError: false, body });
    if (res.error) {
      throw new Error('Failed to register library');
    }
    const created = res.data;
    await refresh();
    return created;
  }

  return {
    data,
    status: status as Ref<LibrariesStatus>,
    error: error as Ref<Error | null>,
    refresh: async () => {
      await refresh();
    },
    register,
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
