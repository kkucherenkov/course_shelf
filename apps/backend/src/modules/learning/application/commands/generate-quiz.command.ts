/**
 * WHY this file exists:
 * Inputs for triggering a quiz-generation walk. Exactly one of
 * `lessonId`/`courseId` is set — the controller enforces which, one per
 * route (`POST /lessons/{id}/quizzes` vs `POST /courses/{id}/quizzes`), same
 * shape as `RunTranscriptionCommand`'s `libraryId | scope.courseId` split.
 * No library-wide form exists (E29-F02-S01 clarification #2).
 */
export class GenerateQuizCommand {
  constructor(
    public readonly lessonId: string | undefined,
    public readonly courseId: string | undefined,
    /** Model to use (weight filename or hosted model id), or undefined to take AppConfig's configured default. */
    public readonly model: string | undefined,
    /** Runs the ASR-cleanup pass before generation. Default true — see quiz-cleanup.ts. */
    public readonly cleanupEnabled: boolean,
  ) {}
}
