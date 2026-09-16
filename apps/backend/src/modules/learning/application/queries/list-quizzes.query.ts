import type { QuizStatus } from '../../domain/quiz/quiz';

export class ListQuizzesQuery {
  constructor(
    public readonly status?: QuizStatus,
    public readonly lessonId?: string,
    public readonly courseId?: string,
  ) {}
}
