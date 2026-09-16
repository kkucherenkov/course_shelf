import type { AuthorizationActor } from '../../../../common/access/authorization.service';

export class GradeFlashcardCommand {
  constructor(
    readonly id: string,
    readonly grade: number,
    readonly actor: AuthorizationActor,
  ) {}
}
