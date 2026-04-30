export class SignOutOthersCommand {
  constructor(
    readonly userId: string,
    readonly currentSessionId: string,
  ) {}
}
