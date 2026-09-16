import type { AuthorizationActor } from '../../../../common/access/authorization.service';

export class DeleteFlashcardCommand {
  constructor(
    readonly id: string,
    readonly actor: AuthorizationActor,
  ) {}
}
