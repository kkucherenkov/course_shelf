/**
 * WHY this file exists:
 * Command carrying the id of the grant to revoke. Plain data object; no methods.
 */
export class RevokeGrantCommand {
  constructor(public readonly id: string) {}
}
