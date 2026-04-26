/**
 * WHY this file exists:
 * Centralises the Scan aggregate → ScanDto wire mapping so it can be shared
 * between query handlers and the controller without duplicating field access.
 *
 * Output type is sourced from the generated @app/api-client-ts package so it
 * stays in sync with the OpenAPI spec automatically.
 */
import type { Scan } from './domain/scan/scan';
import type { ScanDto } from '@app/api-client-ts';

export function toScanDto(scan: Scan): ScanDto {
  return {
    id: scan.id,
    libraryId: scan.libraryId,
    status: scan.status,
    startedAt: scan.startedAt.toISOString(),
    ...(scan.finishedAt === undefined ? {} : { finishedAt: scan.finishedAt.toISOString() }),
    filesScanned: scan.filesScanned,
    filesAdded: scan.filesAdded,
    filesUpdated: scan.filesUpdated,
    coursesDiscovered: scan.coursesDiscovered,
    errors: scan.errors.map((e) => ({
      path: e.path,
      message: e.message,
      ...(e.code === undefined ? {} : { code: e.code }),
    })),
  };
}
