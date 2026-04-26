export class RecordProgressBatchCommand {
  constructor(
    public readonly items: readonly {
      lessonId: string;
      positionSeconds: number;
      durationSeconds: number;
      clientUpdatedAt: Date;
    }[],
    public readonly actor: { id: string; role: string },
  ) {}
}
