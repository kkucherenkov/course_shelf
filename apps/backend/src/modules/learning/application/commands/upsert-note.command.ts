export class UpsertNoteCommand {
  constructor(
    public readonly lessonId: string,
    public readonly body: string,
    public readonly actor: { id: string; role: string },
  ) {}
}
