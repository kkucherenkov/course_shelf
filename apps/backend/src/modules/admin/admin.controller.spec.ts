import { describe, it, expect, vi } from 'vitest';

import { AdminController } from './admin.controller';
import { GetAdminDashboardQuery } from './application/queries/get-admin-dashboard.query';
import { GetAdminUserQuery } from './application/queries/get-admin-user.query';
import { ListAdminLibrariesQuery } from './application/queries/list-admin-libraries.query';
import { ListAdminScansQuery } from './application/queries/list-admin-scans.query';
import { ListAdminUsersQuery } from './application/queries/list-admin-users.query';
import { CreateBackupCommand } from './application/commands/create-backup.command';
import { UpdateAdminUserCommand } from './application/commands/update-admin-user.command';

import type { SessionContext } from '../../common/auth/decorators';
import type { CommandBus, QueryBus } from '@nestjs/cqrs';

function makeQueryBus(): QueryBus {
  return {
    execute: vi.fn().mockResolvedValue(undefined),
  } as unknown as QueryBus;
}

function makeCommandBus(): CommandBus {
  return {
    execute: vi.fn().mockResolvedValue(undefined),
  } as unknown as CommandBus;
}

function makeController(queryBus: QueryBus, commandBus?: CommandBus): AdminController {
  return new (AdminController as unknown as new (qb: QueryBus, cb: CommandBus) => AdminController)(
    queryBus,
    commandBus ?? makeCommandBus(),
  );
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
        .calls[0]?.[0] as ListAdminScansQuery;
      expect(query).toBeInstanceOf(ListAdminScansQuery);
      expect(query.limit).toBe(5);
    });

    it('dispatches ListAdminScansQuery with undefined when no limit is provided', async () => {
      const queryBus = makeQueryBus();
      const controller = makeController(queryBus);

      await controller.listScans(undefined);

      const query = (queryBus.execute as ReturnType<typeof vi.fn>).mock
        .calls[0]?.[0] as ListAdminScansQuery;
      expect(query).toBeInstanceOf(ListAdminScansQuery);
      expect(query.limit).toBeUndefined();
    });

    it('parses limit "20" as integer 20', async () => {
      const queryBus = makeQueryBus();
      const controller = makeController(queryBus);

      await controller.listScans('20');

      const query = (queryBus.execute as ReturnType<typeof vi.fn>).mock
        .calls[0]?.[0] as ListAdminScansQuery;
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

    it('threads libraryId into ListAdminScansQuery', async () => {
      const queryBus = makeQueryBus();
      const controller = makeController(queryBus);

      await controller.listScans('10', 'lib-99');

      const query = (queryBus.execute as ReturnType<typeof vi.fn>).mock
        .calls[0]?.[0] as ListAdminScansQuery;
      expect(query).toBeInstanceOf(ListAdminScansQuery);
      expect(query.libraryId).toBe('lib-99');
    });

    it('passes undefined libraryId when not provided', async () => {
      const queryBus = makeQueryBus();
      const controller = makeController(queryBus);

      await controller.listScans('10', undefined);

      const query = (queryBus.execute as ReturnType<typeof vi.fn>).mock
        .calls[0]?.[0] as ListAdminScansQuery;
      expect(query.libraryId).toBeUndefined();
    });
  });

  describe('GET /admin/libraries', () => {
    it('dispatches ListAdminLibrariesQuery to the QueryBus', async () => {
      const queryBus = makeQueryBus();
      const controller = makeController(queryBus);

      await controller.listLibraries();

      expect(queryBus.execute).toHaveBeenCalledOnce();
      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(ListAdminLibrariesQuery));
    });

    it('returns the value resolved by the QueryBus', async () => {
      const expectedDto = { items: [] };
      const queryBus = {
        execute: vi.fn().mockResolvedValue(expectedDto),
      } as unknown as QueryBus;
      const controller = makeController(queryBus);

      const result = await controller.listLibraries();

      expect(result).toBe(expectedDto);
    });
  });

  describe('GET /admin/users', () => {
    it('dispatches ListAdminUsersQuery with parsed limit and search', async () => {
      const queryBus = makeQueryBus();
      const controller = makeController(queryBus);

      await controller.listUsers('alice', '25');

      expect(queryBus.execute).toHaveBeenCalledOnce();
      const query = (queryBus.execute as ReturnType<typeof vi.fn>).mock
        .calls[0]?.[0] as ListAdminUsersQuery;
      expect(query).toBeInstanceOf(ListAdminUsersQuery);
      expect(query.search).toBe('alice');
      expect(query.limit).toBe(25);
    });

    it('dispatches with undefined search and limit when not provided', async () => {
      const queryBus = makeQueryBus();
      const controller = makeController(queryBus);

      await controller.listUsers(undefined, undefined);

      const query = (queryBus.execute as ReturnType<typeof vi.fn>).mock
        .calls[0]?.[0] as ListAdminUsersQuery;
      expect(query).toBeInstanceOf(ListAdminUsersQuery);
      expect(query.search).toBeUndefined();
      expect(query.limit).toBeUndefined();
    });

    it('returns the value resolved by the QueryBus', async () => {
      const expectedDto = { items: [] };
      const queryBus = {
        execute: vi.fn().mockResolvedValue(expectedDto),
      } as unknown as QueryBus;
      const controller = makeController(queryBus);

      const result = await controller.listUsers(undefined, '10');

      expect(result).toBe(expectedDto);
    });
  });

  describe('GET /admin/users/:id', () => {
    it('dispatches GetAdminUserQuery with the route id', async () => {
      const queryBus = makeQueryBus();
      const controller = makeController(queryBus);

      await controller.getUser('user-42');

      expect(queryBus.execute).toHaveBeenCalledOnce();
      const query = (queryBus.execute as ReturnType<typeof vi.fn>).mock
        .calls[0]?.[0] as GetAdminUserQuery;
      expect(query).toBeInstanceOf(GetAdminUserQuery);
      expect(query.id).toBe('user-42');
    });

    it('returns the value resolved by the QueryBus', async () => {
      const item = {
        id: 'user-42',
        email: 'alice@example.com',
        name: 'Alice',
        displayName: null,
        role: 'admin',
        banned: false,
        createdAt: '2026-04-27T09:55:00.000Z',
        updatedAt: '2026-04-28T10:00:00.000Z',
      };
      const queryBus = {
        execute: vi.fn().mockResolvedValue(item),
      } as unknown as QueryBus;
      const controller = makeController(queryBus);

      const result = await controller.getUser('user-42');

      expect(result).toBe(item);
    });
  });

  describe('PATCH /admin/users/:id', () => {
    it('dispatches UpdateAdminUserCommand with id and body', async () => {
      const commandBus = makeCommandBus();
      const controller = makeController(makeQueryBus(), commandBus);

      await controller.updateUser('user-42', { role: 'admin' });

      expect(commandBus.execute).toHaveBeenCalledOnce();
      const command = (commandBus.execute as ReturnType<typeof vi.fn>).mock
        .calls[0]?.[0] as UpdateAdminUserCommand;
      expect(command).toBeInstanceOf(UpdateAdminUserCommand);
      expect(command.id).toBe('user-42');
      expect(command.patch).toEqual({ role: 'admin' });
    });

    it('threads banned=true into the command', async () => {
      const commandBus = makeCommandBus();
      const controller = makeController(makeQueryBus(), commandBus);

      await controller.updateUser('user-5', { banned: true });

      const command = (commandBus.execute as ReturnType<typeof vi.fn>).mock
        .calls[0]?.[0] as UpdateAdminUserCommand;
      expect(command.patch).toEqual({ banned: true });
    });

    it('returns the value resolved by the CommandBus', async () => {
      const updatedItem = {
        id: 'user-42',
        email: 'alice@example.com',
        name: 'Alice',
        displayName: null,
        role: 'admin',
        banned: false,
        createdAt: '2026-04-27T09:55:00.000Z',
        updatedAt: '2026-04-28T10:00:00.000Z',
      };
      const commandBus = {
        execute: vi.fn().mockResolvedValue(updatedItem),
      } as unknown as CommandBus;
      const controller = makeController(makeQueryBus(), commandBus);

      const result = await controller.updateUser('user-42', { role: 'admin' });

      expect(result).toBe(updatedItem);
    });
  });

  describe('POST /admin/backups', () => {
    it('dispatches CreateBackupCommand carrying the calling admin id', async () => {
      const commandBus = makeCommandBus();
      const controller = makeController(makeQueryBus(), commandBus);

      await controller.createBackup({
        user: { id: 'usr_admin_1' },
      } as unknown as SessionContext);

      expect(commandBus.execute).toHaveBeenCalledOnce();
      const command = vi.mocked(commandBus.execute).mock.calls[0]?.[0] as CreateBackupCommand;
      expect(command).toBeInstanceOf(CreateBackupCommand);
      // The id ends up in the token's `sub` claim, so a leaked link is
      // attributable to whoever minted it.
      expect(command.userId).toBe('usr_admin_1');
    });

    it('returns the DTO resolved by the CommandBus', async () => {
      const dto = {
        id: '20260829T014500-3f9a2c1b8e7d4a6f',
        createdAt: '2026-08-29T01:45:00.000Z',
        sizeBytes: 4_718_592,
        url: '/api/v1/admin/backups/20260829T014500-3f9a2c1b8e7d4a6f/download?token=t',
        token: 't',
        expiresAt: '2026-08-29T01:50:00.000Z',
      };
      const commandBus = {
        execute: vi.fn().mockResolvedValue(dto),
      } as unknown as CommandBus;
      const controller = makeController(makeQueryBus(), commandBus);

      const result = await controller.createBackup({
        user: { id: 'usr_admin_1' },
      } as unknown as SessionContext);

      expect(result).toBe(dto);
    });
  });
});
