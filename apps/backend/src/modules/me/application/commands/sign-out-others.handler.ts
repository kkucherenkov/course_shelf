import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { ME_PORT } from '../../domain/me.port';
import { SignOutOthersCommand } from './sign-out-others.command';

import type { MePort } from '../../domain/me.port';

@Injectable()
@CommandHandler(SignOutOthersCommand)
export class SignOutOthersHandler implements ICommandHandler<SignOutOthersCommand> {
  constructor(@Inject(ME_PORT) private readonly me: MePort) {}

  async execute(command: SignOutOthersCommand): Promise<void> {
    const { userId, currentSessionId } = command;
    await this.me.revokeOtherSessions(userId, currentSessionId);
  }
}
