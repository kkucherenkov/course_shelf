import { describe, it, expect, vi } from 'vitest';

import { PrismaDashboardAdapter } from './prisma-dashboard.adapter';

import type { PrismaService } from '../../../common/prisma/prisma.service';

function makePrisma(overrides: Partial<PrismaService['user']> = {}): PrismaService {
  return {
    user: {
      count: vi.fn(),
      ...overrides,
    },
  } as unknown as PrismaService;
}

describe('PrismaDashboardAdapter.hasAnyUser', () => {
  it('returns false when count is 0', async () => {
    const prisma = makePrisma({ count: vi.fn().mockResolvedValue(0) });
    const adapter = new PrismaDashboardAdapter(prisma);

    const result = await adapter.hasAnyUser();

    expect(result).toBe(false);
    expect(prisma.user.count).toHaveBeenCalledWith({ take: 1 });
  });

  it('returns true when count is 1', async () => {
    const prisma = makePrisma({ count: vi.fn().mockResolvedValue(1) });
    const adapter = new PrismaDashboardAdapter(prisma);

    const result = await adapter.hasAnyUser();

    expect(result).toBe(true);
    expect(prisma.user.count).toHaveBeenCalledWith({ take: 1 });
  });
});
