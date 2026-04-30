export class UpdateMeCommand {
  constructor(
    readonly userId: string,
    readonly patch: { displayName?: string | null },
  ) {}
}
