/**
 * WHY this file exists:
 * A Command is a plain data object — no methods, no dependencies. It is the
 * input contract between the controller and the command handler. The raw
 * strings are validated by express-openapi-validator at the middleware layer
 * before reaching the controller, so no class-validator decorators are needed.
 */
export class RegisterLibraryCommand {
  constructor(
    public readonly name: string,
    public readonly rootPath: string,
  ) {}
}
