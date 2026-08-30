/**
 * WHY this file exists:
 * Carries the input data for CancelTranscriptionHandler. Immutable value object.
 */
export class CancelTranscriptionCommand {
  constructor(readonly transcriptionId: string) {}
}
