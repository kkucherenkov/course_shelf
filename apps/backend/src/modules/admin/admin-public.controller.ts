import { Controller, Get, Inject } from '@nestjs/common';

import { AppConfig } from '../../common/config/app-config';
import { AllowAnonymous } from '../../common/auth/decorators';
import { DASHBOARD_PORT } from './domain/dashboard.port';

import type { DashboardPort } from './domain/dashboard.port';
import type { HasUsersResponse, InstanceConfigDto } from '@app/api-client-ts';

@Controller({ path: 'admin', version: '1' })
@AllowAnonymous()
export class AdminPublicController {
  constructor(
    @Inject(DASHBOARD_PORT) private readonly dashboard: DashboardPort,
    private readonly appConfig: AppConfig,
  ) {}

  @Get('has-users')
  async hasUsers(): Promise<HasUsersResponse> {
    const hasUsers = await this.dashboard.hasAnyUser();
    return { hasUsers };
  }

  @Get('instance')
  getInstance(): InstanceConfigDto {
    const instance = this.appConfig.instance;
    return {
      selfRegistration: instance.selfRegistration,
      emailVerificationRequired: instance.emailVerificationRequired,
      ssoProviders: instance.ssoProviders.map((p) => ({
        id: p.id,
        label: p.label,
        iconName: p.iconName,
      })),
    };
  }
}
