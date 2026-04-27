import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

import { type SessionUser } from '../../common/auth/decorators';
import { AppConfig } from '../../common/config/app-config';

export interface RealtimeToken {
  token: string;
  expiresAt: string;
}

@Injectable()
export class RealtimeService {
  constructor(private readonly config: AppConfig) {}

  issueToken(user: SessionUser): RealtimeToken {
    const { tokenHmacSecret, tokenTtlSeconds } = this.config.centrifugo;
    const expSeconds = Math.floor(Date.now() / 1000) + tokenTtlSeconds;
    const channels = this.allowedChannelsFor(user);
    const token = jwt.sign({ sub: user.id, exp: expSeconds, channels }, tokenHmacSecret, {
      algorithm: 'HS256',
    });

    return { token, expiresAt: new Date(expSeconds * 1000).toISOString() };
  }

  /**
   * Returns the set of Centrifugo channels the user is allowed to subscribe to
   * via the connection token.
   *
   * NOTE: notes:lesson:* and library:scan:* channels are intentionally omitted
   * here. They require subscribe-time per-channel authorisation (future story)
   * and must not be pre-authorised in the connection token.
   */
  private allowedChannelsFor(user: SessionUser): string[] {
    return ['system:health', `progress:user:${user.id}`, `notifications:user:${user.id}`];
  }
}
