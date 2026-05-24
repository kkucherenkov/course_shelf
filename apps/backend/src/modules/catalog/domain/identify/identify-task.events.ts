/**
 * WHY this file exists:
 * Audit domain events for the identify flow. Plain classes (no decorator) —
 * published via Nest's EventBus by the command handlers. No subscriber ships in
 * Stage 4; a concrete audit sink is a future follow-up. They exist now so the
 * publication points are wired and stable.
 */
export class IdentifyTaskProposed {
  constructor(
    readonly taskId: string,
    readonly courseId: string,
    readonly source: string,
    readonly proposedAt: Date,
  ) {}
}

export class IdentifyTaskApplied {
  constructor(
    readonly taskId: string,
    readonly courseId: string,
    readonly actorId: string,
    readonly appliedAt: Date,
  ) {}
}
