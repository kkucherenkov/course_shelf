import { describe, expect, it, vi } from 'vitest';

import { Quiz } from '../../domain/quiz/quiz';
import { QuizNotFoundError } from '../../domain/quiz/quiz.errors';
import { GetQuizHandler } from './get-quiz.handler';
import { GetQuizQuery } from './get-quiz.query';
import { ListQuizzesHandler } from './list-quizzes.handler';
import { ListQuizzesQuery } from './list-quizzes.query';

import type { QuizRepository } from '../../domain/quiz/quiz.repository';

function makeQuiz(id = 'quiz-1'): Quiz {
  return Quiz.create({
    id,
    lessonId: 'lesson-1',
    courseId: 'course-1',
    model: 'Qwen3.5-4B-Q4_K_M.gguf',
    questions: [],
  });
}

function makeRepo(): QuizRepository {
  return { save: vi.fn(), findById: vi.fn(), findMany: vi.fn() };
}

describe('quiz queries', () => {
  it('list maps repo results to a list DTO and forwards filters', async () => {
    const repo = makeRepo();
    vi.mocked(repo.findMany).mockResolvedValue([makeQuiz()]);
    const handler = new ListQuizzesHandler(repo);
    const dto = await handler.execute(new ListQuizzesQuery('proposed', 'lesson-1', 'course-1'));
    expect(repo.findMany).toHaveBeenCalledWith({
      status: 'proposed',
      lessonId: 'lesson-1',
      courseId: 'course-1',
    });
    expect(dto.quizzes).toHaveLength(1);
    expect(dto.quizzes[0]!.id).toBe('quiz-1');
  });

  it('get returns the DTO when found', async () => {
    const repo = makeRepo();
    vi.mocked(repo.findById).mockResolvedValue(makeQuiz('quiz-9'));
    const handler = new GetQuizHandler(repo);
    const dto = await handler.execute(new GetQuizQuery('quiz-9'));
    expect(dto.id).toBe('quiz-9');
  });

  it('get throws QuizNotFoundError when missing', async () => {
    const repo = makeRepo();
    vi.mocked(repo.findById).mockResolvedValue(null);
    const handler = new GetQuizHandler(repo);
    await expect(handler.execute(new GetQuizQuery('nope'))).rejects.toBeInstanceOf(
      QuizNotFoundError,
    );
  });
});
