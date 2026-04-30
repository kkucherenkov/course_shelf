import { Body, Controller, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { Session } from '../../common/auth/decorators';
import { UpdateMeCommand } from './application/commands/update-me.command';
import { SignOutOthersCommand } from './application/commands/sign-out-others.command';

import type { SessionContext } from '../../common/auth/decorators';
import type { MeDto, UpdateMeRequest } from '@app/api-client-ts';

@Controller({ path: 'me', version: '1' })
export class MeController {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch()
  updateMe(@Session() ctx: SessionContext, @Body() body: UpdateMeRequest): Promise<MeDto> {
    return this.commandBus.execute<UpdateMeCommand, MeDto>(new UpdateMeCommand(ctx.user.id, body));
  }

  @Post('sign-out-others')
  @HttpCode(HttpStatus.NO_CONTENT)
  async signOutOthers(@Session() ctx: SessionContext): Promise<void> {
    await this.commandBus.execute<SignOutOthersCommand, undefined>(
      new SignOutOthersCommand(ctx.user.id, ctx.sessionId),
    );
  }
}
