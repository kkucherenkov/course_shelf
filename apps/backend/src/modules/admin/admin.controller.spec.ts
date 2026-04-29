import { describe, it, expect, vi } from 'vitest';

import { AdminController } from './admin.controller';
import { GetAdminDashboardQuery } from './application/queries/get-admin-dashboard.query';
import { ListAdminScansQuery } from './application/queries/list-admin-scans.query';

import type { QueryBus } from '@nestjs/cqrs';

function makeQueryBus(): QueryBus {
  return {
    execute: vi.fn().mockResolvedValue(undefined),
  } as unknown as QueryBus;
}

function makeController(queryBus: QueryBus): AdminController {
  return new (AdminController as unknown as new (qb: QueryBus) => AdminController)(queryBus);
}

describe('AdminController', () => {
  describe('GET /admin/dashboard', () => {
    it('dispatches GetAdminDashboardQuery to the QueryBus', async () => {
      const queryBus = makeQueryBus();
      const controller = makeController(queryBus);

      await controller.getDashboard();

      expect(queryBus.execute).toHaveBeenCalledOnce();
      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(GetAdminDashboardQuery));
    });
  });

  describe('GET /admin/scans', () => {
    it('dispatches ListAdminScansQuery with parsed limit', async () => {
      const queryBus = makeQueryBus();
      const controller = makeController(queryBus);

      await controller.listScans('5');

      expect(queryBus.execute).toHaveBeenCalledOnce();
      const query = (queryBus.execute as ReturnType<typeof vi.fn>).mock
        .calls[0][0] as ListAdminScansQuery;
      expect(query).toBeInstanceOf(ListAdminScansQuery);
      expect(query.limit).toBe(5);
    });

    it('dispatches ListAdminScansQuery with undefined when no limit is provided', async () => {
      const queryBus = makeQueryBus();
      const controller = makeController(queryBus);

      await controller.listScans(undefined);

      const query = (queryBus.execute as ReturnType<typeof vi.fn>).mock
        .calls[0][0] as ListAdminScansQuery;
      expect(query).toBeInstanceOf(ListAdminScansQuery);
      expect(query.limit).toBeUndefined();
    });

    it('parses limit "20" as integer 20', async () => {
      const queryBus = makeQueryBus();
      const controller = makeController(queryBus);

      await controller.listScans('20');

      const query = (queryBus.execute as ReturnType<typeof vi.fn>).mock
        .calls[0][0] as ListAdminScansQuery;
      expect(query.limit).toBe(20);
    });

    it('returns the value resolved by the QueryBus', async () => {
      const expectedDto = { items: [] };
      const queryBus = {
        execute: vi.fn().mockResolvedValue(expectedDto),
      } as unknown as QueryBus;
      const controller = makeController(queryBus);

      const result = await controller.listScans('10');

      expect(result).toBe(expectedDto);
    });
  });
});
