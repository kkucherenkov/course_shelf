import type { AuthorizationActor } from '../../../../common/access/authorization.service';

export class UpdateBookmarkCommand {
  constructor(
    readonly id: string,
    readonly positionSeconds: number | undefined,
    readonly label: string | null | undefined,
    readonly actor: AuthorizationActor,
  ) {}
}
