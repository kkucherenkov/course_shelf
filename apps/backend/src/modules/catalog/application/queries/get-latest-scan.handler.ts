/**
 * WHY this file exists:
 * Query handler for fetching the latest Scan for a library. Returns a ScanDto
 * shaped from the aggregate. Throws ScanNotFoundError (→ 404) when no scan
 * exists — the HttpExceptionFilter maps this to application/problem+json.
 *
 * No NestJS HTTP exceptions here — boundaries/element-types enforces this at lint time.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { SCAN_REPOSITORY } from '../../domain/scan/scan.repository';
import { ScanNotFoundError } from '../../domain/scan/scan.errors';
import { toScanDto } from '../../scans.dto';

import { GetLatestScanQuery } from './get-latest-scan.query';

import type { ScanRepository } from '../../domain/scan/scan.repository';
import type { ScanDto } from '@app/api-client-ts';

@QueryHandler(GetLatestScanQuery)
export class GetLatestScanHandler implements IQueryHandler<GetLatestScanQuery, ScanDto> {
  constructor(@Inject(SCAN_REPOSITORY) private readonly scanRepo: ScanRepository) {}

  async execute(query: GetLatestScanQuery): Promise<ScanDto> {
    const scan = await this.scanRepo.findLatestByLibrary(query.libraryId);

    if (!scan) {
      throw new ScanNotFoundError(query.libraryId);
    }

    return toScanDto(scan);
  }
}
