import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { ME_PORT } from '../../domain/me.port';
import { EmptyMePatchError, MeNotFoundError } from '../../domain/me.errors';
import { UpdateMeCommand } from './update-me.command';

import type { MePort } from '../../domain/me.port';
import type { MeDto } from '@app/api-client-ts';

@Injectable()
@CommandHandler(UpdateMeCommand)
export class UpdateMeHandler implements ICommandHandler<UpdateMeCommand, MeDto> {
  constructor(@Inject(ME_PORT) private readonly me: MePort) {}

  async execute(command: UpdateMeCommand): Promise<MeDto> {
    const { userId, patch } = command;

    if (patch.displayName === undefined) {
      throw new EmptyMePatchError();
    }

    const updated = await this.me.updateProfile(userId, patch);

    if (updated === null) {
      throw new MeNotFoundError(userId);
    }

    return updated;
  }
}
