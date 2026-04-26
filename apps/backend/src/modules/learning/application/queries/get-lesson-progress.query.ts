export class GetLessonProgressQuery {
  constructor(
    readonly lessonId: string,
    readonly actor: { id: string; role: string },
  ) {}
}
