export class GetNoteQuery {
  constructor(
    public readonly lessonId: string,
    public readonly actor: { id: string; role: string },
  ) {}
}
