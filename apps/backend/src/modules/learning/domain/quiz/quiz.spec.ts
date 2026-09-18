import { describe, expect, it } from 'vitest';

import { Quiz } from './quiz';
import { QuizNotPendingError } from './quiz.errors';

function make(): Quiz {
  return Quiz.create({
    id: 'quiz-1',
    lessonId: 'lesson-1',
    courseId: 'course-1',
    model: 'Qwen3.5-4B-Q4_K_M.gguf',
    questions: [
      {
        prompt: 'What is X?',
        options: ['A', 'B', 'C', 'D'],
        correctOptionIndex: 0,
        cueStartMs: 1000,
      },
    ],
    now: new Date('2026-09-16T00:00:00.000Z'),
  });
}

describe('Quiz', () => {
  it('create starts in proposed with no completedAt', () => {
    const quiz = make();
    expect(quiz.status).toBe('proposed');
    expect(quiz.completedAt).toBeUndefined();
  });

  it('markApplied transitions to applied and records completedAt', () => {
    const quiz = make();
    const at = new Date('2026-09-17T00:00:00.000Z');
    quiz.markApplied(at);
    expect(quiz.status).toBe('applied');
    expect(quiz.completedAt).toBe(at);
  });

  it('markDiscarded transitions to discarded', () => {
    const quiz = make();
    quiz.markDiscarded(new Date());
    expect(quiz.status).toBe('discarded');
  });

  it('throws QuizNotPendingError when applying twice', () => {
    const quiz = make();
    quiz.markApplied(new Date());
    expect(() => quiz.markApplied(new Date())).toThrow(QuizNotPendingError);
  });

  it('throws QuizNotPendingError when discarding an applied quiz', () => {
    const quiz = make();
    quiz.markApplied(new Date());
    expect(() => quiz.markDiscarded(new Date())).toThrow(QuizNotPendingError);
  });
});
