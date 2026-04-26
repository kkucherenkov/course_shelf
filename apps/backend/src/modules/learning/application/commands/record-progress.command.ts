export class RecordProgressCommand {
  constructor(
    readonly lessonId: string,
    readonly positionSeconds: number,
    readonly durationSeconds: number,
    readonly clientUpdatedAt: Date,
    readonly actor: { id: string; role: string },
  ) {}
}
