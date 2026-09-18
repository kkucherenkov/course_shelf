import { EventBus } from '@nestjs/cqrs';
import { describe, expect, it, vi } from 'vitest';

import { Quiz } from '../../domain/quiz/quiz';
import { QuizNotFoundError } from '../../domain/quiz/quiz.errors';
import { ApplyQuizCommand } from './apply-quiz.command';
import { ApplyQuizHandler } from './apply-quiz.handler';

import type { QuizRepository } from '../../domain/quiz/quiz.repository';

function makeQuiz(): Quiz {
  return Quiz.create({
    id: 'quiz-1',
    lessonId: 'lesson-1',
    courseId: 'course-1',
    model: 'Qwen3.5-4B-Q4_K_M.gguf',
    questions: [],
  });
}

function makeDeps() {
  const repo = { save: vi.fn(), findById: vi.fn(), findMany: vi.fn() } as QuizRepository;
  const eventBus = { publish: vi.fn() } as unknown as EventBus;
  return { repo, eventBus };
}

describe('ApplyQuizHandler', () => {
  it('throws QuizNotFoundError when missing', async () => {
    const { repo, eventBus } = makeDeps();
    vi.mocked(repo.findById).mockResolvedValue(null);
    const handler = new ApplyQuizHandler(repo, eventBus);
    await expect(handler.execute(new ApplyQuizCommand('nope', 'user-1'))).rejects.toBeInstanceOf(
      QuizNotFoundError,
    );
  });

  it('marks the quiz applied, saves, and publishes QuizApplied', async () => {
    const { repo, eventBus } = makeDeps();
    vi.mocked(repo.findById).mockResolvedValue(makeQuiz());
    const handler = new ApplyQuizHandler(repo, eventBus);
    const dto = await handler.execute(new ApplyQuizCommand('quiz-1', 'user-1'));
    expect(dto.status).toBe('applied');
    expect(repo.save).toHaveBeenCalledOnce();
    expect(eventBus.publish).toHaveBeenCalledOnce();
  });
});
