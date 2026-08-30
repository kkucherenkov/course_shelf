/**
 * Wraps `createBackup` (`POST /api/v1/admin/backups`) for the admin Backups
 * screen (E31-F01-S02).
 *
 * Not a `useAsyncData` composable: taking a backup is a command, and a `pg_dump`
 * of a real library takes seconds to minutes, so it runs on an explicit click
 * and the page needs the in-flight state as a first-class value rather than as
 * the absence of data.
 *
 * The failure detail is surfaced verbatim. The 503 this endpoint returns is
 * genuinely actionable — "pg_dump 17.6 cannot dump PostgreSQL server 18.1" tells
 * the operator exactly what to fix — and swallowing it behind a generic
 * "something went wrong" would waste the one useful thing the server said.
 */

import { ref } from 'vue';
import { client, createBackup } from '@app/api-client-ts';
import type { BackupCreatedDto, Problem } from '@app/api-client-ts';

export type BackupStatus = 'idle' | 'pending' | 'success' | 'error';

export interface UseAdminBackupReturn {
  status: Ref<BackupStatus>;
  /** The most recent successful backup, or null before the first one. */
  backup: Ref<BackupCreatedDto | null>;
  /** Server-supplied problem detail for the last failure, or null. */
  errorDetail: Ref<string | null>;
  create: () => Promise<void>;
}

export function useAdminBackup(): UseAdminBackupReturn {
  const status = ref<BackupStatus>('idle');
  const backup = ref<BackupCreatedDto | null>(null);
  const errorDetail = ref<string | null>(null);

  async function create(): Promise<void> {
    // Guard against a double click starting a second pg_dump.
    if (status.value === 'pending') return;

    status.value = 'pending';
    errorDetail.value = null;

    try {
      const res = await createBackup({ client, throwOnError: false });
      if (res.error) {
        const problem = res.error as Problem;
        errorDetail.value = problem.detail ?? problem.title ?? null;
        status.value = 'error';
        return;
      }
      backup.value = res.data;
      status.value = 'success';
    } catch (error) {
      // Network-level failure — there is no problem document to quote.
      errorDetail.value = error instanceof Error ? error.message : String(error);
      status.value = 'error';
    }
  }

  return { status, backup, errorDetail, create };
}
