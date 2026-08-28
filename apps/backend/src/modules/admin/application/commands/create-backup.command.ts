/**
 * `userId` is the admin who triggered the backup. It is embedded in the
 * download token's `sub` claim so a leaked link is attributable.
 */
export class CreateBackupCommand {
  constructor(readonly userId: string) {}
}
