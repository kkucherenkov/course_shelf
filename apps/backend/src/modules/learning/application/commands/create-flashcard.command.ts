import type { AuthorizationActor } from '../../../../common/access/authorization.service';

export class CreateFlashcardCommand {
  constructor(
    readonly lessonId: string,
    readonly front: string,
    readonly back: string,
    readonly sourceCueId: string | undefined,
    readonly actor: AuthorizationActor,
  ) {}
}
