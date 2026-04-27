import { describe, it, expect, vi } from 'vitest';

import { AdminPublicController } from './admin-public.controller';

import type { DashboardPort } from './domain/dashboard.port';

function makePort(hasAnyUserResult: boolean): DashboardPort {
  return {
    getSnapshot: vi.fn(),
    hasAnyUser: vi.fn().mockResolvedValue(hasAnyUserResult),
  };
}

function makeController(port: DashboardPort): AdminPublicController {
  // Bypass NestJS DI — inject port directly using the constructor parameter.
  // The @Inject decorator is metadata-only and does not affect JS runtime.
  return new (AdminPublicController as unknown as new (p: DashboardPort) => AdminPublicController)(
    port,
  );
}

describe('AdminPublicController', () => {
  it('returns { hasUsers: false } when port reports no users', async () => {
    const port = makePort(false);
    const controller = makeController(port);

    const result = await controller.hasUsers();

    expect(result).toEqual({ hasUsers: false });
    expect(port.hasAnyUser).toHaveBeenCalledOnce();
  });

  it('returns { hasUsers: true } when port reports at least one user', async () => {
    const port = makePort(true);
    const controller = makeController(port);

    const result = await controller.hasUsers();

    expect(result).toEqual({ hasUsers: true });
    expect(port.hasAnyUser).toHaveBeenCalledOnce();
  });
});
