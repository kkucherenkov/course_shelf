import { describe, expect, it, vi } from 'vitest';

import { GenerateQuizCommand } from './application/commands/generate-quiz.command';
import { GenerateLessonQuizController } from './generate-lesson-quiz.controller';

import type { CommandBus } from '@nestjs/cqrs';

function makeCommandBus(result: unknown): CommandBus {
  return { execute: vi.fn(async () => result) } as unknown as CommandBus;
}

describe('GenerateLessonQuizController', () => {
  it('dispatches GenerateQuizCommand scoped to the lesson, defaulting cleanup on', async () => {
    const commandBus = makeCommandBus({ courseId: 'c1', lessonsQueued: 1 });
    const controller = new GenerateLessonQuizController(commandBus);

    await controller.generate('lesson-1');

    const cmd = vi.mocked(commandBus.execute).mock.calls[0]![0] as GenerateQuizCommand;
    expect(cmd).toBeInstanceOf(GenerateQuizCommand);
    expect(cmd.lessonId).toBe('lesson-1');
    expect(cmd.courseId).toBeUndefined();
    expect(cmd.cleanupEnabled).toBe(true);
  });

  it('forwards modelId and an explicit cleanupEnabled: false', async () => {
    const commandBus = makeCommandBus({ courseId: 'c1', lessonsQueued: 1 });
    const controller = new GenerateLessonQuizController(commandBus);

    await controller.generate('lesson-1', {
      modelId: 'Qwen3.5-9B-Q4_K_M.gguf',
      cleanupEnabled: false,
    });

    const cmd = vi.mocked(commandBus.execute).mock.calls[0]![0] as GenerateQuizCommand;
    expect(cmd.modelFilename).toBe('Qwen3.5-9B-Q4_K_M.gguf');
    expect(cmd.cleanupEnabled).toBe(false);
  });

  it('returns the value resolved by the CommandBus', async () => {
    const accepted = { courseId: 'c1', lessonsQueued: 1 };
    const commandBus = makeCommandBus(accepted);
    const controller = new GenerateLessonQuizController(commandBus);

    const result = await controller.generate('lesson-1');

    expect(result).toBe(accepted);
  });
});
