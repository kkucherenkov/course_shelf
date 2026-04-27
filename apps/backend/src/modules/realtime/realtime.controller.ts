import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { Session, type SessionContext } from '../../common/auth/decorators';

import { RealtimeService, type RealtimeToken } from './realtime.service';

@Controller({ path: 'realtime', version: '1' })
@Throttle({ default: { limit: 30, ttl: 60_000 } })
export class RealtimeController {
  constructor(private readonly realtime: RealtimeService) {}

  @Post('token')
  @HttpCode(HttpStatus.OK)
  issueToken(@Session() session: SessionContext): RealtimeToken {
    return this.realtime.issueToken(session.user);
  }
}
