import type { ScanStatus } from '@app/api-client-ts';

/**
 * A `succeeded` scan whose `errorsCount > 0` gets its own pill state rather
 * than sharing `succeeded`'s green badge — the scan process finished, but
 * that isn't the same claim as "nothing went wrong" (audit run20 finding 7).
 * Client-derived because the server's `ScanStatus` is a process-completion
 * signal, not a data-quality one, and the two axes are genuinely different
 * questions.
 *
 * Lifted out of `AdminScansTable` (audit run22 finding 4/#798): that
 * component applied this exact rule, `AdminLibraryRow` read `status` alone
 * and disagreed on the same `lastScan` payload — two admin screens, one
 * scan, opposite verdicts. Both now call this one function instead of each
 * carrying its own copy of the condition.
 */
export type ScanPillStatus = ScanStatus | 'succeeded-with-errors';

export function scanPillStatus(status: ScanStatus, errorsCount: number): ScanPillStatus {
  if (status === 'succeeded' && errorsCount > 0) return 'succeeded-with-errors';
  return status;
}
