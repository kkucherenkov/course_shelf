import type { AuthorizationActor } from '../../../../common/access/authorization.service';

export class UpdateFlashcardCommand {
  constructor(
    readonly id: string,
    readonly front: string | undefined,
    readonly back: string | undefined,
    readonly actor: AuthorizationActor,
  ) {}
}
