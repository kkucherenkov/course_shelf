import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

import { AllowAnonymous } from '../../common/auth/decorators';
import { PrismaService } from '../../common/prisma/prisma.service';

import type { Response } from 'express';

@Controller()
@AllowAnonymous()
@SkipThrottle()
export class OpsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('healthz')
  liveness(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('readyz')
  async readiness(@Res({ passthrough: true }) res: Response): Promise<{ status: 'ok' | 'down' }> {
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
      return { status: 'ok' };
    } catch {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
      return { status: 'down' };
    }
  }
}
