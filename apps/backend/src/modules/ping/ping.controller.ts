import { Controller, Get } from '@nestjs/common';

import { Session } from '../../common/auth/decorators';

import type { PingResponse } from '@app/api-client-ts';
import type { SessionContext } from '../../common/auth/decorators';

@Controller({ path: 'ping', version: '1' })
export class PingController {
  @Get()
  ping(@Session() session: SessionContext): PingResponse {
    const { id, role, displayName } = session.user;
    const response: PingResponse = { id, role };
    if (displayName) response.displayName = displayName;
    return response;
  }
}
