import { describe, expect, it } from 'vitest';

import { quizRowToDomain } from './prisma-quiz.repository';

describe('quizRowToDomain', () => {
  it('reconstitutes an aggregate from a row, preserving jsonb questions', () => {
    const quiz = quizRowToDomain({
      id: 'quiz-1',
      lessonId: 'lesson-1',
      courseId: 'course-1',
      status: 'proposed',
      modelFilename: 'Qwen3.5-4B-Q4_K_M.gguf',
      questions: [
        { prompt: 'What?', options: ['A', 'B'], correctOptionIndex: 0, cueStartMs: 1000 },
      ],
      createdAt: new Date('2026-09-16T00:00:00.000Z'),
      completedAt: null,
    });

    expect(quiz.id).toBe('quiz-1');
    expect(quiz.status).toBe('proposed');
    expect(quiz.modelFilename).toBe('Qwen3.5-4B-Q4_K_M.gguf');
    expect(quiz.questions).toHaveLength(1);
    expect(quiz.questions[0]?.prompt).toBe('What?');
    expect(quiz.completedAt).toBeUndefined();
  });

  it('maps a non-null completedAt through', () => {
    const quiz = quizRowToDomain({
      id: 'quiz-2',
      lessonId: 'lesson-1',
      courseId: 'course-1',
      status: 'applied',
      modelFilename: 'Qwen3.5-4B-Q4_K_M.gguf',
      questions: [],
      createdAt: new Date('2026-09-16T00:00:00.000Z'),
      completedAt: new Date('2026-09-17T00:00:00.000Z'),
    });

    expect(quiz.completedAt).toEqual(new Date('2026-09-17T00:00:00.000Z'));
  });
});
