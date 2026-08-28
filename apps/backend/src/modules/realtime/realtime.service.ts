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
   *
   * `scans:user:<id>` is per-user-scoped — only the user themselves can
   * subscribe to their own scan lifecycle feed, so it's safe to include
   * in the token (no per-channel auth needed).
   *
   * Every entry here must be a channel declared in
   * `packages/specs/asyncapi/centrifugo.yaml`. A grant for an undeclared
   * channel is a standing authorisation nothing reviews: whoever later adds
   * that channel inherits a subscription right they never asked for, and the
   * spec — the thing a reader checks — never mentions it. `notifications:user`
   * was exactly that (no channel, no publisher) and has been dropped;
   * push notifications go through FCM (`common/notifications`), not
   * Centrifugo.
   */
  private allowedChannelsFor(user: SessionUser): string[] {
    return ['system:health', `progress:user:${user.id}`, `scans:user:${user.id}`];
  }
}
