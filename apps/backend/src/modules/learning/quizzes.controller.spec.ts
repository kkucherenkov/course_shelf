import { describe, expect, it, vi } from 'vitest';

import { ApplyQuizCommand } from './application/commands/apply-quiz.command';
import { DiscardQuizCommand } from './application/commands/discard-quiz.command';
import { GetQuizQuery } from './application/queries/get-quiz.query';
import { ListQuizzesQuery } from './application/queries/list-quizzes.query';
import { QuizzesController } from './quizzes.controller';

import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import type { SessionContext } from '../../common/auth/decorators';

const SESSION = { user: { id: 'admin-1', role: 'admin' } } as unknown as SessionContext;

function buses(result: unknown) {
  const commandBus = { execute: vi.fn(async () => result) } as unknown as CommandBus;
  const queryBus = { execute: vi.fn(async () => result) } as unknown as QueryBus;
  return { commandBus, queryBus };
}

describe('QuizzesController', () => {
  it('GET quizzes forwards status/lessonId/courseId filters', async () => {
    const { commandBus, queryBus } = buses({ quizzes: [] });
    const controller = new QuizzesController(commandBus, queryBus);

    await controller.list('proposed', 'lesson-1', 'course-1');

    const query = vi.mocked(queryBus.execute).mock.calls[0]![0] as ListQuizzesQuery;
    expect(query).toBeInstanceOf(ListQuizzesQuery);
    expect(query.status).toBe('proposed');
    expect(query.lessonId).toBe('lesson-1');
    expect(query.courseId).toBe('course-1');
  });

  it('GET quizzes/:id dispatches GetQuizQuery with the route id', async () => {
    const { commandBus, queryBus } = buses({ id: 'quiz-1' });
    const controller = new QuizzesController(commandBus, queryBus);

    await controller.get('quiz-1');

    const query = vi.mocked(queryBus.execute).mock.calls[0]![0] as GetQuizQuery;
    expect(query).toBeInstanceOf(GetQuizQuery);
    expect(query.id).toBe('quiz-1');
  });

  it('POST quizzes/:id/apply forwards the session actor id', async () => {
    const { commandBus, queryBus } = buses({ id: 'quiz-1', status: 'applied' });
    const controller = new QuizzesController(commandBus, queryBus);

    await controller.apply('quiz-1', SESSION);

    const cmd = vi.mocked(commandBus.execute).mock.calls[0]![0] as ApplyQuizCommand;
    expect(cmd).toBeInstanceOf(ApplyQuizCommand);
    expect(cmd.quizId).toBe('quiz-1');
    expect(cmd.actorId).toBe('admin-1');
  });

  it('POST quizzes/:id/discard dispatches DiscardQuizCommand', async () => {
    const { commandBus, queryBus } = buses({ id: 'quiz-1', status: 'discarded' });
    const controller = new QuizzesController(commandBus, queryBus);

    await controller.discard('quiz-1');

    expect(commandBus.execute).toHaveBeenCalledWith(expect.any(DiscardQuizCommand));
  });
});
