import { Controller, Get, Inject } from '@nestjs/common';

import { AllowAnonymous } from '../../common/auth/decorators';
import { DASHBOARD_PORT } from './domain/dashboard.port';

import type { DashboardPort } from './domain/dashboard.port';
import type { HasUsersResponse } from '@app/api-client-ts';

@Controller({ path: 'admin', version: '1' })
@AllowAnonymous()
export class AdminPublicController {
  constructor(@Inject(DASHBOARD_PORT) private readonly dashboard: DashboardPort) {}

  @Get('has-users')
  async hasUsers(): Promise<HasUsersResponse> {
    const hasUsers = await this.dashboard.hasAnyUser();
    return { hasUsers };
  }
}
