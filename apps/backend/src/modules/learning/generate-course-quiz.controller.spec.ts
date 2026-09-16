import { describe, expect, it, vi } from 'vitest';

import { GenerateQuizCommand } from './application/commands/generate-quiz.command';
import { GenerateCourseQuizController } from './generate-course-quiz.controller';

import type { CommandBus } from '@nestjs/cqrs';

function makeCommandBus(result: unknown): CommandBus {
  return { execute: vi.fn(async () => result) } as unknown as CommandBus;
}

describe('GenerateCourseQuizController', () => {
  it('dispatches GenerateQuizCommand scoped to the course, defaulting cleanup on', async () => {
    const commandBus = makeCommandBus({ courseId: 'course-1', lessonsQueued: 12 });
    const controller = new GenerateCourseQuizController(commandBus);

    await controller.generate('course-1');

    const cmd = vi.mocked(commandBus.execute).mock.calls[0]![0] as GenerateQuizCommand;
    expect(cmd).toBeInstanceOf(GenerateQuizCommand);
    expect(cmd.courseId).toBe('course-1');
    expect(cmd.lessonId).toBeUndefined();
    expect(cmd.cleanupEnabled).toBe(true);
  });

  it('returns the value resolved by the CommandBus', async () => {
    const accepted = { courseId: 'course-1', lessonsQueued: 12 };
    const commandBus = makeCommandBus(accepted);
    const controller = new GenerateCourseQuizController(commandBus);

    const result = await controller.generate('course-1');

    expect(result).toBe(accepted);
  });
});
