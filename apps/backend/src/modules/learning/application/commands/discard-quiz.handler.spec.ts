import { describe, expect, it, vi } from 'vitest';

import { Quiz } from '../../domain/quiz/quiz';
import { QuizNotFoundError } from '../../domain/quiz/quiz.errors';
import { DiscardQuizCommand } from './discard-quiz.command';
import { DiscardQuizHandler } from './discard-quiz.handler';

import type { QuizRepository } from '../../domain/quiz/quiz.repository';

function makeQuiz(): Quiz {
  return Quiz.create({
    id: 'quiz-1',
    lessonId: 'lesson-1',
    courseId: 'course-1',
    modelFilename: 'Qwen3.5-4B-Q4_K_M.gguf',
    questions: [],
  });
}

function makeRepo(): QuizRepository {
  return { save: vi.fn(), findById: vi.fn(), findMany: vi.fn() };
}

describe('DiscardQuizHandler', () => {
  it('throws QuizNotFoundError when missing', async () => {
    const repo = makeRepo();
    vi.mocked(repo.findById).mockResolvedValue(null);
    const handler = new DiscardQuizHandler(repo);
    await expect(handler.execute(new DiscardQuizCommand('nope'))).rejects.toBeInstanceOf(
      QuizNotFoundError,
    );
  });

  it('marks the quiz discarded and saves', async () => {
    const repo = makeRepo();
    vi.mocked(repo.findById).mockResolvedValue(makeQuiz());
    const handler = new DiscardQuizHandler(repo);
    const dto = await handler.execute(new DiscardQuizCommand('quiz-1'));
    expect(dto.status).toBe('discarded');
    expect(repo.save).toHaveBeenCalledOnce();
  });
});
