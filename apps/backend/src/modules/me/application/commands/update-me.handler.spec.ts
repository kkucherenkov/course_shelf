import { describe, it, expect, vi } from 'vitest';

import { UpdateMeHandler } from './update-me.handler';
import { UpdateMeCommand } from './update-me.command';
import { EmptyMePatchError, MeNotFoundError } from '../../domain/me.errors';

import type { MePort } from '../../domain/me.port';
import type { MeDto } from '@app/api-client-ts';

function makeDto(overrides: Partial<MeDto> = {}): MeDto {
  return {
    id: 'user-1',
    email: 'alice@example.com',
    name: 'Alice',
    displayName: null,
    role: 'user',
    ...overrides,
  };
}

function makePort(result: MeDto | null = makeDto()): MePort {
  return {
    findById: vi.fn(),
    updateProfile: vi.fn().mockResolvedValue(result),
    revokeOtherSessions: vi.fn(),
  };
}

function makeHandler(port: MePort): UpdateMeHandler {
  return new (UpdateMeHandler as unknown as new (p: MePort) => UpdateMeHandler)(port);
}

describe('UpdateMeHandler', () => {
  describe('empty patch', () => {
    it('throws EmptyMePatchError when displayName is not in patch', async () => {
      const port = makePort();
      const handler = makeHandler(port);

      await expect(handler.execute(new UpdateMeCommand('user-1', {}))).rejects.toBeInstanceOf(
        EmptyMePatchError,
      );
    });

    it('EmptyMePatchError has status 400', async () => {
      const port = makePort();
      const handler = makeHandler(port);

      await expect(handler.execute(new UpdateMeCommand('user-1', {}))).rejects.toMatchObject({
        status: 400,
      });
    });

    it('does not call the port when patch is empty', async () => {
      const port = makePort();
      const handler = makeHandler(port);

      await handler.execute(new UpdateMeCommand('user-1', {})).catch(() => undefined);

      expect(port.updateProfile).not.toHaveBeenCalled();
    });
  });

  describe('happy path', () => {
    it('calls updateProfile with the correct userId and patch', async () => {
      const port = makePort(makeDto({ displayName: 'Bob' }));
      const handler = makeHandler(port);

      await handler.execute(new UpdateMeCommand('user-1', { displayName: 'Bob' }));

      expect(port.updateProfile).toHaveBeenCalledOnce();
      expect(port.updateProfile).toHaveBeenCalledWith('user-1', { displayName: 'Bob' });
    });

    it('returns the updated DTO with lowercase role', async () => {
      const dto = makeDto({ role: 'admin', displayName: 'Alice Admin' });
      const port = makePort(dto);
      const handler = makeHandler(port);

      const result = await handler.execute(
        new UpdateMeCommand('user-1', { displayName: 'Alice Admin' }),
      );

      expect(result).toEqual(dto);
      expect(result.role).toBe('admin');
    });

    it('accepts null to clear displayName', async () => {
      const port = makePort(makeDto({ displayName: null }));
      const handler = makeHandler(port);

      await handler.execute(new UpdateMeCommand('user-1', { displayName: null }));

      expect(port.updateProfile).toHaveBeenCalledWith('user-1', { displayName: null });
    });
  });

  describe('user not found', () => {
    it('throws MeNotFoundError when port returns null', async () => {
      const port = makePort(null);
      const handler = makeHandler(port);

      await expect(
        handler.execute(new UpdateMeCommand('missing-id', { displayName: 'X' })),
      ).rejects.toBeInstanceOf(MeNotFoundError);
    });

    it('MeNotFoundError has status 404', async () => {
      const port = makePort(null);
      const handler = makeHandler(port);

      await expect(
        handler.execute(new UpdateMeCommand('missing-id', { displayName: 'X' })),
      ).rejects.toMatchObject({ status: 404 });
    });
  });
});
