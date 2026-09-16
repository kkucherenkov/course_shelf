import type { AuthorizationActor } from '../../../../common/access/authorization.service';

export class ListLessonFlashcardsQuery {
  constructor(
    readonly lessonId: string,
    readonly actor: AuthorizationActor,
  ) {}
}
