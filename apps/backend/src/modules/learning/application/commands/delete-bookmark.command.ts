import type { AuthorizationActor } from '../../../../common/access/authorization.service';

export class DeleteBookmarkCommand {
  constructor(
    readonly id: string,
    readonly actor: AuthorizationActor,
  ) {}
}
