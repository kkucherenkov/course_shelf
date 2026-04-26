export class DeleteNoteCommand {
  constructor(
    public readonly lessonId: string,
    public readonly actor: { id: string; role: string },
  ) {}
}
