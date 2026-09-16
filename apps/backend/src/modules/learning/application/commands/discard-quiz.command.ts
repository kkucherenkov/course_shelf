/** WHY this file exists: inputs for discarding a proposed Quiz (admin rejects the proposal). */
export class DiscardQuizCommand {
  constructor(public readonly quizId: string) {}
}
