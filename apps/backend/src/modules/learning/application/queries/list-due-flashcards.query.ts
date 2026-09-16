import type { AuthorizationActor } from '../../../../common/access/authorization.service';

export class ListDueFlashcardsQuery {
  constructor(
    readonly actor: AuthorizationActor,
    readonly limit: number,
  ) {}
}
