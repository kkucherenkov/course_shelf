import { describe, it, expect, vi } from 'vitest';

import { SignOutOthersHandler } from './sign-out-others.handler';
import { SignOutOthersCommand } from './sign-out-others.command';

import type { MePort } from '../../domain/me.port';

function makePort(): MePort {
  return {
    findById: vi.fn(),
    updateProfile: vi.fn(),
    revokeOtherSessions: vi.fn().mockResolvedValue(undefined),
  };
}

function makeHandler(port: MePort): SignOutOthersHandler {
  return new (SignOutOthersHandler as unknown as new (p: MePort) => SignOutOthersHandler)(port);
}

describe('SignOutOthersHandler', () => {
  describe('happy path', () => {
    it('calls revokeOtherSessions with the correct userId and currentSessionId', async () => {
      const port = makePort();
      const handler = makeHandler(port);

      await handler.execute(new SignOutOthersCommand('user-42', 'sess-current'));

      expect(port.revokeOtherSessions).toHaveBeenCalledOnce();
      expect(port.revokeOtherSessions).toHaveBeenCalledWith('user-42', 'sess-current');
    });

    it('does NOT pass userId in both slots — currentSessionId is distinct', async () => {
      const port = makePort();
      const handler = makeHandler(port);

      await handler.execute(new SignOutOthersCommand('user-42', 'sess-xyz'));

      const [calledUserId, calledSessionId] = (port.revokeOtherSessions as ReturnType<typeof vi.fn>)
        .mock.calls[0] as [string, string];

      expect(calledUserId).toBe('user-42');
      expect(calledSessionId).toBe('sess-xyz');
      expect(calledSessionId).not.toBe(calledUserId);
    });

    it('resolves void without throwing', async () => {
      const port = makePort();
      const handler = makeHandler(port);

      await expect(
        handler.execute(new SignOutOthersCommand('user-1', 'sess-1')),
      ).resolves.toBeUndefined();
    });
  });
});
