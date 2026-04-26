import type { AuthorizationActor } from '../../../../common/access/authorization.service';

export class ListBookmarksQuery {
  constructor(
    readonly lessonId: string,
    readonly actor: AuthorizationActor,
  ) {}
}
