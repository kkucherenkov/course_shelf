/**
 * WHY this file exists:
 * A Command is a plain data object — no methods, no dependencies. It is the
 * input contract between the controller and the command handler. The raw
 * values are validated by express-openapi-validator at the middleware layer
 * before reaching the controller, so no class-validator decorators are needed.
 */
import type { GrantLevel, GrantTarget } from '@app/api-client-ts';

export class RegisterGrantCommand {
  constructor(
    public readonly userId: string,
    public readonly target: GrantTarget,
    public readonly level: GrantLevel,
  ) {}
}
