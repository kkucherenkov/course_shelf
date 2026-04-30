import { describe, it, expect, vi } from 'vitest';

import { MeController } from './me.controller';
import { UpdateMeCommand } from './application/commands/update-me.command';
import { SignOutOthersCommand } from './application/commands/sign-out-others.command';

import type { CommandBus } from '@nestjs/cqrs';
import type { SessionContext } from '../../common/auth/decorators';
import type { MeDto } from '@app/api-client-ts';

function makeCommandBus(): CommandBus {
  return {
    execute: vi.fn().mockResolvedValue(undefined),
  } as unknown as CommandBus;
}

function makeController(commandBus: CommandBus): MeController {
  return new (MeController as unknown as new (cb: CommandBus) => MeController)(commandBus);
}

function makeSession(userId = 'user-42', sessionId = 'sess-abc'): SessionContext {
  return {
    user: { id: userId, role: 'user' },
    sessionId,
  };
}

const SAMPLE_DTO: MeDto = {
  id: 'user-42',
  email: 'alice@example.com',
  name: 'Alice',
  displayName: null,
  role: 'user',
};

describe('MeController', () => {
  describe('PATCH /me', () => {
    it('dispatches UpdateMeCommand with userId from session and body', async () => {
      const commandBus = makeCommandBus();
      const controller = makeController(commandBus);
      const ctx = makeSession('user-42');

      await controller.updateMe(ctx, { displayName: 'Alice' });

      expect(commandBus.execute).toHaveBeenCalledOnce();
      const command = (commandBus.execute as ReturnType<typeof vi.fn>).mock
        .calls[0]?.[0] as UpdateMeCommand;
      expect(command).toBeInstanceOf(UpdateMeCommand);
      expect(command.userId).toBe('user-42');
      expect(command.patch).toEqual({ displayName: 'Alice' });
    });

    it('returns the value resolved by the CommandBus', async () => {
      const commandBus = {
        execute: vi.fn().mockResolvedValue(SAMPLE_DTO),
      } as unknown as CommandBus;
      const controller = makeController(commandBus);

      const result = await controller.updateMe(makeSession(), { displayName: 'Alice' });

      expect(result).toBe(SAMPLE_DTO);
    });

    it('threads null displayName into the command', async () => {
      const commandBus = makeCommandBus();
      const controller = makeController(commandBus);

      await controller.updateMe(makeSession('user-5'), { displayName: null });

      const command = (commandBus.execute as ReturnType<typeof vi.fn>).mock
        .calls[0]?.[0] as UpdateMeCommand;
      expect(command.patch).toEqual({ displayName: null });
    });
  });

  describe('POST /me/sign-out-others', () => {
    it('dispatches SignOutOthersCommand with userId and sessionId from context', async () => {
      const commandBus = makeCommandBus();
      const controller = makeController(commandBus);
      const ctx = makeSession('user-42', 'sess-current');

      await controller.signOutOthers(ctx);

      expect(commandBus.execute).toHaveBeenCalledOnce();
      const command = (commandBus.execute as ReturnType<typeof vi.fn>).mock
        .calls[0]?.[0] as SignOutOthersCommand;
      expect(command).toBeInstanceOf(SignOutOthersCommand);
      expect(command.userId).toBe('user-42');
      expect(command.currentSessionId).toBe('sess-current');
    });

    it('does NOT mix up userId and currentSessionId', async () => {
      const commandBus = makeCommandBus();
      const controller = makeController(commandBus);

      await controller.signOutOthers(makeSession('user-99', 'sess-xyz'));

      const command = (commandBus.execute as ReturnType<typeof vi.fn>).mock
        .calls[0]?.[0] as SignOutOthersCommand;
      expect(command.userId).toBe('user-99');
      expect(command.currentSessionId).toBe('sess-xyz');
      expect(command.currentSessionId).not.toBe(command.userId);
    });

    it('resolves void (204 No Content)', async () => {
      const commandBus = {
        execute: vi.fn().mockResolvedValue(undefined),
      } as unknown as CommandBus;
      const controller = makeController(commandBus);

      const result = await controller.signOutOthers(makeSession());

      expect(result).toBeUndefined();
    });
  });
});
