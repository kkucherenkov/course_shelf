import type { AuthorizationActor } from '../../../../common/access/authorization.service';

export class CreateBookmarkCommand {
  constructor(
    readonly lessonId: string,
    readonly positionSeconds: number,
    readonly label: string | undefined,
    readonly actor: AuthorizationActor,
  ) {}
}
