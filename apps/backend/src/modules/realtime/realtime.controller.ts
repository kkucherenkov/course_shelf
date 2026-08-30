import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

import { Session, type SessionContext } from '../../common/auth/decorators';

import { RealtimeService, type RealtimeToken } from './realtime.service';

@Controller({ path: 'realtime', version: '1' })
// Token minting is rate-limited more tightly than the rest of the API. The
// budget itself lives in `AppConfig.rateLimit.realtimeToken*` and is applied by
// the `realtimeToken` throttler in app.module.ts; this only opts the route out
// of the global one so the two do not stack. It was `@Throttle({ default: {
// limit: 30, ttl: 60_000 } })` — correct in intent, but a literal that no
// environment could reach.
@SkipThrottle({ default: true })
export class RealtimeController {
  constructor(private readonly realtime: RealtimeService) {}

  @Post('token')
  @HttpCode(HttpStatus.OK)
  issueToken(@Session() session: SessionContext): RealtimeToken {
    return this.realtime.issueToken(session.user);
  }
}
