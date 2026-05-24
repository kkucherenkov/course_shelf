import { describe, expect, it, vi } from 'vitest';

import { IdentifyAdminController } from './identify-admin.controller';
import { RunIdentifyTaskCommand } from './application/commands/run-identify-task.command';
import { ApplyIdentifyResultCommand } from './application/commands/apply-identify-result.command';
import { DiscardIdentifyTaskCommand } from './application/commands/discard-identify-task.command';
import { ListIdentifyTasksQuery } from './application/queries/list-identify-tasks.query';
import { GetIdentifyTaskQuery } from './application/queries/get-identify-task.query';

import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import type { SessionContext } from '../../common/auth/decorators';

const SESSION = { user: { id: 'admin-1', role: 'admin' } } as unknown as SessionContext;

function buses(result: unknown) {
  const commandBus = { execute: vi.fn(async () => result) } as unknown as CommandBus;
  const queryBus = { execute: vi.fn(async () => result) } as unknown as QueryBus;
  return { commandBus, queryBus };
}

describe('IdentifyAdminController', () => {
  it('POST courses/:id/identify dispatches RunIdentifyTaskCommand with the default merge policy', async () => {
    const { commandBus, queryBus } = buses({ id: 't1' });
    const controller = new IdentifyAdminController(commandBus, queryBus);
    await controller.runIdentify('c1', { fragment: { title: 'X' }, source: 'youtube' });
    const cmd = vi.mocked(commandBus.execute).mock.calls[0]![0] as RunIdentifyTaskCommand;
    expect(cmd).toBeInstanceOf(RunIdentifyTaskCommand);
    expect(cmd.courseId).toBe('c1');
    expect(cmd.mergePolicy.title).toBe('merge'); // default applied
  });

  it('POST identify-tasks/:id/apply forwards actor + optional policy', async () => {
    const { commandBus, queryBus } = buses({ id: 't1' });
    const controller = new IdentifyAdminController(commandBus, queryBus);
    await controller.applyIdentify('t1', { mergePolicy: { title: 'overwrite' } }, SESSION);
    const cmd = vi.mocked(commandBus.execute).mock.calls[0]![0] as ApplyIdentifyResultCommand;
    expect(cmd).toBeInstanceOf(ApplyIdentifyResultCommand);
    expect(cmd.actor.id).toBe('admin-1');
    expect(cmd.mergePolicy?.title).toBe('overwrite');
  });

  it('POST identify-tasks/:id/discard dispatches DiscardIdentifyTaskCommand', async () => {
    const { commandBus, queryBus } = buses({ id: 't1' });
    const controller = new IdentifyAdminController(commandBus, queryBus);
    await controller.discardIdentify('t1');
    expect(commandBus.execute).toHaveBeenCalledWith(expect.any(DiscardIdentifyTaskCommand));
  });

  it('GET identify-tasks forwards status + courseId filters', async () => {
    const { commandBus, queryBus } = buses({ tasks: [] });
    const controller = new IdentifyAdminController(commandBus, queryBus);
    await controller.listIdentify('proposed', 'c1');
    const q = vi.mocked(queryBus.execute).mock.calls[0]![0] as ListIdentifyTasksQuery;
    expect(q).toBeInstanceOf(ListIdentifyTasksQuery);
    expect(q.status).toBe('proposed');
    expect(q.courseId).toBe('c1');
  });

  it('GET identify-tasks/:id dispatches GetIdentifyTaskQuery', async () => {
    const { commandBus, queryBus } = buses({ id: 't1' });
    const controller = new IdentifyAdminController(commandBus, queryBus);
    await controller.getIdentify('t1');
    expect(queryBus.execute).toHaveBeenCalledWith(expect.any(GetIdentifyTaskQuery));
  });
});
