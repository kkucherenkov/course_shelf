/**
 * WHY this file exists:
 * Inputs for applying a proposed Quiz. Unlike catalog's
 * ApplyIdentifyResultCommand, there is no downstream write — the Quiz row
 * itself is the real artifact once applied (E29-F02-S01: there is no
 * pre-existing "real quiz" concept to merge into, unlike Course metadata).
 * `actorId` only feeds the QuizApplied audit event.
 */
export class ApplyQuizCommand {
  constructor(
    public readonly quizId: string,
    public readonly actorId: string,
  ) {}
}
