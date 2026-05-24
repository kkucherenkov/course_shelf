/** WHY this file exists: input for discarding a proposed identify task. */
export class DiscardIdentifyTaskCommand {
  constructor(public readonly taskId: string) {}
}
