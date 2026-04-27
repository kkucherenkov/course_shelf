import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { SkipThrottle } from '@nestjs/throttler';

import { AllowAnonymous } from '../../common/auth/decorators';
import { GetHealthQuery } from './application/queries/get-health.query';

import type { HealthSnapshot } from './domain/health';
import type { Response } from 'express';

// `/api/v1/health` is documented in the OpenAPI spec without a `security:`
// block — it's the dependency-snapshot probe ops dashboards hit without
// credentials. Without `@AllowAnonymous()` the global `SessionGuard` (E04
// alignment) returns 401, the response validator finds no 401 schema for
// this operation, and the response chain explodes.
@Controller({ path: 'health', version: '1' })
@AllowAnonymous()
@SkipThrottle()
export class HealthController {
  constructor(private readonly queries: QueryBus) {}

  @Get()
  async get(@Res({ passthrough: true }) res: Response): Promise<HealthSnapshot> {
    const snapshot = await this.queries.execute<GetHealthQuery, HealthSnapshot>(
      new GetHealthQuery(),
    );
    res.status(snapshot.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);
    return snapshot;
  }
}
