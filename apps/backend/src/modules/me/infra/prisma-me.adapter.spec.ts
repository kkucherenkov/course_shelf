import { describe, it, expect, vi } from 'vitest';
import { Prisma } from '@prisma/client';

import { PrismaMeAdapter } from './prisma-me.adapter';

import type { PrismaService } from '../../../common/prisma/prisma.service';

interface PrismaUserDelegate {
  findUnique: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
}

interface PrismaSessionDelegate {
  deleteMany: ReturnType<typeof vi.fn>;
}

interface MockPrisma {
  user: PrismaUserDelegate;
  session: PrismaSessionDelegate;
}

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'alice@example.com',
    name: 'Alice',
    displayName: null as string | null,
    role: 'USER',
    ...overrides,
  };
}

function makePrisma(
  userResult: ReturnType<typeof makeRow> | null = makeRow(),
  sessionDeleteResult = 0,
): MockPrisma {
  return {
    user: {
      findUnique: vi.fn().mockResolvedValue(userResult),
      update: vi.fn().mockResolvedValue(userResult),
    },
    session: {
      deleteMany: vi.fn().mockResolvedValue({ count: sessionDeleteResult }),
    },
  };
}

function makeAdapter(prisma: MockPrisma): PrismaMeAdapter {
  return new (PrismaMeAdapter as unknown as new (p: PrismaService) => PrismaMeAdapter)(
    prisma as unknown as PrismaService,
  );
}

describe('PrismaMeAdapter', () => {
  describe('findById', () => {
    it('returns mapped MeDto when user exists', async () => {
      const row = makeRow({ role: 'USER', displayName: 'Alice' });
      const adapter = makeAdapter(makePrisma(row));

      const result = await adapter.findById('user-1');

      expect(result).toEqual({
        id: 'user-1',
        email: 'alice@example.com',
        name: 'Alice',
        displayName: 'Alice',
        role: 'user',
      });
    });

    it('returns null when user does not exist', async () => {
      const adapter = makeAdapter(makePrisma(null));

      const result = await adapter.findById('missing-id');

      expect(result).toBeNull();
    });

    it('normalises role to lowercase', async () => {
      const adapter = makeAdapter(makePrisma(makeRow({ role: 'ADMIN' })));

      const result = await adapter.findById('user-1');

      expect(result?.role).toBe('admin');
    });
  });

  describe('updateProfile', () => {
    it('returns mapped MeDto on success', async () => {
      const row = makeRow({ displayName: 'Bob', role: 'USER' });
      const prisma = makePrisma(row);
      prisma.user.update = vi.fn().mockResolvedValue(row);
      const adapter = makeAdapter(prisma);

      const result = await adapter.updateProfile('user-1', { displayName: 'Bob' });

      expect(result).toEqual({
        id: 'user-1',
        email: 'alice@example.com',
        name: 'Alice',
        displayName: 'Bob',
        role: 'user',
      });
    });

    it('calls prisma.user.update with the correct where clause', async () => {
      const prisma = makePrisma();
      const adapter = makeAdapter(prisma);

      await adapter.updateProfile('user-42', { displayName: 'Charlie' });

      expect(prisma.user.update).toHaveBeenCalledOnce();
      const call = (prisma.user.update as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
      expect(call).toMatchObject({ where: { id: 'user-42' }, data: { displayName: 'Charlie' } });
    });

    it('returns null when P2025 Prisma error is thrown', async () => {
      const prisma = makePrisma();
      const p2025 = new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '0.0.0',
      });
      prisma.user.update = vi.fn().mockRejectedValue(p2025);
      const adapter = makeAdapter(prisma);

      const result = await adapter.updateProfile('missing-id', { displayName: 'X' });

      expect(result).toBeNull();
    });

    it('rethrows unexpected errors', async () => {
      const prisma = makePrisma();
      const boom = new Error('unexpected DB error');
      prisma.user.update = vi.fn().mockRejectedValue(boom);
      const adapter = makeAdapter(prisma);

      await expect(adapter.updateProfile('user-1', { displayName: 'X' })).rejects.toThrow(
        'unexpected DB error',
      );
    });
  });

  describe('revokeOtherSessions', () => {
    it('calls session.deleteMany with the correct filter', async () => {
      const prisma = makePrisma();
      const adapter = makeAdapter(prisma);

      await adapter.revokeOtherSessions('user-42', 'sess-current');

      expect(prisma.session.deleteMany).toHaveBeenCalledOnce();
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-42',
          NOT: { id: 'sess-current' },
        },
      });
    });

    it('passes userId and sessionId in the correct positions', async () => {
      const prisma = makePrisma();
      const adapter = makeAdapter(prisma);

      await adapter.revokeOtherSessions('user-99', 'sess-xyz');

      const call = (prisma.session.deleteMany as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
      expect(call.where.userId).toBe('user-99');
      expect(call.where.NOT.id).toBe('sess-xyz');
    });
  });

  describe('role normalisation', () => {
    it('maps USER → user', async () => {
      const adapter = makeAdapter(makePrisma(makeRow({ role: 'USER' })));
      const result = await adapter.findById('user-1');
      expect(result?.role).toBe('user');
    });

    it('maps ADMIN → admin', async () => {
      const adapter = makeAdapter(makePrisma(makeRow({ role: 'ADMIN' })));
      const result = await adapter.findById('user-1');
      expect(result?.role).toBe('admin');
    });

    it('maps GUEST → guest', async () => {
      const adapter = makeAdapter(makePrisma(makeRow({ role: 'GUEST' })));
      const result = await adapter.findById('user-1');
      expect(result?.role).toBe('guest');
    });

    it('falls back to user for unknown role', async () => {
      const adapter = makeAdapter(makePrisma(makeRow({ role: 'SUPERUSER' })));
      const result = await adapter.findById('user-1');
      expect(result?.role).toBe('user');
    });
  });
});
