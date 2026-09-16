/**
 * WHY this file exists:
 * Audit events for the quiz flow, mirroring catalog's identify-task.events.ts
 * — plain classes, published via Nest's EventBus by the command handlers. No
 * subscriber ships yet; they exist so the publication points are wired and
 * stable for a future audit sink.
 */
export class QuizProposed {
  constructor(
    readonly quizId: string,
    readonly lessonId: string,
    readonly courseId: string,
    readonly modelFilename: string,
    readonly proposedAt: Date,
  ) {}
}

export class QuizApplied {
  constructor(
    readonly quizId: string,
    readonly lessonId: string,
    readonly actorId: string,
    readonly appliedAt: Date,
  ) {}
}
